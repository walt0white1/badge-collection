import { useEffect, useState, useRef } from "react";
import { supabase } from "../lib/supabase";
import { getVideoUrl, markSubmissionPlayed } from "../api";
import type { LiveSubmission } from "../types";

export default function Overlay() {
  const [queue, setQueue] = useState<LiveSubmission[]>([]);
  const [current, setCurrent] = useState<LiveSubmission | null>(null);
  const [visible, setVisible] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const processing = useRef(false);

  // Subscribe to new submissions via Supabase Realtime
  useEffect(() => {
    // Load any unplayed submissions on mount
    supabase
      .from("live_submissions")
      .select("*")
      .eq("played", false)
      .order("created_at", { ascending: true })
      .then(({ data }) => {
        if (data && data.length > 0) {
          setQueue(data as LiveSubmission[]);
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
        (payload) => {
          const sub = payload.new as LiveSubmission;
          setQueue((prev) => [...prev, sub]);
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Process queue
  useEffect(() => {
    if (processing.current || current || queue.length === 0) return;
    processing.current = true;

    const next = queue[0];
    setQueue((prev) => prev.slice(1));
    setCurrent(next);

    // Small delay before showing
    setTimeout(() => setVisible(true), 100);
  }, [queue, current]);

  const onVideoEnd = () => {
    setVisible(false);
    // Wait for fade-out animation
    setTimeout(() => {
      if (current) {
        markSubmissionPlayed(current.id).catch(() => {});
      }
      setCurrent(null);
      processing.current = false;
    }, 500);
  };

  // Auto-play when current changes
  useEffect(() => {
    if (current && videoRef.current && visible) {
      videoRef.current.play().catch(() => {});
    }
  }, [current, visible]);

  // If no video playing, show nothing (transparent for OBS)
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
        {/* Card container */}
        <div className="relative max-w-[600px] w-[90vw] rounded-2xl overflow-hidden shadow-2xl shadow-black/50 bg-gray-950 border border-gray-800/60">
          {/* Video */}
          <video
            ref={videoRef}
            src={getVideoUrl(current.video_path)}
            onEnded={onVideoEnd}
            className="w-full max-h-[400px] object-contain bg-black"
            autoPlay
            playsInline
          />

          {/* Message bar */}
          {current.message && (
            <div className="px-5 py-3 bg-gray-900/90 border-t border-gray-800/60">
              <div className="flex items-center gap-3">
                <div className="shrink-0 w-8 h-8 rounded-full bg-twitch/20 flex items-center justify-center text-twitch text-sm font-bold">
                  {current.username[0].toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="text-twitch text-xs font-semibold">
                    {current.username}
                  </p>
                  <p className="text-white text-sm truncate">
                    {current.message}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Username tag if no message */}
          {!current.message && (
            <div className="absolute bottom-3 left-3 bg-black/70 backdrop-blur-sm px-3 py-1.5 rounded-full">
              <span className="text-twitch text-xs font-semibold">
                {current.username}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
