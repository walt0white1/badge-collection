import { RARITY_COLORS } from "../types";

interface Props {
  rarity: string;
  size?: "sm" | "md" | "lg";
}

export default function RarityBadge({ rarity, size = "md" }: Props) {
  const color = RARITY_COLORS[rarity.toUpperCase()] || RARITY_COLORS.COMMON;
  const sizeClasses = {
    sm: "text-xs px-2 py-0.5",
    md: "text-xs px-2.5 py-1",
    lg: "text-sm px-3 py-1.5",
  };

  return (
    <span
      className={`inline-flex items-center font-semibold rounded-full ${sizeClasses[size]}`}
      style={{ backgroundColor: color + "20", color }}
    >
      {rarity.toUpperCase()}
    </span>
  );
}
