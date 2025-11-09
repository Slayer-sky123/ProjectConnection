const express = require("express");
const router = express.Router();
const QuestionSet = require("../../models/QuestionSet");
const Skill = require("../../models/Skill");

// GET: Fetch all question sets with skill names
router.get("/", async (req, res) => {
  try {
    const sets = await QuestionSet.find()
      .populate("skill", "name")
      .sort({ createdAt: -1 });

    res.status(200).json(sets);
  } catch (err) {
    console.error("Error fetching sets:", err.message);
    res.status(500).json({ message: "Failed to fetch sets", error: err.message });
  }
});

// POST: Create a new question set
router.post("/", async (req, res) => {
  try {
    const { title, skill, description } = req.body;

    if (!title || !skill) {
      return res.status(400).json({ message: "Title and skill are required" });
    }

    const skillExists = await Skill.findById(skill);
    if (!skillExists) {
      return res.status(404).json({ message: "Skill not found" });
    }

    const newSet = new QuestionSet({
      title: title.trim(),
      skill,
      description: description?.trim() || "",
    });

    await newSet.save();
    res.status(201).json(newSet);
  } catch (err) {
    console.error("Error adding set:", err.message);
    res.status(500).json({ message: "Error adding set", error: err.message });
  }
});

// PUT: Update question set
router.put("/:id", async (req, res) => {
  try {
    const { title, skill, description } = req.body;

    if (!title || !skill) {
      return res.status(400).json({ message: "Title and skill are required" });
    }

    const skillExists = await Skill.findById(skill);
    if (!skillExists) {
      return res.status(404).json({ message: "Skill not found" });
    }

    const updatedSet = await QuestionSet.findByIdAndUpdate(
      req.params.id,
      {
        title: title.trim(),
        skill,
        description: description?.trim() || "",
      },
      { new: true }
    );

    if (!updatedSet) {
      return res.status(404).json({ message: "Set not found" });
    }

    res.status(200).json(updatedSet);
  } catch (err) {
    console.error("Error updating set:", err.message);
    res.status(500).json({ message: "Error updating set", error: err.message });
  }
});

// DELETE: Remove a question set
router.delete("/:id", async (req, res) => {
  try {
    const deletedSet = await QuestionSet.findByIdAndDelete(req.params.id);
    if (!deletedSet) {
      return res.status(404).json({ message: "Set not found" });
    }

    res.status(200).json({ message: "Set deleted successfully" });
  } catch (err) {
    console.error("Error deleting set:", err.message);
    res.status(500).json({ message: "Error deleting set", error: err.message });
  }
});

module.exports = router;
