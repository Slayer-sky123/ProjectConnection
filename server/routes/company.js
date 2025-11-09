const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const auth = require("../middleware/auth");
const requireRole = require("../middleware/requireRole");

const CompanyProfile = require("../models/CompanyProfile");
const Job = require("../models/Job");
const Webinar = require("../models/Webinar");
const Hackathon = require("../models/Hackathon");
const Partnership = require("../models/Partnership");
const Skill = require("../models/Skill");
const SkillTestResult = require("../models/SkillTestResult");
const Collaboration = require("../models/Collaboration");
const University = require("../models/University");

// helper: ensure user has company profile
async function getOrCreateCompanyProfile(userId, payloadIfCreate) {
  let profile = await CompanyProfile.findOne({ user: userId });
  if (!profile && payloadIfCreate) {
    profile = await CompanyProfile.create({ user: userId, ...payloadIfCreate });
  }
  return profile;
}

/** -------- Company Profile -------- */
router.get("/profile", auth, requireRole("company"), async (req, res) => {
  const profile = await CompanyProfile.findOne({ user: req.user.id });
  res.json(profile || null);
});

router.post("/profile", auth, async (req, res) => {
  const exists = await CompanyProfile.findOne({ user: req.user.id });
  if (exists) return res.status(400).json({ message: "Profile already exists" });
  const created = await CompanyProfile.create({ user: req.user.id, ...req.body });
  res.json(created);
});

router.put("/profile", auth, async (req, res) => {
  const updated = await CompanyProfile.findOneAndUpdate(
    { user: req.user.id },
    { $set: req.body },
    { new: true, upsert: false }
  );
  if (!updated) return res.status(400).json({ message: "Create company profile first" });
  res.json(updated);
});

/** -------- Jobs -------- */
router.get("/jobs", auth, async (req, res) => {
  const profile = await CompanyProfile.findOne({ user: req.user.id });
  if (!profile) return res.json([]);
  const jobs = await Job.find({ company: profile._id }).populate("skills", "name");
  res.json(jobs);
});

router.post("/jobs", auth, async (req, res) => {
  const profile = await CompanyProfile.findOne({ user: req.user.id });
  if (!profile) return res.status(400).json({ message: "Create company profile first" });

  const payload = { ...req.body };
  payload.company = profile._id;
  payload.skills = (payload.skills || []).map((id) => new mongoose.Types.ObjectId(id));

  const job = await Job.create(payload);
  res.json(job);
});

router.put("/jobs/:id", auth, async (req, res) => {
  const profile = await CompanyProfile.findOne({ user: req.user.id });
  if (!profile) return res.status(400).json({ message: "Create company profile first" });

  const payload = { ...req.body };
  if (payload.skills) {
    payload.skills = payload.skills.map((id) => new mongoose.Types.ObjectId(id));
  }

  const job = await Job.findOneAndUpdate(
    { _id: req.params.id, company: profile._id },
    { $set: payload },
    { new: true }
  ).populate("skills", "name");

  if (!job) return res.status(404).json({ message: "Job not found" });
  res.json(job);
});

router.delete("/jobs/:id", auth, async (req, res) => {
  const profile = await CompanyProfile.findOne({ user: req.user.id });
  if (!profile) return res.status(400).json({ message: "Create company profile first" });
  await Job.deleteOne({ _id: req.params.id, company: profile._id });
  res.json({ success: true });
});

router.patch("/jobs/:id/toggle", auth, async (req, res) => {
  const profile = await CompanyProfile.findOne({ user: req.user.id });
  if (!profile) return res.status(400).json({ message: "Create company profile first" });

  const job = await Job.findOne({ _id: req.params.id, company: profile._id });
  if (!job) return res.status(404).json({ message: "Job not found" });
  job.status = job.status === "open" ? "closed" : "open";
  await job.save();
  res.json(job);
});

/** -------- Webinars / Hackathons / Partnerships (used by UI) -------- */
router.get("/webinars", auth, async (req, res) => {
  const profile = await CompanyProfile.findOne({ user: req.user.id });
  if (!profile) return res.json([]);
  const items = await Webinar.find({ company: profile._id }).sort({ createdAt: -1 });
  res.json(items);
});
router.post("/webinars", auth, async (req, res) => {
  const profile = await CompanyProfile.findOne({ user: req.user.id });
  if (!profile) return res.status(400).json({ message: "Create company profile first" });
  const item = await Webinar.create({ company: profile._id, ...req.body });
  res.json(item);
});

router.get("/hackathons", auth, async (req, res) => {
  const profile = await CompanyProfile.findOne({ user: req.user.id });
  if (!profile) return res.json([]);
  const items = await Hackathon.find({ company: profile._id }).populate("skills", "name").sort({ createdAt: -1 });
  res.json(items);
});
router.post("/hackathons", auth, async (req, res) => {
  const profile = await CompanyProfile.findOne({ user: req.user.id });
  if (!profile) return res.status(400).json({ message: "Create company profile first" });
  const payload = { ...req.body, company: profile._id };
  payload.skills = (payload.skills || []).map((id) => new mongoose.Types.ObjectId(id));
  const item = await Hackathon.create(payload);
  res.json(item);
});

router.get("/partnerships", auth, async (req, res) => {
  try {
    const profile = await CompanyProfile.findOne({ user: req.user.id }).lean();
    if (!profile) return res.json([]);

    const items = await Collaboration.find({ company: profile._id }).sort({ createdAt: -1 }).lean();

    res.json(
      items.map((m) => ({
        _id: String(m._id),
        title: m.title,
        university: m.universityName || "—",
        details: m.details || "",
        status: m.status,
        funding: m.funding || 0,
        createdAt: m.createdAt,
        mode: "Collaboration",
      }))
    );
  } catch (e) {
    console.error("company partnerships list error:", e);
    res.json([]);
  }
});
router.post("/partnerships", auth, async (req, res) => {
  try {
    const profile = await CompanyProfile.findOne({ user: req.user.id });
    if (!profile) return res.status(400).json({ message: "Create company profile first" });

    const { university = "", title = "", details = "", status = "Proposal", funding = 0 } = req.body || {};
    if (!title.trim()) return res.status(400).json({ message: "Title is required" });

    // Resolve university by exact name or username (best-effort)
    let uniDoc = null;
    if (university) {
      uniDoc =
        (await University.findOne({ username: new RegExp(`^${university}$`, "i") })) ||
        (await University.findOne({ name: new RegExp(`^${university}$`, "i") }));
    }

    const doc = await Collaboration.create({
      company: profile._id,
      companyName: profile.name || "",
      university: uniDoc?._id || null,
      universityName: uniDoc?.name || university || "",
      title: title.trim(),
      details: details || "",
      funding: Number(funding || 0),
      status: ["Proposal", "Active", "Completed", "Declined"].includes(status) ? status : "Proposal",
      createdBy: "company",
    });

    res.status(201).json({
      _id: String(doc._id),
      title: doc.title,
      university: doc.universityName,
      details: doc.details,
      status: doc.status,
      funding: doc.funding,
      createdAt: doc.createdAt,
    });
  } catch (e) {
    console.error("company partnerships create error:", e);
    res.status(500).json({ message: "Could not create partnership" });
  }
});
// PATCH /api/company/partnerships/:id (update status/details/funding)
router.patch("/partnerships/:id", auth, async (req, res) => {
  try {
    const profile = await CompanyProfile.findOne({ user: req.user.id }).lean();
    if (!profile) return res.status(400).json({ message: "Create company profile first" });

    const payload = {};
    if (typeof req.body.status === "string") {
      payload.status = ["Proposal", "Active", "Completed", "Declined"].includes(req.body.status)
        ? req.body.status
        : undefined;
    }
    if (typeof req.body.details === "string") payload.details = req.body.details;
    if (req.body.funding != null) payload.funding = Number(req.body.funding) || 0;

    const updated = await Collaboration.findOneAndUpdate(
      { _id: req.params.id, company: profile._id },
      { $set: payload },
      { new: true }
    ).lean();

    if (!updated) return res.status(404).json({ message: "Not found or not owned by this company" });
    res.json({
      _id: String(updated._id),
      title: updated.title,
      university: updated.universityName,
      details: updated.details,
      status: updated.status,
      funding: updated.funding,
      updatedAt: updated.updatedAt,
    });
  } catch (e) {
    console.error("company partnerships patch error:", e);
    res.status(500).json({ message: "Could not update partnership" });
  }
});
/** -------- Applications (placeholder to match UI) -------- */
// Adjust this to your actual Application model if you have one
router.get("/applications", auth, async (req, res) => {
  // Return empty initially unless you have a schema for applications
  res.json([]);
});
router.patch("/applications/:id", auth, async (req, res) => {
  // Implement once you have Application model
  return res.status(400).json({ message: "Not implemented yet" });
});

/** -------- Talent Search (simple version using SkillTestResult) --------
 * Query: /company/talent-search?skillIds=...&skillIds=...&minScore=6
 */
router.get("/talent-search", auth, async (req, res) => {
  const skillIds = []
    .concat(req.query.skillIds || [])
    .map((id) => (mongoose.isValidObjectId(id) ? new mongoose.Types.ObjectId(id) : null))
    .filter(Boolean);

  const minScore = Number(req.query.minScore || 0);

  if (!skillIds.length) return res.json([]);

  // 1) Pull all test results for those skills
  const rows = await SkillTestResult.aggregate([
    { $match: { skill: { $in: skillIds } } },
    {
      $group: {
        _id: { user: "$user", skill: "$skill" },
        avgScore: { $avg: "$score" },
      },
    },
    {
      $group: {
        _id: "$_id.user",
        perSkill: { $push: { skill: "$_id.skill", avgScore: "$avgScore" } },
        avgRequiredSkillScore: { $avg: "$avgScore" },
      },
    },
    { $match: { avgRequiredSkillScore: { $gte: minScore } } },
    { $limit: 100 },
  ]);

  // 2) decorate with user & basic fitScore
  const results = await Promise.all(
    rows.map(async (row) => {
      const user = await mongoose.model("User").findById(row._id).select("name email university").lean();
      return {
        student: user,
        avgRequiredSkillScore: Math.round(row.avgRequiredSkillScore * 10) / 10,
        fitScore: Math.round(row.avgRequiredSkillScore * 10) / 10, // simple; replace with custom logic
      };
    })
  );

  res.json(results);
});

module.exports = router;
