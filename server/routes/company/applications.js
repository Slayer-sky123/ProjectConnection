const express = require("express");
const router = express.Router();
const companyOrAdminAuth = require("../../middleware/companyAuth");
const CompanyProfile = require("../../models/CompanyProfile");
const Job = require("../../models/Job");
const Application = require("../../models/Application");

async function getCompanyProfile(userId, { lean = true } = {}) {
  let doc = lean ? await CompanyProfile.findOne({ owner: userId }).lean() : await CompanyProfile.findOne({ owner: userId });
  if (!doc) {
    doc = lean ? await CompanyProfile.findOne({ user: userId }).lean() : await CompanyProfile.findOne({ user: userId });
  }
  return doc;
}

function ensureInterview(app) {
  if (!app.interview) app.interview = {};
}
function setInterview(app, data) {
  ensureInterview(app);
  if (data.startsAt) app.interview.startsAt = new Date(data.startsAt);
  if (data.durationMins != null) app.interview.durationMins = Number(data.durationMins);
  if (data.stage) app.interview.stage = data.stage;
  if (!app.interview.roomId) app.interview.roomId = `room_${Date.now()}`;
  if (data.notes != null) app.interview.notes = data.notes;
}

// ---- list (admin=all, company=own) ----
router.get("/", companyOrAdminAuth, async (req, res) => {
  try {
    const jobPopulate = {
      path: "job",
      select: "title skills company",
      populate: [{ path: "skills", select: "name" }],
    };

    if (req.user.role === "admin") {
      const apps = await Application.find({})
        .populate(jobPopulate)
        .populate("student", "name email skills")
        .sort({ createdAt: -1 })
        .lean();
      return res.json(apps);
    }
    const profile = await getCompanyProfile(req.user.id, { lean: true });
    if (!profile) return res.json([]);
    const jobIds = (await Job.find({ company: profile._id }).select("_id")).map((j) => j._id);
    const apps = await Application.find({ job: { $in: jobIds } })
      .populate(jobPopulate)
      .populate("student", "name email skills")
      .sort({ createdAt: -1 })
      .lean();
    res.json(apps);
  } catch (e) {
    console.error("applications:list error:", e);
    res.status(500).json({ message: "Failed to load applications" });
  }
});

// ---- update status / notes ----
router.patch("/:id", companyOrAdminAuth, async (req, res) => {
  try {
    const { status, notes } = req.body || {};
    const app = await Application.findById(req.params.id).populate("job", "company");
    if (!app) return res.status(404).json({ message: "Application not found" });
    if (req.user.role !== "admin") {
      const profile = await getCompanyProfile(req.user.id, { lean: true });
      if (!profile || String(app.job.company) !== String(profile._id)) {
        return res.status(403).json({ message: "Not allowed" });
      }
    }
    if (status) app.status = status;
    if (notes != null) {
      app.screening = app.screening || {};
      app.screening.notes = notes;
    }
    await app.save();
    res.json({ message: "Updated", app });
  } catch (e) {
    console.error("applications:update error:", e);
    res.status(500).json({ message: "Update failed" });
  }
});

// ---- schedule/reschedule/cancel interview (unchanged) ----
router.post("/:id/schedule-interview", companyOrAdminAuth, async (req, res) => {
  try {
    const { startsAt, durationMins, stage, notes } = req.body || {};
    const app = await Application.findById(req.params.id).populate("job", "company");
    if (!app) return res.status(404).json({ message: "Application not found" });
    if (req.user.role !== "admin") {
      const profile = await getCompanyProfile(req.user.id, { lean: true });
      if (!profile || String(app.job.company) !== String(profile._id)) {
        return res.status(403).json({ message: "Not allowed" });
      }
    }
    setInterview(app, { startsAt, durationMins, stage, notes });
    await app.save();
    res.json({ message: "Interview scheduled", app });
  } catch (e) {
    console.error("applications:schedule error:", e);
    res.status(500).json({ message: "Scheduling failed" });
  }
});

router.put("/:id/reschedule-interview", companyOrAdminAuth, async (req, res) => {
  try {
    const { startsAt, durationMins, stage, notes } = req.body || {};
    const app = await Application.findById(req.params.id).populate("job", "company");
    if (!app) return res.status(404).json({ message: "Application not found" });
    if (req.user.role !== "admin") {
      const profile = await getCompanyProfile(req.user.id, { lean: true });
      if (!profile || String(app.job.company) !== String(profile._id)) {
        return res.status(403).json({ message: "Not allowed" });
      }
    }
    setInterview(app, { startsAt, durationMins, stage, notes });
    await app.save();
    res.json({ message: "Interview updated", app });
  } catch (e) {
    console.error("applications:reschedule error:", e);
    res.status(500).json({ message: "Update failed" });
  }
});

router.delete("/:id/cancel-interview", companyOrAdminAuth, async (req, res) => {
  try {
    const app = await Application.findById(req.params.id).populate("job", "company");
    if (!app) return res.status(404).json({ message: "Application not found" });
    if (req.user.role !== "admin") {
      const profile = await getCompanyProfile(req.user.id, { lean: true });
      if (!profile || String(app.job.company) !== String(profile._id)) {
        return res.status(403).json({ message: "Not allowed" });
      }
    }
    app.interview = null;
    await app.save();
    res.json({ message: "Interview canceled", app });
  } catch (e) {
    console.error("applications:cancel error:", e);
    res.status(500).json({ message: "Cancel failed" });
  }
});

module.exports = router;
