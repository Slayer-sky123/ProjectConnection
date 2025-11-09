import { useEffect, useMemo, useState } from "react";
import API from "../../api/axios";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Tooltip,
  Legend,
} from "chart.js";
import { Sparkles } from "lucide-react";

ChartJS.register(LineElement, CategoryScale, LinearScale, PointElement, Tooltip, Legend);

function Card({ children, className = "" }) {
  return (
    <div className={`bg-white/80 backdrop-blur rounded-2xl border p-6 ${className}`}>
      {children}
    </div>
  );
}

function SkeletonCard() {
  return (
    <Card className="animate-pulse">
      <div className="h-5 w-40 rounded bg-slate-200" />
      <div className="mt-4 h-56 w-full rounded bg-slate-200" />
    </Card>
  );
}

export default function SkillProgress() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProgress = async () => {
      try {
        const res = await API.get("/student/skill-progress");
        setRows(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        console.error("Failed to fetch skill progress", err);
        setRows([]);
      } finally {
        setLoading(false);
      }
    };
    fetchProgress();
  }, []);

  const colors = [
    "#2563eb", "#059669", "#f59e0b", "#dc2626", "#7c3aed", "#0ea5e9", "#10b981", "#f43f5e",
  ];

  const { labels, datasets } = useMemo(() => {
    const allLabels = [];
    const ds = rows.map((skillData, idx) => {
      const reversed = [...(skillData.history || [])].reverse();
      const scores = reversed.map((h) => h.score);
      if (reversed.length > allLabels.length) {
        for (let i = allLabels.length; i < reversed.length; i++) allLabels.push(`#${i + 1}`);
      }
      const c = colors[idx % colors.length];
      return {
        label: skillData.skill?.name || skillData.skill,
        data: scores,
        borderColor: c,
        backgroundColor: c + "33",
        pointRadius: 3,
        fill: false,
        tension: 0.3,
      };
    });
    return { labels: allLabels, datasets: ds };
  }, [rows]);

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <div className="flex items-center gap-2">
        <h1 className="text-2xl font-semibold tracking-tight">Your Skill Progress</h1>
      </div>

      {/* Combined chart */}
      {loading ? (
        <SkeletonCard />
      ) : rows.length === 0 ? (
        <Card className="text-center">
          <div className="mx-auto h-10 w-10 rounded-xl bg-blue-50 text-blue-600 grid place-items-center">
            <Sparkles size={18} />
          </div>
          <h2 className="mt-3 font-semibold">No test records yet</h2>
          <p className="text-sm text-gray-600 mt-1">
            As you take tests, your progress will appear here.
          </p>
        </Card>
      ) : (
        <Card>
          <h2 className="text-lg font-semibold text-blue-700">Combined Progress</h2>
          <p className="text-sm text-gray-600 mt-1">
            Each line shows your score trend across attempts (0–10).
          </p>
          <div className="h-80 mt-4">
            <Line
              data={{ labels, datasets }}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                  y: { beginAtZero: true, max: 10, ticks: { stepSize: 1 } },
                },
                plugins: {
                  legend: { position: "bottom" },
                  tooltip: { intersect: false, mode: "index" },
                },
              }}
            />
          </div>
        </Card>
      )}

      {/* Per-skill summary */}
      {rows.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2">
          {rows.map((skill, i) => {
            const history = Array.isArray(skill.history) ? skill.history : [];
            if (!history.length) return null;
            const attempts = history.length;
            const latest = [...history].sort(
              (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
            )[0];
            const average = (history.reduce((s, h) => s + h.score, 0) / attempts).toFixed(1);

            let badge = "Beginner";
            let badgeTone = "bg-rose-50 text-rose-700 ring-rose-200";
            if (average >= 7) { badge = "Pro"; badgeTone = "bg-emerald-50 text-emerald-700 ring-emerald-200"; }
            else if (average >= 4) { badge = "Intermediate"; badgeTone = "bg-amber-50 text-amber-700 ring-amber-200"; }

            const barPct = Math.min(100, Math.max(0, (average / 10) * 100));
            const lineColor = colors[i % colors.length];

            return (
              <Card key={skill.skill?._id || skill.skill}>
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">{skill.skill?.name || skill.skill}</h3>
                  <span className={`text-xs px-2.5 py-1 rounded-full ring-1 ${badgeTone}`}>{badge}</span>
                </div>

                <div className="mt-3 text-sm text-gray-700">
                  Attempts: <b>{attempts}</b>
                  <span className="mx-2 text-gray-300">•</span>
                  Latest: <b>{latest.score}</b> / {latest.total}
                  <span className="mx-2 text-gray-300">•</span>
                  Average: <b>{average}</b>
                </div>

                {/* pastel progress bar */}
                <div className="mt-3 h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full"
                    style={{
                      width: `${barPct}%`,
                      background: `${lineColor}55`,
                      outline: `1px solid ${lineColor}55`,
                    }}
                  />
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
