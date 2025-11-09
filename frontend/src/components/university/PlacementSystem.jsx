// src/components/university/PlacementSystem.jsx
import { useEffect, useMemo, useState } from "react";
import { getPlacements, getTopStudents, getPredictivePlacements } from "../../api/university";
import { Search, Sparkles, Send, LineChart, Loader2, Building2, UserRoundCheck } from "lucide-react";
import { useParams } from "react-router-dom";

const LIGHT = "#b1d4e0";
const DARK = "#0c2d48";
const PRIMARY = "#145da0";

export default function PlacementSystem() {
  const { username } = useParams();
  const [q, setQ] = useState("");
  const [data, setData] = useState({ applications: [], topStudents: [] });
  const [ai, setAi] = useState({ roles: [], matches: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const [applicationsRaw, topStudentsRaw, predictions] = await Promise.all([
          getPlacements(username),
          getTopStudents(username),
          getPredictivePlacements(username),
        ]);

        const applications = Array.isArray(applicationsRaw) ? applicationsRaw : [];
        const topStudents = Array.isArray(topStudentsRaw) ? topStudentsRaw : [];

        // Normalize predictions into { roles, matches }
        let roles = [];
        let matches = [];
        if (predictions && Array.isArray(predictions.matches)) {
          matches = predictions.matches;                // already in expected shape
          roles = Array.isArray(predictions.roles) ? predictions.roles : [];
        } else if (predictions && Array.isArray(predictions.topCandidates)) {
          matches = predictions.topCandidates.map(c => ({
            studentId: c.id,
            name: c.name,
            primarySkillName: c.skill || c.primarySkillName || "",
            probability: Math.round((Number(c.probability || 0)) * 100) // if server returns 0..1
          }));
          roles = []; // derive below
        } else {
          // Unknown shape; keep empty & derive everything client-side
          matches = [];
          roles = [];
        }

        // Derive roles distribution from applications if roles not supplied
        if (!roles?.length && applications.length) {
          const roleMap = new Map();
          applications.forEach(a => {
            const r = String(a?.role || "").trim() || "Other";
            roleMap.set(r, (roleMap.get(r) || 0) + 1);
          });
          const total = Array.from(roleMap.values()).reduce((a,b)=>a+b,0) || 1;
          roles = Array.from(roleMap.entries())
            .map(([role, count]) => ({ role, probability: Math.round((count / total) * 100) }))
            .sort((a,b)=>b.probability - a.probability)
            .slice(0, 6);
        }

        setData({ applications, topStudents });
        setAi({ roles, matches });
      } catch {
        setData({ applications: [], topStudents: [] });
        setAi({ roles: [], matches: [] });
      } finally {
        setLoading(false);
      }
    })();
  }, [username]);

  const filtered = useMemo(() => {
    const t = q.toLowerCase();
    const apps = Array.isArray(data.applications) ? data.applications : [];
    return apps.filter((a) =>
      [a.student, a.company, a.role, a.status].filter(Boolean).join(" ").toLowerCase().includes(t)
    );
  }, [q, data.applications]);

  const appsKpi = useMemo(() => {
    const rows = Array.isArray(data.applications) ? data.applications : [];
    const total = rows.length;
    const hired = rows.filter(a => String(a.status || "").toLowerCase() === "hired").length;
    const interns = rows.filter(a => (a.status || "").toLowerCase().includes("intern")).length;
    const companies = new Set(rows.map(a => a.company).filter(Boolean)).size;
    return { total, hired, interns, companies };
  }, [data.applications]);

  const onRecommend = (studentId) => {
    alert("Recommended to recruiters!");
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl p-6 shadow-sm border" style={{ borderColor: LIGHT }}>
        <h2 className="text-lg font-bold mb-3" style={{ color: DARK }}>Internship & Placement Management</h2>

        {/* Apps KPIs */}
        <div className="grid sm:grid-cols-4 gap-3 mb-4">
          <Kpi label="Total Applications" value={appsKpi.total} icon={ClipboardIcon} />
          <Kpi label="Hired" value={appsKpi.hired} icon={UserRoundCheck} />
          <Kpi label="Internship Pipeline" value={appsKpi.interns} icon={LineChart} />
          <Kpi label="Companies" value={appsKpi.companies} icon={Building2} />
        </div>

        {/* Search */}
        <div className="flex items-center gap-2 rounded-lg p-2" style={{ background: "#b1d4e01a" }}>
          <Search className="w-4 h-4 text-gray-600" />
          <input
            className="bg-transparent flex-1 outline-none text-sm"
            placeholder="Search applications by student, company, role, status…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>

        {/* Table */}
        <div className="mt-4 border rounded-xl overflow-hidden" style={{ borderColor: LIGHT }}>
          {loading ? (
            <div className="p-6 text-sm text-gray-600 flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" /> Loading…
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-6 text-sm text-gray-500">No matching applications.</div>
          ) : (
            <div className="overflow-auto">
              <table className="w-full text-sm">
                <thead style={{ background: "#b1d4e01a", color: DARK }}>
                  <tr>
                    <th className="text-left px-4 py-3">Student</th>
                    <th className="text-left px-4 py-3">Company</th>
                    <th className="text-left px-4 py-3">Role</th>
                    <th className="text-left px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((a) => (
                    <tr key={a.id} className="border-t" style={{ borderColor: LIGHT }}>
                      <td className="px-4 py-3">{a.student}</td>
                      <td className="px-4 py-3">{a.company}</td>
                      <td className="px-4 py-3">{a.role}</td>
                      <td className="px-4 py-3">
                        <span className="text-xs px-2 py-1 rounded-full"
                              style={{ background: "#b1d4e033", color: DARK, border: "1px solid #b1d4e0" }}>
                          {a.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Predictions */}
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-sm border" style={{ borderColor: LIGHT }}>
          <h3 className="text-base font-semibold flex items-center gap-2 mb-3" style={{ color: DARK }}>
            <LineChart className="w-4 h-4" style={{ color: PRIMARY }} />
            AI Role Demand Prediction
          </h3>
          <div className="space-y-2">
            {(ai.roles || []).map(r => (
              <div key={r.role} className="border rounded-lg p-3" style={{ borderColor: LIGHT }}>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="font-medium" style={{ color: DARK }}>{r.role}</span>
                  <span className="text-gray-600">{Math.min(100, Math.max(0, Number(r.probability) || 0))}%</span>
                </div>
                <div className="h-2 rounded bg-[#b1d4e033]">
                  <div className="h-2 rounded" style={{ width: `${Math.min(100, Math.max(0, Number(r.probability) || 0))}%`, backgroundColor: PRIMARY }} />
                </div>
              </div>
            ))}
            {(!ai.roles || ai.roles.length === 0) && <p className="text-sm text-gray-500">No predictions yet.</p>}
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border lg:col-span-2" style={{ borderColor: LIGHT }}>
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold flex items-center gap-2" style={{ color: DARK }}>
              <Sparkles className="w-4 h-4" style={{ color: PRIMARY }} />
              Top Predicted Matches
            </h3>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-2 gap-4 mt-4">
            {(ai.matches || []).map((s) => (
              <div key={s.studentId || s.name} className="border rounded-xl p-4 hover:shadow-sm" style={{ borderColor: LIGHT }}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium" style={{ color: DARK }}>{s.name}</p>
                    <p className="text-xs text-gray-600">Primary: {s.primarySkillName || "—"}</p>
                  </div>
                  <span className="text-xs px-2 py-1 rounded-full"
                        style={{ background: "#b1d4e033", color: DARK, border: "1px solid #b1d4e0" }}>
                    {Number.isFinite(s.probability) ? `${s.probability}%` : "—"}
                  </span>
                </div>
                <button
                  onClick={() => onRecommend(s.studentId)}
                  className="mt-3 inline-flex items-center gap-2 text-sm text-white px-3 py-2 rounded-lg"
                  style={{ backgroundColor: PRIMARY }}
                >
                  <Send className="w-4 h-4" /> Recommend to Recruiters
                </button>
              </div>
            ))}
            {(!ai.matches || ai.matches.length === 0) && <p className="text-sm text-gray-500">No AI matches yet.</p>}
          </div>
        </div>
      </div>
    </div>
  );
}

function Kpi({ label, value, icon: Icon }) {
  return (
    <div className="p-4 rounded-xl shadow-sm border bg-white flex items-center gap-3" style={{ borderColor: LIGHT }}>
      <Icon className="w-4 h-4" style={{ color: PRIMARY }} />
      <div>
        <div className="text-xs text-gray-600">{label}</div>
        <div className="text-lg font-semibold" style={{ color: DARK }}>{value}</div>
      </div>
    </div>
  );
}

function ClipboardIcon(props) {
  return <svg viewBox="0 0 24 24" width="16" height="16" {...props}><path fill="currentColor" d="M9 2h6a2 2 0 0 1 2 2h1a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h1a2 2 0 0 1 2-2Zm0 2v2h6V4H9Z"/></svg>;
}
