import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { fetchUserProfile } from "../api";
import BadgeGrid from "../components/BadgeGrid";
import { useAuth } from "../hooks/useAuth";
import { RARITY_ORDER, RARITY_COLORS, RARITY_POINTS } from "../types";

export default function UserProfile() {
  const { username } = useParams<{ username: string }>();
  const { isAuthenticated, user: me } = useAuth();
  const { data, isLoading, error } = useQuery({
    queryKey: ["user", username],
    queryFn: () => fetchUserProfile(username!),
    enabled: !!username,
  });

  const seasons = data ? Object.keys(data.badges).sort().reverse() : [];

  const isOwnProfile =
    isAuthenticated && me?.twitch_login.toLowerCase() === username?.toLowerCase();

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <div className="w-8 h-8 border-2 border-twitch border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="max-w-[1400px] mx-auto px-6 sm:px-8 py-20 text-center">
        <h1 className="text-2xl font-bold text-gray-400">Utilisateur introuvable</h1>
      </div>
    );
  }

  // Total badges across all seasons
  const totalBadges = Object.values(data.badges).reduce(
    (sum, counts) => sum + Object.values(counts).reduce((s, n) => s + (n as number), 0),
    0,
  );

  // All-season rarity counts
  const allRarityCounts: Record<string, number> = {};
  for (const r of RARITY_ORDER) allRarityCounts[r] = 0;
  for (const counts of Object.values(data.badges)) {
    for (const [key, val] of Object.entries(counts)) {
      allRarityCounts[key.toUpperCase()] = (allRarityCounts[key.toUpperCase()] || 0) + (val as number);
    }
  }

  const avatarUrl = `https://unavatar.io/twitch/${data.username}`;

  return (
    <div className="max-w-[1400px] mx-auto px-6 sm:px-8 py-10 space-y-10">

      {/* ── Header ── */}
      <div className="relative overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 sm:p-8">
        <div className="absolute top-0 right-0 w-72 h-72 bg-twitch/[0.05] rounded-full blur-[100px] -translate-y-1/2 translate-x-1/3 pointer-events-none" />

        <div className="relative flex flex-col sm:flex-row gap-6 items-start">
          <img
            src={avatarUrl}
            alt={data.username}
            className="w-20 h-20 rounded-2xl ring-2 ring-twitch/30 shadow-xl object-cover"
            onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
          />
          <div className="flex-1 space-y-4">
            <div>
              <h1 className="text-3xl font-black tracking-tight">{data.username}</h1>
              <p className="text-gray-500 mt-1">
                Rang <span className="text-white font-bold text-lg">#{data.rank}</span>
                <span className="mx-2 text-white/10">|</span>
                <span className="text-twitch font-bold text-lg">{data.total_pts}</span>{" "}
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

          {isAuthenticated && !isOwnProfile && (
            <Link
              to={`/trades?with=${data.username}`}
              className="px-5 py-2.5 bg-twitch hover:bg-twitch-dark text-white text-sm font-semibold rounded-xl transition-colors shrink-0"
            >
              Proposer un echange
            </Link>
          )}
        </div>
      </div>

      {/* ── Seasons ── */}
      {seasons.map((season) => {
        const counts = data.badges[season] || {};
        const totalInSeason = Object.values(counts).reduce((sum, n) => sum + (n as number), 0);
        const seasonPts = Object.entries(counts).reduce(
          (sum, [key, val]) => sum + (RARITY_POINTS[key.toUpperCase()] || 0) * (val as number),
          0,
        );
        const label = season.replace("saison", "Saison ");

        return (
          <div key={season} className="space-y-5">
            <div className="flex items-center gap-4">
              <h2 className="text-xl font-black text-white">{label}</h2>
              <div className="flex items-center gap-3 text-sm">
                <span className="text-gray-500">
                  {totalInSeason} badge{totalInSeason > 1 ? "s" : ""}
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
    </div>
  );
}
