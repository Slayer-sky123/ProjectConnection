import { useEffect, useState, useMemo } from "react";
import API from "../api/axios";
import { BrainCircuit, Sparkles, Target, Briefcase, CalendarDays, MessageSquare, ArrowUpRight, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";

const Card = ({ children, className="" }) => (
  <div className={`rounded-2xl border bg-white/80 backdrop-blur p-5 ${className}`} />
);

const Chip = ({ children, tone="sky" }) => (
  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-${tone}-50 text-${tone}-700 border border-${tone}-200`}>
    {children}
  </span>
);

export default function AICareerGuidance() {
  const [data, setData] = useState(null);
  const [ask, setAsk] = useState("");
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(true);
  const [asking, setAsking] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await API.get("/student/ai/guidance");
      setData(res.data || {});
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(()=>{ load(); }, []);

  const readinessPct = useMemo(() => {
    const r = data?.metrics?.readiness ?? 0;
    return Math.round((r/10)*100);
  }, [data]);

  const askAI = async (e) => {
    e.preventDefault();
    if (!ask.trim()) return;
    setAsking(true);
    setAnswer("");
    try {
      const res = await API.post("/student/ai/ask", { q: ask.trim() });
      setAnswer(res.data?.answer || "");
    } finally {
      setAsking(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <Card className="grid place-items-center h-48 text-slate-500">
          <Loader2 className="animate-spin" size={18} /> <span className="ml-2">Preparing your guidance…</span>
        </Card>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <Card className="text-center">
          <h3 className="font-semibold">No guidance available</h3>
          <p className="text-sm text-slate-600 mt-1">Try taking a few skill tests or apply to roles to unlock personalized insights.</p>
        </Card>
      </div>
    );
  }

  const strengths = data.metrics?.strengths || [];
  const gaps = data.metrics?.gaps || [];
  const matches = data.jobMatches || [];
  const plan = data.weeklyPlan || [];
  const gapRes = data.gapResources || [];
  const hacks = data.upcomingHackathons || [];
  const coachNote = data.coachNote;

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-sky-50 text-sky-700 border border-sky-200 grid place-items-center">
            <BrainCircuit size={18}/>
          </div>
          <div>
            <h1 className="text-xl font-semibold tracking-tight">AI Career Guidance</h1>
            <p className="text-xs text-slate-600">Tailored from your skills, activity & goals</p>
          </div>
        </div>
        <div className="hidden sm:flex items-center gap-2">
          <div className="text-right">
            <div className="text-xs text-slate-500">Readiness</div>
            <div className="text-lg font-semibold">{readinessPct}%</div>
          </div>
          <div className="h-8 w-28 bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-sky-300 to-emerald-300" style={{width:`${readinessPct}%`}} />
          </div>
        </div>
      </div>

      {/* coach note */}
      {coachNote && (
        <Card className="border-sky-200">
          <div className="flex items-start gap-3">
            <Sparkles className="text-sky-600 mt-0.5" size={18}/>
            <div>
              <div className="font-medium">Coach Note</div>
              <p className="text-sm text-slate-700 mt-1 whitespace-pre-wrap">{coachNote}</p>
            </div>
          </div>
        </Card>
      )}

      {/* grid */}
      <div className="grid lg:grid-cols-3 gap-4">
        {/* strengths/gaps */}
        <Card className="lg:col-span-1">
          <div className="flex items-center gap-2 mb-3">
            <Target className="text-emerald-600" size={18}/>
            <h3 className="font-semibold">Strengths & Gaps</h3>
          </div>
          <div className="space-y-3">
            <div>
              <div className="text-xs text-slate-500 mb-1">Strengths</div>
              {strengths.length ? (
                <div className="flex flex-wrap gap-2">
                  {strengths.map(s => <Chip key={s} tone="emerald">{s}</Chip>)}
                </div>
              ) : <div className="text-sm text-slate-500">No strengths detected yet.</div>}
            </div>
            <div>
              <div className="text-xs text-slate-500 mb-1">Gaps</div>
              {gaps.length ? (
                <div className="flex flex-wrap gap-2">
                  {gaps.map(s => <Chip key={s} tone="rose">{s}</Chip>)}
                </div>
              ) : <div className="text-sm text-slate-500">No gaps detected. Keep going!</div>}
            </div>
          </div>

          {gapRes.length>0 && (
            <div className="mt-4">
              <div className="text-xs text-slate-500 mb-1">Suggested Resources</div>
              <ul className="space-y-2 text-sm">
                {gapRes.map(gr => (
                  <li key={gr.skill} className="rounded-lg p-2 bg-slate-50/60">
                    <div className="font-medium">{gr.skill}</div>
                    {gr.suggestions?.length ? (
                      <ul className="list-disc ml-5 mt-1 space-y-1">
                        {gr.suggestions.map((r,i)=>(
                          <li key={i}>
                            <a className="text-sky-700 underline" href={r.link} target="_blank" rel="noreferrer">{r.title}</a>
                          </li>
                        ))}
                      </ul>
                    ) : <div className="text-slate-500">Add resources in roadmap to surface here.</div>}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </Card>

        {/* job matches */}
        <Card className="lg:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Briefcase className="text-indigo-600" size={18}/>
              <h3 className="font-semibold">Best Job Matches</h3>
            </div>
            <Link to="/student/jobs" className="text-sm text-indigo-700 underline">Browse all</Link>
          </div>
          {matches.length===0 ? (
            <div className="text-sm text-slate-500">No matches yet. Try adding skills or taking tests.</div>
          ) : (
            <div className="grid md:grid-cols-2 gap-3">
              {matches.map(m=>(
                <div key={m._id} className="rounded-xl border p-4 bg-white hover:shadow-sm transition">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="font-medium">{m.title}</div>
                      <div className="text-xs text-slate-500">{m.company || "—"} • {m.location}</div>
                    </div>
                    <Chip tone="violet">{m.type}</Chip>
                  </div>
                  <div className="mt-2 text-xs text-slate-600">
                    Skills: {(m.skills||[]).join(", ") || "—"}
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <div className="text-xs text-slate-500">Fit score</div>
                    <div className="font-semibold">{m.fit}</div>
                  </div>
                  <div className="mt-3 flex justify-end">
                    <Link to="/student/jobs" className="inline-flex items-center gap-1 text-sm text-indigo-700 underline">
                      Apply <ArrowUpRight size={14}/>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* weekly plan + hackathons + ask ai */}
      <div className="grid lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-1">
          <div className="flex items-center gap-2 mb-3">
            <CalendarDays className="text-fuchsia-600" size={18}/>
            <h3 className="font-semibold">Weekly Plan</h3>
          </div>
          <ul className="text-sm space-y-2">
            {plan.map((p,i)=>(
              <li key={i} className="flex items-center justify-between rounded-lg bg-slate-50/70 p-2">
                <span className="font-medium">{p.day}</span>
                <span className="text-slate-600">{p.task}</span>
                <span className="text-slate-500">{p.minutes}m</span>
              </li>
            ))}
          </ul>
        </Card>

        <Card className="lg:col-span-1">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="text-amber-600" size={18}/>
            <h3 className="font-semibold">Upcoming Hackathons</h3>
          </div>
          {hacks.length===0 ? (
            <div className="text-sm text-slate-500">No upcoming events.</div>
          ) : (
            <ul className="text-sm space-y-2">
              {hacks.map(h=>(
                <li key={h._id} className="rounded-lg p-2 bg-slate-50/60">
                  <div className="font-medium">{h.title}</div>
                  <div className="text-xs text-slate-600">{new Date(h.startAt).toLocaleString()}</div>
                  <div className="mt-1">
                    <Link to={`/student/hackathons/${h._id}`} className="text-amber-700 underline text-xs">View</Link>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card className="lg:col-span-1">
          <div className="flex items-center gap-2 mb-3">
            <MessageSquare className="text-emerald-600" size={18}/>
            <h3 className="font-semibold">Ask AI</h3>
          </div>
          <form onSubmit={askAI} className="space-y-2">
            <textarea
              value={ask}
              onChange={e=>setAsk(e.target.value)}
              rows={4}
              className="w-full border rounded-xl px-3 py-2 bg-white/70 focus:outline-none focus:ring-2 focus:ring-emerald-200"
              placeholder="Ask about interview prep, skill gaps, or which roles to target…"
            />
            <button disabled={asking} className="w-full rounded-xl bg-emerald-600 text-white py-2 hover:bg-emerald-700">
              {asking ? "Thinking…" : "Ask"}
            </button>
          </form>
          {answer && (
            <div className="mt-3 text-sm text-slate-700 whitespace-pre-wrap bg-emerald-50/60 border border-emerald-200 rounded-xl p-3">
              {answer}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
