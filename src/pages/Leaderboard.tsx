import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Link } from "react-router-dom";
import { fetchLeaderboard } from "../api";
import RarityBadge from "../components/RarityBadge";

const MEDALS = ["", "\u{1F947}", "\u{1F948}", "\u{1F949}"];

export default function Leaderboard() {
  const { data, isLoading } = useQuery({
    queryKey: ["leaderboard"],
    queryFn: fetchLeaderboard,
  });
  const [search, setSearch] = useState("");

  const filtered = data?.filter((e) =>
    e.username.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="max-w-4xl mx-auto px-4 py-10 space-y-6">
      <h1 className="text-3xl font-bold">Classement</h1>

      <input
        type="text"
        placeholder="Rechercher un joueur..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full sm:w-72 px-4 py-2 bg-gray-900 border border-gray-800 rounded-xl text-sm placeholder-gray-500 focus:outline-none focus:border-twitch/50"
      />

      {isLoading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-2 border-twitch border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b border-gray-800">
                <th className="pb-3 pr-4 w-16">#</th>
                <th className="pb-3 pr-4">Joueur</th>
                <th className="pb-3 pr-4 text-right">Points</th>
                <th className="pb-3 pr-4 text-right">Badges</th>
                <th className="pb-3 text-right">Top rarete</th>
              </tr>
            </thead>
            <tbody>
              {filtered?.map((entry) => (
                <tr
                  key={entry.username}
                  className="border-b border-gray-800/50 hover:bg-gray-900/40"
                >
                  <td className="py-3 pr-4 font-medium">
                    {entry.rank <= 3 ? (
                      <span className="text-lg">{MEDALS[entry.rank]}</span>
                    ) : (
                      <span className="text-gray-500">{entry.rank}</span>
                    )}
                  </td>
                  <td className="py-3 pr-4">
                    <Link
                      to={`/user/${entry.username}`}
                      className="font-medium text-gray-200 hover:text-twitch transition-colors"
                    >
                      {entry.username}
                    </Link>
                  </td>
                  <td className="py-3 pr-4 text-right font-bold tabular-nums">
                    {entry.total_pts}
                  </td>
                  <td className="py-3 pr-4 text-right text-gray-400 tabular-nums">
                    {entry.badge_count}
                  </td>
                  <td className="py-3 text-right">
                    {entry.top_rarity !== "NONE" && (
                      <RarityBadge rarity={entry.top_rarity} size="sm" />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered?.length === 0 && (
            <p className="text-center text-gray-500 py-10">Aucun joueur trouve.</p>
          )}
        </div>
      )}
    </div>
  );
}
