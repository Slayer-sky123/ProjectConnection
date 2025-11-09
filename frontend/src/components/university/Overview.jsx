// src/components/university/Overview.jsx
import { useEffect, useMemo, useState } from "react";
import { getAiOverview } from "../../api/university";
import { BarChart2, GraduationCap, Users, Briefcase, Activity, Rocket, Award, Sparkles } from "lucide-react";

const PRIMARY = "#145da0";
const DARK = "#0c2d48";
const LIGHT = "#b1d4e0";

function Card({ icon: Icon, label, value, tint }) {
  return (
    <div className="p-5 rounded-xl shadow-sm border hover:shadow-md transition bg-white"
         style={{ borderColor: LIGHT }}>
      <div className="flex items-center gap-3">
        <Icon style={{ color: tint }} />
        <h4 className="text-gray-700 font-semibold">{label}</h4>
      </div>
      <p className="text-2xl font-extrabold mt-2" style={{ color: DARK }}>{value}</p>
    </div>
  );
}

function LegendPill({ color, label }) {
  return (
    <span className="text-[11px] px-2 py-1 rounded-full border"
          style={{ borderColor: LIGHT, color: DARK, background: "#fff" }}>
      <span className="inline-block w-2 h-2 rounded-full mr-1" style={{ backgroundColor: color }} /> {label}
    </span>
  );
}

/** Dual bar micro-chart (Placements vs Internships) */
function TrendBars({ data = [] }) {
  if (!Array.isArray(data) || data.length === 0) {
    return <div className="text-sm text-gray-500">No trend yet.</div>;
  }
  const maxVal = Math.max(1, ...data.map(d => Math.max(d.placed || 0, d.internships || 0)));
  return (
    <div className="grid grid-cols-6 gap-3">
      {data.map((t) => {
        const p = Math.round(((t.placed || 0) / maxVal) * 100);
        const i = Math.round(((t.internships || 0) / maxVal) * 100);
        return (
          <div key={t.month} className="flex flex-col items-center">
            <div className="h-28 w-10 bg-[#e8f2fb] rounded relative overflow-hidden flex flex-col justify-end gap-1 p-1">
              <div className="w-full rounded" style={{ height: `${i}%`, background: "#2e8bc0" }} title={`Internships: ${t.internships || 0}`} />
              <div className="w-full rounded" style={{ height: `${p}%`, background: PRIMARY }} title={`Placed: ${t.placed || 0}`} />
            </div>
            <span className="text-xs text-gray-700 mt-1">{t.month}</span>
          </div>
        );
      })}
    </div>
  );
}

export default function Overview({ kpis = {}, trend = [], username }) {
  // NOTE: The server /ai/overview returns { ok, snapshot: { avgTestPct }, guidance }
  const [ai, setAi] = useState({ snapshot: { avgTestPct: null }, guidance: null });
  useEffect(() => {
    (async () => {
      try {
        const o = await getAiOverview(username);
        // keep only known safe fields
        const snapshot = o?.snapshot || { avgTestPct: null };
        setAi({ snapshot, guidance: o?.guidance || null });
      } catch {
        setAi({ snapshot: { avgTestPct: null }, guidance: null });
      }
    })();
  }, [username]);

  const totalStudents = Number(kpis?.totalStudents || 0);
  const placedRate = Number(kpis?.placementRate || 0);
  const internshipCount = Number(kpis?.activeInternships || 0);
  const partners = Number(kpis?.industryPartners || 0);
  const avgTestPct = ai?.snapshot?.avgTestPct ?? (kpis?.averageTestPct ?? null);

  const totals = useMemo(() => {
    const placed = (trend || []).reduce((a, x) => a + Number(x?.placed || 0), 0);
    const interns = (trend || []).reduce((a, x) => a + Number(x?.internships || 0), 0);
    return { placed, interns };
  }, [trend]);

  return (
    <div className="space-y-6">
      {/* 4 KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card icon={GraduationCap} label="Total Students" value={`${totalStudents}`} tint={PRIMARY} />
        <Card icon={BarChart2} label="Placement Rate" value={`${placedRate}%`} tint="#16a34a" />
        <Card icon={Users} label="Active Internships" value={`${internshipCount}`} tint="#2e8bc0" />
        <Card icon={Briefcase} label="Industry Partners" value={`${partners}`} tint="#f59e0b" />
      </div>

      {/* Top row: Trend + Snapshot */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Trend */}
        <div className="bg-white rounded-xl shadow-sm p-6 border lg:col-span-2" style={{ borderColor: LIGHT }}>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold" style={{ color: DARK }}>6-Month Outcomes Trend</h3>
            <div className="flex items-center gap-2">
              <LegendPill color={PRIMARY} label="Placed" />
              <LegendPill color="#2e8bc0" label="Internships" />
            </div>
          </div>
          <TrendBars data={Array.isArray(trend) ? trend : []} />
          <div className="mt-3 flex gap-3 text-xs text-gray-600">
            <span>Total Placed: <b>{totals.placed}</b></span>
            <span>Internships: <b>{totals.interns}</b></span>
          </div>
        </div>

        {/* Snapshot */}
        <div className="bg-white rounded-xl shadow-sm p-6 border" style={{ borderColor: LIGHT }}>
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2" style={{ color: DARK }}>
            <Activity className="w-5 h-5" style={{ color: PRIMARY }} />
            Cohort Snapshot
          </h3>
          <Gauge label="Avg Test %" value={Number.isFinite(avgTestPct) ? avgTestPct : 0} />
          <div className="mt-4 space-y-3">
            <Ratio label="Internships / Students" pct={Number(kpis?.internshipToStudent || 0)} />
            <Ratio label="Placement Rate" pct={placedRate} />
          </div>
          <div className="mt-4 p-3 rounded border text-xs" style={{ borderColor: LIGHT, background: "#f8fbff" }}>
            <p className="text-gray-700"><b>Highlights</b></p>
            <ul className="list-disc ml-4 text-gray-600 space-y-1">
              <li>Recent placements spike visible in {trend?.slice(-1)?.[0]?.month || "recent months"}.</li>
              <li>{internshipCount} internships currently active across {partners} partners.</li>
              <li>Average test performance: {Number.isFinite(avgTestPct) ? `${avgTestPct}%` : "N/A"}.</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Action Center */}
      <div className="bg-white rounded-xl shadow-sm p-6 border" style={{ borderColor: LIGHT }}>
        <h3 className="text-lg font-semibold mb-3 flex items-center gap-2" style={{ color: DARK }}>
          <Rocket className="w-5 h-5" style={{ color: PRIMARY }} /> Action Center
        </h3>
        <div className="grid sm:grid-cols-3 gap-3">
          <ActionLink href={`/university/${username}/placements`} icon={Sparkles} label="Review AI Matches" desc="See top predicted candidates" />
          <ActionLink href={`/university/${username}/students`} icon={Award} label="Manage Students" desc="Labels, notes & status" />
          <ActionLink href={`/university/${username}/certs`} icon={BarChart2} label="Issue Credentials" desc="Certificates & verification" />
        </div>
      </div>
    </div>
  );
}

function Gauge({ label, value }) {
  return (
    <div>
      <div className="flex items-center justify-between text-sm mb-1">
        <span className="font-medium" style={{ color: DARK }}>{label}</span>
        <span className="text-gray-600">{Math.min(100, Math.max(0, Number(value) || 0))}%</span>
      </div>
      <div className="h-2 rounded bg-[#b1d4e033]">
        <div className="h-2 rounded" style={{ width: `${Math.min(100, Math.max(0, Number(value) || 0))}%`, backgroundColor: PRIMARY }} />
      </div>
    </div>
  );
}

function Ratio({ label, pct }) {
  const v = Math.min(100, Math.max(0, Number(pct) || 0));
  return (
    <div>
      <div className="flex items-center justify-between text-sm mb-1">
        <span className="font-medium" style={{ color: DARK }}>{label}</span>
        <span className="text-gray-600">{v}%</span>
      </div>
      <div className="h-2 rounded bg-[#b1d4e033]">
        <div className="h-2 rounded" style={{ width: `${v}%`, backgroundColor: PRIMARY }} />
      </div>
    </div>
  );
}

function ActionLink({ href, icon: Icon, label, desc }) {
  return (
    <a href={href}
       className="rounded-xl border p-4 hover:shadow-sm transition flex items-start gap-3"
       style={{ borderColor: LIGHT }}>
      <Icon className="w-5 h-5 mt-0.5" style={{ color: PRIMARY }} />
      <div>
        <div className="font-medium" style={{ color: DARK }}>{label}</div>
        <div className="text-xs text-gray-600">{desc}</div>
      </div>
    </a>
  );
}
