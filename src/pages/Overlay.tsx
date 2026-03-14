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

function TiktokOverlay({ metaJson }: { metaJson: string }) {
  let thumb = "";
  let title = "";
  let author = "";

  try {
    const meta = JSON.parse(metaJson);
    thumb = meta.thumbnail || "";
    title = meta.title || "";
    author = meta.author || "";
  } catch {}

  return (
    <div className="w-full h-full relative">
      {thumb ? (
        <img src={thumb} alt="" className="w-full h-full object-cover" />
      ) : (
        <div className="w-full h-full bg-gray-900 flex items-center justify-center">
          <svg viewBox="0 0 24 24" className="w-16 h-16 fill-cyan-400">
            <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 00-.79-.05A6.34 6.34 0 003.15 15.2a6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.34-6.34V8.81a8.23 8.23 0 004.76 1.5V6.88a4.85 4.85 0 01-1-.19z"/>
          </svg>
        </div>
      )}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
        {author && <p className="text-white font-bold text-lg">@{author}</p>}
        {title && <p className="text-gray-200 text-sm line-clamp-2">{title}</p>}
        <div className="flex items-center gap-1.5 mt-2">
          <svg viewBox="0 0 24 24" className="w-4 h-4 fill-cyan-400">
            <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 00-.79-.05A6.34 6.34 0 003.15 15.2a6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.34-6.34V8.81a8.23 8.23 0 004.76 1.5V6.88a4.85 4.85 0 01-1-.19z"/>
          </svg>
          <span className="text-cyan-400 text-xs font-medium">TikTok</span>
        </div>
      </div>
    </div>
  );
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

  // Play TikTok video (timer-based since no JS API)
  useEffect(() => {
    if (!current || current.video_type !== "tiktok" || !visible) return;
    const duration = (current.duration_seconds || 15) * 1000;
    const timer = setTimeout(finishCurrent, duration);
    return () => clearTimeout(timer);
  }, [current, visible, finishCurrent]);

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
        <div className="flex flex-col items-center gap-3">
          {/* User info - above video */}
          <div className="flex items-center gap-3">
            {current.avatar_url ? (
              <img
                src={current.avatar_url}
                alt={current.username}
                className="w-10 h-10 rounded-full ring-2 ring-twitch/50"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-twitch/20 flex items-center justify-center text-twitch text-base font-bold">
                {current.username[0].toUpperCase()}
              </div>
            )}
            <span className="text-twitch text-lg font-bold drop-shadow-lg">
              {current.username}
            </span>
          </div>

          {/* Video */}
          <div
            className={`rounded-2xl overflow-hidden shadow-2xl shadow-black/50 ${
              current.is_vertical
                ? "w-[300px]"
                : "max-w-[700px] w-[90vw]"
            }`}
          >
            {current.video_type === "upload" ? (
              <video
                ref={videoRef}
                src={getVideoUrl(current.video_path)}
                onEnded={finishCurrent}
                className="w-full max-h-[450px] object-contain bg-black"
                autoPlay
                playsInline
              />
            ) : current.video_type === "tiktok" ? (
              <div className="w-full bg-black aspect-[9/16] relative flex items-center justify-center">
                <TiktokOverlay metaJson={current.video_path || "{}"} />
              </div>
            ) : (
              <div
                className={`w-full bg-black ${
                  current.is_vertical ? "aspect-[9/16]" : "aspect-video"
                }`}
              >
                <div ref={ytContainerRef} className="w-full h-full" />
              </div>
            )}
          </div>

          {/* Message - below video */}
          {current.message && (
            <p className="text-white text-4xl font-semibold text-center max-w-[700px] drop-shadow-lg break-all" style={{ overflowWrap: "anywhere", wordBreak: "break-word" }}>
              {current.message}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
