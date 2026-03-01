import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { fetchGlobalStats } from "../api";
import { useAuth } from "../hooks/useAuth";
import { RARITY_COLORS, RARITY_POINTS, RARITY_ORDER } from "../types";

export default function Home() {
  const { isAuthenticated, login } = useAuth();
  const { data: stats } = useQuery({ queryKey: ["stats"], queryFn: fetchGlobalStats });

  return (
    <div className="max-w-6xl mx-auto px-4 py-12 space-y-20">
      {/* Hero */}
      <section className="text-center space-y-6">
        <h1 className="text-5xl sm:text-6xl font-extrabold tracking-tight">
          Collecte, echange,{" "}
          <span className="text-gradient">montre tes badges</span>
        </h1>
        <p className="text-lg text-gray-400 max-w-2xl mx-auto">
          Sub sur la chaine <strong className="text-white">el_matte0</strong> pour
          gagner des badges aleatoires. Plus la rarete est haute, plus tu gagnes de
          points. Echange avec les autres pour completer ta collection !
        </p>
        <div className="flex items-center justify-center gap-4 pt-2">
          {isAuthenticated ? (
            <Link
              to="/collection"
              className="px-6 py-3 bg-twitch hover:bg-twitch-dark text-white font-semibold rounded-xl transition-colors"
            >
              Voir ma collection
            </Link>
          ) : (
            <button
              onClick={login}
              className="px-6 py-3 bg-twitch hover:bg-twitch-dark text-white font-semibold rounded-xl transition-colors"
            >
              Connexion Twitch
            </button>
          )}
          <Link
            to="/leaderboard"
            className="px-6 py-3 border border-gray-700 hover:border-gray-600 text-gray-300 hover:text-white font-semibold rounded-xl transition-colors"
          >
            Classement
          </Link>
        </div>
      </section>

      {/* How it works */}
      <section className="space-y-8">
        <h2 className="text-2xl font-bold text-center">Comment ca marche ?</h2>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            {
              step: "1",
              title: "Sub sur Twitch",
              desc: "Abonne-toi ou offre un sub sur la chaine el_matte0.",
            },
            {
              step: "2",
              title: "Tourne la roue",
              desc: "Chaque sub declenche un spin aleatoire avec des raretes differentes.",
            },
            {
              step: "3",
              title: "Collectionne & echange",
              desc: "Accumule des badges, grimpe dans le classement, et echange avec d'autres viewers.",
            },
          ].map((item) => (
            <div
              key={item.step}
              className="relative p-6 bg-gray-900/60 border border-gray-800 rounded-2xl space-y-3"
            >
              <div className="w-10 h-10 rounded-full bg-twitch/15 text-twitch flex items-center justify-center font-bold text-lg">
                {item.step}
              </div>
              <h3 className="text-lg font-semibold">{item.title}</h3>
              <p className="text-sm text-gray-400">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Stats */}
      {stats && (
        <section className="space-y-8">
          <h2 className="text-2xl font-bold text-center">Stats live</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Badges distribues", value: stats.total_badges },
              { label: "Collecteurs", value: stats.total_users },
              { label: "Legendaires", value: stats.by_rarity?.LEGENDARY || 0 },
              { label: "Uniques", value: stats.by_rarity?.UNIQUE || 0 },
            ].map((s) => (
              <div
                key={s.label}
                className="p-5 bg-gray-900/60 border border-gray-800 rounded-xl text-center"
              >
                <div className="text-2xl font-bold">{s.value}</div>
                <div className="text-xs text-gray-500 mt-1">{s.label}</div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Rarity showcase */}
      <section className="space-y-8">
        <h2 className="text-2xl font-bold text-center">Raretes</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
          {RARITY_ORDER.map((r) => {
            const color = RARITY_COLORS[r];
            const pts = RARITY_POINTS[r];
            return (
              <div
                key={r}
                className="flex flex-col items-center gap-3 p-5 rounded-xl border border-gray-800 bg-gray-900/60"
              >
                <div
                  className="w-16 h-16 rounded-2xl flex items-center justify-center"
                  style={{ backgroundColor: color + "18" }}
                >
                  <div
                    className="w-8 h-8 rounded-lg"
                    style={{ backgroundColor: color }}
                  />
                </div>
                <span className="text-sm font-bold" style={{ color }}>
                  {r}
                </span>
                <span className="text-xs text-gray-500">
                  {pts} point{pts > 1 ? "s" : ""}
                </span>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
