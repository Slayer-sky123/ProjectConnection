import { useEffect, useState, useMemo } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Gauge, ListChecks, Trophy, Download } from "lucide-react";
import API from "../../api/axios";
import Sparkline from "../../components/company/charts/Sparkline";

const card = "rounded-2xl border bg-white/90 backdrop-blur shadow-sm";

export default function ApplicationResults() {
  const { id } = useParams(); // applicationId
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [data, setData] = useState(null);

  const load = async () => {
    setLoading(true);
    setErr("");
    try {
      const res = await API.get(`/company/applications/${id}/results`);
      setData(res.data || null);
    } catch (e) {
      setErr(e?.response?.data?.message || "Failed to load results");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [id]);

  const app = data?.application;
  const tests = data?.tests || [];
  const recruiter = data?.recruiterTests || [];
  const summaries = data?.summaries || {};
  const timelines = data?.timelines || {};

  const overall = useMemo(() => {
    const pieces = [
      Number(summaries.avgSkillScore || 0),
      Number(summaries.avgAptitudeScore || 0),
      Number(app?.screening?.fitScore || 0) / 10,
    ].filter(Boolean);
    if (!pieces.length) return null;
    const avg10 = Math.round((pieces.reduce((a, b) => a + b, 0) / pieces.length) * 10) / 10;
    return avg10;
  }, [summaries, app]);

  const goBack = () => {
    // try browser back; fallback to screening
    if (window.history.length > 1) navigate(-1);
    else navigate("/company/screening");
  };

  if (loading) return <div className="p-6 text-sm text-slate-600">Loading results…</div>;
  if (err) return <div className="p-6 text-sm text-rose-600">{err}</div>;
  if (!data) return <div className="p-6 text-sm text-slate-600">No results yet.</div>;

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <button onClick={goBack} className="inline-flex items-center gap-2 text-slate-700 hover:text-slate-900">
          <ArrowLeft size={16} /> Back to Screening
        </button>
        <div className="text-sm text-slate-500">
          Application ID: <span className="font-mono">{app?._id}</span>
        </div>
      </div>

      {/* Header */}
      <div className={`${card} p-5`}>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <div className="text-xs text-slate-500">Candidate</div>
            <div className="text-lg font-semibold leading-tight">{app?.student?.name}</div>
            <div className="text-xs text-slate-600">{app?.student?.email}</div>
          </div>
          <div>
            <div className="text-xs text-slate-500">Job</div>
            <div className="font-medium">{app?.job?.title}</div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <Kpi label="Resume Score" value={app?.screening?.resumeScore} max={100} />
            <Kpi label="Fit Score" value={app?.screening?.fitScore} max={100} />
            <Kpi label="Overall (≈10)" value={overall} max={10} />
          </div>
        </div>
      </div>

      {/* Timelines */}
      <div className="grid md:grid-cols-2 gap-4">
        <div className={`${card} p-4`}>
          <div className="flex items-center justify-between mb-2">
            <div className="font-semibold">Skill Score Trend</div>
            <Gauge size={18} className="text-slate-500" />
          </div>
          <Sparkline label="Skill" color="#3b82f6" data={timelines.skillTimeline || []} />
        </div>
        <div className={`${card} p-4`}>
          <div className="flex items-center justify-between mb-2">
            <div className="font-semibold">Aptitude Score Trend</div>
            <Gauge size={18} className="text-slate-500" />
          </div>
          <Sparkline label="Aptitude" color="#10b981" data={timelines.aptitudeTimeline || []} />
        </div>
      </div>

      {/* Test Assignments */}
      <div className={`${card} p-4`}>
        <div className="flex items-center justify-between mb-3">
          <div className="font-semibold">Assigned Tests</div>
          <div className="text-xs text-slate-500">{tests.length} item(s)</div>
        </div>
        {tests.length === 0 ? (
          <div className="text-sm text-slate-500">No tests assigned.</div>
        ) : (
          <div className="grid md:grid-cols-2 gap-3">
            {tests.map((t) => (
              <div key={t._id} className="rounded-xl border bg-white p-3 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="font-medium">{labelOf(t)}</div>
                  <span className="text-xs text-slate-500 capitalize">{t.type}</span>
                </div>
                <div className="mt-1 text-xs text-slate-600">
                  Duration: <b>{t.durationMins}m</b>
                  {t.startAt ? (
                    <>
                      {" "}
                      • Window: {fmtDT(t.startAt)}
                      {t.endAt ? <> → {fmtDT(t.endAt)}</> : null}
                    </>
                  ) : null}
                </div>
                <div className="mt-2 flex items-center gap-2 text-sm">
                  <ListChecks size={16} className="text-slate-500" />
                  {t.score != null && t.total != null ? (
                    <span className="font-medium">
                      Score: {round1(t.score)} / {round1(t.total)}
                    </span>
                  ) : (
                    <span className="text-slate-500 capitalize">{t.status}</span>
                  )}
                </div>
                {t.batch && <div className="mt-1 text-[11px] text-slate-500">Batch: {t.batch}</div>}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Export */}
      <div className="flex items-center justify-end gap-2">
        <a
          href={`/api/company/applications/${id}/results/export.xlsx`}
          className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border bg-white hover:bg-slate-50"
          title="Download Excel"
        >
          <Download size={16} /> Export Excel
        </a>
        <a
          href={`/api/company/applications/${id}/results/export.pdf`}
          className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border bg-white hover:bg-slate-50"
          title="Download PDF"
        >
          <Download size={16} /> Export PDF
        </a>
      </div>
    </div>
  );
}

function Kpi({ label, value, max = 100 }) {
  const pct = value != null ? Math.max(0, Math.min(100, (Number(value) / max) * 100)) : 0;
  return (
    <div className="min-w-[140px]">
      <div className="flex items-center justify-between text-[11px] text-slate-600 mb-1">
        <span>{label}</span>
        <b className="text-slate-800">{value ?? "—"}</b>
      </div>
      <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: "linear-gradient(90deg,#60a5fa,#6366f1)" }} />
      </div>
    </div>
  );
}
function labelOf(t) {
  if (t.title) return t.title;
  if (t.type === "aptitude") return "Aptitude Test";
  if (t.type === "skill") return `${t.skillName || "Skill"} Test`;
  return "Test";
}
function fmtDT(v) {
  try { return new Date(v).toLocaleString(); } catch { return String(v); }
}
function round1(n) { return Math.round(Number(n) * 10) / 10; }
