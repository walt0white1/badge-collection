import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { fetchUserProfile } from "../api";
import BadgeGrid from "../components/BadgeGrid";
import { useAuth } from "../hooks/useAuth";

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

  return (
    <div className="max-w-[1400px] mx-auto px-6 sm:px-8 py-10 space-y-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">{data.username}</h1>
          <p className="text-gray-400 mt-1">
            Rang <span className="font-semibold text-white">#{data.rank}</span> &mdash;{" "}
            <span className="font-semibold text-twitch">{data.total_pts} pts</span>
          </p>
        </div>
        {isAuthenticated && !isOwnProfile && (
          <Link
            to={`/trades?with=${data.username}`}
            className="px-5 py-2.5 bg-twitch hover:bg-twitch-dark text-white text-sm font-semibold rounded-xl transition-colors w-fit"
          >
            Proposer un echange
          </Link>
        )}
      </div>

      {/* All seasons */}
      {seasons.map((season) => {
        const counts = data.badges[season] || {};
        const totalInSeason = Object.values(counts).reduce((sum, n) => sum + (n as number), 0);
        const label = season.replace("saison", "Saison ");

        return (
          <div key={season} className="space-y-4">
            <div className="flex items-center gap-4">
              <h2 className="text-lg font-bold text-white">{label}</h2>
              <span className="text-sm text-gray-500">
                {totalInSeason} badge{totalInSeason > 1 ? "s" : ""}
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
