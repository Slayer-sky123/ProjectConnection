// server/routes/company/jobs.js
const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const companyOrAdminAuth = require("../../middleware/companyAuth");

const CompanyProfile = require("../../models/CompanyProfile");
const Job = require("../../models/Job");
const Skill = require("../../models/Skill");
const { chat } = require("../../services/aiClient");

/* ------------------------ helpers: profile & skills ------------------------ */

async function getCompanyProfile(userId, { lean = true } = {}) {
  let doc = lean
    ? await CompanyProfile.findOne({ owner: userId }).lean()
    : await CompanyProfile.findOne({ owner: userId });
  if (!doc) {
    doc = lean
      ? await CompanyProfile.findOne({ user: userId }).lean()
      : await CompanyProfile.findOne({ user: userId });
  }
  return doc;
}

async function ensureCompanyProfile(userId) {
  const auto = String(process.env.AUTO_CREATE_COMPANY_PROFILE || "true").toLowerCase() === "true";
  let profile = await getCompanyProfile(userId, { lean: false });
  if (!profile && auto) {
    profile = new CompanyProfile({
      owner: userId,
      name: "My Company",
    });
    await profile.save();
  }
  return profile ? profile.toObject() : null;
}

function parsePackage(body) {
  const min = Number(body.packageMin || 0);
  const max = Number(body.packageMax || 0);
  const currency = (body.packageCurrency || "INR").toUpperCase();
  const unit = (body.packageUnit || "year").toLowerCase() === "month" ? "month" : "year";
  return { min: isNaN(min) ? 0 : min, max: isNaN(max) ? 0 : max, currency, unit };
}

function parseDate(d) {
  if (!d) return null;
  const t = new Date(d);
  return isNaN(t.getTime()) ? null : t;
}

function normalizeCreateUpdatePayload(body) {
  const data = {
    title: (body.title || "").trim(),
    location: (body.location || "").trim(),
    experience: (body.experience || "").trim(),
    startDate: parseDate(body.startDate),
    openings: Number(body.openings || 1),
    package: parsePackage(body),
    minScore: Number(body.minScore || 0),
    type: (body.type || "job"),
    description: (body.description || "").trim(),
    responsibilities: Array.isArray(body.responsibilities)
      ? body.responsibilities.filter(Boolean).map(String)
      : ((body.responsibilities || "").toString().split("\n").map(s => s.trim()).filter(Boolean)),
    // Caller may send IDs or names; we’ll resolve to IDs below.
    skills: Array.isArray(body.skills) ? body.skills.filter(Boolean) : [],
    preferredSkills: Array.isArray(body.preferredSkills) ? body.preferredSkills.filter(Boolean) : [],
    isFeatured: !!body.isFeatured,
    status: (body.status || "open"),
  };

  if (isNaN(data.openings) || data.openings < 1) data.openings = 1;
  if (isNaN(data.minScore)) data.minScore = 0;

  return data;
}

/**
 * Try to convert an array of items (ObjectIds or names) to Skill IDs.
 * - If item looks like an ObjectId and exists -> keep ID.
 * - If item is a name -> find by name (case-insensitive); if missing -> create it.
 */
async function resolveSkillIds(mixedList = []) {
  const outIds = [];
  for (const raw of mixedList) {
    if (!raw) continue;
    const s = String(raw).trim();
    if (!s) continue;

    if (mongoose.isValidObjectId(s)) {
      const found = await Skill.findById(s).select("_id").lean();
      if (found) { outIds.push(found._id); continue; }
      // fallthrough to name path if id not found (rare)
    }

    // Treat as a name
    const name = s;
    let doc = await Skill.findOne({ name: { $regex: `^${escapeRegex(name)}$`, $options: "i" } }).select("_id").lean();
    if (!doc) {
      // auto-create a new Skill
      try {
        const created = await Skill.create({ name });
        outIds.push(created._id);
      } catch (e) {
        // If a race condition created it, read it again
        const again = await Skill.findOne({ name: { $regex: `^${escapeRegex(name)}$`, $options: "i" } }).select("_id").lean();
        if (again) outIds.push(again._id);
      }
    } else {
      outIds.push(doc._id);
    }
  }
  return outIds;
}

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/* ------------------------------ list jobs ------------------------------ */

router.get("/", companyOrAdminAuth, async (req, res) => {
  try {
    if (req.user.role === "admin") {
      const jobs = await Job.find()
        .populate("skills preferredSkills", "name")
        .populate("company", "name logoUrl description website")
        .sort({ createdAt: -1 })
        .lean();
      return res.json(jobs);
    }

    const profile = await getCompanyProfile(req.user.id, { lean: true });
    if (!profile) return res.json([]);

    const jobs = await Job.find({ company: profile._id })
      .populate("skills preferredSkills", "name")
      .populate("company", "name logoUrl description website")
      .sort({ createdAt: -1 })
      .lean();

    res.json(jobs);
  } catch (e) {
    console.error("jobs:list error:", e);
    res.status(500).json({ message: "Failed to fetch jobs" });
  }
});

/* --------------------- AI: quick description (optional) -------------------- */

router.post("/ai/describe", companyOrAdminAuth, async (req, res) => {
  try {
    const { title = "", location = "", experience = "", skills = [] } = req.body || {};
    const skillNames = (Array.isArray(skills) ? skills : []).join(", ");

    let content = "";
    try {
      content = await chat({
        system: "You are an HR assistant. Write clear, concise, transparent job descriptions.",
        messages: [
          {
            role: "user",
            content:
`Write a job description (150-220 words) for:
Title: ${title}
Location: ${location}
Experience: ${experience || "Fresher / 0-2 years"}
Required Skills: ${skillNames}

Include: role overview, 4-6 bullet responsibilities, and impact. Avoid fluff.`,
          },
        ],
        temperature: 0.5,
      });
    } catch (err) {
      console.error("AI describe failed:", err?.message || err);
      content = "";
    }

    return res.json({ description: content || "" });
  } catch (e) {
    console.error("ai:describe error:", e);
    res.status(500).json({ message: "AI draft failed" });
  }
});

/* ------------------------------ create job ------------------------------ */

router.post("/", companyOrAdminAuth, async (req, res) => {
  try {
    let companyId;

    if (req.user.role !== "admin") {
      const profile = await ensureCompanyProfile(req.user.id);
      if (!profile) {
        return res.status(400).json({ message: "Create company profile first" });
      }
      companyId = profile._id;
    } else {
      if (!req.body.companyId) {
        return res.status(400).json({ message: "companyId required for admin creation" });
      }
      companyId = req.body.companyId;
    }

    const data = normalizeCreateUpdatePayload(req.body);

    // granular validations with precise messages
    if (!data.title) {
      return res.status(400).json({ message: "Title is required" });
    }
    if (data.package.min && data.package.max && Number(data.package.min) > Number(data.package.max)) {
      return res.status(400).json({ message: "Package min cannot exceed package max" });
    }

    // Resolve required & preferred skills to IDs; auto-create missing by name
    data.skills = await resolveSkillIds(data.skills);
    data.preferredSkills = await resolveSkillIds(data.preferredSkills);

    if (!data.skills.length) {
      return res.status(400).json({ message: "Select at least one required skill" });
    }

    // If no description provided, optionally use AI
    if (!data.description || data.description.length < 30) {
      try {
        const ai = await chat({
          system: "You are an HR assistant writing transparent job descriptions.",
          messages: [{
            role: "user",
            content:
`Draft a concise job description (120-180 words).
Title: ${data.title}
Location: ${data.location}
Experience: ${data.experience || "Fresher / 0-2 years"}`,
          }],
          temperature: 0.5,
        });
        if (ai) data.description = ai;
      } catch {/* ignore AI failure */}
    }

    const job = await Job.create({ company: companyId, ...data });
    const populated = await job.populate("skills preferredSkills", "name");

    res.status(201).json(populated);
  } catch (e) {
    console.error("jobs:create error:", e);
    res.status(400).json({ message: e.message || "Invalid payload" });
  }
});

/* ------------------------------ update job ------------------------------ */

router.put("/:id", companyOrAdminAuth, async (req, res) => {
  try {
    let filter = { _id: req.params.id };
    if (req.user.role !== "admin") {
      const profile = await getCompanyProfile(req.user.id, { lean: true });
      if (!profile) return res.status(400).json({ message: "Create company profile first" });
      filter.company = profile._id;
    }

    const update = normalizeCreateUpdatePayload(req.body);

    if (!update.title) {
      return res.status(400).json({ message: "Title is required" });
    }
    if (update.package.min && update.package.max && Number(update.package.min) > Number(update.package.max)) {
      return res.status(400).json({ message: "Package min cannot exceed package max" });
    }

    update.skills = await resolveSkillIds(update.skills);
    update.preferredSkills = await resolveSkillIds(update.preferredSkills);

    if (!update.skills.length) {
      return res.status(400).json({ message: "Select at least one required skill" });
    }

    const job = await Job.findOneAndUpdate(filter, { $set: update }, { new: true })
      .populate("skills preferredSkills", "name");

    if (!job) return res.status(404).json({ message: "Job not found" });
    res.json(job);
  } catch (e) {
    console.error("jobs:update error:", e);
    res.status(400).json({ message: e.message || "Invalid payload" });
  }
});

/* --------------------------- toggle open/closed --------------------------- */

router.patch("/:id/toggle", companyOrAdminAuth, async (req, res) => {
  try {
    let filter = { _id: req.params.id };
    if (req.user.role !== "admin") {
      const profile = await getCompanyProfile(req.user.id, { lean: true });
      if (!profile) return res.status(400).json({ message: "Create company profile first" });
      filter.company = profile._id;
    }

    const job = await Job.findOne(filter);
    if (!job) return res.status(404).json({ message: "Job not found" });

    job.status = job.status === "open" ? "closed" : "open";
    await job.save();
    res.json(job);
  } catch (e) {
    console.error("jobs:toggle error:", e);
    res.status(400).json({ message: "Toggle failed" });
  }
});

/* --------------------------------- delete -------------------------------- */

router.delete("/:id", companyOrAdminAuth, async (req, res) => {
  try {
    let filter = { _id: req.params.id };
    if (req.user.role !== "admin") {
      const profile = await getCompanyProfile(req.user.id, { lean: true });
      if (!profile) return res.status(400).json({ message: "Create company profile first" });
      filter.company = profile._id;
    }

    const del = await Job.findOneAndDelete(filter);
    if (!del) return res.status(404).json({ message: "Job not found" });

    res.json({ success: true });
  } catch (e) {
    console.error("jobs:delete error:", e);
    res.status(400).json({ message: "Delete failed" });
  }
});

module.exports = router;
