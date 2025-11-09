import Sidebar from "../components/Sidebar";
import { Outlet } from "react-router-dom";
import { useState, useEffect } from "react";

/**
 * StudentLayout
 * - Slightly narrower sidebar (default 220px via Sidebar)
 * - Adds a small floating toggle button on mobile to open the sidebar
 */
function StudentLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== "undefined" ? window.innerWidth < 768 : false
  );

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar
        isOpen={sidebarOpen}
        setIsOpen={setSidebarOpen}
        isMobile={isMobile}
      />

      <div className="flex-1 flex flex-col">
        {/* Optional Topbar (currently removed in your code) */}

        {/* Mobile sidebar opener (since Topbar is commented out) */}
        {isMobile && !sidebarOpen && (
          <button
            onClick={() => setSidebarOpen(true)}
            aria-label="Open menu"
            className="fixed top-3 left-3 z-30 h-10 w-10 rounded-xl bg-white border border-slate-200 shadow-md grid place-items-center"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" strokeWidth="2" />
            </svg>
          </button>
        )}

        <main className="p-4 sm:p-6 md:p-10">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default StudentLayout;
