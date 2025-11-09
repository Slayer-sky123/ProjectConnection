const express = require("express");
const router = express.Router();
const SkillTestResult = require("../models/SkillTestResult");
const User = require("../models/User");

router.get("/skill-test-results", async (req, res) => {
  try {
    const results = await SkillTestResult.find()
      .populate("user", "name email")
      .populate("skill", "name") // 🔥 THIS is what makes skill.name work
      .sort({ createdAt: -1 });

    res.status(200).json(results);
  } catch (err) {
    console.error("Error fetching results:", err.message);
    res.status(500).json({ message: "Failed to fetch results", error: err.message });
  }
});

module.exports = router;
