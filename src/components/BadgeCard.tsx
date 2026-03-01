import { RARITY_COLORS, RARITY_POINTS } from "../types";

const BADGE_IMAGES: Record<string, string> = {
  COMMON:    "/badge-common.png",
  RARE:      "/badge-rare.png",
  EPIC:      "/badge-epic.png",
  LEGENDARY: "/badge-legendary.gif",
  UNIQUE:    "/badge-unique.gif",
};

interface Props {
  rarity: string;
  count: number;
  onClick?: () => void;
  selected?: boolean;
}

export default function BadgeCard({ rarity, count, onClick, selected }: Props) {
  const r = rarity.toUpperCase();
  const color = RARITY_COLORS[r] || RARITY_COLORS.COMMON;
  const pts = RARITY_POINTS[r] || 0;
  const img = BADGE_IMAGES[r];

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!onClick}
      className={`relative group flex flex-col items-center gap-2 p-4 rounded-xl border transition-all ${
        selected
          ? "border-twitch bg-twitch/10 ring-2 ring-twitch/40"
          : "border-gray-800 bg-gray-900/60 hover:border-gray-700 hover:bg-gray-900"
      } ${onClick ? "cursor-pointer" : "cursor-default"}`}
    >
      {/* Badge image */}
      <div className="relative w-16 h-16 flex items-center justify-center">
        {img ? (
          <img
            src={img}
            alt={r}
            className="w-16 h-16 object-contain drop-shadow-lg"
            style={{ filter: count === 0 ? "grayscale(1) opacity(0.3)" : "none" }}
          />
        ) : (
          <div
            className="w-14 h-14 rounded-xl flex items-center justify-center text-2xl font-black"
            style={{ backgroundColor: color + "18", color }}
          >
            {r[0]}
          </div>
        )}
        {/* Count badge */}
        {count > 0 && (
          <span
            className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1 rounded-full text-[11px] font-bold flex items-center justify-center text-white shadow"
            style={{ backgroundColor: color }}
          >
            {count}
          </span>
        )}
      </div>

      <span className="text-xs font-semibold tracking-wider" style={{ color }}>
        {r}
      </span>
      <span className="text-[10px] text-gray-500">{pts} pt{pts > 1 ? "s" : ""} / badge</span>
    </button>
  );
}
