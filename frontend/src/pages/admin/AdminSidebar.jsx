// src/pages/admin/AdminSidebar.jsx
import { useMemo, useRef, useState } from "react";
import {
  LayoutDashboard,
  Briefcase,
  ClipboardList,
  Video,
  Trophy,
  Handshake,
  Sparkles,
  BarChart3,
  Upload,
  ChevronDown,
  ChevronRight,
  Menu,
  X,
  Users as UsersIcon,
  ChevronLeft,
  LogOut,
} from "lucide-react";

/** Palette from your spec */
const COLORS = {
  brand: "#F29F67",
  ink: "#1E1E2C",
  info: "#3B8FF3",
  teal: "#34B1AA",
  gold: "#E0B50F",
};

const baseItems = [
  { id: "analytics", label: "Analytics", icon: LayoutDashboard },
  { id: "jobs", label: "Jobs", icon: Briefcase },
  { id: "applications", label: "Applications", icon: ClipboardList },
  { id: "webinars", label: "Webinars", icon: Video },
  { id: "hackathons", label: "Hackathons", icon: Trophy },
  { id: "partnerships", label: "Partnerships", icon: Handshake },
];

const legacyItems = [
  { id: "skills", label: "Skills (legacy)", icon: Sparkles },
  { id: "sets", label: "Question Sets (legacy)", icon: Sparkles },
  { id: "questions", label: "Questions (legacy)", icon: Sparkles },
];

const bottomItems = [
  { id: "results", label: "Results", icon: BarChart3 },
  { id: "bulk", label: "Bulk Import/Export", icon: Upload },
  { id: "users", label: "Users", icon: UsersIcon },
];

export default function AdminSidebar({
  active,
  onChange,
  adminEmail = "",
  onLogout,
}) {
  const [menuOpen, setMenuOpen] = useState(false); // mobile drawer
  const [collapsed, setCollapsed] = useState(false); // desktop collapse
  const [assessOpen, setAssessOpen] = useState(true); // group open/closed
  const [assessFlyout, setAssessFlyout] = useState(false); // when collapsed

  const sideWidth = collapsed ? 80 : 288;

  const isActive = (id) => active === id;

  const Item = ({ id, label, Icon, depth = 0, onClick }) => {
    const content = (
      <li
        onClick={() => {
          onClick?.();
          if (!onClick) {
            onChange?.(id);
            setMenuOpen(false);
          }
        }}
        className={[
          "px-3 py-2 rounded cursor-pointer flex items-center gap-3 transition-colors",
          isActive(id) ? "bg-[var(--brand)] text-white" : "text-white/90 hover:bg-white/10",
        ].join(" ")}
        title={collapsed ? label : undefined}
        style={{ marginLeft: collapsed ? 0 : depth * 12 }}
      >
        <Icon size={18} className="shrink-0" />
        {!collapsed && <span className="truncate">{label}</span>}
      </li>
    );
    return content;
  };

  const Flyout = ({ open, onClose }) => {
    const ref = useRef(null);
    return open ? (
      <div
        ref={ref}
        onMouseLeave={() => setAssessFlyout(false)}
        className="absolute left-[80px] top-[180px] z-[60] w-56 rounded-xl shadow-lg border border-white/10"
        style={{ background: COLORS.ink, color: "#fff" }}
      >
        <div className="p-2">
          <div className="px-2 py-1 text-[11px] uppercase tracking-wider text-white/60">Assessments</div>
          <ul className="space-y-1">
            <Item id="assessments-skill" label="Skill" Icon={Sparkles} />
            <Item id="assessments-aptitude" label="Aptitude" Icon={Sparkles} />
          </ul>
        </div>
      </div>
    ) : null;
  };

  return (
    <>
      {/* Mobile top bar */}
      <div
        className="lg:hidden sticky top-0 z-40 px-4 py-3 flex items-center justify-between"
        style={{ background: COLORS.ink, color: "#fff" }}
      >
        <div className="font-semibold">Admin Panel</div>
        <button
          onClick={() => setMenuOpen((o) => !o)}
          className="p-2 rounded-lg hover:bg-white/10"
          aria-label="Toggle menu"
        >
          {menuOpen ? <X size={18} /> : <Menu size={18} />}
        </button>
      </div>

      {/* Sidebar */}
      <aside
        className={[
          "lg:static lg:translate-x-0 fixed z-50 top-0 left-0 h-full p-4 lg:p-6 flex flex-col transition-transform",
          menuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        ].join(" ")}
        style={{
          background: COLORS.ink,
          color: "#fff",
          width: sideWidth,
        }}
      >
        {/* Header + collapse */}
        <div className="mb-4 flex items-center justify-between">
          {!collapsed ? (
            <div className="flex flex-col">
              <div className="text-xl font-bold">Admin Panel</div>
              <div className="text-[11px] opacity-70 break-all mt-1">{adminEmail}</div>
            </div>
          ) : (
            <div className="text-lg font-bold">AP</div>
          )}

          {/* Collapse (desktop) / Close (mobile) */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCollapsed((c) => !c)}
              className="hidden lg:grid place-items-center h-8 w-8 rounded-lg hover:bg-white/10"
              title={collapsed ? "Expand" : "Collapse"}
            >
              {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
            </button>
            <button
              onClick={() => setMenuOpen(false)}
              className="lg:hidden grid place-items-center h-8 w-8 rounded-lg hover:bg-white/10"
              title="Close"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto pr-1 relative">
          <ul className="space-y-2">
            {baseItems.map((it) => (
              <Item key={it.id} id={it.id} label={it.label} Icon={it.icon} />
            ))}

            {/* Collapsible group: Assessments */}
            <li className="mt-2 relative">
              <button
                onClick={() => {
                  if (collapsed) {
                    setAssessFlyout((v) => !v);
                  } else {
                    setAssessOpen((v) => !v);
                  }
                }}
                className={[
                  "w-full px-3 py-2 rounded flex items-center justify-between hover:bg-white/10",
                  isActive("assessments-skill") || isActive("assessments-aptitude") ? "bg-white/10" : "",
                ].join(" ")}
                title={collapsed ? "Assessments" : undefined}
                onMouseEnter={() => collapsed && setAssessFlyout(true)}
              >
                <span className="flex items-center gap-3">
                  <Sparkles size={18} />
                  {!collapsed && <span>Assessments</span>}
                </span>
                {!collapsed && (assessOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />)}
              </button>

              {/* Expanded list (desktop expanded) */}
              {!collapsed && assessOpen && (
                <ul className="mt-1 space-y-1">
                  <Item id="assessments-skill" label="Skill" Icon={Sparkles} depth={1} />
                  <Item id="assessments-aptitude" label="Aptitude" Icon={Sparkles} depth={1} />
                </ul>
              )}

              {/* Flyout (desktop collapsed) */}
              {collapsed && <Flyout open={assessFlyout} onClose={() => setAssessFlyout(false)} />}
            </li>

            {/* Legacy group */}
            <li className="mt-2">
              {!collapsed && (
                <div className="px-3 py-1 text-[11px] uppercase tracking-wider text-white/60">
                  Legacy Tools
                </div>
              )}
              <ul className="space-y-2">
                {legacyItems.map((it) => (
                  <Item key={it.id} id={it.id} label={it.label} Icon={it.icon} />
                ))}
              </ul>
            </li>

            {/* Utilities */}
            <li className="mt-2">
              {!collapsed && (
                <div className="px-3 py-1 text-[11px] uppercase tracking-wider text-white/60">
                  Utilities
                </div>
              )}
              <ul className="space-y-2">
                {bottomItems.map((it) => (
                  <Item key={it.id} id={it.id} label={it.label} Icon={it.icon} />
                ))}
              </ul>
            </li>
          </ul>
        </nav>

        {/* Bottom: Logout */}
        <div className="pt-3 border-t border-white/10">
          <button
            onClick={onLogout}
            className={[
              "w-full rounded-xl px-3 py-2 flex items-center gap-3 justify-center",
              "bg-white/10 hover:bg-white/15 text-white",
            ].join(" ")}
            title="Logout"
          >
            <LogOut size={18} />
            {!collapsed && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* Backdrop for mobile */}
      {menuOpen && (
        <div
          onClick={() => setMenuOpen(false)}
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
        />
      )}

      {/* global CSS var for brand color */}
      <style>{`:root { --brand: ${COLORS.brand}; }`}</style>
    </>
  );
}
