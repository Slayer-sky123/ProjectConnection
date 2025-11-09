// src/pages/student/Guidance.jsx
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Brain, CheckCircle2, Loader2, RefreshCcw, Sparkles } from "lucide-react";
import API from "../../api/axios";
import { useSkill } from "../../context/SkillContext.jsx";

const fade = (d = 0) => ({
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.35, ease: "easeOut", delay: d } },
});

function Card({ children, className = "" }) {
  return <div className={"rounded-2xl border border-slate-200/60 bg-white/80 shadow-sm " + className}>{children}</div>;
}

export default function Guidance() {
  const { selected: currentSkill, loading: skillLoading } = useSkill();
  const skillId = currentSkill?._id;

  const [loading, setLoading] = useState(true);
  const [building, setBuilding] = useState(false);
  const [data, setData] = useState(null);
  const [builtAt, setBuiltAt] = useState(null);
  const [error, setError] = useState("");

  async function fetchGuidance() {
    if (!skillId) return;
    setLoading(true);
    setError("");
    try {
      const r = await API.get("/student/guidance", { params: { skillId } });
      if (r.data?.guidance) {
        setData(r.data.guidance);
        setBuiltAt(r.data.builtAt || null);
      } else {
        setData(null);
        setBuiltAt(null);
      }
    } catch (e) {
      setError(e?.response?.data?.message || e.message || "Failed to fetch");
      setData(null);
    } finally {
      setLoading(false);
    }
  }

  async function buildNow() {
    if (!skillId || building) return;
    setBuilding(true);
    setError("");
    try {
      const r = await API.post("/student/guidance/build", { skillId });
      setData(r.data?.guidance || null);
      setBuiltAt(r.data?.builtAt || null);
    } catch (e) {
      setError(e?.response?.data?.message || e.message || "Build failed");
    } finally {
      setBuilding(false);
    }
  }

  useEffect(() => {
    if (!skillLoading && skillId) fetchGuidance();
  }, [skillLoading, skillId]);

  return (
    <div className="w-full">
      <div className="mx-auto max-w-screen-2xl px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        <motion.div {...fade(0)}>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-slate-900 flex items-center gap-2">
                <Brain size={22} className="text-indigo-600" />
                AI Career Guidance
              </h1>
              <p className="text-sm text-slate-600 mt-1">
                Personalized strengths, gaps, plan & projects — powered by your resume and <b>{currentSkill?.name || "selected skill"}</b>.
              </p>
              {builtAt && (
                <div className="text-xs text-slate-500 mt-1">
                  Last built: {new Date(builtAt).toLocaleString()}
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={fetchGuidance}
                className="inline-flex items-center gap-2 rounded-xl border bg-white hover:bg-slate-50 px-3 py-2 text-sm"
                disabled={loading || building || !skillId}
                title="Refresh"
              >
                <RefreshCcw size={16} />
                Refresh
              </button>
              <button
                onClick={buildNow}
                className="inline-flex items-center gap-2 rounded-xl border border-indigo-200 bg-indigo-600 text-white hover:bg-indigo-700 px-3 py-2 text-sm disabled:opacity-60"
                disabled={!skillId || building}
              >
                {building ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                Rebuild with latest resume/tests
              </button>
            </div>
          </div>
        </motion.div>

        {/* Skill not selected */}
        {!skillLoading && !skillId && (
          <Card className="p-6">
            <div className="text-sm text-slate-700">
              Please select your focused skill in Profile Setup to generate guidance.
            </div>
          </Card>
        )}

        {/* Error */}
        {error && (
          <Card className="p-4 border-rose-200 bg-rose-50/60">
            <div className="text-rose-700 text-sm">{error}</div>
          </Card>
        )}

        {/* Loading */}
        {loading && skillId && (
          <Card className="p-8 text-center">
            <div className="inline-flex items-center gap-2 text-slate-600">
              <Loader2 className="animate-spin" size={18} />
              Loading guidance…
            </div>
          </Card>
        )}

        {/* Empty / CTA */}
        {!loading && !data && skillId && !error && (
          <Card className="p-8 text-center">
            <div className="mx-auto h-11 w-11 rounded-xl bg-indigo-50 text-indigo-700 grid place-items-center">
              <Sparkles size={18} />
            </div>
            <h2 className="mt-3 font-semibold text-slate-900">No guidance yet</h2>
            <p className="text-sm text-slate-600 mt-1">
              Click “Rebuild” to create a plan from your resume and progress.
            </p>
          </Card>
        )}

        {/* Loaded */}
        {data && (
          <div className="grid grid-cols-12 gap-4">
            {/* Left: strengths, gaps, topics */}
            <Card className="col-span-12 lg:col-span-6 p-5">
              <div className="text-lg font-semibold text-slate-900">Snapshot</div>
              <div className="text-xs text-slate-600">A compact view of your current profile.</div>

              <div className="mt-4 grid sm:grid-cols-2 gap-4">
                <div>
                  <div className="text-sm font-medium text-emerald-700">Strengths</div>
                  <ul className="mt-2 space-y-2 text-sm">
                    {(data.strengths || []).map((s, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <CheckCircle2 size={16} className="text-emerald-600 mt-0.5" />
                        <span className="text-slate-800">{s}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <div className="text-sm font-medium text-rose-700">Gaps</div>
                  <ul className="mt-2 space-y-2 text-sm">
                    {(data.gaps || []).map((s, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="mt-1 h-2 w-2 rounded-full bg-rose-500" />
                        <span className="text-slate-800">{s}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="mt-5">
                <div className="text-sm font-medium text-indigo-700">Suggested Topics</div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {(data.suggestedTopics || []).map((t, i) => (
                    <span key={i} className="text-xs px-2 py-1 rounded-lg border bg-indigo-50 text-indigo-700 border-indigo-200">
                      {t}
                    </span>
                  ))}
                </div>
              </div>

              <div className="mt-5">
                <div className="text-sm font-medium text-slate-800">Keywords for Job Boards</div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {(data.keywords || []).map((k, i) => (
                    <span key={i} className="text-xs px-2 py-1 rounded-lg border bg-slate-50 text-slate-700 border-slate-200">
                      {k}
                    </span>
                  ))}
                </div>
              </div>
            </Card>

            {/* Right: projects */}
            <Card className="col-span-12 lg:col-span-6 p-5">
              <div className="text-lg font-semibold text-slate-900">Projects to Showcase</div>
              <div className="text-xs text-slate-600">Build credibility with targeted work.</div>
              <div className="mt-3 space-y-3">
                {(data.projects || []).map((p, i) => (
                  <div key={i} className="rounded-xl border bg-white p-3">
                    <div className="font-medium">{p.title}</div>
                    <div className="text-sm text-slate-600 mt-1">{p.description}</div>
                    <ul className="mt-2 list-disc list-inside text-sm text-slate-700">
                      {(p.outline || []).map((o, j) => <li key={j}>{o}</li>)}
                    </ul>
                  </div>
                ))}
              </div>
            </Card>

            {/* Full width: weekly plan */}
            <Card className="col-span-12 p-5">
              <div className="text-lg font-semibold text-slate-900">Weekly Plan</div>
              <div className="text-xs text-slate-600">Adapts as your tests & study progress evolve.</div>
              <div className="mt-3 grid md:grid-cols-2 xl:grid-cols-3 gap-3">
                {(data.weeklyPlan || []).map((d, i) => (
                  <div key={i} className="rounded-xl border bg-white p-3">
                    <div className="text-sm font-semibold text-slate-900">{d.day} — {d.focus}</div>
                    <ul className="mt-2 list-disc list-inside text-sm text-slate-700">
                      {(d.tasks || []).map((t, j) => <li key={j}>{t}</li>)}
                    </ul>
                    {(d.resources || []).length > 0 && (
                      <div className="mt-2">
                        <div className="text-xs text-slate-500">Resources</div>
                        <ul className="text-xs list-disc list-inside">
                          {d.resources.map((r, k) => (
                            <li key={k}>
                              {r.url ? (
                                <a href={r.url} target="_blank" rel="noreferrer" className="underline decoration-slate-300 hover:decoration-indigo-400">
                                  {r.title}
                                </a>
                              ) : (
                                <span>{r.title}</span>
                              )}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ))}
              </div>
              {data.notes ? <div className="mt-3 text-xs text-slate-500">{data.notes}</div> : null}
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
