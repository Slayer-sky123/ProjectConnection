const express = require("express");
const router = express.Router();
const fetch = (...args) => import("node-fetch").then(({default: f}) => f(...args)); // only if you need LLM APIs

// Helpers (replace with your models if needed)
async function getSkillProgress(userId, api) {
  // You likely already have a controller; this just proxies your existing route.
  const r = await api.get("/student/skill-progress");
  return Array.isArray(r.data) ? r.data : [];
}

async function getJobs(api) {
  const r = await api.get("/student/jobs");
  return Array.isArray(r.data) ? r.data : [];
}

async function getCareerRoadmap(api) {
  const r = await api.get("/student/career-roadmap");
  return r.data?.roadmap || {};
}

async function getHackathons(api) {
  const r = await api.get("/student/hackathons");
  return Array.isArray(r.data) ? r.data : [];
}

// ---- Simple scoring utilities ----
function avg(arr) { return arr.length ? arr.reduce((a,b)=>a+b,0)/arr.length : 0; }
function normalizeScore(n, min=0, max=10) { return Math.max(min, Math.min(max, +n||0)); }

// Make a shallow rule-based guidance scaffold
function makeGuidance({progress, jobs, roadmap, hackathons}) {
  // Skill baselines
  const skills = progress.map(s => ({
    id: s.skill?._id || s.skill,
    name: s.skill?.name || s.skill,
    latest: s.history?.length ? s.history.slice().sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt))[0].score : 0,
    average: normalizeScore(avg((s.history||[]).map(h=>h.score)))
  })).sort((a,b)=>b.average-a.average);

  const strengths = skills.filter(s=>s.average>=7).map(s=>s.name);
  const gaps      = skills.filter(s=>s.average<6).map(s=>s.name);

  // Job fit: rank by overlap of skills + minimum score heuristics
  const rankedJobs = jobs.map(job=>{
    const jobSkills = (job.skills||[]).map(x=>typeof x==="string"?x:(x.name||x._id));
    const matchCount = jobSkills.filter(js => skills.some(s => s.name===js)).length;
    const avgRequired = avg(
      jobSkills.map(js => (skills.find(s=>s.name===js)?.average ?? 0))
    );
    const fit = Math.round((matchCount*2 + avgRequired) * 10) / 10; // simple heuristic
    return { job, fit, matchCount, avgRequired };
  }).sort((a,b)=>b.fit-a.fit).slice(0,6);

  // Weekly plan (lightweight)
  const weeklyPlan = [
    { day: "Mon", task: "Revise core weak topic", minutes: 40 },
    { day: "Tue", task: "1 mock interview (technical)", minutes: 45 },
    { day: "Wed", task: "Build/extend mini project", minutes: 60 },
    { day: "Thu", task: "Apply to 3 matched roles", minutes: 30 },
    { day: "Fri", task: "Timed quiz on weak skill", minutes: 30 },
    { day: "Sat", task: "Open-source or challenge issue", minutes: 45 },
    { day: "Sun", task: "Reflect & plan next week", minutes: 20 },
  ];

  // Resources from roadmap if available
  const gapResources = (gaps || []).map(g => ({
    skill: g,
    suggestions: (roadmap[g]?.[0]?.resources || []).slice(0,3) // first step’s resources
  }));

  // Hackathons to join (upcoming)
  const upcomingH = hackathons
    .filter(h=>new Date(h.startAt)>new Date())
    .sort((a,b)=>new Date(a.startAt)-new Date(b.startAt))
    .slice(0,3);

  const readiness = Math.round(avg(skills.map(s=>s.average))*10)/10;

  return {
    metrics: { readiness, strengths, gaps },
    jobMatches: rankedJobs.map(r=>({
      _id: r.job._id,
      title: r.job.title,
      company: r.job.company?.name || "—",
      type: r.job.type,
      location: r.job.location || "Remote",
      fit: r.fit,
      skills: (r.job.skills||[]).map(x=>typeof x==="string"?x:(x.name||x._id))
    })),
    weeklyPlan,
    gapResources,
    upcomingHackathons: upcomingH.map(h=>({
      _id: h._id, title: h.title, startAt: h.startAt, endAt: h.endAt
    }))
  };
}

// Optional LLM enrich (only if you have OPENAI_API_KEY in env)
async function llmEnrich(summaryInput) {
  try {
    if (!process.env.OPENAI_API_KEY) return null;
    const prompt = `You are a career coach. Given the student profile below (strengths, gaps, job matches, weekly plan), 
provide a short, encouraging 120-150 word guidance note and 3 tactical tips.
JSON input:\n${JSON.stringify(summaryInput, null, 2)}`;
    const resp = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type":"application/json", "Authorization":`Bearer ${process.env.OPENAI_API_KEY}` },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [{role:"user", content: prompt}],
        temperature: 0.7
      })
    });
    const json = await resp.json();
    const text = json?.choices?.[0]?.message?.content?.trim();
    return text || null;
  } catch {
    return null;
  }
}

router.get("/guidance", async (req, res) => {
  try {
    // If you already wrap Axios for internal server-to-server calls, use that here.
    const api = req.api || req; // adapt to your server structure
    const [progress, jobs, roadmap, hackathons] = await Promise.all([
      getSkillProgress(req.user?._id, api),
      getJobs(api),
      getCareerRoadmap(api),
      getHackathons(api),
    ]);
    const guidance = makeGuidance({progress, jobs, roadmap, hackathons});
    const enriched = await llmEnrich({
      strengths: guidance.metrics.strengths,
      gaps: guidance.metrics.gaps,
      jobMatches: guidance.jobMatches.slice(0,3),
      weeklyPlan: guidance.weeklyPlan
    });
    res.json({ ...guidance, coachNote: enriched || null });
  } catch (e) {
    console.error("AI guidance failed:", e);
    res.status(500).json({ message: "Guidance generation failed" });
  }
});

// Minimal chat endpoint (optional)
router.post("/ask", async (req, res) => {
  const q = (req.body?.q || "").toString().trim();
  if (!q) return res.status(400).json({ message: "Missing question" });
  // If no LLM key, provide a safe, non-empty fallback
  if (!process.env.OPENAI_API_KEY) {
    return res.json({ answer: "AI coach is offline. Tip: focus on one gap at a time, apply to roles where your average skill score ≥6, and ship a small weekly project to build signal." });
  }
  try {
    const resp = await fetch("https://api.openai.com/v1/chat/completions", {
      method:"POST",
      headers:{ "Content-Type":"application/json", "Authorization":`Bearer ${process.env.OPENAI_API_KEY}` },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [{role:"system", content:"You are a concise career coach for students in tech."},{role:"user", content:q}],
        temperature: 0.6
      })
    });
    const json = await resp.json();
    const text = json?.choices?.[0]?.message?.content?.trim() || "No answer.";
    res.json({ answer: text });
  } catch (e) {
    res.json({ answer: "Couldn’t reach AI right now. Try again in a bit." });
  }
});

module.exports = router;
