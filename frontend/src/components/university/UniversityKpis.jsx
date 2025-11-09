import { useEffect, useState } from "react";
import { GraduationCap, BarChart2, Users, Briefcase } from "lucide-react";
import { getOverview } from "../../api/university";

const BRAND = { primary: "#145da0", deep: "#0c2d48" };

const StatCard = ({ icon: Icon, label, value, tone }) => (
  <div className="bg-white p-5 rounded-xl shadow-sm hover:shadow-md transition">
    <div className="flex items-center gap-3">
      <Icon className={tone} />
      <h4 className="text-gray-700 font-semibold">{label}</h4>
    </div>
    <p className="text-2xl font-bold mt-2 text-gray-900">{value}</p>
  </div>
);

export default function UniversityKpis({ username }) {
  const [data, setData] = useState({
    kpis: { totalStudents: 0, placementRate: 0, activeInternships: 0, industryPartners: 0 },
    trend: [],
  });

  useEffect(() => {
    (async () => {
      try {
        const res = await getOverview(username);
        setData({ kpis: res.kpis || data.kpis, trend: res.trend || [] });
      } catch {
        setData(data); // keep previous
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [username]);

  const cards = [
    { icon: GraduationCap, label: "Total Students", value: `${data.kpis.totalStudents}`, tone: "text-blue-600" },
    { icon: BarChart2, label: "Placement Rate", value: `${data.kpis.placementRate}%`, tone: "text-emerald-600" },
    { icon: Users, label: "Active Internships", value: `${data.kpis.activeInternships}`, tone: "text-purple-600" },
    { icon: Briefcase, label: "Industry Partners", value: `${data.kpis.industryPartners}`, tone: "text-amber-600" },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map((c, i) => (
          <StatCard key={i} {...c} />
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-800">6-Month Outcomes Trend</h3>
          <span className="text-xs text-gray-500">Avg % vs Attempts</span>
        </div>
        <div className="grid grid-cols-6 gap-3">
          {data.trend.map((t) => (
            <div key={t.month} className="flex flex-col items-center">
              <div className="h-24 w-10 bg-[#e8f2fb] rounded relative overflow-hidden">
                <div
                  className="absolute bottom-0 left-0 right-0"
                  style={{ height: `${Math.min(100, t.avg)}%`, background: BRAND.primary, opacity: 0.85 }}
                  title={`Avg: ${t.avg}%`}
                />
              </div>
              <div className="text-[11px] text-gray-600 mt-1">{t.attempts} tries</div>
              <span className="text-xs text-gray-700 mt-1">{t.month}</span>
            </div>
          ))}
          {data.trend.length === 0 && <div className="text-sm text-gray-500">No recent attempts.</div>}
        </div>
      </div>
    </div>
  );
}
