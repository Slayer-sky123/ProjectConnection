// src/components/company/Talent.jsx
import { useEffect, useMemo, useState } from "react";
import {
  Search,
  SlidersHorizontal,
  Filter,
  Download,
  Users2,
  ChevronDown,
  ChevronRight,
  Building2,
  Sparkles,
  Gauge,
  Briefcase,
  GraduationCap,
  Star,
  Calendar,
  Mail,
  Phone,
} from "lucide-react";
import MiniCharts from "./charts/MiniCharts";

/**
 * Advanced Talent Discovery (Company)
 * - Dedicated experience distinct from Screening
 * - Multi-skill picker, score & fit sliders, text filters, sorting, paging
 * - Rich candidate cards with collapsible details & tiny charts
 * - CSV export
 *
 * Props:
 *  - skills: [{ _id, name }]
 *  - search: { skillIds?: string[], minScore?: number, minFit?: number, q?: string }
 *  - setSearch: fn(patch) -> void
 *  - results: [{
 *      student: { name, email, university, phone? },
 *      avgRequiredSkillScore: number, // 0..10
 *      fitScore: number,               // 0..10 (from API)
 *      highlights?: string[],         // optional - keywords
 *      yearsExperience?: number,      // optional
 *      lastUpdated?: string|Date,     // optional
 *      trends?: {                     // optional series for MiniCharts
 *        skills?: {x:number,y:number}[],
 *        fit?: {x:number,y:number}[],
 *      }
 *    }]
 *  - onRunSearch: () => void
 *  - onInviteInterview?: (candidate) => void
 *  - onShortlist?: (candidate) => void
 *  - onNote?: (candidate) => void
 */
export default function TalentTab({
  skills = [],
  search = {},
  setSearch,
  results = [],
  onRunSearch,
  onInviteInterview,
  onShortlist,
  onNote,
}) {
  const [ui, setUi] = useState({
    showFilters: true,
    page: 1,
    pageSize: 10,
    sortBy: "fit-desc", // fit-desc | fit-asc | avg-desc | avg-asc | name-asc
    expandedId: null, // store index or composite id
  });

  // Normalize & guard
  const minScore = Number(search.minScore ?? 6);
  const minFit = Number(search.minFit ?? 0);
  const q = (search.q || "").trim().toLowerCase();

  // Derived, sorted, paginated list (pure, no hooks inside loops)
  const sorted = useMemo(() => {
    const base = Array.isArray(results) ? results.slice() : [];
    // Client-side "extra" guard filters (server already filters by skills & minScore)
    const filtered = base.filter((r) => {
      const okScore = (r.avgRequiredSkillScore ?? 0) >= minScore;
      const okFit = (r.fitScore ?? 0) >= minFit;
      const okText =
        !q ||
        (r.student?.name || "").toLowerCase().includes(q) ||
        (r.student?.email || "").toLowerCase().includes(q) ||
        (r.student?.university || "").toLowerCase().includes(q);
      return okScore && okFit && okText;
    });

    const sort = ui.sortBy;
    filtered.sort((a, b) => {
      const nameA = (a.student?.name || "").toLowerCase();
      const nameB = (b.student?.name || "").toLowerCase();
      const fitA = Number(a.fitScore || 0);
      const fitB = Number(b.fitScore || 0);
      const avgA = Number(a.avgRequiredSkillScore || 0);
      const avgB = Number(b.avgRequiredSkillScore || 0);
      if (sort === "fit-desc") return fitB - fitA || avgB - avgA || nameA.localeCompare(nameB);
      if (sort === "fit-asc") return fitA - fitB || avgA - avgB || nameA.localeCompare(nameB);
      if (sort === "avg-desc") return avgB - avgA || fitB - fitA || nameA.localeCompare(nameB);
      if (sort === "avg-asc") return avgA - avgB || fitA - fitB || nameA.localeCompare(nameB);
      return nameA.localeCompare(nameB);
    });
    return filtered;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [results, minScore, minFit, q, ui.sortBy]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / ui.pageSize));
  const page = Math.min(ui.page, totalPages);
  const visible = useMemo(() => {
    const start = (page - 1) * ui.pageSize;
    return sorted.slice(start, start + ui.pageSize);
  }, [sorted, page, ui.pageSize]);

  // Handlers (do not create hooks in loops)
  const toggleSkill = (id) => {
    setSearch((s) => {
      const list = s.skillIds || [];
      return list.includes(id)
        ? { ...s, skillIds: list.filter((x) => x !== id) }
        : { ...s, skillIds: [...list, id] };
    });
  };

  const exportCSV = () => {
    const rows = [
      [
        "Name",
        "Email",
        "University",
        "AvgReqSkillScore(0-10)",
        "FitScore(0-10)",
        "YearsExperience",
        "Highlights",
      ],
      ...sorted.map((r) => [
        safe(r.student?.name),
        safe(r.student?.email),
        safe(r.student?.university),
        String(r.avgRequiredSkillScore ?? ""),
        String(r.fitScore ?? ""),
        String(r.yearsExperience ?? ""),
        (r.highlights || []).join("; "),
      ]),
    ];
    const csv = rows.map((arr) => arr.map(csvCell).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "talent-search.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  // UI bits
  const SkillFilterPills = (
    <div className="flex flex-wrap gap-2">
      {skills.map((sk) => {
        const active = (search.skillIds || []).includes(sk._id);
        return (
          <button
            key={sk._id}
            onClick={() => toggleSkill(sk._id)}
            className={`px-3 py-1.5 rounded-full border text-sm transition ${
              active
                ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                : "bg-white/80 hover:bg-white border-slate-200 text-slate-700"
            }`}
            title={active ? "Remove skill" : "Add skill"}
          >
            {sk.name}
          </button>
        );
      })}
    </div>
  );

  return (
    <div className="rounded-3xl border border-slate-200 bg-gradient-to-b from-white to-slate-50 shadow-sm p-5 md:p-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2">
            <Users2 size={18} className="text-blue-600" />
            <h3 className="text-xl md:text-2xl font-semibold tracking-tight">
              Talent Discovery
            </h3>
          </div>
          <p className="text-[12px] md:text-xs text-slate-500 mt-1">
            Search and compare candidates by role skills, fit indicators, and momentum — separate from Screening.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={onRunSearch}
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 text-white px-3 py-2 hover:bg-blue-700"
            title="Run server-side search"
          >
            <Search size={16} />
            Search
          </button>
          <button
            onClick={exportCSV}
            className="inline-flex items-center gap-2 rounded-xl border px-3 py-2 bg-white hover:bg-slate-50"
            title="Export current results (CSV)"
          >
            <Download size={16} />
            Export CSV
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="mt-4 rounded-2xl border bg-white/80 p-4">
        <div className="flex items-center justify-between">
          <div className="inline-flex items-center gap-2 text-slate-700 font-medium">
            <Filter size={16} />
            Filters
          </div>
          <button
            onClick={() => setUi((u) => ({ ...u, showFilters: !u.showFilters }))}
            className="text-sm text-slate-600 hover:text-slate-800 inline-flex items-center gap-1"
          >
            {ui.showFilters ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            {ui.showFilters ? "Hide" : "Show"}
          </button>
        </div>

        {ui.showFilters && (
          <div className="mt-3 grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2">
              <div className="text-[12px] text-slate-500 mb-1">Required Skills</div>
              <div className="rounded-xl border bg-slate-50/60 p-3">{SkillFilterPills}</div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-[12px] text-slate-500">Min Skill Avg (0–10)</label>
                <input
                  type="range"
                  min={0}
                  max={10}
                  step={0.5}
                  value={minScore}
                  onChange={(e) => setSearch((s) => ({ ...s, minScore: Number(e.target.value) }))}
                  className="w-full"
                />
                <div className="text-xs text-slate-700 mt-1"><b>{minScore}</b></div>
              </div>

              <div>
                <label className="text-[12px] text-slate-500">Min Fit (0–10)</label>
                <input
                  type="range"
                  min={0}
                  max={10}
                  step={0.5}
                  value={minFit}
                  onChange={(e) => setSearch((s) => ({ ...s, minFit: Number(e.target.value) }))}
                  className="w-full"
                />
                <div className="text-xs text-slate-700 mt-1"><b>{minFit}</b></div>
              </div>
            </div>

            <div className="lg:col-span-3 grid gap-3 md:grid-cols-3">
              <div className="relative">
                <Search size={16} className="absolute left-3 top-2.5 text-slate-400" />
                <input
                  value={search.q || ""}
                  onChange={(e) => setSearch((s) => ({ ...s, q: e.target.value }))}
                  className="w-full pl-9 pr-3 py-2 rounded-xl border bg-white/70"
                  placeholder="Search name, email, or university…"
                />
              </div>
              <div className="relative">
                <SlidersHorizontal size={16} className="absolute left-3 top-2.5 text-slate-400" />
                <select
                  value={ui.sortBy}
                  onChange={(e) => setUi((u) => ({ ...u, sortBy: e.target.value, page: 1 }))}
                  className="appearance-none w-full pl-9 pr-9 py-2 rounded-xl border bg-white/70"
                  title="Sort by"
                >
                  <option value="fit-desc">Sort: Fit (high → low)</option>
                  <option value="fit-asc">Sort: Fit (low → high)</option>
                  <option value="avg-desc">Sort: Skill Avg (high → low)</option>
                  <option value="avg-asc">Sort: Skill Avg (low → high)</option>
                  <option value="name-asc">Sort: Name (A→Z)</option>
                </select>
              </div>
              <div className="relative">
                <select
                  value={ui.pageSize}
                  onChange={(e) => setUi((u) => ({ ...u, pageSize: Number(e.target.value), page: 1 }))}
                  className="appearance-none w-full pr-9 pl-3 py-2 rounded-xl border bg-white/70"
                  title="Page size"
                >
                  {[10, 20, 50].map((n) => (
                    <option key={n} value={n}>
                      {n} / page
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Result Summary */}
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <StatCard
          icon={<Gauge size={16} />}
          title="Candidates"
          value={sorted.length}
          caption={`${visible.length} shown on this page`}
        />
        <StatCard
          icon={<Sparkles size={16} />}
          title="Median Fit"
          value={median(sorted.map((r) => r.fitScore || 0)).toFixed(1)}
          caption="Across current result set"
        />
        <StatCard
          icon={<Star size={16} />}
          title="Median Required-Skill Avg"
          value={median(sorted.map((r) => r.avgRequiredSkillScore || 0)).toFixed(1)}
          caption="0–10 scale"
        />
      </div>

      {/* Table */}
      <div className="mt-4 overflow-x-auto rounded-2xl border bg-white/90">
        <table className="w-full text-sm">
          <thead className="bg-slate-50/80 border-b">
            <tr>
              <Th>Candidate</Th>
              <Th>Academics</Th>
              <Th center>Req Skill Avg</Th>
              <Th center>Fit</Th>
              <Th>Momentum</Th>
              <Th>Actions</Th>
            </tr>
          </thead>
          <tbody>
            {visible.length === 0 ? (
              <tr>
                <td className="p-6 text-slate-600" colSpan={6}>
                  No matches. Adjust filters and search again.
                </td>
              </tr>
            ) : (
              visible.map((row, idx) => {
                const id = `cand-${(page - 1) * ui.pageSize + idx}`;
                const expanded = ui.expandedId === id;
                const name = row.student?.name || "—";
                const email = row.student?.email || "—";
                const uni = row.student?.university || "—";
                const fit = toFixedNum(row.fitScore, 1);
                const avg = toFixedNum(row.avgRequiredSkillScore, 1);

                return (
                  <tr key={id} className="border-b align-top">
                    {/* Candidate */}
                    <td className="p-3">
                      <div className="flex items-start gap-3">
                        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 grid place-items-center border text-blue-700 font-semibold">
                          {getInitials(name)}
                        </div>
                        <div>
                          <div className="font-medium">{name}</div>
                          <div className="text-xs text-slate-500">{email}</div>
                          <div className="text-[11px] text-slate-400 mt-1">
                            {row.yearsExperience != null && (
                              <span className="inline-flex items-center gap-1 mr-3">
                                <Briefcase size={12} /> {row.yearsExperience} yrs
                              </span>
                            )}
                            {row.lastUpdated && (
                              <span className="inline-flex items-center gap-1">
                                <Calendar size={12} /> {formatDate(row.lastUpdated)}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Academics */}
                    <td className="p-3">
                      <div className="inline-flex items-center gap-2 text-slate-700">
                        <GraduationCap size={14} />
                        <span className="font-medium">{uni}</span>
                      </div>
                      {(row.highlights || []).length > 0 && (
                        <div className="mt-1 flex flex-wrap gap-1">
                          {(row.highlights || []).slice(0, 4).map((h, i) => (
                            <span
                              key={i}
                              className="px-2 py-0.5 text-[11px] rounded-full bg-slate-50 border text-slate-700"
                            >
                              {h}
                            </span>
                          ))}
                        </div>
                      )}
                    </td>

                    {/* Required skill average */}
                    <td className="p-3 text-center">
                      <ScoreBadge value={avg} tone={avg >= 8 ? "emerald" : avg >= 6 ? "amber" : "rose"} />
                      <div className="mt-2">
                        <MiniCharts
                          title="Req skills"
                          series={[
                            {
                              name: "Skill Avg",
                              data: (row.trends?.skills || []).slice(-18),
                            },
                          ]}
                        />
                      </div>
                    </td>

                    {/* Fit */}
                    <td className="p-3 text-center">
                      <ScoreBadge value={fit} tone={fit >= 8 ? "emerald" : fit >= 6 ? "amber" : "rose"} />
                      <div className="mt-2">
                        <MiniCharts
                          title="Fit"
                          series={[
                            {
                              name: "Fit",
                              data: (row.trends?.fit || []).slice(-18),
                            },
                          ]}
                        />
                      </div>
                    </td>

                    {/* Momentum & Expand */}
                    <td className="p-3">
                      <div className="text-xs text-slate-500">Momentum</div>
                      <div className="text-sm font-medium">
                        {trendLabel(row.trends)}
                      </div>
                      <button
                        className="mt-2 inline-flex items-center gap-1 text-xs text-indigo-700"
                        onClick={() =>
                          setUi((u) => ({ ...u, expandedId: expanded ? null : id }))
                        }
                      >
                        {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                        {expanded ? "Hide details" : "View details"}
                      </button>

                      {expanded && (
                        <div className="mt-3 rounded-xl border bg-slate-50/70 p-3 text-xs">
                          <div className="grid gap-2">
                            <div className="flex items-center gap-2">
                              <Building2 size={12} className="text-slate-500" />
                              <div className="text-slate-700">
                                Target role-skill alignment improved over last cycles if Fit & Avg lines trend up.
                              </div>
                            </div>
                            {row.student?.phone && (
                              <div className="flex items-center gap-2">
                                <Phone size={12} className="text-slate-500" />
                                <span className="text-slate-700">{row.student.phone}</span>
                              </div>
                            )}
                            <div className="flex items-center gap-2">
                              <Mail size={12} className="text-slate-500" />
                              <span className="text-slate-700">{email}</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="p-3">
                      <div className="flex flex-col gap-2">
                        <button
                          onClick={() => onShortlist?.(row)}
                          className="rounded-xl border bg-white hover:bg-slate-50 px-3 py-1.5 text-xs"
                          title="Shortlist"
                        >
                          Shortlist
                        </button>
                        <button
                          onClick={() => onInviteInterview?.(row)}
                          className="rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 px-3 py-1.5 text-xs"
                          title="Invite to interview"
                        >
                          Invite Interview
                        </button>
                        <button
                          onClick={() => onNote?.(row)}
                          className="rounded-xl border bg-white hover:bg-slate-50 px-3 py-1.5 text-xs"
                          title="Add internal note"
                        >
                          Add Note
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="mt-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div className="text-xs text-slate-500">
          Showing <b>{visible.length}</b> of <b>{sorted.length}</b> candidates
        </div>
        <div className="inline-flex rounded-xl border bg-white">
          <button
            onClick={() => setUi((u) => ({ ...u, page: Math.max(1, u.page - 1) }))}
            className="px-3 py-2 text-sm hover:bg-slate-50 border-r"
            disabled={page <= 1}
          >
            Prev
          </button>
          <div className="px-3 py-2 text-sm">{page} / {totalPages}</div>
          <button
            onClick={() => setUi((u) => ({ ...u, page: Math.min(totalPages, u.page + 1) }))}
            className="px-3 py-2 text-sm hover:bg-slate-50 border-l"
            disabled={page >= totalPages}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}

/* ----------------------------- Small atoms ----------------------------- */

function Th({ children, center = false }) {
  return (
    <th className={`p-3 text-[12px] text-slate-500 ${center ? "text-center" : "text-left"}`}>
      {children}
    </th>
  );
}

function StatCard({ icon, title, value, caption }) {
  return (
    <div className="rounded-2xl border bg-white/90 p-4 shadow-[0_1px_0_#eef2f7_inset]">
      <div className="flex items-center justify-between">
        <div className="text-slate-500">{icon}</div>
        <div className="text-[11px] text-slate-400">{caption}</div>
      </div>
      <div className="mt-1 text-[12px] text-slate-500">{title}</div>
      <div className="text-xl font-semibold">{value}</div>
    </div>
  );
}

function ScoreBadge({ value, tone }) {
  const map = {
    emerald: "bg-emerald-50 text-emerald-700 border-emerald-200",
    amber: "bg-amber-50 text-amber-700 border-amber-200",
    rose: "bg-rose-50 text-rose-700 border-rose-200",
    slate: "bg-slate-50 text-slate-700 border-slate-200",
  };
  const cls = map[tone] || map.slate;
  return (
    <span className={`inline-flex items-center justify-center min-w-[64px] px-2 py-1 rounded-full border text-sm ${cls}`}>
      {value ?? "—"}
    </span>
  );
}

/* ----------------------------- Utilities ----------------------------- */

function median(arr) {
  const a = (arr || []).slice().sort((x, y) => x - y);
  if (!a.length) return 0;
  const m = Math.floor(a.length / 2);
  return a.length % 2 ? a[m] : (a[m - 1] + a[m]) / 2;
}

function safe(v) {
  return v == null ? "" : String(v);
}

function csvCell(s) {
  const v = String(s ?? "");
  if (v.includes(",") || v.includes('"') || v.includes("\n")) {
    return `"${v.replace(/"/g, '""')}"`;
  }
  return v;
}

function toFixedNum(n, d = 1) {
  if (n == null || isNaN(Number(n))) return null;
  return Number(Number(n).toFixed(d));
}

function formatDate(x) {
  try {
    const dt = new Date(x);
    if (isNaN(dt.getTime())) return "—";
    return dt.toLocaleDateString();
  } catch {
    return "—";
  }
}

function getInitials(name) {
  const parts = String(name || "")
    .trim()
    .split(/\s+/)
    .slice(0, 2);
  const s = parts.map((p) => p[0]?.toUpperCase() || "").join("");
  return s || "U";
}
function trendLabel(trends) {
  if (!trends) return "—";
  const skill = (trends.skills || []).map((p) => p.y);
  const fit = (trends.fit || []).map((p) => p.y);

  const delta = (arr) => {
    if (!arr.length) return 0;
    const first = arr[0];
    const last = arr[arr.length - 1];
    return last - first;
  };

  const dSkill = delta(skill);
  const dFit = delta(fit);

  if (dSkill > 0.5 && dFit > 0.5) return "Improving";
  if (dSkill < -0.5 && dFit < -0.5) return "Declining";
  if (dSkill > 0.5 || dFit > 0.5) return "Mixed ↑";
  if (dSkill < -0.5 || dFit < -0.5) return "Mixed ↓";
  return "Stable";
}
