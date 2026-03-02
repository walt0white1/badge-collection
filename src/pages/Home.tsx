import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { fetchGlobalStats } from "../api";
import { useAuth } from "../hooks/useAuth";
import { RARITY_COLORS, RARITY_POINTS, RARITY_ORDER } from "../types";
import { getBadgeImage } from "../badgeImages";

const STEPS = [
  { icon: "🎬", title: "Sub", desc: "Abonne-toi sur la chaine" },
  { icon: "🎰", title: "Spin", desc: "La roue tourne en live" },
  { icon: "💎", title: "Collect", desc: "Decouvre ta rarete" },
  { icon: "🔄", title: "Trade", desc: "Echange avec les viewers" },
];

export default function Home() {
  const { isAuthenticated, login } = useAuth();
  const { data: stats } = useQuery({ queryKey: ["stats"], queryFn: fetchGlobalStats });

  return (
    <div className="min-h-screen">

      {/* ═══ HERO ═══ */}
      <section className="relative overflow-hidden">
        {/* Background glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] bg-twitch/[0.07] rounded-full blur-[120px] pointer-events-none" />

        <div className="max-w-[1400px] mx-auto px-6 sm:px-8 pt-20 pb-16 relative">
          <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
            {/* Left — text */}
            <div className="flex-1 space-y-6 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-twitch/10 border border-twitch/20 text-twitch text-xs font-semibold tracking-wide">
                <span className="w-1.5 h-1.5 rounded-full bg-twitch animate-pulse" />
                SAISON 2 EN COURS
              </div>

              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black tracking-tight leading-[0.95]">
                Collecte.<br />
                Echange.<br />
                <span className="text-gradient">Domine.</span>
              </h1>

              <p className="text-lg text-gray-400 max-w-lg">
                Sub sur <strong className="text-white">el_matte0</strong> pour gagner des badges.
                Plus c'est rare, plus tu gagnes de points.
              </p>

              <div className="flex items-center gap-3 justify-center lg:justify-start pt-2">
                {isAuthenticated ? (
                  <Link
                    to="/collection"
                    className="px-7 py-3.5 bg-twitch hover:bg-twitch-dark text-white font-bold rounded-xl transition-all hover:shadow-lg hover:shadow-twitch/25"
                  >
                    Ma collection
                  </Link>
                ) : (
                  <button
                    onClick={login}
                    className="px-7 py-3.5 bg-twitch hover:bg-twitch-dark text-white font-bold rounded-xl transition-all hover:shadow-lg hover:shadow-twitch/25"
                  >
                    Connexion Twitch
                  </button>
                )}
                <Link
                  to="/leaderboard"
                  className="px-7 py-3.5 bg-white/[0.05] hover:bg-white/[0.08] border border-white/10 text-gray-200 font-bold rounded-xl transition-all"
                >
                  Classement
                </Link>
              </div>
            </div>

            {/* Right — floating badge showcase */}
            <div className="relative w-80 h-80 sm:w-96 sm:h-96 shrink-0">
              {/* Orbital rings */}
              <div className="absolute inset-4 rounded-full border border-white/[0.04] animate-[spin_30s_linear_infinite]" />
              <div className="absolute inset-12 rounded-full border border-white/[0.06] animate-[spin_20s_linear_infinite_reverse]" />

              {/* Center badge (current season highlight) */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
                <div className="relative">
                  <div className="absolute inset-0 bg-twitch/20 rounded-full blur-2xl scale-150" />
                  <img
                    src={getBadgeImage("LEGENDARY", "saison2")}
                    alt="LEGENDARY"
                    className="w-28 h-28 sm:w-32 sm:h-32 object-contain drop-shadow-2xl relative z-10"
                  />
                </div>
              </div>

              {/* Orbiting badges */}
              {[
                { r: "COMMON", x: "8%", y: "15%", size: "w-14 h-14", delay: "0s" },
                { r: "RARE", x: "75%", y: "8%", size: "w-16 h-16", delay: "1s" },
                { r: "EPIC", x: "85%", y: "65%", size: "w-16 h-16", delay: "2s" },
                { r: "UNIQUE", x: "5%", y: "72%", size: "w-14 h-14", delay: "0.5s" },
              ].map((b) => (
                <div
                  key={b.r}
                  className="absolute animate-bounce"
                  style={{
                    left: b.x,
                    top: b.y,
                    animationDelay: b.delay,
                    animationDuration: "3s",
                  }}
                >
                  <img
                    src={getBadgeImage(b.r, "saison2")}
                    alt={b.r}
                    className={`${b.size} object-contain drop-shadow-lg opacity-70`}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ═══ FLOW STEPS ═══ */}
      <section className="max-w-[1400px] mx-auto px-6 sm:px-8 py-16">
        <div className="relative flex flex-col sm:flex-row items-stretch gap-4 sm:gap-0">
          {/* Connecting line (desktop) */}
          <div className="hidden sm:block absolute top-1/2 left-[10%] right-[10%] h-px bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-y-1/2" />

          {STEPS.map((step, i) => (
            <div key={step.title} className="flex-1 relative flex flex-col items-center text-center gap-3 py-6 group">
              {/* Step number */}
              <div className="absolute -top-1 right-4 sm:right-auto sm:-top-2 text-[40px] font-black text-white/[0.03] leading-none select-none">
                {i + 1}
              </div>
              <span className="text-3xl relative z-10">{step.icon}</span>
              <h3 className="text-base font-bold text-white">{step.title}</h3>
              <p className="text-sm text-gray-500 max-w-[160px]">{step.desc}</p>
              {/* Arrow between steps on desktop */}
              {i < STEPS.length - 1 && (
                <div className="hidden sm:block absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 text-white/10 text-lg z-10">
                  &rsaquo;
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ═══ STATS BAR ═══ */}
      {stats && (
        <section className="max-w-[1400px] mx-auto px-6 sm:px-8 py-8">
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-white/[0.03] via-white/[0.06] to-white/[0.03] border border-white/[0.06] p-1">
            <div className="flex flex-wrap">
              {[
                { value: stats.total_badges, label: "Badges", color: "#a78bfa" },
                { value: stats.total_users, label: "Joueurs", color: "#60a5fa" },
                { value: stats.by_rarity?.LEGENDARY || 0, label: "Legendaires", color: RARITY_COLORS.LEGENDARY },
                { value: stats.by_rarity?.UNIQUE || 0, label: "Uniques", color: RARITY_COLORS.UNIQUE },
              ].map((s, i) => (
                <div
                  key={s.label}
                  className={`flex-1 min-w-[140px] px-6 py-5 text-center ${
                    i > 0 ? "border-l border-white/[0.06]" : ""
                  }`}
                >
                  <div className="text-3xl sm:text-4xl font-black tabular-nums" style={{ color: s.color }}>
                    {s.value.toLocaleString()}
                  </div>
                  <div className="text-xs text-gray-500 mt-1 font-medium tracking-wide uppercase">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ═══ RARITY SHOWCASE ═══ */}
      <section className="max-w-[1400px] mx-auto px-6 sm:px-8 py-16 space-y-12">
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-black">5 raretes a collectionner</h2>
          <p className="text-gray-500">Du plus commun au plus precieux</p>
        </div>

        {/* Single rarity scale — badges grow in size and glow */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-4 md:gap-8">
          {RARITY_ORDER.map((r, i) => {
            const color = RARITY_COLORS[r];
            const pts = RARITY_POINTS[r];
            const scale = 0.75 + i * 0.15; // 0.75 → 1.35
            const glowSize = i * 8; // 0 → 32

            return (
              <div
                key={r}
                className="flex flex-col items-center gap-3 group transition-transform duration-300 hover:scale-110"
              >
                {/* Badge with progressive glow */}
                <div className="relative">
                  {glowSize > 0 && (
                    <div
                      className="absolute inset-0 rounded-full blur-xl opacity-40 group-hover:opacity-60 transition-opacity"
                      style={{
                        background: color,
                        transform: `scale(${1 + i * 0.3})`,
                      }}
                    />
                  )}
                  <img
                    src={getBadgeImage(r, "saison2")}
                    alt={r}
                    className="object-contain drop-shadow-lg relative z-10 transition-transform duration-300"
                    style={{
                      width: `${scale * 80}px`,
                      height: `${scale * 80}px`,
                    }}
                  />
                </div>

                {/* Label */}
                <div className="text-center space-y-1">
                  <span className="text-xs font-black tracking-widest" style={{ color }}>
                    {r}
                  </span>
                  <div className="flex items-center gap-1 justify-center">
                    <span className="text-lg font-black" style={{ color }}>{pts}</span>
                    <span className="text-[10px] text-gray-600 font-medium">PTS</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Saison 1 smaller preview */}
        <div className="pt-8 space-y-4">
          <div className="flex items-center gap-4 justify-center">
            <div className="w-16 h-px bg-white/[0.06]" />
            <span className="text-xs font-semibold text-gray-600 uppercase tracking-widest">Saison 1</span>
            <div className="w-16 h-px bg-white/[0.06]" />
          </div>
          <div className="flex items-center justify-center gap-6 opacity-60 hover:opacity-80 transition-opacity">
            {RARITY_ORDER.map((r) => (
              <img
                key={r}
                src={getBadgeImage(r, "saison1")}
                alt={r}
                className="w-12 h-12 object-contain grayscale-[30%] hover:grayscale-0 transition-all duration-300 hover:scale-125"
              />
            ))}
          </div>
        </div>
      </section>

      {/* ═══ CTA ═══ */}
      <section className="max-w-[1400px] mx-auto px-6 sm:px-8 pb-20">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-twitch/20 via-purple-900/20 to-transparent border border-twitch/20 p-12 text-center">
          <div className="absolute top-0 right-0 w-64 h-64 bg-twitch/10 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2" />
          <div className="relative z-10 space-y-5">
            <h2 className="text-3xl font-black">Pret a collectionner ?</h2>
            <p className="text-gray-400 max-w-md mx-auto">
              Rejoins les {stats?.total_users || "100"}+ collectionneurs et commence a accumuler des badges.
            </p>
            {isAuthenticated ? (
              <Link
                to="/collection"
                className="inline-block px-8 py-4 bg-twitch hover:bg-twitch-dark text-white font-bold rounded-xl transition-all hover:shadow-lg hover:shadow-twitch/25 text-lg"
              >
                Voir ma collection
              </Link>
            ) : (
              <button
                onClick={login}
                className="px-8 py-4 bg-twitch hover:bg-twitch-dark text-white font-bold rounded-xl transition-all hover:shadow-lg hover:shadow-twitch/25 text-lg"
              >
                Commencer maintenant
              </button>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
