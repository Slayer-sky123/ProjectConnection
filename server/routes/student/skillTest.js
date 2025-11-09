// server/routes/student/skillTest.js
const express = require("express");
const mongoose = require("mongoose");
const router = express.Router();

const auth = require("../../middleware/auth");
const QuestionSet = require("../../models/QuestionSet");
const Question = require("../../models/Question");
const SkillTestResult = require("../../models/SkillTestResult");

/**
 * GET /api/student/skill-test?skillId=...
 * Returns latest set's questions for the selected skill (safe: no answers)
 */
router.get("/", auth, async (req, res) => {
  try {
    const { skillId } = req.query;
    if (!skillId || !mongoose.Types.ObjectId.isValid(skillId)) {
      return res.status(400).json({ message: "skillId is required" });
    }

    const latestSet = await QuestionSet.findOne({ skill: skillId })
      .sort({ createdAt: -1 })
      .lean();

    if (!latestSet) {
      return res.status(404).json({ message: "No question set found for this skill" });
    }

    const questions = await Question.find({ set: latestSet._id })
      .select("question options")
      .lean();

    return res.json({
      setId: String(latestSet._id),
      skillId: String(skillId),
      questions, // no answers here (student side)
    });
  } catch (err) {
    console.error("Skill test fetch error:", err);
    res.status(500).json({ message: "Failed to fetch skill test questions" });
  }
});

/**
 * POST /api/student/skill-test/submit
 *
 * Accepts EITHER:
 *  A) Legacy (your current UI): { skill, score, total }
 *  B) Newer (optional):        { skill, setId, answers, terminated? }
 */
router.post("/submit", auth, async (req, res) => {
  try {
    const body = req.body || {};
    const { skill } = body;

    if (!skill || !mongoose.Types.ObjectId.isValid(skill)) {
      return res.status(400).json({ message: "Invalid or missing 'skill'." });
    }

    let score = null;
    let total = null;

    // ---- Path A: legacy client (your current UI) ----
    if (body.score != null && body.total != null && body.answers == null) {
      const sc = Number(body.score);
      const tt = Number(body.total);

      if (!Number.isFinite(sc) || !Number.isFinite(tt) || tt <= 0 || sc < 0 || sc > tt) {
        return res.status(400).json({ message: "Invalid 'score' or 'total'." });
      }
      score = sc;
      total = tt;
    }

    // ---- Path B: optional newer client (auto-score) ----
    else if (body.setId && body.answers) {
      const { setId } = body;
      let { answers } = body;

      if (!mongoose.Types.ObjectId.isValid(setId)) {
        return res.status(400).json({ message: "Invalid 'setId'." });
      }

      // normalize answers
      if (Array.isArray(answers)) {
        const normalized = {};
        answers.forEach((v, i) => (normalized[String(i)] = v));
        answers = normalized;
      }
      if (!answers || typeof answers !== "object") {
        return res.status(400).json({ message: "Invalid 'answers'." });
      }

      // ensure set belongs to skill
      const setDoc = await QuestionSet.findOne({ _id: setId, skill }).lean();
      if (!setDoc) {
        return res.status(404).json({ message: "Assessment set not found for this skill." });
      }

      // score it
      const qs = await Question.find({ set: setId }).select("answer").lean();
      total = qs.length;
      if (!total) {
        return res.status(400).json({ message: "This assessment has no questions." });
      }

      let sc = 0;
      qs.forEach((q, i) => {
        const chosen = answers[String(i)];
        if (typeof chosen === "string" && chosen === q.answer) sc += 1;
      });
      score = sc;
    }

    // nothing matched
    else {
      return res.status(400).json({
        message:
          "Incomplete data. Expected either { skill, score, total } or { skill, setId, answers }.",
      });
    }

    const saved = await SkillTestResult.create({
      user: req.user.id,
      skill: new mongoose.Types.ObjectId(skill),
      score,
      total,
    });

    return res.status(200).json({
      message: body.terminated ? "Auto-submitted" : "Result saved",
      score,
      total,
      percentage: Math.round((score / total) * 100),
      resultId: String(saved._id),
    });
  } catch (err) {
    console.error("Submit skill test error:", err);
    res.status(500).json({ message: "Error saving result" });
  }
});

module.exports = router;
