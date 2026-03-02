import { useState, useEffect, useRef } from "react";
import { claimFreeSpin } from "../api";
import { RARITY_ORDER, RARITY_COLORS } from "../types";
import { getBadgeImage } from "../badgeImages";

interface Props {
  onClose: () => void;
  onResult: (rarity: string) => void;
}

const SEGMENTS = RARITY_ORDER.map((r) => ({
  rarity: r,
  color: RARITY_COLORS[r],
  label: r.charAt(0) + r.slice(1).toLowerCase(),
}));

// Angle per segment (72deg each for 5 segments)
const SEG_ANGLE = 360 / SEGMENTS.length;

// Map rarity to its segment index
const RARITY_TO_IDX: Record<string, number> = {};
RARITY_ORDER.forEach((r, i) => (RARITY_TO_IDX[r] = i));

export default function SpinWheelModal({ onClose, onResult }: Props) {
  const [phase, setPhase] = useState<"ready" | "spinning" | "result">("ready");
  const [resultRarity, setResultRarity] = useState<string | null>(null);
  const [rotation, setRotation] = useState(0);
  const [error, setError] = useState("");
  const wheelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape" && phase !== "spinning") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose, phase]);

  const spin = async () => {
    setPhase("spinning");
    setError("");

    try {
      // Call backend first to get the result
      const rarity = await claimFreeSpin();

      // Calculate target rotation to land on the correct segment
      const targetIdx = RARITY_TO_IDX[rarity] ?? 0;
      // The wheel is drawn with segment 0 (COMMON) at the top
      // To land on a segment, we rotate so that segment's center is at the top (pointer position)
      const segmentCenter = targetIdx * SEG_ANGLE + SEG_ANGLE / 2;
      // Add full rotations for dramatic effect (5-8 full spins)
      const fullSpins = (5 + Math.random() * 3) * 360;
      // We want the final rotation to stop with the target segment at the pointer (top)
      const finalRotation = fullSpins + (360 - segmentCenter);

      setRotation(finalRotation);

      // Wait for animation to finish
      setTimeout(() => {
        setResultRarity(rarity);
        setPhase("result");
      }, 4500);
    } catch (err: any) {
      setError(err.message || "Erreur lors du spin");
      setPhase("ready");
    }
  };

  const handleClose = () => {
    if (resultRarity) {
      onResult(resultRarity);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={phase !== "spinning" ? handleClose : undefined} />

      {/* Modal */}
      <div className="relative bg-gray-900 border border-white/10 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
        {/* Close button */}
        {phase !== "spinning" && (
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors"
          >
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}

        <div className="p-6 sm:p-8 flex flex-col items-center">
          {/* Title */}
          <div className="text-center mb-6">
            <h2 className="text-2xl font-black text-white">
              {phase === "result" ? "Felicitations !" : "Spin Gratuit !"}
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              {phase === "result"
                ? "Tu as obtenu un nouveau badge !"
                : "Tourne la roue pour gagner un badge gratuit !"}
            </p>
          </div>

          {/* Result display */}
          {phase === "result" && resultRarity && (
            <div className="flex flex-col items-center gap-4 mb-6 animate-[fadeInUp_0.5s_ease-out]">
              <div className="relative">
                <div
                  className="absolute inset-0 rounded-full blur-3xl opacity-40"
                  style={{ background: RARITY_COLORS[resultRarity], transform: "scale(2)" }}
                />
                <img
                  src={getBadgeImage(resultRarity, "saison2")}
                  alt={resultRarity}
                  className="w-32 h-32 object-contain relative z-10 drop-shadow-2xl"
                />
              </div>
              <div className="text-center">
                <span
                  className="text-xl font-black tracking-wide"
                  style={{ color: RARITY_COLORS[resultRarity] }}
                >
                  {resultRarity}
                </span>
                <p className="text-sm text-gray-500 mt-1">Saison 2</p>
              </div>
            </div>
          )}

          {/* Wheel */}
          {phase !== "result" && (
            <div className="relative w-72 h-72 mb-6">
              {/* Pointer (triangle at top) */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1 z-20">
                <div
                  className="w-0 h-0"
                  style={{
                    borderLeft: "12px solid transparent",
                    borderRight: "12px solid transparent",
                    borderTop: "20px solid #fff",
                    filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.5))",
                  }}
                />
              </div>

              {/* Wheel */}
              <div
                ref={wheelRef}
                className="w-full h-full rounded-full border-4 border-white/20 shadow-2xl overflow-hidden"
                style={{
                  transform: `rotate(${rotation}deg)`,
                  transition: phase === "spinning"
                    ? "transform 4s cubic-bezier(0.17, 0.67, 0.12, 0.99)"
                    : "none",
                  background: `conic-gradient(${SEGMENTS.map(
                    (s, i) =>
                      `${s.color}33 ${i * SEG_ANGLE}deg, ${s.color}88 ${i * SEG_ANGLE + SEG_ANGLE / 2}deg, ${s.color}33 ${(i + 1) * SEG_ANGLE}deg`,
                  ).join(", ")})`,
                }}
              >
                {/* Segment labels + badge icons */}
                {SEGMENTS.map((s, i) => {
                  const angle = i * SEG_ANGLE + SEG_ANGLE / 2;
                  return (
                    <div
                      key={s.rarity}
                      className="absolute inset-0 flex flex-col items-center"
                      style={{
                        transform: `rotate(${angle}deg)`,
                      }}
                    >
                      <div className="flex flex-col items-center gap-1 mt-6">
                        <img
                          src={getBadgeImage(s.rarity, "saison2")}
                          alt=""
                          className="w-8 h-8 object-contain drop-shadow-lg"
                        />
                        <span
                          className="text-[10px] font-black tracking-wider"
                          style={{ color: s.color, textShadow: "0 1px 3px rgba(0,0,0,0.8)" }}
                        >
                          {s.label}
                        </span>
                      </div>
                    </div>
                  );
                })}

                {/* Center circle */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 rounded-full bg-gray-900 border-4 border-white/20 flex items-center justify-center z-10 shadow-xl">
                  <svg className="w-6 h-6 text-twitch" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714z" />
                  </svg>
                </div>
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 text-sm text-red-400 bg-red-500/10 border border-red-500/20 px-4 py-3 rounded-xl mb-4 w-full">
              <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              {error}
            </div>
          )}

          {/* Action button */}
          {phase === "ready" && (
            <button
              onClick={spin}
              className="w-full px-8 py-3.5 bg-twitch hover:bg-twitch-dark text-white text-sm font-bold rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              Tourner la roue !
            </button>
          )}

          {phase === "spinning" && (
            <div className="text-center">
              <div className="w-8 h-8 border-2 border-twitch border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              <p className="text-sm text-gray-500">La roue tourne...</p>
            </div>
          )}

          {phase === "result" && (
            <button
              onClick={handleClose}
              className="w-full px-8 py-3.5 bg-twitch hover:bg-twitch-dark text-white text-sm font-bold rounded-xl transition-all"
            >
              Super ! Fermer
            </button>
          )}
        </div>
      </div>

      {/* CSS animation for result */}
      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px) scale(0.9); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </div>
  );
}
