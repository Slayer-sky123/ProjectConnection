// src/pages/student/AIGuidance.jsx
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import API from "../../api/axios";
import {
  Sparkles, Target, Lightbulb, Briefcase, CalendarDays, Star, StarOff,
  Plus, Check, Download, ChevronDown, ChevronUp, Wand2, Bot
} from "lucide-react";

const Card = ({ children, className = "" }) => (
  <div className={"rounded-2xl border border-slate-200/60 bg-white/80 shadow-sm " + className}>
    {children}
  </div>
);

const toDateInput = (d) => new Date(d).toISOString().slice(0, 16);

function icsForTask({ title, startISO, durationMins = 45, description = "Study Session" }) {
  const uid = Math.random().toString(36).slice(2);
  const dtStart = new Date(startISO);
  const dtEnd = new Date(dtStart.getTime() + durationMins * 60 * 1000);
  const fmt = (x) => x.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
  return new Blob([`BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//StudentConnect//Guidance//EN
BEGIN:VEVENT
UID:${uid}
DTSTAMP:${fmt(new Date())}
DTSTART:${fmt(dtStart)}
DTEND:${fmt(dtEnd)}
SUMMARY:${title.replace(/\n/g, " ")}
DESCRIPTION:${description.replace(/\n/g, " ")}
END:VEVENT
END:VCALENDAR`], { type: "text/calendar;charset=utf-8" });
}
function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

export default function AIGuidance() {
  const [skills, setSkills] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  const [targetSkill, setTargetSkill] = useState("");
  const [boost, setBoost] = useState(0);
  const [showPlan, setShowPlan] = useState(true);

  // AI coach
  const [coachBusy, setCoachBusy] = useState(false);
  const [coachNote, setCoachNote] = useState("");

  // localStorage
  const PLAN_KEY = "student.guidance.weeklyPlan";
  const BOOK_KEY = "student.guidance.bookmarks";

  const [plan, setPlan] = useState(() => {
    try { return JSON.parse(localStorage.getItem(PLAN_KEY) || "[]"); }
    catch { return []; }
  });
  const [bookmarks, setBookmarks] = useState(() => {
    try { return new Set(JSON.parse(localStorage.getItem(BOOK_KEY) || "[]")); }
    catch { return new Set(); }
  });

  useEffect(() => { localStorage.setItem(PLAN_KEY, JSON.stringify(plan)); }, [plan]);
  useEffect(() => { localStorage.setItem(BOOK_KEY, JSON.stringify(Array.from(bookmarks))); }, [bookmarks]);

  useEffect(() => {
    document.title = "AI Career Guidance | StudentConnect";
    (async () => {
      setLoading(true);
      try {
        const [sp, jb] = await Promise.allSettled([
          API.get("/student/skill-progress"),
          API.get("/student/jobs"),
        ]);
        const s = Array.isArray(sp.value?.data) ? sp.value.data : [];
        setSkills(s);
        setJobs(Array.isArray(jb.value?.data) ? jb.value.data : []);
        const flat = s.map(sk => ({
          name: sk.skill?.name || sk.skill,
          avg: sk.history.length ? (sk.history.reduce((a, b) => a + b.score, 0) / sk.history.length) : 0,
        }));
        const lowest = flat.filter(x => x.name).sort((a,b)=>a.avg-b.avg)[0]?.name || "";
        setTargetSkill(lowest);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const flatSkills = useMemo(() => (
    skills.map(s => ({
      name: s.skill?.name || s.skill,
      avg: s.history.length ? (s.history.reduce((a, b) => a + b.score, 0) / s.history.length) : 0,
      latest: s.history.slice().sort((a,b)=> new Date(b.createdAt)-new Date(a.createdAt))[0]?.score ?? 0,
    }))
  ), [skills]);

  const strengths = useMemo(
    () => flatSkills.filter(x => x.avg >= 7).sort((a,b)=>b.avg-a.avg).slice(0, 3),
    [flatSkills]
  );
  const gaps = useMemo(
    () => flatSkills.filter(x => x.avg < 5).sort((a,b)=>a.avg-b.avg).slice(0, 3),
    [flatSkills]
  );

  const matches = useMemo(() => {
    const boosted = new Map(flatSkills.map(s => [s.name?.toLowerCase(), s.avg]));
    if (targetSkill) {
      const k = targetSkill.toLowerCase();
      boosted.set(k, Math.min(10, (boosted.get(k) || 0) + Number(boost)));
    }
    const scoreJob = (j) => {
      const names = (j.skills || []).map(s => (typeof s === "string" ? s : s.name || "").toLowerCase());
      return Math.round(names.reduce((acc, n) => acc + (boosted.get(n) || 0), 0));
    };
    return jobs.map(j => ({ job: j, match: scoreJob(j)})).sort((a,b)=>b.match-a.match).slice(0, 6);
  }, [jobs, flatSkills, targetSkill, boost]);

  const expectedGain = useMemo(() => {
    if (!targetSkill || boost <= 0 || jobs.length === 0) return 0;
    const base = jobs.slice(0, 20).map(j => {
      const names = (j.skills || []).map(s => (typeof s === "string" ? s : s.name || "").toLowerCase());
      const baseSum = flatSkills.reduce((acc, sk) => acc + (names.includes((sk.name || "").toLowerCase()) ? sk.avg : 0), 0);
      const boostedSum = flatSkills.reduce((acc, sk) => {
        let v = sk.avg;
        if ((sk.name || "").toLowerCase() === targetSkill.toLowerCase()) v = Math.min(10, v + Number(boost));
        return acc + (names.includes((sk.name || "").toLowerCase()) ? v : 0);
      }, 0);
      return boostedSum - baseSum;
    });
    return Math.round((base.reduce((a,b)=>a+b, 0) / base.length) || 0);
  }, [jobs, flatSkills, targetSkill, boost]);

  const suggested = useMemo(() => {
    const arr = [];
    if (gaps[0]?.name) arr.push(`Practice ${gaps[0].name}: 3 problems + 30m notes`);
    if (strengths[0]?.name) arr.push(`Mini-project using ${strengths[0].name} and publish on GitHub`);
    arr.push("Watch 1 webinar & take 5 bullet notes");
    return arr;
  }, [gaps, strengths]);

  // AI Coach loader (always returns something thanks to backend)
  async function loadCoachNote() {
    setCoachBusy(true);
    try {
      const latestScores = flatSkills.map(s => ({ skill: s.name, avg: Number(s.avg.toFixed(1)) }));
      const payload = {
        strengths: strengths.map(s => s.name),
        gaps: gaps.map(s => s.name),
        latestScores,
        targetRoles: [],
      };
      const res = await API.post("/ai/guidance", payload); // baseURL already /api
      setCoachNote(res.data?.coachNote || "Short guidance unavailable right now.");
    } catch {
      setCoachNote("Short guidance unavailable right now.");
    } finally {
      setCoachBusy(false);
    }
  }

  useEffect(() => { if (!loading) loadCoachNote(); /* eslint-disable-next-line */ }, [loading]);

  if (loading) return <div className="max-w-6xl mx-auto p-6">Loading guidance…</div>;

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">AI Career Guidance</h1>
        <Link to="/student/dashboard" className="text-sky-700 underline">Back to dashboard</Link>
      </div>

      <Card className="p-5 bg-gradient-to-br from-sky-50/70 to-white">
        <div className="flex items-center gap-2">
          <Sparkles className="text-sky-600" />
          <h2 className="font-semibold">Personalized Snapshot</h2>
        </div>
        <p className="text-sm text-slate-600 mt-1">
          Built from your test history and current openings. Simulate progress, shortlist roles, and export your weekly plan.
        </p>
      </Card>

      {/* AI Coach */}
      <Card className="p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bot className="text-violet-600" />
            <h3 className="font-semibold">AI Coach</h3>
          </div>
          <button onClick={loadCoachNote} disabled={coachBusy} className="px-3 py-1.5 rounded-lg border hover:bg-slate-50 text-sm">
            {coachBusy ? "Refreshing…" : "Refresh advice"}
          </button>
        </div>
        <div className="mt-3 text-sm whitespace-pre-wrap">
          {coachNote || "Loading…"}
        </div>
      </Card>

      <div className="grid md:grid-cols-2 gap-4">
        <Card className="p-5">
          <div className="flex items-center gap-2 mb-2">
            <Target className="text-emerald-600" />
            <h3 className="font-semibold">Strengths</h3>
          </div>
          {strengths.length === 0 ? (
            <p className="text-sm text-slate-600">Take a few skill tests to reveal your strengths.</p>
          ) : (
            <ul className="text-sm space-y-2">
              {strengths.map(s => (
                <li key={s.name} className="flex items-center justify-between border rounded-xl px-3 py-2">
                  <span>{s.name}</span>
                  <span className="text-emerald-700 text-xs px-2 py-1 rounded-full border border-emerald-200 bg-emerald-50">
                    Avg {s.avg.toFixed(1)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card className="p-5">
          <div className="flex items-center gap-2 mb-2">
            <Lightbulb className="text-amber-600" />
            <h3 className="font-semibold">Gaps to Improve</h3>
          </div>
          {gaps.length === 0 ? (
            <p className="text-sm text-slate-600">Nice! No major gaps detected yet.</p>
          ) : (
            <ul className="text-sm space-y-2">
              {gaps.map(s => (
                <li key={s.name} className="flex items-center justify-between border rounded-xl px-3 py-2">
                  <span>{s.name}</span>
                  <span className="text-amber-700 text-xs px-2 py-1 rounded-full border border-amber-200 bg-amber-50">
                    Avg {s.avg.toFixed(1)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <Card className="p-5">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Briefcase className="text-indigo-600" />
              <h3 className="font-semibold">Top Matches</h3>
            </div>
            <p className="text-sm text-slate-600">Simulate improving a skill to see how your matches move.</p>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm text-slate-600">Target skill</label>
            <select value={targetSkill} onChange={(e) => setTargetSkill(e.target.value)} className="border rounded-lg px-3 py-1.5 bg-white">
              <option value="">Select…</option>
              {flatSkills.filter(s=>s.name).map(s => (<option key={s.name} value={s.name}>{s.name}</option>))}
            </select>
            <label className="text-sm text-slate-600">Boost</label>
            <input type="range" min="0" max="3" step="1" value={boost} onChange={(e)=>setBoost(e.target.value)} />
            <span className="text-sm font-medium w-8 text-right">{boost}</span>
          </div>
        </div>

        {expectedGain > 0 && (
          <div className="mt-2 text-xs text-emerald-700 px-2 py-1 rounded-md bg-emerald-50 inline-flex items-center gap-1">
            <Wand2 size={14}/> Expected average match gain: +{expectedGain}
          </div>
        )}

        {matches.length === 0 ? (
          <p className="text-sm text-slate-600 mt-3">No jobs available yet. Check again soon.</p>
        ) : (
          <ul className="grid md:grid-cols-2 gap-3 mt-4">
            {matches.map(({ job, match }) => {
              const id = job._id;
              const saved = bookmarks.has(id);
              return (
                <li key={id} className="border rounded-xl p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-medium">{job.title}</div>
                      <div className="text-xs text-slate-500">{job.company?.name || "—"} • {job.location || "Remote"}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs px-2 py-1 rounded-full border bg-indigo-50 text-indigo-700">Match {match}</span>
                      <button onClick={() => setBookmarks(prev => {
                        const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next;
                      })}
                        className="p-1.5 rounded-lg border hover:bg-slate-50" title={saved ? "Remove from shortlist" : "Save to shortlist"}>
                        {saved ? <Star className="text-amber-500" size={16}/> : <StarOff size={16}/>}
                      </button>
                    </div>
                  </div>
                  <p className="text-sm text-slate-600 mt-2 line-clamp-3">{job.description}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {(job.skills || []).slice(0,5).map((s, i) => (
                      <span key={i} className="text-xs px-2 py-0.5 rounded-full border bg-slate-50">
                        {typeof s === "string" ? s : (s.name || "")}
                      </span>
                    ))}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Card>

      <Card className="p-5">
        <div className="flex items-center gap-2 mb-2">
          <Wand2 className="text-violet-600" />
          <h3 className="font-semibold">Micro-project Idea</h3>
        </div>
        <p className="text-sm text-slate-700">
          {strengths[0]?.name
            ? `Build a tiny app or script that showcases your ${strengths[0].name}. Keep it under 6 hours and publish on GitHub with a 200-word README.`
            : "Pick one strength and ship a tiny app in under 6 hours. Publish with a clear README."}
        </p>
      </Card>
    </div>
  );
}
