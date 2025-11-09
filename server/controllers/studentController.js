// server/controllers/studentController.js
const SkillTestResult = require("../models/SkillTestResult");

exports.getSkillProgress = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: "Unauthorized access" });

    const results = await SkillTestResult.find({ user: userId })
      .populate("skill", "name")
      .sort({ createdAt: -1 });

    const grouped = {};

    results.forEach((result) => {
      const skillId = result.skill._id.toString();
      if (!grouped[skillId]) {
        grouped[skillId] = {
          skill: result.skill,
          history: [],
        };
      }

      grouped[skillId].history.push({
        score: result.score,
        total: result.total,
        createdAt: result.createdAt,
      });
    });

    const response = Object.values(grouped);
    res.json(response);
  } catch (err) {
    console.error("Error fetching skill progress:", err.message);
    res.status(500).json({ message: "Failed to fetch skill progress" });
  }
};
