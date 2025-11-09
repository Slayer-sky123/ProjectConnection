// src/components/company/Screening.jsx
import { useEffect, useRef, useState } from "react";
import {
  Bot,
  MoreHorizontal,
  ChevronDown,
  ChevronRight,
  FileBarChart2,
  CheckCircle2,
  XCircle,
  ClipboardList,
  Video,
  FileDown,
  FileSpreadsheet,
  Sparkles,
  Info,
  X,
} from "lucide-react";
import API from "../../api/axios";
import TestBuilderDrawer from "./TestBuilderDrawer";
import InsightsPanel from "./insights/InsightsPanel";
import Sparkline from "./charts/Sparkline";
import MiniCharts from "./charts/MiniCharts";

/* --------------------------------- UI TOKENS -------------------------------- */
const BRAND = "#1A55E3";
const BRAND_SOFT = "#5E6EED";

/* ---------------------------------- ATOMS ----------------------------------- */
const Chip = ({ children, tone }) => {
  const map = {
    slate: "bg-slate-50 text-slate-700 border-slate-200",
    blue: "bg-blue-50 text-blue-700 border-blue-200",
    amber: "bg-amber-50 text-amber-700 border-amber-200",
    rose: "bg-rose-50 text-rose-700 border-rose-200",
    emerald: "bg-emerald-50 text-emerald-700 border-emerald-200",
    indigo: "bg-indigo-50 text-indigo-700 border-indigo-200",
  };
  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-full border text-xs ${map[tone]}`}
    >
      {children}
    </span>
  );
};

function Meter({ value, max = 100, label }) {
  const pct =
    value != null ? Math.max(0, Math.min(100, (value / max) * 100)) : 0;
  return (
    <div className="min-w-[140px]">
      <div className="flex items-center justify-between text-[11px] text-slate-600 mb-1">
        <span>{label}</span>
        <b className="text-slate-800">{value ?? "—"}</b>
      </div>
      <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
        <div
          className="h-full rounded-full"
          style={{
            width: `${pct}%`,
            background: `linear-gradient(90deg,${BRAND},${BRAND_SOFT})`,
          }}
        />
      </div>
    </div>
  );
}

/* --------------------------------- HELPERS ---------------------------------- */
function toCSV(rows) {
  return rows
    .map((r) =>
      r.map((c) => `"${String(c ?? "").replace(/"/g, '""')}"`).join(",")
    )
    .join("\n");
}
function downloadBlob(filename, mime, textOrBuffer) {
  const blob = new Blob([textOrBuffer], { type: mime });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}

/* --------------------------------- TOOLTIP ---------------------------------- */
function Tooltip({ content, children, side = "top" }) {
  return (
    <span className="relative inline-flex group/tt">
      {children}
      <span
        role="tooltip"
        className={`pointer-events-none invisible opacity-0 group-hover/tt:visible group-hover/tt:opacity-100 transition-all duration-150 absolute z-40
          ${
            side === "top"
              ? "bottom-full mb-2 left-1/2 -translate-x-1/2"
              : "top-full mt-2 left-1/2 -translate-x-1/2"
          }
          rounded-lg border border-slate-200 bg-white px-2 py-1 text-[11px] text-slate-700 shadow-xl backdrop-blur-sm`}
      >
        {content}
        <span className="absolute w-2 h-2 bg-white border border-slate-200 rotate-45 left-1/2 -translate-x-1/2 top-full -mt-[5px]" />
      </span>
    </span>
  );
}

/* ------------------------------- KEBAB MENU --------------------------------- */
function useClickOutside(ref, onClose) {
  useEffect(() => {
    function handler(e) {
      if (!ref.current) return;
      if (!ref.current.contains(e.target)) onClose?.();
    }
    document.addEventListener("mousedown", handler);
    document.addEventListener("touchstart", handler);
    return () => {
      document.removeEventListener("mousedown", handler);
      document.removeEventListener("touchstart", handler);
    };
  }, [ref, onClose]);
}

function KebabMenu({ items = [], onClose, align = "right" }) {
  const boxRef = useRef(null);
  useClickOutside(boxRef, onClose);
  return (
    <div
      ref={boxRef}
      role="menu"
      aria-label="More actions"
      className={`z-40 absolute ${align === "right" ? "right-0" : "left-0"} mt-2 w-52
        rounded-2xl border border-white/60 bg-white/80 backdrop-blur-xl
        shadow-[0_20px_40px_rgba(2,6,23,0.18)] ring-1 ring-slate-200/50
        animate-[ui-scale-in_0.12s_ease-out_forwards]`}
    >
      <ul className="py-2 text-sm text-slate-800">
        {items.map((it, idx) => (
          <li key={idx}>
            <button
              type="button"
              role="menuitem"
              disabled={it.disabled}
              onClick={() => {
                it.onClick?.();
                onClose?.();
              }}
              className={`w-full flex items-center gap-2 px-3.5 py-2.5 text-left rounded-xl mx-1 my-0.5
               hover:bg-slate-100/70 transition
               ${it.danger ? "text-rose-600 hover:text-rose-700" : ""}
               ${it.disabled ? "opacity-50 cursor-not-allowed" : ""}`}
              title={it.title}
            >
              {it.icon}
              <span className="truncate">{it.label}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ------------------------------ RESULTS DRAWER ------------------------------ */
function ResultsDrawer({ open, application, onClose }) {
  const [data, setData] = useState(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const load = async () => {
    if (!application?._id) return;
    setBusy(true);
    setErr("");
    try {
      let res;
      try {
        res = await API.get(
          `/company/screening/applications/${application._id}/results`
        );
      } catch {
        res = await API.get(`/company/screening/results`, {
          params: { applicationId: application._id },
        });
      }
      setData(res.data || null);
    } catch (e) {
      console.error("results load failed:", e);
      setErr(e?.response?.data?.message || "Failed to load results");
      setData(null);
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    if (open) load(); // eslint-disable-line react-hooks/exhaustive-deps
  }, [open, application?._id]);

  const aiScan = async () => {
    if (!application?._id) return;
    setBusy(true);
    try {
      await API.post(`/company/applications/${application._id}/ai-screen`);
      await load();
    } catch (e) {
      alert(e?.response?.data?.message || "AI scan failed");
    } finally {
      setBusy(false);
    }
  };

  const exportCSV = () => {
    if (!data) return;
    const rows = [
      ["Section", "When", "Title/Skill", "Score", "Total", "Percent"],
      ...(data.tables?.skills || []).map((r) => [
        "Skill",
        new Date(r.when).toLocaleString(),
        r.skill,
        r.score,
        r.total,
        r.pct ?? "",
      ]),
      ...(data.tables?.aptitude || []).map((r) => [
        "Aptitude",
        new Date(r.when).toLocaleString(),
        r.title,
        r.score,
        r.total,
        r.pct ?? "",
      ]),
      ...(data.tables?.recruiter || []).map((r) => [
        "Recruiter",
        new Date(r.when).toLocaleString(),
        r.title,
        r.score,
        r.total,
        r.pct ?? "",
      ]),
    ];
    downloadBlob(
      `results_${data?.application?.student?.name?.replace(/\s+/g, "_") || "candidate"}.csv`,
      "text/csv;charset=utf-8",
      toCSV(rows)
    );
  };

  const exportPDF = () => {
    // Simple client print; your backend export endpoints can be linked here if available.
    window.print();
  };

  if (!open) return null;

  const kpi = data?.kpi || {};
  const ats = data?.ats || {};
  const series = data?.series || {};
  const candidateName = data?.application?.student?.name || application?.student?.name || "Candidate";

  return (
    <div
      className="fixed inset-0 z-[80] bg-black/50 grid print:bg-transparent"
      style={{ gridTemplateColumns: "1fr min(1024px, 100vw)" }}
    >
      <div onClick={onClose} className="cursor-pointer print:hidden" />

      <div className="bg-white h-full overflow-y-auto border-l border-slate-200 flex flex-col">
        {/* Sticky Drawer Header */}
        <div className="sticky top-0 z-10 px-4 py-3 border-b bg-white/80 backdrop-blur flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-9 w-9 rounded-xl bg-slate-100 grid place-items-center text-slate-600 text-xs font-semibold">
              {candidateName?.[0]?.toUpperCase() || "C"}
            </div>
            <div className="min-w-0">
              <div className="font-semibold truncate">{candidateName}</div>
              <div className="text-[11px] text-slate-500 truncate">
                Results & Insights
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* (Optionally) server-side exports could be plain anchors; keeping client-side here */}
            <Tooltip content="Export results to CSV">
              <button onClick={exportCSV} className="btn btn-ghost btn-sm text-xs">
                <FileSpreadsheet size={14} /> CSV
              </button>
            </Tooltip>
            <Tooltip content="Print / Save as PDF">
              <button onClick={exportPDF} className="btn btn-ghost btn-sm text-xs">
                <FileDown size={14} /> PDF
              </button>
            </Tooltip>
            <Tooltip content="Run AI scan on resume & tests">
              <button onClick={aiScan} disabled={busy} className="btn btn-primary btn-sm text-xs">
                <Bot size={14} /> {busy ? "Scanning…" : "AI Scan"}
              </button>
            </Tooltip>
            <button
              onClick={onClose}
              className="btn btn-ghost btn-sm text-xs"
              title="Close drawer"
              aria-label="Close"
            >
              <X size={14} />
            </button>
          </div>
        </div>

        {/* Drawer Body */}
        {busy && !data ? (
          <div className="p-6 text-slate-600">Loading…</div>
        ) : err ? (
          <div className="p-6 text-rose-600">{err}</div>
        ) : !data ? (
          <div className="p-6 text-slate-600">No results yet for this candidate.</div>
        ) : (
          <div className="p-6 space-y-6">
            {/* KPI / ATS Summary */}
            <div className="grid md:grid-cols-3 gap-4">
              {/* KPIs */}
              <div className="rounded-2xl ring-1 ring-slate-200/70 bg-white p-4 shadow-sm">
                <div className="text-sm font-semibold mb-2">Key Scores</div>
                <ul className="text-sm divide-y divide-slate-100">
                  <li className="py-2 flex items-center justify-between">
                    <span className="text-slate-600">Resume Score</span>
                    <span className="font-semibold">{kpi.atsResume ?? "—"}</span>
                  </li>
                  <li className="py-2 flex items-center justify-between">
                    <span className="text-slate-600">Fit Score</span>
                    <span className="font-semibold">{kpi.atsFit ?? "—"}</span>
                  </li>
                  <li className="py-2 flex items-center justify-between">
                    <span className="text-slate-600">Avg Skill</span>
                    <span className="font-semibold">{kpi.avgSkill ?? "—"}</span>
                  </li>
                  <li className="py-2 flex items-center justify-between">
                    <span className="text-slate-600">Avg Aptitude</span>
                    <span className="font-semibold">{kpi.avgAptitude ?? "—"}</span>
                  </li>
                  <li className="py-2 flex items-center justify-between">
                    <span className="text-slate-600">Recruiter Avg</span>
                    <span className="font-semibold">{kpi.recruiterAvg ?? "—"}</span>
                  </li>
                </ul>
              </div>

              {/* Signals */}
              <div className="rounded-2xl ring-1 ring-slate-200/70 bg-white p-4 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm font-semibold">Signals</div>
                  <Sparkles size={18} className="text-slate-500" />
                </div>
                <div className="mb-3">
                  <div className="text-[12px] text-slate-500 mb-1">Top Skills (ATS)</div>
                  <div className="flex flex-wrap gap-2">
                    {(ats.topSkills || []).length ? (
                      ats.topSkills.map((s, i) => (
                        <span
                          key={i}
                          className="px-2 py-1 text-xs rounded-full bg-slate-50 ring-1 ring-slate-200/70"
                        >
                          {s}
                        </span>
                      ))
                    ) : (
                      <div className="text-xs text-slate-500">—</div>
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  {(ats.riskFlags || []).length ? (
                    ats.riskFlags.map((r, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs text-amber-700">
                        • {r}
                      </div>
                    ))
                  ) : (
                    <div className="text-xs text-slate-500">No risk flags.</div>
                  )}
                </div>
              </div>

              {/* ATS Overview */}
              <div className="rounded-2xl ring-1 ring-slate-200/70 bg-white p-4 shadow-sm">
                <div className="text-sm font-semibold mb-2">ATS Overview</div>
                <div className="text-xs text-slate-600">
                  <div className="mb-2">
                    <b>Education:</b> {ats.education || "—"}
                  </div>
                  <div className="mb-2">
                    <b>Experience:</b> {ats.experienceSummary || "—"}
                  </div>
                  <div className="mt-3">
                    <Meter value={kpi.atsResume} label="Resume Score" />
                  </div>
                </div>
              </div>
            </div>

            {/* Charts */}
            <div className="grid md:grid-cols-2 gap-4">
              <div className="rounded-2xl ring-1 ring-slate-200/70 bg-white p-4 shadow-sm">
                <div className="text-sm font-semibold mb-3">Score Trends</div>
                <div className="space-y-3">
                  <Sparkline label="Skill" color="#3b82f6" data={series.skillTimeline || []} />
                  <Sparkline label="Aptitude" color="#10b981" data={series.aptitudeTimeline || []} />
                  <Sparkline label="Recruiter Tests" color="#6366f1" data={series.recruiterTimeline || []} />
                </div>
              </div>
              <div className="rounded-2xl ring-1 ring-slate-200/70 bg-white p-4 shadow-sm">
                <MiniCharts
                  title="Combined Progress"
                  series={[
                    { name: "Skill", data: series.skillTimeline || [] },
                    { name: "Aptitude", data: series.aptitudeTimeline || [] },
                    { name: "Recruiter", data: series.recruiterTimeline || [] },
                  ]}
                />
              </div>
            </div>

            {/* Detailed Tables */}
            <div className="rounded-2xl ring-1 ring-slate-200/70 bg-white p-4 shadow-sm">
              <div className="text-sm font-semibold mb-3">Detailed Results</div>
              <div className="grid gap-4 md:grid-cols-3">
                {/* Skill table */}
                <div>
                  <div className="flex items-center gap-1 text-xs font-medium text-slate-600 mb-2">
                    Skill Tests
                    <Tooltip content="Individual skill test attempts and scores">
                      <Info size={14} className="text-slate-400" />
                    </Tooltip>
                  </div>
                  <div className="rounded-xl ring-1 ring-slate-200/70 bg-slate-50/70 max-h-[280px] overflow-auto">
                    <table className="w-full text-xs">
                      <thead className="sticky top-0 bg-slate-100">
                        <tr>
                          <th className="p-2 text-left">When</th>
                          <th className="p-2 text-left">Skill</th>
                          <th className="p-2 text-right">Score</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(data.tables?.skills || []).map((r, i) => (
                          <tr key={i} className="border-t">
                            <td className="p-2">{new Date(r.when).toLocaleString()}</td>
                            <td className="p-2">{r.skill}</td>
                            <td className="p-2 text-right">
                              <b>{r.score}</b>{" "}
                              {r.total ? <span className="text-slate-500">/ {r.total}</span> : null}
                            </td>
                          </tr>
                        ))}
                        {!data.tables?.skills?.length && (
                          <tr>
                            <td className="p-2 text-slate-500" colSpan={3}>
                              —
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Aptitude table */}
                <div>
                  <div className="flex items-center gap-1 text-xs font-medium text-slate-600 mb-2">
                    Aptitude Tests
                    <Tooltip content="General aptitude test performance">
                      <Info size={14} className="text-slate-400" />
                    </Tooltip>
                  </div>
                  <div className="rounded-xl ring-1 ring-slate-200/70 bg-slate-50/70 max-h-[280px] overflow-auto">
                    <table className="w-full text-xs">
                      <thead className="sticky top-0 bg-slate-100">
                        <tr>
                          <th className="p-2 text-left">When</th>
                          <th className="p-2 text-left">Title</th>
                          <th className="p-2 text-right">Score</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(data.tables?.aptitude || []).map((r, i) => (
                          <tr key={i} className="border-t">
                            <td className="p-2">{new Date(r.when).toLocaleString()}</td>
                            <td className="p-2">{r.title}</td>
                            <td className="p-2 text-right">
                              <b>{r.score}</b>{" "}
                              {r.total ? <span className="text-slate-500">/ {r.total}</span> : null}
                            </td>
                          </tr>
                        ))}
                        {!data.tables?.aptitude?.length && (
                          <tr>
                            <td className="p-2 text-slate-500" colSpan={3}>
                              —
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Recruiter table */}
                <div>
                  <div className="flex items-center gap-1 text-xs font-medium text-slate-600 mb-2">
                    Recruiter Tests
                    <Tooltip content="Company-created custom assessments">
                      <Info size={14} className="text-slate-400" />
                    </Tooltip>
                  </div>
                  <div className="rounded-xl ring-1 ring-slate-200/70 bg-slate-50/70 max-h-[280px] overflow-auto">
                    <table className="w-full text-xs">
                      <thead className="sticky top-0 bg-slate-100">
                        <tr>
                          <th className="p-2 text-left">When</th>
                          <th className="p-2 text-left">Title</th>
                          <th className="p-2 text-right">Score</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(data.tables?.recruiter || []).map((r, i) => (
                          <tr key={i} className="border-t">
                            <td className="p-2">{new Date(r.when).toLocaleString()}</td>
                            <td className="p-2">{r.title}</td>
                            <td className="p-2 text-right">
                              <b>{r.score}</b>{" "}
                              {r.total ? <span className="text-slate-500">/ {r.total}</span> : null}
                            </td>
                          </tr>
                        ))}
                        {!data.tables?.recruiter?.length && (
                          <tr>
                            <td className="p-2 text-slate-500" colSpan={3}>
                              —
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer CTA */}
            <div className="rounded-2xl ring-1 ring-slate-200/70 bg-white p-4 shadow-sm flex flex-wrap items-center justify-between gap-2">
              <div className="text-sm text-slate-700">
                Use insights, timelines, and ATS to make a confident decision.
              </div>
              <div className="flex items-center gap-2">
                <button
                  className="btn btn-primary text-xs"
                  onClick={() => {
                    // Move-to-hire action hook (left to your flow)
                  }}
                >
                  Move to Hire
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ----------------------------- MAIN PAGE VIEW ------------------------------ */

export default function ScreeningTab({
  applications,
  updateAppStatus,
  aiScanOne,
  aiScanAll,
  toAbsolute,
  onRefresh,
}) {
  const [scanBusyId, setScanBusyId] = useState(null);
  const [openBuilderFor, setOpenBuilderFor] = useState(null);
  const [expandedId, setExpandedId] = useState(null);
  const [openResultsFor, setOpenResultsFor] = useState(null);
  const [menuFor, setMenuFor] = useState(null);

  return (
    <>
      {/* Page Header - full width hero with shadow */}
      <div className="mt-6">
        <header className="bg-white/95 backdrop-blur rounded-2xl shadow-lg ring-1 ring-slate-200/70 px-5 py-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div>
              <h1 className="text-2xl font-semibold text-slate-900">
                Smart Candidate Screening
              </h1>
              <p className="text-xs text-slate-500 mt-1">
                ATS resume score is visible in Results. Use quick peek for inline insights.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={async () => {
                  if (!applications?.length) return;
                  await aiScanAll?.(setScanBusyId);
                }}
                className="btn btn-primary"
                title="Run AI Scan for all applications"
              >
                <Bot size={16} />
                AI Scan All
              </button>
              <button onClick={onRefresh} className="btn btn-ghost" title="Refresh applications">
                Refresh
              </button>
            </div>
          </div>
        </header>
      </div>

      {/* Content */}
      {applications.length === 0 ? (
        <div className="mt-6 bg-white/95 backdrop-blur rounded-2xl shadow-lg ring-1 ring-slate-200/70 px-6 py-10 text-sm text-slate-600">
          No applications yet.
        </div>
      ) : (
        <section className="mt-6">
          {/* Full-width, glassy, shadowed panel */}
          <div className="bg-white/95 backdrop-blur rounded-3xl shadow-[0_12px_40px_rgba(2,6,23,0.06)] ring-1 ring-slate-200/70 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50/80">
                  <tr className="[&>th]:p-4 [&>th]:text-left [&>th]:font-semibold [&>th]:text-slate-600">
                    <th>Candidate</th>
                    <th className="text-center">Job</th>
                    <th className="text-center">Resume</th>
                    <th className="text-center">Interview</th>
                    <th>Insights</th>
                    <th className="text-right">Actions</th>
                  </tr>
                </thead>

                <tbody className="[&>tr]:border-t [&>tr]:border-slate-100">
                  {applications.map((a) => {
                    const iv = a.interview;
                    const windowText = iv?.startsAt
                      ? `${new Date(iv.startsAt).toLocaleString()} • ${
                          iv.durationMins || 45
                        }m (${iv.stage || "screening"})`
                      : "—";
                    const fit = a.screening?.fitScore ?? null;
                    const test =
                      a.screening?.testScore != null
                        ? Math.round(a.screening.testScore * 10) / 10
                        : null;
                    const expanded = expandedId === a._id;
                    const isOpen = menuFor === a._id;

                    const statusTip =
                      a.status === "shortlisted"
                        ? "Candidate shortlisted for next stage"
                        : a.status === "interview"
                        ? "Interview scheduled / in progress"
                        : a.status === "offer"
                        ? "Offer made to candidate"
                        : a.status === "rejected"
                        ? "Candidate rejected"
                        : "Applied / under screening";

                    const statusTone =
                      a.status === "shortlisted"
                        ? "indigo"
                        : a.status === "interview"
                        ? "blue"
                        : a.status === "offer"
                        ? "emerald"
                        : a.status === "rejected"
                        ? "rose"
                        : "slate";

                    return (
                      <tr key={a._id} className="hover:bg-slate-50/40 transition-colors">
                        {/* Candidate */}
                        <td className="p-4">
                          <div className="flex items-start gap-3">
                            <div className="h-10 w-10 rounded-xl bg-slate-100 grid place-items-center text-slate-500 text-xs font-semibold">
                              {a.student?.name?.[0]?.toUpperCase() || "U"}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <div className="font-medium text-gray-900 truncate max-w-[200px]">
                                  {a.student?.name || "Unknown"}
                                </div>
                                <Tooltip content={statusTip}>
                                  <Chip tone={statusTone}>{a.status || "applied"}</Chip>
                                </Tooltip>
                              </div>
                              <div className="text-xs text-gray-500 truncate max-w-[260px]">
                                {a.student?.email}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Job */}
                        <td className="p-4 text-center">
                          <div className="truncate max-w-[180px] mx-auto">{a.job?.title || "—"}</div>
                        </td>

                        {/* Resume */}
                        <td className="p-4 text-center">
                          {a.cvUrl ? (
                            <Tooltip content="Download candidate resume">
                              <a
                                className="text-[--brand] underline"
                                href={toAbsolute(a.cvUrl)}
                                target="_blank"
                                rel="noreferrer"
                                download
                                style={{ ["--brand"]: BRAND }}
                              >
                                Resume
                              </a>
                            </Tooltip>
                          ) : (
                            "-"
                          )}
                        </td>

                        {/* Interview */}
                        <td className="p-4 text-center">
                          <div className="text-xs">{windowText}</div>
                          {iv?.roomId && (
                            <div className="flex items-center justify-center gap-3 mt-1">
                              <a
                                href={`/company/webinar/${iv.roomId}`}
                                className="text-[#5E6EED] underline text-xs"
                              >
                                Host
                              </a>
                              <a
                                href={`/student/webinars/webinar/${iv.roomId}`}
                                className="text-[#0DCAF0] underline text-xs"
                              >
                                Student
                              </a>
                            </div>
                          )}
                        </td>

                        {/* Insights */}
                        <td className="p-4">
                          <div className="flex flex-wrap items-center gap-4">
                            <Meter value={test != null ? test * 10 : null} label="Test" />
                            <div>
                              <div className="flex items-center gap-1">
                                <div className="text-[11px] text-slate-600 mb-1">Fit</div>
                                <Tooltip content="Overall fit score from AI screening">
                                  <Info size={12} className="text-slate-400" />
                                </Tooltip>
                              </div>
                              <Tooltip
                                content={
                                  fit == null
                                    ? "Fit score not available"
                                    : fit >= 80
                                    ? "Strong fit"
                                    : fit >= 60
                                    ? "Moderate fit"
                                    : "Low fit"
                                }
                              >
                                <Chip
                                  tone={
                                    fit == null
                                      ? "slate"
                                      : fit >= 80
                                      ? "emerald"
                                      : fit >= 60
                                      ? "amber"
                                      : "rose"
                                  }
                                >
                                  {fit ?? "—"}
                                </Chip>
                              </Tooltip>
                            </div>
                            <button
                              className="ml-auto inline-flex items-center gap-1 text-xs"
                              onClick={() => setExpandedId(expanded ? null : a._id)}
                              style={{ color: BRAND }}
                            >
                              {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                              {expanded ? "Hide" : "Quick peek"}
                            </button>
                          </div>

                          {expanded && (
                            <div className="mt-3 rounded-xl border bg-slate-50/70 p-3 text-xs text-slate-700">
                              <InsightsPanel applicationId={a._id} compact />
                              <div className="text-[11px] text-slate-500 mt-2">
                                Full ATS & AI details in Results.
                              </div>
                            </div>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="p-4">
                          <div className="flex items-center justify-end gap-2 relative">
                            <Tooltip content="Shortlist candidate">
                              <button
                                title="Shortlist"
                                onClick={() => updateAppStatus(a._id, "shortlisted")}
                                className="btn btn-primary btn-sm text-xs inline-flex items-center gap-1"
                                style={{ backgroundColor: BRAND }}
                              >
                                <CheckCircle2 size={14} />
                                Shortlist
                              </button>
                            </Tooltip>

                            <Tooltip content="Open results & insights">
                              <button
                                onClick={() => setOpenResultsFor(a)}
                                title="Results"
                                className="btn btn-ghost btn-sm text-xs inline-flex items-center gap-1"
                              >
                                <FileBarChart2 size={14} />
                                Results
                              </button>
                            </Tooltip>

                            <div className="relative">
                              <Tooltip content="More actions">
                                <button
                                  type="button"
                                  className="btn btn-ghost btn-sm p-2"
                                  aria-haspopup="menu"
                                  aria-expanded={menuFor === a._id ? "true" : "false"}
                                  aria-label="More actions"
                                  onClick={() => setMenuFor(menuFor === a._id ? null : a._id)}
                                >
                                  <MoreHorizontal size={16} />
                                </button>
                              </Tooltip>

                              {menuFor === a._id && (
                                <KebabMenu
                                  onClose={() => setMenuFor(null)}
                                  items={[
                                    {
                                      label: "Assessment",
                                      title: "Open Assessment Center",
                                      icon: <ClipboardList size={14} />,
                                      onClick: () => setOpenBuilderFor(a),
                                    },
                                    {
                                      label: "Join Interview",
                                      title: "Open host room",
                                      icon: <Video size={14} />,
                                      disabled: !a.interview?.roomId,
                                      onClick: () =>
                                        (window.location.href = `/company/webinar/${a.interview.roomId}`),
                                    },
                                    {
                                      label: "Reject",
                                      title: "Mark candidate as rejected",
                                      icon: <XCircle size={14} />,
                                      danger: true,
                                      onClick: () => updateAppStatus(a._id, "rejected"),
                                    },
                                    // Optional per-candidate AI Scan (kept intact)
                                    // {
                                    //   label: scanBusyId === a._id ? "Scanning…" : "AI Scan",
                                    //   title: "Run AI scan for this candidate",
                                    //   icon: <Bot size={14} />,
                                    //   disabled: scanBusyId === a._id,
                                    //   onClick: async () => {
                                    //     setScanBusyId(a._id);
                                    //     await aiScanOne(a._id, () => setScanBusyId(null));
                                    //   },
                                    // },
                                  ]}
                                />
                              )}
                            </div>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}

      {/* Drawers */}
      <TestBuilderDrawer
        open={!!openBuilderFor}
        onClose={() => setOpenBuilderFor(null)}
        application={openBuilderFor}
        onChanged={onRefresh}
      />
      <ResultsDrawer
        open={!!openResultsFor}
        application={openResultsFor}
        onClose={() => setOpenResultsFor(null)}
      />
    </>
  );
}
