import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { fetchUserProfile } from "../api";
import { useState } from "react";
import SeasonTabs from "../components/SeasonTabs";
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

  const seasons = data ? Object.keys(data.badges).sort() : [];
  const [activeSeason, setActiveSeason] = useState("");

  const currentSeason = activeSeason || seasons[seasons.length - 1] || "";
  const counts = data?.badges[currentSeason] || {};

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
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <h1 className="text-2xl font-bold text-gray-400">Utilisateur introuvable</h1>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-10 space-y-8">
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

      {seasons.length > 1 && (
        <SeasonTabs
          seasons={seasons}
          active={currentSeason}
          onChange={setActiveSeason}
        />
      )}

      <BadgeGrid counts={counts} season={currentSeason} />
    </div>
  );
}
