// src/components/university/AdvancedAnalytics.jsx
import { useEffect, useMemo, useState } from "react";
import { getAdvancedAnalytics } from "../../api/university";
import { ArrowDownWideNarrow, Hash, ListChecks } from "lucide-react";

const PRIMARY = "#145da0";
const DARK = "#0c2d48";
const LIGHT = "#b1d4e0";

export default function AdvancedAnalytics({ username }) {
  const [data, setData] = useState({ bySkill: [], edu: [], skillCloud: [], monthlyPlacements: [] });
  const [sortBy, setSortBy] = useState("avg"); // avg | attempts

  useEffect(() => {
    if (!username || username === "undefined") return;
    (async () => {
      try { setData(await getAdvancedAnalytics(username)); }
      catch { setData({ bySkill: [], edu: [], skillCloud: [], monthlyPlacements: [] }); }
    })();
  }, [username]);

  const bySkillSorted = useMemo(() => {
    const rows = Array.isArray(data.bySkill) ? [...data.bySkill] : [];
    if (sortBy === "attempts") rows.sort((a, b) => (b.attempts || 0) - (a.attempts || 0));
    else rows.sort((a, b) => (b.avg || 0) - (a.avg || 0));
    return rows;
  }, [data.bySkill, sortBy]);

  const eduTotal = useMemo(() => (Array.isArray(data.edu) ? data.edu.reduce((a, e) => a + Number(e?.count || 0), 0) : 0), [data.edu]);
  const placementsTotal = useMemo(() => (Array.isArray(data.monthlyPlacements) ? data.monthlyPlacements.reduce((a, m) => a + Number(m?.placed || 0), 0) : 0), [data.monthlyPlacements]);

  return (
    <div className="space-y-6">
      <div className="grid lg:grid-cols-2 gap-6">
        <Card title="Average Test % by Primary Skill" right={
          <button className="text-xs inline-flex items-center gap-1 px-2 py-1 rounded border"
                  style={{ borderColor: LIGHT }} onClick={() => setSortBy(sortBy === "avg" ? "attempts" : "avg")}>
            <ArrowDownWideNarrow className="w-3 h-3" /> Sort by {sortBy === "avg" ? "Attempts" : "Avg %"}
          </button>
        }>
          <div className="space-y-2">
            {bySkillSorted.map((s) => (
              <Row key={s.skill} label={s.skill} right={`${s.avg}% • ${s.attempts}x`}>
                <Bar pct={s.avg} />
              </Row>
            ))}
            {bySkillSorted.length === 0 && <Empty />}
          </div>
        </Card>

        <Card title={`Education Distribution (${eduTotal})`}>
          <div className="space-y-2">
            {Array.isArray(data.edu) && data.edu.map((e) => (
              <Row key={e.education} label={e.education} right={e.count}>
                <Bar pct={eduTotal ? Math.round((Number(e.count || 0) / eduTotal) * 100) : 0} />
              </Row>
            ))}
            {(!data.edu || data.edu.length === 0) && <Empty />}
          </div>
        </Card>

        <Card title="Top Skills (Students' Profiles)">
          <div className="flex flex-wrap gap-2">
            {Array.isArray(data.skillCloud) && data.skillCloud.map((s) => (
              <span key={s.skill} className="text-xs px-2 py-1 rounded-full border"
                style={{ borderColor: LIGHT, color: DARK, background: "#b1d4e033" }}
                title={`${s.count} students`}
              >
                {s.skill} · {s.count}
              </span>
            ))}
            {(!data.skillCloud || data.skillCloud.length === 0) && <Empty />}
          </div>
        </Card>

        <Card title={`Monthly Placements (offers/joined) · Total ${placementsTotal}`}>
          <div className="grid grid-cols-12 items-end gap-2 h-36">
            {Array.isArray(data.monthlyPlacements) && data.monthlyPlacements.map((m) => (
              <div key={m._id} className="flex flex-col items-center gap-1">
                <div className="w-4 bg-[#b1d4e066]" style={{ height: `${Math.min(100, (m.placed || 0) * 15)}%`, borderRadius: 6 }} />
                <span className="text-[10px] text-gray-600">{String(m._id).slice(5)}</span>
              </div>
            ))}
            {(!data.monthlyPlacements || data.monthlyPlacements.length === 0) && <Empty />}
          </div>
        </Card>
      </div>

      {/* Extras: quick density */}
      <div className="grid lg:grid-cols-3 gap-6">
        <MiniCard title="Skill Breadth Index" icon={Hash}
                  value={Array.isArray(data.skillCloud) ? data.skillCloud.length : 0}
                  hint="Distinct skills seen on profiles" />
        <MiniCard title="Top Skill Attempts" icon={ListChecks}
                  value={bySkillSorted[0]?.attempts || 0}
                  hint={bySkillSorted[0]?.skill ? `Most attempted: ${bySkillSorted[0]?.skill}` : "—"} />
        <MiniCard title="Peak Month" icon={ListChecks}
                  value={(Array.isArray(data.monthlyPlacements) ? [...data.monthlyPlacements].sort((a,b)=> (b.placed||0)-(a.placed||0))[0]?. _id : "—") || "—"}
                  hint="Highest placement activity" />
      </div>
    </div>
  );
}

function Card({ title, children, right }) {
  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border" style={{ borderColor: LIGHT }}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold" style={{ color: DARK }}>{title}</h3>
        {right}
      </div>
      {children}
    </div>
  );
}

function Row({ label, right, children }) {
  return (
    <div className="border rounded-lg p-3" style={{ borderColor: LIGHT }}>
      <div className="flex items-center justify-between text-sm mb-2">
        <span className="font-medium" style={{ color: DARK }}>{label}</span>
        <span className="text-gray-600">{right}</span>
      </div>
      {children}
    </div>
  );
}

function Bar({ pct = 0 }) {
  return (
    <div className="h-2 bg-[#b1d4e033] rounded">
      <div className="h-2 rounded" style={{ width: `${Math.min(100, pct)}%`, backgroundColor: PRIMARY }} />
    </div>
  );
}

function Empty() {
  return <div className="text-sm text-gray-500">No data.</div>;
}

function MiniCard({ title, icon: Icon, value, hint }) {
  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border" style={{ borderColor: LIGHT }}>
      <div className="flex items-center gap-2 mb-2">
        <Icon className="w-4 h-4" style={{ color: PRIMARY }} />
        <h4 className="text-sm font-semibold" style={{ color: DARK }}>{title}</h4>
      </div>
      <div className="text-xl font-bold" style={{ color: DARK }}>{value}</div>
      <div className="text-xs text-gray-600 mt-1">{hint}</div>
    </div>
  );
}
