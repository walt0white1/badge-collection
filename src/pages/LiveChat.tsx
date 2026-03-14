import { useState, useRef, useEffect } from "react";
import { useAuth } from "../hooks/useAuth";
import { submitLiveVideo, submitYoutubeVideo, getVideoUrl } from "../api";
import { supabase } from "../lib/supabase";
import type { LiveSubmission } from "../types";

function extractYoutubeId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
    /^([a-zA-Z0-9_-]{11})$/,
  ];
  for (const p of patterns) {
    const m = url.trim().match(p);
    if (m) return m[1];
  }
  return null;
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function LiveChat() {
  const { user, isAuthenticated, login } = useAuth();
  const [mode, setMode] = useState<"upload" | "youtube">("youtube");

  // Upload state
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const uploadVideoRef = useRef<HTMLVideoElement>(null);

  // YouTube state
  const [ytUrl, setYtUrl] = useState("");
  const [ytId, setYtId] = useState<string | null>(null);
  const [ytStart, setYtStart] = useState(0);
  const [ytEnd, setYtEnd] = useState(15);

  // Shared state
  const [message, setMessage] = useState("");
  const [duration, setDuration] = useState(10);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [recentSubmissions, setRecentSubmissions] = useState<LiveSubmission[]>(
    [],
  );

  // Load recent submissions
  useEffect(() => {
    if (!isAuthenticated || !user) return;
    supabase
      .from("live_submissions")
      .select("*")
      .eq("username", user.twitch_login)
      .order("created_at", { ascending: false })
      .limit(5)
      .then(({ data }) => {
        if (data) setRecentSubmissions(data as LiveSubmission[]);
      });
  }, [isAuthenticated, user, sent]);

  // Parse YouTube URL
  useEffect(() => {
    if (!ytUrl) {
      setYtId(null);
      return;
    }
    const id = extractYoutubeId(ytUrl);
    setYtId(id);
    if (id) {
      setYtStart(0);
      setYtEnd(15);
      setError("");
    }
  }, [ytUrl]);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setError("");
    setSent(false);

    if (!["video/mp4", "video/webm", "video/quicktime"].includes(f.type)) {
      setError("Format accepté : MP4, WebM ou MOV");
      return;
    }
    if (f.size > 52428800) {
      setError("La vidéo doit faire moins de 50 Mo");
      return;
    }

    setFile(f);
    setPreview(URL.createObjectURL(f));
  };

  const onVideoLoaded = () => {
    if (uploadVideoRef.current) {
      const dur = uploadVideoRef.current.duration;
      if (dur > 15) {
        setError("La vidéo doit faire 15 secondes maximum");
        setFile(null);
        setPreview("");
        return;
      }
      setDuration(Math.min(Math.ceil(dur), 15));
    }
  };

  const handleSubmit = async () => {
    setSending(true);
    setError("");
    try {
      if (mode === "upload") {
        if (!file) return;
        await submitLiveVideo(file, message, duration);
      } else {
        if (!ytId) {
          setError("Lien YouTube invalide");
          setSending(false);
          return;
        }
        if (ytEnd - ytStart < 1) {
          setError("La durée doit être d'au moins 1 seconde");
          setSending(false);
          return;
        }
        if (ytEnd - ytStart > 15) {
          setError("15 secondes maximum");
          setSending(false);
          return;
        }
        await submitYoutubeVideo(ytId, message, ytStart, ytEnd);
      }
      setSent(true);
      setFile(null);
      setMessage("");
      setPreview("");
      setYtUrl("");
      setYtId(null);
      if (fileRef.current) fileRef.current.value = "";
    } catch (err: any) {
      setError(err.message || "Erreur lors de l'envoi");
    } finally {
      setSending(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center px-6 text-center">
        <div className="text-6xl mb-6">🎬</div>
        <h1 className="text-3xl font-black mb-3">Live Chat</h1>
        <p className="text-gray-400 mb-6 max-w-md">
          Envoie une vidéo qui s'affichera en direct sur le stream !
          Connecte-toi pour participer.
        </p>
        <button
          onClick={login}
          className="flex items-center gap-2 px-6 py-3 bg-twitch hover:bg-twitch-dark text-white font-semibold rounded-xl transition-colors"
        >
          <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current">
            <path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714z" />
          </svg>
          Connexion avec Twitch
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-6 py-10">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-black mb-2">Live Chat</h1>
        <p className="text-gray-400 text-sm">
          Envoie une vidéo + un message qui s'afficheront en direct sur le
          stream
        </p>
      </div>

      {/* Mode toggle */}
      <div className="flex gap-2 mb-6 bg-gray-900/50 p-1 rounded-xl">
        <button
          onClick={() => {
            setMode("youtube");
            setError("");
          }}
          className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-colors ${
            mode === "youtube"
              ? "bg-red-500/20 text-red-400"
              : "text-gray-400 hover:text-gray-200"
          }`}
        >
          🔗 Lien YouTube
        </button>
        <button
          onClick={() => {
            setMode("upload");
            setError("");
          }}
          className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-colors ${
            mode === "upload"
              ? "bg-twitch/20 text-twitch"
              : "text-gray-400 hover:text-gray-200"
          }`}
        >
          📁 Upload vidéo
        </button>
      </div>

      {/* Upload form */}
      <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-6 space-y-5">
        {mode === "upload" ? (
          /* File upload */
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Ta vidéo (15 sec max)
            </label>
            {!preview ? (
              <button
                onClick={() => fileRef.current?.click()}
                className="w-full border-2 border-dashed border-gray-700 hover:border-twitch/50 rounded-xl p-8 text-center transition-colors group"
              >
                <div className="text-4xl mb-2 group-hover:scale-110 transition-transform">
                  🎥
                </div>
                <p className="text-gray-400 text-sm">
                  Clique pour choisir une vidéo
                </p>
                <p className="text-gray-600 text-xs mt-1">
                  MP4, WebM ou MOV — 50 Mo max
                </p>
              </button>
            ) : (
              <div className="relative">
                <video
                  ref={uploadVideoRef}
                  src={preview}
                  onLoadedMetadata={onVideoLoaded}
                  className="w-full rounded-xl max-h-[300px] object-contain bg-black"
                  controls
                  muted
                />
                <button
                  onClick={() => {
                    setFile(null);
                    setPreview("");
                    if (fileRef.current) fileRef.current.value = "";
                  }}
                  className="absolute top-2 right-2 w-8 h-8 bg-black/70 hover:bg-red-500/80 rounded-full flex items-center justify-center text-white text-sm transition-colors"
                >
                  X
                </button>
              </div>
            )}
            <input
              ref={fileRef}
              type="file"
              accept="video/mp4,video/webm,video/quicktime"
              onChange={handleFile}
              className="hidden"
            />
          </div>
        ) : (
          /* YouTube link */
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Lien YouTube
              </label>
              <input
                type="text"
                value={ytUrl}
                onChange={(e) => setYtUrl(e.target.value)}
                placeholder="https://youtube.com/watch?v=... ou https://youtu.be/..."
                className="w-full bg-gray-800/50 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-red-500/50 transition-colors"
              />
            </div>

            {/* YouTube preview */}
            {ytId && (
              <div className="space-y-4">
                <div className="rounded-xl overflow-hidden bg-black">
                  <iframe
                    src={`https://www.youtube.com/embed/${ytId}?start=${ytStart}&end=${ytEnd}`}
                    className="w-full aspect-video"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>

                {/* Time selector */}
                <div className="bg-gray-800/30 rounded-xl p-4 space-y-3">
                  <p className="text-sm font-medium text-gray-300">
                    Choisis l'extrait (15 sec max)
                  </p>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">
                        Debut (secondes)
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min={0}
                          value={ytStart}
                          onChange={(e) => {
                            const v = Math.max(0, Number(e.target.value));
                            setYtStart(v);
                            if (ytEnd <= v) setYtEnd(v + 1);
                            if (ytEnd - v > 15) setYtEnd(v + 15);
                          }}
                          className="w-full bg-gray-800/50 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-red-500/50"
                        />
                        <span className="text-gray-500 text-xs whitespace-nowrap">
                          {formatTime(ytStart)}
                        </span>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">
                        Fin (secondes)
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min={ytStart + 1}
                          value={ytEnd}
                          onChange={(e) => {
                            const v = Math.max(
                              ytStart + 1,
                              Number(e.target.value),
                            );
                            if (v - ytStart > 15) return;
                            setYtEnd(v);
                          }}
                          className="w-full bg-gray-800/50 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-red-500/50"
                        />
                        <span className="text-gray-500 text-xs whitespace-nowrap">
                          {formatTime(ytEnd)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-500">
                      Duree : {ytEnd - ytStart}s
                    </span>
                    {ytEnd - ytStart > 15 && (
                      <span className="text-red-400">15 sec max !</span>
                    )}
                  </div>
                </div>
              </div>
            )}

            {ytUrl && !ytId && (
              <p className="text-red-400 text-sm">
                Lien YouTube invalide. Colle un lien YouTube valide.
              </p>
            )}
          </div>
        )}

        {/* Message */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Ton message (optionnel)
          </label>
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value.slice(0, 200))}
            placeholder="Regarde ca Matteo c'est ouf..."
            className="w-full bg-gray-800/50 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-twitch/50 transition-colors"
            maxLength={200}
          />
          <p className="text-right text-gray-600 text-xs mt-1">
            {message.length}/200
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl px-4 py-3 text-sm">
            {error}
          </div>
        )}

        {/* Success */}
        {sent && (
          <div className="bg-green-500/10 border border-green-500/30 text-green-400 rounded-xl px-4 py-3 text-sm">
            Vidéo envoyée ! Elle va s'afficher sur le stream.
          </div>
        )}

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={
            (mode === "upload" && !file) ||
            (mode === "youtube" && !ytId) ||
            sending
          }
          className="w-full py-3.5 bg-twitch hover:bg-twitch-dark disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
        >
          {sending ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Envoi en cours...
            </>
          ) : (
            "Envoyer sur le stream"
          )}
        </button>
      </div>

      {/* Recent submissions */}
      {recentSubmissions.length > 0 && (
        <div className="mt-8">
          <h2 className="text-lg font-bold mb-4 text-gray-300">
            Tes derniers envois
          </h2>
          <div className="space-y-3">
            {recentSubmissions.map((s) => (
              <div
                key={s.id}
                className="flex items-center gap-4 bg-gray-900/30 border border-gray-800/50 rounded-xl p-3"
              >
                {s.video_type === "youtube" && s.youtube_id ? (
                  <img
                    src={`https://img.youtube.com/vi/${s.youtube_id}/mqdefault.jpg`}
                    alt=""
                    className="w-20 h-14 rounded-lg object-cover"
                  />
                ) : (
                  <video
                    src={getVideoUrl(s.video_path)}
                    className="w-20 h-14 rounded-lg object-cover bg-black"
                    muted
                  />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white truncate">
                    {s.message || "(pas de message)"}
                  </p>
                  <p className="text-xs text-gray-500">
                    {s.video_type === "youtube" ? "YouTube" : "Upload"} —{" "}
                    {new Date(s.created_at).toLocaleString("fr-FR")}
                  </p>
                </div>
                <div
                  className={`text-xs px-2 py-1 rounded-full ${
                    s.played
                      ? "bg-green-500/10 text-green-400"
                      : "bg-yellow-500/10 text-yellow-400"
                  }`}
                >
                  {s.played ? "Diffusé" : "En attente"}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
