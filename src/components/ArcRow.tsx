import { RARITY_ORDER, RARITY_COLORS, RARITY_POINTS } from "../types";
import { getBadgeImage } from "../badgeImages";
import type { ArcInfo } from "../arcConfig";
import { useTheme } from "../context/ThemeContext";

interface Props {
  season: string;
  counts: Record<string, number>;
  arc: ArcInfo;
  totalBadges: number;
  totalPts: number;
}

export default function ArcRow({
  season,
  counts,
  arc,
  totalBadges,
  totalPts,
}: Props) {
  const { isDark } = useTheme();

  return (
    <div className="space-y-5">
      {/* ── Season header ── */}
      <div className="flex items-center gap-3 flex-wrap">
        <h2
          className="text-2xl sm:text-3xl font-black tracking-tight leading-none"
          style={{ color: isDark ? "#f5f5f7" : "#1d1d1f" }}
        >
          {arc.name}
        </h2>
        {arc.status === "active" ? (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#9146FF]/15 border border-[#9146FF]/25 text-[#9146FF] text-[10px] font-bold tracking-widest uppercase">
            <span className="w-1.5 h-1.5 rounded-full bg-[#9146FF] animate-pulse" />
            En cours
          </span>
        ) : (
          <span
            className="px-2.5 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase"
            style={{
              background: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)",
              border: `1px solid ${isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)"}`,
              color: isDark ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.35)",
            }}
          >
            Archive
          </span>
        )}
        <div className="flex items-center gap-3 ml-auto text-sm">
          <span style={{ color: isDark ? "rgba(255,255,255,0.35)" : "rgba(0,0,0,0.35)" }}>
            <span className="font-semibold" style={{ color: isDark ? "#f5f5f7" : "#1d1d1f" }}>{totalBadges}</span>{" "}
            badge{totalBadges > 1 ? "s" : ""}
          </span>
          <span style={{ color: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)" }}>·</span>
          <span className="font-semibold text-[#9146FF]">{totalPts} pts</span>
        </div>
      </div>

      {arc.subtitle && (
        <p className="text-sm" style={{ color: isDark ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.35)" }}>
          {arc.subtitle}
        </p>
      )}

      {/* ── Badge grid — vitrine style ── */}
      <div className="grid grid-cols-5 gap-2 sm:gap-3">
        {RARITY_ORDER.map((r, i) => {
          const count = counts[r.toLowerCase()] ?? counts[r] ?? 0;
          const owned = count > 0;
          const color = RARITY_COLORS[r];
          const pts = RARITY_POINTS[r];
          const img = getBadgeImage(r, season);

          return (
            <div
              key={r}
              className="group relative flex flex-col items-center text-center rounded-xl sm:rounded-2xl overflow-hidden transition-all duration-300"
              style={{
                background: owned
                  ? isDark
                    ? `linear-gradient(180deg, ${color}08 0%, ${color}03 100%)`
                    : `linear-gradient(180deg, ${color}0a 0%, ${color}05 100%)`
                  : isDark ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.02)",
                border: `1px solid ${owned ? color + (isDark ? "15" : "25") : isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.06)"}`,
              }}
            >
              {/* Top shine */}
              {owned && (
                <div
                  className="absolute top-0 left-[10%] right-[10%] h-px"
                  style={{ background: `linear-gradient(90deg, transparent, ${color}40, transparent)` }}
                />
              )}

              {/* Badge image */}
              <div className="relative pt-4 sm:pt-6 pb-2 sm:pb-3 px-2">
                {owned && (
                  <div
                    className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] aspect-square rounded-full blur-2xl sm:blur-3xl"
                    style={{ background: color, opacity: 0.12 + i * 0.04 }}
                  />
                )}
                <img
                  src={img}
                  alt={r}
                  draggable={false}
                  className="relative z-10 w-full aspect-square object-contain transition-transform duration-300 group-hover:scale-110 group-hover:-translate-y-1"
                  style={{
                    filter: owned
                      ? `drop-shadow(0 4px 12px ${color}25)`
                      : isDark ? "grayscale(1) brightness(0.15)" : "grayscale(1) opacity(0.3)",
                    maxWidth: "120px",
                    margin: "0 auto",
                  }}
                />
              </div>

              {/* Info */}
              <div className="pb-3 sm:pb-4 px-1 sm:px-2 space-y-0.5 sm:space-y-1">
                <p
                  className="text-[9px] sm:text-[11px] font-black tracking-wider uppercase leading-none"
                  style={{ color: owned ? color : isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.12)" }}
                >
                  {r}
                </p>

                {/* Count */}
                <p
                  className="text-lg sm:text-2xl font-black tabular-nums leading-none"
                  style={{ color: owned ? (isDark ? "#f5f5f7" : "#1d1d1f") : isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.08)" }}
                >
                  {count}
                </p>

                <p
                  className="text-[8px] sm:text-[10px] leading-none"
                  style={{ color: isDark ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.25)" }}
                >
                  {pts} pt{pts > 1 ? "s" : ""} / badge
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
