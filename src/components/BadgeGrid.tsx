import BadgeCard from "./BadgeCard";
import { RARITY_ORDER } from "../types";

interface Props {
  counts: Record<string, number>;
  onSelect?: (rarity: string) => void;
  selectedRarity?: string;
}

export default function BadgeGrid({ counts, onSelect, selectedRarity }: Props) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
      {RARITY_ORDER.map((r) => (
        <BadgeCard
          key={r}
          rarity={r}
          count={counts[r.toLowerCase()] ?? counts[r] ?? 0}
          onClick={onSelect ? () => onSelect(r) : undefined}
          selected={selectedRarity === r}
        />
      ))}
    </div>
  );
}
