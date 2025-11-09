import { useEffect, useRef, useState } from "react";
import { Menu, User, LogOut, Settings } from "lucide-react";

export default function CompanyTopbar({ profile }) {
  const [open, setOpen] = useState(false);
  const btnRef = useRef(null);
  const menuRef = useRef(null);

  const toggleMobile = () => {
    document.documentElement.classList.toggle("sidebar-open");
  };

  // click outside to close
  useEffect(() => {
    const onDocClick = (e) => {
      if (!open) return;
      if (
        menuRef.current && !menuRef.current.contains(e.target) &&
        btnRef.current && !btnRef.current.contains(e.target)
      ) setOpen(false);
    };
    document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, [open]);

  const logout = () => {
    localStorage.removeItem("userToken");
    localStorage.removeItem("userRole");
    window.location.href = "/login";
  };

  const editProfile = () => {
    window.location.href = "/company/profile";
  };

  return (
    <header className="company-topbar">
      <div className="h-full px-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button className="md:hidden p-2 rounded hover:bg-slate-100" onClick={toggleMobile} aria-label="Menu">
            <Menu size={18} />
          </button>
          <span className="font-semibold">Hello {profile?.name || "Recruiter"}</span>
        </div>

        <div className="relative">
          <button
            ref={btnRef}
            onClick={() => setOpen((s) => !s)}
            className="flex items-center gap-2 btn btn-ghost"
            aria-haspopup="menu"
            aria-expanded={open}
          >
            <div className="avatar">
              {profile?.name ? profile.name[0]?.toUpperCase() : "U"}
            </div>
            <span className="hidden sm:inline text-sm font-medium">{profile?.name || "User"}</span>
          </button>

          {open && (
            <div ref={menuRef} className="menu">
              <div className="menu-item" onClick={editProfile}>
                <User size={16} /> Edit Profile
              </div>
              <div className="menu-item" onClick={() => (window.location.href="/company/settings")}>
                <Settings size={16} /> Settings
              </div>
              <div className="menu-sep" />
              <div className="menu-item" onClick={logout}>
                <LogOut size={16} /> Logout
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
