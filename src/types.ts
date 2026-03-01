export interface AuthUser {
  twitch_login: string;
  twitch_display_name: string;
  twitch_profile_image: string;
  badges: Record<string, string[]>;
  total_pts: number;
}

export interface PublicUser {
  username: string;
  badges: Record<string, Record<string, number>>;
  total_pts: number;
  rank: number;
}

export interface LeaderboardEntry {
  rank: number;
  username: string;
  total_pts: number;
  badge_count: number;
  top_rarity: string;
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

export const RARITY_ORDER = ["UNIQUE", "LEGENDARY", "EPIC", "RARE", "COMMON"] as const;

export const RARITY_POINTS: Record<string, number> = {
  COMMON: 1,
  RARE: 2,
  EPIC: 3,
  LEGENDARY: 5,
  UNIQUE: 8,
};

export const RARITY_COLORS: Record<string, string> = {
  COMMON: "#d9d9d9",
  RARE: "#4da6ff",
  EPIC: "#b266ff",
  LEGENDARY: "#ffd633",
  UNIQUE: "#ff66cc",
  NONE: "#666",
};
