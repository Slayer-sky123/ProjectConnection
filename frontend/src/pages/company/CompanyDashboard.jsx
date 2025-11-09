import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../../api/axios";
import useSmartState from "../../hooks/useSmartState";

/** ========= Small inline helpers (no external utils) ========= */
const apiOrigin =
  (API.defaults.baseURL && new URL(API.defaults.baseURL).origin) ||
  (typeof window !== "undefined" ? window.location.origin : "");

const toAbsolute = (p) =>
  !p ? null : p.startsWith("http") ? p : `${apiOrigin}${p.startsWith("/") ? p : `/${p}`}`;

/** ========= Shell UI (kept as components) ========= */
import CompanyNavbar from "../../components/company/CompanyNavbar";
import CompanyTabs from "../../components/company/CompanyTabs";

/** ========= PAGES (migrated from components/* to pages/*) ========= */
import OverviewPage from "./OverviewPage";
import ProfilePage from "./ProfilePage";
import ScreeningPage from "./ScreeningPage";
import TalentPage from "./TalentPage";
import JobsPage from "./JobsPage";
import HackathonsPage from "./HackathonsPage";
import WebinarsPage from "./WebinarsPage";
import PartnershipsPage from "./PartnershipsPage";

/** ==================== PAGE ==================== */
export default function CompanyDashboard() {
  const navigate = useNavigate();

  // data
  const [profile, setProfile] = useState(null);
  const [skills, setSkills] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [webinars, setWebinars] = useState([]);
  const [hackathons, setHackathons] = useState([]);
  const [partnerships, setPartnerships] = useState([]);
  const [applications, setApplications] = useState([]);
  const [talent, setTalent] = useState([]);

  // ui
  const [activeTab, setActiveTab] = useSmartState("company.activeTab", "overview");
  const [loading, setLoading] = useState(true);
  const [mobileTabsOpen, setMobileTabsOpen] = useState(false);

  // search (talent)
  const [search, setSearch] = useSmartState("company.talent.search", { skillIds: [], minScore: 6 });

  const tabs = [
    { id: "overview", label: "Overview" },
    { id: "profile", label: "Profile" },
    { id: "screening", label: "Screening" },
    { id: "talent", label: "Talent" },
    { id: "jobs", label: "Jobs" },
    { id: "hackathons", label: "Hackathons" },
    { id: "webinars", label: "Webinars" },
    { id: "partnerships", label: "Partnerships" },
  ];

  const takeArray = (v) => {
    if (Array.isArray(v)) return v;
    if (!v || typeof v !== "object") return [];
    return (
      v.items || v.data || v.results || v.rows ||
      v.applications || v.jobs || v.webinars || v.hackathons || v.partnerships || []
    );
  };

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [p, s, j, w, h, pa, apps] = await Promise.all([
        API.get("/company/profile"),
        API.get("/admin/skills"),
        API.get("/company/jobs"),
        API.get("/company/webinars"),
        API.get("/company/hackathons"),
        API.get("/company/partnerships"),
        API.get("/company/applications"),
      ]);
      setProfile(p.data || null);
      setSkills(takeArray(s.data));
      setJobs(takeArray(j.data));
      setWebinars(takeArray(w.data));
      setHackathons(takeArray(h.data));
      setPartnerships(takeArray(pa.data));
      setApplications(takeArray(apps.data));
    } catch (e) {
      console.error("Load dashboard failed:", e?.response?.data || e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  const kpis = useMemo(() => {
    const openJobs = jobs.filter((j) => j.status === "open").length;
    const totalApps = applications.length;
    const upcomingWebinars = webinars.filter((w) => new Date(w.startsAt) > new Date()).length;
    const activePartnerships = partnerships.filter((p) => p.status === "active").length;
    return [
      { label: "Open Roles", value: openJobs, icon: null, tone: "blue" },
      { label: "Applications", value: totalApps, icon: null, tone: "indigo" },
      { label: "Upcoming Webinars", value: upcomingWebinars, icon: null, tone: "violet" },
      { label: "Active Partnerships", value: activePartnerships, icon: null, tone: "emerald" },
    ];
  }, [jobs, applications, webinars, partnerships]);

  /** ------- Profile save (logic intact) ------- */
  const saveProfile = async (formEvent) => {
    formEvent.preventDefault();
    const f = new FormData(formEvent.currentTarget);
    const body = {
      name: f.get("name"),
      website: f.get("website"),
      logoUrl: f.get("logoUrl"),
      description: f.get("description"),
      size: f.get("size"),
      locations: (f.get("locations") || "").split(",").map(v => v.trim()).filter(Boolean),
      domains: (f.get("domains") || "").split(",").map(v => v.trim()).filter(Boolean),
      contactEmail: f.get("contactEmail"),
      contactPhone: f.get("contactPhone"),
    };
    try {
      if (profile?._id) {
        const res = await API.put("/company/profile", body);
        setProfile(res.data);
      } else {
        try {
          const res = await API.post("/company/profile", body);
          setProfile(res.data);
        } catch (err) {
          if (err?.response?.status === 409) {
            const res2 = await API.put("/company/profile", body);
            setProfile(res2.data);
          } else {
            throw err;
          }
        }
      }
    } catch (err) {
      console.error("Save profile failed:", err?.response?.data || err.message);
      alert(err?.response?.data?.message || "Failed to save profile");
    }
  };

  /** ------- Applications (screening) ------- */
  const refreshApplications = async () => {
    const refreshed = await API.get("/company/applications");
    setApplications(Array.isArray(refreshed.data) ? refreshed.data : (refreshed.data?.items || refreshed.data?.data || []));
  };

  const updateAppStatus = async (id, status) => {
    try {
      await API.patch(`/company/applications/${id}`, { status });
      await refreshApplications();
    } catch (e) {
      console.error("Update application failed:", e?.response?.data || e.message);
    }
  };

  const aiScanOne = async (appId, setBusy) => {
    try {
      setBusy?.(true);
      await API.post(`/company/applications/${appId}/ai-screen`);
      await refreshApplications();
    } catch (e) {
      alert(e?.response?.data?.message || "AI scan failed");
    } finally {
      setBusy?.(false);
    }
  };

  const aiScanAll = async (setBusy) => {
    try {
      setBusy?.(true);
      for (const a of applications) {
        await API.post(`/company/applications/${a._id}/ai-screen`);
      }
      await refreshApplications();
    } catch (e) {
      alert(e?.response?.data?.message || "AI scan (all) failed");
    } finally {
      setBusy?.(false);
    }
  };

  /** ------- Talent search ------- */
  const runTalentSearch = async () => {
    try {
      const params = new URLSearchParams();
      (search.skillIds || []).forEach((id) => params.append("skillIds", id));
      params.append("minScore", search.minScore ?? 6);
      const res = await API.get(`/company/talent-search?${params.toString()}`);
      setTalent(res.data || []);
    } catch (e) {
      console.error("Talent search failed:", e?.response?.data || e.message);
    }
  };
  useEffect(() => { (search.skillIds?.length ? runTalentSearch() : setTalent([])); }, [search]); // eslint-disable-line

  /** ------- Jobs ------- */
  const createJob = async (payload) => { await API.post("/company/jobs", payload); await fetchAll(); };
  const updateJob = async (id, payload) => { await API.put(`/company/jobs/${id}`, payload); await fetchAll(); };
  const toggleJob = async (id) => { await API.patch(`/company/jobs/${id}/toggle`); await fetchAll(); };
  const deleteJob = async (id) => { await API.delete(`/company/jobs/${id}`); await fetchAll(); };

  /** ------- Hackathons ------- */
  const createHackathon = async (payload) => { await API.post("/company/hackathons", payload); await fetchAll(); };
  const setHackStatus = async (id, status) => { await API.patch(`/company/hackathons/${id}/status`, { status }); await fetchAll(); };
  const publishLeaderboard = async (id) => { await API.post(`/company/hackathons/${id}/publish-leaderboard`); alert("Leaderboard published"); };

  /** ------- Webinars ------- */
  const createWebinar = async (payload) => { await API.post("/company/webinars", payload); await fetchAll(); };

  /** ------- Partnerships ------- */
  const createPartnership = async (payload) => { await API.post("/company/partnerships", payload); await fetchAll(); };

  /** ------- Navbar actions ------- */
  const logout = () => {
    localStorage.removeItem("userToken");
    localStorage.removeItem("userRole");
    window.location.href = "/login";
  };

  return (
    <div
      className="min-h-screen"
      style={{
        background:
          "linear-gradient(180deg, rgba(26,85,227,0.06) 0%, rgba(93,110,237,0.05) 35%, rgba(13,202,240,0.05) 70%, rgba(0,210,132,0.05) 100%)",
      }}
    >
      {/* NAVBAR */}
      <CompanyNavbar
        profile={profile}
        mobileTabsOpen={mobileTabsOpen}
        onToggleMobileTabs={() => setMobileTabsOpen((s) => !s)}
        onLogout={logout}
      />

      {/* TABS */}
      <CompanyTabs
        tabs={tabs}
        activeTab={activeTab}
        onChange={(id) => { setActiveTab(id); setMobileTabsOpen(false); }}
        mobileOpen={mobileTabsOpen}
        primary="#1A55E3"
      />

      {/* BODY */}
      <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-6">
        {loading ? (
          <div className="bg-white/80 backdrop-blur rounded-2xl border border-slate-200/60 shadow-sm p-10 grid place-items-center text-gray-500">
            Loading dashboard…
          </div>
        ) : (
          <>
            {activeTab === "overview" && (
              <OverviewPage
                kpis={kpis}
                jobs={jobs}
                webinars={webinars}
                onGoJobs={() => setActiveTab("jobs")}
                primary="#1A55E3"
                accent="#FF0854"
              />
            )}

            {activeTab === "profile" && (
              <ProfilePage
                profile={profile}
                onSave={saveProfile}
                primary="#1A55E3"
              />
            )}

            {activeTab === "screening" && (
              <ScreeningPage
                applications={applications}
                updateAppStatus={updateAppStatus}
                aiScanOne={aiScanOne}
                aiScanAll={aiScanAll}
                toAbsolute={toAbsolute}
                onRefresh={refreshApplications}
                primary="#1A55E3"
              />
            )}

            {activeTab === "talent" && (
              <TalentPage
                skills={skills}
                search={search}
                setSearch={setSearch}
                results={talent}
                onRunSearch={runTalentSearch}
                primary="#1A55E3"
              />
            )}

            {activeTab === "jobs" && (
              <JobsPage
                skills={skills}
                jobs={jobs}
                createJob={createJob}
                updateJob={updateJob}
                deleteJob={deleteJob}
                toggleJob={toggleJob}
                primary="#1A55E3"
                accent="#FF0854"
              />
            )}

            {activeTab === "hackathons" && (
              <HackathonsPage
                skills={skills}
                hackathons={hackathons}
                createHackathon={createHackathon}
                setHackStatus={setHackStatus}
                publishLeaderboard={publishLeaderboard}
                primary="#1A55E3"
              />
            )}

            {activeTab === "webinars" && (
              <WebinarsPage
                webinars={webinars}
                createWebinar={createWebinar}
                primary="#1A55E3"
              />
            )}

            {activeTab === "partnerships" && (
              <PartnershipsPage
                partnerships={partnerships}
                createPartnership={createPartnership}
                primary="#1A55E3"
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}
