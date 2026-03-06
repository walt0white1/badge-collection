import { RARITY_ORDER, RARITY_COLORS, RARITY_POINTS } from "../types";
import { getBadgeImage } from "../badgeImages";
import type { ArcInfo } from "../arcConfig";

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
  return (
    <div className="space-y-6 sm:space-y-8">
      {/* ── Arc header ── */}
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center gap-3">
          <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-white leading-none">
            {arc.name}
          </h2>
          {arc.status === "active" ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#9146FF]/15 border border-[#9146FF]/25 text-[#9146FF] text-[10px] font-bold tracking-widest uppercase">
              <span className="w-1.5 h-1.5 rounded-full bg-[#9146FF] animate-pulse" />
              En cours
            </span>
          ) : (
            <span className="px-2.5 py-1 rounded-full bg-white/[0.04] border border-white/[0.06] text-gray-500 text-[10px] font-bold tracking-widest uppercase">
              Archive
            </span>
          )}
        </div>
        <p className="text-sm text-gray-600">{arc.subtitle}</p>
        <div className="flex items-center justify-center gap-4 text-sm">
          <span className="text-gray-500">
            <span className="text-white font-semibold">{totalBadges}</span>{" "}
            badge{totalBadges > 1 ? "s" : ""}
          </span>
          <span className="text-white/10">·</span>
          <span className="text-[#9146FF] font-semibold">{totalPts} pts</span>
        </div>
      </div>

      {/* ── Roster ── */}
      <div className="relative max-w-4xl mx-auto">
        {/* Vertical timeline bar (left side) */}
        <div className="absolute left-5 sm:left-7 top-0 bottom-0 w-[3px] rounded-full bg-gradient-to-b from-transparent via-white/[0.06] to-transparent" />

        <div className="flex flex-col gap-3 sm:gap-4">
          {RARITY_ORDER.map((r, i) => {
            const count = counts[r.toLowerCase()] ?? counts[r] ?? 0;
            const owned = count > 0;
            const color = RARITY_COLORS[r];
            const pts = RARITY_POINTS[r];
            const img = getBadgeImage(r, season);
            const tier = i;

            return (
              <div key={r} className="relative flex items-center">
                {/* ── Timeline node ── */}
                <div className="relative z-20 shrink-0 w-10 sm:w-14 flex items-center justify-center">
                  {owned && (
                    <div
                      className="absolute w-8 h-8 sm:w-10 sm:h-10 rounded-full blur-lg"
                      style={{ background: color, opacity: 0.3 + tier * 0.08 }}
                    />
                  )}
                  <div
                    className="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full border-2 relative z-10"
                    style={{
                      borderColor: owned ? color : "rgba(255,255,255,0.08)",
                      background: owned ? color : "#0a0a0f",
                      boxShadow: owned
                        ? `0 0 10px ${color}50, 0 0 20px ${color}20`
                        : "none",
                    }}
                  />
                </div>

                {/* ── Badge panel ── */}
                <div
                  className="group relative flex-1 overflow-hidden rounded-xl sm:rounded-2xl transition-all duration-300 hover:scale-[1.01]"
                  style={{
                    background: owned
                      ? `linear-gradient(135deg, ${color}05 0%, ${color}10 40%, ${color}05 100%)`
                      : "rgba(255,255,255,0.015)",
                    border: `1px solid ${owned ? color + "18" : "rgba(255,255,255,0.04)"}`,
                    boxShadow: owned
                      ? `0 0 30px -10px ${color}15, inset 0 1px 0 ${color}08`
                      : "none",
                  }}
                >
                  {/* Diagonal accent lines */}
                  {owned && (
                    <>
                      <div
                        className="absolute inset-y-0 w-[2px] opacity-[0.07]"
                        style={{
                          left: "32%",
                          background: color,
                          transform: "skewX(-15deg)",
                        }}
                      />
                      <div
                        className="absolute inset-y-0 w-px opacity-[0.04]"
                        style={{
                          left: "55%",
                          background: color,
                          transform: "skewX(-15deg)",
                        }}
                      />
                      {/* Top edge shine */}
                      <div
                        className="absolute top-0 left-[5%] right-[5%] h-px opacity-30"
                        style={{
                          background: `linear-gradient(90deg, transparent, ${color}, transparent)`,
                        }}
                      />
                    </>
                  )}

                  <div className="relative z-10 flex items-center gap-3 sm:gap-6 px-3 sm:px-6 py-3 sm:py-4">
                    {/* Badge image */}
                    <div className="relative shrink-0">
                      {owned && (
                        <div
                          className="absolute inset-0 rounded-full blur-2xl sm:blur-3xl transition-opacity group-hover:opacity-60"
                          style={{
                            background: color,
                            opacity: 0.15 + tier * 0.08,
                            transform: `scale(${1.3 + tier * 0.12})`,
                          }}
                        />
                      )}
                      <img
                        src={img}
                        alt={r}
                        draggable={false}
                        className="relative z-10 w-16 h-16 sm:w-24 sm:h-24 md:w-32 md:h-32 object-contain transition-all duration-300 group-hover:scale-110 group-hover:-translate-y-0.5"
                        style={{
                          filter: owned
                            ? `drop-shadow(0 4px 16px ${color}30)`
                            : "grayscale(1) brightness(0.15)",
                        }}
                      />
                    </div>

                    {/* Info section */}
                    <div className="flex-1 min-w-0">
                      <p
                        className="text-base sm:text-xl md:text-2xl font-black tracking-tight uppercase leading-none"
                        style={{
                          color: owned ? color : "rgba(255,255,255,0.06)",
                        }}
                      >
                        {r}
                      </p>
                      <p className="text-[10px] sm:text-xs text-gray-600 mt-0.5 sm:mt-1">
                        {pts} pt{pts > 1 ? "s" : ""} par badge
                      </p>
                    </div>

                    {/* Count (far right) */}
                    <div className="shrink-0 flex flex-col items-end">
                      <span
                        className="text-2xl sm:text-3xl md:text-4xl font-black tabular-nums leading-none"
                        style={{
                          color: owned ? "white" : "rgba(255,255,255,0.04)",
                        }}
                      >
                        {count}
                      </span>
                      <span className="text-[9px] sm:text-[10px] text-gray-600 mt-0.5">
                        badge{count > 1 ? "s" : ""}
                      </span>
                    </div>

                    {/* Side accent bar */}
                    <div
                      className="absolute right-0 top-[15%] bottom-[15%] w-1 sm:w-1.5 rounded-l-full"
                      style={{
                        background: owned
                          ? `linear-gradient(to bottom, transparent, ${color}50, transparent)`
                          : "transparent",
                      }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
