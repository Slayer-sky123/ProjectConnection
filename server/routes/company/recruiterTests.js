const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const crypto = require("crypto");
const companyOrAdminAuth = require("../../middleware/companyAuth");
const CompanyProfile = require("../../models/CompanyProfile");
const Application = require("../../models/Application");
const { RecruiterTestAssign, RecruiterTestResult } = require("../../models/RecruiterTestSubmission");
const RecruiterTest = require("../../models/RecruiterTest");

// helper profile
async function myProfile(userId) {
  return CompanyProfile.findOne({ owner: userId }).select("_id").lean()
    || CompanyProfile.findOne({ user: userId }).select("_id").lean();
}

/* ------------------------- Templates CRUD (company) ------------------------- */
router.get("/templates", companyOrAdminAuth, async (req, res) => {
  try {
    let companyId = null;
    if (req.user.role !== "admin") {
      const p = await myProfile(req.user.id);
      if (!p) return res.json([]);
      companyId = p._id;
    }
    const filter = companyId ? { company: companyId } : {};
    const items = await RecruiterTest.find(filter).sort({ createdAt: -1 }).lean();
    res.json(items);
  } catch (e) {
    console.error("templates:list error:", e);
    res.status(500).json({ message: "Failed" });
  }
});

router.post("/templates", companyOrAdminAuth, async (req, res) => {
  try {
    let companyId = null;
    if (req.user.role !== "admin") {
      const p = await myProfile(req.user.id);
      if (!p) return res.status(400).json({ message: "Create company profile first" });
      companyId = p._id;
    } else {
      if (!req.body.companyId) return res.status(400).json({ message: "companyId required for admin" });
      companyId = req.body.companyId;
    }
    const { title, durationMins = 20, negative = 0, shuffle = true, questions = [] } = req.body || {};
    if (!title || !questions?.length) return res.status(400).json({ message: "Title & questions required" });

    const doc = await RecruiterTest.create({
      company: companyId,
      title,
      durationMins: Number(durationMins || 20),
      negative: Number(negative || 0),
      shuffle: !!shuffle,
      questions: (questions || []).map((q) => ({
        text: q.text,
        options: q.options,
        answerIndex: Number(q.answerIndex || 0),
      })),
    });

    res.status(201).json(doc);
  } catch (e) {
    console.error("templates:create error:", e);
    res.status(400).json({ message: e.message || "Invalid payload" });
  }
});

// ✏️ UPDATE template (edit)
router.put("/templates/:id", companyOrAdminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const body = req.body || {};
    if (!mongoose.isValidObjectId(id)) return res.status(400).json({ message: "Invalid template id" });

    // verify ownership
    let companyId = null;
    if (req.user.role !== "admin") {
      const p = await myProfile(req.user.id);
      if (!p) return res.status(403).json({ message: "Not allowed" });
      companyId = p._id;
    }

    const tmpl = await RecruiterTest.findById(id);
    if (!tmpl) return res.status(404).json({ message: "Not found" });
    if (companyId && String(tmpl.company) !== String(companyId)) {
      return res.status(403).json({ message: "Not allowed" });
    }

    if (body.title != null) tmpl.title = String(body.title);
    if (body.durationMins != null) tmpl.durationMins = Number(body.durationMins);
    if (body.negative != null) tmpl.negative = Number(body.negative);
    if (body.shuffle != null) tmpl.shuffle = !!body.shuffle;
    if (Array.isArray(body.questions)) {
      tmpl.questions = body.questions.map(q => ({
        text: String(q.text || ""),
        options: (q.options || []).map(String),
        answerIndex: Number(q.answerIndex || 0),
      }));
    }

    await tmpl.save();
    res.json(tmpl);
  } catch (e) {
    console.error("templates:update error:", e);
    res.status(400).json({ message: e.message || "Update failed" });
  }
});

/* ------------------------ Assign test to an application ------------------------ */
router.post("/assign", companyOrAdminAuth, async (req, res) => {
  try {
    const { applicationId, templateId, dueAt = null } = req.body || {};
    if (!mongoose.isValidObjectId(applicationId) || !mongoose.isValidObjectId(templateId)) {
      return res.status(400).json({ message: "Invalid IDs" });
    }
    const app = await Application.findById(applicationId)
      .populate("job", "company")
      .populate("student", "_id")
      .lean();
    if (!app) return res.status(404).json({ message: "Application not found" });

    let companyId = null;
    if (req.user.role !== "admin") {
      const p = await myProfile(req.user.id);
      if (!p || String(app.job.company) !== String(p._id)) {
        return res.status(403).json({ message: "Not allowed" });
      }
      companyId = p._id;
    } else {
      companyId = app.job.company;
    }

    const tmpl = await RecruiterTest.findOne({ _id: templateId, company: companyId }).lean();
    if (!tmpl) return res.status(404).json({ message: "Template not found" });

    const token = crypto.randomBytes(16).toString("hex");
    const assign = await (new (mongoose.model("RecruiterTestAssign"))({
      application: app._id,
      company: companyId,
      student: app.student._id,
      template: tmpl._id,
      dueAt: dueAt ? new Date(dueAt) : null,
      token,
      status: "assigned",
    })).save();

    res.status(201).json({ assign, link: `/student/custom-test/${token}` });
  } catch (e) {
    console.error("assign error:", e);
    res.status(400).json({ message: e.message || "Assign failed" });
  }
});

/* ----------------------- Student submission webhook (kept) ----------------------- */
router.post("/submit", async (req, res) => {
  try {
    const { token, answers = [] } = req.body || {};
    const assign = await RecruiterTestAssign.findOne({ token }).populate("template").lean();
    if (!assign) return res.status(404).json({ message: "Assignment not found" });
    if (assign.status === "submitted") return res.status(400).json({ message: "Already submitted" });
    if (assign.dueAt && new Date(assign.dueAt) < new Date()) {
      await RecruiterTestAssign.updateOne({ _id: assign._id }, { $set: { status: "expired" } });
      return res.status(400).json({ message: "Assignment expired" });
    }

    const tmpl = await RecruiterTest.findById(assign.template).lean();
    const totalQs = tmpl.questions.length;
    let correct = 0;
    const answerRows = tmpl.questions.map((q, idx) => {
      const chosen = Number((answers.find(a => a.qIndex === idx) || {}).chosen ?? -1);
      const ok = chosen === Number(q.answerIndex);
      if (ok) correct++;
      return { qIndex: idx, chosen, correct: ok };
    });
    const score10 = totalQs > 0 ? Math.round((correct / totalQs) * 10 * 10) / 10 : 0;

    const result = await (new (mongoose.model("RecruiterTestResult"))({
      assign: assign._id,
      score: score10,
      total: 10,
      answers: answerRows,
      startedAt: new Date(),
      submittedAt: new Date(),
    })).save();

    await RecruiterTestAssign.updateOne({ _id: assign._id }, { $set: { status: "submitted" } });
    res.json({ result });
  } catch (e) {
    console.error("submit error:", e);
    res.status(400).json({ message: e.message || "Submit failed" });
  }
});

module.exports = router;
