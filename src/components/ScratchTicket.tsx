import { useRef, useState, useCallback, useEffect } from "react";
import { scratchTicket } from "../api";
import { RARITY_COLORS, RARITY_POINTS } from "../types";
import { getBadgeImage } from "../badgeImages";
import type { LotteryTicket } from "../types";

interface Props {
  ticket: LotteryTicket;
  onScratched: (rarity: string) => void;
  onDismiss: () => void;
}

const CANVAS_W = 300;
const CANVAS_H = 400;
const SCRATCH_RADIUS = 32;
const REVEAL_THRESHOLD = 0.30;
const PRE_SHAKE_THRESHOLD = 0.22;
const GLOW_START_THRESHOLD = 0.08;

export default function ScratchTicket({ ticket, onScratched, onDismiss }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [revealed, setRevealed] = useState(false);
  const [rarity, setRarity] = useState<string | null>(null);
  const [scratching, setScratchingState] = useState(false);
  const [scratchPct, setScratchPct] = useState(0);
  const [error, setError] = useState("");
  const [dismissing, setDismissing] = useState(false);
  const [revealPhase, setRevealPhase] = useState(0); // 0=none, 1=flash, 2=glow, 3=badge, 4=text, 5=points, 6=done
  const [scratchParticles, setScratchParticles] = useState<ScratchDust[]>([]);
  const isDrawing = useRef(false);
  const hasRevealed = useRef(false);
  const hasDismissed = useRef(false);
  const dismissTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastPos = useRef<{ x: number; y: number } | null>(null);
  const moveCount = useRef(0);
  const dustId = useRef(0);

  // Initialize scratch overlay
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Rich silver gradient
    const gradient = ctx.createLinearGradient(0, 0, CANVAS_W, CANVAS_H);
    gradient.addColorStop(0, "#b8b8c0");
    gradient.addColorStop(0.15, "#d4d4dc");
    gradient.addColorStop(0.3, "#a8a8b4");
    gradient.addColorStop(0.45, "#c8c8d0");
    gradient.addColorStop(0.6, "#b0b0bc");
    gradient.addColorStop(0.75, "#d0d0d8");
    gradient.addColorStop(0.9, "#bcbcc4");
    gradient.addColorStop(1, "#c4c4cc");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

    // Fine noise texture
    for (let i = 0; i < 500; i++) {
      const x = Math.random() * CANVAS_W;
      const y = Math.random() * CANVAS_H;
      ctx.fillStyle = `rgba(255,255,255,${Math.random() * 0.15})`;
      ctx.fillRect(x, y, 1.5, 1.5);
    }
    for (let i = 0; i < 200; i++) {
      const x = Math.random() * CANVAS_W;
      const y = Math.random() * CANVAS_H;
      ctx.fillStyle = `rgba(0,0,0,${Math.random() * 0.06})`;
      ctx.fillRect(x, y, 1, 1);
    }

    // Diagonal shine lines
    ctx.save();
    ctx.globalAlpha = 0.07;
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 50;
    for (let i = -CANVAS_H; i < CANVAS_W + CANVAS_H; i += 100) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i - CANVAS_H, CANVAS_H);
      ctx.stroke();
    }
    ctx.restore();

    // "GRATTE MOI" text with shadow
    ctx.save();
    ctx.font = "900 22px system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.letterSpacing = "3px";
    // Shadow
    ctx.fillStyle = "rgba(0,0,0,0.08)";
    ctx.fillText("GRATTE MOI", CANVAS_W / 2 + 1, CANVAS_H / 2 + 1);
    // Main text
    ctx.fillStyle = "rgba(0,0,0,0.2)";
    ctx.fillText("GRATTE MOI", CANVAS_W / 2, CANVAS_H / 2);
    ctx.restore();
  }, [ticket.id]);

  const getPos = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const scaleX = CANVAS_W / rect.width;
    const scaleY = CANVAS_H / rect.height;
    if ("touches" in e) {
      const touch = e.touches[0] || e.changedTouches[0];
      return {
        x: (touch.clientX - rect.left) * scaleX,
        y: (touch.clientY - rect.top) * scaleY,
      };
    }
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  }, []);

  // Spawn dust particles at scratch position
  const spawnDust = useCallback((x: number, y: number) => {
    const count = 2 + Math.floor(Math.random() * 3);
    const newParticles: ScratchDust[] = [];
    for (let i = 0; i < count; i++) {
      newParticles.push({
        id: dustId.current++,
        x: (x / CANVAS_W) * 100,
        y: (y / CANVAS_H) * 100,
        dx: (Math.random() - 0.5) * 40,
        dy: -20 - Math.random() * 30,
        size: 2 + Math.random() * 4,
        duration: 0.4 + Math.random() * 0.3,
      });
    }
    setScratchParticles((prev) => [...prev.slice(-30), ...newParticles]);
  }, []);

  const scratch = useCallback((x: number, y: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.globalCompositeOperation = "destination-out";

    const prev = lastPos.current;
    if (prev) {
      ctx.lineWidth = SCRATCH_RADIUS * 2;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.beginPath();
      ctx.moveTo(prev.x, prev.y);
      ctx.lineTo(x, y);
      ctx.stroke();
    } else {
      ctx.beginPath();
      ctx.arc(x, y, SCRATCH_RADIUS, 0, Math.PI * 2);
      ctx.fill();
    }
    lastPos.current = { x, y };
  }, []);

  const calcScratchPercent = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return 0;
    const ctx = canvas.getContext("2d");
    if (!ctx) return 0;
    const imageData = ctx.getImageData(0, 0, CANVAS_W, CANVAS_H);
    let transparent = 0;
    for (let i = 3; i < imageData.data.length; i += 4) {
      if (imageData.data[i] === 0) transparent++;
    }
    return transparent / (CANVAS_W * CANVAS_H);
  }, []);

  // Cinematic reveal sequence
  const doReveal = useCallback(async () => {
    if (hasRevealed.current) return;
    hasRevealed.current = true;
    setError("");

    try {
      const result = await scratchTicket(ticket.id);
      setRarity(result);

      // Phase 1: flash
      setRevealPhase(1);
      await delay(180);

      // Phase 2: canvas fade + glow
      setRevealed(true);
      setRevealPhase(2);
      await delay(350);

      // Phase 3: badge appears
      setRevealPhase(3);
      await delay(500);

      // Phase 4: text
      setRevealPhase(4);
      await delay(250);

      // Phase 5: points
      setRevealPhase(5);
      await delay(300);

      // Phase 6: done, interactive
      setRevealPhase(6);
      onScratched(result);
    } catch (err: any) {
      hasRevealed.current = false;
      setError(err.message || "Erreur lors du grattage");
    }
  }, [ticket.id, onScratched]);

  const handleDismiss = useCallback(() => {
    if (hasDismissed.current) return;
    hasDismissed.current = true;
    setDismissing(true);
    dismissTimer.current = setTimeout(() => onDismiss(), 400);
  }, [onDismiss]);

  // Cleanup timer on unmount to prevent ghost calls
  useEffect(() => {
    return () => {
      if (dismissTimer.current) clearTimeout(dismissTimer.current);
    };
  }, []);

  const handleMove = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      if (!isDrawing.current || hasRevealed.current) return;
      e.preventDefault();
      const pos = getPos(e);
      if (!pos) return;
      scratch(pos.x, pos.y);

      // Spawn dust every 3 moves
      moveCount.current++;
      if (moveCount.current % 3 === 0) {
        spawnDust(pos.x, pos.y);
      }

      if (moveCount.current % 5 === 0) {
        const pct = calcScratchPercent();
        setScratchPct(pct);
        if (pct >= REVEAL_THRESHOLD) doReveal();
      }
    },
    [getPos, scratch, calcScratchPercent, doReveal, spawnDust],
  );

  const handleDown = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      if (hasRevealed.current) return;
      isDrawing.current = true;
      lastPos.current = null;
      setScratchingState(true);
      const pos = getPos(e);
      if (pos) {
        scratch(pos.x, pos.y);
        spawnDust(pos.x, pos.y);
      }
    },
    [getPos, scratch, spawnDust],
  );

  const handleUp = useCallback(() => {
    isDrawing.current = false;
    lastPos.current = null;
    setScratchingState(false);
    if (!hasRevealed.current) {
      const pct = calcScratchPercent();
      setScratchPct(pct);
      if (pct >= REVEAL_THRESHOLD) doReveal();
    }
  }, [calcScratchPercent, doReveal]);

  const isShaking = scratchPct >= PRE_SHAKE_THRESHOLD && !revealed;
  const glowIntensity = scratchPct >= GLOW_START_THRESHOLD && !revealed
    ? Math.min((scratchPct - GLOW_START_THRESHOLD) / (REVEAL_THRESHOLD - GLOW_START_THRESHOLD), 1)
    : 0;
  const rarityColor = rarity ? RARITY_COLORS[rarity] : "#9146FF";
  const pts = rarity ? RARITY_POINTS[rarity] || 0 : 0;
  const isSpecial = rarity === "LEGENDARY" || rarity === "UNIQUE";

  return (
    <div
      className={`relative w-56 sm:w-64 aspect-[3/4] select-none transition-all duration-400 ${
        dismissing ? "opacity-0 translate-x-40 -rotate-12 scale-90" : ""
      } ${isShaking ? "animate-[ticketShake_0.15s_ease-in-out_infinite]" : ""}`}
    >
      {/* Animated border glow */}
      <div
        className="absolute -inset-[2px] rounded-2xl opacity-60 animate-[borderPulse_3s_ease-in-out_infinite] blur-[2px]"
        style={{
          background: revealed
            ? `linear-gradient(135deg, ${rarityColor}, transparent, ${rarityColor})`
            : "linear-gradient(135deg, rgba(192,192,192,0.3), transparent, rgba(192,192,192,0.3))",
        }}
      />

      {/* Background: hidden content */}
      <div className="absolute inset-0 rounded-2xl overflow-hidden border border-white/[0.08] bg-[#08080c] flex flex-col items-center justify-center gap-3">

        {/* Progressive glow teaser (visible through scratch holes) */}
        {glowIntensity > 0 && !revealed && (
          <div
            className="absolute inset-0 transition-opacity duration-300"
            style={{
              background: `radial-gradient(circle, ${rarityColor || "#9146FF"} 0%, transparent 70%)`,
              opacity: glowIntensity * 0.25,
            }}
          />
        )}

        {/* Flash overlay */}
        {revealPhase === 1 && (
          <div className="absolute inset-0 z-50 bg-white/40 animate-[flashFade_180ms_ease-out_forwards]" />
        )}

        {/* Reveal content */}
        {revealed && rarity && (
          <>
            {/* Background glow */}
            <div
              className={`absolute inset-0 rounded-2xl transition-opacity duration-500 ${revealPhase >= 2 ? "opacity-100" : "opacity-0"}`}
              style={{
                background: `radial-gradient(circle at 50% 40%, ${rarityColor}35 0%, ${rarityColor}10 40%, transparent 70%)`,
              }}
            />

            {/* Persistent ambient glow after reveal */}
            {revealPhase >= 6 && (
              <div
                className="absolute inset-0 rounded-2xl animate-[ambientGlow_3s_ease-in-out_infinite]"
                style={{
                  background: `radial-gradient(circle at 50% 40%, ${rarityColor}20 0%, transparent 60%)`,
                }}
              />
            )}

            {/* Glow pulse ring */}
            {revealPhase >= 2 && (
              <div
                className="absolute inset-0 z-10 animate-[glowPulse_1.5s_ease-out_forwards]"
                style={{
                  background: `radial-gradient(circle, ${rarityColor}40 0%, transparent 50%)`,
                }}
              />
            )}

            {/* Badge */}
            <div className={`relative z-20 flex flex-col items-center gap-3 ${revealPhase >= 3 ? "" : "opacity-0"}`}>
              <img
                src={getBadgeImage(rarity, ticket.season)}
                alt={rarity}
                className={`w-40 h-40 object-contain ${revealPhase >= 3 ? "animate-[badgeAppear_0.5s_cubic-bezier(0.34,1.56,0.64,1)_forwards]" : ""}`}
                style={{
                  filter: `drop-shadow(0 0 ${isSpecial ? "35px" : "22px"} ${rarityColor}90)`,
                  opacity: revealPhase >= 3 ? undefined : 0,
                }}
              />

              {/* Rarity text */}
              <span
                className={`text-xl font-black tracking-[0.2em] uppercase ${revealPhase >= 4 ? "animate-[slideUp_0.35s_ease-out_forwards]" : "opacity-0"}`}
                style={{ color: rarityColor, textShadow: `0 0 20px ${rarityColor}60` }}
              >
                {rarity}
              </span>

              {/* Points */}
              {revealPhase >= 5 && (
                <span
                  className="text-sm font-bold animate-[slideUp_0.3s_ease-out_forwards]"
                  style={{ color: `${rarityColor}cc` }}
                >
                  +{pts} pt{pts > 1 ? "s" : ""}
                </span>
              )}

              {/* Next button */}
              {revealPhase >= 6 && (
                <button
                  onClick={handleDismiss}
                  className="mt-3 px-5 py-2 bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.08] text-sm text-gray-400 hover:text-white font-medium rounded-xl transition-all animate-[fadeIn_0.3s_ease-out]"
                >
                  Suivant &rarr;
                </button>
              )}
            </div>
          </>
        )}

        {/* Placeholder before scratch */}
        {!revealed && (
          <div className="flex flex-col items-center gap-2 opacity-15">
            <svg className="w-20 h-20 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" />
            </svg>
          </div>
        )}
      </div>

      {/* Shimmer overlay on scratch surface */}
      {!revealed && (
        <div className="absolute inset-0 rounded-2xl z-[9] pointer-events-none overflow-hidden">
          <div
            className="absolute inset-0 animate-[shimmer_3s_ease-in-out_infinite]"
            style={{
              background: "linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.12) 45%, rgba(255,255,255,0.2) 50%, rgba(255,255,255,0.12) 55%, transparent 60%)",
              backgroundSize: "200% 200%",
            }}
          />
        </div>
      )}

      {/* Scratch canvas */}
      {!revealed && (
        <canvas
          ref={canvasRef}
          width={CANVAS_W}
          height={CANVAS_H}
          className="absolute inset-0 w-full h-full rounded-2xl z-10"
          style={{ touchAction: "none", cursor: scratching ? "grabbing" : "grab" }}
          onMouseDown={handleDown}
          onMouseMove={handleMove}
          onMouseUp={handleUp}
          onMouseLeave={handleUp}
          onTouchStart={handleDown}
          onTouchMove={handleMove}
          onTouchEnd={handleUp}
        />
      )}

      {/* Scratch dust particles */}
      {scratchParticles.length > 0 && (
        <div className="absolute inset-0 z-20 pointer-events-none overflow-hidden rounded-2xl">
          {scratchParticles.map((p) => (
            <div
              key={p.id}
              className="absolute rounded-full bg-gray-300"
              style={{
                left: `${p.x}%`,
                top: `${p.y}%`,
                width: p.size,
                height: p.size,
                opacity: 0,
                animation: `dustFly ${p.duration}s ease-out forwards`,
                ["--dx" as string]: `${p.dx}px`,
                ["--dy" as string]: `${p.dy}px`,
              }}
            />
          ))}
        </div>
      )}

      {/* Progress bar */}
      {!revealed && scratchPct > 0.03 && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 pointer-events-none">
          <div className="relative w-24 h-1.5 bg-black/40 backdrop-blur-sm rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-200 ${
                scratchPct >= PRE_SHAKE_THRESHOLD ? "animate-[barPulse_0.6s_ease-in-out_infinite]" : ""
              }`}
              style={{
                width: `${Math.min((scratchPct / REVEAL_THRESHOLD) * 100, 100)}%`,
                background: scratchPct >= PRE_SHAKE_THRESHOLD
                  ? "linear-gradient(90deg, #9146FF, #c084fc)"
                  : "rgba(255,255,255,0.5)",
              }}
            />
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="absolute top-2 left-2 right-2 z-30 bg-red-500/90 text-white text-[10px] font-medium px-2 py-1.5 rounded-lg text-center">
          {error}
        </div>
      )}

      {/* Reveal particles */}
      {revealed && rarity && revealPhase >= 3 && (
        <RevealParticles color={rarityColor} count={isSpecial ? 40 : 28} />
      )}

      <style>{`
        @keyframes shimmer {
          0%, 100% { background-position: 200% 0; }
          50% { background-position: -200% 0; }
        }
        @keyframes borderPulse {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 0.7; }
        }
        @keyframes ticketShake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-1.5px) rotate(-0.3deg); }
          75% { transform: translateX(1.5px) rotate(0.3deg); }
        }
        @keyframes flashFade {
          0% { opacity: 1; }
          100% { opacity: 0; }
        }
        @keyframes glowPulse {
          0% { opacity: 0; transform: scale(0.5); }
          40% { opacity: 0.8; transform: scale(1.1); }
          100% { opacity: 0; transform: scale(1.5); }
        }
        @keyframes badgeAppear {
          0% { opacity: 0; transform: scale(0.4); }
          70% { opacity: 1; transform: scale(1.08); }
          100% { opacity: 1; transform: scale(1); }
        }
        @keyframes slideUp {
          0% { opacity: 0; transform: translateY(12px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes ambientGlow {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 1; }
        }
        @keyframes fadeIn {
          0% { opacity: 0; }
          100% { opacity: 1; }
        }
        @keyframes barPulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.6; }
        }
        @keyframes dustFly {
          0% { opacity: 0.7; transform: translate(0, 0) scale(1); }
          100% { opacity: 0; transform: translate(var(--dx), var(--dy)) scale(0); }
        }
        @keyframes particle-fly {
          0% { opacity: 1; transform: translate(0, 0) scale(1); }
          100% { opacity: 0; transform: translate(var(--dx), var(--dy)) scale(0); }
        }
      `}</style>
    </div>
  );
}

/* ── Helpers ── */

function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

interface ScratchDust {
  id: number;
  x: number;
  y: number;
  dx: number;
  dy: number;
  size: number;
  duration: number;
}

function RevealParticles({ color, count = 28 }: { color: string; count?: number }) {
  const particles = useRef(
    Array.from({ length: count }, (_, i) => ({
      id: i,
      x: 50 + (Math.random() - 0.5) * 20,
      y: 45 + (Math.random() - 0.5) * 20,
      dx: (Math.random() - 0.5) * 140,
      dy: (Math.random() - 0.5) * 140 - 20,
      size: 3 + Math.random() * 6,
      delay: Math.random() * 0.35,
      duration: 0.7 + Math.random() * 0.5,
    })),
  ).current;

  return (
    <div className="absolute inset-0 z-30 pointer-events-none overflow-hidden rounded-2xl">
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute rounded-full"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.size,
            height: p.size,
            backgroundColor: color,
            boxShadow: `0 0 ${p.size * 2}px ${color}80`,
            opacity: 0,
            animation: `particle-fly ${p.duration}s ease-out ${p.delay}s forwards`,
            ["--dx" as string]: `${p.dx}px`,
            ["--dy" as string]: `${p.dy}px`,
          }}
        />
      ))}
    </div>
  );
}
