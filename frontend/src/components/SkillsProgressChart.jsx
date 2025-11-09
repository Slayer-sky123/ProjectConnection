// src/components/SkillsProgressChart.jsx
import { useEffect, useMemo, useState } from "react";
import API from "../api/axios";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
} from "chart.js";
import { Gauge } from "lucide-react";

ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend);

export default function SkillsProgressChart({ skillFilter = "" }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await API.get("/student/skill-progress");
        setRows(Array.isArray(res.data) ? res.data : []);
      } catch (e) {
        setRows([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filtered = useMemo(() => {
    if (!skillFilter) return rows;
    return rows.filter((r) => (r.skill?._id || r.skill) === skillFilter);
  }, [rows, skillFilter]);

  const chartData = useMemo(() => {
    if (!filtered.length) return null;
    const labels = filtered.map((d) => d.skill?.name || d.skill);
    const averages = filtered.map((d) => {
      const total = Math.max(1, d.history?.length || 0);
      const sum = (d.history || []).reduce((acc, h) => acc + (h.score || 0) / Math.max(1, h.total || 1), 0);
      return Math.round((sum / total) * 100);
    });
    return {
      labels,
      datasets: [
        {
          label: "Proficiency (%)",
          data: averages,
          backgroundColor: "#3b82f6",
          borderRadius: 6,
        },
      ],
    };
  }, [filtered]);

  if (loading) {
    return (
      <div className="bg-white shadow-md rounded-xl p-6 text-sm text-slate-500">Loading…</div>
    );
  }

  if (!chartData) {
    return (
      <div className="bg-white shadow-md rounded-xl p-6">
        <div className="flex items-center gap-2 mb-2">
          <Gauge className="text-blue-600" size={20} />
          <h2 className="text-lg font-semibold text-gray-800">My Skills Progress</h2>
        </div>
        <div className="text-sm text-slate-600">No data yet.</div>
      </div>
    );
  }

  return (
    <div className="bg-white shadow-md rounded-xl p-6">
      <div className="flex items-center gap-2 mb-4">
        <Gauge className="text-blue-600" size={20} />
        <h2 className="text-lg font-semibold text-gray-800">My Skills Progress</h2>
      </div>
      <Bar
        data={chartData}
        options={{
          responsive: true,
          plugins: {
            legend: { display: false },
            tooltip: { callbacks: { label: (ctx) => `${ctx.parsed.y}%` } },
          },
          scales: { y: { beginAtZero: true, max: 100, ticks: { stepSize: 20 } } },
        }}
        height={200}
      />
    </div>
  );
}
