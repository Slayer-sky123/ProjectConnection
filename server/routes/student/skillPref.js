const express = require("express");
const router = express.Router();
const auth = require("../../middleware/auth");
const Skill = require("../../models/Skill");
const SkillPreference = require("../../models/SkillPreference");

router.get("/", auth, async (req, res) => {
  try {
    const pref = await SkillPreference.findOne({ user: req.user.id }).populate("skill", "name");
    if (!pref) return res.json({ skill: null });
    res.json({ skill: { _id: pref.skill._id, name: pref.skill.name } });
  } catch {
    res.status(500).json({ message: "Failed to load preference" });
  }
});

router.post("/", auth, async (req, res) => {
  try {
    const skillId = (req.body?.skill || "").toString();
    if (!skillId) return res.status(400).json({ message: "skill is required" });

    const skill = await Skill.findById(skillId).select("_id name");
    if (!skill) return res.status(404).json({ message: "Skill not found" });

    const pref = await SkillPreference.findOneAndUpdate(
      { user: req.user.id },
      { $set: { skill: skill._id } },
      { upsert: true, new: true }
    ).populate("skill", "name");

    res.json({ skill: { _id: pref.skill._id, name: pref.skill.name } });
  } catch {
    res.status(500).json({ message: "Failed to set preference" });
  }
});

module.exports = router;
