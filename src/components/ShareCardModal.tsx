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

function formatWatchTime(minutes: number | null): string {
  if (!minutes) return "—";
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  return `${d}j ${h % 24}h`;
}

function formatNumber(n: number | null): string {
  if (n == null) return "—";
  if (n >= 1000) return `${(n / 1000).toFixed(1).replace(/\.0$/, "")}k`;
  return n.toLocaleString();
}

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  const months = ["Jan", "Fev", "Mar", "Avr", "Mai", "Jun", "Jul", "Aou", "Sep", "Oct", "Nov", "Dec"];
  return `${months[d.getMonth()]} ${d.getFullYear()}`;
}

export default function ShareCardModal({ user, onClose }: Props) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [linkCopied, setLinkCopied] = useState(false);

  const { data: leaderboard } = useQuery({
    queryKey: ["leaderboard"],
    queryFn: fetchLeaderboard,
  });
  const entry = leaderboard?.find(
    (e) => e.username.toLowerCase() === user.twitch_login.toLowerCase(),
  );
  const rank = entry?.rank ?? null;

  const totalBadges = Object.values(user.badges).reduce(
    (sum, list) => sum + (Array.isArray(list) ? list.length : 0),
    0,
  );

  const rarityCounts: Record<string, number> = {};
  for (const r of RARITY_ORDER) rarityCounts[r] = 0;
  for (const list of Object.values(user.badges)) {
    if (!Array.isArray(list)) continue;
    for (const b of list) rarityCounts[b.toUpperCase()] = (rarityCounts[b.toUpperCase()] || 0) + 1;
  }

  const topRarity = [...RARITY_ORDER].reverse().find((r) => rarityCounts[r] > 0) || "COMMON";

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  const generatePng = async () => {
    if (!cardRef.current) return null;
    return toPng(cardRef.current, { pixelRatio: 2, cacheBust: true });
  };

  const downloadCard = async () => {
    setGenerating(true);
    try {
      const dataUrl = await generatePng();
      if (!dataUrl) return;
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
    setGenerating(true);
    try {
      const dataUrl = await generatePng();
      if (!dataUrl) return;
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
    setGenerating(true);
    try {
      const dataUrl = await generatePng();
      if (!dataUrl) return;
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

  // Build stat pairs for the inline row
  const stats = [
    { label: "messages", value: formatNumber(entry?.message_count ?? null) },
    { label: "watch", value: formatWatchTime(entry?.watch_time_minutes ?? null) },
    { label: "echanges", value: String(entry?.trade_count ?? 0) },
    { label: "saisons", value: String(Object.keys(user.badges).length) },
  ];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-gray-900 border border-white/10 rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
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

          {/* ── The Card ── */}
          <div className="flex justify-center overflow-hidden">
            <div
              ref={cardRef}
              className="origin-top scale-[0.78] sm:scale-100"
              style={{
                width: 440,
                fontFamily: "'Outfit', 'Inter', system-ui, sans-serif",
                background: "linear-gradient(160deg, #0c0c16 0%, #08080f 50%, #100a1a 100%)",
                borderRadius: 20,
                overflow: "hidden",
                position: "relative",
              }}
            >
              {/* Subtle ambient blurs */}
              <div style={{ position: "absolute", top: -80, right: -60, width: 220, height: 220, borderRadius: "50%", background: `radial-gradient(circle, ${RARITY_COLORS[topRarity]}18, transparent 70%)`, pointerEvents: "none" }} />
              <div style={{ position: "absolute", bottom: -60, left: -40, width: 180, height: 180, borderRadius: "50%", background: "radial-gradient(circle, rgba(145,70,255,0.06), transparent 70%)", pointerEvents: "none" }} />

              {/* Top accent */}
              <div style={{ height: 2, background: `linear-gradient(90deg, transparent 5%, ${RARITY_COLORS[topRarity]}80, #9146FF80, transparent 95%)` }} />

              <div style={{ padding: "28px 30px 24px", position: "relative" }}>

                {/* ── Profile row ── */}
                <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 28 }}>
                  <div style={{ position: "relative", flexShrink: 0 }}>
                    <div style={{ position: "absolute", inset: -3, borderRadius: "50%", background: `conic-gradient(from 45deg, ${RARITY_COLORS[topRarity]}66, #9146FF66, ${RARITY_COLORS[topRarity]}66)`, filter: "blur(1px)" }} />
                    <img
                      src={user.twitch_profile_image}
                      alt=""
                      crossOrigin="anonymous"
                      style={{ width: 52, height: 52, borderRadius: "50%", objectFit: "cover", position: "relative", border: "2px solid #0c0c16" }}
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
                      <span style={{ fontSize: 20, fontWeight: 900, color: "#fff", letterSpacing: "-0.02em" }}>
                        {user.twitch_display_name}
                      </span>
                      {rank && (
                        <span style={{ fontSize: 12, fontWeight: 700, color: "#9146FF" }}>
                          #{rank}
                        </span>
                      )}
                    </div>
                    {entry?.followed_at && (
                      <div style={{ fontSize: 11, color: "#555", marginTop: 2 }}>
                        Follow depuis {formatDate(entry.followed_at)}
                      </div>
                    )}
                  </div>
                </div>

                {/* ── Big numbers: points + badges ── */}
                <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginBottom: 4 }}>
                  <span style={{ fontSize: 42, fontWeight: 900, color: "#9146FF", lineHeight: 1, letterSpacing: "-0.03em" }}>
                    {user.total_pts.toLocaleString()}
                  </span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: "#555", textTransform: "uppercase" as const, letterSpacing: "0.08em" }}>
                    pts
                  </span>
                  <span style={{ fontSize: 13, color: "#333", margin: "0 4px" }}>·</span>
                  <span style={{ fontSize: 42, fontWeight: 900, color: "#fff", lineHeight: 1, letterSpacing: "-0.03em" }}>
                    {totalBadges}
                  </span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: "#555", textTransform: "uppercase" as const, letterSpacing: "0.08em" }}>
                    badges
                  </span>
                </div>

                {/* ── Inline stat line ── */}
                <div style={{ display: "flex", alignItems: "center", gap: 0, marginBottom: 24 }}>
                  {stats.map((s, i) => (
                    <span key={s.label} style={{ display: "flex", alignItems: "center", gap: 0 }}>
                      {i > 0 && <span style={{ color: "#2a2a35", margin: "0 8px", fontSize: 10 }}>·</span>}
                      <span style={{ fontSize: 12, fontWeight: 700, color: "#888" }}>{s.value}</span>
                      <span style={{ fontSize: 10, fontWeight: 500, color: "#444", marginLeft: 3 }}>{s.label}</span>
                    </span>
                  ))}
                </div>

                {/* ── Thin separator ── */}
                <div style={{ height: 1, background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.06), transparent)", marginBottom: 20 }} />

                {/* ── Rarity rows — no box, just rows ── */}
                <div style={{ display: "flex", flexDirection: "column" as const, gap: 8, marginBottom: 20 }}>
                  {RARITY_ORDER.map((r) => {
                    const count = rarityCounts[r];
                    const active = count > 0;
                    const pct = totalBadges > 0 ? (count / totalBadges) * 100 : 0;
                    return (
                      <div key={r} style={{ display: "flex", alignItems: "center", gap: 10, opacity: active ? 1 : 0.25 }}>
                        <img
                          src={getBadgeImage(r, "saison2")}
                          alt=""
                          crossOrigin="anonymous"
                          style={{ width: 22, height: 22, objectFit: "contain" }}
                        />
                        <span style={{ fontSize: 10, fontWeight: 700, color: RARITY_COLORS[r], letterSpacing: "0.1em", width: 80, textTransform: "uppercase" as const }}>
                          {r}
                        </span>
                        {/* Inline mini bar */}
                        <div style={{ flex: 1, height: 3, borderRadius: 2, background: "rgba(255,255,255,0.04)", overflow: "hidden" }}>
                          <div style={{ height: "100%", width: `${Math.max(pct, active ? 3 : 0)}%`, background: RARITY_COLORS[r], borderRadius: 2, opacity: 0.7 }} />
                        </div>
                        <span style={{ fontSize: 13, fontWeight: 800, color: active ? "#fff" : "#333", minWidth: 20, textAlign: "right" as const }}>
                          {count}
                        </span>
                        <span style={{ fontSize: 9, color: "#444", fontWeight: 600, minWidth: 32, textAlign: "right" as const }}>
                          {count * (RARITY_POINTS[r] || 0)} pts
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* ── Footer ── */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", opacity: 0.35 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="#9146FF">
                      <path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714z" />
                    </svg>
                    <span style={{ fontSize: 10, color: "#888", fontWeight: 600 }}>el_matte0</span>
                  </div>
                  <span style={{ fontSize: 8, color: "#555", fontWeight: 500, letterSpacing: "0.05em" }}>
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
