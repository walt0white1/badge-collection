import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import {
  fetchMyTrades,
  fetchAllUsers,
  fetchUserProfile,
  createTrade,
  acceptTrade,
  rejectTrade,
  cancelTrade,
} from "../api";
import { useAuth } from "../hooks/useAuth";
import RarityBadge from "../components/RarityBadge";
import { RARITY_ORDER, RARITY_COLORS } from "../types";
import type { Trade } from "../types";
import { getBadgeImage } from "../badgeImages";

type Tab = "incoming" | "outgoing" | "propose";

/* ── Illustrated empty state ── */
function EmptyState({
  icon,
  title,
  desc,
  action,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
  action?: { label: string; onClick: () => void };
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="w-20 h-20 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center mb-6">
        {icon}
      </div>
      <h3 className="text-lg font-bold text-white mb-2">{title}</h3>
      <p className="text-sm text-gray-500 text-center max-w-sm mb-6">{desc}</p>
      {action && (
        <button
          onClick={action.onClick}
          className="px-5 py-2.5 bg-twitch hover:bg-twitch-dark text-white text-sm font-semibold rounded-xl transition-colors"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}

/* ── Single trade card ── */
function TradeRow({
  trade,
  type,
  onAccept,
  onReject,
  onCancel,
}: {
  trade: Trade;
  type: "incoming" | "outgoing";
  onAccept: (id: string) => void;
  onReject: (id: string) => void;
  onCancel: (id: string) => void;
}) {
  const isPending = trade.status === "pending";
  const fromColor = RARITY_COLORS[trade.from_badge.rarity.toUpperCase()] || "#888";
  const toColor = RARITY_COLORS[trade.to_badge.rarity.toUpperCase()] || "#888";

  return (
    <div className="relative flex flex-col sm:flex-row sm:items-center gap-4 p-4 sm:p-5 rounded-2xl border border-white/[0.06] bg-[#0a0a0d] overflow-hidden group hover:border-white/[0.1] transition-colors">
      {/* Subtle gradient accent */}
      <div
        className="absolute top-0 left-0 w-full h-px opacity-40"
        style={{ background: `linear-gradient(90deg, ${fromColor}44, transparent 50%, ${toColor}44)` }}
      />

      {/* User info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm mb-2">
          {type === "incoming" ? (
            <>
              <strong className="text-white">{trade.from_user}</strong>{" "}
              <span className="text-gray-500">te propose un echange</span>
            </>
          ) : (
            <>
              <span className="text-gray-500">Tu proposes a</span>{" "}
              <strong className="text-white">{trade.to_user}</strong>
            </>
          )}
        </p>

        {/* Badge exchange visual */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/[0.03] border border-white/[0.06]">
            <img
              src={getBadgeImage(trade.from_badge.rarity.toUpperCase(), trade.from_badge.season)}
              alt=""
              className="w-6 h-6 object-contain"
            />
            <RarityBadge rarity={trade.from_badge.rarity} size="sm" />
            <span className="text-[10px] text-gray-600">{trade.from_badge.season.replace("saison", "S")}</span>
          </div>

          <svg className="w-4 h-4 text-gray-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
          </svg>

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/[0.03] border border-white/[0.06]">
            <img
              src={getBadgeImage(trade.to_badge.rarity.toUpperCase(), trade.to_badge.season)}
              alt=""
              className="w-6 h-6 object-contain"
            />
            <RarityBadge rarity={trade.to_badge.rarity} size="sm" />
            <span className="text-[10px] text-gray-600">{trade.to_badge.season.replace("saison", "S")}</span>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 shrink-0">
        {isPending && type === "incoming" && (
          <>
            <button
              onClick={() => onAccept(trade.id)}
              className="px-4 py-2 bg-green-500/10 text-green-400 text-xs font-bold rounded-xl border border-green-500/20 hover:bg-green-500/20 transition-colors"
            >
              Accepter
            </button>
            <button
              onClick={() => onReject(trade.id)}
              className="px-4 py-2 bg-red-500/10 text-red-400 text-xs font-bold rounded-xl border border-red-500/20 hover:bg-red-500/20 transition-colors"
            >
              Refuser
            </button>
          </>
        )}
        {isPending && type === "outgoing" && (
          <button
            onClick={() => onCancel(trade.id)}
            className="px-4 py-2 bg-[#0f0f13] text-gray-400 text-xs font-bold rounded-xl border border-white/[0.08] hover:bg-white/[0.08] transition-colors"
          >
            Annuler
          </button>
        )}
        {!isPending && (
          <span
            className={`text-xs font-bold px-3 py-1.5 rounded-full ${
              trade.status === "accepted"
                ? "bg-green-500/15 text-green-400 border border-green-500/20"
                : trade.status === "rejected"
                  ? "bg-red-500/15 text-red-400 border border-red-500/20"
                  : "bg-[#0f0f13] text-gray-500 border border-white/[0.06]"
            }`}
          >
            {trade.status === "accepted"
              ? "Accepte"
              : trade.status === "rejected"
                ? "Refuse"
                : "Annule"}
          </span>
        )}
      </div>
    </div>
  );
}

/* ── Propose form ── */
function ProposeForm({ defaultTarget }: { defaultTarget: string }) {
  const { user, refresh } = useAuth();
  const qc = useQueryClient();

  const [toUser, setToUser] = useState(defaultTarget);
  const [fromSeason, setFromSeason] = useState("saison2");
  const [fromRarity, setFromRarity] = useState("");
  const [toSeason, setToSeason] = useState("saison2");
  const [toRarity, setToRarity] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const { data: users } = useQuery({ queryKey: ["allUsers"], queryFn: fetchAllUsers });
  const { data: targetProfile } = useQuery({
    queryKey: ["user", toUser],
    queryFn: () => fetchUserProfile(toUser),
    enabled: !!toUser && toUser.length > 1,
  });

  const mutation = useMutation({
    mutationFn: createTrade,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["trades"] });
      refresh();
      setFromRarity("");
      setToRarity("");
      setError("");
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    },
    onError: (err: Error) => setError(err.message),
  });

  const myBadges = user?.badges[fromSeason] || [];
  const myRarityCounts: Record<string, number> = {};
  for (const b of myBadges) {
    const k = b.toUpperCase();
    myRarityCounts[k] = (myRarityCounts[k] || 0) + 1;
  }

  const targetCounts = targetProfile?.badges[toSeason] || {};

  const filteredUsers = users?.filter(
    (u) =>
      u.toLowerCase() !== user?.twitch_login.toLowerCase() &&
      u.toLowerCase().includes(toUser.toLowerCase()),
  );

  return (
    <div className="space-y-6">
      {/* Step 1: Target user */}
      <div className="rounded-2xl border border-white/[0.06] bg-[#0a0a0d] p-5 space-y-3">
        <div className="flex items-center gap-2 mb-1">
          <span className="w-6 h-6 rounded-full bg-twitch/20 text-twitch text-xs font-black flex items-center justify-center">1</span>
          <label className="text-sm font-bold text-white">Avec qui echanger ?</label>
        </div>
        <input
          type="text"
          value={toUser}
          onChange={(e) => setToUser(e.target.value)}
          placeholder="Nom du joueur..."
          className="w-full px-4 py-2.5 bg-white/[0.03] border border-white/[0.08] rounded-xl text-sm placeholder-gray-600 focus:outline-none focus:border-twitch/40 transition-colors"
        />
        {toUser && filteredUsers && filteredUsers.length > 0 && filteredUsers.length <= 8 && (
          <div className="flex flex-wrap gap-1.5">
            {filteredUsers.map((u) => (
              <button
                key={u}
                onClick={() => setToUser(u)}
                className="text-xs px-3 py-1.5 bg-[#0f0f13] hover:bg-white/[0.08] border border-white/[0.06] rounded-lg transition-colors"
              >
                {u}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Step 2: Badges */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* My badge */}
        <div className="rounded-2xl border border-white/[0.06] bg-[#0a0a0d] p-5 space-y-3">
          <div className="flex items-center gap-2 mb-1">
            <span className="w-6 h-6 rounded-full bg-twitch/20 text-twitch text-xs font-black flex items-center justify-center">2</span>
            <label className="text-sm font-bold text-white">Tu donnes</label>
          </div>
          <select
            value={fromSeason}
            onChange={(e) => { setFromSeason(e.target.value); setFromRarity(""); }}
            className="w-full px-3 py-2 bg-white/[0.03] border border-white/[0.08] rounded-lg text-sm focus:outline-none focus:border-twitch/40"
          >
            {Object.keys(user?.badges || {}).map((s) => (
              <option key={s} value={s}>{s.replace("saison", "Saison ")}</option>
            ))}
          </select>
          <div className="flex flex-wrap gap-2">
            {RARITY_ORDER.filter((r) => (myRarityCounts[r] || 0) > 0).map((r) => (
              <button
                key={r}
                onClick={() => setFromRarity(r)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition-all ${
                  fromRarity === r
                    ? "border-twitch bg-twitch/15 scale-105"
                    : "border-white/[0.06] hover:border-white/[0.12] bg-[#0a0a0d]"
                }`}
                style={{ color: RARITY_COLORS[r] }}
              >
                <img src={getBadgeImage(r, fromSeason)} alt="" className="w-5 h-5 object-contain" />
                {r} ({myRarityCounts[r]})
              </button>
            ))}
            {RARITY_ORDER.filter((r) => (myRarityCounts[r] || 0) > 0).length === 0 && (
              <p className="text-xs text-gray-600">Aucun badge disponible cette saison.</p>
            )}
          </div>
        </div>

        {/* Target badge */}
        <div className="rounded-2xl border border-white/[0.06] bg-[#0a0a0d] p-5 space-y-3">
          <div className="flex items-center gap-2 mb-1">
            <span className="w-6 h-6 rounded-full bg-twitch/20 text-twitch text-xs font-black flex items-center justify-center">3</span>
            <label className="text-sm font-bold text-white">Tu recois</label>
          </div>
          <select
            value={toSeason}
            onChange={(e) => { setToSeason(e.target.value); setToRarity(""); }}
            className="w-full px-3 py-2 bg-white/[0.03] border border-white/[0.08] rounded-lg text-sm focus:outline-none focus:border-twitch/40"
          >
            {Object.keys(targetProfile?.badges || { saison1: {}, saison2: {} }).map((s) => (
              <option key={s} value={s}>{s.replace("saison", "Saison ")}</option>
            ))}
          </select>
          <div className="flex flex-wrap gap-2">
            {RARITY_ORDER.filter((r) => (targetCounts[r.toLowerCase()] || 0) > 0).map((r) => (
              <button
                key={r}
                onClick={() => setToRarity(r)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition-all ${
                  toRarity === r
                    ? "border-twitch bg-twitch/15 scale-105"
                    : "border-white/[0.06] hover:border-white/[0.12] bg-[#0a0a0d]"
                }`}
                style={{ color: RARITY_COLORS[r] }}
              >
                <img src={getBadgeImage(r, toSeason)} alt="" className="w-5 h-5 object-contain" />
                {r} ({targetCounts[r.toLowerCase()] || 0})
              </button>
            ))}
            {!targetProfile && toUser && (
              <p className="text-xs text-gray-600">Tape un nom de joueur valide ci-dessus.</p>
            )}
            {targetProfile && RARITY_ORDER.filter((r) => (targetCounts[r.toLowerCase()] || 0) > 0).length === 0 && (
              <p className="text-xs text-gray-600">Ce joueur n'a aucun badge cette saison.</p>
            )}
          </div>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 text-sm text-red-400 bg-red-500/10 border border-red-500/20 px-4 py-3 rounded-xl">
          <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          {error}
        </div>
      )}

      {success && (
        <div className="flex items-center gap-2 text-sm text-green-400 bg-green-500/10 border border-green-500/20 px-4 py-3 rounded-xl">
          <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          Echange propose avec succes !
        </div>
      )}

      <button
        onClick={() => {
          if (!toUser || !fromRarity || !toRarity) {
            setError("Remplis tous les champs.");
            return;
          }
          mutation.mutate({
            to_user: toUser,
            from_badge: { season: fromSeason, rarity: fromRarity },
            to_badge: { season: toSeason, rarity: toRarity },
          });
        }}
        disabled={mutation.isPending || !toUser || !fromRarity || !toRarity}
        className="w-full sm:w-auto px-8 py-3 bg-twitch hover:bg-twitch-dark disabled:opacity-30 disabled:cursor-not-allowed text-white text-sm font-bold rounded-xl transition-all"
      >
        {mutation.isPending ? "Envoi..." : "Proposer l'echange"}
      </button>
    </div>
  );
}

/* ── Main page ── */
export default function Trades() {
  const [searchParams] = useSearchParams();
  const defaultTarget = searchParams.get("with") || "";

  const [tab, setTab] = useState<Tab>(defaultTarget ? "propose" : "incoming");
  const qc = useQueryClient();
  const { refresh } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ["trades"],
    queryFn: () => fetchMyTrades(),
  });

  const doAccept = useMutation({
    mutationFn: acceptTrade,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["trades"] }); refresh(); },
  });
  const doReject = useMutation({
    mutationFn: rejectTrade,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["trades"] }),
  });
  const doCancel = useMutation({
    mutationFn: cancelTrade,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["trades"] }),
  });

  const incomingPending = data?.incoming.filter((t) => t.status === "pending").length || 0;
  const outgoingPending = data?.outgoing.filter((t) => t.status === "pending").length || 0;

  const tabs: { key: Tab; label: string; icon: React.ReactNode; count?: number }[] = [
    {
      key: "incoming",
      label: "Recus",
      count: incomingPending,
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
        </svg>
      ),
    },
    {
      key: "outgoing",
      label: "Envoyes",
      count: outgoingPending,
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
        </svg>
      ),
    },
    {
      key: "propose",
      label: "Proposer",
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
      ),
    },
  ];

  return (
    <div className="max-w-[900px] mx-auto px-6 sm:px-8 py-10 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl sm:text-4xl font-black tracking-tight">Echanges</h1>
        <p className="text-gray-500 text-sm mt-1">Propose, recois et gere tes echanges de badges.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-[#0f0f13] border border-white/[0.06] rounded-xl p-1">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
              tab === t.key
                ? "bg-twitch text-white shadow-lg shadow-twitch/20"
                : "text-gray-500 hover:text-gray-300 hover:bg-[#0f0f13]"
            }`}
          >
            {t.icon}
            <span className="hidden sm:inline">{t.label}</span>
            {t.count !== undefined && t.count > 0 && (
              <span className={`w-5 h-5 rounded-full text-[10px] flex items-center justify-center font-black ${
                tab === t.key ? "bg-white/20 text-white" : "bg-twitch/20 text-twitch"
              }`}>
                {t.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {isLoading && (
        <div className="flex justify-center py-20">
          <div className="w-10 h-10 border-2 border-twitch border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {!isLoading && tab === "incoming" && (
        <div className="space-y-3">
          {data?.incoming.length === 0 && (
            <EmptyState
              icon={
                <svg className="w-8 h-8 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                </svg>
              }
              title="Aucun echange recu"
              desc="Quand un joueur te propose un echange, il apparaitra ici. Partage ton profil pour recevoir des propositions !"
            />
          )}
          {data?.incoming.map((t) => (
            <TradeRow
              key={t.id}
              trade={t}
              type="incoming"
              onAccept={(id) => doAccept.mutate(id)}
              onReject={(id) => doReject.mutate(id)}
              onCancel={() => {}}
            />
          ))}
        </div>
      )}

      {!isLoading && tab === "outgoing" && (
        <div className="space-y-3">
          {data?.outgoing.length === 0 && (
            <EmptyState
              icon={
                <svg className="w-8 h-8 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              }
              title="Aucun echange envoye"
              desc="Tu n'as pas encore propose d'echange. Trouve un joueur et propose-lui un trade !"
              action={{ label: "Proposer un echange", onClick: () => setTab("propose") }}
            />
          )}
          {data?.outgoing.map((t) => (
            <TradeRow
              key={t.id}
              trade={t}
              type="outgoing"
              onAccept={() => {}}
              onReject={() => {}}
              onCancel={(id) => doCancel.mutate(id)}
            />
          ))}
        </div>
      )}

      {!isLoading && tab === "propose" && <ProposeForm defaultTarget={defaultTarget} />}
    </div>
  );
}
