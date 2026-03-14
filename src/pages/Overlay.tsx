import { useEffect, useState, useRef, useCallback } from "react";
import { supabase } from "../lib/supabase";
import { getVideoUrl, markSubmissionPlayed } from "../api";
import type { LiveSubmission } from "../types";

interface SubmissionWithAvatar extends LiveSubmission {
  avatar_url?: string;
}

async function fetchAvatar(username: string): Promise<string> {
  const { data } = await supabase
    .from("profiles")
    .select("avatar_url")
    .eq("username", username)
    .single();
  return data?.avatar_url || "";
}

// Declare global YT type
declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: (() => void) | undefined;
  }
}

export default function Overlay() {
  const [queue, setQueue] = useState<SubmissionWithAvatar[]>([]);
  const [current, setCurrent] = useState<SubmissionWithAvatar | null>(null);
  const [visible, setVisible] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const ytPlayerRef = useRef<any>(null);
  const ytContainerRef = useRef<HTMLDivElement>(null);
  const processing = useRef(false);
  const ytTimerRef = useRef<ReturnType<typeof setTimeout>>();

  // Set body to transparent mode for OBS
  useEffect(() => {
    document.body.classList.add("overlay-mode");
    return () => document.body.classList.remove("overlay-mode");
  }, []);

  // Load YouTube IFrame API
  useEffect(() => {
    if (document.getElementById("yt-iframe-api")) return;
    const tag = document.createElement("script");
    tag.id = "yt-iframe-api";
    tag.src = "https://www.youtube.com/iframe_api";
    document.head.appendChild(tag);
  }, []);

  // Subscribe to new submissions via Supabase Realtime
  useEffect(() => {
    supabase
      .from("live_submissions")
      .select("*")
      .eq("played", false)
      .order("created_at", { ascending: true })
      .then(async ({ data }) => {
        if (data && data.length > 0) {
          const withAvatars = await Promise.all(
            (data as LiveSubmission[]).map(async (s) => ({
              ...s,
              avatar_url: await fetchAvatar(s.username),
            })),
          );
          setQueue(withAvatars);
        }
      });

    const channel = supabase
      .channel("live-submissions-realtime")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "live_submissions",
        },
        async (payload) => {
          const sub = payload.new as LiveSubmission;
          const avatar_url = await fetchAvatar(sub.username);
          setQueue((prev) => [...prev, { ...sub, avatar_url }]);
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const finishCurrent = useCallback(() => {
    setVisible(false);
    setTimeout(() => {
      if (current) {
        markSubmissionPlayed(current.id).catch(() => {});
      }
      if (ytPlayerRef.current) {
        try {
          ytPlayerRef.current.destroy();
        } catch {}
        ytPlayerRef.current = null;
      }
      clearTimeout(ytTimerRef.current);
      setCurrent(null);
      processing.current = false;
    }, 500);
  }, [current]);

  // Process queue
  useEffect(() => {
    if (processing.current || current || queue.length === 0) return;
    processing.current = true;

    const next = queue[0];
    setQueue((prev) => prev.slice(1));
    setCurrent(next);

    setTimeout(() => setVisible(true), 100);
  }, [queue, current]);

  // Play uploaded video
  useEffect(() => {
    if (current?.video_type === "upload" && videoRef.current && visible) {
      videoRef.current.play().catch(() => {});
    }
  }, [current, visible]);

  // Play YouTube video
  useEffect(() => {
    if (!current || current.video_type !== "youtube" || !visible) return;
    if (!current.youtube_id || !ytContainerRef.current) return;

    const initPlayer = () => {
      if (!window.YT?.Player) {
        setTimeout(initPlayer, 200);
        return;
      }

      // Clear previous player
      if (ytPlayerRef.current) {
        try {
          ytPlayerRef.current.destroy();
        } catch {}
      }

      ytPlayerRef.current = new window.YT.Player(ytContainerRef.current, {
        videoId: current.youtube_id,
        playerVars: {
          autoplay: 1,
          controls: 0,
          disablekb: 1,
          fs: 0,
          modestbranding: 1,
          rel: 0,
          showinfo: 0,
          start: current.start_seconds,
          end: current.end_seconds,
        },
        events: {
          onStateChange: (event: any) => {
            // YT.PlayerState.ENDED === 0
            if (event.data === 0) {
              finishCurrent();
            }
          },
        },
      });

      // Safety timeout in case onStateChange doesn't fire
      const duration = (current.end_seconds - current.start_seconds + 2) * 1000;
      ytTimerRef.current = setTimeout(finishCurrent, duration);
    };

    initPlayer();

    return () => {
      clearTimeout(ytTimerRef.current);
    };
  }, [current, visible, finishCurrent]);

  if (!current) {
    return <div className="w-screen h-screen bg-transparent" />;
  }

  return (
    <div className="w-screen h-screen bg-transparent flex items-center justify-center overflow-hidden">
      <div
        className={`transition-all duration-500 ease-out ${
          visible
            ? "opacity-100 scale-100 translate-y-0"
            : "opacity-0 scale-95 translate-y-4"
        }`}
      >
        <div
          className={`relative rounded-2xl overflow-hidden shadow-2xl shadow-black/50 bg-gray-950 border border-gray-800/60 ${
            current.is_vertical
              ? "w-[280px] max-h-[90vh]"
              : "max-w-[700px] w-[90vw]"
          }`}
        >
          {/* Video content */}
          {current.video_type === "upload" ? (
            <video
              ref={videoRef}
              src={getVideoUrl(current.video_path)}
              onEnded={finishCurrent}
              className="w-full max-h-[450px] object-contain bg-black"
              autoPlay
              playsInline
            />
          ) : (
            <div
              className={`w-full bg-black ${
                current.is_vertical ? "aspect-[9/16]" : "aspect-video"
              }`}
            >
              <div ref={ytContainerRef} className="w-full h-full" />
            </div>
          )}

          {/* Message bar */}
          {current.message && (
            <div
              className={`bg-gray-900/95 border-t border-gray-800/60 ${
                current.is_vertical ? "px-4 py-3" : "px-6 py-5"
              }`}
            >
              <div
                className={
                  current.is_vertical
                    ? "flex flex-col items-center text-center gap-2"
                    : "flex items-center gap-5"
                }
              >
                {current.avatar_url ? (
                  <img
                    src={current.avatar_url}
                    alt={current.username}
                    className={`shrink-0 rounded-full ring-2 ring-twitch/50 ${
                      current.is_vertical ? "w-10 h-10" : "w-14 h-14"
                    }`}
                  />
                ) : (
                  <div
                    className={`shrink-0 rounded-full bg-twitch/20 flex items-center justify-center text-twitch font-bold ${
                      current.is_vertical
                        ? "w-10 h-10 text-base"
                        : "w-14 h-14 text-2xl"
                    }`}
                  >
                    {current.username[0].toUpperCase()}
                  </div>
                )}
                <div className="min-w-0">
                  <p
                    className={`text-twitch font-bold ${
                      current.is_vertical ? "text-sm" : "text-base"
                    }`}
                  >
                    {current.username}
                  </p>
                  <p
                    className={`text-white font-semibold leading-tight ${
                      current.is_vertical ? "text-base" : "text-2xl"
                    }`}
                  >
                    {current.message}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Username tag if no message */}
          {!current.message && (
            <div
              className={`absolute bg-black/80 backdrop-blur-sm rounded-full flex items-center gap-3 ${
                current.is_vertical
                  ? "bottom-3 left-3 px-3 py-1.5"
                  : "bottom-4 left-4 px-5 py-2.5"
              }`}
            >
              {current.avatar_url ? (
                <img
                  src={current.avatar_url}
                  alt={current.username}
                  className={`rounded-full ring-2 ring-twitch/50 ${
                    current.is_vertical ? "w-6 h-6" : "w-8 h-8"
                  }`}
                />
              ) : (
                <div
                  className={`rounded-full bg-twitch/20 flex items-center justify-center text-twitch font-bold ${
                    current.is_vertical ? "w-6 h-6 text-xs" : "w-8 h-8 text-sm"
                  }`}
                >
                  {current.username[0].toUpperCase()}
                </div>
              )}
              <span
                className={`text-twitch font-bold ${
                  current.is_vertical ? "text-sm" : "text-lg"
                }`}
              >
                {current.username}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
