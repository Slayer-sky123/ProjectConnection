// server/routes/student/personalized.js
const express = require("express");
const router = express.Router();
const auth = require("../../middleware/auth");
const SkillTestResult = require("../../models/SkillTestResult");
const User = require("../../models/User");

function aggregateHistory(rows, onlySkills = []) {
  const allow = new Set((onlySkills || []).map((s)=>String(s).toLowerCase()));
  const bySkill = new Map();
  for (const r of rows) {
    const name = (r?.skill?.name || r?.skill || "").toString();
    if (!name) continue;
    if (allow.size && !allow.has(name.toLowerCase())) continue;
    if (!bySkill.has(name)) bySkill.set(name, []);
    const score10 = Number(r.total) ? (Number(r.score) / Number(r.total)) * 10 : 0;
    bySkill.get(name).push({ score: Math.round(score10*10)/10, total: 10, createdAt: r.createdAt });
  }
  const out = [];
  for (const [skill, history] of bySkill) out.push({ skill, history: history.sort((a,b)=>new Date(a.createdAt)-new Date(b.createdAt)) });
  return out;
}
function avg(history){ if(!Array.isArray(history)||!history.length) return 0; return Math.round((history.reduce((a,b)=>a+(Number(b.score)||0),0)/history.length)*10)/10; }
function textRoadmapForSkill(skill, a) {
  if (a < 4) return [
    { type:"Start", title:`Start Learning ${skill}`, description:"Core terms, syntax, and simple exercises." },
    { type:"Practice", title:"Daily Drills", description:"15–30m timed drills; keep a mistake log." },
    { type:"Project", title:"Tiny Project", description:"A 1–2 day mini app focusing on fundamentals." },
  ];
  if (a < 7) return [
    { type:"Project", title:"Intermediate Project", description:"End-to-end feature; inputs, state, persistence." },
    { type:"Concepts", title:"Deeper Concepts", description:"Complexity, performance, trade-offs." },
    { type:"Peer Review", title:"Code Reviews", description:"Ask for feedback, refactor, document choices." },
  ];
  return [
    { type:"Expertise", title:"Advanced Topics", description:"Design choices, scalability, maintainability." },
    { type:"Polish", title:"Production polish", description:"Testing, profiling, tracing, reliability." },
    { type:"Showcase", title:"Portfolio Hardening", description:"Tight bullets with metrics; present impact." },
  ];
}

router.get("/skill-dashboard", auth, async (req, res) => {
  try {
    const me = await User.findById(req.user.id).select("skills name").lean();
    if (!me) return res.status(401).json({ message: "Unauthorized" });

    const chosenSkills = (me.skills || []).map(String).filter(Boolean);
    const rows = await SkillTestResult.find({ user: req.user.id }).populate("skill","name").sort({ createdAt: -1 }).lean();

    let primary = chosenSkills[0] || "";
    if (!primary && rows.length) {
      const agg = aggregateHistory(rows);
      agg.sort((a,b)=>avg(b.history)-avg(a.history));
      primary = agg[0]?.skill || "";
    }
    const personalizedSkills = chosenSkills.length ? chosenSkills : (primary ? [primary] : []);

    const progress = aggregateHistory(rows, personalizedSkills);
    const roadmaps = progress.map(p => ({ skill: p.skill, avg: avg(p.history), steps: textRoadmapForSkill(p.skill, avg(p.history)) }));
    const mockQuestions = progress.map((p) => ({
      skill: p.skill,
      items: [
        { q: `Explain a recent bug you solved in ${p.skill}.`, a: "Describe context, root cause, fix, and prevention. Keep under 90s with metrics." },
        { q: `Design a small feature related to ${p.skill}.`, a: "Requirements → data → components → trade-offs → testing." },
        { q: `What trade-off matters most in ${p.skill}?`, a: "Pick performance/safety/complexity; defend with an example." },
      ],
    }));

    res.json({
      selectedSkills: personalizedSkills,
      primarySkill: primary,
      progress,
      roadmaps,
      mockQuestions,
      tips: [
        "Practice in short timed blocks and keep a mistake log.",
        "Prefer clarity over cleverness; explain trade-offs.",
        "Revise with a one-page cheatsheet per skill.",
      ],
    });
  } catch (e) {
    console.error("skill-dashboard failed:", e);
    res.status(200).json({ selectedSkills: [], primarySkill: "", progress: [], roadmaps: [], mockQuestions: [], tips: ["Add skills in your profile.", "Take a quick test to seed insights."] });
  }
});

module.exports = router;
