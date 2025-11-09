const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const companyOrAdminAuth = require("../../middleware/companyAuth");
const Application = require("../../models/Application");
const Job = require("../../models/Job");
const CompanyProfile = require("../../models/CompanyProfile");
const { analyzeResume } = require("../../services/resumeAnalyzer");

const uploadDir = path.join(__dirname, "../../uploads/tmp");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
const upload = multer({ dest: uploadDir });

async function myProfile(userId) {
  return CompanyProfile.findOne({ owner: userId }).select("_id").lean()
    || CompanyProfile.findOne({ user: userId }).select("_id").lean();
}

async function extractFileText(file) {
  if (!file) return "";
  const ext = path.extname(file.originalname || "").toLowerCase();
  const buf = fs.readFileSync(file.path);
  try {
    if (ext === ".pdf") {
      const pdfParse = (await import("pdf-parse").catch(() => null))?.default;
      if (pdfParse) {
        const data = await pdfParse(buf);
        return data.text || "";
      }
    }
    return buf.toString("utf8");
  } finally {
    fs.unlink(file.path, () => {});
  }
}

// POST /api/company/applications/:id/ai-screen
router.post("/applications/:id/ai-screen", companyOrAdminAuth, upload.single("resume"), async (req, res) => {
  try {
    const app = await Application.findById(req.params.id)
      .populate("job", "title description skills company")
      .populate("student", "name email skills")
      .lean();
    if (!app) return res.status(404).json({ message: "Application not found" });

    if (req.user.role !== "admin") {
      const profile = await myProfile(req.user.id);
      if (!profile || String(app.job.company) !== String(profile._id)) {
        return res.status(403).json({ message: "Not allowed (company ownership mismatch)" });
      }
    }

    let resumeText = (req.body?.resumeText || "").toString().trim();
    if (!resumeText && req.file) {
      resumeText = await extractFileText(req.file);
    }

    const job = await Job.findById(app.job._id)
      .select("title description skills")
      .populate("skills", "name")
      .lean();
    if (job) job.skills = (job.skills || []).map((s) => s.name || s);

    const skillsDeclared = (app.student?.skills || []).map(String);

    const safeText =
      resumeText && resumeText.length >= 40
        ? resumeText
        : `
Candidate: ${app.student?.name || ""} <${app.student?.email || ""}>
Declared Skills: ${skillsDeclared.join(", ")}
Target Job: ${job?.title || ""}
Job Description: ${(job?.description || "").slice(0, 800)}
`.trim();

    const analysis = await analyzeResume({ resumeText: safeText, skills: skillsDeclared, job });

    // Save back normalized 0–100 scores + ATS snippets for Results UI
    const updated = await Application.findByIdAndUpdate(
      app._id,
      {
        $set: {
          "screening.resumeScore": Math.round(analysis.resumeScore),
          "screening.fitScore": Math.round(analysis.fitScore),
          "screening.notes": (analysis.recommendations || []).slice(0, 5).join(" • "),
          "screening.topSkills": analysis.topSkills || [],
          "screening.riskFlags": analysis.riskFlags || [],
          "screening.education": analysis.education || "",
          "screening.experienceSummary": analysis.experienceSummary || "",
        },
      },
      { new: true }
    ).lean();

    res.json({ analysis, application: updated });
  } catch (e) {
    console.error("ai-screen failed:", e);
    res.status(500).json({ message: "AI screening failed" });
  }
});

module.exports = router;
