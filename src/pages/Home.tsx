import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { fetchGlobalStats } from "../api";
import { useAuth } from "../hooks/useAuth";
import { RARITY_COLORS, RARITY_POINTS, RARITY_ORDER } from "../types";
import { getBadgeImage } from "../badgeImages";

const BADGE_INFO: Record<string, { name: string; desc: string; drop: string }> = {
  COMMON: {
    name: "Common",
    desc: "Le badge de base. Facile a obtenir, parfait pour debuter ta collection.",
    drop: "~50%",
  },
  RARE: {
    name: "Rare",
    desc: "Plus difficile a trouver. Ton vrai debut de collection commence ici.",
    drop: "~30%",
  },
  EPIC: {
    name: "Epic",
    desc: "Le graal des collectionneurs assidus. Tu commences a avoir du level.",
    drop: "~15%",
  },
  LEGENDARY: {
    name: "Legendary",
    desc: "Extremement rare. Seuls les plus chanceux mettent la main dessus.",
    drop: "~4%",
  },
  UNIQUE: {
    name: "Unique",
    desc: "Le badge ultime. Un seul exemplaire existe. La piece de collection absolue.",
    drop: "~1%",
  },
};

export default function Home() {
  const { isAuthenticated, login } = useAuth();
  const { data: stats } = useQuery({ queryKey: ["stats"], queryFn: fetchGlobalStats });

  return (
    <div className="showcase-page">
      {/* ═══ SCROLL-DRIVEN BADGE SHOWCASE ═══ */}
      <div className="badge-showcase">
        {/* Logo / title */}
        <div className="showcase-logo">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/[0.05] border border-white/[0.08] text-[#9146FF] text-sm font-semibold tracking-wider mb-5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#9146FF] animate-pulse" />
            SAISON 2 EN COURS
          </div>
          <h1>
            Badge
            <br />
            Collection
          </h1>
          <p className="mt-5 text-gray-400 text-base sm:text-lg max-w-lg mx-auto">
            Sub sur <strong className="text-white">el_matte0</strong> pour gagner des badges exclusifs.
            Scrolle pour decouvrir les raretes.
          </p>
        </div>

        {/* Rarity titles — above the badge */}
        <div className="rarity-titles">
          {RARITY_ORDER.map((r) => (
            <div key={r} className="rarity-title-slide">
              <h2>{r}</h2>
            </div>
          ))}
        </div>

        {/* Rarity info — below the badge */}
        <div className="rarity-infos">
          {RARITY_ORDER.map((r) => {
            const info = BADGE_INFO[r];
            const color = RARITY_COLORS[r];
            const pts = RARITY_POINTS[r];
            return (
              <div key={r} className="rarity-info-slide">
                <div className="rarity-info">
                  <span className="rarity-pts" style={{ color }}>{pts} PTS</span>
                  <span className="rarity-sep">·</span>
                  <span className="rarity-drop">Drop {info.drop}</span>
                  <span className="rarity-sep">·</span>
                  <span className="rarity-desc">{info.desc}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Badge wrapper — items animate based on scroll progress */}
        <div className="badge-wrapper">
          {RARITY_ORDER.map((r) => (
            <div key={r} className="badge-item">
              <img
                src={getBadgeImage(r, "saison2")}
                alt={BADGE_INFO[r].name}
                draggable={false}
              />
            </div>
          ))}
        </div>

        {/* Scroll indicator */}
        <div className="scroll-indicator">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 5v14M5 12l7 7 7-7" />
          </svg>
          <span>Scroll</span>
        </div>
      </div>

      {/* ═══ SEASON 1 BADGES ═══ */}
      <section className="relative z-20 py-24">
        <div className="max-w-[1100px] mx-auto px-6">
          <p className="text-center text-gray-600 text-xs font-semibold tracking-[0.2em] uppercase mb-6">
            Archive
          </p>
          <h2 className="text-center text-3xl sm:text-5xl font-black tracking-tight mb-3">
            Saison 1
          </h2>
          <p className="text-center text-gray-500 text-sm sm:text-base mb-16 max-w-md mx-auto">
            Les badges de la premiere saison. Plus disponibles, mais toujours echangeables.
          </p>
          <div className="flex items-end justify-center gap-8 sm:gap-14">
            {RARITY_ORDER.map((r) => (
              <div key={`s1-${r}`} className="group text-center">
                <img
                  src={getBadgeImage(r, "saison1")}
                  alt={`S1 ${r}`}
                  className="w-20 sm:w-28 md:w-36 aspect-square object-contain drop-shadow-[0_0_20px_rgba(255,255,255,0.06)] transition-transform duration-300 group-hover:scale-110 group-hover:-translate-y-2"
                  draggable={false}
                />
                <p className="mt-3 text-[10px] sm:text-xs font-bold tracking-widest uppercase opacity-60 group-hover:opacity-100 transition-opacity" style={{ color: RARITY_COLORS[r] }}>
                  {r}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ STATS + CTA ═══ */}
      <section className="relative z-20 py-24">
        <div className="max-w-[900px] mx-auto px-6 text-center">
          {/* Stats inline */}
          {stats && (
            <div className="flex items-center justify-center gap-6 sm:gap-10 mb-16 flex-wrap">
              {[
                { value: stats.total_badges, label: "badges", color: "#a78bfa" },
                { value: stats.total_users, label: "joueurs", color: "#60a5fa" },
                { value: stats.by_rarity?.LEGENDARY || 0, label: "legendaires", color: RARITY_COLORS.LEGENDARY },
                { value: stats.by_rarity?.UNIQUE || 0, label: "uniques", color: RARITY_COLORS.UNIQUE },
              ].map((s, idx, arr) => (
                <div key={s.label} className="flex items-center gap-6 sm:gap-10">
                  <div className="text-center">
                    <span className="block text-3xl sm:text-4xl font-black tabular-nums" style={{ color: s.color }}>
                      {s.value.toLocaleString()}
                    </span>
                    <span className="text-[10px] text-gray-600 uppercase tracking-[0.15em] font-semibold">
                      {s.label}
                    </span>
                  </div>
                  {idx < arr.length - 1 && (
                    <span className="text-white/[0.06] text-2xl font-thin select-none">|</span>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* CTA */}
          <h2 className="text-3xl sm:text-4xl font-black tracking-tight mb-4">
            Pret a collectionner ?
          </h2>
          <p className="text-gray-500 max-w-md mx-auto text-sm sm:text-base mb-8">
            Rejoins les {stats?.total_users || "100"}+ collectionneurs.
            <br />
            Sub sur la chaine pour tenter ta chance.
          </p>
          <div className="flex flex-wrap items-center gap-3 justify-center">
            {isAuthenticated ? (
              <Link
                to="/collection"
                className="px-7 py-3.5 bg-[#9146FF] hover:bg-[#772CE8] text-white font-bold rounded-xl transition-all hover:shadow-lg hover:shadow-[#9146FF]/25"
              >
                Ma collection
              </Link>
            ) : (
              <button
                onClick={login}
                className="px-7 py-3.5 bg-[#9146FF] hover:bg-[#772CE8] text-white font-bold rounded-xl transition-all hover:shadow-lg hover:shadow-[#9146FF]/25"
              >
                Connexion Twitch
              </button>
            )}
            <Link
              to="/leaderboard"
              className="px-7 py-3.5 bg-white/[0.04] hover:bg-white/[0.07] border border-white/[0.08] text-gray-300 font-bold rounded-xl transition-all"
            >
              Classement
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
