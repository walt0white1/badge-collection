import { useTheme } from "../context/ThemeContext";

export default function ThemeToggle() {
  const { isDark, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      aria-pressed={!isDark}
      aria-label={isDark ? "Activer le mode clair" : "Activer le mode sombre"}
      className="theme-toggle"
    >
      <svg
        className="theme-toggle__svg"
        viewBox="0 0 100 100"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Sun */}
        <circle className="theme-toggle__sun" cx="50" cy="50" r="18" />

        {/* Sun rays */}
        {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => (
          <line
            key={angle}
            className="theme-toggle__ray"
            x1="50"
            y1="18"
            x2="50"
            y2="10"
            transform={`rotate(${angle} 50 50)`}
          />
        ))}

        {/* Moon mask / crescent */}
        <circle className="theme-toggle__moon" cx="62" cy="40" r="14" />

        {/* Stars */}
        <circle className="theme-toggle__star theme-toggle__star--1" cx="22" cy="22" r="1.8" />
        <circle className="theme-toggle__star theme-toggle__star--2" cx="78" cy="18" r="1.4" />
        <circle className="theme-toggle__star theme-toggle__star--3" cx="28" cy="72" r="1.2" />
        <circle className="theme-toggle__star theme-toggle__star--4" cx="82" cy="68" r="1.6" />
        <circle className="theme-toggle__star theme-toggle__star--5" cx="16" cy="48" r="1" />

        {/* Cloud shapes */}
        <g className="theme-toggle__cloud theme-toggle__cloud--1">
          <circle cx="20" cy="78" r="6" />
          <circle cx="28" cy="76" r="8" />
          <circle cx="38" cy="78" r="6" />
        </g>
        <g className="theme-toggle__cloud theme-toggle__cloud--2">
          <circle cx="62" cy="82" r="5" />
          <circle cx="70" cy="80" r="7" />
          <circle cx="78" cy="82" r="5" />
        </g>
      </svg>
    </button>
  );
}
