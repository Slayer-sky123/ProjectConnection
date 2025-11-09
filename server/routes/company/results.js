const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const companyOrAdminAuth = require("../../middleware/companyAuth");
const Application = require("../../models/Application");
const TestAssignment = require("../../models/TestAssignment");
const SkillTestResult = require("../../models/SkillTestResult");
const AptitudeResult = require("../../models/AptitudeResult");

async function ensureCompanyAccess(user, app) {
  if (user.role === "admin") return true;
  const CompanyProfile = require("../../models/CompanyProfile");
  const p =
    (await CompanyProfile.findOne({ owner: user.id }).select("_id").lean()) ||
    (await CompanyProfile.findOne({ user: user.id }).select("_id").lean());
  if (!p) return false;
  return String(app.company) === String(p._id) || String(app.job.company) === String(p._id);
}

router.get("/applications/:id/results", companyOrAdminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) return res.status(400).json({ message: "Invalid id" });

    const app = await Application.findById(id)
      .populate("job", "title company")
      .populate("student", "name email")
      .lean();
    if (!app) return res.status(404).json({ message: "Application not found" });
    if (!(await ensureCompanyAccess(req.user, app))) return res.status(403).json({ message: "Not allowed" });

    const tests = await TestAssignment.find({ application: app._id })
      .populate("skill", "name")
      .sort({ createdAt: -1 })
      .lean();

    // timelines + summaries
    const skillRows = await SkillTestResult.find({ user: app.student?._id })
      .sort({ createdAt: -1 })
      .limit(60)
      .populate("skill", "name")
      .lean();
    const aptRows = await AptitudeResult.find({ user: app.student?._id })
      .sort({ createdAt: -1 })
      .limit(60)
      .lean();

    const avgSkillScore = skillRows.length
      ? Math.round(
          (skillRows.reduce((s, r) => s + (Number(r.score) || 0), 0) / skillRows.length) * 10
        ) / 10
      : null;
    const avgAptitudeScore = aptRows.length
      ? Math.round(
          (aptRows.reduce((s, r) => s + (Number(r.score) || 0), 0) / aptRows.length) * 10
        ) / 10
      : null;

    const skillTimeline = skillRows
      .slice()
      .reverse()
      .map((r) => ({
        x: new Date(r.createdAt).getTime(),
        y: Math.round((r.score || 0) * 10) / 10
      }));
    const aptitudeTimeline = aptRows
      .slice()
      .reverse()
      .map((r) => ({
        x: new Date(r.createdAt).getTime(),
        y: Math.round((r.score || 0) * 10) / 10
      }));

    res.json({
      application: app,
      tests: tests.map((t) => ({
        _id: t._id,
        type: t.type,
        title: t.title,
        skillName: t.skill?.name || null,
        startAt: t.startAt,
        endAt: t.endAt,
        durationMins: t.durationMins,
        score: t.score,
        total: t.total,
        status: t.status,
        batch: t.batch,
        createdAt: t.createdAt
      })),
      recruiterTests: [], // hook here if you want to surface recruiter template submissions
      summaries: { avgSkillScore, avgAptitudeScore },
      timelines: { skillTimeline, aptitudeTimeline }
    });
  } catch (e) {
    console.error("results json error:", e);
    res.status(500).json({ message: "Failed to load results" });
  }
});

// ---------- Excel export ----------
router.get("/applications/:id/results/export.xlsx", companyOrAdminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const app = await Application.findById(id)
      .populate("job", "title company")
      .populate("student", "name email")
      .lean();
    if (!app) return res.status(404).json({ message: "Application not found" });
    if (!(await ensureCompanyAccess(req.user, app))) return res.status(403).json({ message: "Not allowed" });

    const tests = await TestAssignment.find({ application: app._id })
      .populate("skill", "name")
      .sort({ createdAt: -1 })
      .lean();

    const ExcelJS = require("exceljs");
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet("Results");

    ws.addRow(["Candidate", app.student?.name || ""]);
    ws.addRow(["Email", app.student?.email || ""]);
    ws.addRow(["Job", app.job?.title || ""]);
    ws.addRow(["Resume Score", app.screening?.resumeScore ?? ""]);
    ws.addRow(["Fit Score", app.screening?.fitScore ?? ""]);
    ws.addRow([]);
    ws.addRow(["Assignments"]);
    ws.addRow(["Type", "Title", "Skill", "Start", "End", "Duration (m)", "Score", "Total", "Status", "Batch", "Assigned At"]);
    tests.forEach((t) => {
      ws.addRow([
        t.type,
        t.title || (t.type === "aptitude" ? "Aptitude Test" : "Test"),
        t.skill?.name || "",
        t.startAt ? new Date(t.startAt).toLocaleString() : "",
        t.endAt ? new Date(t.endAt).toLocaleString() : "",
        t.durationMins || "",
        t.score == null ? "" : t.score,
        t.total == null ? "" : t.total,
        t.status || "",
        t.batch || "",
        t.createdAt ? new Date(t.createdAt).toLocaleString() : ""
      ]);
    });

    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", `attachment; filename="application-${app._id}-results.xlsx"`);

    await wb.xlsx.write(res);
    res.end();
  } catch (e) {
    console.error("xlsx export error:", e);
    res.status(500).json({ message: "Export failed" });
  }
});

// ---------- PDF export ----------
router.get("/applications/:id/results/export.pdf", companyOrAdminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const app = await Application.findById(id)
      .populate("job", "title company")
      .populate("student", "name email")
      .lean();
    if (!app) return res.status(404).json({ message: "Application not found" });
    if (!(await ensureCompanyAccess(req.user, app))) return res.status(403).json({ message: "Not allowed" });

    const tests = await TestAssignment.find({ application: app._id })
      .populate("skill", "name")
      .sort({ createdAt: -1 })
      .lean();

    const PDFDocument = require("pdfkit");
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="application-${app._id}-results.pdf"`);

    const doc = new PDFDocument({ margin: 40 });
    doc.pipe(res);

    doc.fontSize(16).text("Application Results", { underline: true });
    doc.moveDown(0.5);
    doc.fontSize(12).text(`Candidate: ${app.student?.name || ""}`);
    doc.text(`Email: ${app.student?.email || ""}`);
    doc.text(`Job: ${app.job?.title || ""}`);
    doc.text(`Resume Score: ${app.screening?.resumeScore ?? "—"}`);
    doc.text(`Fit Score: ${app.screening?.fitScore ?? "—"}`);
    doc.moveDown();

    doc.fontSize(14).text("Assignments", { underline: true });
    doc.moveDown(0.5);
    tests.forEach((t, idx) => {
      doc
        .fontSize(12)
        .text(`${idx + 1}. ${t.title || (t.type === "aptitude" ? "Aptitude Test" : "Test")} (${t.type})`);
      if (t.skill?.name) doc.text(`   Skill: ${t.skill.name}`);
      if (t.startAt || t.endAt)
        doc.text(
          `   Window: ${t.startAt ? new Date(t.startAt).toLocaleString() : "—"} -> ${
            t.endAt ? new Date(t.endAt).toLocaleString() : "—"
          }`
        );
      doc.text(`   Duration: ${t.durationMins || 0} mins`);
      doc.text(
        `   Score: ${t.score != null ? t.score : "—"} / ${t.total != null ? t.total : "—"} • Status: ${t.status || "—"}`
      );
      if (t.batch) doc.text(`   Batch: ${t.batch}`);
      doc.text(`   Assigned: ${t.createdAt ? new Date(t.createdAt).toLocaleString() : "—"}`);
      doc.moveDown(0.5);
    });

    doc.end();
  } catch (e) {
    console.error("pdf export error:", e);
    res.status(500).json({ message: "Export failed" });
  }
});

module.exports = router;
