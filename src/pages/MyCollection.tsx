import { useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { Link } from "react-router-dom";
import BadgeGrid from "../components/BadgeGrid";
import ShareCardModal from "../components/ShareCardModal";
import { RARITY_ORDER, RARITY_COLORS, RARITY_POINTS } from "../types";

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
  const { user } = useAuth();
  const [showShareCard, setShowShareCard] = useState(false);
  if (!user) return null;

  const seasons = Object.keys(user.badges).sort().reverse();

  const totalBadges = Object.values(user.badges).reduce(
    (sum, list) => sum + (Array.isArray(list) ? list.length : 0),
    0,
  );

  // Compute rarity totals across all seasons
  const allRarityCounts: Record<string, number> = {};
  for (const r of RARITY_ORDER) allRarityCounts[r] = 0;
  for (const list of Object.values(user.badges)) {
    if (!Array.isArray(list)) continue;
    for (const b of list) allRarityCounts[b.toUpperCase()] = (allRarityCounts[b.toUpperCase()] || 0) + 1;
  }

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

            {/* Rarity breakdown bar */}
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

            {/* Rarity mini legend */}
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

          <div className="flex gap-2 shrink-0">
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

      {/* ── Seasons ── */}
      {seasons.map((season) => {
        const currentList = user.badges[season] || [];
        const counts = countBadges(currentList);
        const label = season.replace("saison", "Saison ");
        const seasonPts = currentList.reduce(
          (sum, b) => sum + (RARITY_POINTS[b.toUpperCase()] || 0),
          0,
        );

        return (
          <div key={season} className="space-y-5">
            {/* Season header */}
            <div className="flex items-center gap-4">
              <h2 className="text-xl font-black text-white">{label}</h2>
              <div className="flex items-center gap-3 text-sm">
                <span className="text-gray-500">
                  {currentList.length} badge{currentList.length > 1 ? "s" : ""}
                </span>
                <span className="text-white/10">|</span>
                <span className="text-twitch font-semibold">{seasonPts} pts</span>
              </div>
              <div className="flex-1 h-px bg-gradient-to-r from-white/[0.08] to-transparent" />
            </div>

            <BadgeGrid counts={counts} season={season} />
          </div>
        );
      })}

      {seasons.length === 0 && (
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
