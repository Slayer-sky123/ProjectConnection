const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const companyOrAdminAuth = require("../../middleware/companyAuth");
const CompanyProfile = require("../../models/CompanyProfile");
const Application = require("../../models/Application");
const TestAssignment = require("../../models/TestAssignment");
const Skill = require("../../models/Skill");
const { RecruiterTestAssign } = require("../../models/RecruiterTestSubmission");
const RecruiterTest = require("../../models/RecruiterTest");

async function getCompanyProfile(userId, { lean = true } = {}) {
  let doc = lean ? await CompanyProfile.findOne({ owner: userId }).lean() : await CompanyProfile.findOne({ owner: userId });
  if (!doc) {
    doc = lean ? await CompanyProfile.findOne({ user: userId }).lean() : await CompanyProfile.findOne({ user: userId });
  }
  return doc;
}

// (legacy basic assign kept for compatibility, not used by new 2-step center)
router.post("/applications/:id/assign-test", companyOrAdminAuth, async (req, res) => {
  try {
    const app = await Application.findById(req.params.id).populate("job", "company student");
    if (!app) return res.status(404).json({ message: "Application not found" });

    if (req.user.role !== "admin") {
      const profile = await getCompanyProfile(req.user.id, { lean: true });
      if (!profile || String(app.job.company) !== String(profile._id)) {
        return res.status(403).json({ message: "Not allowed" });
      }
    }

    const {
      type = "custom",
      skillId = null,
      title = "",
      startAt = null,
      endAt = null,
      durationMins = 30,
    } = req.body || {};

    if (!["skill", "aptitude", "custom"].includes(type)) {
      return res.status(400).json({ message: "Invalid type" });
    }
    if (type === "skill" && !mongoose.isValidObjectId(skillId)) {
      return res.status(400).json({ message: "skillId required" });
    }
    if (type === "skill") {
      const sk = await Skill.findById(skillId).select("_id");
      if (!sk) return res.status(404).json({ message: "Skill not found" });
    }

    const payload = {
      student: app.student,
      application: app._id,
      type,
      skill: type === "skill" ? skillId : null,
      title: title || (type === "aptitude" ? "Aptitude Test" : "Skill Test"),
      startAt: startAt ? new Date(startAt) : null,
      endAt: endAt ? new Date(endAt) : null,
      durationMins: Number(durationMins || 30),
      status: "pending",
    };

    const created = await TestAssignment.create(payload);
    res.status(201).json(created);
  } catch (e) {
    console.error("assign-test error:", e);
    res.status(500).json({ message: "Failed to assign test" });
  }
});

// Merge legacy + recruiter for company view
router.get("/applications/:id/assigned-tests", companyOrAdminAuth, async (req, res) => {
  try {
    const app = await Application.findById(req.params.id).populate("job", "company student");
    if (!app) return res.status(404).json({ message: "Application not found" });

    if (req.user.role !== "admin") {
      const profile = await getCompanyProfile(req.user.id, { lean: true });
      if (!profile || String(app.job.company) !== String(profile._id)) {
        return res.status(403).json({ message: "Not allowed" });
      }
    }

    const rowsLegacy = await TestAssignment.find({ application: app._id })
      .populate("skill", "name")
      .sort({ createdAt: -1 })
      .lean();

    const rowsRecruiter = await RecruiterTestAssign.find({ application: app._id })
      .populate("template")
      .sort({ createdAt: -1 })
      .lean();

    const merged = [
      ...rowsLegacy.map(r => ({
        _id: r._id,
        source: "legacy",
        application: r.application,
        type: r.type,
        title: r.title || (r.type === "aptitude" ? "Aptitude Test" : (r.skill?.name || "Skill Test")),
        durationMins: r.durationMins,
        startAt: r.startAt,
        endAt: r.endAt,
        dueAt: r.endAt || null,
        status: r.status,
        skill: r.skill ? { _id: r.skill._id, name: r.skill.name } : null,
      })),
      ...rowsRecruiter.map(r => ({
        _id: r._id,
        source: "recruiter",
        application: r.application,
        type: "recruiter",
        title: r.template?.title || "Custom Test",
        durationMins: r.template?.durationMins || 20,
        startAt: null,
        endAt: null,
        dueAt: r.dueAt || null,
        status: r.status,
        templateId: r.template?._id,
        token: r.token,
      })),
    ];

    res.json(merged);
  } catch (e) {
    console.error("assigned-tests error:", e);
    res.status(500).json({ message: "Failed to load assigned tests" });
  }
});

// Delete supports both sources
router.delete("/tests/assignments/:assignmentId", companyOrAdminAuth, async (req, res) => {
  try {
    const id = req.params.assignmentId;

    const legacy = await TestAssignment.findById(id).lean();
    if (legacy) {
      const app = await Application.findById(legacy.application).populate("job", "company");
      if (!app) return res.status(404).json({ message: "Application not found" });
      if (req.user.role !== "admin") {
        const profile = await getCompanyProfile(req.user.id, { lean: true });
        if (!profile || String(app.job.company) !== String(profile._id)) {
          return res.status(403).json({ message: "Not allowed" });
        }
      }
      await TestAssignment.deleteOne({ _id: legacy._id });
      return res.json({ success: true });
    }

    const rec = await RecruiterTestAssign.findById(id).lean();
    if (!rec) return res.status(404).json({ message: "Not found" });

    const app = await Application.findById(rec.application).populate("job", "company");
    if (!app) return res.status(404).json({ message: "Application not found" });

    if (req.user.role !== "admin") {
      const profile = await getCompanyProfile(req.user.id, { lean: true });
      if (!profile || String(app.job.company) !== String(profile._id)) {
        return res.status(403).json({ message: "Not allowed" });
      }
    }

    await RecruiterTestAssign.deleteOne({ _id: rec._id });
    res.json({ success: true });
  } catch (e) {
    console.error("delete assignment error:", e);
    res.status(500).json({ message: "Failed to delete assignment" });
  }
});

module.exports = router;
