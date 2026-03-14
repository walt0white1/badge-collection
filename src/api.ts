import { supabase } from "./lib/supabase";
import type { LeaderboardEntry, PublicUser, Stats, MyTrades, Trade, LotteryTicket } from "./types";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export type WizebotType = "uptime" | "message" | "currency";
export type WizebotPeriod = "week" | "month" | "global";

export interface WizebotEntry {
  user_name: string;
  user_uid: string;
  value: string;
}

export const fetchWizebotRanking = async (
  type: WizebotType,
  period: WizebotPeriod,
  limit = 100
): Promise<WizebotEntry[]> => {
  const url = `${SUPABASE_URL}/functions/v1/wizebot-ranking?type=${type}&period=${period}&limit=${limit}`;
  const res = await fetch(url, {
    headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` },
  });
  const data = await res.json();
  if (!data.success) throw new Error("WizeBot API error");
  return (data.list || []) as WizebotEntry[];
};

// ---------- Public ----------

export const fetchLeaderboard = async (): Promise<LeaderboardEntry[]> => {
  const { data, error } = await supabase.rpc("get_leaderboard");
  if (error) throw new Error(error.message);
  return (data || []) as LeaderboardEntry[];
};

export const fetchUserProfile = async (username: string): Promise<PublicUser> => {
  const { data, error } = await supabase.rpc("get_user_profile", { p_username: username });
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Utilisateur introuvable");
  return data as PublicUser;
};

export const fetchGlobalStats = async (): Promise<Stats> => {
  const { data, error } = await supabase.rpc("get_global_stats");
  if (error) throw new Error(error.message);
  return (data || { total_badges: 0, total_users: 0, by_rarity: {} }) as Stats;
};

export const fetchAllUsers = async (): Promise<string[]> => {
  const { data, error } = await supabase.rpc("get_all_usernames");
  if (error) throw new Error(error.message);
  return (data || []) as string[];
};

// ---------- Trades (authenticated) ----------

function transformTrades(raw: any[]): Trade[] {
  return raw.map((t: any) => ({
    id: t.id,
    from_user: t.from_user,
    to_user: t.to_user,
    from_badge: { season: t.from_badge_season, rarity: t.from_badge_rarity },
    to_badge: { season: t.to_badge_season, rarity: t.to_badge_rarity },
    status: t.status,
    created_at: t.created_at,
    resolved_at: t.resolved_at,
  }));
}

export const fetchMyTrades = async (): Promise<MyTrades> => {
  const { data, error } = await supabase.rpc("get_my_trades");
  if (error) throw new Error(error.message);
  const d = data as any;
  return {
    incoming: transformTrades(d?.incoming || []),
    outgoing: transformTrades(d?.outgoing || []),
  };
};

export const createTrade = async (params: {
  to_user: string;
  from_badge: { season: string; rarity: string };
  to_badge: { season: string; rarity: string };
}): Promise<string> => {
  const { data, error } = await supabase.rpc("create_trade", {
    p_to_user: params.to_user,
    p_from_badge_season: params.from_badge.season,
    p_from_badge_rarity: params.from_badge.rarity,
    p_to_badge_season: params.to_badge.season,
    p_to_badge_rarity: params.to_badge.rarity,
  });
  if (error) throw new Error(error.message);
  return data as string;
};

export const acceptTrade = async (id: string): Promise<void> => {
  const { error } = await supabase.rpc("accept_trade", { p_trade_id: id });
  if (error) throw new Error(error.message);
};

export const rejectTrade = async (id: string): Promise<void> => {
  const { error } = await supabase.rpc("reject_trade", { p_trade_id: id });
  if (error) throw new Error(error.message);
};

export const cancelTrade = async (id: string): Promise<void> => {
  const { error } = await supabase.rpc("cancel_trade", { p_trade_id: id });
  if (error) throw new Error(error.message);
};

// ---------- Lottery Tickets ----------

export const canClaimTicket = async (): Promise<boolean> => {
  const { data, error } = await supabase.rpc("can_claim_ticket");
  if (error) return false;
  return !!data;
};

export const claimTicket = async (): Promise<string> => {
  const { data, error } = await supabase.rpc("claim_ticket");
  if (error) throw new Error(error.message);
  return data as string;
};

export const getMyTickets = async (): Promise<LotteryTicket[]> => {
  const { data, error } = await supabase.rpc("get_my_tickets");
  if (error) throw new Error(error.message);
  return (data || []) as LotteryTicket[];
};

export const scratchTicket = async (ticketId: string): Promise<string> => {
  const { data, error } = await supabase.rpc("scratch_ticket", { p_ticket_id: ticketId });
  if (error) throw new Error(error.message);
  return data as string;
};

// ---------- Live Submissions ----------

export const submitLiveVideo = async (
  file: File,
  message: string,
  durationSeconds: number,
): Promise<void> => {
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();
  if (!authUser) throw new Error("Non authentifié");

  const ext = file.name.split(".").pop() || "mp4";
  const path = `${authUser.id}/${Date.now()}.${ext}`;

  const { error: uploadErr } = await supabase.storage
    .from("live-videos")
    .upload(path, file, { contentType: file.type });
  if (uploadErr) throw new Error(uploadErr.message);

  // Get the user's username from profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("username")
    .eq("auth_id", authUser.id)
    .single();
  if (!profile) throw new Error("Profil introuvable");

  const { error: insertErr } = await supabase.from("live_submissions").insert({
    username: profile.username,
    video_path: path,
    message: message.trim(),
    duration_seconds: durationSeconds,
  });
  if (insertErr) throw new Error(insertErr.message);
};

export const getVideoUrl = (path: string): string => {
  const { data } = supabase.storage.from("live-videos").getPublicUrl(path);
  return data.publicUrl;
};

export const markSubmissionPlayed = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from("live_submissions")
    .update({ played: true })
    .eq("id", id);
  if (error) throw new Error(error.message);
};

// ---------- Share card ----------

export const uploadShareCard = async (
  username: string,
  blob: Blob,
): Promise<string> => {
  const path = `cards/${username}.png`;

  const { error } = await supabase.storage
    .from("share-cards")
    .upload(path, blob, { contentType: "image/png", upsert: true });
  if (error) throw new Error(error.message);

  const { data } = supabase.storage.from("share-cards").getPublicUrl(path);
  return data.publicUrl;
};
