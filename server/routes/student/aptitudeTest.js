const express = require("express");
const router = express.Router();
const auth = require("../../middleware/auth");

const AptitudeConfig = require("../../models/AptitudeConfig");
const AptitudeQuestion = require("../../models/AptitudeQuestion");
const AptitudeResult = require("../../models/AptitudeResult");

// GET /api/student/aptitude-test
router.get("/", auth, async (_req, res) => {
  try {
    // config with default
    let cfg = await AptitudeConfig.findOne();
    if (!cfg) cfg = await AptitudeConfig.create({ durationMinutes: 20 });

    const qs = await AptitudeQuestion.find().select("question options").lean();
    if (!qs.length) {
      return res.status(404).json({ message: "No aptitude set found. Ask admin to add one." });
    }

    // setId can be derived from cfg.updatedAt (to force new timer when admin changes)
    const setId = `apt-${(cfg.updatedAt || cfg.createdAt || new Date()).getTime()}`;

    res.json({
      setId,
      durationMinutes: cfg.durationMinutes,
      questions: qs, // no answers on the student endpoint
    });
  } catch (e) {
    res.status(500).json({ message: "Failed to fetch aptitude questions" });
  }
});

// POST /api/student/aptitude-test/submit { score, total, terminated? }
router.post("/submit", auth, async (req, res) => {
  try {
    const { score, total, terminated = false } = req.body || {};
    if (score == null || total == null) {
      return res.status(400).json({ message: "Missing fields in result submission." });
    }
    const sc = Number(score);
    const tt = Number(total);

    const result = await AptitudeResult.create({
      user: req.user.id,
      score: sc,
      total: tt,
      terminated: !!terminated,
    });

    res.json({ message: "Result saved", result });
  } catch (e) {
    res.status(500).json({ message: "Error saving result" });
  }
});

module.exports = router;
