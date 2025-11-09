// server/routes/student/tests.js
const express = require("express");
const mongoose = require("mongoose");
const router = express.Router();
const auth = require("../../middleware/auth");
const TestAssignment = require("../../models/TestAssignment");
const Application = require("../../models/Application");
const { RecruiterTestAssign } = require("../../models/RecruiterTestSubmission");
const RecruiterTest = require("../../models/RecruiterTest");

function normalize(t) {
  return {
    _id: t._id,
    applicationId: t.application,
    type: t.type,
    status: t.status,
    skillId: t.skill || null,
    skillName: t.skillName || null,
    title:
      t.title ||
      (t.skillName
        ? `${t.skillName} Skill Test`
        : t.type === "aptitude"
        ? "Aptitude Test"
        : "Test"),
    dueAt: t.dueAt || null,
    startAt: t.startAt || null,
    endAt: t.endAt || null,
    durationMins: t.durationMins || 30,
    attemptId: t.attemptId || null,
    score: t.score != null ? t.score : null,
    total: t.total != null ? t.total : null,
    token: t.token || null,
    templateId: t.templateId || null,
  };
}

/**
 * List assigned tests (legacy + recruiter)
 */
router.get("/assigned", auth, async (req, res) => {
  try {
    const apps = await Application.find({ student: req.user.id })
      .select("_id")
      .lean();
    if (!apps.length) return res.json([]);

    const myAppIds = apps.map((a) => a._id.toString());
    const qIds = []
      .concat(req.query.appIds || [])
      .map((s) => s && s.toString())
      .filter(Boolean);
    const filterIds = qIds.length
      ? qIds.filter((x) => myAppIds.includes(x))
      : myAppIds;

    const rows = await TestAssignment.find({
      student: req.user.id,
      application: {
        $in: filterIds.map((id) => new mongoose.Types.ObjectId(id)),
      },
    })
      .populate("skill", "name")
      .sort({ createdAt: -1 })
      .lean();

    const legacy = rows.map((r) =>
      normalize({
        ...r,
        skillName: r.skill && r.skill.name ? r.skill.name : null,
        dueAt: r.endAt || null,
      })
    );

    const recRows = await RecruiterTestAssign.find({
      student: req.user.id,
      application: {
        $in: filterIds.map((id) => new mongoose.Types.ObjectId(id)),
      },
      status: { $in: ["assigned", "submitted"] },
    })
      .populate("template")
      .sort({ createdAt: -1 })
      .lean();

    const recruiter = recRows.map((r) =>
      normalize({
        _id: r._id,
        application: r.application,
        type: "recruiter",
        status:
          r.status === "expired"
            ? "expired"
            : r.status === "submitted"
            ? "completed"
            : "pending",
        title: r.template?.title || "Custom Test",
        durationMins: r.template?.durationMins || 20,
        startAt: null,
        endAt: null,
        dueAt: r.dueAt || null,
        token: r.token,
        templateId: r.template?._id,
      })
    );

    const out = [...legacy, ...recruiter];
    res.json(out);
  } catch (e) {
    console.error("student/tests/assigned failed:", e);
    res.status(500).json({ message: "Failed to load assigned tests" });
  }
});

/**
 * NEW: Get recruiter test content by token (student can take it inline).
 * Guards: token must belong to the logged-in student.
 */
router.get("/recruiter-tests/:token", auth, async (req, res) => {
  try {
    const token = String(req.params.token || "").trim();
    if (!token) return res.status(400).json({ message: "Token required" });

    const assign = await RecruiterTestAssign.findOne({ token })
      .populate("template")
      .lean();

    if (!assign) return res.status(404).json({ message: "Not found" });
    // ensure this assignment belongs to the current student
    const myApps = await Application.find({
      _id: assign.application,
      student: req.user.id,
    })
      .select("_id")
      .lean();
    if (!myApps.length) return res.status(403).json({ message: "Not allowed" });

    if (assign.status === "expired")
      return res.status(400).json({ message: "Assignment expired" });

    const tmpl = await RecruiterTest.findById(assign.template?._id).lean();
    if (!tmpl) return res.status(404).json({ message: "Template missing" });

    res.json({
      title: tmpl.title,
      durationMins: tmpl.durationMins || 20,
      dueAt: assign.dueAt || null,
      status: assign.status, // "assigned" | "submitted"
      questions: (tmpl.questions || []).map((q, idx) => ({
        index: idx,
        text: q.text,
        options: q.options,
      })),
    });
  } catch (e) {
    console.error("student/recruiter-tests token fetch failed:", e);
    res.status(500).json({ message: "Failed to load test" });
  }
});

module.exports = router;
