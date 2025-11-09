// src/components/company/CompanySidebar.jsx
import { NavLink } from "react-router-dom";
import {
  LayoutDashboard, ClipboardList, Users2, Video, Trophy,
  Handshake, Search, Settings, ChevronLeft, ChevronRight, Building2
} from "lucide-react";

const NAV = [
  { to: "/company/overview",       label: "Dashboard",     icon: LayoutDashboard },
  { to: "/company/screening",      label: "Screening",     icon: ClipboardList },
  { to: "/company/jobs",           label: "Jobs",          icon: Users2 },
  {
    to: "/company/collaboration",
    label: "Collaboration",
    icon: Handshake,
    disabled: true, // <── locked feature
  },
  { to: "/company/webinars",       label: "Webinars",      icon: Video },
  { to: "/company/hackathons",     label: "Hackathons",    icon: Trophy },
  { to: "/company/partnerships",   label: "Partnerships",  icon: Building2 },
  { to: "/company/talent",         label: "Talent",        icon: Search },
  { to: "/company/settings",       label: "Settings",      icon: Settings },
];

function linkClasses(isActive, disabled) {
  const base =
    "group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors";
  const idle =
    "text-slate-700 hover:text-slate-900 hover:bg-slate-100";
  const active = "bg-[#1A55E3] text-white";
  const locked =
    "cursor-not-allowed opacity-60 hover:bg-transparent hover:text-slate-600";
  return `${base} ${disabled ? locked : isActive ? active : idle}`;
}

const IconWrap = ({ children }) => (
  <span className="shrink-0 grid place-items-center size-5">{children}</span>
);

export default function CompanySidebar({ profile }) {
  const toggleCollapse = () => {
    const root = document.documentElement;
    const collapsed = root.classList.toggle("sidebar-collapsed");
    const btn = document.getElementById("company-sidebar-toggle");
    if (btn) btn.setAttribute("aria-expanded", collapsed ? "false" : "true");
  };

  const MAIN_LINKS   = NAV.slice(0, 7);
  const PEOPLE_LINKS = NAV.slice(7, 8);
  const SYSTEM_LINKS = NAV.slice(8);

  return (
    <aside className="company-sidebar sticky top-0 h-screen w-[260px] border-r bg-white">
      {/* Header */}
      <div className="h-[60px] px-3 border-b flex items-center justify-between">
        <div className="flex items-center gap-2 min-w-0">
          {profile?.logoUrl ? (
            <img
              src={profile.logoUrl}
              alt="logo"
              className="h-8 w-8 rounded-lg object-cover border"
            />
          ) : (
            <div
              className="h-8 w-8 rounded-lg grid place-items-center text-white text-xs font-bold"
              style={{ background: "#1A55E3" }}
            >
              C
            </div>
          )}
          <span className="font-semibold text-slate-800 brand-name truncate max-w-[150px]">
            {profile?.name?.trim() || "Company"}
          </span>
        </div>

        <button
          id="company-sidebar-toggle"
          onClick={toggleCollapse}
          className="hidden md:inline-flex p-1.5 rounded hover:bg-slate-100"
          aria-label="Collapse sidebar"
          aria-expanded="true"
          type="button"
        >
          <ChevronLeft size={16} className="collapse-left" />
          <ChevronRight size={16} className="collapse-right hidden" />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 py-3 overflow-y-auto">
        <div className="px-3 pt-1 pb-1 text-[11px] uppercase tracking-wider text-slate-400">
          Main
        </div>

        {MAIN_LINKS.map(({ to, label, icon: Icon, disabled }) =>
          disabled ? (
            <div
              key={to}
              className={linkClasses(false, true)}
              title="Coming Soon"
            >
              <IconWrap><Icon size={18} /></IconWrap>
              <span className="link-label flex items-center gap-1">
                {label}
                <span className="text-[10px] text-[#1A55E3] font-semibold uppercase tracking-wider bg-blue-50 border border-blue-100 rounded px-1 py-[1px]">
                  Soon
                </span>
              </span>
            </div>
          ) : (
            <NavLink
              key={to}
              to={to}
              end
              className={({ isActive }) => linkClasses(isActive)}
            >
              <IconWrap><Icon size={18} /></IconWrap>
              <span className="link-label truncate">{label}</span>
            </NavLink>
          )
        )}

        <div className="px-3 pt-3 pb-1 text-[11px] uppercase tracking-wider text-slate-400">
          People
        </div>
        {PEOPLE_LINKS.map(({ to, label, icon: Icon }) => (
          <NavLink key={to} to={to} end className={({ isActive }) => linkClasses(isActive)}>
            <IconWrap><Icon size={18} /></IconWrap>
            <span className="link-label truncate">{label}</span>
          </NavLink>
        ))}

        <div className="px-3 pt-3 pb-1 text-[11px] uppercase tracking-wider text-slate-400">
          System
        </div>
        {SYSTEM_LINKS.map(({ to, label, icon: Icon }) => (
          <NavLink key={to} to={to} end className={({ isActive }) => linkClasses(isActive)}>
            <IconWrap><Icon size={18} /></IconWrap>
            <span className="link-label truncate">{label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="px-3 py-3 border-t text-[12px] text-slate-500">
        © {new Date().getFullYear()} CITC
      </div>
    </aside>
  );
}
