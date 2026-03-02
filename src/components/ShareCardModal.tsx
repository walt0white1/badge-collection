import { useRef, useState, useEffect } from "react";
import { toPng } from "html-to-image";
import { useQuery } from "@tanstack/react-query";
import { fetchLeaderboard, uploadShareCard } from "../api";
import { RARITY_ORDER, RARITY_COLORS, RARITY_POINTS, type AuthUser } from "../types";
import { getBadgeImage } from "../badgeImages";

interface Props {
  user: AuthUser;
  onClose: () => void;
}

export default function ShareCardModal({ user, onClose }: Props) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [linkCopied, setLinkCopied] = useState(false);

  // Fetch rank from leaderboard
  const { data: leaderboard } = useQuery({
    queryKey: ["leaderboard"],
    queryFn: fetchLeaderboard,
  });
  const rank =
    leaderboard?.find(
      (e) => e.username.toLowerCase() === user.twitch_login.toLowerCase(),
    )?.rank ?? null;

  const totalBadges = Object.values(user.badges).reduce(
    (sum, list) => sum + (Array.isArray(list) ? list.length : 0),
    0,
  );

  // Rarity totals across all seasons
  const rarityCounts: Record<string, number> = {};
  for (const r of RARITY_ORDER) rarityCounts[r] = 0;
  for (const list of Object.values(user.badges)) {
    if (!Array.isArray(list)) continue;
    for (const b of list) rarityCounts[b.toUpperCase()] = (rarityCounts[b.toUpperCase()] || 0) + 1;
  }

  // Top rarity
  const topRarity = [...RARITY_ORDER].reverse().find((r) => rarityCounts[r] > 0) || "COMMON";

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  const downloadCard = async () => {
    if (!cardRef.current) return;
    setGenerating(true);
    try {
      const dataUrl = await toPng(cardRef.current, {
        pixelRatio: 2,
        cacheBust: true,
      });
      const link = document.createElement("a");
      link.download = `${user.twitch_login}-badge-card.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error("Failed to generate card:", err);
    } finally {
      setGenerating(false);
    }
  };

  const copyCard = async () => {
    if (!cardRef.current) return;
    setGenerating(true);
    try {
      const dataUrl = await toPng(cardRef.current, {
        pixelRatio: 2,
        cacheBust: true,
      });
      const res = await fetch(dataUrl);
      const blob = await res.blob();
      await navigator.clipboard.write([
        new ClipboardItem({ "image/png": blob }),
      ]);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy card:", err);
    } finally {
      setGenerating(false);
    }
  };

  const shareLink = async () => {
    if (!cardRef.current) return;
    setGenerating(true);
    try {
      const dataUrl = await toPng(cardRef.current, {
        pixelRatio: 2,
        cacheBust: true,
      });
      const res = await fetch(dataUrl);
      const blob = await res.blob();
      const url = await uploadShareCard(user.twitch_login, blob);
      setShareUrl(url);
      await navigator.clipboard.writeText(url);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 3000);
    } catch (err) {
      console.error("Failed to upload card:", err);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-gray-900 border border-white/10 rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors"
        >
          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="p-6 space-y-5">
          <div>
            <h2 className="text-xl font-black text-white">Partager ma carte</h2>
            <p className="text-sm text-gray-500 mt-1">Telecharge ou copie ta carte de profil.</p>
          </div>

          {/* ── The Card (captured as image) ── */}
          <div className="flex justify-center">
            <div
              ref={cardRef}
              style={{
                width: 420,
                fontFamily: "'Outfit', 'Inter', system-ui, sans-serif",
                background: "linear-gradient(145deg, #0f0f1a 0%, #0a0a14 40%, #12091e 100%)",
                borderRadius: 20,
                overflow: "hidden",
                position: "relative",
              }}
            >
              {/* Ambient glow */}
              <div
                style={{
                  position: "absolute",
                  top: -60,
                  right: -40,
                  width: 200,
                  height: 200,
                  borderRadius: "50%",
                  background: `radial-gradient(circle, ${RARITY_COLORS[topRarity]}22, transparent 70%)`,
                  pointerEvents: "none",
                }}
              />
              <div
                style={{
                  position: "absolute",
                  bottom: -40,
                  left: -30,
                  width: 160,
                  height: 160,
                  borderRadius: "50%",
                  background: "radial-gradient(circle, rgba(145,70,255,0.08), transparent 70%)",
                  pointerEvents: "none",
                }}
              />

              {/* Top accent line */}
              <div
                style={{
                  height: 3,
                  background: `linear-gradient(90deg, transparent, ${RARITY_COLORS[topRarity]}, #9146FF, transparent)`,
                  opacity: 0.6,
                }}
              />

              <div style={{ padding: "28px 28px 24px", position: "relative" }}>
                {/* Header: Avatar + Name + Rank */}
                <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 24 }}>
                  {/* Avatar with glow */}
                  <div style={{ position: "relative", flexShrink: 0 }}>
                    <div
                      style={{
                        position: "absolute",
                        inset: -4,
                        borderRadius: "50%",
                        background: `conic-gradient(from 45deg, ${RARITY_COLORS[topRarity]}88, #9146FF88, ${RARITY_COLORS[topRarity]}88)`,
                        filter: "blur(1px)",
                      }}
                    />
                    <img
                      src={user.twitch_profile_image}
                      alt=""
                      crossOrigin="anonymous"
                      style={{
                        width: 64,
                        height: 64,
                        borderRadius: "50%",
                        objectFit: "cover",
                        position: "relative",
                        border: "3px solid #0f0f1a",
                      }}
                    />
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 20, fontWeight: 800, color: "#fff", lineHeight: 1.2 }}>
                      {user.twitch_display_name}
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4 }}>
                      {rank && (
                        <span
                          style={{
                            fontSize: 11,
                            fontWeight: 700,
                            color: "#9146FF",
                            background: "rgba(145,70,255,0.15)",
                            border: "1px solid rgba(145,70,255,0.25)",
                            borderRadius: 6,
                            padding: "2px 8px",
                          }}
                        >
                          #{rank}
                        </span>
                      )}
                      <span style={{ fontSize: 12, color: "#666" }}>
                        el_matte0 Badge Collection
                      </span>
                    </div>
                  </div>
                </div>

                {/* Stats row */}
                <div
                  style={{
                    display: "flex",
                    gap: 12,
                    marginBottom: 24,
                  }}
                >
                  {/* Points */}
                  <div
                    style={{
                      flex: 1,
                      background: "rgba(255,255,255,0.03)",
                      border: "1px solid rgba(255,255,255,0.06)",
                      borderRadius: 14,
                      padding: "14px 16px",
                      textAlign: "center",
                    }}
                  >
                    <div style={{ fontSize: 28, fontWeight: 900, color: "#9146FF", lineHeight: 1 }}>
                      {user.total_pts.toLocaleString()}
                    </div>
                    <div style={{ fontSize: 10, color: "#555", fontWeight: 600, letterSpacing: "0.1em", marginTop: 4, textTransform: "uppercase" as const }}>
                      Points
                    </div>
                  </div>

                  {/* Badges */}
                  <div
                    style={{
                      flex: 1,
                      background: "rgba(255,255,255,0.03)",
                      border: "1px solid rgba(255,255,255,0.06)",
                      borderRadius: 14,
                      padding: "14px 16px",
                      textAlign: "center",
                    }}
                  >
                    <div style={{ fontSize: 28, fontWeight: 900, color: "#fff", lineHeight: 1 }}>
                      {totalBadges}
                    </div>
                    <div style={{ fontSize: 10, color: "#555", fontWeight: 600, letterSpacing: "0.1em", marginTop: 4, textTransform: "uppercase" as const }}>
                      Badges
                    </div>
                  </div>

                  {/* Seasons */}
                  <div
                    style={{
                      flex: 1,
                      background: "rgba(255,255,255,0.03)",
                      border: "1px solid rgba(255,255,255,0.06)",
                      borderRadius: 14,
                      padding: "14px 16px",
                      textAlign: "center",
                    }}
                  >
                    <div style={{ fontSize: 28, fontWeight: 900, color: "#fff", lineHeight: 1 }}>
                      {Object.keys(user.badges).length}
                    </div>
                    <div style={{ fontSize: 10, color: "#555", fontWeight: 600, letterSpacing: "0.1em", marginTop: 4, textTransform: "uppercase" as const }}>
                      Saisons
                    </div>
                  </div>
                </div>

                {/* Rarity breakdown */}
                <div
                  style={{
                    background: "rgba(255,255,255,0.02)",
                    border: "1px solid rgba(255,255,255,0.06)",
                    borderRadius: 14,
                    padding: "16px",
                    marginBottom: 16,
                  }}
                >
                  {/* Progress bar */}
                  <div
                    style={{
                      display: "flex",
                      height: 6,
                      borderRadius: 3,
                      overflow: "hidden",
                      background: "rgba(255,255,255,0.04)",
                      marginBottom: 14,
                    }}
                  >
                    {RARITY_ORDER.map((r) => {
                      const pct = totalBadges > 0 ? (rarityCounts[r] / totalBadges) * 100 : 0;
                      if (pct === 0) return null;
                      return (
                        <div
                          key={r}
                          style={{
                            width: `${pct}%`,
                            minWidth: pct > 0 ? 4 : 0,
                            background: RARITY_COLORS[r],
                            borderRadius: 3,
                          }}
                        />
                      );
                    })}
                  </div>

                  {/* Rarity rows */}
                  <div style={{ display: "flex", flexDirection: "column" as const, gap: 8 }}>
                    {RARITY_ORDER.map((r) => (
                      <div
                        key={r}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 10,
                          opacity: rarityCounts[r] > 0 ? 1 : 0.3,
                        }}
                      >
                        <img
                          src={getBadgeImage(r, "saison2")}
                          alt=""
                          crossOrigin="anonymous"
                          style={{ width: 22, height: 22, objectFit: "contain" }}
                        />
                        <span
                          style={{
                            fontSize: 11,
                            fontWeight: 700,
                            color: RARITY_COLORS[r],
                            letterSpacing: "0.08em",
                            flex: 1,
                          }}
                        >
                          {r}
                        </span>
                        <span
                          style={{
                            fontSize: 13,
                            fontWeight: 800,
                            color: rarityCounts[r] > 0 ? "#fff" : "#333",
                          }}
                        >
                          {rarityCounts[r]}
                        </span>
                        <span style={{ fontSize: 10, color: "#444", fontWeight: 600, minWidth: 32, textAlign: "right" as const }}>
                          {rarityCounts[r] * (RARITY_POINTS[r] || 0)} pts
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Footer */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    opacity: 0.4,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="#9146FF">
                      <path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714z" />
                    </svg>
                    <span style={{ fontSize: 10, color: "#888", fontWeight: 600 }}>
                      el_matte0
                    </span>
                  </div>
                  <span style={{ fontSize: 9, color: "#555", fontWeight: 500 }}>
                    badge-collection.vercel.app
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={downloadCard}
              disabled={generating}
              className="flex flex-col items-center justify-center gap-1.5 px-3 py-3 bg-twitch hover:bg-twitch-dark disabled:opacity-50 text-white text-xs font-bold rounded-xl transition-colors"
            >
              {generating ? (
                <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
              )}
              Telecharger
            </button>
            <button
              onClick={copyCard}
              disabled={generating}
              className="flex flex-col items-center justify-center gap-1.5 px-3 py-3 bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.08] disabled:opacity-50 text-white text-xs font-bold rounded-xl transition-colors"
            >
              {copied ? (
                <>
                  <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-green-400">Copie !</span>
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                  </svg>
                  Copier image
                </>
              )}
            </button>
            <button
              onClick={shareLink}
              disabled={generating}
              className="flex flex-col items-center justify-center gap-1.5 px-3 py-3 bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.08] disabled:opacity-50 text-white text-xs font-bold rounded-xl transition-colors"
            >
              {linkCopied ? (
                <>
                  <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-green-400">Lien copie !</span>
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                  </svg>
                  Partager lien
                </>
              )}
            </button>
          </div>

          {shareUrl && (
            <div className="flex items-center gap-2 px-3 py-2 bg-white/[0.03] border border-white/[0.06] rounded-lg">
              <input
                type="text"
                readOnly
                value={shareUrl}
                className="flex-1 bg-transparent text-xs text-gray-400 outline-none truncate"
              />
              <button
                onClick={() => {
                  navigator.clipboard.writeText(shareUrl);
                  setLinkCopied(true);
                  setTimeout(() => setLinkCopied(false), 2000);
                }}
                className="text-xs text-twitch hover:text-twitch-dark font-semibold shrink-0"
              >
                Copier
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
