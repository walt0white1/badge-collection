import { useAuth } from "../hooks/useAuth";
import { Link } from "react-router-dom";
import BadgeGrid from "../components/BadgeGrid";
import { RARITY_ORDER } from "../types";

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
  if (!user) return null;

  const seasons = Object.keys(user.badges).sort().reverse();

  const totalBadges = Object.values(user.badges).reduce(
    (sum, list) => sum + (Array.isArray(list) ? list.length : 0),
    0,
  );

  return (
    <div className="max-w-[1400px] mx-auto px-6 sm:px-8 py-10 space-y-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-5 items-start">
        <img
          src={user.twitch_profile_image}
          alt=""
          className="w-20 h-20 rounded-2xl ring-2 ring-twitch/40"
        />
        <div className="flex-1 space-y-1">
          <h1 className="text-3xl font-bold">{user.twitch_display_name}</h1>
          <p className="text-gray-400">
            <span className="font-semibold text-twitch">{user.total_pts}</span>{" "}
            points &mdash; {totalBadges} badge{totalBadges > 1 ? "s" : ""}
          </p>
        </div>
        <Link
          to="/trades"
          className="px-5 py-2.5 bg-twitch hover:bg-twitch-dark text-white text-sm font-semibold rounded-xl transition-colors"
        >
          Mes echanges
        </Link>
      </div>

      {/* All seasons */}
      {seasons.map((season) => {
        const currentList = user.badges[season] || [];
        const counts = countBadges(currentList);
        const label = season.replace("saison", "Saison ");

        return (
          <div key={season} className="space-y-4">
            <div className="flex items-center gap-4">
              <h2 className="text-lg font-bold text-white">{label}</h2>
              <span className="text-sm text-gray-500">
                {currentList.length} badge{currentList.length > 1 ? "s" : ""}
              </span>
              <div className="flex-1 h-px bg-white/[0.06]" />
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
