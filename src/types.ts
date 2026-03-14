export interface AuthUser {
  twitch_login: string;
  twitch_display_name: string;
  twitch_profile_image: string;
  badges: Record<string, string[]>;
  total_pts: number;
}

export interface PublicUser {
  username: string;
  avatar_url: string | null;
  badges: Record<string, Record<string, number>>;
  total_pts: number;
  rank: number;
}

export interface LeaderboardEntry {
  rank: number;
  username: string;
  display_name: string;
  avatar_url: string | null;
  total_pts: number;
  badge_count: number;
  top_rarity: string;
  common_count: number;
  rare_count: number;
  epic_count: number;
  legendary_count: number;
  unique_count: number;
  first_badge_at: string | null;
  last_badge_at: string | null;
  season_count: number;
  message_count: number | null;
  watch_time_minutes: number | null;
  followed_at: string | null;
  trade_count: number;
  member_since: string | null;
}

export interface Trade {
  id: string;
  from_user: string;
  to_user: string;
  from_badge: { season: string; rarity: string };
  to_badge: { season: string; rarity: string };
  status: "pending" | "accepted" | "rejected" | "cancelled";
  created_at: string;
  resolved_at: string | null;
}

export interface MyTrades {
  incoming: Trade[];
  outgoing: Trade[];
}

export interface Stats {
  total_badges: number;
  by_rarity: Record<string, number>;
  total_users: number;
}

export interface LotteryTicket {
  id: string;
  rarity: string | null;   // null until scratched
  season: string;
  scratched: boolean;
  claimed_at: string;
  scratched_at: string | null;
}

export const RARITY_ORDER = ["COMMON", "RARE", "EPIC", "LEGENDARY", "UNIQUE"] as const;

export const RARITY_POINTS: Record<string, number> = {
  COMMON: 1,
  RARE: 2,
  EPIC: 3,
  LEGENDARY: 5,
  UNIQUE: 8,
};

export interface LiveSubmission {
  id: string;
  username: string;
  video_path: string;
  message: string;
  duration_seconds: number;
  played: boolean;
  created_at: string;
  video_type: "upload" | "youtube" | "tiktok";
  youtube_id: string | null;
  start_seconds: number;
  end_seconds: number;
  is_vertical: boolean;
}

export const RARITY_COLORS: Record<string, string> = {
  COMMON: "#d9d9d9",
  RARE: "#4da6ff",
  EPIC: "#b266ff",
  LEGENDARY: "#ffd633",
  UNIQUE: "#ff66cc",
  NONE: "#666",
};
