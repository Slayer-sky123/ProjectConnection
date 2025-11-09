const express = require("express");
const router = express.Router();
const companyOrAdminAuth = require("../../middleware/companyAuth");

const CompanyProfile = require("../../models/CompanyProfile");
const Hackathon = require("../../models/Hackathon");

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
      const items = await Hackathon.find()
        .populate("skills", "name")
        .populate("company", "name")
        .sort({ createdAt: -1 })
        .lean();
      return res.json(items);
    }

    const profile = await getCompanyProfile(req.user.id, { lean: true });
    if (!profile) return res.json([]);

    const items = await Hackathon.find({ company: profile._id })
      .populate("skills", "name")
      .sort({ createdAt: -1 })
      .lean();

    res.json(items);
  } catch (e) {
    console.error("hackathons:list error:", e);
    res.status(500).json({ message: "Failed to load hackathons" });
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

    const { title, brief, skills = [], startAt, endAt, prize, visibility = "public", bannerUrl } = req.body || {};
    if (!title || !startAt || !endAt) return res.status(400).json({ message: "title, startAt, endAt required" });

    const now = new Date();
    let status = "upcoming";
    const s = new Date(startAt);
    const e2 = new Date(endAt);
    if (s <= now && now <= e2) status = "live";
    if (now > e2) status = "ended";

    const doc = await Hackathon.create({
      company: companyId,
      title: title.trim(),
      brief: brief || "",
      skills,
      prize: prize || "",
      startAt: s,
      endAt: e2,
      visibility,
      status,
      bannerUrl: bannerUrl || null,
    });

    const pop = await doc.populate("skills", "name");
    res.status(201).json(pop);
  } catch (e) {
    console.error("hackathons:create error:", e);
    res.status(400).json({ message: e.message || "Bad request" });
  }
});

// UPDATE
router.put("/:id", companyOrAdminAuth, async (req, res) => {
  try {
    let filter = { _id: req.params.id };
    if (req.user.role !== "admin") {
      const profile = await getCompanyProfile(req.user.id, { lean: true });
      if (!profile) return res.status(400).json({ message: "Create company profile first" });
      filter.company = profile._id;
    }

    const body = { ...req.body };
    if (body.startAt) body.startAt = new Date(body.startAt);
    if (body.endAt) body.endAt = new Date(body.endAt);

    const doc = await Hackathon.findOneAndUpdate(filter, body, { new: true })
      .populate("skills", "name");

    if (!doc) return res.status(404).json({ message: "Not found" });
    res.json(doc);
  } catch (e) {
    console.error("hackathons:update error:", e);
    res.status(400).json({ message: e.message || "Bad request" });
  }
});

// STATUS
router.patch("/:id/status", companyOrAdminAuth, async (req, res) => {
  try {
    let filter = { _id: req.params.id };
    if (req.user.role !== "admin") {
      const profile = await getCompanyProfile(req.user.id, { lean: true });
      if (!profile) return res.status(400).json({ message: "Create company profile first" });
      filter.company = profile._id;
    }

    const allowed = new Set(["upcoming", "live", "ended"]);
    if (!allowed.has(req.body.status)) return res.status(400).json({ message: "Invalid status" });

    const doc = await Hackathon.findOneAndUpdate(filter, { $set: { status: req.body.status } }, { new: true });
    if (!doc) return res.status(404).json({ message: "Not found" });
    res.json(doc);
  } catch (e) {
    console.error("hackathons:status error:", e);
    res.status(400).json({ message: "Update failed" });
  }
});

// DELETE
router.delete("/:id", companyOrAdminAuth, async (req, res) => {
  try {
    let filter = { _id: req.params.id };
    if (req.user.role !== "admin") {
      const profile = await getCompanyProfile(req.user.id, { lean: true });
      if (!profile) return res.status(400).json({ message: "Create company profile first" });
      filter.company = profile._id;
    }

    const del = await Hackathon.findOneAndDelete(filter);
    if (!del) return res.status(404).json({ message: "Not found" });

    res.json({ success: true });
  } catch (e) {
    console.error("hackathons:delete error:", e);
    res.status(400).json({ message: "Delete failed" });
  }
});

module.exports = router;
