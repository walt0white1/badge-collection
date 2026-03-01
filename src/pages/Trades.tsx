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

type Tab = "incoming" | "outgoing" | "propose";

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
  const other = type === "incoming" ? trade.from_user : trade.to_user;
  const isPending = trade.status === "pending";

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-gray-900/60 border border-gray-800 rounded-xl">
      <div className="flex-1 space-y-1">
        <p className="text-sm">
          {type === "incoming" ? (
            <>
              <strong className="text-white">{trade.from_user}</strong>{" "}
              <span className="text-gray-400">te propose</span>
            </>
          ) : (
            <>
              <span className="text-gray-400">Tu proposes a</span>{" "}
              <strong className="text-white">{trade.to_user}</strong>
            </>
          )}
        </p>
        <div className="flex items-center gap-2 text-xs">
          <RarityBadge rarity={trade.from_badge.rarity} size="sm" />
          <span className="text-gray-500">{trade.from_badge.season.replace("saison", "S")}</span>
          <span className="text-gray-600 mx-1">&harr;</span>
          <RarityBadge rarity={trade.to_badge.rarity} size="sm" />
          <span className="text-gray-500">{trade.to_badge.season.replace("saison", "S")}</span>
        </div>
      </div>
      <div className="flex items-center gap-2">
        {isPending && type === "incoming" && (
          <>
            <button
              onClick={() => onAccept(trade.id)}
              className="px-3 py-1.5 bg-green-600/20 text-green-400 text-xs font-semibold rounded-lg hover:bg-green-600/30 transition-colors"
            >
              Accepter
            </button>
            <button
              onClick={() => onReject(trade.id)}
              className="px-3 py-1.5 bg-red-600/20 text-red-400 text-xs font-semibold rounded-lg hover:bg-red-600/30 transition-colors"
            >
              Refuser
            </button>
          </>
        )}
        {isPending && type === "outgoing" && (
          <button
            onClick={() => onCancel(trade.id)}
            className="px-3 py-1.5 bg-gray-700/40 text-gray-400 text-xs font-semibold rounded-lg hover:bg-gray-700/60 transition-colors"
          >
            Annuler
          </button>
        )}
        {!isPending && (
          <span
            className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
              trade.status === "accepted"
                ? "bg-green-600/20 text-green-400"
                : trade.status === "rejected"
                  ? "bg-red-600/20 text-red-400"
                  : "bg-gray-700/40 text-gray-500"
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

function ProposeForm({ defaultTarget }: { defaultTarget: string }) {
  const { user, refresh } = useAuth();
  const qc = useQueryClient();

  const [toUser, setToUser] = useState(defaultTarget);
  const [fromSeason, setFromSeason] = useState("saison2");
  const [fromRarity, setFromRarity] = useState("");
  const [toSeason, setToSeason] = useState("saison2");
  const [toRarity, setToRarity] = useState("");
  const [error, setError] = useState("");

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
    <div className="space-y-5">
      {/* Target user */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-400">Echanger avec</label>
        <input
          type="text"
          value={toUser}
          onChange={(e) => setToUser(e.target.value)}
          placeholder="Nom du joueur..."
          className="w-full px-4 py-2 bg-gray-900 border border-gray-800 rounded-xl text-sm placeholder-gray-500 focus:outline-none focus:border-twitch/50"
        />
        {toUser && filteredUsers && filteredUsers.length > 0 && filteredUsers.length <= 8 && (
          <div className="flex flex-wrap gap-1">
            {filteredUsers.map((u) => (
              <button
                key={u}
                onClick={() => setToUser(u)}
                className="text-xs px-2.5 py-1 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
              >
                {u}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* My badge */}
        <div className="space-y-3">
          <label className="text-sm font-medium text-gray-400">Badge que tu donnes</label>
          <select
            value={fromSeason}
            onChange={(e) => { setFromSeason(e.target.value); setFromRarity(""); }}
            className="w-full px-3 py-2 bg-gray-900 border border-gray-800 rounded-lg text-sm focus:outline-none focus:border-twitch/50"
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
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                  fromRarity === r
                    ? "border-twitch bg-twitch/10"
                    : "border-gray-800 hover:border-gray-700"
                }`}
                style={{ color: RARITY_COLORS[r] }}
              >
                {r} ({myRarityCounts[r]})
              </button>
            ))}
          </div>
        </div>

        {/* Target badge */}
        <div className="space-y-3">
          <label className="text-sm font-medium text-gray-400">Badge que tu veux</label>
          <select
            value={toSeason}
            onChange={(e) => { setToSeason(e.target.value); setToRarity(""); }}
            className="w-full px-3 py-2 bg-gray-900 border border-gray-800 rounded-lg text-sm focus:outline-none focus:border-twitch/50"
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
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                  toRarity === r
                    ? "border-twitch bg-twitch/10"
                    : "border-gray-800 hover:border-gray-700"
                }`}
                style={{ color: RARITY_COLORS[r] }}
              >
                {r} ({targetCounts[r.toLowerCase()] || 0})
              </button>
            ))}
            {!targetProfile && toUser && (
              <p className="text-xs text-gray-500">Tape un nom de joueur valide ci-dessus.</p>
            )}
          </div>
        </div>
      </div>

      {error && (
        <p className="text-sm text-red-400 bg-red-900/20 px-4 py-2 rounded-lg">{error}</p>
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
        disabled={mutation.isPending}
        className="px-6 py-2.5 bg-twitch hover:bg-twitch-dark disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition-colors"
      >
        {mutation.isPending ? "Envoi..." : "Proposer l'echange"}
      </button>
    </div>
  );
}

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

  const tabs: { key: Tab; label: string; count?: number }[] = [
    { key: "incoming", label: "Recus", count: data?.incoming.filter((t) => t.status === "pending").length },
    { key: "outgoing", label: "Envoyes", count: data?.outgoing.filter((t) => t.status === "pending").length },
    { key: "propose", label: "Proposer" },
  ];

  return (
    <div className="max-w-[1400px] mx-auto px-6 sm:px-8 py-10 space-y-6">
      <h1 className="text-3xl font-bold">Echanges</h1>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-900/60 rounded-lg p-1 w-fit">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${
              tab === t.key
                ? "bg-twitch text-white"
                : "text-gray-400 hover:text-gray-200 hover:bg-gray-800/50"
            }`}
          >
            {t.label}
            {t.count !== undefined && t.count > 0 && (
              <span className="w-5 h-5 rounded-full bg-twitch/30 text-twitch text-xs flex items-center justify-center font-bold">
                {t.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {isLoading && (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-2 border-twitch border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {!isLoading && tab === "incoming" && (
        <div className="space-y-3">
          {data?.incoming.length === 0 && (
            <p className="text-gray-500 text-center py-10">Aucun echange recu.</p>
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
            <p className="text-gray-500 text-center py-10">Aucun echange envoye.</p>
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
