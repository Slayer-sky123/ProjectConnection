import CompanySidebar from "../components/company/CompanySidebar";
import CompanyTopbar from "../components/company/CompanyTopbar";

/** Fixed Sidebar + Topbar shell. Main area alone scrolls. */
export default function CompanyLayout({ children, profile }) {
  return (
    <div className="company-shell">
      {/* mobile scrim */}
      <div
        className="sidebar-scrim"
        onClick={() => document.documentElement.classList.remove("sidebar-open")}
      />
      <CompanySidebar profile={profile} />
      <div className="company-main">
        <CompanyTopbar profile={profile} />
        <div className="company-content">
          <div className="company-scroll">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
