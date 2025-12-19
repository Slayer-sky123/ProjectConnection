import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";

/**
 * Clean premium header:
 * - Logo left, menus centered, Login + Get Started on right
 * - Thin inset divider between header and hero
 * - Active link styling
 * - Pure white background
 */
export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  const isActive = (path) => location.pathname === path;

  return (
    <header className="fixed top-0 left-0 w-full z-50 bg-white/95 backdrop-blur">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 grid grid-cols-[auto_1fr_auto] items-center gap-4">
        {/* Left: Logo */}
        <Link
          to="/"
          className="text-xl md:text-[22px] font-extrabold tracking-tight flex items-center gap-1"
          style={{ color: "#091057" }}
        >
          Sprout<span style={{ color: "#EC8305" }}>you</span>
        </Link>

        {/* Center: Menus */}
        <nav
          className="hidden md:flex items-center justify-center gap-7 text-[13px] md:text-sm font-medium"
          style={{ color: "#091057" }}
        >
          {[
            { label: "Home", path: "/" },
            { label: "Universities", path: "/universities" },
            { label: "Companies", path: "/companies" },
            { label: "Pricing", path: "/pricing" },
            { label: "Blog", path: "/blog" },
          ].map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`relative transition-colors ${
                isActive(item.path) ? "text-(--primary-blue)" : "hover:text-(--primary-blue)/80"
              }`}
            >
              {item.label}
              {isActive(item.path) && (
                <span className="absolute -bottom-2 left-0 right-0 mx-auto h-[2px] w-6 rounded-full bg-(--primary-orange)" />
              )}
            </Link>
          ))}
        </nav>

        {/* Right: Actions (desktop) */}
        <div className="hidden md:flex items-center justify-end gap-4">
          <Link
            to="/login"
            className="text-[13px] md:text-sm font-semibold text-(--primary-blue) transition-colors"
          >
            Login
          </Link>
          <Link
            to="/register"
            className="text-[13px] md:text-sm font-semibold px-4 py-2 rounded-lg bg-(--primary-blue) text-white"
          >
            Get Started
          </Link>
        </div>

        {/* Mobile toggle */}
        <button
          onClick={() => setMenuOpen((v) => !v)}
          className="md:hidden justify-self-end inline-flex items-center justify-center h-9 w-9 rounded-full border border-[#E3E4EF] text-xl"
          style={{ color: "#091057" }}
          aria-label="Toggle navigation"
        >
          {menuOpen ? "×" : "☰"}
        </button>
      </div>

      {/* Inset divider (doesn't touch edges) */}
      <div
        className="border-t"
        style={{
          borderColor: "#DBD3D3",
          marginLeft: "clamp(72px, 8%, 140px)",
          marginRight: "clamp(72px, 8%, 140px)",
        }}
      />

      {/* Mobile dropdown */}
      {menuOpen && (
        <div
          className="md:hidden bg-white border-b animate-fadeIn"
          style={{ borderColor: "#DBD3D3" }}
        >
          <div
            className="px-6 py-4 flex flex-col space-y-3 text-sm font-medium"
            style={{ color: "#091057" }}
          >
            <Link to="/" onClick={() => setMenuOpen(false)}>
              Home
            </Link>
            <Link to="/universities" onClick={() => setMenuOpen(false)}>
              Universities
            </Link>
            <Link to="/companies" onClick={() => setMenuOpen(false)}>
              Companies
            </Link>
            <Link to="/pricing" onClick={() => setMenuOpen(false)}>
              Pricing
            </Link>
            <Link to="/blog" onClick={() => setMenuOpen(false)}>
              Blog
            </Link>

            <div className="pt-3 flex items-center gap-3 border-t" style={{ borderColor: "#F1F1F4" }}>
              <Link
                to="/login"
                onClick={() => setMenuOpen(false)}
                className="text-sm font-semibold"
              >
                Login
              </Link>
              <Link
                to="/register"
                onClick={() => setMenuOpen(false)}
                className="text-sm font-semibold px-4 py-2 rounded-lg flex-1 text-center"
                style={{ backgroundColor: "#024CAA", color: "white" }}
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
