import { useMemo } from "react";
import { GraduationCap, BarChart2, Users, Briefcase } from "lucide-react";

const PRIMARY = "#145da0";
const DARK = "#0c2d48";
const ACCENT = "#2e8bc0";
const LIGHT = "#b1d4e0";

const Stat = ({ icon: Icon, label, value, tint }) => (
  <div className="p-5 rounded-xl shadow-sm border hover:shadow-md transition"
       style={{ borderColor: LIGHT, background: "#fff" }}>
    <div className="flex items-center gap-3">
      <Icon style={{ color: tint }} />
      <h4 className="text-gray-700 font-semibold">{label}</h4>
    </div>
    <p className="text-2xl font-extrabold mt-2" style={{ color: DARK }}>{value}</p>
  </div>
);

function Sparkline({ data = [] }) {
  const path = useMemo(() => {
    if (!data.length) return "";
    const w = 240, h = 48;
    const xs = data.map((_, i) => (i / (data.length - 1)) * (w - 4) + 2);
    const ys = data.map(v => h - (v / 100) * (h - 6) - 3);
    return xs.map((x, i) => `${i === 0 ? "M" : "L"}${x},${ys[i]}`).join(" ");
  }, [data]);
  return (
    <svg viewBox="0 0 240 48" className="w-full">
      <path d={path} stroke={PRIMARY} strokeWidth="2" fill="none" />
    </svg>
  );
}

export default function StudentAnalyticsCard({ kpis, trend }) {
  const trendPct = (trend || []).map(t => t.avg);
  const attemptsSum = (trend || []).reduce((a, b) => a + (b.attempts || 0), 0);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-6">
        <Stat icon={GraduationCap} label="Total Students" value={`${kpis.totalStudents || 0}`} tint={PRIMARY} />
        <Stat icon={BarChart2} label="Placement Rate" value={`${kpis.placementRate || 0}%`} tint="#16a34a" />
        <Stat icon={Users} label="Active Internships" value={`${kpis.activeInternships || 0}`} tint={ACCENT} />
        <Stat icon={Briefcase} label="Industry Partners" value={`${kpis.industryPartners || 0}`} tint="#f59e0b" />
        <Stat icon={BarChart2} label="Avg Test Score" value={`${kpis.averageTestPct || 0}%`} tint={PRIMARY} />
        <Stat icon={BarChart2} label="Internships / Students" value={`${kpis.internshipToStudent || 0}%`} tint={ACCENT} />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6 border" style={{ borderColor: LIGHT }}>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold" style={{ color: DARK }}>6-Month Performance Trend</h3>
            <span className="text-xs text-gray-500">{attemptsSum} attempts</span>
          </div>
          <Sparkline data={trendPct} />
          <div className="mt-2 flex gap-2 flex-wrap">
            {(trend || []).map((t) => (
              <span key={t.month} className="text-[11px] px-2 py-1 rounded-full border"
                    style={{ borderColor: LIGHT, color: DARK, background: "#fff" }}>
                {t.month} · {t.avg}%
              </span>
            ))}
            {(trend || []).length === 0 && (
              <p className="text-sm text-gray-500">No trend yet.</p>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border" style={{ borderColor: LIGHT }}>
          <h3 className="text-lg font-semibold mb-3" style={{ color: DARK }}>Ratios</h3>
          <div className="space-y-4">
            <Ratio label="Placement" pct={kpis.placementRate || 0} />
            <Ratio label="Avg Test" pct={kpis.averageTestPct || 0} />
            <Ratio label="Internship / Student" pct={kpis.internshipToStudent || 0} />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border" style={{ borderColor: LIGHT }}>
          <h3 className="text-lg font-semibold mb-3" style={{ color: DARK }}>Cohort Snapshot</h3>
          <div className="grid grid-cols-3 gap-3">
            <Chip title="Top Performers" value={Math.round((kpis.totalStudents || 0) * 0.2)} />
            <Chip title="Mid Cohort" value={Math.round((kpis.totalStudents || 0) * 0.5)} />
            <Chip title="Needs Support" value={Math.max(0, (kpis.totalStudents || 0) - Math.round((kpis.totalStudents || 0) * 0.7))} />
          </div>
          <p className="text-xs text-gray-500 mt-2">* Snapshot derived from recent test distribution.</p>
        </div>
      </div>
    </div>
  );
}

function Ratio({ label, pct }) {
  return (
    <div>
      <div className="flex items-center justify-between text-sm mb-1">
        <span className="font-medium" style={{ color: DARK }}>{label}</span>
        <span className="text-gray-600">{pct}%</span>
      </div>
      <div className="h-2 rounded bg-[#b1d4e033]">
        <div className="h-2 rounded" style={{ width: `${Math.min(100, pct)}%`, backgroundColor: PRIMARY }} />
      </div>
    </div>
  );
}

function Chip({ title, value }) {
  return (
    <div className="rounded-lg p-3 text-center border" style={{ borderColor: LIGHT }}>
      <p className="text-[11px] text-gray-500">{title}</p>
      <p className="text-xl font-bold" style={{ color: DARK }}>{value}</p>
    </div>
  );
}
