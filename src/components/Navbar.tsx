import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useState } from "react";

const TWITCH_ICON = (
  <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current">
    <path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714z" />
  </svg>
);

export default function Navbar() {
  const { user, isAuthenticated, login, logout } = useAuth();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const navLinks = [
    { to: "/", label: "Accueil" },
    { to: "/leaderboard", label: "Classement" },
    ...(isAuthenticated
      ? [
          { to: "/collection", label: "Ma Collection" },
          { to: "/trades", label: "Echanges" },
        ]
      : []),
  ];

  const isActive = (path: string) =>
    path === "/" ? location.pathname === "/" : location.pathname.startsWith(path);

  return (
    <nav className="sticky top-0 z-50 border-b border-gray-800/60 bg-gray-950/80 backdrop-blur-xl">
      <div className="max-w-[1400px] mx-auto px-6 sm:px-8 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5 group">
          <span className="text-twitch">{TWITCH_ICON}</span>
          <span className="font-bold text-lg tracking-tight group-hover:text-twitch transition-colors">
            el_matte0
          </span>
        </Link>

        <div className="hidden md:flex items-center gap-1">
          {navLinks.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                isActive(l.to)
                  ? "bg-twitch/15 text-twitch"
                  : "text-gray-400 hover:text-gray-100 hover:bg-gray-800/50"
              }`}
            >
              {l.label}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-3">
          {isAuthenticated && user ? (
            <div className="relative">
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="flex items-center gap-2 px-2 py-1 rounded-lg hover:bg-gray-800/50 transition-colors"
              >
                <img
                  src={user.twitch_profile_image}
                  alt=""
                  className="w-8 h-8 rounded-full ring-2 ring-twitch/40"
                />
                <span className="hidden sm:block text-sm font-medium">
                  {user.twitch_display_name}
                </span>
              </button>
              {menuOpen && (
                <>
                  <div className="fixed inset-0" onClick={() => setMenuOpen(false)} />
                  <div className="absolute right-0 mt-2 w-48 bg-gray-900 border border-gray-800 rounded-xl shadow-2xl py-1 z-50">
                    {navLinks.map((l) => (
                      <Link
                        key={l.to}
                        to={l.to}
                        onClick={() => setMenuOpen(false)}
                        className={`block px-4 py-2 text-sm hover:bg-gray-800/50 md:hidden ${
                          isActive(l.to) ? "text-twitch" : "text-gray-300 hover:text-white"
                        }`}
                      >
                        {l.label}
                      </Link>
                    ))}
                    <button
                      onClick={() => {
                        setMenuOpen(false);
                        logout();
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-gray-800/50"
                    >
                      Deconnexion
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <>
              <button
                onClick={login}
                className="flex items-center gap-2 px-4 py-2 bg-twitch hover:bg-twitch-dark text-white text-sm font-semibold rounded-lg transition-colors"
              >
                {TWITCH_ICON}
                <span className="hidden sm:inline">Connexion</span>
              </button>
              {/* Mobile nav menu for non-logged users */}
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="md:hidden p-2 rounded-lg hover:bg-gray-800/50 transition-colors"
              >
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              {menuOpen && (
                <>
                  <div className="fixed inset-0" onClick={() => setMenuOpen(false)} />
                  <div className="absolute right-6 top-14 w-48 bg-gray-900 border border-gray-800 rounded-xl shadow-2xl py-1 z-50">
                    {navLinks.map((l) => (
                      <Link
                        key={l.to}
                        to={l.to}
                        onClick={() => setMenuOpen(false)}
                        className={`block px-4 py-2 text-sm hover:bg-gray-800/50 ${
                          isActive(l.to) ? "text-twitch" : "text-gray-300 hover:text-white"
                        }`}
                      >
                        {l.label}
                      </Link>
                    ))}
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
