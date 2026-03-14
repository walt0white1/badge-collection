import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useState } from "react";

const TWITCH_ICON = (
  <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current">
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
          { to: "/livechat", label: "Live Chat" },
        ]
      : []),
  ];

  const isActive = (path: string) =>
    path === "/" ? location.pathname === "/" : location.pathname.startsWith(path);

  return (
    <nav className="sticky top-0 z-50 bg-black/80 backdrop-blur-2xl">
      <div className="max-w-[1400px] mx-auto px-6 sm:px-8 h-11 flex items-center">

        {/* Logo — left */}
        <Link to="/" className="flex items-center gap-2 group shrink-0">
          <span className="text-[#48484a] group-hover:text-[#9146FF] transition-colors duration-300">{TWITCH_ICON}</span>
          <span className="font-semibold text-[13px] tracking-tight text-[#f5f5f7]">
            el_matte0
          </span>
        </Link>

        {/* Nav — center */}
        <div className="hidden md:flex items-center gap-7 flex-1 justify-center">
          {navLinks.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className={`text-xs transition-colors duration-200 ${
                isActive(l.to)
                  ? "text-[#f5f5f7] font-medium"
                  : "text-[#86868b] hover:text-[#f5f5f7]"
              }`}
            >
              {l.label}
            </Link>
          ))}
        </div>

        {/* Right side */}
        <div className="flex items-center gap-3 ml-auto shrink-0">
          {isAuthenticated && user ? (
            <div className="relative">
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="flex items-center gap-2 rounded-full hover:bg-white/[0.04] transition-colors px-1.5 py-1"
              >
                <img
                  src={user.twitch_profile_image}
                  alt=""
                  className="w-7 h-7 rounded-full"
                />
                <span className="hidden sm:block text-xs text-[#f5f5f7]">
                  {user.twitch_display_name}
                </span>
              </button>
              {menuOpen && (
                <>
                  <div className="fixed inset-0" onClick={() => setMenuOpen(false)} />
                  <div className="absolute right-0 mt-2 w-48 bg-[#1c1c1e] rounded-xl shadow-2xl py-1 z-50">
                    {navLinks.map((l) => (
                      <Link
                        key={l.to}
                        to={l.to}
                        onClick={() => setMenuOpen(false)}
                        className={`block px-4 py-2 text-xs hover:bg-white/[0.05] md:hidden ${
                          isActive(l.to) ? "text-[#f5f5f7]" : "text-[#86868b] hover:text-[#f5f5f7]"
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
                      className="w-full text-left px-4 py-2 text-xs text-[#86868b] hover:text-red-400 hover:bg-white/[0.05] transition-colors"
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
                className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1c1c1e] hover:bg-[#2c2c2e] text-[#f5f5f7] text-xs font-medium rounded-full transition-colors"
              >
                {TWITCH_ICON}
                <span className="hidden sm:inline">Connexion</span>
              </button>
              {/* Mobile menu */}
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="md:hidden p-1.5 rounded-lg hover:bg-white/[0.04] transition-colors"
              >
                <svg className="w-4 h-4 text-[#86868b]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              {menuOpen && (
                <>
                  <div className="fixed inset-0" onClick={() => setMenuOpen(false)} />
                  <div className="absolute right-6 top-12 w-48 bg-[#1c1c1e] rounded-xl shadow-2xl py-1 z-50">
                    {navLinks.map((l) => (
                      <Link
                        key={l.to}
                        to={l.to}
                        onClick={() => setMenuOpen(false)}
                        className={`block px-4 py-2 text-xs hover:bg-white/[0.05] ${
                          isActive(l.to) ? "text-[#f5f5f7]" : "text-[#86868b] hover:text-[#f5f5f7]"
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
