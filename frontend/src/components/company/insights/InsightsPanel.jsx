import { useEffect, useState } from "react";
import API from "../../../api/axios";
import { BarChart3, Gauge, AlertTriangle, Sparkles, CheckCircle2 } from "lucide-react";
import Sparkline from "../charts/Sparkline";

const card = "rounded-2xl border bg-white shadow-sm";

/** Premium, compact insights panel with clean hierarchy and markings */
export default function InsightsPanel({ applicationId, compact = false }) {
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [data, setData] = useState(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      setErr("");
      try {
        const res = await API.get(`/company/screening/summary`, { params: { applicationId } });
        if (mounted) setData(res.data || null);
      } catch (e) {
        if (mounted) setErr(e?.response?.data?.message || "Failed to load insights");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [applicationId]);

  if (loading) {
    return (
      <div className="p-4">
        <div className="grid md:grid-cols-3 gap-4">
          {[...Array(3)].map((_,i)=>(
            <div key={i} className={`${card} p-4`}>
              <div className="h-4 w-24 bg-slate-100 rounded mb-3 animate-pulse" />
              <div className="space-y-2">
                <div className="h-3 w-full bg-slate-100 rounded animate-pulse" />
                <div className="h-3 w-5/6 bg-slate-100 rounded animate-pulse" />
                <div className="h-3 w-4/6 bg-slate-100 rounded animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }
  if (err) return <div className="p-4 text-sm text-rose-600">{err}</div>;
  if (!data) return <div className="p-4 text-sm text-slate-500">No insights available.</div>;

  const gridCols = compact ? "md:grid-cols-2" : "md:grid-cols-3";

  return (
    <div className={`p-4 ${compact ? "" : "px-6 py-5"} bg-slate-50/60 border-t rounded-b-2xl`}>
      <div className={`grid ${gridCols} gap-4`}>

        {/* Key Metrics */}
        <div className={`${card} p-4`}>
          <Header title="Key Metrics" icon={<Gauge size={18} className="text-slate-500" />} />
          <ul className="text-sm divide-y divide-slate-100">
            <Metric label="Resume Score" value={fmt(data.resumeScore)} tone={toneByScore(data.resumeScore)} />
            <Metric label="Fit Score" value={fmt(data.fitScore)} tone={toneByScore(data.fitScore)} />
            <Metric label="Avg Skill Score" value={fmt(data.avgSkillScore)} />
            <Metric label="Avg Aptitude Score" value={fmt(data.avgAptitudeScore)} />
            <Metric label="Signal" value={data.recommendation || "—"} highlight />
          </ul>

          {/* result ribbon when strong recommendation */}
          {posBadge(data.recommendation)}
        </div>

        {/* Signals */}
        <div className={`${card} p-4`}>
          <Header title="Signals" icon={<Sparkles size={18} className="text-slate-500" />} />
          <div className="mb-3">
            <div className="text-[12px] text-slate-500 mb-1">Top Skills (resume)</div>
            <div className="flex flex-wrap gap-2">
              {(data.topSkills || []).slice(0, 10).map((s) => (
                <span key={s} className="px-2 py-1 text-xs rounded-full bg-slate-50 border border-slate-200">
                  {s}
                </span>
              ))}
              {(!data.topSkills || data.topSkills.length === 0) && (
                <div className="text-xs text-slate-500">—</div>
              )}
            </div>
          </div>
          <div className="space-y-2">
            {(data.riskFlags || []).length > 0 ? (
              data.riskFlags.map((r, i) => (
                <div key={i} className="flex items-start gap-2 text-xs text-amber-700">
                  <AlertTriangle size={14} className="mt-0.5" /> {r}
                </div>
              ))
            ) : (
              <div className="text-xs text-slate-500 flex items-center gap-1">
                <CheckCircle2 size={14} className="text-emerald-600" /> No risk flags.
              </div>
            )}
          </div>
        </div>

        {/* Trends */}
        <div className={`${card} p-4`}>
          <Header title="Score Trends" icon={<BarChart3 size={18} className="text-slate-500" />} />
          <div className="space-y-3">
            <Sparkline label="Skill" color="#3b82f6" data={data.skillTimeline || []} />
            <Sparkline label="Aptitude" color="#10b981" data={data.aptitudeTimeline || []} />
          </div>

          {/* Latest blocks */}
          <div className="grid grid-cols-2 gap-2 text-xs mt-4">
            <InfoBlock
              title="Latest Skill"
              primary={data.lastSkill?.name || "—"}
              value={fmt(data.lastSkill?.score)}
            />
            <InfoBlock
              title="Latest Aptitude"
              primary={data.lastAptitude?.title || "—"}
              value={fmt(data.lastAptitude?.score)}
            />
          </div>
        </div>

      </div>
    </div>
  );
}

function Header({ title, icon }) {
  return (
    <div className="flex items-center justify-between mb-2">
      <div className="font-semibold">{title}</div>
      {icon}
    </div>
  );
}

function Metric({ label, value, tone, highlight = false }) {
  const chip = highlight
    ? "px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-50 border border-slate-200"
    : "";
  return (
    <li className="py-2 flex items-center justify-between">
      <span className="text-slate-600">{label}</span>
      <span className={`font-semibold ${tone || ""}`}>
        {highlight ? <span className={chip}>{value}</span> : value}
      </span>
    </li>
  );
}

function InfoBlock({ title, primary, value }) {
  return (
    <div className="rounded-xl bg-slate-50 border border-slate-200 p-2">
      <div className="text-slate-500">{title}</div>
      <div className="font-medium truncate">{primary}</div>
      <div className="text-slate-800">{value}</div>
    </div>
  );
}

function fmt(v) { return v == null ? "—" : v; }
function toneByScore(v) {
  if (v == null) return "";
  if (v >= 80) return "text-emerald-600";
  if (v >= 60) return "text-sky-600";
  if (v >= 40) return "text-amber-600";
  return "text-rose-600";
}

function posBadge(signal) {
  if (!signal) return null;
  const s = String(signal).toLowerCase();
  if (["strong hire", "hire", "good fit", "recommended"].some(k => s.includes(k))) {
    return (
      <div className="mt-3">
        <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[12px]">
          <CheckCircle2 size={14} /> Positive signal detected
        </div>
      </div>
    );
  }
  return null;
}
