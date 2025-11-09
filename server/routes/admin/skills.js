// server/routes/admin/skills.js
const express = require("express");
const router = express.Router();
const Skill = require("../../models/Skill");

// GET: Fetch all skills (includes durationMinutes)
router.get("/", async (req, res) => {
  try {
    const skills = await Skill.find().sort({ createdAt: -1 });
    res.status(200).json(skills);
  } catch (err) {
    console.error("Error fetching skills:", err.message);
    res.status(500).json({ message: "Error fetching skills", error: err.message });
  }
});

// POST: Add a new skill (supports durationMinutes)
router.post("/", async (req, res) => {
  try {
    const { name, durationMinutes } = req.body || {};
    if (!name || !name.trim()) {
      return res.status(400).json({ message: "Skill name is required" });
    }

    const existing = await Skill.findOne({ name: name.trim().toLowerCase() });
    if (existing) {
      return res.status(409).json({ message: "Skill already exists" });
    }

    const dur = Number(durationMinutes || 30);
    if (isNaN(dur) || dur < 1) {
      return res.status(400).json({ message: "durationMinutes must be a positive number" });
    }

    const newSkill = new Skill({
      name: name.trim().toLowerCase(),
      durationMinutes: dur,
    });
    await newSkill.save();
    res.status(201).json(newSkill);
  } catch (err) {
    console.error("Error adding skill:", err.message);
    res.status(500).json({ message: "Error adding skill", error: err.message });
  }
});

// PUT: Update an existing skill (supports durationMinutes)
router.put("/:id", async (req, res) => {
  try {
    const { name, durationMinutes } = req.body || {};

    const update = {};
    if (name && name.trim()) update.name = name.trim().toLowerCase();
    if (durationMinutes != null) {
      const dur = Number(durationMinutes);
      if (isNaN(dur) || dur < 1) {
        return res.status(400).json({ message: "durationMinutes must be a positive number" });
      }
      update.durationMinutes = dur;
    }

    if (!Object.keys(update).length) {
      return res.status(400).json({ message: "Nothing to update" });
    }

    const skill = await Skill.findByIdAndUpdate(req.params.id, update, { new: true });
    if (!skill) {
      return res.status(404).json({ message: "Skill not found" });
    }

    res.status(200).json(skill);
  } catch (err) {
    console.error("Error updating skill:", err.message);
    res.status(500).json({ message: "Error updating skill", error: err.message });
  }
});

// DELETE: Remove a skill
router.delete("/:id", async (req, res) => {
  try {
    const skill = await Skill.findByIdAndDelete(req.params.id);
    if (!skill) {
      return res.status(404).json({ message: "Skill not found" });
    }
    res.status(200).json({ message: "Skill deleted successfully" });
  } catch (err) {
    console.error("Error deleting skill:", err.message);
    res.status(500).json({ message: "Error deleting skill", error: err.message });
  }
});

module.exports = router;
