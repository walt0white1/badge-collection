import { useQuery } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { fetchLeaderboard, fetchWizebotRanking } from "../api";
import type { WizebotPeriod, WizebotType } from "../api";
import { RARITY_COLORS } from "../types";
import { getBadgeImage } from "../badgeImages";

/* ═══════════════════════════════════════════════════════
   CLASSEMENT — Cohesive with the site's purple/dark aesthetic.
   Uses site colors: #9146FF, rarity palette, #050508 bg.
   ═══════════════════════════════════════════════════════ */

type MainTab = "badges" | "uptime" | "messages";

const PODIUM_COLORS = ["#9146FF", "#a78bfa", "#7c3aed"];

const RARITY = [
  { key: "unique_count",    label: "Unique",     color: RARITY_COLORS.UNIQUE },
  { key: "legendary_count", label: "Légendaire", color: RARITY_COLORS.LEGENDARY },
  { key: "epic_count",      label: "Épique",     color: RARITY_COLORS.EPIC },
  { key: "rare_count",      label: "Rare",       color: RARITY_COLORS.RARE },
  { key: "common_count",    label: "Commun",     color: RARITY_COLORS.COMMON },
] as const;

/* ─── Helpers ──────────────────────────────────────── */

function formatSeconds(sec: number): string {
  if (!sec) return "—";
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  if (h === 0) return `${m}min`;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

function segments(entry: { badge_count: number; [k: string]: any }) {
  return RARITY.map(({ key, color }) => ({ count: entry[key] as number, color })).filter((s) => s.count > 0);
}

/* ═══════════════════════════════════════════════════════ */

export default function Leaderboard() {
  const [tab, setTab] = useState<MainTab>("badges");
  const [period, setPeriod] = useState<WizebotPeriod>("global");
  const [search, setSearch] = useState("");


  const { data: badgeData = [], isLoading: badgeLoading } = useQuery({ queryKey: ["leaderboard"], queryFn: fetchLeaderboard });
  const wizeType: WizebotType = tab === "messages" ? "message" : "uptime";
  const { data: wizeData = [], isLoading: wizeLoading } = useQuery({
    queryKey: ["wizebot", wizeType, period],
    queryFn: () => fetchWizebotRanking(wizeType, period),
    enabled: tab !== "badges",
  });

  const badgeMap = useMemo(() => new Map(badgeData.map((e) => [e.username.toLowerCase(), e])), [badgeData]);
  const filtered = useMemo(() => badgeData.filter((e) => e.username.toLowerCase().includes(search.toLowerCase())), [badgeData, search]);
  const filteredWize = useMemo(() => wizeData.filter((e) => e.user_name.toLowerCase().includes(search.toLowerCase())), [wizeData, search]);

  const maxPts = badgeData[0]?.total_pts || 1;
  const showPodium = tab === "badges" && !search && filtered.length >= 1;
  const top3 = showPodium ? filtered.slice(0, 3) : [];
  const rest = showPodium ? filtered.slice(3) : filtered;

  const showWizePodium = tab !== "badges" && !search && filteredWize.length >= 1;
  const wizeTop3 = showWizePodium ? filteredWize.slice(0, 3) : [];
  const wizeRest = showWizePodium ? filteredWize.slice(3) : filteredWize;
  const loading = tab === "badges" ? badgeLoading : wizeLoading;

  const tabs: { id: MainTab; label: string }[] = [
    { id: "badges", label: "Badges" },
    { id: "uptime", label: "Uptime" },
    { id: "messages", label: "Messages" },
  ];

  const periods: { v: WizebotPeriod; label: string }[] = [
    { v: "week", label: "Semaine" },
    { v: "month", label: "Mois" },
    { v: "global", label: "Global" },
  ];

  return (
    <div className="min-h-screen overflow-x-hidden">

      <div className="max-w-[1400px] mx-auto px-4 sm:px-8 pt-6 sm:pt-10 pb-28">

        {/* ━━━ HEADER ━━━ */}
        <header className="mb-6 sm:mb-10">
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight leading-[0.92] text-white">
            Classement
          </h1>
          <p className="mt-2 sm:mt-3 text-gray-500 text-sm sm:text-base max-w-md">
            Les meilleurs collectionneurs de badges de la communauté.
          </p>
        </header>

        {/* ━━━ CONTROLS BAR ━━━ */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-6 sm:mb-10">
          {/* Tabs */}
          <div className="inline-flex bg-[#1c1c1e] rounded-xl p-1 gap-0.5">
            {tabs.map(({ id, label }) => (
              <button
                key={id}
                onClick={() => setTab(id)}
                className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                  tab === id
                    ? "bg-[#2c2c2e] text-white"
                    : "text-[#86868b] hover:text-white"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Periods */}
          {tab !== "badges" && (
            <div className="inline-flex bg-[#1c1c1e] rounded-xl p-1 gap-0.5">
              {periods.map(({ v, label }) => (
                <button
                  key={v}
                  onClick={() => setPeriod(v)}
                  className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all duration-200 ${
                    period === v
                      ? "bg-[#2c2c2e] text-white"
                      : "text-[#86868b] hover:text-white"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          )}

          {/* Search — pushed right on desktop, full width on mobile */}
          <div className="relative w-full sm:w-auto sm:ml-auto">
            <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Rechercher..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full sm:w-56 pl-10 pr-4 py-2.5 rounded-xl text-sm bg-[#1c1c1e] text-white placeholder-[#3a3a3c] focus:outline-none focus:bg-[#2c2c2e] transition-all"
            />
          </div>
        </div>

        {/* ━━━ LOADING ━━━ */}
        {loading ? (
          <div className="flex justify-center py-32">
            <div className="w-8 h-8 rounded-full border-2 border-[#9146FF]/20 border-t-[#9146FF] animate-spin" />
          </div>
        ) : (
          <>
            {/* ━━━ BADGES TAB ━━━ */}
            {tab === "badges" && (
              <div>

                {/* ── TOP 3 PODIUM ── */}
                {showPodium && top3.length > 0 && (
                  <div className="relative mb-8 sm:mb-16">

                    <div className="grid grid-cols-3 items-end gap-2 sm:gap-4">
                      {[top3[1], top3[0], top3[2]].map((entry) => {
                        if (!entry) return <div key={Math.random()} />;
                        const ri = entry.rank - 1;
                        const accent = PODIUM_COLORS[ri];
                        const isFirst = ri === 0;

                        return (
                          <Link key={entry.username} to={`/user/${entry.username}`} className="group flex flex-col items-center">
                            {/* Rank badge */}
                            <span className="text-[10px] sm:text-[11px] font-black tracking-[0.15em] uppercase mb-2 sm:mb-3"
                              style={{ color: accent }}>
                              {["1er", "2ème", "3ème"][ri]}
                            </span>

                            {/* Avatar */}
                            <div className="relative mb-2 sm:mb-3">
                              <img
                                src={entry.avatar_url || `https://unavatar.io/twitch/${entry.username}`}
                                alt={entry.username}
                                className={`rounded-full object-cover transition-all duration-500 group-hover:scale-110 ${isFirst ? "w-20 h-20 sm:w-[104px] sm:h-[104px]" : "w-14 h-14 sm:w-[76px] sm:h-[76px]"}`}
                                style={{
                                  border: "2px solid rgba(255,255,255,0.12)",
                                }}
                                onError={(e) => { (e.currentTarget as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${entry.username[0]}&background=${accent.slice(1)}&color=fff&bold=true&size=128`; }}
                              />
                              {isFirst && (
                                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                                  <svg className="w-5 h-5 sm:w-7 sm:h-7" viewBox="0 0 24 24" style={{ filter: `drop-shadow(0 0 6px ${accent}80)` }}>
                                    <path d="M5 16L3 5l5.5 5L12 4l3.5 6L21 5l-2 11H5z" fill={accent} />
                                  </svg>
                                </div>
                              )}
                            </div>

                            {/* Name */}
                            <p className={`text-center font-semibold text-white truncate max-w-full px-1 ${isFirst ? "text-sm sm:text-base" : "text-xs sm:text-sm"}`}>
                              {entry.display_name || entry.username}
                            </p>

                            {/* Points */}
                            <p className="text-center mt-0.5">
                              <span className={`font-black tabular-nums ${isFirst ? "text-xl sm:text-3xl" : "text-lg sm:text-2xl"}`}
                                style={{ color: accent }}>
                                {entry.total_pts}
                              </span>
                              <span className="text-[10px] sm:text-xs text-gray-600 ml-1">pts</span>
                            </p>
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* ── LIST ── */}
                <div className="rounded-2xl overflow-hidden bg-[#111111]">
                  {rest.map((entry, idx) => {
                    const isTop10 = entry.rank <= 10;
                    const isTop3 = entry.rank <= 3;

                    return (
                      <Link
                        key={entry.username}
                        to={`/user/${entry.username}`}
                        className="group relative flex items-center gap-4 sm:gap-5 px-5 sm:px-6 py-4 overflow-hidden transition-all duration-200"
                        style={{ borderTop: idx > 0 ? "1px solid var(--border)" : "none" }}
                      >
                        {/* Hover sweep */}
                        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                          style={{ background: "linear-gradient(90deg, rgba(145,70,255,0.06) 0%, transparent 60%)" }} />

                        {/* Rank */}
                        <span className="w-9 text-right shrink-0 tabular-nums font-black relative select-none"
                          style={{
                            fontSize: isTop10 ? "1.15rem" : "0.9rem",
                            color: isTop3 ? "transparent" : isTop10 ? "#9146FF" : "var(--text-faint)",
                            backgroundImage: isTop3 ? "linear-gradient(135deg, #9146FF, #e879f9)" : "none",
                            WebkitBackgroundClip: isTop3 ? "text" : "unset",
                            backgroundClip: isTop3 ? "text" : "unset",
                          }}>
                          {entry.rank}
                        </span>

                        {/* Avatar */}
                        <img
                          src={entry.avatar_url || `https://unavatar.io/twitch/${entry.username}`}
                          alt={entry.username}
                          className="w-11 h-11 sm:w-12 sm:h-12 rounded-full object-cover shrink-0 relative transition-transform duration-300 group-hover:scale-105"
                          style={{
                            border: `2px solid rgba(145,70,255,${isTop3 ? "0.5" : isTop10 ? "0.2" : "0.07"})`,
                            boxShadow: isTop3 ? "0 0 18px rgba(145,70,255,0.35)" : isTop10 ? "0 0 8px rgba(145,70,255,0.15)" : "none",
                          }}
                          onError={(e) => { (e.currentTarget as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${entry.username[0]}&background=1a1a2e&color=9146FF&bold=true&size=96`; }}
                        />

                        {/* Name + badges */}
                        <div className="flex-1 min-w-0 relative">
                          <div className="text-[15px] font-semibold text-gray-200 group-hover:text-white transition-colors truncate leading-tight">
                            {entry.display_name || entry.username}
                          </div>
                          <div className="text-[11px] text-gray-600 font-medium mt-0.5">
                            {entry.badge_count} badge{entry.badge_count > 1 ? "s" : ""}
                          </div>
                        </div>

                        {/* Points */}
                        <div className="shrink-0 text-right relative">
                          <span className="font-black tabular-nums"
                            style={{
                              fontSize: isTop10 ? "1.25rem" : "1rem",
                              color: isTop3 ? "#e879f9" : isTop10 ? "#c4b5fd" : "#555",
                            }}>
                            {entry.total_pts}
                          </span>
                          <span className="text-[11px] text-gray-700 ml-1">pts</span>
                        </div>
                      </Link>
                    );
                  })}
                </div>

                {filtered.length === 0 && (
                  <div className="text-center py-28">
                    <p className="text-sm text-gray-600">Aucun joueur trouvé.</p>
                  </div>
                )}
              </div>
            )}

            {/* ━━━ UPTIME / MESSAGES ━━━ */}
            {tab !== "badges" && (
              <div>

                {/* ── TOP 3 PODIUM ── */}
                {showWizePodium && wizeTop3.length > 0 && (
                  <div className="relative mb-8 sm:mb-16">
                    <div className="grid grid-cols-3 items-end gap-2 sm:gap-4">
                      {[wizeTop3[1], wizeTop3[0], wizeTop3[2]].map((entry, displayIdx) => {
                        if (!entry) return <div key={`empty-${displayIdx}`} />;
                        const ri = [1, 0, 2][displayIdx];
                        const accent = PODIUM_COLORS[ri];
                        const isFirst = ri === 0;
                        const badge = badgeMap.get(entry.user_name.toLowerCase());
                        const value = parseInt(entry.value, 10);
                        const display = tab === "uptime" ? formatSeconds(value) : value.toLocaleString();

                        return (
                          <Link key={entry.user_uid} to={`/user/${entry.user_name}`} className="group flex flex-col items-center">
                            {/* Rank badge */}
                            <span className="text-[10px] sm:text-[11px] font-black tracking-[0.15em] uppercase mb-2 sm:mb-3"
                              style={{ color: accent }}>
                              {["1er", "2ème", "3ème"][ri]}
                            </span>

                            {/* Avatar */}
                            <div className="relative mb-2 sm:mb-3">
                              <img
                                src={badge?.avatar_url || `https://unavatar.io/twitch/${entry.user_name}`}
                                alt={entry.user_name}
                                className={`rounded-full object-cover transition-all duration-500 group-hover:scale-110 ${isFirst ? "w-20 h-20 sm:w-[104px] sm:h-[104px]" : "w-14 h-14 sm:w-[76px] sm:h-[76px]"}`}
                                style={{
                                  border: "2px solid rgba(255,255,255,0.12)",
                                }}
                                onError={(e) => { (e.currentTarget as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${entry.user_name[0]}&background=${accent.slice(1)}&color=fff&bold=true&size=128`; }}
                              />
                              {isFirst && (
                                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                                  <svg className="w-5 h-5 sm:w-7 sm:h-7" viewBox="0 0 24 24" style={{ filter: `drop-shadow(0 0 6px ${accent}80)` }}>
                                    <path d="M5 16L3 5l5.5 5L12 4l3.5 6L21 5l-2 11H5z" fill={accent} />
                                  </svg>
                                </div>
                              )}
                            </div>

                            {/* Name */}
                            <p className={`text-center font-semibold text-white truncate max-w-full px-1 ${isFirst ? "text-sm sm:text-base" : "text-xs sm:text-sm"}`}>
                              {badge?.display_name || entry.user_name}
                            </p>

                            {/* Value */}
                            <p className="text-center mt-0.5">
                              <span className={`font-black tabular-nums ${isFirst ? "text-xl sm:text-3xl" : "text-lg sm:text-2xl"}`}
                                style={{ color: accent }}>
                                {display}
                              </span>
                            </p>
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* ── LIST ── */}
                <div className="rounded-2xl overflow-hidden bg-[#111111]">
                  {wizeRest.map((entry, idx) => {
                    const rank = (showWizePodium ? 3 : 0) + idx + 1;
                    const isTop10 = rank <= 10;
                    const isTop3 = rank <= 3;
                    const value = parseInt(entry.value, 10);
                    const display = tab === "uptime" ? formatSeconds(value) : value.toLocaleString();
                    const badge = badgeMap.get(entry.user_name.toLowerCase());

                    return (
                      <Link
                        key={entry.user_uid}
                        to={`/user/${entry.user_name}`}
                        className="group relative flex items-center gap-4 sm:gap-5 px-5 sm:px-6 py-4 overflow-hidden transition-all duration-200"
                        style={{ borderTop: idx > 0 ? "1px solid var(--border)" : "none" }}
                      >
                        {/* Hover sweep */}
                        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                          style={{ background: "linear-gradient(90deg, rgba(145,70,255,0.06) 0%, transparent 60%)" }} />

                        {/* Rank */}
                        <span className="w-9 text-right shrink-0 tabular-nums font-black relative select-none"
                          style={{
                            fontSize: isTop10 ? "1.15rem" : "0.9rem",
                            color: isTop3 ? "transparent" : isTop10 ? "#9146FF" : "var(--text-faint)",
                            backgroundImage: isTop3 ? "linear-gradient(135deg, #9146FF, #e879f9)" : "none",
                            WebkitBackgroundClip: isTop3 ? "text" : "unset",
                            backgroundClip: isTop3 ? "text" : "unset",
                          }}>
                          {rank}
                        </span>

                        {/* Avatar */}
                        <img
                          src={badge?.avatar_url || `https://unavatar.io/twitch/${entry.user_name}`}
                          alt={entry.user_name}
                          className="w-11 h-11 sm:w-12 sm:h-12 rounded-full object-cover shrink-0 relative transition-transform duration-300 group-hover:scale-105"
                          style={{
                            border: `2px solid rgba(145,70,255,${isTop3 ? "0.5" : isTop10 ? "0.2" : "0.07"})`,
                            boxShadow: isTop3 ? "0 0 18px rgba(145,70,255,0.35)" : isTop10 ? "0 0 8px rgba(145,70,255,0.15)" : "none",
                          }}
                          onError={(e) => { (e.currentTarget as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${entry.user_name[0]}&background=1a1a2e&color=9146FF&bold=true&size=96`; }}
                        />

                        {/* Name + badge info */}
                        <div className="flex-1 min-w-0 relative">
                          <div className="text-[15px] font-semibold text-gray-200 group-hover:text-white transition-colors truncate leading-tight">
                            {badge?.display_name || entry.user_name}
                          </div>
                          {badge ? (
                            <div className="flex items-center gap-2 mt-0.5">
                              {badge.top_rarity !== "NONE" && <img src={getBadgeImage(badge.top_rarity, "saison2")} alt="" className="w-3.5 h-3.5 object-contain opacity-60" />}
                              <span className="text-[11px] text-gray-600 font-medium">{badge.badge_count} badges · {badge.total_pts} pts</span>
                            </div>
                          ) : (
                            <span className="text-[11px] text-gray-600 font-medium">Pas de badges</span>
                          )}
                        </div>

                        {/* Value */}
                        <div className="shrink-0 text-right relative">
                          <span className="font-black tabular-nums"
                            style={{
                              fontSize: isTop10 ? "1.25rem" : "1rem",
                              color: isTop3 ? "#e879f9" : isTop10 ? "#c4b5fd" : "#555",
                            }}>
                            {display}
                          </span>
                          <div className="text-[10px] text-gray-700 mt-0.5">
                            {tab === "uptime" ? "de stream" : "messages"}
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>

                {filteredWize.length === 0 && (
                  <div className="text-center py-28">
                    <p className="text-sm text-gray-600">Aucune donnée.</p>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
