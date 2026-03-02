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
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.05] border border-white/[0.08] text-[#9146FF] text-xs font-semibold tracking-wider mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-[#9146FF] animate-pulse" />
            SAISON 2 EN COURS
          </div>
          <h1>
            Badge
            <br />
            Collection
          </h1>
          <p className="mt-4 text-gray-500 text-sm sm:text-base max-w-md mx-auto">
            Sub sur <strong className="text-white">el_matte0</strong> pour gagner des badges exclusifs.
            Scrolle pour decouvrir les raretes.
          </p>
        </div>

        {/* Rarity names — giant text fading in/out per scroll position */}
        <div className="rarity-names">
          {RARITY_ORDER.map((r) => (
            <h2 key={r}>{r}</h2>
          ))}
        </div>

        {/* Badge wrapper — items animate based on scroll progress */}
        <div className="badge-wrapper">
          {RARITY_ORDER.map((r) => {
            const info = BADGE_INFO[r];
            const color = RARITY_COLORS[r];
            const pts = RARITY_POINTS[r];

            return (
              <div key={r} className="badge-item">
                <img
                  src={getBadgeImage(r, "saison2")}
                  alt={info.name}
                  draggable={false}
                />
                <div
                  className="badge-data"
                  style={{ borderColor: `${color}33`, border: `1px solid ${color}33` }}
                >
                  <h3 style={{ color }}>{info.name}</h3>
                  <div className="badge-data-grid">
                    <label>Points</label>
                    <p>
                      <span style={{ color, fontWeight: 800 }}>{pts}</span>{" "}
                      <span className="opacity-50">PTS</span>
                    </p>
                    <label>Drop</label>
                    <p>{info.drop}</p>
                    <label>Saison</label>
                    <p>Saison 2</p>
                  </div>
                  <p className="badge-notes">{info.desc}</p>
                </div>
              </div>
            );
          })}
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

      {/* ═══ AFTER SHOWCASE — STATS + CTA ═══ */}
      <section className="relative z-20 bg-[#050508] border-t border-white/[0.04]">
        <div className="max-w-[1100px] mx-auto px-6 sm:px-8 py-20 space-y-16">
          {/* Stats */}
          {stats && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { value: stats.total_badges, label: "Badges", color: "#a78bfa" },
                { value: stats.total_users, label: "Joueurs", color: "#60a5fa" },
                { value: stats.by_rarity?.LEGENDARY || 0, label: "Legendaires", color: RARITY_COLORS.LEGENDARY },
                { value: stats.by_rarity?.UNIQUE || 0, label: "Uniques", color: RARITY_COLORS.UNIQUE },
              ].map((s) => (
                <div
                  key={s.label}
                  className="text-center py-5 rounded-2xl bg-white/[0.02] border border-white/[0.05]"
                >
                  <div className="text-2xl sm:text-3xl font-black tabular-nums" style={{ color: s.color }}>
                    {s.value.toLocaleString()}
                  </div>
                  <div className="text-[10px] text-gray-600 mt-1 uppercase tracking-widest font-semibold">
                    {s.label}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* CTA */}
          <div className="text-center space-y-6">
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight">
              Pret a collectionner ?
            </h2>
            <p className="text-gray-500 max-w-md mx-auto text-sm sm:text-base">
              Rejoins les {stats?.total_users || "100"}+ collectionneurs.
              <br />
              Sub sur la chaine pour tenter ta chance.
            </p>
            <div className="flex flex-wrap items-center gap-3 justify-center pt-2">
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
        </div>
      </section>
    </div>
  );
}
