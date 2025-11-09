// src/pages/student/MyApplications.jsx
import { useEffect, useMemo, useState, useRef } from "react";
import {
  Calendar,
  Video,
  FileText,
  Briefcase,
  Building2,
  Search,
  ChevronDown,
  Timer,
  PlayCircle,
  X,
  CheckCircle2,
  Clock,
} from "lucide-react";
import API from "../../api/axios";
import { Link, useNavigate } from "react-router-dom";

/* ---------- helpers ---------- */
const apiOrigin =
  (API.defaults.baseURL && new URL(API.defaults.baseURL).origin) ||
  window.location.origin;
const toAbsolute = (p) =>
  !p ? null : p.startsWith("http") ? p : `${apiOrigin}${p.startsWith("/") ? p : `/${p}`}`;

/* ---------- brand palette (from sidebar) ---------- */
const BRAND = {
  navy: "#0A2647",
  steel: "#144272",
  royal: "#205295",
  blue: "#2C74B3",
  soft: "#E9F1FA",
  border: "#E5EAF0",
};

/* status badge tones (kept semantic, tuned to brand) */
const tone = {
  applied: { bg: "bg-[#E9F1FA]", text: "text-[#205295]" },
  shortlisted: { bg: "bg-amber-50", text: "text-amber-700" },
  interview: { bg: "bg-[#E9F1FA]", text: "text-[#205295]" },
  offer: { bg: "bg-emerald-50", text: "text-emerald-700" },
  rejected: { bg: "bg-rose-50", text: "text-rose-700" },
  default: { bg: "bg-[#E9F1FA]", text: "text-[#205295]" },
};

function StatusChip({ value }) {
  const key = (value || "").toLowerCase();
  const t = tone[key] || tone.default;
  return (
    <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${t.bg} ${t.text} border border-[#E5EAF0]`}>
      {value || "—"}
    </span>
  );
}

/* subtle skeletons */
function SkeletonCard() {
  return (
    <div className="rounded-3xl bg-white border border-[#E5EAF0] shadow-[0_6px_18px_rgba(10,38,71,0.06)] p-5 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="h-4 w-40 rounded bg-[#E9F1FA]" />
        <div className="h-5 w-16 rounded-full bg-[#E9F1FA]" />
      </div>
      <div className="mt-3 h-3 w-24 rounded bg-[#E9F1FA]" />
      <div className="mt-4 h-8 w-full rounded-xl bg-[#F6F9FF]" />
    </div>
  );
}

/* countdown util — SAFE hook */
function useCountdown(target) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  if (!target) return null;
  const diff = Math.max(0, new Date(target).getTime() - now);
  const s = Math.floor(diff / 1000);
  const hh = String(Math.floor(s / 3600)).padStart(2, "0");
  const mm = String(Math.floor((s % 3600) / 60)).padStart(2, "0");
  const ss = String(s % 60).padStart(2, "0");
  return { diffMs: diff, label: `${hh}:${mm}:${ss}` };
}

/* ---------- Inline Test Runner (Recruiter templates only) ---------- */
function TestRunnerDrawer({ open, onClose, token, meta, onSubmitted }) {
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [payload, setPayload] = useState(null); // { title, durationMins, dueAt, status, questions[] }
  const [answers, setAnswers] = useState({}); // { [qIndex]: chosenIndex }
  const [submitting, setSubmitting] = useState(false);
  const [left, setLeft] = useState(null);
  const timerRef = useRef(null);

  useEffect(() => {
    if (!open || !token) return;
    (async () => {
      setLoading(true);
      setErr("");
      try {
        const res = await API.get(`/student/tests/recruiter-tests/${token}`);
        setPayload(res.data || null);
        setAnswers({});
        const durMin = Number(res.data?.durationMins || 20);
        const sec = durMin * 60;
        setLeft(sec);
        if (timerRef.current) clearInterval(timerRef.current);
        timerRef.current = setInterval(() => {
          setLeft((old) => {
            if (old == null) return old;
            if (old <= 1) {
              clearInterval(timerRef.current);
              return 0;
            }
            return old - 1;
          });
        }, 1000);
      } catch (e) {
        setErr(e?.response?.data?.message || "Failed to load test");
      } finally {
        setLoading(false);
      }
    })();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [open, token]);

  const secondsToClock = (s) => {
    const hh = String(Math.floor(s / 3600)).padStart(2, "0");
    const mm = String(Math.floor((s % 3600) / 60)).padStart(2, "0");
    const ss = String(s % 60).padStart(2, "0");
    return `${hh}:${mm}:${ss}`;
  };

  const choose = (qIdx, optIdx) =>
    setAnswers((a) => ({ ...a, [qIdx]: Number(optIdx) }));

  const submit = async () => {
    setSubmitting(true);
    try {
      const items = Object.entries(answers).map(([qIndex, chosen]) => ({
        qIndex: Number(qIndex),
        chosen: Number(chosen),
      }));
      await API.post("/company/recruiter-tests/submit", { token, answers: items });
      onSubmitted?.();
      onClose?.();
    } catch (e) {
      alert(e?.response?.data?.message || "Submit failed");
    } finally {
      setSubmitting(false);
    }
  };

  const disabled =
    submitting ||
    (payload?.status === "submitted") ||
    (payload?.dueAt && new Date(payload.dueAt) < new Date()) ||
    (left === 0);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[90]">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
      />
      {/* Drawer */}
      <div
        className="absolute right-0 top-0 h-full w-[min(900px,100vw)] bg-white shadow-2xl border-l border-[#E5EAF0] flex flex-col"
        style={{ willChange: "transform" }}
      >
        {/* Header */}
        <div className="p-5 bg-white/95 backdrop-blur flex items-center justify-between border-b border-[#E5EAF0]">
          <div>
            <div className="font-semibold text-lg tracking-tight text-[#0A2647]">
              {payload?.title || meta?.title || "Assessment"}
            </div>
            <div className="text-sm text-[#144272]">
              Duration: <b>{payload?.durationMins || meta?.durationMins || 20} mins</b>
              {payload?.dueAt && <> · Due: <b>{new Date(payload.dueAt).toLocaleString()}</b></>}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-[#E9F1FA] text-[#0A2647]"
            aria-label="Close"
            title="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-gradient-to-b from-[#FDFEFF] to-white">
          {loading ? (
            <div className="text-[#144272]">Loading test…</div>
          ) : err ? (
            <div className="text-rose-600">{err}</div>
          ) : !payload ? (
            <div className="text-[#144272]">Test unavailable.</div>
          ) : (
            <>
              {/* Timer */}
              <div className="inline-flex items-center gap-2 text-[#0A2647] bg-[#E9F1FA] border border-[#E5EAF0] rounded-xl px-3 py-2">
                <Timer size={16} className="text-[#205295]" /> Time left:&nbsp;
                <b>{left != null ? secondsToClock(left) : "—"}</b>
              </div>

              {/* Questions */}
              <div className="space-y-4">
                {payload.questions.map((q) => (
                  <div key={q.index} className="rounded-2xl bg-white border border-[#E5EAF0] shadow-[0_6px_18px_rgba(10,38,71,0.06)] p-4">
                    <div className="font-medium text-sm mb-3 text-[#0A2647]">Q{q.index + 1}. {q.text}</div>
                    <div className="grid sm:grid-cols-2 gap-2">
                      {q.options.map((opt, j) => {
                        const checked = answers[q.index] === j;
                        return (
                          <label
                            key={j}
                            className={`flex items-center gap-2 rounded-xl px-3 py-2 cursor-pointer transition border ${
                              checked
                                ? "bg-[#E9F1FA] border-[#205295] ring-1 ring-[#205295]"
                                : "bg-white border-[#E5EAF0] hover:bg-[#F6FAFF]"
                            }`}
                          >
                            <input
                              type="radio"
                              name={`q_${q.index}`}
                              checked={checked}
                              onChange={() => choose(q.index, j)}
                            />
                            <span className="text-sm text-[#0A2647]">
                              {opt || <i className="text-[#14427299]">[empty]</i>}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-[#E5EAF0] bg-white/95 backdrop-blur flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="px-3 py-2 rounded-xl bg-white border border-[#E5EAF0] text-[#0A2647] hover:bg-[#F6FAFF]"
          >
            Cancel
          </button>
          <button
            onClick={submit}
            disabled={
              submitting ||
              (payload?.status === "submitted") ||
              (payload?.dueAt && new Date(payload.dueAt) < new Date()) ||
              left === 0
            }
            className={`px-4 py-2 rounded-xl text-white transition ${
              submitting ||
              (payload?.status === "submitted") ||
              (payload?.dueAt && new Date(payload?.dueAt) < new Date()) ||
              left === 0
                ? "bg-[#BFD0E6] cursor-not-allowed"
                : "bg-[#205295] hover:opacity-95 shadow-[0_10px_24px_rgba(32,82,149,0.20)]"
            }`}
          >
            {submitting ? "Submitting…" : "Submit"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---------- Minimal “shift-style” test chip (brand tuned) ---------- */
function AssignedTestCard({ t, openTest }) {
  // Hooks order fixed
  const startCountdown = useCountdown(t.startAt || null); // legacy (unused label but safe to keep)
  const dueCountdown = useCountdown(t.type === "recruiter" ? (t.dueAt || null) : null);

  const isLegacy = t.type !== "recruiter";
  const now = Date.now();
  const legacyStart = t.startAt ? new Date(t.startAt).getTime() : 0;
  const legacyEnd = t.endAt ? new Date(t.endAt).getTime() : Infinity;
  const recruiterDue = t.dueAt ? new Date(t.dueAt).getTime() : null;

  const active = isLegacy
    ? now >= legacyStart &&
      now <= legacyEnd &&
      (t.status === "pending" || t.status === "in_progress")
    : t.status !== "completed" &&
      t.status !== "expired" &&
      (recruiterDue ? now <= recruiterDue : true);

  const expired =
    (isLegacy && t.endAt && now > legacyEnd) ||
    (!isLegacy && t.dueAt && now > recruiterDue) ||
    t.status === "expired";

  const label =
    t.title ||
    (t.type === "aptitude" ? "Aptitude Test" : t.type === "recruiter" ? "Custom Test" : "Skill Test");

  // Soft, clean chip card (brand palette)
  return (
    <div className="rounded-2xl bg-white border border-[#E5EAF0] shadow-[0_6px_18px_rgba(10,38,71,0.06)] hover:shadow-[0_12px_30px_rgba(10,38,71,0.12)] transition p-4">
      <div className="flex items-center justify-between">
        <div className="text-sm font-semibold text-[#0A2647]">{label}</div>
        {t.status === "completed" && (
          <span className="inline-flex items-center gap-1 text-emerald-700 text-[11px]">
            <CheckCircle2 size={14} /> Done
          </span>
        )}
      </div>

      {/* Time row */}
      <div className="mt-1 flex items-center gap-2 text-xs text-[#144272]">
        <Clock size={14} className="opacity-70" />
        {isLegacy && t.startAt ? (
          <span>
            {new Date(t.startAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} to{" "}
            {t.endAt ? new Date(t.endAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "--:--"}
          </span>
        ) : t.dueAt ? (
          <span>Due {new Date(t.dueAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
        ) : (
          <span>Available now</span>
        )}
      </div>

      {/* Pills */}
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span className="px-2.5 py-1 text-[11px] rounded-full bg-[#E9F1FA] text-[#205295] border border-[#E5EAF0]">
          {String(t.type || "test").replace(/^\w/, (c) => c.toUpperCase())}
        </span>
        <span
          className={`px-2.5 py-1 text-[11px] rounded-full border ${
            expired
              ? "bg-rose-50 text-rose-700 border-rose-100"
              : t.status === "completed"
              ? "bg-emerald-50 text-emerald-700 border-emerald-100"
              : "bg-[#E9F1FA] text-[#205295] border-[#E5EAF0]"
          }`}
        >
          {expired ? "Expired" : t.status === "completed" ? "Completed" : "Active"}
        </span>
      </div>

      {/* Action */}
      <button
        disabled={!active || expired}
        onClick={() => openTest(t)}
        className={`mt-3 w-full px-3 py-2 rounded-xl text-sm font-semibold inline-flex items-center justify-center gap-1 transition ${
          active && !expired
            ? "bg-[#205295] text-white hover:opacity-95 shadow-[0_10px_24px_rgba(32,82,149,0.20)]"
            : "bg-[#F3F6FB] text-[#9FB3CD] cursor-not-allowed"
        }`}
      >
        <PlayCircle size={16} />
        {expired ? "Expired" : active ? "Take Test" : "Locked"}
      </button>
    </div>
  );
}

/* ---------- page ---------- */
export default function MyApplications() {
  const [apps, setApps] = useState([]);
  const [assigned, setAssigned] = useState([]); // tests
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [sortBy, setSortBy] = useState("newest");

  // inline test runner state (recruiter only)
  const [runnerOpen, setRunnerOpen] = useState(false);
  const [runnerToken, setRunnerToken] = useState("");
  const [runnerMeta, setRunnerMeta] = useState(null);

  const navigate = useNavigate();

  const load = async () => {
    setLoading(true);
    try {
      const res = await API.get("/student/jobs/mine/applications");
      const list = Array.isArray(res.data) ? res.data : [];
      setApps(list);

      const ids = list.map((a) => a._id);
      if (ids.length) {
        const tests = await API.get("/student/tests/assigned", { params: { appIds: ids } });
        setAssigned(Array.isArray(tests.data) ? tests.data : []);
      } else {
        setAssigned([]);
      }
    } catch (e) {
      console.error("Load apps failed:", e?.response?.data || e.message);
      setAssigned([]);
      setApps([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const byAppId = useMemo(() => {
    const map = new Map();
    for (const t of assigned) {
      const arr = map.get(String(t.applicationId)) || [];
      arr.push(t);
      map.set(String(t.applicationId), arr);
    }
    return map;
  }, [assigned]);

  const visible = useMemo(() => {
    const term = q.trim().toLowerCase();
    let out = apps.filter((a) => {
      if (!term) return true;
      const title = a.job?.title?.toLowerCase() || "";
      const company = a.job?.company?.name?.toLowerCase() || "";
      const status = a.status?.toLowerCase() || "";
      return title.includes(term) || company.includes(term) || status.includes(term);
    });
    out.sort((a, b) => {
      if (sortBy === "newest") return new Date(b.createdAt) - new Date(a.createdAt);
      if (sortBy === "oldest") return new Date(a.createdAt) - new Date(b.createdAt);
      if (sortBy === "company") return (a.job?.company?.name || "").localeCompare(b.job?.company?.name || "");
      if (sortBy === "status") return (a.status || "").localeCompare(b.status || "");
      return 0;
    });
    return out;
  }, [apps, q, sortBy]);

  const openTest = (t) => {
    if (t.type === "recruiter") {
      setRunnerToken(t.token);
      setRunnerMeta({ title: t.title, durationMins: t.durationMins });
      setRunnerOpen(true);
      return;
    }
    if (t.type === "aptitude") navigate(`/student/aptitude/${t._id}`);
    else navigate(`/student/skill-test/${t._id}`);
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-[#F7FAFF] to-white">
      <div className="max-w-6xl mx-auto p-6 space-y-6">
        {/* header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2 text-[#0A2647]">
            <Briefcase size={20} className="text-[#205295]" />
            My Applications
          </h1>
          <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-2.5 text-[#14427299]" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search by role, company, or status…"
                className="pl-9 pr-3 py-2 w-full sm:w-72 rounded-xl bg-white border border-[#E5EAF0] text-[#0A2647] placeholder:text-[#14427299] shadow-[0_6px_18px_rgba(10,38,71,0.05)] focus:outline-none focus:ring-2 focus:ring-[#E9F1FA]"
              />
            </div>
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="appearance-none pr-9 pl-3 py-2 rounded-xl bg-white border border-[#E5EAF0] text-[#0A2647] shadow-[0_6px_18px_rgba(10,38,71,0.05)] focus:outline-none focus:ring-2 focus:ring-[#E9F1FA]"
              >
                <option value="newest">Newest first</option>
                <option value="oldest">Oldest first</option>
                <option value="company">Company</option>
                <option value="status">Status</option>
              </select>
              <ChevronDown size={16} className="pointer-events-none absolute right-3 top-2.5 text-[#14427299]" />
            </div>
          </div>
        </div>

        {/* content */}
        {loading ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
        ) : visible.length === 0 ? (
          <div className="rounded-3xl bg-white border border-[#E5EAF0] shadow-[0_6px_18px_rgba(10,38,71,0.06)] p-10 text-center">
            <div className="mx-auto h-10 w-10 rounded-xl bg-[#E9F1FA] text-[#205295] grid place-items-center">
              <Briefcase size={18} />
            </div>
            <h2 className="mt-3 font-semibold text-[#0A2647]">No applications yet</h2>
            <p className="text-sm text-[#144272] mt-1">
              When you apply, they’ll appear here with live status and interview links.
            </p>
            <Link
              to="/student/jobs"
              className="inline-flex mt-4 px-4 py-2 rounded-xl bg-[#205295] text-white hover:opacity-95 transition shadow-[0_10px_24px_rgba(32,82,149,0.20)]"
            >
              Browse jobs
            </Link>
          </div>
        ) : (
          /* Premium minimalist grid: airy spacing, soft shadows, clear hierarchy */
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {visible.map((a) => {
              const iv = a.interview;
              const companyLogo = a.job?.company?.logoUrl;
              const companyName = a.job?.company?.name || "—";
              const tests = (byAppId.get(String(a._id)) || []).slice();

              return (
                <div
                  key={a._id}
                  className="rounded-3xl bg-white border border-[#E5EAF0] shadow-[0_6px_18px_rgba(10,38,71,0.06)] hover:shadow-[0_12px_30px_rgba(10,38,71,0.12)] transition overflow-hidden"
                >
                  {/* Card body */}
                  <div className="p-6 space-y-5">
                    {/* Top: logo + role + status */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        {companyLogo ? (
                          <img src={toAbsolute(companyLogo)} alt="logo" className="h-10 w-10 rounded-xl object-cover border border-[#E5EAF0] shadow-sm" />
                        ) : (
                          <div className="h-10 w-10 rounded-xl bg-[#E9F1FA] text-[#205295] grid place-items-center border border-[#E5EAF0]">
                            <Building2 size={16} />
                          </div>
                        )}
                        <div>
                          <div className="font-semibold leading-tight text-[#0A2647]">{a.job?.title}</div>
                          <div className="text-xs text-[#144272B3]">{companyName}</div>
                        </div>
                      </div>
                      <StatusChip value={a.status} />
                    </div>

                    {/* Meta row */}
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-[#144272]">
                      <span className="inline-flex items-center gap-1.5">
                        <Calendar size={14} className="text-[#14427299]" />
                        Applied {new Date(a.createdAt).toLocaleDateString()}
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <FileText size={14} className="text-[#14427299]" />
                        {a.cvUrl ? (
                          <a
                            className="underline text-[#205295] hover:opacity-90"
                            href={toAbsolute(a.cvUrl)}
                            target="_blank"
                            rel="noreferrer"
                            download
                          >
                            Resume
                          </a>
                        ) : (
                          <span className="text-[#14427299]">No resume</span>
                        )}
                      </span>
                    </div>

                    {/* Interview row */}
                    {iv ? (
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs text-[#205295] bg-[#E9F1FA] border border-[#E5EAF0]">
                          <Calendar size={14} className="opacity-80" />
                          {new Date(iv.startsAt).toLocaleString()} • {iv.durationMins} mins • {iv.stage}
                        </span>
                        <Link
                          to={`/student/webinar/${iv.roomId}`}
                          className="inline-flex items-center gap-1.5 rounded-full bg-[#205295] text-white px-3 py-1.5 text-xs hover:opacity-95 transition shadow-[0_6px_16px_rgba(32,82,149,0.20)]"
                          title="Join interview"
                        >
                          <Video size={14} /> Join
                        </Link>
                      </div>
                    ) : (
                      <div className="text-xs text-[#14427299]">No interview scheduled yet.</div>
                    )}

                    {/* Assigned tests – minimal chips arranged cleanly */}
                    {tests.length > 0 && (
                      <div className="space-y-2">
                        <div className="text-sm font-semibold text-[#0A2647]">Assigned Tests</div>
                        <div className="grid gap-2">
                          {tests.map((t) => (
                            <AssignedTestCard
                              key={t._id}
                              t={t}
                              openTest={(tt) => openTest(tt)}
                            />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Removed: colorful bottom line */}
                </div>
              );
            })}
          </div>
        )}

        {/* Inline Test Runner (Recruiter templates only) */}
        <TestRunnerDrawer
          open={runnerOpen}
          onClose={() => setRunnerOpen(false)}
          token={runnerToken}
          meta={runnerMeta}
          onSubmitted={load}
        />
      </div>
    </div>
  );
}
