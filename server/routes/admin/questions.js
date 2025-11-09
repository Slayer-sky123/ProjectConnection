// server/routes/admin/questions.js
const express = require("express");
const router = express.Router();
const Question = require("../../models/Question");
const QuestionSet = require("../../models/QuestionSet");

// NOTE: These are ADMIN endpoints (use them in your admin UI only)

// GET: All questions for a specific set
router.get("/set/:setId", async (req, res) => {
  try {
    const questions = await Question.find({ set: req.params.setId }).lean();
    res.status(200).json(questions);
  } catch (err) {
    console.error("Error fetching questions:", err.message);
    res.status(500).json({ message: "Failed to fetch questions", error: err.message });
  }
});

// GET: Questions for latest set of a given skill (used by admin tools)
// Student side should call /api/student/skill-test instead
router.get("/skill/:skillId", async (req, res) => {
  try {
    const skillId = req.params.skillId;
    const latestSet = await QuestionSet.findOne({ skill: skillId }).sort({ createdAt: -1 }).lean();
    if (!latestSet) return res.status(404).json({ message: "No set for this skill" });

    const questions = await Question.find({ set: latestSet._id }).lean();
    return res.json({ setId: latestSet._id, skillId, questions });
  } catch (err) {
    console.error("Error fetching questions by skill:", err.message);
    res.status(500).json({ message: "Server error" });
  }
});

// POST: Add a question to a set
router.post("/", async (req, res) => {
  try {
    const { set, question, options, answer } = req.body;
    if (!set || !question || !options?.length || !answer) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const setDoc = await QuestionSet.findById(set);
    if (!setDoc) return res.status(404).json({ message: "Question set not found" });

    const newQuestion = await Question.create({
      set,
      skill: setDoc.skill.toString(),
      question: question.trim(),
      options: options.map((o) => String(o).trim()),
      answer: String(answer).trim(),
    });

    res.status(201).json(newQuestion);
  } catch (err) {
    console.error("Error adding question:", err.message);
    res.status(500).json({ message: "Failed to add question", error: err.message });
  }
});

// PUT: Update a question
router.put("/:id", async (req, res) => {
  try {
    const { question, options, answer } = req.body;
    if (!question || !options?.length || !answer) {
      return res.status(400).json({ message: "Incomplete update fields" });
    }

    const updated = await Question.findByIdAndUpdate(
      req.params.id,
      {
        question: question.trim(),
        options: options.map((opt) => String(opt).trim()),
        answer: String(answer).trim(),
      },
      { new: true }
    ).lean();

    if (!updated) return res.status(404).json({ message: "Question not found" });

    res.status(200).json(updated);
  } catch (err) {
    console.error("Error updating question:", err.message);
    res.status(500).json({ message: "Failed to update", error: err.message });
  }
});

// DELETE: Remove a question
router.delete("/:id", async (req, res) => {
  try {
    const deleted = await Question.findByIdAndDelete(req.params.id).lean();
    if (!deleted) return res.status(404).json({ message: "Question not found" });
    res.status(200).json({ success: true });
  } catch (err) {
    console.error("Error deleting question:", err.message);
    res.status(500).json({ message: "Failed to delete", error: err.message });
  }
});

module.exports = router;
