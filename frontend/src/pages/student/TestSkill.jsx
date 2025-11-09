import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useSkill } from "../../context/SkillContext";
import API from "../../api/axios";
import {
  Loader2,
  CheckCircle2,
  Circle,
  ChevronLeft,
  ChevronRight,
  SendHorizonal,
  AlertTriangle,
  Timer as TimerIcon,
  Info,
  BrainCircuit,
  Blocks,
  ArrowLeft,
  Rocket,
} from "lucide-react";

/* ----------------------------- tiny helpers ----------------------------- */
const fade = (d = 0) => ({
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.35, ease: "easeOut", delay: d } },
});

const cls = (...xs) => xs.filter(Boolean).join(" ");

function Card({ className = "", children }) {
  return (
    <div
      className={cls(
        "rounded-2xl border border-slate-200/70 bg-white/80 shadow-sm hover:shadow-md transition-shadow",
        className
      )}
    >
      {children}
    </div>
  );
}
function Pill({ children, className = "" }) {
  return (
    <span
      className={cls(
        "inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ring-1 ring-slate-200",
        className
      )}
    >
      {children}
    </span>
  );
}

/* ------------------------------- Modal ------------------------------- */
function Modal({ open, onClose, children }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md rounded-2xl border bg-white shadow-xl">
        {children}
      </div>
    </div>
  );
}

/* ----------------------- Timer Ring (CSS only) ----------------------- */
function TimerRing({ totalSec, remainSec }) {
  const pct = totalSec > 0 ? Math.max(0, Math.min(100, Math.round((remainSec / totalSec) * 100))) : 0;
  const deg = (pct / 100) * 360;
  const label = (() => {
    const m = Math.floor(remainSec / 60);
    const s = remainSec % 60;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  })();
  return (
    <div className="relative h-14 w-14">
      <div
        className="h-14 w-14 rounded-full"
        style={{
          background: `conic-gradient(rgb(79 70 229) ${deg}deg, rgb(229 231 235) 0deg)`,
        }}
      />
      <div className="absolute inset-0 m-1 rounded-full bg-white grid place-items-center text-[11px] font-semibold text-slate-800">
        {label}
      </div>
    </div>
  );
}

/* =========================== Reusable Test Runner =========================== */
/**
 * mode: "skill" | "aptitude"
 * For "skill": requires selected skill from context; uses:
 *   - GET  /student/skill-test?skillId=...
 *   - POST /student/skill-test/submit  { skill, score, total, terminated? }
 *
 * For "aptitude": no skillId needed; uses:
 *   - GET  /student/aptitude-test
 *   - POST /student/aptitude-test/submit  { score, total, terminated? }
 * If aptitude GET 404s, we show a friendly empty state (does NOT break the page).
 */
function TestRunner({ mode, selectedSkill }) {
  const navigate = useNavigate();

  // paper
  const [loading, setLoading] = useState(true);
  const [paper, setPaper] = useState({
    setId: "",
    questions: [],
    skillId: "",
    durationMinutes: 20,
  });
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // timer
  const [remaining, setRemaining] = useState(0); // seconds
  const deadlineRef = useRef(null);
  const timerRef = useRef(null);
  const totalSecRef = useRef(0);

  // anti-cheat
  const [warnings, setWarnings] = useState(0);
  const [cheatOpen, setCheatOpen] = useState(false);
  const suppressWarnRef = useRef(false);
  const lastVisibilityRef = useRef(document.visibilityState);

  // navigator visited/skipped
  const [visited, setVisited] = useState(new Set());

  // derived
  const total = paper.questions.length;
  const current = paper.questions[index] || null;

  // keys per set+mode to avoid collisions
  const ns = mode === "aptitude" ? "apt" : (selectedSkill?._id || "skill");
  const baseKey = paper.setId ? `skilltest.${ns}.answers` : null;
  const timerKey = paper.setId ? `skilltest.${ns}.deadline.${paper.setId}` : null;
  const strikesKey = paper.setId ? `skilltest.${ns}.strikes.${paper.setId}` : null;
  const visitedKey = paper.setId ? `skilltest.${ns}.visited.${paper.setId}` : null;

  /* ------------------------------ fetch paper ------------------------------ */
  const fetchPaper = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      let res;
      if (mode === "aptitude") {
        res = await API.get("/student/aptitude-test");
      } else {
        if (!selectedSkill?._id) {
          setError("Please select a skill in your profile first.");
          setLoading(false);
          return;
        }
        res = await API.get(`/student/skill-test`, { params: { skillId: selectedSkill._id } });
      }

      const qs = Array.isArray(res.data?.questions) ? res.data.questions : [];
      const duration =
        Number(res.data?.durationMinutes) ||
        Number(res.data?.meta?.durationMinutes) ||
        20;

      // restore draft answers
      let restoredAns = {};
      try {
        if (baseKey) {
          const raw = localStorage.getItem(baseKey);
          if (raw) {
            const parsed = JSON.parse(raw);
            if (parsed?.setId === res.data?.setId) restoredAns = parsed.answers || {};
          }
        }
      } catch {}

      // restore strikes
      try {
        if (strikesKey) {
          const raw = localStorage.getItem(strikesKey);
          if (raw) setWarnings(Math.max(0, Math.min(3, Number(raw) || 0)));
        }
      } catch {}

      // restore visited
      try {
        if (visitedKey) {
          const raw = localStorage.getItem(visitedKey);
          if (raw) {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed)) setVisited(new Set(parsed));
          }
        }
      } catch {}

      setPaper({
        setId: res.data?.setId || "",
        questions: qs,
        skillId: res.data?.skillId || "",
        durationMinutes: duration,
      });
      setAnswers(restoredAns);
      setIndex(0);
    } catch (e) {
      const status = e?.response?.status;
      const msg =
        e?.response?.data?.message ||
        (status === 404
          ? (mode === "aptitude"
              ? "No aptitude set found. Ask admin to add one."
              : "No question set for this skill yet.")
          : "Failed to load questions.");
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [mode, selectedSkill?._id, baseKey, strikesKey, visitedKey]);

  useEffect(() => {
    fetchPaper();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, selectedSkill?._id]);

  /* ------------------------------ persist draft ------------------------------ */
  useEffect(() => {
    if (!baseKey || !paper.setId) return;
    try {
      localStorage.setItem(baseKey, JSON.stringify({ setId: paper.setId, answers }));
    } catch {}
  }, [answers, paper.setId, baseKey]);

  useEffect(() => {
    if (!visitedKey || !paper.setId) return;
    try {
      localStorage.setItem(visitedKey, JSON.stringify(Array.from(visited)));
    } catch {}
  }, [visited, visitedKey, paper.setId]);

  /* --------------------------------- timer --------------------------------- */
  useEffect(() => {
    if (!paper.setId) return;

    const now = Date.now();
    const durationSec = (Number(paper.durationMinutes) || 20) * 60;
    totalSecRef.current = durationSec;

    let deadline = null;
    try {
      const raw = localStorage.getItem(timerKey);
      if (raw) {
        const parsed = Number(raw);
        if (Number.isFinite(parsed) && parsed > now) {
          deadline = parsed;
        }
      }
    } catch {}

    if (!deadline) {
      deadline = now + durationSec * 1000;
      try {
        localStorage.setItem(timerKey, String(deadline));
      } catch {}
    }
    deadlineRef.current = deadline;

    const tick = () => {
      const remainMs = Math.max(0, (deadlineRef.current || now) - Date.now());
      const sec = Math.floor(remainMs / 1000);
      setRemaining(sec);
      if (sec <= 0) {
        clearInterval(timerRef.current);
        autoSubmit(true);
      }
    };
    tick();
    timerRef.current = setInterval(tick, 1000);

    return () => clearInterval(timerRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paper.setId, paper.durationMinutes]);

  const timeFmt = useMemo(() => {
    const m = Math.floor(remaining / 60);
    const s = remaining % 60;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }, [remaining]);

  /* ------------------------------ anti-cheat ------------------------------ */
  // block copy/cut/paste/context menu
  useEffect(() => {
    if (!paper.setId) return;
    const block = (e) => e.preventDefault();
    document.addEventListener("copy", block);
    document.addEventListener("cut", block);
    document.addEventListener("paste", block);
    document.addEventListener("contextmenu", block);
    return () => {
      document.removeEventListener("copy", block);
      document.removeEventListener("cut", block);
      document.removeEventListener("paste", block);
      document.removeEventListener("contextmenu", block);
    };
  }, [paper.setId]);

  // count only outgoing events
  useEffect(() => {
    if (!paper.setId) return;

    const onVisibility = () => {
      if (lastVisibilityRef.current === "visible" && document.visibilityState === "hidden") {
        registerStrike();
      }
      lastVisibilityRef.current = document.visibilityState;
    };

    const onBlur = () => {
      if (suppressWarnRef.current) return;
      if (document.visibilityState === "visible") registerStrike();
    };

    window.addEventListener("blur", onBlur);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.removeEventListener("blur", onBlur);
      document.removeEventListener("visibilitychange", onVisibility);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paper.setId]);

  const registerStrike = () => {
    if (suppressWarnRef.current) return;
    setWarnings((w) => {
      const next = Math.min(3, w + 1);
      try {
        if (strikesKey) localStorage.setItem(strikesKey, String(next));
      } catch {}
      setCheatOpen(true);
      if (next >= 3) {
        setTimeout(() => autoSubmit(false, true), 600);
      }
      return next;
    });
  };

  /* --------------------------------- derived -------------------------------- */
  const attemptedCount = useMemo(() => Object.keys(answers).length, [answers]);
  const completionPct = useMemo(
    () => (total ? Math.round((attemptedCount / total) * 100) : 0),
    [attemptedCount, total]
  );
  const canPrev = index > 0;
  const canNext = index < total - 1;

  /* -------------------------------- handlers -------------------------------- */
  const chooseOption = (qi, opt) => {
    setAnswers((a) => ({ ...a, [qi]: opt }));
    setVisited((prev) => new Set(prev).add(qi));
  };

  const jumpTo = (i) => {
    setIndex(i);
    setVisited((prev) => new Set(prev).add(i));
  };

  const clearStateAfterSubmit = () => {
    try {
      if (baseKey) localStorage.removeItem(baseKey);
      if (timerKey) localStorage.removeItem(timerKey);
      if (strikesKey) localStorage.removeItem(strikesKey);
      if (visitedKey) localStorage.removeItem(visitedKey);
    } catch {}
    clearInterval(timerRef.current);
  };

  const postSubmit = async (payload) => {
    if (mode === "aptitude") {
      return API.post("/student/aptitude-test/submit", payload);
    }
    return API.post("/student/skill-test/submit", payload);
  };

  const autoSubmit = async (timeUp = false, cheatedOut = false) => {
    if (total === 0) return;
    suppressWarnRef.current = true;
    setSaving(true);
    try {
      const base = {
        score: Number(attemptedCount),
        total: Number(total),
        terminated: timeUp || cheatedOut ? true : undefined,
      };
      if (mode === "skill") base.skill = String(selectedSkill._id);

      await postSubmit(base);
      clearStateAfterSubmit();
      navigate("/student/progress");
    } catch (e) {
      console.error("Auto-submit failed:", e?.response?.data || e.message);
      setSaving(false);
      suppressWarnRef.current = false;
    }
  };

  const submitTest = async () => {
    if (total === 0) return;
    if (attemptedCount === 0) {
      alert("Please answer at least one question.");
      return;
    }
    suppressWarnRef.current = true;
    setSaving(true);
    setError("");
    try {
      const base = { score: Number(attemptedCount), total: Number(total) };
      if (mode === "skill") base.skill = String(selectedSkill._id);

      await postSubmit(base);
      clearStateAfterSubmit();
      navigate("/student/progress");
    } catch (e) {
      setError(e?.response?.data?.message || "Failed to submit");
      setSaving(false);
      suppressWarnRef.current = false;
    }
  };

  /* ---------------------------------- UI ---------------------------------- */
  const totalSec = totalSecRef.current || (paper.durationMinutes * 60);
  const title = mode === "aptitude" ? "Aptitude Assessment" : "Skill Assessment";
  const sub =
    mode === "aptitude"
      ? "Quant • Logical • Verbal — general aptitude screening."
      : selectedSkill?.name
      ? `You’re testing: ${selectedSkill.name}`
      : "Pick a skill in Profile to start your test.";

  return (
    <div
      className="w-full"
      onCopy={(e) => e.preventDefault()}
      onCut={(e) => e.preventDefault()}
      onPaste={(e) => e.preventDefault()}
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-6 space-y-6 select-none">
        {/* Header */}
        <motion.div {...fade(0)}>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <TimerRing totalSec={totalSec} remainSec={remaining} />
              <div>
                <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-slate-900">
                  {title}
                </h1>
                <p className="text-sm text-slate-600 mt-0.5">{sub}</p>
                <div className="mt-1 text-[11px] text-slate-500 inline-flex items-center gap-1">
                  <TimerIcon size={12} />
                  Time set by Admin • {paper.durationMinutes} min
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Pill className="bg-indigo-50 text-indigo-700">
                Attempted: {attemptedCount}/{total || 0}
              </Pill>
              <Pill className="bg-emerald-50 text-emerald-700">{completionPct}% completed</Pill>
              <Pill className="bg-slate-50 text-slate-800">
                <TimerIcon size={14} />
                <b className="ml-1">
                  {String(Math.floor(remaining / 60)).padStart(2, "0")}:
                  {String(remaining % 60).padStart(2, "0")}
                </b>
              </Pill>
            </div>
          </div>
        </motion.div>

        {/* Body */}
        {loading ? (
          <Card className="p-10 text-center">
            <div className="inline-flex items-center gap-2 text-slate-600">
              <Loader2 className="animate-spin" size={16} />
              Loading…
            </div>
          </Card>
        ) : error ? (
          <Card className="p-6">
            <div className="text-rose-600 text-sm">{error}</div>
          </Card>
        ) : total === 0 ? (
          <Card className="p-10 text-center text-slate-600">No questions yet.</Card>
        ) : (
          <div className="grid lg:grid-cols-[minmax(0,1fr)_320px] gap-5">
            {/* Left: current question + prev/next */}
            <motion.section {...fade(0.03)}>
              <Card className="p-5 bg-gradient-to-b from-sky-50/60 to-white">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-slate-500">
                    Question <b className="text-slate-900">{index + 1}</b> / {total}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      disabled={index === 0}
                      onClick={() => {
                        setIndex((i) => Math.max(0, i - 1));
                        setVisited((prev) => new Set(prev).add(Math.max(0, index - 1)));
                      }}
                      className={cls(
                        "inline-flex items-center gap-1 rounded-xl border px-3 py-1.5 text-sm",
                        index === 0
                          ? "bg-slate-50 border-slate-200 text-slate-400 cursor-not-allowed"
                          : "bg-white hover:bg-slate-50 border-slate-200 text-slate-700"
                      )}
                    >
                      <ChevronLeft size={16} /> Prev
                    </button>
                    <button
                      disabled={index >= total - 1}
                      onClick={() => {
                        setIndex((i) => Math.min(total - 1, i + 1));
                        setVisited((prev) => new Set(prev).add(Math.min(total - 1, index + 1)));
                      }}
                      className={cls(
                        "inline-flex items-center gap-1 rounded-xl border px-3 py-1.5 text-sm",
                        index >= total - 1
                          ? "bg-slate-50 border-slate-200 text-slate-400 cursor-not-allowed"
                          : "bg-white hover:bg-slate-50 border-slate-200 text-slate-700"
                      )}
                    >
                      Next <ChevronRight size={16} />
                    </button>
                  </div>
                </div>

                {/* The question */}
                <div className="mt-4">
                  <div className="text-base sm:text-lg font-medium text-slate-900">
                    {current?.question}
                  </div>
                  <div className="mt-4 grid sm:grid-cols-2 gap-2">
                    {(current?.options || []).map((opt, oi) => {
                      const chosen = answers[index] === opt;
                      return (
                        <button
                          key={`${current?._id}-${oi}`}
                          onClick={() => chooseOption(index, opt)}
                          className={cls(
                            "text-left rounded-xl border px-3 py-2 transition",
                            chosen
                              ? "border-emerald-300 bg-emerald-50 text-emerald-800"
                              : "border-slate-200 bg-white hover:bg-slate-50 text-slate-800"
                          )}
                        >
                          <span className="inline-flex items-center gap-2">
                            {chosen ? (
                              <CheckCircle2 size={18} className="flex-shrink-0" />
                            ) : (
                              <Circle size={18} className="text-slate-400 flex-shrink-0" />
                            )}
                            {opt}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </Card>
            </motion.section>

            {/* Right: sticky navigator & submit */}
            <motion.aside {...fade(0.05)} className="lg:sticky lg:top-6 self-start">
              <Card className="p-4 bg-gradient-to-b from-indigo-50/60 to-white">
                <div className="flex items-center justify-between gap-3">
                  <div className="text-sm font-semibold text-slate-800">Navigator</div>
                  <div className="text-[11px] text-slate-500 hidden xl:flex items-center gap-3">
                    <span className="inline-flex items-center gap-1">
                      <span className="inline-block w-3 h-3 rounded bg-indigo-600" /> Current
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <span className="inline-block w-3 h-3 rounded bg-emerald-500" /> Answered
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <span className="inline-block w-3 h-3 rounded bg-amber-400" /> Skipped
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <span className="inline-block w-3 h-3 rounded bg-slate-300" /> Not visited
                    </span>
                  </div>
                </div>

                <div className="mt-3 grid grid-cols-5 gap-2">
                  {paper.questions.map((q, i) => {
                    const answered = answers[i] != null;
                    const isVisited = visited.has(i);
                    const active = i === index;

                    let bg = "bg-slate-200 text-slate-700 border-slate-200"; // not visited
                    if (isVisited && !answered) bg = "bg-amber-100 text-amber-800 border-amber-200"; // skipped
                    if (answered) bg = "bg-emerald-50 text-emerald-700 border-emerald-200"; // answered
                    if (active) bg = "bg-indigo-600 text-white border-indigo-600"; // current

                    return (
                      <button
                        key={q._id || i}
                        onClick={() => jumpTo(i)}
                        className={cls(
                          "h-9 rounded-xl border text-sm hover:opacity-90 transition",
                          bg
                        )}
                        title={
                          active
                            ? "Current"
                            : answered
                            ? "Answered"
                            : isVisited
                            ? "Visited (skipped)"
                            : "Not visited"
                        }
                      >
                        {i + 1}
                      </button>
                    );
                  })}
                </div>

                <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600">Attempted</span>
                    <span className="font-semibold text-slate-900">
                      {attemptedCount}/{total || 0}
                    </span>
                  </div>
                  <div className="mt-2">
                    <div className="h-2 rounded-full bg-slate-100">
                      <div
                        className="h-2 rounded-full bg-indigo-500"
                        style={{ width: `${completionPct}%` }}
                      />
                    </div>
                  </div>
                  <div className="mt-2 text-[11px] text-slate-500 flex items-start gap-2">
                    <Info size={12} className="mt-0.5" />
                    <span>Answers auto-save locally. Submit when you’re ready.</span>
                  </div>
                </div>

                <div className="mt-4">
                  <button
                    onClick={submitTest}
                    disabled={saving || attemptedCount === 0}
                    className={cls(
                      "w-full inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm",
                      attemptedCount === 0
                        ? "bg-slate-200 text-slate-500 cursor-not-allowed"
                        : "bg-indigo-600 hover:bg-indigo-700 text-white"
                    )}
                  >
                    {saving ? <Loader2 className="animate-spin" size={16} /> : <SendHorizonal size={16} />}
                    Submit
                  </button>
                </div>

                {/* Warnings panel */}
                {warnings > 0 && warnings < 3 && (
                  <div className="mt-3 rounded-2xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
                    <div className="flex items-start gap-2">
                      <AlertTriangle size={14} className="mt-0.5" />
                      <div>
                        We noticed you switched away from the test. Remaining warnings:{" "}
                        <b>{3 - warnings}</b>.
                      </div>
                    </div>
                  </div>
                )}
                {warnings >= 3 && (
                  <div className="mt-3 rounded-2xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-900">
                    <div className="flex items-start gap-2">
                      <AlertTriangle size={14} className="mt-0.5" />
                      <div>Limit reached. Submitting your test…</div>
                    </div>
                  </div>
                )}
              </Card>
            </motion.aside>
          </div>
        )}
      </div>

      {/* Anti-cheat modal */}
      <Modal open={cheatOpen} onClose={() => setCheatOpen(false)}>
        <div className="p-5">
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-xl bg-amber-100 text-amber-800 grid place-items-center">
              <AlertTriangle size={18} />
            </div>
            <div>
              <div className="font-semibold text-slate-900">Stay on the test page</div>
              <div className="text-sm text-slate-600 mt-1">
                Switching tabs/apps is not allowed during the assessment.
              </div>
              <div className="text-sm text-slate-800 mt-2">
                Warnings used: <b>{warnings}</b> / 3
              </div>
            </div>
          </div>
          <div className="mt-4 text-right">
            <button
              onClick={() => setCheatOpen(false)}
              className="inline-flex items-center gap-2 rounded-xl border bg-white hover:bg-slate-50 px-3 py-1.5 text-sm"
            >
              Okay
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

/* =========================== Page: two-test selector =========================== */
export default function TestSkill() {
  const { selected, loading: skillLoading } = useSkill();
  const [active, setActive] = useState(null); // null | 'skill' | 'aptitude'

  if (active) {
    return (
      <div className="w-full">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-4">
          <button
            onClick={() => setActive(null)}
            className="mb-4 inline-flex items-center gap-2 rounded-xl border bg-white hover:bg-slate-50 px-3 py-2 text-sm text-slate-700"
          >
            <ArrowLeft size={16} />
            Back to test chooser
          </button>
        </div>
        <TestRunner mode={active} selectedSkill={selected} />
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        <motion.div {...fade(0)}>
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-slate-900">
            Take an Assessment
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Boost your profile with both <b>Skill</b> and <b>Aptitude</b> scores.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-5">
          {/* Skill Test Card */}
          <motion.div {...fade(0.03)}>
            <Card className="p-5 bg-gradient-to-br from-indigo-50/70 to-white">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="h-11 w-11 rounded-2xl bg-indigo-600 text-white grid place-items-center">
                    <Blocks size={20} />
                  </div>
                  <div>
                    <div className="text-lg font-semibold text-slate-900">Skill Test</div>
                    <div className="text-sm text-slate-600">
                      {skillLoading
                        ? "Loading skill…"
                        : selected?.name
                        ? `Selected: ${selected.name}`
                        : "Pick a skill in Profile first"}
                    </div>
                  </div>
                </div>
              </div>
              <ul className="mt-3 text-sm text-slate-700 list-disc list-inside">
                <li>Measures domain knowledge & practical understanding</li>
                <li>Timer & anti-cheat enabled</li>
              </ul>
              <div className="mt-4">
                <button
                  onClick={() => setActive("skill")}
                  disabled={!selected?._id}
                  className={cls(
                    "inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm",
                    selected?._id
                      ? "bg-indigo-600 hover:bg-indigo-700 text-white"
                      : "bg-slate-200 text-slate-500 cursor-not-allowed"
                  )}
                >
                  <Rocket size={16} />
                  Start Skill Test
                </button>
              </div>
            </Card>
          </motion.div>

          {/* Aptitude Test Card */}
          <motion.div {...fade(0.05)}>
            <Card className="p-5 bg-gradient-to-br from-sky-50/70 to-white">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="h-11 w-11 rounded-2xl bg-sky-600 text-white grid place-items-center">
                    <BrainCircuit size={20} />
                  </div>
                  <div>
                    <div className="text-lg font-semibold text-slate-900">Aptitude Test</div>
                    <div className="text-sm text-slate-600">Quant • Logical • Verbal</div>
                  </div>
                </div>
              </div>
              <ul className="mt-3 text-sm text-slate-700 list-disc list-inside">
                <li>General screening for problem-solving ability</li>
                <li>Timer & anti-cheat enabled</li>
              </ul>
              <div className="mt-4">
                <button
                  onClick={() => setActive("aptitude")}
                  className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm bg-sky-600 hover:bg-sky-700 text-white"
                >
                  <Rocket size={16} />
                  Start Aptitude Test
                </button>
              </div>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
