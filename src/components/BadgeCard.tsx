import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { RARITY_COLORS, RARITY_POINTS } from "../types";

interface Props {
  rarity: string;
  count: number;
  isExpanded?: boolean;
  onToggle?: () => void;
  isVisible?: boolean;
}

const RARITY_BADGES = {
  COMMON: "🔘",
  RARE: "🔵",
  EPIC: "🟣",
  LEGENDARY: "⭐",
  UNIQUE: "💎",
};

export default function BadgeCard({
  rarity,
  count,
  isExpanded = false,
  onToggle,
  isVisible = true
}: Props) {
  const key = rarity.toUpperCase() as keyof typeof RARITY_BADGES;
  const color = RARITY_COLORS[key] || RARITY_COLORS.COMMON;
  const pts = RARITY_POINTS[key] || 0;
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isExpanded && cardRef.current) {
      const topY = cardRef.current.offsetTop - 100;
      window.scrollTo({ top: topY, behavior: "smooth" });
    }
  }, [isExpanded]);

  return (
    <motion.div
      ref={cardRef}
      className="relative w-full"
      layout
      initial={false}
      animate={{
        opacity: isVisible ? 1 : 0,
        pointerEvents: isVisible ? "auto" : "none",
      }}
      transition={{ duration: 0.3 }}
    >
      <motion.div
        className="relative cursor-pointer"
        onClick={onToggle}
        animate={{
          height: isExpanded ? "auto" : "130px",
          marginBottom: isExpanded ? "40px" : "16px",
        }}
        transition={{
          height: { duration: 0.6, ease: [0.8, 0.3, 0.25, 1.66] },
          marginBottom: { duration: 0.3 },
        }}
      >
        {/* Background */}
        <div className="absolute inset-0 rounded-lg bg-white shadow-lg overflow-hidden">
          <motion.div
            className="absolute inset-0 rounded-lg"
            style={{ background: `linear-gradient(135deg, ${color}15, ${color}05)` }}
          />
        </div>

        {/* Content */}
        <div className="relative p-6 h-full flex flex-col">
          {!isExpanded ? (
            // Collapsed state
            <motion.div
              className="flex flex-col items-center justify-center h-full"
              animate={{ opacity: isExpanded ? 0 : 1 }}
              transition={{ duration: 0.2 }}
            >
              <span className="text-3xl">{RARITY_BADGES[key]}</span>
              <p className="text-sm font-semibold text-center mt-2" style={{ color }}>
                {key}
              </p>
              <p className="text-xs text-gray-600 mt-1">{count} badge{count !== 1 ? 's' : ''}</p>
            </motion.div>
          ) : (
            // Expanded state
            <motion.div
              className="space-y-4"
              animate={{ opacity: isExpanded ? 1 : 0 }}
              transition={{ duration: 0.3, delay: 0.2 }}
            >
              {/* Close button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onToggle?.();
                }}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>

              {/* Badge info */}
              <div className="pt-4">
                <h3 className="text-lg font-bold" style={{ color }}>
                  {key} Badge
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  {pts} point{pts > 1 ? 's' : ''} per badge
                </p>
              </div>

              {/* Badge count and details */}
              <div className="bg-gray-50 rounded p-3">
                <p className="text-2xl font-bold text-center" style={{ color }}>
                  {count}
                </p>
                <p className="text-xs text-center text-gray-600 mt-1">
                  {count === 0 ? 'Not collected yet' : `In your collection`}
                </p>
              </div>

              {/* Action button */}
              <button
                className="w-full py-2 px-4 rounded font-semibold text-white transition-colors"
                style={{ background: color }}
              >
                View Details
              </button>
            </motion.div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
