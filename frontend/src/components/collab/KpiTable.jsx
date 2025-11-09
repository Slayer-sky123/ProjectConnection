import { useMemo } from "react";

const BRAND = { dark: "#0c2d48", light: "#b1d4e0" };

export default function KpiTable({ kpis }) {
  const rows = useMemo(() => ([
    { area: "Internship", key: "internships", deliverable: "No. of students trained or placed", kpi: "Minimum 20/year" },
    { area: "Skill Validation", key: "skillValidations", deliverable: "Number of skills tested via portal", kpi: "200+ students/year" },
    { area: "Webinars", key: "webinars", deliverable: "Industry lectures hosted", kpi: "5 per semester" },
    { area: "Research", key: "research", deliverable: "Joint projects initiated", kpi: "At least 2/year" },
  ]), []);

  return (
    <div className="rounded-xl border bg-white overflow-hidden" style={{ borderColor: BRAND.light }}>
      <table className="w-full text-sm">
        <thead className="bg-[#b1d4e01a]" style={{ color: BRAND.dark }}>
          <tr>
            <th className="text-left px-4 py-3">Area</th>
            <th className="text-left px-4 py-3">Deliverable</th>
            <th className="text-left px-4 py-3">KPI/Target</th>
            <th className="text-left px-4 py-3">Planned</th>
            <th className="text-left px-4 py-3">Actual</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => {
            const val = kpis?.[r.key] || {};
            return (
              <tr key={r.key} className="border-t" style={{ borderColor: BRAND.light }}>
                <td className="px-4 py-3 font-medium">{r.area}</td>
                <td className="px-4 py-3">{r.deliverable}</td>
                <td className="px-4 py-3">{r.kpi}</td>
                <td className="px-4 py-3">{val.planned ?? "—"}</td>
                <td className="px-4 py-3">{val.actual ?? "—"}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
