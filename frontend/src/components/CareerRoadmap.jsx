import { useEffect, useMemo, useState } from "react";
import API from "../api/axios";
import {
  BrainCircuit, ChevronDown, CheckCircle2, Circle, Link as LinkIcon, BookOpen
} from "lucide-react";

/* ---------- tiny UI helpers ---------- */
const Card = ({ children, className = "" }) => (
  <div className={`bg-white/80 backdrop-blur rounded-2xl border p-6 ${className}`}>{children}</div>
);
const Chip = ({ children, tone = "blue", className = "" }) => (
  <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs ring-1
  bg-${tone}-50 text-${tone}-700 ring-${tone}-200 ${className}`}>{children}</span>
);

export default function CareerRoadmap() {
  const [roadmap, setRoadmap] = useState({});
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState({}); // which skill sections are expanded
  const [completed, setCompleted] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("roadmap.completed") || "{}");
    } catch { return {}; }
  });

  useEffect(() => {
    const fetchRoadmap = async () => {
      try {
        const res = await API.get("/student/career-roadmap");
        const data = res.data?.roadmap || {};
        setRoadmap(data);

        // open the first skill by default
        const firstKey = Object.keys(data)[0];
        setOpen((o) => (firstKey ? { ...o, [firstKey]: true } : o));
      } catch (err) {
        console.error("Failed to fetch roadmap", err);
      } finally {
        setLoading(false);
      }
    };
    fetchRoadmap();
  }, []);

  // persist completion
  useEffect(() => {
    localStorage.setItem("roadmap.completed", JSON.stringify(completed));
  }, [completed]);

  const skillNames = Object.keys(roadmap);

  const toggleOpen = (k) => setOpen((o) => ({ ...o, [k]: !o[k] }));

  const toggleStep = (skill, stepIdx) => {
    setCompleted((c) => {
      const prev = new Set(c[skill] || []);
      if (prev.has(stepIdx)) prev.delete(stepIdx);
      else prev.add(stepIdx);
      return { ...c, [skill]: Array.from(prev) };
    });
  };

  const resetSkill = (skill) =>
    setCompleted((c) => ({ ...c, [skill]: [] }));

  const markAllSkill = (skill) =>
    setCompleted((c) => ({
      ...c,
      [skill]: roadmap[skill]?.map((_, idx) => idx) || [],
    }));

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto py-10 px-4 space-y-6">
        <Card className="animate-pulse">
          <div className="h-6 w-56 rounded bg-slate-200" />
          <div className="mt-4 h-24 w-full rounded bg-slate-200" />
        </Card>
      </div>
    );
  }

  if (!skillNames.length) {
    return (
      <div className="max-w-5xl mx-auto p-10 text-center">
        <div className="mx-auto h-12 w-12 rounded-xl bg-blue-50 text-blue-700 grid place-items-center">
          <BrainCircuit />
        </div>
        <h2 className="mt-3 text-lg font-semibold">No personalized roadmap yet</h2>
        <p className="text-sm text-gray-600">Start taking skill tests to unlock your tailored plan.</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
          <BrainCircuit className="text-blue-600" /> Career Roadmap
        </h2>
        <Chip tone="blue">Guided • Actionable • Minimal</Chip>
      </div>

      {skillNames.map((skill) => {
        const steps = Array.isArray(roadmap[skill]) ? roadmap[skill] : [];
        const doneList = new Set(completed[skill] || []);
        const done = doneList.size;
        const total = steps.length;
        const pct = total ? Math.round((done / total) * 100) : 0;

        return (
          <Card key={skill} className="overflow-hidden">
            {/* header */}
            <button
              onClick={() => toggleOpen(skill)}
              className="w-full flex items-center justify-between text-left"
            >
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-xl bg-blue-50 text-blue-700 grid place-items-center ring-1 ring-blue-200">
                  <BookOpen size={16} />
                </div>
                <div>
                  <div className="font-semibold">{skill} Roadmap</div>
                  <div className="text-xs text-gray-600">{done}/{total} steps completed</div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-xs text-gray-600">{pct}%</span>
                <div className="w-28 h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500" style={{ width: `${pct}%` }} />
                </div>
                <ChevronDown
                  size={18}
                  className={`text-gray-500 transition-transform ${open[skill] ? "rotate-180" : ""}`}
                />
              </div>
            </button>

            {/* body */}
            {open[skill] && (
              <div className="mt-5">
                <div className="flex items-center gap-2 mb-4">
                  <button
                    onClick={() => markAllSkill(skill)}
                    className="px-3 py-1.5 rounded-lg border text-sm hover:bg-gray-50"
                  >
                    Mark all done
                  </button>
                  <button
                    onClick={() => resetSkill(skill)}
                    className="px-3 py-1.5 rounded-lg border text-sm hover:bg-gray-50"
                  >
                    Reset
                  </button>
                </div>

                <ul className="space-y-4">
                  {steps.map((step, idx) => {
                    const isDone = doneList.has(idx);
                    return (
                      <li
                        key={`${skill}-${idx}`}
                        className={`rounded-xl border p-4 ${
                          isDone
                            ? "bg-emerald-50/50 border-emerald-200"
                            : "bg-blue-50/30 border-blue-100"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-3">
                            <button
                              onClick={() => toggleStep(skill, idx)}
                              className={`mt-0.5 h-6 w-6 rounded-full grid place-items-center 
                              ${isDone ? "text-emerald-600" : "text-gray-400"}`}
                              title={isDone ? "Completed" : "Mark completed"}
                            >
                              {isDone ? <CheckCircle2 /> : <Circle />}
                            </button>
                            <div>
                              <div className="text-xs uppercase tracking-wide text-blue-700 font-bold">
                                {step.level}
                              </div>
                              <h4 className="font-semibold leading-tight mt-0.5">{step.title}</h4>
                              {step.description && (
                                <p className="text-sm text-gray-600 mt-1">{step.description}</p>
                              )}
                            </div>
                          </div>

                          <Chip tone={isDone ? "emerald" : "slate"}>
                            {isDone ? "Done" : "Planned"}
                          </Chip>
                        </div>

                        {/* topics */}
                        {Array.isArray(step.topics) && step.topics.length > 0 && (
                          <div className="mt-3">
                            <p className="text-xs font-semibold text-gray-700 mb-1">Topics</p>
                            <ul className="text-sm text-gray-700 list-disc pl-5 space-y-1">
                              {step.topics.map((t, i) => (
                                <li key={i}>{t}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* resources */}
                        {Array.isArray(step.resources) && step.resources.length > 0 && (
                          <div className="mt-3">
                            <p className="text-xs font-semibold text-gray-700 mb-1">Resources</p>
                            <ul className="text-sm text-blue-700 space-y-1">
                              {step.resources.map((r, i) => (
                                <li key={i} className="flex items-center gap-2">
                                  <LinkIcon size={14} className="text-blue-500" />
                                  <a
                                    href={r.link}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="underline hover:text-blue-900"
                                  >
                                    {r.title}
                                  </a>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
          </Card>
        );
      })}
    </div>
  );
}
