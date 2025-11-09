import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Briefcase,
  BookOpen,
  BadgeCheck,
  LayoutDashboard,
  SquarePen,
  ChartColumn,
  Video,
  Sparkles,
  GraduationCap,
  Layers,
  PanelLeftClose,
  PanelLeftOpen,
  UserCircle2,
  Edit3,
  LogOut,
  Copy as CopyIcon,
  ClipboardCheck,
  Award,
} from "lucide-react";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";

/* ------------------------------- Nav Config ------------------------------- */
/** Added "Certificates" for students */
const navItems = [
  { label: "Dashboard", icon: LayoutDashboard, path: "/student/dashboard" },
  { label: "Internships", icon: Briefcase, path: "/student/internships" },
  { label: "Career Roadmap", icon: BookOpen, path: "/student/roadmap" },
  { label: "Badges", icon: BadgeCheck, path: "/student/badges" },
  { label: "TestSkill", icon: SquarePen, path: "/student/testskill" },
  { label: "Progress", icon: ChartColumn, path: "/student/progress" },
  { label: "Job Board", icon: ChartColumn, path: "/student/jobs" },
  { label: "Webinars", icon: Video, path: "/student/webinars" },
  { label: "Application Status", icon: GraduationCap, path: "/student/status" },
  { label: "Hackathon", icon: Sparkles, path: "/student/hackathons" },
  { label: "Study", icon: Layers, path: "/student/study" },
  { label: "Certificates", icon: Award, path: "/student/certificates" }, // NEW
];

/* --------------------------------- helpers -------------------------------- */

const safeGet = (k, fb = "") => {
  try {
    const v = localStorage.getItem(k);
    return v != null ? v : fb;
  } catch {
    return fb;
  }
};

async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // fallback
    const ta = document.createElement("textarea");
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    try {
      document.execCommand("copy");
      return true;
    } catch {
      return false;
    } finally {
      document.body.removeChild(ta);
    }
  }
}

/* ------------------------------- Tooltip ------------------------------- */

function HoverTooltip({ anchorRef, text, show }) {
  const [pos, setPos] = useState({ top: 0, left: 0 });
  useEffect(() => {
    if (!show) return;
    const el = anchorRef?.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    setPos({ top: rect.top + rect.height / 2, left: rect.right + 10 });
  }, [anchorRef, show]);

  if (!show) return null;
  return createPortal(
    <div
      style={{
        position: "fixed",
        top: pos.top,
        left: pos.left,
        transform: "translateY(-50%)",
        zIndex: 9999,
      }}
      className="pointer-events-none"
    >
      <div className="px-2.5 py-1.5 rounded-lg text-xs font-medium bg-[#0A2647] text-white shadow-lg whitespace-nowrap">
        {text}
      </div>
    </div>,
    document.body
  );
}

/* ------------------------------ Nav Link Item ------------------------------ */

function NavLinkItem({ item, active, collapsed, isMobile, onHit }) {
  const Icon = item.icon;
  const anchorRef = useRef(null);
  const [hover, setHover] = useState(false);

  return (
    <>
      <Link
        ref={anchorRef}
        to={item.path}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        onClick={() => {
          if (isMobile && onHit) onHit();
        }}
        className={[
          "group flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition relative",
          active ? "bg-[#205295] text-white shadow-sm" : "text-[#144272] hover:bg-[#E9F1FA]",
          collapsed ? "justify-center" : "",
        ].join(" ")}
      >
        <span
          className={[
            "h-8 w-8 grid place-items-center rounded-lg flex-shrink-0 transition",
            active ? "bg-white/10 text-white" : "bg-white text-[#0A2647] group-hover:text-[#205295]",
          ].join(" ")}
        >
          <Icon size={16} />
        </span>
        {!collapsed && <span className="truncate">{item.label}</span>}
      </Link>
      {collapsed && <HoverTooltip anchorRef={anchorRef} text={item.label} show={hover} />}
    </>
  );
}

/* -------------------------------- Sidebar -------------------------------- */

function Sidebar({ isOpen, setIsOpen, isMobile }) {
  const location = useLocation();
  const navigate = useNavigate();

  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem("sidebar.collapsed") === "1";
    } catch {
      return false;
    }
  });

  // studentId from localStorage (kept in sync by profile panel / server fetch)
  const [studentId, setStudentId] = useState(() => safeGet("studentId", ""));
  const [copied, setCopied] = useState(false);

  // listen to storage & custom event to keep studentId in sync across tabs/components
  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === "studentId") {
        setStudentId(e.newValue || "");
      }
    };
    const onProfileRefresh = () => {
      setStudentId(safeGet("studentId", ""));
    };
    window.addEventListener("storage", onStorage);
    window.addEventListener("student:profile-refreshed", onProfileRefresh);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("student:profile-refreshed", onProfileRefresh);
    };
  }, []);

  const handleCopy = async () => {
    if (!studentId) return;
    const ok = await copyToClipboard(studentId);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    }
  };

  // Make the sidebar slightly smaller by default (220px)
  const WIDTH_EXPANDED = 220;
  const WIDTH_COLLAPSED = 84;

  useEffect(() => {
    const widthPx = collapsed && !isMobile ? `${WIDTH_COLLAPSED}px` : `${WIDTH_EXPANDED}px`;
    document.documentElement.style.setProperty("--sidebar-width", widthPx);
    try {
      localStorage.setItem("sidebar.collapsed", collapsed ? "1" : "0");
    } catch {}
  }, [collapsed, isMobile]);

  const isActive = (p) => location.pathname === p;

  const Brand = useMemo(
    () => (
      <div className="flex items-center gap-3">
        <div className="h-9 w-9 rounded-xl bg-[#2C74B3]" />
        {!collapsed && (
          <div className="leading-tight">
            <div className="font-semibold text-[#0A2647]">StudentConnect</div>
            <div className="text-xs text-[#144272]">Student Portal</div>
          </div>
        )}
      </div>
    ),
    [collapsed]
  );

  // Show the bottom-left profile menu button only when NOT on dashboard
  const showBottomProfile = location.pathname !== "/student/dashboard";

  // Profile menu state (bottom-left)
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const profileBtnRef = useRef(null);

  useEffect(() => {
    const onClickOutside = (e) => {
      if (profileBtnRef.current && !profileBtnRef.current.contains(e.target)) {
        setProfileMenuOpen(false);
      }
    };
    if (profileMenuOpen) document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [profileMenuOpen]);

  const handleEditProfile = () => {
    // Fire the same event your dashboard listens to
    window.dispatchEvent(new Event("open-profile-setup"));
    setProfileMenuOpen(false);
    if (isMobile) setIsOpen(false);
  };

  const handleLogout = () => {
    try {
      localStorage.removeItem("userToken");
      localStorage.removeItem("userRole");
      localStorage.removeItem("studentId");
    } catch {}
    setProfileMenuOpen(false);
    if (isMobile) setIsOpen(false);
    navigate("/login");
  };

  return (
    <aside
      className={[
        "fixed md:sticky top-0 left-0 h-full md:h-screen bg-white border-r border-[#E5EAF0] z-40 transform transition-transform duration-300 flex flex-col",
        isOpen || !isMobile ? "translate-x-0" : "-translate-x-full",
      ].join(" ")}
      style={{
        maxHeight: "100vh",
        width: collapsed && !isMobile ? `${WIDTH_COLLAPSED}px` : `${WIDTH_EXPANDED}px`,
      }}
      aria-label="Student sidebar"
    >
      <div className="flex flex-col h-full">
        {/* Top: Brand + Close on mobile */}
        <div className="px-4 py-3 border-b border-[#E5EAF0] bg-white flex items-center justify-between">
          {Brand}
          {isMobile && (
            <button
              onClick={() => setIsOpen(false)}
              className="h-8 w-8 grid place-items-center rounded-lg hover:bg-[#E9F1FA] text-[#0A2647]"
              aria-label="Close menu"
            >
              ✕
            </button>
          )}
        </div>

        {/* Optional pinned Student ID card under brand (expanded only) */}
        {!collapsed && studentId ? (
          <div className="px-3 pt-3">
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
              <div className="text-[11px] text-slate-500">Student ID</div>
              <div className="mt-1 flex items-center justify-between gap-2">
                <div className="font-mono text-sm text-slate-800">{studentId}</div>
                <button
                  onClick={handleCopy}
                  className="inline-flex items-center gap-1 rounded-md bg-white px-2 py-1 text-[11px] text-slate-700 ring-1 ring-slate-200 hover:bg-slate-100"
                  title="Copy ID"
                >
                  {copied ? <ClipboardCheck size={14} /> : <CopyIcon size={14} />}
                  {copied ? "Copied" : "Copy"}
                </button>
              </div>
            </div>
          </div>
        ) : null}

        {/* Nav Links */}
        <div className="flex-1 overflow-y-auto">
          <nav className="p-3 space-y-1">
            {navItems.map((item) => (
              <NavLinkItem
                key={item.path}
                item={item}
                active={isActive(item.path)}
                collapsed={collapsed}
                isMobile={isMobile}
                onHit={() => setIsOpen(false)}
              />
            ))}
          </nav>
        </div>

        {/* Bottom row: left = profile (when off dashboard), right = collapse toggle */}
        <div className="p-3 border-t border-[#E5EAF0] bg-white flex items-center justify-between">
          {/* Bottom-left profile button (only off-dashboard) */}
          {showBottomProfile ? (
            <div className="relative" ref={profileBtnRef}>
              <button
                onClick={() => setProfileMenuOpen((v) => !v)}
                className={[
                  "flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-slate-800 hover:bg-slate-50",
                  collapsed ? "justify-center" : "",
                ].join(" ")}
                aria-haspopup="menu"
                aria-expanded={profileMenuOpen}
              >
                <UserCircle2 size={18} className="text-slate-600" />
                {!collapsed && <span className="text-sm">Profile</span>}
              </button>

              {profileMenuOpen && (
                <div
                  role="menu"
                  className="absolute left-0 bottom-11 w-56 rounded-lg border border-slate-200 bg-white shadow-md z-20"
                >
                  {/* Student ID quick copy */}
                  {studentId ? (
                    <div className="px-3 pt-2 pb-1">
                      <div className="text-[11px] text-slate-500 mb-1">Student ID</div>
                      <div className="flex items-center justify-between gap-2">
                        <div className="rounded-md bg-slate-50 border border-slate-200 px-2 py-1 text-xs font-mono text-slate-700">
                          {studentId}
                        </div>
                        <button
                          onClick={handleCopy}
                          className="inline-flex items-center gap-1 rounded-md bg-white px-2 py-1 text-[11px] text-slate-700 ring-1 ring-slate-200 hover:bg-slate-100"
                          title="Copy ID"
                        >
                          {copied ? <ClipboardCheck size={14} /> : <CopyIcon size={14} />}
                          {copied ? "Copied" : "Copy"}
                        </button>
                      </div>
                    </div>
                  ) : null}

                  <button
                    onClick={handleEditProfile}
                    className="flex items-center gap-2 w-full px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                    role="menuitem"
                  >
                    <Edit3 size={16} /> Edit Profile
                  </button>
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                    role="menuitem"
                  >
                    <LogOut size={16} /> Logout
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div />
          )}

          {/* Collapse button (right) */}
          <button
            onClick={() => setCollapsed((c) => !c)}
            className="h-8 w-8 grid place-items-center rounded-lg hover:bg-[#E9F1FA] text-[#0A2647]"
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
          </button>
        </div>
      </div>
    </aside>
  );
}

export default Sidebar;
