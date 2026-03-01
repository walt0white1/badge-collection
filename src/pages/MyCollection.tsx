import { useAuth } from "../hooks/useAuth";
import { useState } from "react";
import { Link } from "react-router-dom";
import SeasonTabs from "../components/SeasonTabs";
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

  const seasons = Object.keys(user.badges).sort();
  const [activeSeason, setActiveSeason] = useState(
    seasons[seasons.length - 1] || "",
  );

  const currentList = user.badges[activeSeason] || [];
  const counts = countBadges(currentList);

  const totalBadges = Object.values(user.badges).reduce(
    (sum, list) => sum + (Array.isArray(list) ? list.length : 0),
    0,
  );

  return (
    <div className="max-w-[1400px] mx-auto px-6 sm:px-8 py-10 space-y-8">
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

      {/* Season tabs */}
      {seasons.length > 1 && (
        <SeasonTabs
          seasons={seasons}
          active={activeSeason}
          onChange={setActiveSeason}
        />
      )}

      {/* Badge grid */}
      <BadgeGrid counts={counts} season={activeSeason} />

      {currentList.length === 0 && (
        <p className="text-center text-gray-500 py-10">
          Aucun badge pour cette saison.
        </p>
      )}
    </div>
  );
}
