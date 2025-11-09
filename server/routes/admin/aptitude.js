const express = require("express");
const router = express.Router();

const AptitudeConfig = require("../../models/AptitudeConfig");
const AptitudeQuestion = require("../../models/AptitudeQuestion");

// NOTE: Keeping this route free of auth to mirror your existing /admin/skills route.
// If you need admin-only later, add your auth/role middleware here.

// --------- Config (timer) ----------
router.get("/config", async (req, res) => {
  try {
    let cfg = await AptitudeConfig.findOne();
    if (!cfg) cfg = await AptitudeConfig.create({ durationMinutes: 20 });
    res.json({ durationMinutes: cfg.durationMinutes, updatedAt: cfg.updatedAt });
  } catch (e) {
    res.status(500).json({ message: "Failed to load config" });
  }
});

router.put("/config", async (req, res) => {
  try {
    const mins = Number(req.body?.durationMinutes);
    if (!Number.isFinite(mins) || mins <= 0) {
      return res.status(400).json({ message: "durationMinutes must be a positive number" });
    }
    let cfg = await AptitudeConfig.findOne();
    if (!cfg) cfg = await AptitudeConfig.create({ durationMinutes: mins });
    else {
      cfg.durationMinutes = mins;
      await cfg.save();
    }
    res.json({ durationMinutes: cfg.durationMinutes, updatedAt: cfg.updatedAt });
  } catch (e) {
    res.status(500).json({ message: "Failed to update config" });
  }
});

// ---------- Questions CRUD ----------
router.get("/questions", async (_req, res) => {
  try {
    const qs = await AptitudeQuestion.find().sort({ createdAt: -1 }).lean();
    res.json(qs);
  } catch (e) {
    res.status(500).json({ message: "Failed to fetch questions" });
  }
});

router.post("/questions", async (req, res) => {
  try {
    const { question, options = [], answer } = req.body || {};
    if (!question || !answer || !Array.isArray(options) || options.length !== 4 || options.some(o => !o)) {
      return res.status(400).json({ message: "Provide question, 4 options and correct answer" });
    }
    const item = await AptitudeQuestion.create({ question, options, answer });
    res.status(201).json(item);
  } catch (e) {
    res.status(500).json({ message: "Failed to create question" });
  }
});

router.put("/questions/:id", async (req, res) => {
  try {
    const { question, options = [], answer } = req.body || {};
    if (!question || !answer || !Array.isArray(options) || options.length !== 4 || options.some(o => !o)) {
      return res.status(400).json({ message: "Provide question, 4 options and correct answer" });
    }
    const item = await AptitudeQuestion.findByIdAndUpdate(
      req.params.id,
      { $set: { question, options, answer } },
      { new: true }
    );
    if (!item) return res.status(404).json({ message: "Question not found" });
    res.json(item);
  } catch (e) {
    res.status(500).json({ message: "Failed to update question" });
  }
});

router.delete("/questions/:id", async (req, res) => {
  try {
    const del = await AptitudeQuestion.findByIdAndDelete(req.params.id);
    if (!del) return res.status(404).json({ message: "Question not found" });
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ message: "Failed to delete question" });
  }
});

module.exports = router;
