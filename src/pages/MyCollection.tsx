import { useState, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../hooks/useAuth";
import { Link } from "react-router-dom";
import ArcRow from "../components/ArcRow";
import ShareCardModal from "../components/ShareCardModal";
import { ARC_CONFIG } from "../arcConfig";
import ScratchTicket from "../components/ScratchTicket";
import { canClaimTicket, claimTicket, getMyTickets } from "../api";
import { RARITY_ORDER, RARITY_COLORS, RARITY_POINTS } from "../types";
import { getBadgeImage } from "../badgeImages";

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
  const queryClient = useQueryClient();
  const [showShareCard, setShowShareCard] = useState(false);
  const [claiming, setClaiming] = useState(false);
  const [claimError, setClaimError] = useState("");
  const [currentIdx, setCurrentIdx] = useState(0);
  const [lastRevealed, setLastRevealed] = useState<string | null>(null);

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
    setLastRevealed(rarity);
    queryClient.invalidateQueries({ queryKey: ["myTickets"] });
    refetchTicket();
    refresh();
  }, [queryClient, refetchTicket, refresh]);

  const handleDismiss = useCallback(() => {
    setCurrentIdx((prev) => prev + 1);
  }, []);

  // Stack cards behind the top one (up to 3 visible)
  const stackCards = Math.min(remaining > 0 ? remaining - 1 : 0, 3);

  return (
    <div className="max-w-[1400px] mx-auto px-6 sm:px-8 py-10 space-y-10">

      {/* ── Header ── */}
      <div className="relative overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 sm:p-8">
        <div className="absolute top-0 right-0 w-72 h-72 bg-twitch/[0.05] rounded-full blur-[100px] -translate-y-1/2 translate-x-1/3 pointer-events-none" />

        <div className="relative flex flex-col sm:flex-row gap-6 items-start">
          <img
            src={user.twitch_profile_image}
            alt=""
            className="w-20 h-20 rounded-2xl ring-2 ring-twitch/30 shadow-xl"
          />
          <div className="flex-1 space-y-4">
            <div>
              <h1 className="text-3xl font-black tracking-tight">{user.twitch_display_name}</h1>
              <p className="text-gray-500 mt-1">
                <span className="text-twitch font-bold text-lg">{user.total_pts}</span>{" "}
                <span className="text-sm">points</span>
                <span className="mx-2 text-white/10">|</span>
                <span className="text-white font-semibold">{totalBadges}</span>{" "}
                <span className="text-sm">badge{totalBadges > 1 ? "s" : ""}</span>
              </p>
            </div>

            <div className="flex items-center gap-1 h-2 rounded-full overflow-hidden bg-white/[0.04] w-full max-w-md">
              {RARITY_ORDER.map((r) => {
                const pct = totalBadges > 0 ? (allRarityCounts[r] / totalBadges) * 100 : 0;
                if (pct === 0) return null;
                return (
                  <div
                    key={r}
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${pct}%`, backgroundColor: RARITY_COLORS[r], minWidth: pct > 0 ? "4px" : 0 }}
                  />
                );
              })}
            </div>

            <div className="flex flex-wrap gap-x-4 gap-y-1">
              {RARITY_ORDER.map((r) => (
                <div key={r} className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: RARITY_COLORS[r] }} />
                  <span className="text-xs text-gray-500">
                    {allRarityCounts[r]}
                    <span className="ml-1 text-gray-600">{r.charAt(0) + r.slice(1).toLowerCase()}</span>
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap gap-2 shrink-0">
            <button
              onClick={() => setShowShareCard(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.08] text-white text-sm font-semibold rounded-xl transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span className="hidden sm:inline">Partager</span>
            </button>
            <Link
              to="/trades"
              className="flex items-center gap-2 px-4 py-2.5 bg-twitch hover:bg-twitch-dark text-white text-sm font-semibold rounded-xl transition-colors"
            >
              Mes echanges
            </Link>
          </div>
        </div>
      </div>

      {/* ── Ticket Pile ── */}
      {(tickets.length > 0 || ticketAvailable) && (
        <div className="flex flex-col lg:flex-row items-center gap-10 lg:gap-16">

          {/* Left: stacked pile */}
          <div className="relative shrink-0" style={{ width: 272, height: 360 }}>
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
              <div className="w-full h-full rounded-2xl border-2 border-dashed border-white/[0.06] flex flex-col items-center justify-center gap-3">
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

            {/* Last revealed */}
            {lastRevealed && (
              <div className="flex items-center gap-3 lg:justify-start justify-center">
                <span className="text-xs text-gray-600 uppercase tracking-wider">Dernier :</span>
                <div className="flex items-center gap-2">
                  <img
                    src={getBadgeImage(lastRevealed, "saison2")}
                    alt=""
                    className="w-8 h-8 object-contain"
                  />
                  <span
                    className="text-sm font-black tracking-wider uppercase"
                    style={{ color: RARITY_COLORS[lastRevealed] }}
                  >
                    {lastRevealed}
                  </span>
                </div>
              </div>
            )}

            {remaining > 0 && (
              <p className="text-xs text-gray-600">
                Gratte la couche argentee pour reveler ton badge !
              </p>
            )}
          </div>
        </div>
      )}

      {/* ── Arcs ── */}
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
              <div className="mx-auto w-[60%] max-w-[400px] h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent mt-10" />
            )}
          </div>
        );
      })}

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
