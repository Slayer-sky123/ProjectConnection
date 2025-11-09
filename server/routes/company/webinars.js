const express = require("express");
const router = express.Router();
const companyOrAdminAuth = require("../../middleware/companyAuth");

const CompanyProfile = require("../../models/CompanyProfile");
const Webinar = require("../../models/Webinar");

// ---- helpers ----
async function getCompanyProfile(userId, { lean = true } = {}) {
  const q = { owner: userId };
  let doc = lean
    ? await CompanyProfile.findOne(q).lean()
    : await CompanyProfile.findOne(q);
  if (!doc) {
    doc = lean
      ? await CompanyProfile.findOne({ user: userId }).lean()
      : await CompanyProfile.findOne({ user: userId });
  }
  return doc;
}

// LIST (admin=all, company=own)
router.get("/", companyOrAdminAuth, async (req, res) => {
  try {
    if (req.user.role === "admin") {
      const items = await Webinar.find().sort({ startsAt: 1 }).lean();
      return res.json(items);
    }

    const profile = await getCompanyProfile(req.user.id, { lean: true });
    if (!profile) return res.json([]);

    const items = await Webinar.find({ company: profile._id }).sort({ startsAt: 1 }).lean();
    res.json(items);
  } catch (e) {
    console.error("webinars:list error:", e);
    res.status(500).json({ message: "Failed to load webinars" });
  }
});

// CREATE
router.post("/", companyOrAdminAuth, async (req, res) => {
  try {
    let companyId = null;
    if (req.user.role === "admin") {
      if (!req.body.companyId) return res.status(400).json({ message: "companyId required" });
      companyId = req.body.companyId;
    } else {
      const profile = await getCompanyProfile(req.user.id, { lean: true });
      if (!profile) return res.status(400).json({ message: "Create company profile first" });
      companyId = profile._id;
    }

    const { title, speaker, description, url, startsAt, durationMins } = req.body || {};
    if (!title) return res.status(400).json({ message: "Title is required" });

    const item = await Webinar.create({
      company: companyId,
      title: title.trim(),
      speaker: speaker || "",
      description: description || "",
      url: url || "",
      startsAt: startsAt ? new Date(startsAt) : null,
      durationMins: Number.isFinite(Number(durationMins)) ? Number(durationMins) : 60,
    });

    res.status(201).json(item);
  } catch (e) {
    console.error("webinars:create error:", e);
    res.status(400).json({ message: e.message || "Bad request" });
  }
});

// UPDATE (own)
router.put("/:id", companyOrAdminAuth, async (req, res) => {
  try {
    let filter = { _id: req.params.id };
    if (req.user.role !== "admin") {
      const profile = await getCompanyProfile(req.user.id, { lean: true });
      if (!profile) return res.status(400).json({ message: "Create company profile first" });
      filter.company = profile._id;
    }

    const update = {};
    const fields = ["title", "speaker", "description", "url", "durationMins"];
    fields.forEach((k) => {
      if (req.body[k] != null) update[k] = req.body[k];
    });
    if (req.body.startsAt != null) update.startsAt = new Date(req.body.startsAt);

    const updated = await Webinar.findOneAndUpdate(filter, { $set: update }, { new: true });
    if (!updated) return res.status(404).json({ message: "Webinar not found" });
    res.json(updated);
  } catch (e) {
    console.error("webinars:update error:", e);
    res.status(400).json({ message: e.message || "Bad request" });
  }
});

// DELETE (own)
router.delete("/:id", companyOrAdminAuth, async (req, res) => {
  try {
    let filter = { _id: req.params.id };
    if (req.user.role !== "admin") {
      const profile = await getCompanyProfile(req.user.id, { lean: true });
      if (!profile) return res.status(400).json({ message: "Create company profile first" });
      filter.company = profile._id;
    }

    const removed = await Webinar.findOneAndDelete(filter);
    if (!removed) return res.status(404).json({ message: "Webinar not found" });
    res.json({ success: true });
  } catch (e) {
    console.error("webinars:delete error:", e);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
