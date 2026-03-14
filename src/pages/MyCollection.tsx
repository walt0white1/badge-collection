import { useState, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../hooks/useAuth";
import { useTheme } from "../context/ThemeContext";
import { Link } from "react-router-dom";
import ArcRow from "../components/ArcRow";
import ShareCardModal from "../components/ShareCardModal";
import { ARC_CONFIG } from "../arcConfig";
import ScratchTicket from "../components/ScratchTicket";
import { canClaimTicket, claimTicket, getMyTickets, scratchTicket } from "../api";
import { RARITY_ORDER, RARITY_COLORS, RARITY_POINTS } from "../types";
import { getBadgeImage } from "../badgeImages";
import type { LotteryTicket } from "../types";

function countBadges(list: string[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const r of RARITY_ORDER) counts[r.toLowerCase()] = 0;
  for (const b of list) {
    const key = b.toLowerCase();
    counts[key] = (counts[key] || 0) + 1;
  }
  return counts;
}

export default function MyCollection() {
  const { user, refresh } = useAuth();
  const { isDark } = useTheme();
  const queryClient = useQueryClient();
  const [showShareCard, setShowShareCard] = useState(false);
  const [claiming, setClaiming] = useState(false);
  const [claimError, setClaimError] = useState("");
  const [currentIdx, setCurrentIdx] = useState(0);
  const [sessionResults, setSessionResults] = useState<{ rarity: string; season: string }[]>([]);
  const [revealingAll, setRevealingAll] = useState(false);
  const [bulkResults, setBulkResults] = useState<{ rarity: string; season: string }[]>([]);
  const [showSummary, setShowSummary] = useState(false);

  const { data: ticketAvailable, refetch: refetchTicket } = useQuery({
    queryKey: ["canClaimTicket"],
    queryFn: canClaimTicket,
    enabled: !!user,
  });

  const { data: tickets = [] } = useQuery({
    queryKey: ["myTickets"],
    queryFn: getMyTickets,
    enabled: !!user,
  });

  if (!user) return null;

  const seasons = Object.keys(user.badges).sort().reverse();

  const totalBadges = Object.values(user.badges).reduce(
    (sum, list) => sum + (Array.isArray(list) ? list.length : 0),
    0,
  );

  const allRarityCounts: Record<string, number> = {};
  for (const r of RARITY_ORDER) allRarityCounts[r] = 0;
  for (const list of Object.values(user.badges)) {
    if (!Array.isArray(list)) continue;
    for (const b of list) allRarityCounts[b.toUpperCase()] = (allRarityCounts[b.toUpperCase()] || 0) + 1;
  }

  // Best rarity owned
  const topRarity = [...RARITY_ORDER].reverse().find((r) => allRarityCounts[r] > 0) || null;
  const topRarityColor = topRarity ? RARITY_COLORS[topRarity] : null;

  const unscratchedTickets = tickets.filter((t) => !t.scratched);
  const scratchedCount = tickets.filter((t) => t.scratched).length;
  const remaining = unscratchedTickets.length - currentIdx;
  const topTicket = unscratchedTickets[currentIdx] ?? null;

  const handleClaim = async () => {
    setClaiming(true);
    setClaimError("");
    try {
      await claimTicket();
      queryClient.invalidateQueries({ queryKey: ["myTickets"] });
      refetchTicket();
    } catch (err: any) {
      setClaimError(err.message || "Erreur");
    } finally {
      setClaiming(false);
    }
  };

  const handleScratched = useCallback((rarity: string) => {
    const season = topTicket?.season || "saison2";
    setSessionResults((prev) => [...prev, { rarity, season }]);
    // Don't refresh data here — it would re-render and kill the reveal animation.
    // Data refresh happens on dismiss instead.
  }, [topTicket]);

  const handleDismiss = useCallback(() => {
    setCurrentIdx((prev) => {
      const nextIdx = prev + 1;
      // If that was the last ticket, show the session summary
      if (nextIdx >= unscratchedTickets.length) {
        // Small delay so the dismiss animation finishes first
        setTimeout(() => setShowSummary(true), 450);
      }
      return nextIdx;
    });
    // Refresh data now that user dismissed the reveal
    queryClient.invalidateQueries({ queryKey: ["myTickets"] });
    refetchTicket();
    refresh();
  }, [queryClient, refetchTicket, refresh, unscratchedTickets.length]);

  const handleRevealAll = useCallback(async () => {
    const toReveal = unscratchedTickets.slice(currentIdx);
    if (toReveal.length === 0) return;
    setRevealingAll(true);
    const results: { rarity: string; season: string }[] = [];
    for (const t of toReveal) {
      try {
        const rarity = await scratchTicket(t.id);
        results.push({ rarity, season: t.season });
        setBulkResults([...results]);
        await new Promise((r) => setTimeout(r, 400));
      } catch {
        break;
      }
    }
    setBulkResults(results);
    setSessionResults((prev) => [...prev, ...results]);
    setShowSummary(true);
    setRevealingAll(false);
    setCurrentIdx(unscratchedTickets.length);
    queryClient.invalidateQueries({ queryKey: ["myTickets"] });
    refetchTicket();
    refresh();
  }, [unscratchedTickets, currentIdx, queryClient, refetchTicket, refresh]);

  // Stack cards behind the top one (up to 3 visible)
  const stackCards = Math.min(remaining > 0 ? remaining - 1 : 0, 3);

  return (
    <div className="max-w-[1400px] mx-auto px-4 sm:px-6 md:px-8 pb-6 sm:pb-10 space-y-8 sm:space-y-10">

      {/* ── Header ── */}
      <div className="relative text-center pt-10 pb-10 sm:pt-16 sm:pb-14">
        {/* Layered ambient glow — extends above into navbar area */}
        <div className="absolute -top-20 left-0 right-0 bottom-0 pointer-events-none">
          <div
            className="absolute left-1/2 -translate-x-1/2 top-0 w-[600px] h-[350px] rounded-full blur-[120px] opacity-[0.06]"
            style={{ background: topRarityColor || "#9146FF" }}
          />
          <div
            className="absolute left-1/2 -translate-x-1/2 top-10 w-[250px] h-[250px] rounded-full blur-[80px] opacity-[0.1]"
            style={{ background: "#9146FF" }}
          />
        </div>

        {/* Avatar */}
        <div className="relative inline-block mb-5">
          <div
            className="absolute inset-0 rounded-full blur-3xl opacity-20"
            style={{ background: "#9146FF", transform: "scale(2.2)" }}
          />
          <img
            src={user.twitch_profile_image}
            alt=""
            className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-full z-10"
            style={{
              boxShadow: isDark
                ? "0 0 0 2px rgba(145,70,255,0.3), 0 0 40px rgba(145,70,255,0.15), 0 16px 48px rgba(0,0,0,0.5)"
                : "0 0 0 2px rgba(145,70,255,0.2), 0 0 40px rgba(145,70,255,0.08), 0 16px 48px rgba(0,0,0,0.1)",
            }}
          />
        </div>

        {/* Name */}
        <h1
          className="text-3xl sm:text-5xl font-black tracking-tight"
          style={{ color: isDark ? "#f5f5f7" : "#1d1d1f" }}
        >
          {user.twitch_display_name}
        </h1>

        {/* Stats row */}
        <div className="flex items-center justify-center gap-5 sm:gap-7 mt-5">
          {[
            { value: user.total_pts, label: "points", color: "#9146FF" },
            { value: totalBadges, label: "badges", color: isDark ? "#f5f5f7" : "#1d1d1f" },
            { value: seasons.length, label: seasons.length > 1 ? "saisons" : "saison", color: isDark ? "#f5f5f7" : "#1d1d1f" },
            ...(topRarity ? [{ value: topRarity.charAt(0) + topRarity.slice(1).toLowerCase(), label: "meilleure", color: topRarityColor! }] : []),
          ].map((stat, i, arr) => (
            <div key={stat.label} className="flex items-center gap-5 sm:gap-7">
              <div className="text-center">
                <p className="text-xl sm:text-2xl font-black tabular-nums leading-tight" style={{ color: stat.color }}>
                  {stat.value}
                </p>
                <p
                  className="text-[10px] sm:text-[11px] mt-0.5 font-medium uppercase tracking-wider"
                  style={{ color: isDark ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.3)" }}
                >
                  {stat.label}
                </p>
              </div>
              {i < arr.length - 1 && (
                <div
                  className="w-px h-7 sm:h-8"
                  style={{ background: isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.07)" }}
                />
              )}
            </div>
          ))}
        </div>

        {/* Action buttons */}
        <div className="flex items-center justify-center gap-3 mt-7">
          <button
            onClick={() => setShowShareCard(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-200 hover:scale-[1.04]"
            style={{
              background: isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.05)",
              color: isDark ? "rgba(255,255,255,0.6)" : "rgba(0,0,0,0.5)",
            }}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            Partager
          </button>
          <Link
            to="/trades"
            className="flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold text-white transition-all duration-200 hover:scale-[1.04]"
            style={{ background: "#9146FF" }}
          >
            Mes échanges
          </Link>
        </div>

        {/* Bottom separator */}
        <div
          className="absolute bottom-0 left-[10%] right-[10%] h-px"
          style={{ background: `linear-gradient(to right, transparent, ${isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.08)"}, transparent)` }}
        />
      </div>

      {/* ── Tickets ── */}
      {remaining > 0 || ticketAvailable ? (
        <div className="text-center space-y-6">
          {/* Title row */}
          <div className="flex items-center justify-center gap-3">
            <h2
              className="text-lg sm:text-xl font-bold tracking-tight"
              style={{ color: isDark ? "#f5f5f7" : "#1d1d1f" }}
            >
              Tickets a gratter
            </h2>
            <span
              className="text-xs font-semibold px-2.5 py-1 rounded-full"
              style={{
                background: isDark ? "rgba(145,70,255,0.12)" : "rgba(145,70,255,0.08)",
                color: "#9146FF",
              }}
            >
              {remaining}
            </span>
          </div>

          {/* Scratch card — centered, contained */}
          <div className="flex flex-col items-center gap-5">
            <div className="relative w-52 sm:w-56 aspect-[3/4]">
              {/* Stack cards behind */}
              {Array.from({ length: stackCards }).map((_, i) => {
                const depth = stackCards - i;
                return (
                  <div
                    key={`stack-${depth}`}
                    className="absolute inset-0 rounded-2xl"
                    style={{
                      transform: `translateY(${depth * 4}px) scale(${1 - depth * 0.03})`,
                      zIndex: -depth,
                      background: isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.03)",
                      border: `1px solid ${isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)"}`,
                    }}
                  />
                );
              })}

              {/* Top card */}
              {topTicket && (
                <div className="relative z-10">
                  <ScratchTicket
                    key={topTicket.id}
                    ticket={topTicket}
                    onScratched={handleScratched}
                    onDismiss={handleDismiss}
                  />
                </div>
              )}

              {/* Counter */}
              {remaining > 1 && (
                <div className="absolute -top-2 -right-2 z-20 bg-[#9146FF] text-white text-[11px] font-black w-7 h-7 rounded-full flex items-center justify-center shadow-lg">
                  {remaining}
                </div>
              )}
            </div>

            {/* Helper text */}
            {remaining > 0 && !revealingAll && (
              <p
                className="text-xs"
                style={{ color: isDark ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.3)" }}
              >
                Gratte pour reveler ton badge
              </p>
            )}

            {/* Reveal all */}
            {remaining > 1 && !revealingAll && (
              <button
                onClick={handleRevealAll}
                className="text-xs font-medium transition-colors"
                style={{ color: isDark ? "rgba(255,255,255,0.25)" : "rgba(0,0,0,0.25)" }}
              >
                Tout reveler ({remaining})
              </button>
            )}

            {/* Bulk reveal */}
            {revealingAll && (
              <div className="flex items-center gap-2.5">
                <div className="w-3.5 h-3.5 border-2 border-[#9146FF] border-t-transparent rounded-full animate-spin" />
                <span
                  className="text-sm"
                  style={{ color: isDark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.4)" }}
                >
                  {bulkResults.length}/{unscratchedTickets.length - currentIdx}
                </span>
              </div>
            )}
          </div>

          {/* Claim button */}
          {ticketAvailable && (
            <button
              onClick={handleClaim}
              disabled={claiming}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold transition-all disabled:opacity-50 hover:scale-[1.03]"
              style={{
                background: "linear-gradient(135deg, rgba(234,179,8,0.15), rgba(145,70,255,0.15))",
                border: `1px solid ${isDark ? "rgba(234,179,8,0.2)" : "rgba(234,179,8,0.3)"}`,
                color: isDark ? "#fbbf24" : "#b45309",
              }}
            >
              {claiming ? (
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
              ) : (
                <span>+</span>
              )}
              Reclamer un ticket
            </button>
          )}

          {claimError && <p className="text-sm text-red-400">{claimError}</p>}

          {/* Session results */}
          {sessionResults.length > 0 && (
            <div className="space-y-3">
              <div className="flex flex-wrap gap-2 justify-center">
                {sessionResults.map((r, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg"
                    style={{
                      background: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)",
                      border: `1px solid ${isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)"}`,
                    }}
                  >
                    <img src={getBadgeImage(r.rarity, r.season)} alt="" className="w-5 h-5 object-contain" />
                    <span className="text-[10px] font-bold uppercase" style={{ color: RARITY_COLORS[r.rarity] }}>
                      {r.rarity}
                    </span>
                  </div>
                ))}
              </div>
              {remaining === 0 && (
                <button
                  onClick={() => setShowSummary(true)}
                  className="text-xs font-medium text-[#9146FF] hover:underline"
                >
                  Voir le recap
                </button>
              )}
            </div>
          )}
        </div>
      ) : scratchedCount > 0 ? (
        <div className="flex items-center justify-center gap-2 py-1">
          <span
            className="text-xs"
            style={{ color: isDark ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.25)" }}
          >
            {scratchedCount} ticket{scratchedCount > 1 ? "s" : ""} gratte{scratchedCount > 1 ? "s" : ""}
          </span>
        </div>
      ) : null}

      {/* ── Session Summary Modal ── */}
      {showSummary && sessionResults.length > 0 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-[#1c1c1e] rounded-2xl p-6 sm:p-8 max-w-lg w-full space-y-6 animate-[fadeIn_0.3s_ease-out]">
            <div className="text-center">
              <h3 className="text-xl font-black text-white">Pack Opening</h3>
              <p className="text-sm text-gray-500 mt-1">
                {sessionResults.length} badge{sessionResults.length > 1 ? "s" : ""} revele{sessionResults.length > 1 ? "s" : ""}
              </p>
            </div>

            <div className="flex flex-wrap justify-center gap-3">
              {sessionResults.map((r, i) => (
                <div
                  key={i}
                  className="flex flex-col items-center gap-2 p-2 rounded-xl bg-white/[0.03] border border-white/[0.06] animate-[badgePopIn_0.4s_ease-out_forwards]"
                  style={{ animationDelay: `${i * 80}ms`, opacity: 0 }}
                >
                  <img
                    src={getBadgeImage(r.rarity, r.season)}
                    alt={r.rarity}
                    className="w-16 h-16 object-contain"
                    style={{ filter: `drop-shadow(0 0 10px ${RARITY_COLORS[r.rarity]}60)` }}
                  />
                  <span className="text-[10px] font-bold uppercase" style={{ color: RARITY_COLORS[r.rarity] }}>
                    {r.rarity}
                  </span>
                </div>
              ))}
            </div>

            {/* Points total */}
            <div className="text-center space-y-1">
              <span className="text-twitch font-black text-2xl">
                +{sessionResults.reduce((sum, r) => sum + (RARITY_POINTS[r.rarity] || 0), 0)} pts
              </span>
              <p className="text-xs text-gray-600">ajoutes a ta collection</p>
            </div>

            <button
              onClick={() => {
                setShowSummary(false);
                setBulkResults([]);
                setSessionResults([]);
                setCurrentIdx(0);
              }}
              className="w-full py-3 bg-twitch/20 hover:bg-twitch/30 border border-twitch/30 text-twitch text-sm font-semibold rounded-xl transition-colors"
            >
              Fermer
            </button>
          </div>

          <style>{`
            @keyframes fadeIn { 0% { opacity: 0; transform: scale(0.95); } 100% { opacity: 1; transform: scale(1); } }
            @keyframes badgePopIn { 0% { opacity: 0; transform: scale(0.5); } 100% { opacity: 1; transform: scale(1); } }
          `}</style>
        </div>
      )}

      {/* ── Arcs ── */}
      <div className="relative">
        {/* Vertical line connecting arcs — desktop only */}
        <div
          className="hidden lg:block absolute left-[22px] top-0 bottom-0 w-px pointer-events-none"
          style={{ background: `linear-gradient(to bottom, transparent, ${isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.2)"}, transparent)` }}
        />

        <div className="space-y-10">
          {seasons.map((season, idx) => {
            const currentList = user.badges[season] || [];
            const counts = countBadges(currentList);
            const seasonPts = currentList.reduce(
              (sum, b) => sum + (RARITY_POINTS[b.toUpperCase()] || 0),
              0,
            );
            const arc = ARC_CONFIG[season] || {
              name: season.replace("saison", "Saison "),
              subtitle: "",
              status: "archive" as const,
            };

            return (
              <div key={season}>
                <ArcRow
                  season={season}
                  counts={counts}
                  arc={arc}
                  totalBadges={currentList.length}
                  totalPts={seasonPts}
                />
                {idx < seasons.length - 1 && (
                  <div
                    className="lg:hidden mx-auto w-[60%] max-w-[400px] h-px mt-10"
                    style={{ background: `linear-gradient(to right, transparent, ${isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.15)"}, transparent)` }}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {seasons.length === 0 && tickets.length === 0 && (
        <p className="text-center text-gray-500 py-10">
          Aucun badge.
        </p>
      )}

      {showShareCard && (
        <ShareCardModal user={user} onClose={() => setShowShareCard(false)} />
      )}
    </div>
  );
}
