import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { fetchLeaderboard } from "../api";
import { RARITY_COLORS } from "../types";
import { getBadgeImage } from "../badgeImages";

const PODIUM_CFG = [
  { accent: "#fbbf24", glow: "rgba(251,191,36,0.3)",  shadow: "rgba(251,191,36,0.15)", icon: "👑", label: "OR"     },
  { accent: "#94a3b8", glow: "rgba(148,163,184,0.2)", shadow: "rgba(148,163,184,0.08)", icon: "✦",  label: "ARGENT" },
  { accent: "#b45309", glow: "rgba(180,83,9,0.2)",   shadow: "rgba(180,83,9,0.08)",   icon: "✧",  label: "BRONZE" },
];

export default function Leaderboard() {
  const { data, isLoading } = useQuery({
    queryKey: ["leaderboard"],
    queryFn: fetchLeaderboard,
  });
  const [search, setSearch] = useState("");

  useEffect(() => {
    const link = document.createElement("link");
    link.href =
      "https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Outfit:wght@300;400;500;600;700;900&display=swap";
    link.rel = "stylesheet";
    document.head.appendChild(link);
    return () => {
      try { document.head.removeChild(link); } catch {}
    };
  }, []);

  const all = data ?? [];
  const filtered = all.filter((e) =>
    e.username.toLowerCase().includes(search.toLowerCase())
  );
  const maxPts = all[0]?.total_pts || 1;
  const showPodium = !search && filtered.length >= 1;
  const top3 = showPodium ? filtered.slice(0, 3) : [];
  const rest = showPodium ? filtered.slice(3) : filtered;

  return (
    <div
      style={{ fontFamily: "'Outfit', sans-serif" }}
      className="min-h-screen"
    >
      <div className="max-w-3xl mx-auto px-4 pt-10 pb-20">

        {/* ── Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
          <div>
            <p className="text-[10px] tracking-[0.35em] text-twitch/60 uppercase mb-1 font-medium">
              el_matte0 · Badge Collection
            </p>
            <h1
              style={{ fontFamily: "'Bebas Neue', sans-serif", letterSpacing: "0.04em" }}
              className="text-7xl leading-none text-white"
            >
              Classement
            </h1>
          </div>

          {/* Search */}
          <div className="relative group">
            <svg
              className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500 group-focus-within:text-twitch transition-colors"
              fill="none" stroke="currentColor" viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Rechercher un joueur…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-4 py-2.5 bg-white/[0.04] border border-white/[0.08] rounded-xl text-sm text-white placeholder-gray-600 focus:outline-none focus:border-twitch/40 focus:bg-white/[0.06] transition-all w-60"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-32">
            <div className="w-10 h-10 border-2 border-twitch border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="space-y-8">

            {/* ── PODIUM TOP 3 ── */}
            {showPodium && top3.length > 0 && (
              <div className="flex items-end justify-center gap-3 pt-4 pb-2">
                {/* Order: 2nd · 1st · 3rd */}
                {[top3[1], top3[0], top3[2]].map((entry, podiumSlot) => {
                  if (!entry) return <div key={`empty-${podiumSlot}`} className="w-36 shrink-0" />;
                  const rankIdx = entry.rank - 1;
                  const cfg = PODIUM_CFG[rankIdx];
                  const isFirst = entry.rank === 1;

                  return (
                    <Link
                      key={entry.username}
                      to={`/user/${entry.username}`}
                      className="relative flex flex-col items-center gap-3 rounded-2xl p-5 border transition-all duration-300 group shrink-0 hover:scale-[1.03]"
                      style={{
                        width: isFirst ? "176px" : "148px",
                        transform: isFirst ? "translateY(-20px)" : undefined,
                        background: `linear-gradient(160deg, rgba(255,255,255,0.055) 0%, rgba(255,255,255,0.015) 100%)`,
                        borderColor: cfg.accent + "55",
                        boxShadow: `0 0 40px ${cfg.shadow}, 0 0 1px ${cfg.accent}33, inset 0 1px 0 rgba(255,255,255,0.06)`,
                        backdropFilter: "blur(12px)",
                      }}
                    >
                      {/* Rank badge */}
                      <div
                        className="absolute -top-3.5 -right-3.5 w-8 h-8 rounded-full flex items-center justify-center text-xs font-black shadow-lg"
                        style={{ background: cfg.accent, color: entry.rank === 1 ? "#000" : "#fff" }}
                      >
                        {entry.rank}
                      </div>

                      {/* Icon */}
                      <span className="text-2xl leading-none">{cfg.icon}</span>

                      {/* Avatar */}
                      {entry.avatar_url ? (
                        <img
                          src={entry.avatar_url}
                          alt={entry.username}
                          className="rounded-full object-cover ring-2"
                          style={{
                            width: isFirst ? 56 : 44,
                            height: isFirst ? 56 : 44,
                            ringColor: cfg.accent,
                            border: `2px solid ${cfg.accent}66`,
                          }}
                        />
                      ) : (
                        <div
                          className="rounded-full flex items-center justify-center font-black text-black"
                          style={{
                            width: isFirst ? 56 : 44,
                            height: isFirst ? 56 : 44,
                            background: cfg.accent,
                            fontSize: isFirst ? "1.2rem" : "1rem",
                          }}
                        >
                          {entry.username[0].toUpperCase()}
                        </div>
                      )}

                      {/* Username */}
                      <span
                        className="font-bold text-center text-white group-hover:text-twitch transition-colors w-full truncate text-center"
                        style={{ fontSize: isFirst ? "0.95rem" : "0.8rem" }}
                      >
                        {entry.display_name || entry.username}
                      </span>

                      {/* Points */}
                      <div className="text-center">
                        <span
                          className="font-black tabular-nums leading-none"
                          style={{ color: cfg.accent, fontSize: isFirst ? "1.4rem" : "1.1rem" }}
                        >
                          {entry.total_pts.toLocaleString()}
                        </span>
                        <span className="text-[10px] text-gray-500 ml-1">pts</span>
                      </div>

                      {/* Badge count */}
                      <span className="text-[10px] text-gray-600 font-medium tracking-wide">
                        {entry.badge_count} BADGE{entry.badge_count > 1 ? "S" : ""}
                      </span>

                      {/* Bottom glow line */}
                      <div
                        className="absolute bottom-0 left-1/2 -translate-x-1/2 h-px rounded-full opacity-60"
                        style={{ width: "60%", background: cfg.accent }}
                      />
                    </Link>
                  );
                })}
              </div>
            )}

            {/* ── DIVIDER ── */}
            {showPodium && top3.length > 0 && rest.length > 0 && (
              <div className="flex items-center gap-4">
                <div className="flex-1 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                <span className="text-[10px] tracking-[0.25em] text-gray-700 uppercase font-medium">
                  Suite du classement
                </span>
                <div className="flex-1 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
              </div>
            )}

            {/* ── REST OF LIST ── */}
            <div className="space-y-1">
              {rest.map((entry) => {
                const rColor =
                  entry.top_rarity !== "NONE"
                    ? RARITY_COLORS[entry.top_rarity] || "#666"
                    : "#333";
                const pct = (entry.total_pts / maxPts) * 100;

                return (
                  <Link
                    key={entry.username}
                    to={`/user/${entry.username}`}
                    className="relative flex items-center gap-4 px-4 py-3 rounded-xl overflow-hidden group transition-all duration-200 hover:bg-white/[0.035]"
                  >
                    {/* Progress bar bg */}
                    <div
                      className="absolute inset-y-0 left-0 opacity-[0.025] group-hover:opacity-[0.05] transition-opacity pointer-events-none"
                      style={{
                        width: `${pct}%`,
                        background: `linear-gradient(90deg, ${rColor}, transparent)`,
                      }}
                    />

                    {/* Left accent */}
                    <div
                      className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-6 rounded-full opacity-50"
                      style={{ background: rColor }}
                    />

                    {/* Rank */}
                    <span className="w-8 text-right text-xs font-bold text-gray-600 tabular-nums shrink-0">
                      {entry.rank}
                    </span>

                    {/* Avatar */}
                    {entry.avatar_url ? (
                      <img
                        src={entry.avatar_url}
                        alt={entry.username}
                        className="w-8 h-8 rounded-full object-cover shrink-0 opacity-80 group-hover:opacity-100 transition-opacity"
                        style={{ border: `1.5px solid ${rColor}55` }}
                      />
                    ) : (
                      <div
                        className="w-8 h-8 rounded-full shrink-0 flex items-center justify-center text-xs font-black text-black"
                        style={{ background: rColor + "cc" }}
                      >
                        {entry.username[0].toUpperCase()}
                      </div>
                    )}

                    {/* Username */}
                    <span className="flex-1 text-sm font-semibold text-gray-300 group-hover:text-white transition-colors truncate">
                      {entry.display_name || entry.username}
                    </span>

                    {/* Top rarity badge (small) */}
                    {entry.top_rarity !== "NONE" && (
                      <img
                        src={getBadgeImage(entry.top_rarity, "saison2")}
                        alt={entry.top_rarity}
                        className="w-6 h-6 object-contain shrink-0 opacity-60 group-hover:opacity-90 transition-opacity"
                      />
                    )}

                    {/* Badge count */}
                    <span className="hidden sm:block text-xs text-gray-700 tabular-nums shrink-0 font-medium">
                      {entry.badge_count} badges
                    </span>

                    {/* Points */}
                    <div className="shrink-0 text-right">
                      <span className="text-sm font-bold text-white tabular-nums">
                        {entry.total_pts.toLocaleString()}
                      </span>
                      <span className="text-[10px] text-gray-600 ml-1">pts</span>
                    </div>
                  </Link>
                );
              })}
            </div>

            {filtered.length === 0 && (
              <p className="text-center text-gray-700 py-20 text-sm tracking-wide">
                Aucun joueur trouvé.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
