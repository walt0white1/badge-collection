import { useState, useEffect, useRef } from "react";
import { useTheme } from "../context/ThemeContext";

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

function getTimeLeft(target: Date): TimeLeft {
  const diff = Math.max(0, target.getTime() - Date.now());
  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((diff / (1000 * 60)) % 60),
    seconds: Math.floor((diff / 1000) % 60),
  };
}

function FlipDigit({
  value,
  prevValue,
  color,
  isDark,
}: {
  value: string;
  prevValue: string;
  color: string;
  isDark: boolean;
}) {
  const [flipping, setFlipping] = useState(false);
  const [displayPrev, setDisplayPrev] = useState(prevValue);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    if (value !== prevValue) {
      setDisplayPrev(prevValue);
      setFlipping(true);
      clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => setFlipping(false), 300);
    }
    return () => clearTimeout(timeoutRef.current);
  }, [value, prevValue]);

  const bg = isDark ? "#1a1a1f" : "#f0f0f3";
  const bgDarker = isDark ? "#141418" : "#e4e4e8";
  const textColor = color;
  const lineColor = isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.08)";

  return (
    <div
      className="relative inline-flex items-center justify-center overflow-hidden"
      style={{
        width: "clamp(32px, 8vw, 52px)",
        height: "clamp(44px, 11vw, 72px)",
        borderRadius: "8px",
        perspective: "200px",
      }}
    >
      {/* Static top half — shows NEW value */}
      <div
        className="absolute inset-x-0 top-0 overflow-hidden flex items-center justify-center"
        style={{
          height: "50%",
          background: bg,
          borderBottom: `1px solid ${lineColor}`,
          borderRadius: "8px 8px 0 0",
        }}
      >
        <span
          className="font-black tabular-nums"
          style={{
            fontSize: "clamp(20px, 5vw, 34px)",
            color: textColor,
            transform: "translateY(25%)",
          }}
        >
          {value}
        </span>
      </div>

      {/* Static bottom half — shows NEW value */}
      <div
        className="absolute inset-x-0 bottom-0 overflow-hidden flex items-center justify-center"
        style={{
          height: "50%",
          background: bgDarker,
          borderRadius: "0 0 8px 8px",
        }}
      >
        <span
          className="font-black tabular-nums"
          style={{
            fontSize: "clamp(20px, 5vw, 34px)",
            color: textColor,
            transform: "translateY(-25%)",
          }}
        >
          {value}
        </span>
      </div>

      {/* Flipping top — shows OLD value, flips down */}
      {flipping && (
        <div
          className="absolute inset-x-0 top-0 overflow-hidden flex items-center justify-center flip-top-anim"
          style={{
            height: "50%",
            background: bg,
            borderRadius: "8px 8px 0 0",
            transformOrigin: "bottom center",
            zIndex: 3,
            backfaceVisibility: "hidden",
          }}
        >
          <span
            className="font-black tabular-nums"
            style={{
              fontSize: "clamp(20px, 5vw, 34px)",
              color: textColor,
              transform: "translateY(25%)",
            }}
          >
            {displayPrev}
          </span>
        </div>
      )}

      {/* Flipping bottom — shows NEW value, flips up from behind */}
      {flipping && (
        <div
          className="absolute inset-x-0 bottom-0 overflow-hidden flex items-center justify-center flip-bottom-anim"
          style={{
            height: "50%",
            background: bgDarker,
            borderRadius: "0 0 8px 8px",
            transformOrigin: "top center",
            zIndex: 2,
            backfaceVisibility: "hidden",
          }}
        >
          <span
            className="font-black tabular-nums"
            style={{
              fontSize: "clamp(20px, 5vw, 34px)",
              color: textColor,
              transform: "translateY(-25%)",
            }}
          >
            {value}
          </span>
        </div>
      )}
    </div>
  );
}

function FlipUnit({
  value,
  label,
  color,
  isDark,
}: {
  value: number;
  label: string;
  color: string;
  isDark: boolean;
}) {
  const str = String(value).padStart(2, "0");
  const prevRef = useRef(str);
  const prev = prevRef.current;

  useEffect(() => {
    prevRef.current = str;
  }, [str]);

  return (
    <div className="flex flex-col items-center gap-1.5 sm:gap-2">
      <div className="flex gap-[3px] sm:gap-1">
        <FlipDigit value={str[0]} prevValue={prev[0]} color={color} isDark={isDark} />
        <FlipDigit value={str[1]} prevValue={prev[1]} color={color} isDark={isDark} />
      </div>
      <span
        className="text-[9px] sm:text-[10px] font-semibold tracking-[0.2em] uppercase"
        style={{ color: isDark ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.3)" }}
      >
        {label}
      </span>
    </div>
  );
}

export default function CountdownTimer({ target }: { target: Date }) {
  const { isDark } = useTheme();
  const [time, setTime] = useState(() => getTimeLeft(target));

  useEffect(() => {
    const id = setInterval(() => setTime(getTimeLeft(target)), 1000);
    return () => clearInterval(id);
  }, [target]);

  const accentColor = "#9146FF";
  const separatorColor = isDark ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.15)";

  return (
    <div className="flex items-start gap-3 sm:gap-5">
      <FlipUnit value={time.days} label="Jours" color={accentColor} isDark={isDark} />
      <span
        className="font-black self-center -mt-3 sm:-mt-4"
        style={{
          fontSize: "clamp(16px, 4vw, 28px)",
          color: separatorColor,
        }}
      >
        :
      </span>
      <FlipUnit value={time.hours} label="Heures" color={accentColor} isDark={isDark} />
      <span
        className="font-black self-center -mt-3 sm:-mt-4"
        style={{
          fontSize: "clamp(16px, 4vw, 28px)",
          color: separatorColor,
        }}
      >
        :
      </span>
      <FlipUnit value={time.minutes} label="Min" color={accentColor} isDark={isDark} />
      <span
        className="font-black self-center -mt-3 sm:-mt-4"
        style={{
          fontSize: "clamp(16px, 4vw, 28px)",
          color: separatorColor,
        }}
      >
        :
      </span>
      <FlipUnit value={time.seconds} label="Sec" color={accentColor} isDark={isDark} />
    </div>
  );
}
