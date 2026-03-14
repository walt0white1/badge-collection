import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { fetchGlobalStats } from "../api";
import { useAuth } from "../hooks/useAuth";
import { useTheme } from "../context/ThemeContext";
import { RARITY_COLORS, RARITY_POINTS, RARITY_ORDER } from "../types";
import { getBadgeImage } from "../badgeImages";

// COMMON (#d9d9d9) is invisible on white bg — use a darker shade in light mode
const RARITY_COLORS_LIGHT: Record<string, string> = {
  ...RARITY_COLORS,
  COMMON: "#888888",
};

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
  const { isDark } = useTheme();
  const colors = isDark ? RARITY_COLORS : RARITY_COLORS_LIGHT;
  const [idx, setIdx] = useState(0);
  const [visible, setVisible] = useState(true);
  const touchX = useRef(0);
  const timer = useRef<ReturnType<typeof setTimeout>>();
  const pending = useRef<number | null>(null);

  const go = (next: number) => {
    clearTimeout(timer.current);
    const target = ((next % RARITY_ORDER.length) + RARITY_ORDER.length) % RARITY_ORDER.length;
    // Fade out, then swap content and fade in
    pending.current = target;
    setVisible(false);
  };

  // When fade-out finishes, swap content then fade in on next frame
  const onFadeEnd = () => {
    if (!visible && pending.current !== null) {
      setIdx(pending.current);
      pending.current = null;
      // Wait one frame so React paints the new content at opacity 0
      // before we start the fade-in transition
      requestAnimationFrame(() => {
        requestAnimationFrame(() => setVisible(true));
      });
    }
  };

  useEffect(() => {
    timer.current = setTimeout(() => go(idx + 1), 3200);
    return () => clearTimeout(timer.current);
  }, [idx]);

  const rarity = RARITY_ORDER[idx];
  const color = colors[rarity];
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
          timer.current = setTimeout(() => go(idx + 1), 3200);
        }
      }}
    >
      {/* Ambient glow */}
      <div
        className="mobile-glow"
        style={{ background: `radial-gradient(ellipse 80% 60% at 50% 55%, ${color}30, transparent 70%)` }}
      />

      {/* Fading container — single set of elements, no remounting */}
      <div
        className={`mobile-fade ${visible ? "mobile-fade-in" : "mobile-fade-out"}`}
        onTransitionEnd={onFadeEnd}
      >
        {/* Big background rarity text */}
        <div className="mobile-bg-rarity" style={{ color }}>
          {rarity}
        </div>

        {/* Badge */}
        <div className="mobile-badge-enter">
          <img
            src={getBadgeImage(rarity, "saison2")}
            alt={rarity}
            style={{ filter: `drop-shadow(0 0 50px ${color}80)` }}
            draggable={false}
          />
        </div>

        {/* Rarity name */}
        <p className="mobile-rarity-name" style={{ color }}>
          {rarity}
        </p>

        {/* Info */}
        <div className="mobile-rarity-info">
          <div className="mobile-stats-row">
            <span style={{ color, fontWeight: 800 }}>{pts} PTS</span>
            <span className="mobile-sep">·</span>
            <span>Drop {info.drop}</span>
          </div>
          <p>{info.desc}</p>
        </div>
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
  const { isDark } = useTheme();
  const colors = isDark ? RARITY_COLORS : RARITY_COLORS_LIGHT;
  const { data: stats } = useQuery({ queryKey: ["stats"], queryFn: fetchGlobalStats });

  return (
    <div className="showcase-page">
      {/* ═══ SCROLL-DRIVEN BADGE SHOWCASE (desktop) + MOBILE CAROUSEL ═══ */}
      <div className="badge-showcase">
        {/* Logo / title */}
        <div className="showcase-logo">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#9146FF]/10 text-[#9146FF] text-xs font-semibold tracking-[0.18em] uppercase mb-5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#9146FF] animate-pulse" />
            Saison 2 en cours
          </div>
          <h1>
            Badge
            <br />
            Collection
          </h1>
          <p className="mt-5 text-[#86868b] text-base sm:text-lg max-w-lg mx-auto leading-relaxed">
            Sub sur <strong className="text-white font-semibold">el_matte0</strong> pour gagner des badges exclusifs.{" "}
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
            const color = colors[r];
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
      <section className="relative z-20 overflow-hidden mt-8 sm:mt-0">

        {/* Subtle divider on mobile */}
        <div className="mx-auto w-[50%] max-w-[200px] h-px bg-gradient-to-r from-transparent via-white/[0.08] to-transparent sm:hidden" />

        <div className="relative pt-6 pb-8 md:py-28 px-6">
          <div className="flex flex-col lg:flex-row items-center gap-4 lg:gap-0 max-w-[1400px] mx-auto">
            <div className="lg:w-[35%] text-center lg:text-left shrink-0">
              <p className="text-[#3a3a3c] text-[10px] sm:text-xs font-semibold tracking-[0.25em] uppercase mb-2 sm:mb-4">
                Archive · Terminee
              </p>
              <h2 className="text-3xl sm:text-6xl font-black tracking-tight leading-[0.95] mb-2 sm:mb-5 text-white">
                Saison <span className="text-[#86868b]">One</span>
              </h2>
              <p className="text-[#86868b] text-xs sm:text-base max-w-sm mx-auto lg:mx-0 leading-relaxed hidden sm:block">
                Les 5 premiers badges de la collection. Plus disponibles au drop, mais toujours echangeables entre collectionneurs.
              </p>
              <p className="text-[#86868b] text-xs max-w-[280px] mx-auto leading-snug sm:hidden">
                Plus dispo au drop, mais echangeables entre collectionneurs.
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
                      style={{ filter: `drop-shadow(0 0 30px ${colors[r]}15)` }}
                      draggable={false}
                    />
                  </div>
                  <p
                    className="mt-2 text-[9px] sm:text-[11px] font-black tracking-[0.15em] uppercase transition-opacity duration-300 opacity-40 group-hover:opacity-100"
                    style={{ color: colors[r] }}
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

      {/* ═══ CTA ═══ */}
      <section className="relative z-20 overflow-hidden">

        <div className="relative py-14 sm:py-24 px-6 text-center">
          <p className="text-[#9146FF] text-xs font-semibold tracking-[0.2em] uppercase mb-4">
            {stats?.total_users || "100"}+ collectionneurs actifs
          </p>
          <h2 className="text-3xl sm:text-5xl font-black tracking-tight mb-3 sm:mb-5 text-white">
            A ton tour
          </h2>
          <p className="text-[#86868b] max-w-md mx-auto text-sm sm:text-base mb-8 sm:mb-10 leading-relaxed">
            Sub sur la chaine et tente ta chance a chaque stream.
          </p>
          <div className="flex flex-wrap items-center gap-3 justify-center">
            {isAuthenticated ? (
              <Link
                to="/collection"
                className="px-7 py-3.5 sm:px-8 sm:py-4 bg-[#9146FF] hover:bg-[#7c3aed] text-white font-semibold rounded-2xl transition-all duration-200 hover:-translate-y-0.5 text-base sm:text-lg"
              >
                Ma collection
              </Link>
            ) : (
              <button
                onClick={login}
                className="px-7 py-3.5 sm:px-8 sm:py-4 bg-[#9146FF] hover:bg-[#7c3aed] text-white font-semibold rounded-2xl transition-all duration-200 hover:-translate-y-0.5 text-base sm:text-lg"
              >
                Connexion Twitch
              </button>
            )}
            <Link
              to="/leaderboard"
              className="px-7 py-3.5 sm:px-8 sm:py-4 bg-[#1c1c1e] hover:bg-[#2c2c2e] text-white font-semibold rounded-2xl transition-all duration-200 hover:-translate-y-0.5 text-base sm:text-lg"
            >
              Classement
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
