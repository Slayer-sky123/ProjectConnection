//server/routes/company/index.js
const express = require("express");
const router = express.Router();
const auth = require("../../middleware/auth");
const CompanyProfile = require("../../models/CompanyProfile");
const companyAuth = require("../../middleware/companyAuth");



// inside routes/company/index.js
router.get("/jobs", auth, async (req, res) => {
  if (req.user.role === "admin") {
    // Admin sees all jobs
    const jobs = await Job.find().populate("skills", "name").populate("company", "name");
    return res.json(jobs);
  }

  // Company sees only its jobs
  const profile = await CompanyProfile.findOne({ user: req.user.id });
  if (!profile) return res.json([]);
  const jobs = await Job.find({ company: profile._id }).populate("skills", "name");
  res.json(jobs);
});

// ✅ guard: only for feature routes (NOT for /company/profile)
async function ensureCompanyProfile(req, res, next) {
  try {
    const profile = await CompanyProfile.findOne({ owner: req.user.id });
    if (!profile) {
      return res.status(428).json({ message: "Create company profile first" }); // 428 Precondition Required
    }
    req.companyProfile = profile;            // <-- pass to downstream handlers
    next();
  } catch (e) {
    next(e);
  }
}
router.use(companyAuth);               // ✅ every route under /api/company/* is auth’d

// ---- FEATURE ROUTES (guarded) ----
const webinars = require("./webinars");
router.get("/webinars", auth, ensureCompanyProfile, webinars.list);
router.post("/webinars", auth, ensureCompanyProfile, webinars.create);

module.exports = router;
