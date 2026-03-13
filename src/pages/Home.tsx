import { useState, useEffect, useRef } from "react";
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

function MobileShowcase() {
  const [idx, setIdx] = useState(0);
  const touchX = useRef(0);
  const timer = useRef<ReturnType<typeof setTimeout>>();

  const go = (next: number) => {
    clearTimeout(timer.current);
    setIdx(((next % RARITY_ORDER.length) + RARITY_ORDER.length) % RARITY_ORDER.length);
  };

  useEffect(() => {
    timer.current = setTimeout(() => go(idx + 1), 3200);
    return () => clearTimeout(timer.current);
  }, [idx]);

  const rarity = RARITY_ORDER[idx];
  const color = RARITY_COLORS[rarity];
  const info = BADGE_INFO[rarity];
  const pts = RARITY_POINTS[rarity];

  return (
    <div
      className="mobile-showcase"
      onTouchStart={(e) => {
        touchX.current = e.touches[0].clientX;
        clearTimeout(timer.current);
      }}
      onTouchEnd={(e) => {
        const d = e.changedTouches[0].clientX - touchX.current;
        if (Math.abs(d) > 40) {
          go(d < 0 ? idx + 1 : idx - 1);
        } else {
          // Swipe trop court : relancer le timer manuellement
          timer.current = setTimeout(() => go(idx + 1), 3200);
        }
      }}
    >
      {/* Ambient glow */}
      <div
        className="mobile-glow"
        style={{ background: `radial-gradient(ellipse 80% 60% at 50% 55%, ${color}30, transparent 70%)` }}
      />

      {/* Big background rarity text */}
      <div className="mobile-bg-rarity" style={{ color }}>
        {rarity}
      </div>

      {/* Badge — keyed to trigger pop animation on change */}
      <div key={`badge-${idx}`} className="mobile-badge-enter">
        <img
          src={getBadgeImage(rarity, "saison2")}
          alt={rarity}
          style={{ filter: `drop-shadow(0 0 50px ${color}80)` }}
          draggable={false}
        />
      </div>

      {/* Rarity name */}
      <p key={`name-${idx}`} className="mobile-rarity-name" style={{ color }}>
        {rarity}
      </p>

      {/* Info */}
      <div key={`info-${idx}`} className="mobile-rarity-info">
        <div className="mobile-stats-row">
          <span style={{ color, fontWeight: 800 }}>{pts} PTS</span>
          <span className="mobile-sep">·</span>
          <span>Drop {info.drop}</span>
        </div>
        <p>{info.desc}</p>
      </div>

      {/* Dots */}
      <div className="mobile-dots">
        {RARITY_ORDER.map((r, i) => (
          <button
            key={r}
            className={`mobile-dot${i === idx ? " active" : ""}`}
            style={i === idx ? { background: color } : undefined}
            onClick={() => go(i)}
          />
        ))}
      </div>
    </div>
  );
}

export default function Home() {
  const { isAuthenticated, login } = useAuth();
  const { data: stats } = useQuery({ queryKey: ["stats"], queryFn: fetchGlobalStats });

  return (
    <div className="showcase-page">
      {/* ═══ SCROLL-DRIVEN BADGE SHOWCASE (desktop) + MOBILE CAROUSEL ═══ */}
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

        {/* Desktop scroll showcase — hidden on mobile via CSS */}
        <div className="rarity-titles">
          {RARITY_ORDER.map((r) => (
            <div key={r} className="rarity-title-slide">
              <h2>{r}</h2>
            </div>
          ))}
        </div>

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

        <div className="scroll-indicator">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 5v14M5 12l7 7 7-7" />
          </svg>
          <span>Scroll</span>
        </div>

        {/* Mobile carousel — shown only on mobile via CSS */}
        <MobileShowcase />
      </div>

      {/* ═══ SEASON 1 — FULL-WIDTH SHOWCASE ═══ */}
      <section className="relative z-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#9146ff]/[0.03] to-transparent pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_50%,rgba(145,70,255,0.06),transparent)] pointer-events-none" />

        <div className="relative pt-3 pb-14 md:py-28 px-6">
          <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-0 max-w-[1400px] mx-auto">
            <div className="lg:w-[35%] text-center lg:text-left shrink-0">
              <p className="text-gray-600 text-xs font-semibold tracking-[0.25em] uppercase mb-4">
                Archive · Terminee
              </p>
              <h2 className="text-4xl sm:text-6xl font-black tracking-tight leading-[0.95] mb-5">
                Saison
                <br />
                <span className="bg-gradient-to-r from-gray-300 to-gray-500 bg-clip-text text-transparent">One</span>
              </h2>
              <p className="text-gray-500 text-sm sm:text-base max-w-sm mx-auto lg:mx-0 leading-relaxed">
                Les 5 premiers badges de la collection. Plus disponibles au drop, mais toujours echangeables entre collectionneurs.
              </p>
            </div>

            <div className="lg:w-[65%] flex items-center justify-center gap-3 sm:gap-5 md:gap-8">
              {RARITY_ORDER.map((r, idx) => (
                <div
                  key={`s1-${r}`}
                  className="group text-center"
                  style={{ transform: `translateY(${idx % 2 === 0 ? -8 : 8}px)` }}
                >
                  <div className="relative">
                    <img
                      src={getBadgeImage(r, "saison1")}
                      alt={`S1 ${r}`}
                      className="w-24 sm:w-32 md:w-40 lg:w-44 aspect-square object-contain transition-all duration-500 group-hover:scale-110 group-hover:-translate-y-3"
                      style={{ filter: `drop-shadow(0 0 30px ${RARITY_COLORS[r]}15)` }}
                      draggable={false}
                    />
                  </div>
                  <p
                    className="mt-2 text-[9px] sm:text-[11px] font-black tracking-[0.15em] uppercase transition-opacity duration-300 opacity-40 group-hover:opacity-100"
                    style={{ color: RARITY_COLORS[r] }}
                  >
                    {r}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mx-auto w-[80%] max-w-[600px] h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
      </section>

      {/* ═══ STATS STRIP ═══ */}
      <section className="relative z-20">
        <div className="py-16 px-6">
          <div className="max-w-[1200px] mx-auto flex items-stretch justify-between gap-2">
            {stats && [
              { value: stats.total_badges, label: "Badges drops", color: "#a78bfa" },
              { value: stats.total_users, label: "Collectionneurs", color: "#60a5fa" },
              { value: stats.by_rarity?.LEGENDARY || 0, label: "Legendaires trouves", color: RARITY_COLORS.LEGENDARY },
              { value: stats.by_rarity?.UNIQUE || 0, label: "Uniques en circulation", color: RARITY_COLORS.UNIQUE },
            ].map((s, idx, arr) => (
              <div key={s.label} className="flex-1 text-center relative">
                <span className="block text-4xl sm:text-5xl md:text-6xl font-black tabular-nums leading-none" style={{ color: s.color }}>
                  {s.value.toLocaleString()}
                </span>
                <span className="block mt-2 text-[10px] sm:text-xs text-gray-600 uppercase tracking-[0.12em] font-medium">
                  {s.label}
                </span>
                {idx < arr.length - 1 && (
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 w-px h-10 bg-white/[0.04]" />
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="mx-auto w-[80%] max-w-[600px] h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
      </section>

      {/* ═══ CTA ═══ */}
      <section className="relative z-20 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_40%_at_50%_70%,rgba(145,70,255,0.08),transparent)] pointer-events-none" />

        <div className="relative py-24 px-6 text-center">
          <h2 className="text-4xl sm:text-5xl font-black tracking-tight mb-5">
            Pret a collectionner ?
          </h2>
          <p className="text-gray-500 max-w-lg mx-auto text-base sm:text-lg mb-10 leading-relaxed">
            Rejoins les <strong className="text-gray-300">{stats?.total_users || "100"}+</strong> collectionneurs actifs.
            <br />
            Sub sur la chaine pour tenter ta chance a chaque stream.
          </p>
          <div className="flex flex-wrap items-center gap-4 justify-center">
            {isAuthenticated ? (
              <Link
                to="/collection"
                className="px-8 py-4 bg-[#9146FF] hover:bg-[#772CE8] text-white font-bold rounded-xl transition-all duration-300 hover:shadow-[0_0_40px_rgba(145,70,255,0.3)] hover:-translate-y-0.5 text-lg"
              >
                Ma collection
              </Link>
            ) : (
              <button
                onClick={login}
                className="px-8 py-4 bg-[#9146FF] hover:bg-[#772CE8] text-white font-bold rounded-xl transition-all duration-300 hover:shadow-[0_0_40px_rgba(145,70,255,0.3)] hover:-translate-y-0.5 text-lg"
              >
                Connexion Twitch
              </button>
            )}
            <Link
              to="/leaderboard"
              className="px-8 py-4 bg-white/[0.04] hover:bg-white/[0.07] border border-white/[0.06] text-gray-300 font-bold rounded-xl transition-all duration-300 hover:-translate-y-0.5 text-lg"
            >
              Classement
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
