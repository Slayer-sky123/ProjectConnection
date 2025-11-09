const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");

const auth = require("../../middleware/auth");
const Skill = require("../../models/Skill");
const SkillTestResult = require("../../models/SkillTestResult");
const StudyMaterial = require("../../models/StudyMaterial");
const StudyProgress = require("../../models/StudyProgress");

/**
 * Helper: seed materials from Skill.roadmap when missing.
 * Creates minimal, non-static materials derived from your DB (Skill.roadmap).
 */
async function ensureSeededMaterials(skillId) {
  const count = await StudyMaterial.countDocuments({ skill: skillId });
  if (count > 0) return;

  const skill = await Skill.findById(skillId).lean();
  if (!skill) return;

  const items = [];
  (skill.roadmap || []).forEach((step) => {
    const level = step.level || "Beginner";
    const topics = Array.isArray(step.topics) ? step.topics : [];
    const resources = Array.isArray(step.resources) ? step.resources : [];

    // One practice + each resource as a material
    items.push({
      skill: skill._id,
      level,
      title: step.title || `${level} Topics`,
      type: "Practice",
      description: step.description || `Practice tasks for ${skill.name} (${level}).`,
      url: "",
      topics,
      difficulty: level === "Advanced" ? "hard" : level === "Intermediate" ? "medium" : "easy",
      tags: ["auto-seeded", skill.name],
    });

    resources.forEach((r, i) => {
      if (!r?.title && !r?.url) return;
      items.push({
        skill: skill._id,
        level,
        title: r.title || `${step.title || level} Resource #${i + 1}`,
        type: "Article",
        description: `Resource for ${skill.name} (${level}).`,
        url: r.url || "",
        topics,
        difficulty: level === "Advanced" ? "hard" : level === "Intermediate" ? "medium" : "easy",
        tags: ["auto-seeded", skill.name],
      });
    });
  });

  if (items.length) {
    await StudyMaterial.insertMany(items);
  }
}

/**
 * Heuristic “AI-style” weekly plan:
 * uses the student’s recent SkillTestResult(s) to adapt the plan.
 */
async function buildWeeklyPlan(userId, skillId) {
  const latestResults = await SkillTestResult.find({ user: userId, skill: skillId })
    .sort({ createdAt: -1 })
    .limit(5)
    .lean();

  let avg = null;
  if (latestResults?.length) {
    const sum = latestResults.reduce((a, r) => a + (Number(r.score) || 0), 0);
    const tot = latestResults.reduce((a, r) => a + (Number(r.total) || 0), 0);
    avg = tot ? Math.round((sum / tot) * 100) : null;
  }

  // Prefer materials by level based on average %
  let primaryLevel = "Beginner";
  if (avg !== null) {
    if (avg >= 75) primaryLevel = "Advanced";
    else if (avg >= 45) primaryLevel = "Intermediate";
  }

  // Pull some materials for each day; bias to primaryLevel
  const all = await StudyMaterial.find({ skill: skillId }).lean();
  const byLevel = {
    Beginner: all.filter((m) => m.level === "Beginner"),
    Intermediate: all.filter((m) => m.level === "Intermediate"),
    Advanced: all.filter((m) => m.level === "Advanced"),
  };

  function pick(level, n) {
    const pool = byLevel[level] || [];
    return pool.slice(0, n);
  }

  // Simple 7-day plan (2 items/day)
  const plan = [];
  const levelsOrder =
    primaryLevel === "Advanced"
      ? ["Advanced", "Intermediate", "Beginner"]
      : primaryLevel === "Intermediate"
      ? ["Intermediate", "Beginner", "Advanced"]
      : ["Beginner", "Intermediate", "Advanced"];

  let day = 1;
  for (let i = 0; i < 7; i++) {
    const items = [
      ...pick(levelsOrder[0], 1 + (avg !== null && avg < 45 ? 1 : 0)), // if struggling, add one extra
      ...pick(levelsOrder[1], 1),
    ].slice(0, 2);

    // rotate pools a bit
    byLevel[levelsOrder[0]] = byLevel[levelsOrder[0]].slice(items.filter(m => m.level === levelsOrder[0]).length);
    byLevel[levelsOrder[1]] = byLevel[levelsOrder[1]].slice(items.filter(m => m.level === levelsOrder[1]).length);

    plan.push({
      day: `Day ${day++}`,
      items: items.map((m) => ({
        id: m._id,
        title: m.title,
        level: m.level,
        type: m.type,
        url: m.url,
      })),
      note:
        avg === null
          ? "Start with fundamentals and one resource per day."
          : avg >= 75
          ? "Push advanced topics with one intermediate refresher."
          : avg >= 45
          ? "Balance intermediate with foundational refreshers."
          : "Focus basics; add one extra beginner item to cement fundamentals.",
    });
  }

  return { avgPct: avg, primaryLevel, plan };
}

/* ----------------------------- ROUTES (auth) ----------------------------- */

// GET /api/student/study/materials?skillId=...
router.get("/materials", auth, async (req, res) => {
  try {
    const skillId = req.query.skillId;
    if (!skillId) return res.status(400).json({ message: "Missing skillId" });

    await ensureSeededMaterials(skillId);

    const materials = await StudyMaterial.find({ skill: skillId }).sort({ level: 1, createdAt: -1 }).lean();

    // Join with progress
    const progress = await StudyProgress.find({ user: req.user.id, skill: skillId }).lean();
    const map = new Map(progress.map((p) => [String(p.material), p]));

    const withStatus = materials.map((m) => ({
      ...m,
      status: map.get(String(m._id))?.status || "todo",
      notes: map.get(String(m._id))?.notes || "",
    }));

    res.json({ materials: withStatus });
  } catch (e) {
    console.error("study/materials error:", e);
    res.status(500).json({ message: "Server error" });
  }
});

// POST /api/student/study/complete
// { materialId, status, notes }
router.post("/complete", auth, async (req, res) => {
  try {
    const { materialId, status, notes } = req.body || {};
    if (!materialId) return res.status(400).json({ message: "Missing materialId" });

    const mat = await StudyMaterial.findById(materialId).select("skill _id");
    if (!mat) return res.status(404).json({ message: "Material not found" });

    const doc = await StudyProgress.findOneAndUpdate(
      { user: req.user.id, skill: mat.skill, material: mat._id },
      {
        $set: {
          status: status || "done",
          notes: notes || "",
          lastTouchedAt: new Date(),
        },
      },
      { upsert: true, new: true }
    );

    res.json({ success: true, progress: doc });
  } catch (e) {
    console.error("study/complete error:", e);
    res.status(500).json({ message: "Server error" });
  }
});

// GET /api/student/study/progress?skillId=...
router.get("/progress", auth, async (req, res) => {
  try {
    const { skillId } = req.query;
    if (!skillId) return res.status(400).json({ message: "Missing skillId" });

    const total = await StudyMaterial.countDocuments({ skill: skillId });
    const done = await StudyProgress.countDocuments({
      user: req.user.id,
      skill: skillId,
      status: "done",
    });

    res.json({
      total,
      done,
      pct: total ? Math.round((done / total) * 100) : 0,
    });
  } catch (e) {
    console.error("study/progress error:", e);
    res.status(500).json({ message: "Server error" });
  }
});

// POST /api/student/study/plan
// { skillId }
router.post("/plan", auth, async (req, res) => {
  try {
    const { skillId } = req.body || {};
    if (!skillId) return res.status(400).json({ message: "Missing skillId" });

    await ensureSeededMaterials(skillId);
    const plan = await buildWeeklyPlan(req.user.id, skillId);

    res.json({ plan });
  } catch (e) {
    console.error("study/plan error:", e);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
