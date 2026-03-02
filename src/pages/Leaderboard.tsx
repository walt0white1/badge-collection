import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { fetchLeaderboard } from "../api";
import { RARITY_COLORS } from "../types";
import { getBadgeImage } from "../badgeImages";

const PODIUM_CFG = [
  { accent: "#fbbf24", glow: "rgba(251,191,36,0.3)",  shadow: "rgba(251,191,36,0.15)", icon: "👑", label: "OR",     podiumH: 120 },
  { accent: "#94a3b8", glow: "rgba(148,163,184,0.2)", shadow: "rgba(148,163,184,0.08)", icon: "✦",  label: "ARGENT", podiumH: 80  },
  { accent: "#b45309", glow: "rgba(180,83,9,0.2)",   shadow: "rgba(180,83,9,0.08)",   icon: "✧",  label: "BRONZE", podiumH: 50  },
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
      <div className="max-w-[1400px] mx-auto px-6 sm:px-8 pt-10 pb-20">

        {/* ── Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
          <div>
            <p className="text-[10px] tracking-[0.35em] text-twitch/60 uppercase mb-1 font-medium">
              el_matte0 · Badge Collection
            </p>
            <h1
              style={{ fontFamily: "'Bebas Neue', sans-serif", letterSpacing: "0.04em" }}
              className="text-5xl sm:text-7xl leading-none text-white"
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
              <div className="relative py-8 sm:py-12">
                {/* Ambient background glows */}
                <div className="absolute inset-0 pointer-events-none overflow-hidden">
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] rounded-full opacity-[0.04]"
                    style={{ background: "radial-gradient(ellipse, #fbbf24, transparent 70%)" }} />
                  <div className="absolute top-1/2 left-[20%] -translate-y-1/2 w-[300px] h-[300px] rounded-full opacity-[0.03]"
                    style={{ background: "radial-gradient(ellipse, #94a3b8, transparent 70%)" }} />
                  <div className="absolute top-1/2 right-[20%] -translate-y-1/2 w-[300px] h-[300px] rounded-full opacity-[0.03]"
                    style={{ background: "radial-gradient(ellipse, #b45309, transparent 70%)" }} />
                </div>

                <div className="relative flex items-end justify-center gap-3 sm:gap-4 lg:gap-6 px-2">
                  {/* Order: 2nd · 1st · 3rd */}
                  {[top3[1], top3[0], top3[2]].map((entry, podiumSlot) => {
                    if (!entry) return <div key={`empty-${podiumSlot}`} className="flex-1 max-w-[260px]" />;
                    const rankIdx = entry.rank - 1;
                    const cfg = PODIUM_CFG[rankIdx];
                    const isFirst = entry.rank === 1;
                    const avatarSize = isFirst ? 88 : 72;

                    return (
                      <div key={entry.username} className="flex flex-col items-center flex-1" style={{ maxWidth: isFirst ? "280px" : "240px" }}>
                        {/* Player card */}
                        <Link
                          to={`/user/${entry.username}`}
                          className="relative flex flex-col items-center gap-3 sm:gap-4 rounded-2xl p-4 sm:p-6 lg:p-8 border transition-all duration-300 group w-full hover:scale-[1.02]"
                          style={{
                            background: `linear-gradient(160deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.015) 100%)`,
                            borderColor: cfg.accent + "44",
                            boxShadow: `0 0 60px ${cfg.shadow}, 0 0 1px ${cfg.accent}33, inset 0 1px 0 rgba(255,255,255,0.06)`,
                            backdropFilter: "blur(12px)",
                          }}
                        >
                          {/* Top shine line */}
                          <div
                            className="absolute top-0 left-[10%] right-[10%] h-px opacity-40"
                            style={{ background: `linear-gradient(90deg, transparent, ${cfg.accent}, transparent)` }}
                          />

                          {/* Rank badge */}
                          <div
                            className="absolute -top-4 -right-4 w-10 h-10 rounded-full flex items-center justify-center text-sm font-black shadow-lg ring-4 ring-gray-950"
                            style={{ background: cfg.accent, color: entry.rank === 1 ? "#000" : "#fff" }}
                          >
                            {entry.rank}
                          </div>

                          {/* Icon */}
                          <span className={`leading-none ${isFirst ? "text-3xl" : "text-2xl"}`}>{cfg.icon}</span>

                          {/* Avatar */}
                          <div className="relative">
                            <div
                              className="absolute inset-0 rounded-full blur-xl opacity-30 group-hover:opacity-50 transition-opacity"
                              style={{ background: cfg.accent, transform: "scale(1.5)" }}
                            />
                            <img
                              src={entry.avatar_url || `https://unavatar.io/twitch/${entry.username}`}
                              alt={entry.username}
                              className="rounded-full object-cover relative z-10"
                              style={{
                                width: avatarSize,
                                height: avatarSize,
                                border: `3px solid ${cfg.accent}66`,
                              }}
                              onError={(e) => {
                                const el = e.currentTarget as HTMLImageElement;
                                el.style.display = "none";
                                const fallback = el.nextElementSibling as HTMLElement;
                                if (fallback) fallback.style.display = "flex";
                              }}
                            />
                            <div
                              className="rounded-full items-center justify-center font-black text-black relative z-10"
                              style={{
                                display: "none",
                                width: avatarSize,
                                height: avatarSize,
                                background: cfg.accent,
                                fontSize: isFirst ? "1.4rem" : "1.1rem",
                              }}
                            >
                              {entry.username[0].toUpperCase()}
                            </div>
                          </div>

                          {/* Username */}
                          <span
                            className="font-bold text-center text-white group-hover:text-twitch transition-colors w-full truncate"
                            style={{ fontSize: isFirst ? "1.1rem" : "0.95rem" }}
                          >
                            {entry.display_name || entry.username}
                          </span>

                          {/* Points */}
                          <div className="text-center">
                            <span
                              className="font-black tabular-nums leading-none"
                              style={{ color: cfg.accent, fontSize: isFirst ? "2rem" : "1.5rem" }}
                            >
                              {entry.total_pts.toLocaleString()}
                            </span>
                            <span className="text-xs text-gray-500 ml-1">pts</span>
                          </div>

                          {/* Badge count + top rarity */}
                          <div className="flex items-center gap-2">
                            {entry.top_rarity !== "NONE" && (
                              <img
                                src={getBadgeImage(entry.top_rarity, "saison2")}
                                alt={entry.top_rarity}
                                className="w-5 h-5 object-contain opacity-70"
                              />
                            )}
                            <span className="text-[11px] text-gray-500 font-medium tracking-wide">
                              {entry.badge_count} BADGE{entry.badge_count > 1 ? "S" : ""}
                            </span>
                          </div>

                          {/* Bottom glow line */}
                          <div
                            className="absolute bottom-0 left-1/2 -translate-x-1/2 h-px rounded-full opacity-50"
                            style={{ width: "60%", background: cfg.accent }}
                          />
                        </Link>

                        {/* Podium block */}
                        <div
                          className="hidden sm:flex w-full items-center justify-center rounded-b-xl relative overflow-hidden"
                          style={{
                            height: cfg.podiumH,
                            background: `linear-gradient(180deg, ${cfg.accent}15 0%, ${cfg.accent}08 100%)`,
                            borderLeft: `1px solid ${cfg.accent}22`,
                            borderRight: `1px solid ${cfg.accent}22`,
                            borderBottom: `1px solid ${cfg.accent}22`,
                          }}
                        >
                          <span
                            className="text-4xl font-black opacity-[0.08] select-none"
                            style={{ fontFamily: "'Bebas Neue', sans-serif", letterSpacing: "0.1em" }}
                          >
                            {cfg.label}
                          </span>
                          {/* Horizontal lines decoration */}
                          <div className="absolute inset-0 pointer-events-none" style={{
                            backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 11px, ${cfg.accent}08 11px, ${cfg.accent}08 12px)`,
                          }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
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
                    className="relative flex items-center gap-5 px-5 py-3.5 rounded-xl overflow-hidden group transition-all duration-200 hover:bg-white/[0.035]"
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
                    <span className="w-10 text-right text-sm font-bold text-gray-600 tabular-nums shrink-0">
                      {entry.rank}
                    </span>

                    {/* Avatar */}
                    <img
                      src={entry.avatar_url || `https://unavatar.io/twitch/${entry.username}`}
                      alt={entry.username}
                      className="w-10 h-10 rounded-full object-cover shrink-0 opacity-80 group-hover:opacity-100 transition-opacity"
                      style={{ border: `2px solid ${rColor}55` }}
                      onError={(e) => {
                        const el = e.currentTarget as HTMLImageElement;
                        el.style.display = "none";
                        const fallback = el.nextElementSibling as HTMLElement;
                        if (fallback) fallback.style.display = "flex";
                      }}
                    />
                    <div
                      className="w-10 h-10 rounded-full shrink-0 items-center justify-center text-sm font-black text-black"
                      style={{ display: "none", background: rColor + "cc" }}
                    >
                      {entry.username[0].toUpperCase()}
                    </div>

                    {/* Username */}
                    <span className="flex-1 text-base font-semibold text-gray-300 group-hover:text-white transition-colors truncate">
                      {entry.display_name || entry.username}
                    </span>

                    {/* Top rarity badge */}
                    {entry.top_rarity !== "NONE" && (
                      <img
                        src={getBadgeImage(entry.top_rarity, "saison2")}
                        alt={entry.top_rarity}
                        className="w-7 h-7 object-contain shrink-0 opacity-60 group-hover:opacity-90 transition-opacity"
                      />
                    )}

                    {/* Badge count */}
                    <span className="hidden sm:block text-sm text-gray-600 tabular-nums shrink-0 font-medium min-w-[80px] text-right">
                      {entry.badge_count} badges
                    </span>

                    {/* Points */}
                    <div className="shrink-0 text-right min-w-[70px]">
                      <span className="text-base font-bold text-white tabular-nums">
                        {entry.total_pts.toLocaleString()}
                      </span>
                      <span className="text-[11px] text-gray-600 ml-1">pts</span>
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
