import { RARITY_COLORS, RARITY_POINTS } from "../types";

interface Props {
  rarity: string;
  count: number;
  onClick?: () => void;
  selected?: boolean;
}

export default function BadgeCard({ rarity, count, onClick, selected }: Props) {
  const color = RARITY_COLORS[rarity.toUpperCase()] || RARITY_COLORS.COMMON;
  const pts = RARITY_POINTS[rarity.toUpperCase()] || 0;

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
      <div
        className="w-14 h-14 rounded-xl flex items-center justify-center text-2xl font-black"
        style={{ backgroundColor: color + "18", color }}
      >
        {count}
      </div>
      <span className="text-xs font-semibold tracking-wider" style={{ color }}>
        {rarity.toUpperCase()}
      </span>
      <span className="text-[10px] text-gray-500">{pts} pt{pts > 1 ? "s" : ""} / badge</span>
    </button>
  );
}
