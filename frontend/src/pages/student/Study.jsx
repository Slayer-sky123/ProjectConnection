import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { BookOpenCheck, CheckCircle2, Loader2, NotebookPen, Sparkles, Target } from "lucide-react";
import API from "../../api/axios";
import { useSkill } from "../../context/SkillContext.jsx";

const fade = (delay = 0) => ({
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.35, ease: "easeOut", delay } },
});

function Card({ children, className = "" }) {
  return (
    <div className={"rounded-2xl border border-slate-200/60 bg-white/80 shadow-sm " + className}>
      {children}
    </div>
  );
}

function LevelBadge({ level }) {
  const map = {
    Beginner: "bg-emerald-50 text-emerald-700 border-emerald-200",
    Intermediate: "bg-indigo-50 text-indigo-700 border-indigo-200",
    Advanced: "bg-rose-50 text-rose-700 border-rose-200",
  };
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs border ${map[level] || "bg-slate-50 text-slate-700 border-slate-200"}`}>
      {level}
    </span>
  );
}

export default function Study() {
  const { selected: currentSkill, loading: skillLoading } = useSkill();

  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState(null);

  const [progress, setProgress] = useState({ total: 0, done: 0, pct: 0 });
  const [plan, setPlan] = useState(null);
  const [planLoading, setPlanLoading] = useState(false);

  const skillId = currentSkill?._id || "";

  async function loadAll() {
    if (!skillId) return;
    setLoading(true);
    try {
      const [mats, prog] = await Promise.all([
        API.get(`/student/study/materials`, { params: { skillId } }),
        API.get(`/student/study/progress`, { params: { skillId } }),
      ]);
      setMaterials(Array.isArray(mats.data?.materials) ? mats.data.materials : []);
      setProgress(prog.data || { total: 0, done: 0, pct: 0 });
    } catch (e) {
      console.error("Study load failed:", e?.response?.data || e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!skillLoading && skillId) loadAll();
  }, [skillLoading, skillId]);

  const levels = useMemo(() => {
    const g = { Beginner: [], Intermediate: [], Advanced: [] };
    (materials || []).forEach((m) => {
      (g[m.level] || (g[m.level] = [])).push(m);
    });
    return g;
  }, [materials]);

  async function mark(materialId, status = "done") {
    try {
      setSavingId(materialId);
      await API.post("/student/study/complete", { materialId, status });
      await loadAll();
    } catch (e) {
      console.error("mark failed:", e?.response?.data || e.message);
    } finally {
      setSavingId(null);
    }
  }

  async function buildPlan() {
    if (!skillId) return;
    setPlanLoading(true);
    try {
      const r = await API.post("/student/study/plan", { skillId });
      setPlan(r.data?.plan || null);
    } catch (e) {
      console.error("plan failed:", e?.response?.data || e.message);
    } finally {
      setPlanLoading(false);
    }
  }

  return (
    <div className="w-full">
      <div className="mx-auto max-w-screen-2xl px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Header */}
        <motion.div {...fade(0)}>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-slate-900">Study</h1>
              <p className="text-sm text-slate-600 mt-1">
                Curated learning materials, tailored to your selected skill.
              </p>
              {currentSkill?.name && (
                <div className="mt-2 inline-flex items-center gap-2 text-xs px-2 py-1 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-200">
                  <Sparkles size={14} />
                  <span>Focused Skill:</span>
                  <b>{currentSkill.name}</b>
                </div>
              )}
            </div>

            <div className="flex items-center gap-3">
              <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm">
                <div className="flex items-center gap-2">
                  <Target size={16} className="text-indigo-600" />
                  <span className="font-medium text-slate-800">Progress:</span>
                  <span className="text-slate-600">{progress.done}/{progress.total} ({progress.pct}%)</span>
                </div>
              </div>
              <button
                onClick={buildPlan}
                className="inline-flex items-center gap-2 rounded-xl border border-indigo-200 bg-indigo-600 text-white hover:bg-indigo-700 px-3 py-2 text-sm disabled:opacity-60"
                disabled={!skillId || planLoading}
              >
                {planLoading ? <Loader2 size={16} className="animate-spin" /> : <BookOpenCheck size={16} />}
                Build Weekly Plan
              </button>
            </div>
          </div>
        </motion.div>

        {/* Plan */}
        {plan && (
          <motion.div {...fade(0.03)}>
            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-slate-600">Adaptive plan</div>
                  <div className="text-lg font-semibold text-slate-900">
                    Primary Focus: {plan.primaryLevel} {plan.avgPct !== null ? `• Avg: ${plan.avgPct}%` : ""}
                  </div>
                </div>
              </div>
              <div className="mt-4 grid md:grid-cols-2 gap-3">
                {plan.plan.map((d) => (
                  <div key={d.day} className="rounded-xl border bg-white p-3">
                    <div className="text-sm font-semibold text-slate-900">{d.day}</div>
                    <div className="text-xs text-slate-600">{d.note}</div>
                    <ul className="mt-2 space-y-2">
                      {d.items.map((it, i) => (
                        <li key={`${d.day}-${i}`} className="flex items-center gap-2 text-sm">
                          <LevelBadge level={it.level} />
                          <a href={it.url || "#"} className="underline decoration-slate-300 hover:decoration-indigo-400" target="_blank" rel="noreferrer">
                            {it.title}
                          </a>
                          <span className="text-xs text-slate-500">({it.type})</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </Card>
          </motion.div>
        )}

        {/* Materials by Level */}
        <motion.div {...fade(0.06)} className="grid grid-cols-12 gap-4">
          {["Beginner", "Intermediate", "Advanced"].map((lvl) => (
            <Card key={lvl} className="p-4 col-span-12 lg:col-span-4">
              <div className="flex items-center justify-between">
                <div className="text-lg font-semibold text-slate-900">{lvl}</div>
                <LevelBadge level={lvl} />
              </div>

              {loading ? (
                <div className="py-10 text-center text-sm text-slate-500">Loading…</div>
              ) : (levels[lvl] || []).length === 0 ? (
                <div className="py-8 text-center text-sm text-slate-500">No materials yet for this level.</div>
              ) : (
                <ul className="mt-3 space-y-3">
                  {levels[lvl].map((m) => (
                    <li
                      key={m._id}
                      className="rounded-xl border bg-white p-3 hover:border-indigo-200 transition"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="font-medium leading-tight">{m.title}</div>
                          <div className="text-xs text-slate-500">{m.type} • {m.difficulty}</div>
                          {m.description ? (
                            <div className="text-xs text-slate-600 mt-1">{m.description}</div>
                          ) : null}
                          {m.url ? (
                            <div className="mt-1">
                              <a
                                className="text-xs underline decoration-slate-300 hover:decoration-indigo-400"
                                href={m.url}
                                target="_blank"
                                rel="noreferrer"
                              >
                                Open resource
                              </a>
                            </div>
                          ) : null}
                        </div>

                        <div className="flex flex-col gap-2">
                          <button
                            className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-lg border bg-white hover:bg-slate-50"
                            onClick={() => mark(m._id, m.status === "done" ? "todo" : "done")}
                            disabled={savingId === m._id}
                            title={m.status === "done" ? "Mark as To-do" : "Mark as Done"}
                          >
                            {m.status === "done" ? (
                              <>
                                <NotebookPen size={14} /> To-do
                              </>
                            ) : (
                              <>
                                <CheckCircle2 size={14} /> Done
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          ))}
        </motion.div>
      </div>
    </div>
  );
}
