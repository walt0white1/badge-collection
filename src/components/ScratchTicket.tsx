import { useRef, useState, useCallback, useEffect } from "react";
import { scratchTicket } from "../api";
import { RARITY_COLORS } from "../types";
import { getBadgeImage } from "../badgeImages";
import type { LotteryTicket } from "../types";

interface Props {
  ticket: LotteryTicket;
  onScratched: (rarity: string) => void;
}

const CANVAS_W = 260;
const CANVAS_H = 340;
const SCRATCH_RADIUS = 28;
const REVEAL_THRESHOLD = 0.30;

export default function ScratchTicket({ ticket, onScratched }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [revealed, setRevealed] = useState(ticket.scratched);
  const [rarity, setRarity] = useState<string | null>(ticket.rarity);
  const [scratching, setScratchingState] = useState(false);
  const [scratchPct, setScratchPct] = useState(0);
  const [error, setError] = useState("");
  const isDrawing = useRef(false);
  const hasRevealed = useRef(ticket.scratched);
  const lastPos = useRef<{ x: number; y: number } | null>(null);
  const moveCount = useRef(0);

  // Initialize scratch overlay
  useEffect(() => {
    if (ticket.scratched) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Draw the scratch overlay (silver gradient)
    const gradient = ctx.createLinearGradient(0, 0, CANVAS_W, CANVAS_H);
    gradient.addColorStop(0, "#c0c0c0");
    gradient.addColorStop(0.3, "#d8d8d8");
    gradient.addColorStop(0.5, "#b0b0b0");
    gradient.addColorStop(0.7, "#d0d0d0");
    gradient.addColorStop(1, "#a8a8a8");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

    // Add some texture dots
    for (let i = 0; i < 200; i++) {
      const x = Math.random() * CANVAS_W;
      const y = Math.random() * CANVAS_H;
      ctx.fillStyle = `rgba(255,255,255,${Math.random() * 0.15})`;
      ctx.fillRect(x, y, 2, 2);
    }

    // "GRATTE MOI" text
    ctx.save();
    ctx.font = "bold 22px system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "rgba(0,0,0,0.25)";
    ctx.fillText("GRATTE MOI !", CANVAS_W / 2, CANVAS_H / 2);
    ctx.restore();
  }, [ticket.scratched]);

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

  const scratch = useCallback((x: number, y: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.globalCompositeOperation = "destination-out";

    const prev = lastPos.current;
    if (prev) {
      // Draw a continuous line from last position
      ctx.lineWidth = SCRATCH_RADIUS * 2;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.beginPath();
      ctx.moveTo(prev.x, prev.y);
      ctx.lineTo(x, y);
      ctx.stroke();
    } else {
      // First point — just a circle
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

  const doReveal = useCallback(async () => {
    if (hasRevealed.current) return;
    hasRevealed.current = true;
    setError("");

    try {
      const result = await scratchTicket(ticket.id);
      setRarity(result);
      setRevealed(true);
      onScratched(result);
    } catch (err: any) {
      hasRevealed.current = false;
      setError(err.message || "Erreur lors du grattage");
    }
  }, [ticket.id, onScratched]);

  const handleMove = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      if (!isDrawing.current || hasRevealed.current) return;
      e.preventDefault();
      const pos = getPos(e);
      if (!pos) return;
      scratch(pos.x, pos.y);

      // Only calculate percentage every 5 moves for performance
      moveCount.current++;
      if (moveCount.current % 5 === 0) {
        const pct = calcScratchPercent();
        setScratchPct(pct);
        if (pct >= REVEAL_THRESHOLD) doReveal();
      }
    },
    [getPos, scratch, calcScratchPercent, doReveal],
  );

  const handleDown = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      if (hasRevealed.current) return;
      isDrawing.current = true;
      lastPos.current = null;
      setScratchingState(true);
      const pos = getPos(e);
      if (pos) scratch(pos.x, pos.y);
    },
    [getPos, scratch],
  );

  const handleUp = useCallback(() => {
    isDrawing.current = false;
    lastPos.current = null;
    setScratchingState(false);

    // Check percentage on mouse up too
    if (!hasRevealed.current) {
      const pct = calcScratchPercent();
      setScratchPct(pct);
      if (pct >= REVEAL_THRESHOLD) doReveal();
    }
  }, [calcScratchPercent, doReveal]);

  // Already scratched — just show the result
  if (ticket.scratched && ticket.rarity) {
    return (
      <div className="relative w-full aspect-[260/340] rounded-2xl overflow-hidden border border-white/[0.08] bg-gray-900/50 flex flex-col items-center justify-center gap-3 p-4">
        <div
          className="absolute inset-0 opacity-10 rounded-2xl"
          style={{ background: `radial-gradient(circle, ${RARITY_COLORS[ticket.rarity]}, transparent 70%)` }}
        />
        <img
          src={getBadgeImage(ticket.rarity, ticket.season)}
          alt={ticket.rarity}
          className="w-24 h-24 object-contain drop-shadow-xl relative z-10"
        />
        <span
          className="text-sm font-black tracking-widest uppercase relative z-10"
          style={{ color: RARITY_COLORS[ticket.rarity] }}
        >
          {ticket.rarity}
        </span>
        <span className="text-[10px] text-gray-600 relative z-10">
          {ticket.season.replace("saison", "S")}
        </span>
      </div>
    );
  }

  return (
    <div className="relative w-full aspect-[260/340] select-none">
      {/* Background: the hidden badge (visible through scratched areas) */}
      <div
        className={`absolute inset-0 rounded-2xl overflow-hidden border border-white/[0.08] flex flex-col items-center justify-center gap-3 transition-all duration-700 ${
          revealed ? "bg-gray-900" : "bg-gray-950"
        }`}
      >
        {revealed && rarity ? (
          <div className="flex flex-col items-center gap-3 animate-[ticketReveal_0.6s_ease-out]">
            <div
              className="absolute inset-0 opacity-20 rounded-2xl"
              style={{ background: `radial-gradient(circle, ${RARITY_COLORS[rarity]}, transparent 70%)` }}
            />
            <img
              src={getBadgeImage(rarity, ticket.season)}
              alt={rarity}
              className="w-28 h-28 object-contain drop-shadow-2xl relative z-10"
            />
            <span
              className="text-lg font-black tracking-widest uppercase relative z-10"
              style={{ color: RARITY_COLORS[rarity] }}
            >
              {rarity}
            </span>
            <span className="text-xs text-gray-500 relative z-10">
              {ticket.season.replace("saison", "Saison ")}
            </span>
          </div>
        ) : !revealed ? (
          <div className="flex flex-col items-center gap-2 opacity-30">
            <svg className="w-16 h-16 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" />
            </svg>
            <span className="text-xs text-gray-600 font-medium">?</span>
          </div>
        ) : null}
      </div>

      {/* Scratch canvas overlay */}
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

      {/* Scratch progress indicator */}
      {!revealed && scratchPct > 0.03 && (
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-20 bg-black/60 backdrop-blur-sm rounded-full px-3 py-1 pointer-events-none">
          <span className="text-[10px] text-gray-300 font-medium">
            {Math.min(Math.round((scratchPct / REVEAL_THRESHOLD) * 100), 100)}%
          </span>
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="absolute top-2 left-2 right-2 z-20 bg-red-500/90 text-white text-[10px] font-medium px-2 py-1.5 rounded-lg text-center">
          {error}
        </div>
      )}

      {/* Particles on reveal */}
      {revealed && rarity && <RevealParticles color={RARITY_COLORS[rarity] || "#fff"} />}

      <style>{`
        @keyframes ticketReveal {
          0% { opacity: 0; transform: scale(0.6) rotate(-5deg); }
          50% { transform: scale(1.1) rotate(2deg); }
          100% { opacity: 1; transform: scale(1) rotate(0); }
        }
      `}</style>
    </div>
  );
}

function RevealParticles({ color }: { color: string }) {
  const particles = useRef(
    Array.from({ length: 24 }, (_, i) => ({
      id: i,
      x: 50 + (Math.random() - 0.5) * 20,
      y: 50 + (Math.random() - 0.5) * 20,
      dx: (Math.random() - 0.5) * 120,
      dy: (Math.random() - 0.5) * 120 - 30,
      size: 4 + Math.random() * 6,
      delay: Math.random() * 0.3,
      duration: 0.6 + Math.random() * 0.4,
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
            opacity: 0,
            animation: `particle-fly ${p.duration}s ease-out ${p.delay}s forwards`,
            ["--dx" as string]: `${p.dx}px`,
            ["--dy" as string]: `${p.dy}px`,
          }}
        />
      ))}
      <style>{`
        @keyframes particle-fly {
          0% { opacity: 1; transform: translate(0, 0) scale(1); }
          100% { opacity: 0; transform: translate(var(--dx), var(--dy)) scale(0); }
        }
      `}</style>
    </div>
  );
}
