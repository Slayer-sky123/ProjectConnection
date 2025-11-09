const express = require("express");
const router = express.Router();
const companyOrAdminAuth = require("../../middleware/companyAuth");
const CompanyProfile = require("../../models/CompanyProfile");

// normalize list values
function asArray(v) {
  if (!v) return [];
  if (Array.isArray(v)) return v.map(String).map(s => s.trim()).filter(Boolean);
  return String(v).split(",").map(s => s.trim()).filter(Boolean);
}

// GET my profile (company); admin may pass ?owner=<userId> to view a specific company’s profile
router.get("/", companyOrAdminAuth, async (req, res) => {
  try {
    let ownerId = req.user.id;
    if (req.user.role === "admin" && req.query.owner) {
      ownerId = String(req.query.owner).trim();
    }
    const profile =
      (await CompanyProfile.findOne({ owner: ownerId }).lean()) ||
      (await CompanyProfile.findOne({ user: ownerId }).lean()); // legacy fallback

    if (!profile) return res.status(404).json({ message: "No company profile yet" });
    res.json(profile);
  } catch (e) {
    console.error("company profile:get error:", e);
    res.status(500).json({ message: "Server error" });
  }
});

// CREATE or UPDATE (upsert)
router.post("/", companyOrAdminAuth, async (req, res) => {
  try {
    // Admin may set owner explicitly; company user uses their own id
    const owner = req.user.role === "admin" ? (req.body.owner || req.user.id) : req.user.id;

    const base = {
      name: req.body.name,
      website: req.body.website,
      logoUrl: req.body.logoUrl,
      description: req.body.description,
      size: req.body.size || "1-10",
      locations: asArray(req.body.locations),
      domains: asArray(req.body.domains),
      contactEmail: req.body.contactEmail,
      contactPhone: req.body.contactPhone,
      owner,
    };

    let profile =
      (await CompanyProfile.findOne({ owner })) ||
      (await CompanyProfile.findOne({ user: owner }));

    if (!profile) {
      profile = await CompanyProfile.create({
        ...base,
        user: owner, // legacy non-null
      });
      return res.status(201).json(profile);
    }

    // ensure legacy 'user' not empty
    const update = { ...base };
    if (!profile.user) update.user = owner;

    profile = await CompanyProfile.findByIdAndUpdate(profile._id, { $set: update }, { new: true, runValidators: true });
    res.json(profile);
  } catch (e) {
    console.error("company profile:upsert error:", e);
    res.status(400).json({ message: e.message || "Bad request" });
  }
});

// PUT strict update (must exist)
router.put("/", companyOrAdminAuth, async (req, res) => {
  try {
    const owner = req.user.role === "admin" ? (req.body.owner || req.user.id) : req.user.id;

    const update = {
      name: req.body.name,
      website: req.body.website,
      logoUrl: req.body.logoUrl,
      description: req.body.description,
      size: req.body.size,
      locations: asArray(req.body.locations),
      domains: asArray(req.body.domains),
      contactEmail: req.body.contactEmail,
      contactPhone: req.body.contactPhone,
    };

    const existing =
      (await CompanyProfile.findOne({ owner })) ||
      (await CompanyProfile.findOne({ user: owner }));

    if (!existing) return res.status(404).json({ message: "Create company profile first" });
    if (!existing.user) update.user = owner;

    const updated = await CompanyProfile.findByIdAndUpdate(existing._id, { $set: update }, { new: true, runValidators: true });
    res.json(updated);
  } catch (e) {
    console.error("company profile:update error:", e);
    res.status(400).json({ message: e.message || "Bad request" });
  }
});

module.exports = router;
