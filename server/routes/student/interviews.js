// routes/student/interviews.js
const express = require("express");
const router = express.Router();
const auth = require("../../middleware/auth");
const User = require("../../models/User");
const Interview = require("../../models/Interview");

async function requireStudent(req, res, next) {
  try {
    const u = await User.findById(req.user.id).select("role");
    if (!u) return res.status(401).json({ message: "Unauthorized" });
    if (u.role !== "student") return res.status(403).json({ message: "Students only" });
    next();
  } catch (e) {
    res.status(500).json({ message: "Server error" });
  }
}

// GET /api/student/interviews (my upcoming)
router.get("/", auth, requireStudent, async (req, res) => {
  try {
    const list = await Interview.find({ student: req.user.id, status: "scheduled" })
      .sort({ startsAt: 1 })
      .populate({ path: "application", select: "job", populate: { path: "job", select: "title" } })
      .lean();
    res.json(list);
  } catch (e) {
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
