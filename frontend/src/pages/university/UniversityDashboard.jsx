import { lazy, Suspense, useEffect, useMemo, useState } from "react";
import { NavLink, useLocation, useNavigate, useParams, Navigate } from "react-router-dom";
import {
  Brain, BarChart3, Users, Building2, FolderCheck, Star, Video, User,
  Menu as MenuIcon, ChevronRight, ChevronLeft, MoreHorizontal, LogOut, Pencil, Award
} from "lucide-react";
import { getOverview, getUniversityMe } from "../../api/university";
import Overview from "../../components/university/Overview";
import CollabWorkspace from "../../components/shared/CollabWorkspace";
const Collaboration = lazy(() => import("../../components/university/Collaboration"));
const AdvancedAnalytics = lazy(() => import("../../components/university/AdvancedAnalytics"));
const StudentsManager = lazy(() => import("../../components/university/StudentsManager"));
// ⛳ Collaboration: we’ll route to the universal page, so no separate component import needed
const PlacementSystem = lazy(() => import("../../components/university/PlacementSystem"));
const SkillValidation = lazy(() => import("../../components/university/SkillValidation"));
const WebinarsPanel = lazy(() => import("../../components/university/WebinarsPanel"));
const UniversityProfile = lazy(() => import("../../components/university/UniversityProfile"));
const CertificatesPanel = lazy(() => import("../../components/university/CertificatesPanel"));

const COLOR = {
  PRIMARY: "#145da0",
  DARK: "#0c2d48",
  ACCENT: "#2e8bc0",
  LIGHT: "#b1d4e0",
};

const MENU = [
  { key: "overview",   label: "Overview",             icon: Brain,      path: (u) => `/university/${u}/overview` },
  { key: "advanced",   label: "Advanced Analytics",   icon: BarChart3,  path: (u) => `/university/${u}/advanced` },
  { key: "students",   label: "Students Manager",     icon: Users,      path: (u) => `/university/${u}/students` },
  // 🔁 Route the menu item to the universal collab page for a single shared workspace
  { key: "collaboration", label: "Industry Collaboration", icon: Building2, path: () => `/collab` },
  { key: "placements", label: "Placement System",     icon: FolderCheck, path: (u) => `/university/${u}/placements` },
  { key: "validation", label: "Skill Validation",     icon: Star,        path: (u) => `/university/${u}/validation` },
  { key: "webinars",   label: "Webinars",             icon: Video,       path: (u) => `/university/${u}/webinars` },
  { key: "certs",      label: "Certificates",         icon: Award,       path: (u) => `/university/${u}/certs` },
  { key: "profile",    label: "Profile",              icon: User,        path: (u) => `/university/${u}/profile` },
];

export default function UniversityDashboard() {
  const params = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [username, setUsername] = useState(params.username);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(
    localStorage.getItem("uniSidebarCollapsed") === "1"
  );
  const [menuOpen, setMenuOpen] = useState(false);

  // Overview KPIs for landing overview
  const [kpis, setKpis] = useState({
    totalStudents: 0, placementRate: 0, activeInternships: 0, industryPartners: 0, averageTestPct: 0, internshipToStudent: 0
  });
  const [trend, setTrend] = useState([]);

  // fix undefined username by asking /auth/me
  useEffect(() => {
    (async () => {
      const bad = !username || username === "undefined" || username === ":username";
      if (bad) {
        try {
          const me = await getUniversityMe();
          if (me?.username) {
            setUsername(me.username);
            navigate(`/university/${me.username}/overview`, { replace: true });
          }
        } catch {
          // leave as-is; login flow will handle redirect
        }
      }
    })();
  }, [username, location.pathname, navigate]);

  // load overview when on overview
  useEffect(() => {
    const section = getSectionFromPath(location.pathname);
    if (!username || username === "undefined") return;
    if (section !== "overview") return;
    (async () => {
      try {
        const o = await getOverview(username);
        setKpis(o.kpis || {});
        setTrend(o.trend || []);
      } catch {
        setKpis({ totalStudents: 0, placementRate: 0, activeInternships: 0, industryPartners: 0, averageTestPct: 0, internshipToStudent: 0 });
        setTrend([]);
      }
    })();
  }, [username, location.pathname]);

  const toggleSidebar = () => {
    const next = !sidebarCollapsed;
    setSidebarCollapsed(next);
    localStorage.setItem("uniSidebarCollapsed", next ? "1" : "0");
  };

  const onLogout = () => {
    localStorage.removeItem("userToken");
    localStorage.removeItem("userRole");
    localStorage.removeItem("token");
    navigate("/login");
  };

  const activeKey = useMemo(() => getSectionFromPath(location.pathname) || "overview", [location.pathname]);

  return (
    <div className="min-h-screen flex"
      style={{
        backgroundImage:
          `radial-gradient(28rem 18rem at -10% -10%, ${COLOR.PRIMARY}10, transparent 55%), radial-gradient(22rem 16rem at 110% 110%, ${COLOR.ACCENT}10, transparent 60%)`,
      }}
    >
      {/* SIDEBAR */}
      <aside
        className={`h-screen sticky top-0 shrink-0 transition-all duration-300 border-r bg-white`}
        style={{ width: sidebarCollapsed ? 76 : 280, borderColor: COLOR.LIGHT }}
      >
        {/* Brand / Collapse */}
        <div className="h-16 flex items-center justify-between px-3">
          <div className="flex items-center gap-2">
            <div
              className="h-9 w-9 rounded-xl grid place-items-center text-white font-bold"
              style={{ backgroundColor: COLOR.PRIMARY }}
              aria-label="Brand"
            >
              U
            </div>
            {!sidebarCollapsed && (
              <div>
                <p className="text-sm leading-5 font-bold" style={{ color: COLOR.DARK }}>University</p>
                <p className="text-xs text-gray-500 truncate">/{username || "…"}</p>
              </div>
            )}
          </div>
          <button
            className="rounded-lg p-2 hover:bg-slate-100"
            onClick={toggleSidebar}
            aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            title={sidebarCollapsed ? "Expand" : "Collapse"}
          >
            {sidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Menu */}
        <nav className="px-2 py-2">
          {MENU.map((m) => {
            const Icon = m.icon;
            const to = username ? m.path(username) : "#";
            const isActive = activeKey === m.key;
            return (
              <NavLink
                key={m.key}
                to={to}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 mb-1 transition ${
                  isActive ? "text-white" : "text-gray-700 hover:bg-slate-100"
                }`}
                style={{ backgroundColor: isActive ? COLOR.PRIMARY : "transparent" }}
              >
                <Icon className="w-5 h-5" />
                {!sidebarCollapsed && <span className="text-sm font-medium">{m.label}</span>}
              </NavLink>
            );
          })}
        </nav>
      </aside>

      {/* MAIN */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* TOPBAR */}
        <header className="h-16 w-full flex items-center justify-between px-4 md:px-6 bg-white/80 backdrop-blur border-b"
          style={{ borderColor: COLOR.LIGHT }}
        >
          <div className="flex items-center gap-2">
            <button className="rounded-lg p-2 hover:bg-slate-100 md:hidden" onClick={toggleSidebar} aria-label="Toggle sidebar">
              <MenuIcon className="w-5 h-5" />
            </button>
            <h1 className="text-lg md:text-xl font-extrabold" style={{ color: COLOR.DARK }}>
              {titleFromKey(activeKey)}
            </h1>
          </div>

          <div className="relative">
            <button
              onClick={() => setMenuOpen((s) => !s)}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border bg-white hover:bg-slate-50"
              style={{ borderColor: COLOR.LIGHT }}
              aria-haspopup="menu"
              aria-expanded={menuOpen}
            >
              <div
                className="h-7 w-7 rounded-full grid place-items-center text-white text-xs font-bold"
                style={{ backgroundColor: COLOR.PRIMARY }}
              >
                {initialsFromUsername(username)}
              </div>
              <span className="hidden sm:block text-sm font-medium" style={{ color: COLOR.DARK }}>
                {username || "…"}
              </span>
              <MoreHorizontal className="w-4 h-4 text-gray-600" />
            </button>

            {menuOpen && (
              <div role="menu" className="absolute right-0 mt-2 w-44 bg-white border rounded-xl shadow-lg overflow-hidden z-10"
                   style={{ borderColor: COLOR.LIGHT }}>
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    if (username) navigate(`/university/${username}/profile`);
                  }}
                  className="w-full px-3 py-2 text-left text-sm hover:bg-slate-50 flex items-center gap-2"
                >
                  <Pencil className="w-4 h-4" style={{ color: COLOR.PRIMARY }} /> Edit Profile
                </button>
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    onLogout();
                  }}
                  className="w-full px-3 py-2 text-left text-sm hover:bg-slate-50 flex items-center gap-2 text-red-600"
                >
                  <LogOut className="w-4 h-4" /> Logout
                </button>
              </div>
            )}
          </div>
        </header>

        {/* CONTENT */}
        <main className="flex-1 min-w-0 p-4 md:p-6">
          <Suspense fallback={<div className="text-sm text-gray-500">Loading…</div>}>
            {renderSection(activeKey, username, { kpis, trend })}
          </Suspense>
        </main>
      </div>
    </div>
  );
}

/* ---------- helpers ---------- */
function getSectionFromPath(pathname = "") {
  const parts = pathname.split("/").filter(Boolean);
  return parts[2] || "overview";
}
function initialsFromUsername(u = "") {
  const s = String(u).trim();
  if (!s) return "U";
  return s.slice(0, 2).toUpperCase();
}
function titleFromKey(key) {
  switch (key) {
    case "overview": return "Overview";
    case "advanced": return "Advanced Analytics";
    case "students": return "Students Manager";
    case "collaboration": return "Industry Collaboration";
    case "placements": return "Placement System";
    case "validation": return "Skill Validation";
    case "webinars": return "Webinars";
    case "certs": return "Certificates";
    case "profile": return "Profile";
    default: return "Dashboard";
  }
}
function renderSection(key, username, data) {
  switch (key) {
    case "overview":      return <Overview kpis={data.kpis} trend={data.trend} username={username} />;
    case "advanced":      return <AdvancedAnalytics username={username} />;
    case "students":      return <StudentsManager username={username} />;
    case "collaboration": return <Collaboration />;
    case "placements":    return <PlacementSystem />;
    case "validation":    return <SkillValidation />;
    case "webinars":      return <WebinarsPanel />;
    case "certs":         return <CertificatesPanel username={username} />;
    case "profile":       return <UniversityProfile username={username} onUsernameChanged={() => {}} onLogout={() => {}} />;
    default:              return <Overview kpis={data.kpis} trend={data.trend} username={username} />;
  }
}
