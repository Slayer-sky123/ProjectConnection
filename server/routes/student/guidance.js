const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");

const auth = require("../../middleware/auth");
const Guidance = require("../../models/Guidance");
const Skill = require("../../models/Skill");
const StudyMaterial = require("../../models/StudyMaterial");
const StudyProgress = require("../../models/StudyProgress");
const SkillTestResult = require("../../models/SkillTestResult");
const User = require("../../models/User");
// ❌ removed: const StudentProfile = require("../../models/StudentProfile");
const { generateGuidance } = require("../../utils/ai");

// Utility: snapshot (avg test %, study done %)
async function snapshot(userId, skillId) {
  const tests = await SkillTestResult.find({ user: userId, skill: skillId })
    .sort({ createdAt: -1 })
    .limit(6)
    .lean();

  let avgTestPct = null;
  if (tests.length) {
    const sum = tests.reduce((a, r) => a + (Number(r.score) || 0), 0);
    const tot = tests.reduce((a, r) => a + (Number(r.total) || 0), 0);
    avgTestPct = tot ? Math.round((sum / tot) * 100) : null;
  }

  const total = await StudyMaterial.countDocuments({ skill: skillId });
  const done = await StudyProgress.countDocuments({ user: userId, skill: skillId, status: "done" });
  const studyDonePct = total ? Math.round((done / total) * 100) : 0;

  return { avgTestPct, studyDonePct };
}

// GET /api/student/guidance?skillId=...
router.get("/", auth, async (req, res) => {
  try {
    const { skillId } = req.query;
    if (!skillId || !mongoose.isValidObjectId(skillId)) {
      return res.status(400).json({ message: "Missing or invalid skillId" });
    }

    const existing = await Guidance.findOne({ user: req.user.id, skill: skillId }).lean();
    if (!existing) return res.json({ cached: false, guidance: null });

    res.json({ cached: true, guidance: existing.payload, builtAt: existing.builtAt });
  } catch (e) {
    console.error("guidance GET error:", e);
    res.status(500).json({ message: "Server error" });
  }
});

// POST /api/student/guidance/build { skillId }
router.post("/build", auth, async (req, res) => {
  try {
    const { skillId } = req.body || {};
    if (!skillId || !mongoose.isValidObjectId(skillId)) {
      return res.status(400).json({ message: "Missing or invalid skillId" });
    }

    const skill = await Skill.findById(skillId).lean();
    if (!skill) return res.status(404).json({ message: "Skill not found" });

    // Inputs
    const user = await User.findById(req.user.id).select("resumeUrl primarySkillName").lean();

    // We don’t have resume text in DB; use empty string (or later you can extract text server-side from resumeUrl)
    const resumeText = ""; 
    const skillName = skill.name;

    const { avgTestPct, studyDonePct } = await snapshot(req.user.id, skillId);

    // Top missing topics from materials not done yet
    const mats = await StudyMaterial.find({ skill: skillId }).lean();
    const doneMap = new Map(
      (await StudyProgress.find({ user: req.user.id, skill: skillId, status: "done" }).lean())
        .map(p => [String(p.material), true])
    );
    const pending = mats.filter(m => !doneMap.get(String(m._id)));
    const topMissingTopics = [];
    pending.forEach(m => (m.topics || []).forEach(t => {
      if (!topMissingTopics.includes(t)) topMissingTopics.push(t);
    }));
    const seededResources = mats.slice(0, 18).map(m => ({ title: m.title, url: m.url }));

    // Generate (provider -> fallback)
    const { payload } = await generateGuidance({
      resumeText,
      skillName,
      avgTestPct,
      studyDonePct,
      topMissingTopics: topMissingTopics.slice(0, 12),
      seededResources,
    });

    // upsert cache
    const doc = await Guidance.findOneAndUpdate(
      { user: req.user.id, skill: skillId },
      { $set: { payload, builtAt: new Date() } },
      { upsert: true, new: true }
    ).lean();

    res.json({ cached: true, guidance: doc.payload, builtAt: doc.builtAt });
  } catch (e) {
    console.error("guidance build error:", e);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
