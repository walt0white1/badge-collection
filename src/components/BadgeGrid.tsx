import BadgeCard from "./BadgeCard";
import { RARITY_ORDER } from "../types";

interface Props {
  counts: Record<string, number>;
  season?: string;
  onSelect?: (rarity: string) => void;
  selectedRarity?: string;
}

export default function BadgeGrid({ counts, season = "saison2", onSelect, selectedRarity }: Props) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
      {RARITY_ORDER.map((r) => (
        <BadgeCard
          key={r}
          rarity={r}
          count={counts[r.toLowerCase()] ?? counts[r] ?? 0}
          season={season}
          onClick={onSelect ? () => onSelect(r) : undefined}
          selected={selectedRarity === r}
        />
      ))}
    </div>
  );
}
