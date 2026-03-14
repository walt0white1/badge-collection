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
    <div className="max-w-[1400px] mx-auto px-4 sm:px-6 md:px-8 py-6 sm:py-10 space-y-8 sm:space-y-10">

      {/* ── Header ── */}
      <div
        className="rounded-2xl overflow-hidden"
        style={{
          background: isDark ? "#1c1c1e" : "#ffffff",
          border: `1px solid ${isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.07)"}`,
          boxShadow: isDark ? "none" : "0 1px 3px rgba(0,0,0,0.07), 0 8px 32px rgba(0,0,0,0.04)",
        }}
      >
        <div className="p-5 sm:p-7">
          <div className="flex items-start gap-4 sm:gap-5">
            {/* Avatar */}
            <img
              src={user.twitch_profile_image}
              alt=""
              className="w-14 h-14 sm:w-[72px] sm:h-[72px] rounded-2xl shrink-0"
              style={{ boxShadow: "0 4px 20px rgba(0,0,0,0.18)" }}
            />

            {/* Name + stats */}
            <div className="flex-1 min-w-0 pt-0.5">
              <h1
                className="text-xl sm:text-2xl font-bold tracking-tight truncate"
                style={{ color: isDark ? "#f5f5f7" : "#1d1d1f" }}
              >
                {user.twitch_display_name}
              </h1>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <span className="text-sm font-semibold" style={{ color: "#9146FF" }}>
                  {user.total_pts} pts
                </span>
                <span style={{ color: isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.15)" }}>·</span>
                <span className="text-sm" style={{ color: isDark ? "rgba(255,255,255,0.45)" : "rgba(0,0,0,0.45)" }}>
                  {totalBadges} badge{totalBadges > 1 ? "s" : ""}
                </span>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex gap-2 shrink-0">
              <button
                onClick={() => setShowShareCard(true)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-colors"
                style={{
                  background: isDark ? "rgba(255,255,255,0.07)" : "#f2f2f7",
                  color: isDark ? "rgba(255,255,255,0.7)" : "rgba(0,0,0,0.6)",
                }}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span className="hidden sm:inline">Partager</span>
              </button>
              <Link
                to="/trades"
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium text-white transition-colors"
                style={{ background: "#9146FF" }}
              >
                Mes échanges
              </Link>
            </div>
          </div>

        </div>
      </div>

      {/* ── Ticket Pile ── */}
      {(tickets.length > 0 || ticketAvailable) && (
        <div className="flex flex-col lg:flex-row items-center gap-10 lg:gap-16">

          {/* Left: stacked pile */}
          <div className="relative shrink-0 w-56 sm:w-64 aspect-[3/4]">
            {remaining > 0 ? (
              <>
                {/* Background stack cards */}
                {Array.from({ length: stackCards }).map((_, i) => {
                  const depth = stackCards - i;
                  return (
                    <div
                      key={`stack-${depth}`}
                      className="absolute inset-0 rounded-2xl border border-white/[0.06] bg-gradient-to-br from-gray-700/40 to-gray-800/40"
                      style={{
                        transform: `translateX(${depth * 6}px) translateY(${depth * 6}px) rotate(${depth * 1.5}deg)`,
                        zIndex: -depth,
                        filter: `brightness(${1 - depth * 0.12})`,
                      }}
                    />
                  );
                })}

                {/* Top card — interactive */}
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

                {/* Counter badge */}
                {remaining > 1 && (
                  <div className="absolute -top-2 -right-2 z-20 bg-twitch text-white text-xs font-black w-8 h-8 rounded-full flex items-center justify-center shadow-lg shadow-twitch/30">
                    &times;{remaining}
                  </div>
                )}
              </>
            ) : (
              /* Empty pile */
              <div className="w-full h-full rounded-2xl border border-[#2c2c2e] flex flex-col items-center justify-center gap-3">
                <svg className="w-14 h-14 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                </svg>
                <p className="text-gray-600 text-sm font-medium">Aucun ticket</p>
              </div>
            )}
          </div>

          {/* Right: info */}
          <div className="flex-1 space-y-6 text-center lg:text-left">
            <div>
              <h2 className="text-2xl font-black text-white">Tickets a gratter</h2>
              <p className="text-gray-500 mt-1">
                {remaining > 0 ? (
                  <>
                    <span className="text-white font-semibold">{remaining}</span> ticket{remaining > 1 ? "s" : ""} en attente
                  </>
                ) : (
                  "Tous tes tickets ont ete grattes !"
                )}
                {scratchedCount > 0 && (
                  <span className="text-gray-600 ml-2">
                    · {scratchedCount} gratte{scratchedCount > 1 ? "s" : ""}
                  </span>
                )}
              </p>
            </div>

            {/* Claim button */}
            {ticketAvailable && (
              <button
                onClick={handleClaim}
                disabled={claiming}
                className="inline-flex items-center gap-2.5 px-6 py-3 bg-gradient-to-r from-yellow-500/20 to-purple-500/20 hover:from-yellow-500/30 hover:to-purple-500/30 border border-yellow-500/30 text-yellow-300 font-semibold rounded-xl transition-all disabled:opacity-50"
              >
                {claiming ? (
                  <div className="w-5 h-5 border-2 border-yellow-300 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                )}
                Reclamer un ticket gratuit !
              </button>
            )}

            {claimError && (
              <p className="text-sm text-red-400">{claimError}</p>
            )}

            {/* Session results preview */}
            {sessionResults.length > 0 && (
              <div className="space-y-2">
                <span className="text-xs text-gray-600 uppercase tracking-wider">
                  Obtenu{sessionResults.length > 1 ? "s" : ""} :
                </span>
                <div className="flex flex-wrap gap-2 lg:justify-start justify-center">
                  {sessionResults.map((r, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-white/[0.04] border border-white/[0.06]"
                    >
                      <img
                        src={getBadgeImage(r.rarity, r.season)}
                        alt=""
                        className="w-6 h-6 object-contain"
                      />
                      <span
                        className="text-[10px] font-bold uppercase"
                        style={{ color: RARITY_COLORS[r.rarity] }}
                      >
                        {r.rarity}
                      </span>
                    </div>
                  ))}
                </div>
                {remaining === 0 && sessionResults.length > 0 && (
                  <button
                    onClick={() => setShowSummary(true)}
                    className="text-xs text-twitch hover:text-twitch-light underline underline-offset-2 transition-colors"
                  >
                    Voir le recap
                  </button>
                )}
              </div>
            )}

            {remaining > 0 && !revealingAll && (
              <p className="text-xs text-gray-600">
                Gratte la couche argentee pour reveler ton badge !
              </p>
            )}

            {/* Reveal all button */}
            {remaining > 1 && !revealingAll && (
              <button
                onClick={handleRevealAll}
                className="text-xs text-gray-600 hover:text-gray-400 underline underline-offset-2 transition-colors"
              >
                Tout reveler d'un coup ({remaining} tickets)
              </button>
            )}

            {/* Bulk reveal in progress */}
            {revealingAll && (
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 border-2 border-twitch border-t-transparent rounded-full animate-spin" />
                <span className="text-sm text-gray-400">
                  Revelation... {bulkResults.length}/{unscratchedTickets.length - currentIdx}
                </span>
              </div>
            )}
          </div>
        </div>
      )}

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
