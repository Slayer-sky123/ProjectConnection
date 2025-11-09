import { Bell, Menu, ShieldCheck, ChevronDown, LogOut } from "lucide-react";

export default function CompanyNavbar({ profile, mobileTabsOpen, onToggleMobileTabs, onLogout }) {
  return (
    <nav className="sticky top-0 z-40 bg-white/80 backdrop-blur border-b border-slate-200/70">
      <div className="max-w-7xl mx-auto px-4">
        <div className="h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button className="md:hidden p-2 rounded-lg hover:bg-slate-100" onClick={onToggleMobileTabs}>
              <Menu size={18} />
            </button>
            <div className="flex items-center gap-2">
              {profile?.logoUrl ? (
                <img src={profile.logoUrl} alt="logo" className="h-7 w-7 rounded-md object-cover border border-slate-200" />
              ) : (
                <div className="h-7 w-7 rounded-md bg-[#1A55E3] text-white grid place-items-center text-xs font-bold">C</div>
              )}
              <span className="font-semibold">Company Portal</span>
            </div>
          </div>

          <div className="hidden md:flex items-center flex-1 max-w-lg mx-4">
            <div className="relative w-full">
              <input
                type="text"
                placeholder="Search jobs, candidates, webinars…"
                className="w-full border rounded-xl pl-3 pr-3 py-2 text-sm bg-white/70 focus:outline-none focus:ring-2 focus:ring-[#1A55E3]/20"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button className="relative p-2 rounded-lg hover:bg-slate-100">
              <Bell size={18} />
              <span className="absolute -top-0.5 -right-0.5 h-2 w-2 bg-[#FF0854] rounded-full" />
            </button>
            <div className="h-8 w-8 rounded-xl grid place-items-center bg-slate-100 text-slate-700 border border-slate-200">
              <ShieldCheck size={16} />
            </div>
            <button className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl border bg-white/70 hover:bg-white">
              <span className="text-sm">{profile?.name || "Profile"}</span>
              <ChevronDown size={16} />
            </button>
            <button
              className="hidden md:inline-flex items-center gap-2 bg-gray-900 text-white hover:bg-gray-800 rounded-xl px-3 py-1.5"
              onClick={onLogout}
            >
              <LogOut size={16} /> <span className="text-sm">Logout</span>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
