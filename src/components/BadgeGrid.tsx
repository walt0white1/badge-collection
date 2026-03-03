import { useState } from "react";
import BadgeCard from "./BadgeCard";
import { RARITY_ORDER } from "../types";

interface Props {
  counts: Record<string, number>;
  onSelect?: (rarity: string) => void;
  selectedRarity?: string;
}

export default function BadgeGrid({ counts, onSelect, selectedRarity }: Props) {
  const [expandedRarity, setExpandedRarity] = useState<string | null>(null);

  const handleToggle = (rarity: string) => {
    setExpandedRarity(expandedRarity === rarity ? null : rarity);
    onSelect?.(rarity);
  };

  return (
    <div className="w-full max-w-2xl mx-auto space-y-4">
      {RARITY_ORDER.map((r) => (
        <BadgeCard
          key={r}
          rarity={r}
          count={counts[r.toLowerCase()] ?? counts[r] ?? 0}
          isExpanded={expandedRarity === r}
          onToggle={() => handleToggle(r)}
          isVisible={!expandedRarity || expandedRarity === r}
        />
      ))}
    </div>
  );
}
