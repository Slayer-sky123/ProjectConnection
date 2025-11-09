// server/routes/ai.js
const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const pdfParseSafe = (() => {
  try { return require("pdf-parse"); } catch { return null; }
})();

const auth = require("../middleware/auth");
const User = require("../models/User");
const Job = require("../models/Job");
const SkillTestResult = require("../models/SkillTestResult");
const { analyzeResume } = require("../services/resumeAnalyzer");
const { chat, providerHealth } = require("../services/aiClient");

const uploadDir = path.join(__dirname, "../uploads/tmp");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
const upload = multer({ dest: uploadDir });

async function extractText(file) {
  if (!file) return "";
  const ext = path.extname(file.originalname || "").toLowerCase();
  const buf = fs.readFileSync(file.path);
  try {
    if (ext === ".pdf" && pdfParseSafe) {
      const data = await pdfParseSafe(buf);
      return data.text || "";
    }
    return buf.toString("utf8");
  } finally {
    fs.unlink(file.path, () => {});
  }
}

/* -------------------- existing: scan-resume (kept) -------------------- */
router.post("/scan-resume", upload.single("resume"), async (req, res) => {
  try {
    const resumeText =
      (req.file && (await extractText(req.file))) ||
      (req.body?.resumeText || "");

    const skills = Array.isArray(req.body?.skills)
      ? req.body.skills
      : (req.body?.skills || "")
          .toString()
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);

    let job = null;
    const jobId = req.body?.jobId;
    if (jobId) {
      job = await Job.findById(jobId)
        .select("title description skills")
        .populate("skills", "name")
        .lean();
      if (job) job.skills = (job.skills || []).map((s) => s.name || s);
    }

    const text =
      resumeText && resumeText.trim().length >= 40
        ? resumeText
        : `Declared Skills: ${skills.join(", ")} ${
            job ? `\n Target Job: ${job.title}\n${(job.description || "").slice(0, 600)}` : ""
          }`;

    const analysis = await analyzeResume({ resumeText: text, skills, job });
    res.json(analysis);
  } catch (e) {
    console.error("scan-resume failed:", e);
    res.status(200).json({
      topSkills: [],
      experienceSummary: "Resume scan temporarily unavailable.",
      resumeScore: 50,
      fitScore: 50,
      riskFlags: [],
      recommendations: ["Try again later."],
      education: "",
      yearsExperience: 0,
      raw: "",
    });
  }
});

/* -------------------- health & warmups (kept) -------------------- */
router.get("/health", async (_req, res) => {
  try {
    const meta = await providerHealth();
    res.json(meta);
  } catch (e) {
    res.status(200).json({ provider: process.env.AI_PROVIDER || "ollama", model: process.env.AI_MODEL || "llama3.1", ok: false, reason: e.message || "error" });
  }
});

router.get("/warmup", async (_req, res) => {
  try {
    const out = await chat({
      system: "healthcheck",
      messages: [{ role: "user", content: "ping" }],
      temperature: 0,
    });
    res.json({ ok: true, out: (out || "").slice(0, 40) });
  } catch (e) {
    res.json({ ok: false, reason: e.message || "error" });
  }
});

/* -------------------- guidance (kept) -------------------- */
router.post("/guidance", auth, async (req, res) => {
  try {
    const u = await User.findById(req.user.id).select("role name");
    if (!u) return res.status(401).json({ message: "Unauthorized" });
    if (u.role !== "student") return res.status(403).json({ message: "Students only" });

    const {
      strengths = [],
      gaps = [],
      latestScores = [],
      targetRoles = [],
    } = req.body || {};

    const payloadForFallback = JSON.stringify({
      __type: "coach",
      strengths,
      gaps,
      latestScores,
      targetRoles,
    });

    const content = await chat({
      system: "You are a concise career coach for students in tech. Keep responses structured and crisp.",
      messages: [
        {
          role: "user",
          content: `Student: ${u.name || "Anonymous"}
Strengths: ${strengths.join(", ")}
Gaps: ${gaps.join(", ")}
Skill Averages: ${latestScores.map((s) => `${s.skill}:${s.avg}`).join(", ")}
Target Roles: ${targetRoles.join(", ")}

Provide:
1) A ~130-word encouragement & direction.
2) Three tactical next steps (bulleted).
3) Two resources per gap (text only, no links).

__FALLBACK_JSON__: ${payloadForFallback}`,
        },
      ],
      temperature: 0.4,
    });

    res.json({ coachNote: content });
  } catch (e) {
    console.error("guidance failed:", e);
    res.json({
      coachNote:
        "Keep momentum: ship a tiny project this week, quantify resume impact with numbers, and align skills to the exact job requirements. Practice 3×45m on your weakest skill and publish notes.",
    });
  }
});

/* -------------------- NEW: study (replaces interview-prep) -------------------- */
/**
 * POST /api/ai/study
 * Generates structured study material for the student's primarySkill.
 * Input (optional): { resumeText?, injectTopics?: string[] }
 * Output: JSON-only (no links).
 */
router.post("/study", auth, upload.single("resume"), async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .select("role name primarySkill resumeTextCache")
      .populate("primarySkill", "name")
      .lean();
    if (!user) return res.status(401).json({ message: "Unauthorized" });
    if (user.role !== "student") return res.status(403).json({ message: "Students only" });
    if (!user.primarySkill) return res.status(400).json({ message: "Choose a primary skill first" });

    const uploadedText = (req.file && (await extractText(req.file))) || "";
    const pastedText = (req.body?.resumeText || "").toString();
    const resumeText = (uploadedText || pastedText || user.resumeTextCache || "").slice(0, 10000);

    // latest skill tests (primarySkill only)
    const latest = await SkillTestResult.find({ user: req.user.id, skill: user.primarySkill._id })
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();

    const avg10 = (() => {
      if (!latest.length) return 0;
      const scores = latest.map((r) => (Number(r.score) / Math.max(1, Number(r.total))) * 10);
      const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
      return Math.round(avg * 10) / 10;
    })();

    const injectTopics = Array.isArray(req.body?.injectTopics) ? req.body.injectTopics.slice(0, 10) : [];

    const payloadForFallback = JSON.stringify({
      __type: "study",
      primarySkill: user.primarySkill.name,
      avg10,
      injectTopics,
    });

    const system = "You are a precise study-planner and mentor. Return ONLY compact JSON. No URLs.";

    const prompt = `
Create a study plan for the student's selected skill with original explanations and practice.
Do NOT include links or brand names. Keep text compact and actionable.

Strict JSON shape:
{
  "overview": "≤100 words, tailored to skill & current level",
  "modules": [
    {"title":"", "topics":["",""], "notes":"2–3 lines of guidance"},
    {"title":"", "topics":["",""], "notes":""}
  ],
  "weeklyPlan": [
    {"week":"1","focus":"", "tasks":["",""]},
    {"week":"2","focus":"", "tasks":["",""]},
    {"week":"3","focus":"", "tasks":["",""]},
    {"week":"4","focus":"", "tasks":["",""]}
  ],
  "practiceSets": [
    {"title":"", "items":[{"question":"", "answer":""}]}
  ],
  "flashcards": [{"front":"term/concept","back":"definition/formula"}],
  "checkpoints": ["short milestones"],
  "revision": ["crisp revision bullets"],
  "assessmentRubric": ["how to self-grade output"]
}

Student: ${user.name || "Anonymous"}
Primary Skill: ${user.primarySkill.name}
Current Level (0..10): ${avg10}
Resume context (may be empty):
"""${resumeText}"""
Extra topics to include: ${injectTopics.join(", ")}

__FALLBACK_JSON__: ${payloadForFallback}
`;

    const content = await chat({
      system,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.3,
    });

    // parse + sanitize (strip URLs if any slipped through)
    function safeParseJSON(text) {
      if (!text || typeof text !== "string") return {};
      try { return JSON.parse(text); } catch {
        const m = text.match(/\{[\s\S]*\}$/); if (!m) return {};
        try { return JSON.parse(m[0]); } catch { return {}; }
      }
    }
    function sanitize(obj) {
      const BLOCK_URL = /(https?:\/\/\S+|www\.\S+|\[[^\]]*\]\([^)]+\))/gi;
      const visit = (v) => {
        if (typeof v === "string") return v.replace(BLOCK_URL, "").replace(/\(\s*\)/g, "").replace(/\s{2,}/g, " ").trim();
        if (Array.isArray(v)) return v.map(visit);
        if (v && typeof v === "object") {
          const out = {};
          for (const [k, val] of Object.entries(v)) if (!/^url$/i.test(k)) out[k] = visit(val);
          return out;
        }
        return v;
      };
      return visit(obj || {});
    }

    let plan = sanitize(safeParseJSON(content));
    plan = {
      overview: String(plan.overview || ""),
      modules: Array.isArray(plan.modules) ? plan.modules.map(m => ({
        title: String(m?.title || ""),
        topics: Array.isArray(m?.topics) ? m.topics.map(String) : [],
        notes: String(m?.notes || ""),
      })) : [],
      weeklyPlan: Array.isArray(plan.weeklyPlan) ? plan.weeklyPlan.map(w => ({
        week: String(w?.week || ""),
        focus: String(w?.focus || ""),
        tasks: Array.isArray(w?.tasks) ? w.tasks.map(String) : [],
      })) : [],
      practiceSets: Array.isArray(plan.practiceSets) ? plan.practiceSets.map(ps => ({
        title: String(ps?.title || ""),
        items: Array.isArray(ps?.items) ? ps.items.map(i => ({
          question: String(i?.question || ""),
          answer: String(i?.answer || ""),
        })) : [],
      })) : [],
      flashcards: Array.isArray(plan.flashcards) ? plan.flashcards.map(fc => ({
        front: String(fc?.front || ""),
        back: String(fc?.back || ""),
      })) : [],
      checkpoints: Array.isArray(plan.checkpoints) ? plan.checkpoints.map(String) : [],
      revision: Array.isArray(plan.revision) ? plan.revision.map(String) : [],
      assessmentRubric: Array.isArray(plan.assessmentRubric) ? plan.assessmentRubric.map(String) : [],
    };

    // ensure at least skeleton if provider hiccups
    if (!plan.modules.length && !plan.weeklyPlan.length && !plan.practiceSets.length) {
      plan.modules = [{ title: `${user.primarySkill.name} Fundamentals`, topics: ["Core ideas", "Syntax/Concepts"], notes: "Start small; take notes." }];
      plan.weeklyPlan = [{ week: "1", focus: "Basics", tasks: ["Watch short lessons", "Do 10–15 drills"] }];
    }

    res.json(plan);
  } catch (e) {
    console.error("study failed:", e);
    res.json({
      overview: "AI temporarily unavailable. Please try again.",
      modules: [],
      weeklyPlan: [],
      practiceSets: [],
      flashcards: [],
      checkpoints: [],
      revision: [],
      assessmentRubric: [],
    });
  }
});

module.exports = router;
