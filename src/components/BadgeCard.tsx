import { RARITY_COLORS, RARITY_POINTS, RARITY_ORDER } from "../types";
import { getBadgeImage } from "../badgeImages";

interface Props {
  rarity: string;
  count: number;
  season?: string;
  onClick?: () => void;
  selected?: boolean;
}

const RARITY_IDX: Record<string, number> = {};
RARITY_ORDER.forEach((r, i) => (RARITY_IDX[r] = i));

export default function BadgeCard({ rarity, count, season = "saison2", onClick, selected }: Props) {
  const r = rarity.toUpperCase();
  const color = RARITY_COLORS[r] || RARITY_COLORS.COMMON;
  const pts = RARITY_POINTS[r] || 0;
  const img = getBadgeImage(r, season);
  const tier = RARITY_IDX[r] ?? 0; // 0=common ... 4=unique
  const owned = count > 0;

  // Progressive glow intensity based on rarity
  const glowBlur = 20 + tier * 12;    // 20 → 68
  const glowSpread = 4 + tier * 4;    // 4 → 20
  const glowOpacity = owned ? 0.15 + tier * 0.12 : 0; // 0.15 → 0.63
  const borderOpacity = owned ? "44" : "15";

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!onClick}
      className={`
        relative group flex flex-col items-center justify-center rounded-2xl border overflow-hidden
        transition-all duration-300
        ${selected ? "ring-2 ring-twitch/60 scale-[1.02]" : ""}
        ${onClick ? "cursor-pointer hover:scale-[1.04]" : "cursor-default"}
      `}
      style={{
        borderColor: owned ? color + borderOpacity : "rgba(255,255,255,0.06)",
        background: owned
          ? `radial-gradient(ellipse at 50% 0%, ${color}08 0%, transparent 70%), #0a0a0d`
          : "#09090c",
        boxShadow: owned
          ? `0 0 ${glowBlur}px ${glowSpread}px ${color}${Math.round(glowOpacity * 255).toString(16).padStart(2, "0")}, inset 0 1px 0 rgba(255,255,255,0.04)`
          : "none",
        aspectRatio: "3 / 4",
        padding: "1.5rem 1rem",
      }}
    >
      {/* Top shine line */}
      {owned && (
        <div
          className="absolute top-0 left-[10%] right-[10%] h-px opacity-40"
          style={{ background: `linear-gradient(90deg, transparent, ${color}, transparent)` }}
        />
      )}

      {/* Rarity label top */}
      <span
        className="text-[10px] font-black tracking-[0.25em] uppercase mb-auto"
        style={{ color: owned ? color : "rgba(255,255,255,0.15)" }}
      >
        {r}
      </span>

      {/* Badge image — center */}
      <div className="relative flex items-center justify-center my-auto py-2">
        {/* Glow behind badge */}
        {owned && tier >= 2 && (
          <div
            className="absolute inset-0 rounded-full blur-2xl opacity-30 group-hover:opacity-50 transition-opacity"
            style={{ background: color, transform: `scale(${1.2 + tier * 0.15})` }}
          />
        )}
        <img
          src={img}
          alt={r}
          className="w-36 h-36 object-contain relative z-10 transition-transform duration-300 group-hover:scale-110 drop-shadow-lg"
          style={{
            filter: owned ? "none" : "grayscale(1) brightness(0.3)",
          }}
        />
      </div>

      {/* Bottom section */}
      <div className="flex items-end justify-between w-full mt-auto">
        {/* Points */}
        <div className="text-left">
          <span className="text-[10px] text-gray-600 block leading-none">pts/badge</span>
          <span className="text-sm font-bold" style={{ color: owned ? color : "rgba(255,255,255,0.15)" }}>
            {pts}
          </span>
        </div>

        {/* Count */}
        <div
          className="flex items-center justify-center rounded-lg px-2.5 py-1 min-w-[36px]"
          style={{
            background: owned ? color + "20" : "rgba(255,255,255,0.03)",
            border: `1px solid ${owned ? color + "33" : "rgba(255,255,255,0.06)"}`,
          }}
        >
          <span
            className="text-lg font-black tabular-nums leading-none"
            style={{ color: owned ? color : "rgba(255,255,255,0.12)" }}
          >
            {count}
          </span>
        </div>
      </div>
    </button>
  );
}
