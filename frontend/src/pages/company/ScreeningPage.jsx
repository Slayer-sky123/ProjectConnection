import { useEffect, useState } from "react";
import { Bot, Calendar, ChevronDown, ChevronRight, FileBarChart2, CheckCircle2, XCircle, ClipboardList, Video } from "lucide-react";
import API from "../../api/axios";
import TestBuilderDrawer from "../../components/company/TestBuilderDrawer";
import InsightsPanel from "../../components/company/insights/InsightsPanel";

const Chip = ({ children, tone }) => {
  const map = {
    slate: "bg-slate-50 text-slate-700 border-slate-200",
    blue: "bg-blue-50 text-blue-700 border-blue-200",
    amber: "bg-amber-50 text-amber-700 border-amber-200",
    rose: "bg-rose-50 text-rose-700 border-rose-200",
    emerald: "bg-emerald-50 text-emerald-700 border-emerald-200",
  };
  return <span className={`inline-flex items-center px-2.5 py-1 rounded-full border text-xs ${map[tone]}`}>{children}</span>;
};

function Meter({ value, max = 100, label }) {
  const pct = value != null ? Math.max(0, Math.min(100, (value / max) * 100)) : 0;
  return (
    <div className="min-w-[140px]">
      <div className="flex items-center justify-between text-[11px] text-slate-600 mb-1">
        <span>{label}</span>
        <b className="text-slate-800">{value ?? "—"}</b>
      </div>
      <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: "linear-gradient(90deg,#60a5fa,#6366f1)" }} />
      </div>
    </div>
  );
}

/* Results Drawer — AI Scan & Exports placed here */
function ResultsDrawer({ open, application, onClose }) {
  const [data, setData] = useState(null);
  const [busy, setBusy] = useState(false);

  const load = async () => {
    if (!application?._id) return;
    setBusy(true);
    try {
      const res = await API.get(`/company/screening/applications/${application._id}/results`);
      setData(res.data || null);
    } catch (e) {
      console.error("results load failed:", e);
      setData(null);
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => { if (open) load(); /* eslint-disable-next-line */ }, [open, application?._id]);

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

  if (!open) return null;

  const ats = data?.ats || {};

  return (
    <div className="fixed inset-0 z-[80] bg-black/50 grid" style={{ gridTemplateColumns: "1fr min(980px, 100vw)" }}>
      <div onClick={onClose} className="cursor-pointer" />
      <div className="bg-white h-full overflow-y-auto border-l border-slate-200 flex flex-col">
        <div className="p-4 border-b bg-white/80 backdrop-blur flex items-center justify-between">
          <div className="font-semibold">Results & Insights</div>
          <div className="flex items-center gap-2">
            <a href={`/api/company/screening/applications/${application._id}/export.xlsx`} className="px-3 py-1.5 rounded-xl border bg-white hover:bg-slate-50 text-xs">
              Export Excel
            </a>
            <a href={`/api/company/screening/applications/${application._id}/export.pdf`} className="px-3 py-1.5 rounded-xl border bg-white hover:bg-slate-50 text-xs">
              Export PDF
            </a>
            <button onClick={aiScan} disabled={busy} className="px-3 py-1.5 rounded-xl bg-[#1A55E3] text-white text-xs inline-flex items-center gap-1">
              <Bot size={14} /> {busy ? "Scanning…" : "AI Scan"}
            </button>
            <button onClick={onClose} className="px-3 py-1.5 rounded-xl border bg-white hover:bg-slate-50 text-xs">Close</button>
          </div>
        </div>

        {!data ? (
          <div className="p-6 text-slate-600">Loading…</div>
        ) : (
          <div className="p-6 space-y-6">
            {/* ATS (resume score visible ONLY here) */}
            <div className="grid md:grid-cols-3 gap-4">
              <div className="rounded-2xl border bg-white p-4">
                <div className="text-sm font-semibold mb-2">ATS Summary</div>
                <div className="text-sm">Resume Score: <b>{ats.resumeScore ?? "—"}</b></div>
                <div className="text-sm">Fit Score: <b>{ats.fitScore ?? "—"}</b></div>
                {!!ats.notes && <div className="text-xs text-slate-700 mt-2 whitespace-pre-wrap">{ats.notes}</div>}
              </div>
              <div className="md:col-span-2 rounded-2xl border bg-white p-4">
                <div className="text-sm font-semibold mb-2">Insights</div>
                <InsightsPanel applicationId={application._id} />
              </div>
            </div>

            {/* Raw lists */}
            <div className="grid md:grid-cols-2 gap-4">
              <div className="rounded-2xl border bg-white p-4">
                <div className="text-sm font-semibold mb-2">Skill Test Results</div>
                {data.skillRows.length === 0 ? (
                  <div className="text-xs text-slate-500">No skill tests yet.</div>
                ) : (
                  <ul className="text-sm space-y-2">
                    {data.skillRows.map((r, i) => (
                      <li key={i} className="flex items-center justify-between border-b last:border-none pb-2">
                        <span>{r.skill}</span>
                        <span>{r.score}/{r.total} • {new Date(r.createdAt).toLocaleDateString()}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <div className="rounded-2xl border bg-white p-4">
                <div className="text-sm font-semibold mb-2">Aptitude Results</div>
                {data.aptitudeRows.length === 0 ? (
                  <div className="text-xs text-slate-500">No aptitude tests yet.</div>
                ) : (
                  <ul className="text-sm space-y-2">
                    {data.aptitudeRows.map((r, i) => (
                      <li key={i} className="flex items-center justify-between border-b last:border-none pb-2">
                        <span>{r.title}</span>
                        <span>{r.score}/{r.total} • {new Date(r.createdAt).toLocaleDateString()}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ScreeningPage({ applications, updateAppStatus, aiScanOne, aiScanAll, toAbsolute, onRefresh, primary = "#1A55E3" }) {
  const [scanBusyId, setScanBusyId] = useState(null);
  const [openBuilderFor, setOpenBuilderFor] = useState(null);
  const [expandedId, setExpandedId] = useState(null);
  const [openResultsFor, setOpenResultsFor] = useState(null);

  return (
    <div className="bg-white/80 backdrop-blur rounded-2xl border border-slate-200/60 shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Smart Candidate Screening</h3>
        <div className="text-xs text-slate-500">AI Scan moved to Results</div>
      </div>

      {applications.length === 0 ? (
        <p className="text-sm text-gray-500">No applications yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm overflow-hidden rounded-2xl border border-slate-200">
            <thead className="bg-slate-50/80">
              <tr>
                <th className="p-3 text-left">Candidate</th>
                <th className="p-3">Job</th>
                <th className="p-3">Resume</th>
                <th className="p-3">Interview</th>
                <th className="p-3">Insights</th>
                <th className="p-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {applications.map((a) => {
                const iv = a.interview;
                const windowText = iv?.startsAt ? `${new Date(iv.startsAt).toLocaleString()} • ${iv.durationMins || 45}m (${iv.stage || "screening"})` : "—";
                const fit = a.screening?.fitScore ?? null;
                const test = a.screening?.testScore != null ? Math.round(a.screening.testScore * 10) / 10 : null;
                const expanded = expandedId === a._id;

                return (
                  <tr key={a._id} className="border-b align-top">
                    <td className="p-3">
                      <div className="font-medium text-gray-900">{a.student?.name}</div>
                      <div className="text-xs text-gray-500">{a.student?.email}</div>
                      <div className="mt-1 text-xs text-gray-500 capitalize">Status: <b>{a.status}</b></div>
                    </td>

                    <td className="p-3 text-center">{a.job?.title}</td>

                    <td className="p-3 text-center">
                      {a.cvUrl ? (
                        <a className="text-blue-700 underline" href={toAbsolute(a.cvUrl)} target="_blank" rel="noreferrer" download> Resume </a>
                      ) : ("-")}
                    </td>

                    <td className="p-3 text-center">
                      <div className="text-xs">{windowText}</div>
                      {iv?.roomId && (
                        <div className="flex items-center justify-center gap-3 mt-1">
                          <a href={`/company/webinar/${iv.roomId}`} className="text-indigo-700 underline text-xs">Host</a>
                          <a href={`/student/webinar/${iv.roomId}`} className="text-blue-700 underline text-xs">Student</a>
                        </div>
                      )}
                    </td>

                    <td className="p-3">
                      <div className="flex flex-wrap items-center gap-4">
                        <Meter value={test != null ? test * 10 : null} label="Test" />
                        <div>
                          <div className="text-[11px] text-slate-600 mb-1">Fit</div>
                          <Chip tone={fit == null ? "slate" : fit >= 80 ? "emerald" : fit >= 60 ? "amber" : "rose"}>
                            {fit ?? "—"}
                          </Chip>
                        </div>
                        <button
                          className="ml-auto inline-flex items-center gap-1 text-xs text-indigo-700"
                          onClick={() => setExpandedId(expanded ? null : a._id)}
                        >
                          {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                          {expanded ? "Hide" : "Quick peek"}
                        </button>
                      </div>

                      {expanded && (
                        <div className="mt-3 rounded-xl border bg-slate-50/70 p-3 text-xs text-slate-700">
                          <InsightsPanel applicationId={a._id} compact />
                          <div className="text-[11px] text-slate-500 mt-2">Full ATS & AI details in Results.</div>
                        </div>
                      )}
                    </td>

                    <td className="p-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          title="Shortlist"
                          onClick={() => updateAppStatus(a._id, "shortlisted")}
                          className="px-2.5 py-1.5 rounded-xl border bg-white hover:bg-slate-50 text-xs inline-flex items-center gap-1"
                          style={{ borderColor: '#00D284', color: '#00D284' }}
                        >
                          <CheckCircle2 size={14} /> Shortlist
                        </button>
                        <button
                          title="Reject"
                          onClick={() => updateAppStatus(a._id, "rejected")}
                          className="px-2.5 py-1.5 rounded-xl border bg-white hover:bg-slate-50 text-xs inline-flex items-center gap-1"
                          style={{ borderColor: '#FF0854', color: '#FF0854' }}
                        >
                          <XCircle size={14} /> Reject
                        </button>
                        <button
                          onClick={() => setOpenBuilderFor(a)}
                          title="Assessment Center"
                          className="px-2.5 py-1.5 rounded-xl border bg-white hover:bg-slate-50 text-xs inline-flex items-center gap-1"
                          style={{ borderColor: '#1A55E3', color: '#1A55E3' }}
                        >
                          <ClipboardList size={14} /> Assessment
                        </button>
                        <button
                          onClick={() => setOpenResultsFor(a)}
                          title="Results"
                          className="px-2.5 py-1.5 rounded-xl border bg-white hover:bg-slate-50 text-xs inline-flex items-center gap-1"
                          style={{ borderColor: '#5E6EED', color: '#5E6EED' }}
                        >
                          <FileBarChart2 size={14} /> Results
                        </button>
                        {a.interview?.roomId && (
                          <a
                            href={`/company/webinar/${a.interview.roomId}`}
                            className="px-2.5 py-1.5 rounded-xl border bg-white hover:bg-slate-50 text-xs inline-flex items-center gap-1"
                            style={{ borderColor: '#0DCAF0', color: '#0DCAF0' }}
                          >
                            <Video size={14} /> Join
                          </a>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
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
    </div>
  );
}
