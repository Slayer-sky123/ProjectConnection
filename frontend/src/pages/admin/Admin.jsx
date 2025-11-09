// src/pages/admin/Admin.jsx
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import API from "../../api/axios";

/* Existing sections */
import SkillManager from "../admin/SkillManager";
import SetManager from "../admin/SetManager";
import QuestionManager from "../admin/QuestionManager";
import SkillTestResults from "../admin/SkillTestResults";
import UsersAdmin from "../admin/Users";

/* Assessments split */
import AssessmentsSkill from "./AssessmentsSkill";
import AssessmentsAptitude from "./AssessmentsAptitude";

/* Icons for inner components only */
import {
  Briefcase, ClipboardList, Video, Trophy, Handshake,
  Loader2, Pencil, Trash2, RefreshCcw, Upload, BarChart3
} from "lucide-react";

/* Sidebar extracted */
import AdminSidebar from "./AdminSidebar";

/** Palette */
const COLORS = {
  brand: "#F29F67",
  ink: "#1E1E2C",
};

const apiOrigin =
  (API?.defaults?.baseURL && new URL(API.defaults.baseURL).origin) ||
  window.location.origin;

const toAbsolute = (p) =>
  !p ? null : p.startsWith("http") ? p : `${apiOrigin}${p.startsWith("/") ? p : `/${p}`}`;

/* ---------------------- Analytics (unchanged endpoints) ---------------------- */
function AdminAnalytics() {
  const [loading, setLoading] = useState(true);
  const [jobs, setJobs] = useState([]);
  const [apps, setApps] = useState([]);
  const [webinars, setWebinars] = useState([]);
  const [hackathons, setHackathons] = useState([]);
  const [partnerships, setPartnerships] = useState([]);
  const [results, setResults] = useState([]);
  const [errMsg, setErrMsg] = useState("");

  const load = async () => {
    setLoading(true);
    setErrMsg("");
    try {
      const [j, a, w, h, p, r] = await Promise.all([
        API.get("/company/jobs"),
        API.get("/company/applications"),
        API.get("/company/webinars"),
        API.get("/company/hackathons"),
        API.get("/company/partnerships"),
        API.get("/admin/skill-test-results"),
      ]);
      setJobs(j.data?.items || j.data || []);
      setApps(a.data?.items || a.data || []);
      setWebinars(w.data?.items || w.data || []);
      setHackathons(h.data?.items || h.data || []);
      setPartnerships(p.data?.items || p.data || []);
      setResults(r.data || []);
    } catch (e) {
      setErrMsg(e?.response?.data?.message || e.message || "Failed to load analytics");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, []);

  const cards = useMemo(() => ([
    { label: "Open Jobs", value: jobs.filter((j) => j.status === "open").length, icon: <Briefcase size={18} /> },
    { label: "Applications", value: apps.length, icon: <ClipboardList size={18} /> },
    { label: "Upcoming Webinars", value: webinars.filter((w) => new Date(w.startsAt) > new Date()).length, icon: <Video size={18} /> },
    { label: "Live Hackathons", value: hackathons.filter((h) => h.status === "live").length, icon: <Trophy size={18} /> },
    { label: "Partnerships", value: partnerships.length, icon: <Handshake size={18} /> },
    { label: "Skill Tests Recorded", value: results.length, icon: <BarChart3 size={18} /> },
  ]), [jobs, apps, webinars, hackathons, partnerships, results]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold" style={{ color: COLORS.ink }}>Admin Analytics</h2>
        <button onClick={load} className="px-3 py-2 rounded-lg border text-sm flex items-center gap-2">
          <RefreshCcw size={16} /> Refresh
        </button>
        {errMsg && <div className="text-sm text-red-600">{errMsg}</div>}
      </div>

      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="p-5 border rounded-2xl bg-white/70">
              <div className="h-4 w-24 bg-slate-200 rounded mb-3" />
              <div className="h-8 w-16 bg-slate-200 rounded" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {cards.map((c) => (
            <div key={c.label} className="p-5 border rounded-2xl bg-white/80 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-500">{c.label}</p>
                  <p className="text-2xl font-semibold mt-1">{c.value}</p>
                </div>
                <div className="h-10 w-10 rounded-xl grid place-items-center bg-indigo-50 text-indigo-700 border border-indigo-200">
                  {c.icon}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ---------------------- Jobs Manager (unchanged endpoints) ---------------------- */
function JobsManager() {
  const [skills, setSkills] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const [s, j] = await Promise.all([API.get("/admin/skills"), API.get("/company/jobs")]);
      setSkills(s.data || []);
      setJobs(j.data?.items || j.data || []);
    } catch (e) {
      console.error("JobsManager load failed:", e?.response?.data || e.message);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, []);

  const toggle = async (id) => {
    try { await API.patch(`/company/jobs/${id}/toggle`); await load(); }
    catch (e) { alert(e?.response?.data?.message || "Toggle failed"); }
  };

  const del = async (id) => {
    if (!window.confirm("Delete this job posting?")) return;
    try { await API.delete(`/company/jobs/${id}`); load(); }
    catch (e) { alert(e?.response?.data?.message || "Delete failed"); }
  };

  const saveEdit = async (e) => {
    e.preventDefault();
    if (!editing?._id) return;
    try {
      const p = {
        title: editing.title,
        type: editing.type,
        location: editing.location,
        description: editing.description,
        minScore: Number(editing.minScore || 0),
        isFeatured: !!editing.isFeatured,
        status: editing.status,
        skills: editing.skills,
      };
      await API.put(`/company/jobs/${editing._id}`, p);
      setEditing(null);
      await load();
    } catch (e2) {
      alert(e2?.response?.data?.message || "Update job failed");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold" style={{ color: COLORS.ink }}>All Jobs</h3>
        <button onClick={load} className="px-3 py-2 rounded-lg border text-sm flex items-center gap-2">
          <RefreshCcw size={16} /> Refresh
        </button>
      </div>

      {loading ? (
        <div className="text-gray-500 flex items-center gap-2">
          <Loader2 className="animate-spin" />
          <span>Loading jobs…</span>
        </div>
      ) : jobs.length === 0 ? (
        <p className="text-sm text-gray-500">No jobs found.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm overflow-hidden rounded-2xl border border-slate-200">
            <thead className="bg-slate-50/80">
              <tr>
                <th className="p-3 text-left">Title</th>
                <th className="p-3">Type</th>
                <th className="p-3">Status</th>
                <th className="p-3">Skills</th>
                <th className="p-3">MinScore</th>
                <th className="p-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {jobs.map((j) => (
                <tr key={j._id} className="border-b">
                  <td className="p-3">{j.title}</td>
                  <td className="p-3 text-center">{j.type}</td>
                  <td className="p-3 text-center">{j.status}</td>
                  <td className="p-3">
                    {(j.skills || []).map((s) => (typeof s === "string" ? s : s.name)).join(", ")}
                  </td>
                  <td className="p-3 text-center">{j.minScore}</td>
                  <td className="p-3">
                    <div className="flex items-center gap-3 justify-center">
                      <button
                        onClick={() =>
                          setEditing({
                            _id: j._id,
                            title: j.title || "",
                            type: j.type || "job",
                            location: j.location || "",
                            description: j.description || "",
                            minScore: j.minScore ?? 0,
                            isFeatured: !!j.isFeatured,
                            status: j.status || "open",
                            skills: (j.skills || []).map((s) => (typeof s === "string" ? s : s._id)),
                          })
                        }
                        className="text-blue-700 hover:underline flex items-center gap-1"
                      >
                        <Pencil size={16} /> Edit
                      </button>
                      <button onClick={() => toggle(j._id)} className="text-indigo-700 hover:underline">
                        {j.status === "open" ? "Close" : "Open"}
                      </button>
                      <button onClick={() => del(j._id)} className="text-rose-700 hover:underline flex items-center gap-1">
                        <Trash2 size={16} /> Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {editing && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white/90 backdrop-blur w-full max-w-2xl rounded-2xl shadow-xl p-6 border border-slate-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Edit Job</h3>
              <button onClick={() => setEditing(null)} className="text-gray-500 hover:text-gray-700">×</button>
            </div>

            <form onSubmit={saveEdit} className="grid md:grid-cols-2 gap-4">
              <input value={editing.title} onChange={(e) => setEditing((j) => ({ ...j, title: e.target.value }))} required placeholder="Title" className="border rounded-xl px-3 py-2 bg-white/70" />
              <select value={editing.type} onChange={(e) => setEditing((j) => ({ ...j, type: e.target.value }))} className="border rounded-xl px-3 py-2 bg-white/70">
                <option value="job">Job</option>
                <option value="internship">Internship</option>
              </select>
              <input value={editing.location} onChange={(e) => setEditing((j) => ({ ...j, location: e.target.value }))} placeholder="Location (Remote / City)" className="border rounded-xl px-3 py-2 bg-white/70" />
              <input type="number" min="0" max="10" step="0.1" value={editing.minScore} onChange={(e) => setEditing((j) => ({ ...j, minScore: e.target.value }))} placeholder="Min test score (0-10)" className="border rounded-xl px-3 py-2 bg-white/70" />
              <div className="md:col-span-2">
                <textarea value={editing.description} onChange={(e) => setEditing((j) => ({ ...j, description: e.target.value }))} placeholder="Role description" className="w-full border rounded-xl px-3 py-2 bg-white/70" />
              </div>
              <div className="md:col-span-2">
                <p className="text-xs text-gray-500 mb-1">Required skills</p>
                <div className="flex flex-wrap gap-3">
                  {skills.map((sk) => {
                    const checked = editing.skills.includes(sk._id);
                    return (
                      <label key={sk._id} className="text-sm flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() =>
                            setEditing((prev) => {
                              const exists = prev.skills.includes(sk._id);
                              return {
                                ...prev,
                                skills: exists
                                  ? prev.skills.filter((x) => x !== sk._id)
                                  : [...prev.skills, sk._id],
                              };
                            })
                          }
                        />
                        {sk.name}
                      </label>
                    );
                  })}
                </div>
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={editing.isFeatured} onChange={(e) => setEditing((j) => ({ ...j, isFeatured: e.target.checked }))} />
                Featured listing
              </label>
              <select value={editing.status} onChange={(e) => setEditing((j) => ({ ...j, status: e.target.value }))} className="border rounded-xl px-3 py-2 bg-white/70">
                <option value="open">Open</option>
                <option value="closed">Closed</option>
                <option value="paused">Paused</option>
              </select>
              <div className="md:col-span-2 flex items-center gap-3 pt-2">
                <button type="button" onClick={() => setEditing(null)} className="px-4 py-2 rounded-lg border">Cancel</button>
                <button type="submit" className="px-4 py-2 rounded-lg bg-blue-600 text-white">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

/* -------------------------- Simple lists (unchanged) -------------------------- */
function SimpleListManager({ title, endpoint, columns, rowRender }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const load = async () => {
    setLoading(true);
    try {
      const res = await API.get(endpoint);
      setRows(res.data?.items || res.data || []);
    } catch (e) {
      console.error(`${title} load failed:`, e?.response?.data || e.message);
      setRows([]);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, [endpoint]);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold" style={{ color: COLORS.ink }}>{title}</h3>
        <button onClick={load} className="px-3 py-2 rounded-lg border text-sm flex items-center gap-2">
          <RefreshCcw size={16} /> Refresh
        </button>
      </div>
      {loading ? (
        <div className="text-gray-500 flex items-center gap-2">
          <Loader2 className="animate-spin" />
          <span>Loading…</span>
        </div>
      ) : rows.length === 0 ? (
        <p className="text-sm text-gray-500">No data.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm overflow-hidden rounded-2xl border border-slate-200">
            <thead className="bg-slate-50/80">
              <tr>{columns.map((c) => <th key={c} className="p-3 text-left">{c}</th>)}</tr>
            </thead>
            <tbody>{rows.map((r) => rowRender(r, load))}</tbody>
          </table>
        </div>
      )}
    </div>
  );
}
function WebinarsManager() {
  return (
    <SimpleListManager
      title="Webinars"
      endpoint="/company/webinars"
      columns={["Title", "When", "Room", "Actions"]}
      rowRender={(w, reload) => (
        <tr key={w._id} className="border-b">
          <td className="p-3">{w.title}</td>
          <td className="p-3">{new Date(w.startsAt).toLocaleString()} • {w.durationMins}m</td>
          <td className="p-3">{w.roomId || "—"}</td>
          <td className="p-3">
            <div className="flex gap-3">
              <Link to={`/company/webinar/${w.roomId}`} className="text-indigo-700 underline text-sm">Open Studio</Link>
              <button onClick={async () => { await API.delete(`/company/webinars/${w._id}`); reload(); }} className="text-rose-600 text-sm underline">Delete</button>
            </div>
          </td>
        </tr>
      )}
    />
  );
}
function HackathonsManager() {
  return (
    <SimpleListManager
      title="Hackathons"
      endpoint="/company/hackathons"
      columns={["Title", "Window", "Status", "Actions"]}
      rowRender={(h, reload) => (
        <tr key={h._id} className="border-b">
          <td className="p-3">{h.title}</td>
          <td className="p-3">{new Date(h.startAt).toLocaleString()} → {new Date(h.endAt).toLocaleString()}</td>
          <td className="p-3">{h.status}</td>
          <td className="p-3">
            <div className="flex gap-3">
              <select
                value={h.status || "upcoming"}
                onChange={async (e) => { await API.patch(`/company/hackathons/${h._id}/status`, { status: e.target.value }); reload(); }}
                className="border rounded px-2 py-1 text-sm"
              >
                <option value="upcoming">Upcoming</option>
                <option value="live">Live</option>
                <option value="ended">Ended</option>
              </select>
              <button onClick={async () => { await API.delete(`/company/hackathons/${h._id}`); reload(); }} className="text-rose-600 text-sm underline">Delete</button>
            </div>
          </td>
        </tr>
      )}
    />
  );
}
function PartnershipsManager() {
  return (
    <SimpleListManager
      title="University Partnerships"
      endpoint="/company/partnerships"
      columns={["Title", "University", "Status", "Actions"]}
      rowRender={(p, reload) => (
        <tr key={p._id} className="border-b">
          <td className="p-3">{p.title}</td>
          <td className="p-3">{p.university}</td>
          <td className="p-3">{p.status}</td>
          <td className="p-3">
            <div className="flex gap-3">
              <select
                value={p.status || "proposal"}
                onChange={async (e) => { await API.put(`/company/partnerships/${p._id}`, { ...p, status: e.target.value }); reload(); }}
                className="border rounded px-2 py-1 text-sm"
              >
                <option value="proposal">Proposal</option>
                <option value="active">Active</option>
                <option value="completed">Completed</option>
              </select>
              <button onClick={async () => { await API.delete(`/company/partnerships/${p._id}`); reload(); }} className="text-rose-600 text-sm underline">Delete</button>
            </div>
          </td>
        </tr>
      )}
    />
  );
}

/* ------------------------------- Bulk Import CSV ------------------------------- */
function BulkImportExport() {
  const [type, setType] = useState("skills");
  const [file, setFile] = useState(null);
  const [busy, setBusy] = useState(false);
  const [log, setLog] = useState([]);

  const append = (line) => setLog((l) => [...l, line]);

  const parseSimpleCSV = async (f) => {
    const text = await f.text();
    const rows = text
      .split(/\r?\n/)
      .map((r) => r.trim())
      .filter(Boolean)
      .map((r) => r.split(",").map((c) => c.trim()));
    if (rows.length && rows[0].some((c) => /name|title|question|skill/i.test(c))) rows.shift();
    return rows;
  };

  const importNow = async () => {
    if (!file) return alert("Choose a CSV file");
    setBusy(true);
    setLog([]);
    try {
      const rows = await parseSimpleCSV(file);
      append(`Parsed ${rows.length} rows`);

      if (type === "skills") {
        for (const [name] of rows) {
          if (!name) continue;
          try { await API.post("/admin/skills", { name }); append(`✓ Skill: ${name}`); }
          catch (e) { append(`× Skill: ${name} — ${e?.response?.data?.message || e.message}`); }
        }
      } else if (type === "sets") {
        for (const [title, skill] of rows) {
          if (!title || !skill) { append("× Set: missing title or skillId"); continue; }
          try { await API.post("/admin/question-sets", { title, skill, description: "" }); append(`✓ Set: ${title}`); }
          catch (e) { append(`× Set: ${title} — ${e?.response?.data?.message || e.message}`); }
        }
      } else if (type === "questions") {
        append("Use Assessments > Skill/Aptitude pages to import/export questions.");
      } else if (type === "results") {
        append("Import for results is not supported.");
      }

      append("Done.");
    } catch (e) {
      append(`× Import error: ${e.message}`);
    } finally {
      setBusy(false);
    }
  };

  const exportCSV = async () => {
    try {
      let rows = [];
      if (type === "skills") {
        const res = await API.get("/admin/skills");
        rows = (res.data || []).map((s) => [s._id, s.name]);
      } else if (type === "sets") {
        const res = await API.get("/admin/question-sets");
        rows = (res.data || []).map((s) => [s._id, s.title, s.skill?._id || s.skill || ""]);
      } else if (type === "results") {
        const res = await API.get("/admin/skill-test-results");
        rows = (res.data || []).map((r) => [
          r.user?.name || "",
          r.user?.email || "",
          r.skill?.name || "",
          r.score,
          r.total,
          new Date(r.createdAt).toLocaleString(),
        ]);
      } else {
        alert("Export for 'questions' is available inside the Assessments pages.");
        return;
      }
      const csv = rows.map((r) => r.map((c) => String(c).replace(/,/g, " ")).join(",")).join("\n");
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = `${type}.csv`; a.click(); URL.revokeObjectURL(url);
    } catch (e) {
      alert(e?.response?.data?.message || e.message || "Export failed");
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="text-xl font-semibold" style={{ color: COLORS.ink }}>Bulk Import / Export (CSV)</h3>
      <div className="flex flex-wrap items-center gap-3">
        <select value={type} onChange={(e) => setType(e.target.value)} className="border rounded-lg px-3 py-2">
          <option value="skills">Skills</option>
          <option value="sets">Question Sets</option>
          <option value="questions">Questions</option>
          <option value="results">Skill Test Results</option>
        </select>
        <label className="flex items-center gap-2 text-sm">
          <input type="file" accept=".csv" onChange={(e) => setFile(e.target.files?.[0] || null)} />
          {file?.name && <span className="text-gray-600">{file.name}</span>}
        </label>
        <button disabled={busy} onClick={importNow} className="px-3 py-2 rounded-lg bg-blue-600 text-white flex items-center gap-2">
          {busy ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />} Import
        </button>
        <button onClick={exportCSV} className="px-3 py-2 rounded-lg border flex items-center gap-2">
          <Upload size={16} /> Export
        </button>
      </div>

      <div className="border rounded-lg p-3 bg-gray-50 text-xs max-h-48 overflow-auto">
        {log.length === 0 ? <div className="text-gray-500">No logs yet.</div> : log.map((l, i) => <div key={i}>{l}</div>)}
      </div>
    </div>
  );
}

/* --------------------------------- Main Layout --------------------------------- */
export default function Admin() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("analytics");

  useEffect(() => {
    if (!localStorage.getItem("adminToken")) navigate("/admin/login", { replace: true });
  }, [navigate]);

  const adminEmail =
    localStorage.getItem("adminEmail") ||
    (() => {
      try {
        const u = JSON.parse(localStorage.getItem("adminUser") || "{}");
        return u.email || "";
      } catch { return ""; }
    })();

  const logout = () => {
    localStorage.removeItem("adminToken");
    localStorage.removeItem("adminUser");
    localStorage.removeItem("adminEmail");
    navigate("/admin/login", { replace: true });
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <AdminSidebar
        active={activeTab}
        onChange={setActiveTab}
        adminEmail={adminEmail}
        onLogout={logout}
      />

      {/* Canvas */}
      <main className="flex-1 p-6 overflow-y-auto">
        {activeTab === "analytics" && <AdminAnalytics />}

        {activeTab === "jobs" && <JobsManager />}
        {activeTab === "applications" && <ApplicationsManager />}
        {activeTab === "webinars" && <WebinarsManager />}
        {activeTab === "hackathons" && <HackathonsManager />}
        {activeTab === "partnerships" && <PartnershipsManager />}

        {/* Assessments split */}
        {activeTab === "assessments-skill" && <AssessmentsSkill />}
        {activeTab === "assessments-aptitude" && <AssessmentsAptitude />}

        {/* Legacy managers kept intact */}
        {activeTab === "skills" && <SkillManager />}
        {activeTab === "sets" && <SetManager />}
        {activeTab === "questions" && <QuestionManager />}

        {activeTab === "results" && <SkillTestResults />}
        {activeTab === "users" && <UsersAdmin />}
        {activeTab === "bulk" && <BulkImportExport />}
      </main>
    </div>
  );
}

/* ---------------------- Applications Manager (unchanged) ---------------------- */
function ApplicationsManager() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const res = await API.get("/company/applications");
      setApplications(res.data?.applications || res.data || []);
    } catch (e) {
      console.error("Applications load failed:", e?.response?.data || e.message);
      setApplications([]);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, []);

  const update = async (id, status) => {
    try { await API.patch(`/company/applications/${id}`, { status }); await load(); }
    catch (e) { alert(e?.response?.data?.message || "Update failed"); }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold" style={{ color: COLORS.ink }}>Candidate Applications</h3>
        <button onClick={load} className="px-3 py-2 rounded-lg border text-sm flex items-center gap-2">
          <RefreshCcw size={16} /> Refresh
        </button>
      </div>

      {loading ? (
        <div className="text-gray-500 flex items-center gap-2">
          <Loader2 className="animate-spin" />
          <span>Loading applications…</span>
        </div>
      ) : applications.length === 0 ? (
        <p className="text-sm text-gray-500">No applications yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm overflow-hidden rounded-2xl border border-slate-200">
            <thead className="bg-slate-50/80">
              <tr>
                <th className="p-3 text-left">Candidate</th>
                <th className="p-3">Job</th>
                <th className="p-3">Resume</th>
                <th className="p-3">ResumeScore</th>
                <th className="p-3">TestScore</th>
                <th className="p-3">Fit</th>
                <th className="p-3">Status</th>
                <th className="p-3">Interview</th>
                <th className="p-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {applications.map((a) => {
                const iv = a.interview;
                const windowText = iv?.startsAt
                  ? `${new Date(iv.startsAt).toLocaleString()} • ${iv.durationMins || 45}m (${iv.stage || "screening"})`
                  : "—";
                return (
                  <tr key={a._id} className="border-b">
                    <td className="p-3">
                      {a.student?.name}{" "}
                      <span className="text-gray-400">({a.student?.email})</span>
                    </td>
                    <td className="p-3 text-center">{a.job?.title}</td>
                    <td className="p-3 text-center">
                      {a.cvUrl ? (
                        <a className="text-blue-700 underline" href={toAbsolute(a.cvUrl)} target="_blank" rel="noreferrer" download>
                          Resume
                        </a>
                      ) : "-"}
                    </td>
                    <td className="p-3 text-center">{a.screening?.resumeScore ?? "—"}</td>
                    <td className="p-3 text-center">
                      {a.screening?.testScore != null
                        ? Math.round(a.screening.testScore * 10) / 10
                        : "—"}
                    </td>
                    <td className="p-3 text-center font-semibold">{a.screening?.fitScore ?? "—"}</td>
                    <td className="p-3 text-center">{a.status}</td>
                    <td className="p-3 text-center">
                      <div className="text-xs">{windowText}</div>
                      {iv?.roomId && (
                        <div className="flex items-center justify-center gap-3 mt-1">
                          <Link to={`/company/webinar/${iv.roomId}`} className="text-indigo-700 underline text-xs">Join (Host)</Link>
                          <Link to={`/student/webinar/${iv.roomId}`} className="text-blue-700 underline text-xs">Join (Viewer)</Link>
                        </div>
                      )}
                    </td>
                    <td className="p-3">
                      <div className="flex gap-3 justify-center">
                        <button onClick={() => update(a._id, "shortlisted")} className="text-blue-700 hover:underline">Shortlist</button>
                        <button onClick={() => update(a._id, "offer")} className="text-emerald-700 hover:underline">Offer</button>
                        <button onClick={() => update(a._id, "rejected")} className="text-rose-700 hover:underline">Reject</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
