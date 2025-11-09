// server/routes/student/jobs.js
const express = require("express");
const router = express.Router();
const auth = require("../../middleware/auth");
const upload = require("../../middleware/upload");

const User = require("../../models/User");
const Job = require("../../models/Job");
const Application = require("../../models/Application");
const TestAssignment = require("../../models/TestAssignment"); // NEW

// ---- Guard: only students for write operations ----
async function requireStudentRole(req, res, next) {
  try {
    const u = await User.findById(req.user.id).select("role");
    if (!u) return res.status(401).json({ message: "Unauthorized" });
    if (u.role !== "student") {
      return res.status(403).json({ message: "Students only" });
    }
    next();
  } catch (e) {
    console.error("requireStudentRole failed:", e);
    res.status(500).json({ message: "Server error" });
  }
}

// ---------- PUBLIC: list open jobs ----------
router.get("/", async (_req, res) => {
  try {
    const list = await Job.find({ status: "open" })
      .sort({ createdAt: -1 })
      .populate("company", "name logoUrl")
      .populate("skills", "name")
      .lean();
    res.json(list);
  } catch (e) {
    console.error("List student jobs failed:", e);
    res.status(500).json({ message: "Server error" });
  }
});

// ---------- STUDENT: apply ----------
router.post("/:jobId/apply", auth, requireStudentRole, upload.single("resume"), async (req, res) => {
  try {
    const { jobId } = req.params;

    const job = await Job.findById(jobId).select("_id status company");
    if (!job) return res.status(404).json({ message: "Job not found" });
    if (job.status !== "open") return res.status(400).json({ message: "Job is not accepting applications" });

    const existing = await Application.findOne({ student: req.user.id, job: jobId }).select("_id");
    if (existing) return res.status(409).json({ message: "Already applied" });

    const coverLetter = (req.body?.coverLetter || "").toString();
    const cvUrl = req.file ? `/uploads/resumes/${req.file.filename}` : null;

    const app = await Application.create({
      student: req.user.id,
      job: jobId,
      company: job.company,
      status: "applied",
      cvUrl,
      coverLetter,
      screening: { resumeScore: null, testScore: null, fitScore: null },
    });

    res.status(201).json({ success: true, applicationId: app._id, cvUrl });
  } catch (e) {
    console.error("Apply failed:", e);
    res.status(500).json({ message: "Server error" });
  }
});

// ---------- STUDENT: withdraw ----------
router.delete("/:jobId/apply", auth, requireStudentRole, async (req, res) => {
  try {
    const { jobId } = req.params;
    const app = await Application.findOne({ job: jobId, student: req.user.id });
    if (!app) return res.status(404).json({ message: "Application not found" });

    if (["offer"].includes(app.status)) {
      return res.status(400).json({ message: "Cannot withdraw at this stage" });
    }

    await app.deleteOne();
    res.json({ success: true });
  } catch (e) {
    console.error("Withdraw failed:", e);
    res.status(500).json({ message: "Server error" });
  }
});

// ---------- STUDENT: my applications (+ assignedTests) ----------
router.get("/mine/applications", auth, requireStudentRole, async (req, res) => {
  try {
    const apps = await Application.find({ student: req.user.id })
      .sort({ createdAt: -1 })
      .populate({
        path: "job",
        select: "title type location skills company",
        populate: [
          { path: "company", select: "name logoUrl" },
          { path: "skills", select: "name" }
        ]
      })
      .lean();

    // Attach assigned tests (if any) to each application
    const ids = apps.map((a) => a._id);
    const assignments = await TestAssignment.find({
      student: req.user.id,
      application: { $in: ids },
    })
      .populate("skill", "name")
      .lean();

    const grouped = assignments.reduce((acc, t) => {
      const key = t.application.toString();
      acc[key] = acc[key] || [];
      acc[key].push({
        _id: t._id,
        applicationId: t.application,
        type: t.type,
        status: t.status,
        skillId: t.skill || null,
        skillName: t.skill && t.skill.name ? t.skill.name : null,
        title: t.title || (t.skill && t.skill.name ? `${t.skill.name} Skill Test` : t.type === "aptitude" ? "Aptitude Test" : "Test"),
        startAt: t.startAt || null,
        dueAt: t.endAt || null,
        durationMins: t.durationMins || 30,
        attemptId: t.attemptId || null,
        score: t.score != null ? t.score : null,
        total: t.total != null ? t.total : null,
      });
      return acc;
    }, {});

    const out = apps.map((a) => ({
      ...a,
      assignedTests: grouped[a._id.toString()] || [],
    }));

    res.json(out);
  } catch (e) {
    console.error("List my apps failed:", e);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
