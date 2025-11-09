const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const companyOrAdminAuth = require("../../middleware/companyAuth");
const Application = require("../../models/Application");
const SkillTestResult = require("../../models/SkillTestResult");
const AptitudeResult = require("../../models/AptitudeResult");
const { RecruiterTestAssign, RecruiterTestResult } = require("../../models/RecruiterTestSubmission");

/* ------------------------------ utilities ------------------------------ */
function round1(v) {
  const n = Number(v);
  return Number.isFinite(n) ? Math.round(n * 10) / 10 : null;
}
function pct(v, total) {
  const n = Number(v), t = Number(total);
  if (!Number.isFinite(n) || !Number.isFinite(t) || t <= 0) return null;
  return round1((n / t) * 100);
}
function toXY(items, scoreKey = "score", totalKey = "total", dateKey = "createdAt") {
  return (items || [])
    .map(r => ({ x: new Date(r[dateKey]).getTime(), y: round1(r[scoreKey] || 0) }))
    .sort((a, b) => a.x - b.x);
}

/* ------------------------------ builders ------------------------------- */
async function loadApp(applicationId) {
  if (!mongoose.isValidObjectId(applicationId)) {
    const err = new Error("applicationId required");
    err.status = 400;
    throw err;
  }
  const app = await Application.findById(applicationId)
    .populate("job", "title")
    .populate("student", "name email")
    .lean();
  if (!app) {
    const err = new Error("Application not found");
    err.status = 404;
    throw err;
  }
  return app;
}

async function buildSummary(applicationId) {
  const app = await loadApp(applicationId);

  // student-wide results
  const skillRows = await SkillTestResult.find({ user: app.student?._id })
    .sort({ createdAt: -1 })
    .limit(60)
    .populate("skill", "name")
    .lean();

  const aptRows = await AptitudeResult.find({ user: app.student?._id })
    .sort({ createdAt: -1 })
    .limit(60)
    .lean();

  // recruiter per-application
  const assigns = await RecruiterTestAssign.find({ application: applicationId }).select("_id createdAt").lean();
  const assignIds = assigns.map(a => a._id);
  const rResults = assignIds.length
    ? await RecruiterTestResult.find({ assign: { $in: assignIds } }).sort({ createdAt: -1 }).lean()
    : [];

  const avgSkillScore = skillRows.length
    ? round1(skillRows.reduce((s, r) => s + (Number(r.score) || 0), 0) / skillRows.length)
    : null;
  const avgAptitudeScore = aptRows.length
    ? round1(aptRows.reduce((s, r) => s + (Number(r.score) || 0), 0) / aptRows.length)
    : null;

  const recruiterAvg = rResults.length
    ? round1(rResults.reduce((s, r) => s + (Number(r.score) || 0), 0) / rResults.length)
    : null;

  const lastSkill = skillRows[0]
    ? { name: skillRows[0]?.skill?.name || "Skill", score: round1(skillRows[0].score || 0) }
    : null;

  const lastAptitude = aptRows[0]
    ? { title: aptRows[0]?.title || "Aptitude", score: round1(aptRows[0].score || 0) }
    : null;

  const skillTimeline = skillRows.slice().reverse().map(r => ({
    x: new Date(r.createdAt).getTime(),
    y: round1(r.score || 0),
    label: r?.skill?.name || "Skill",
  }));

  const aptitudeTimeline = aptRows.slice().reverse().map(r => ({
    x: new Date(r.createdAt).getTime(),
    y: round1(r.score || 0),
    label: r?.title || "Aptitude",
  }));

  const recruiterTimeline = rResults.slice().reverse().map(r => ({
    x: new Date(r.createdAt).getTime(),
    y: round1(r.score || 0),
    label: "Recruiter Test",
  }));

  const resumeScore = app?.screening?.resumeScore ?? null;
  const fitScore = app?.screening?.fitScore ?? null;
  const topSkills = (app?.screening?.topSkills && Array.isArray(app.screening.topSkills))
    ? app.screening.topSkills.slice(0, 10)
    : (app?.screening?.notes || "")
        .toString()
        .split(/[•,]/)
        .map(s => s.trim())
        .filter(Boolean)
        .slice(0, 10);

  const recommendation =
    (avgSkillScore || 0) >= 7 &&
    (resumeScore || 0) >= 70 &&
    (fitScore || 0) >= 70
      ? "Strong"
      : (avgSkillScore || 0) >= 6
      ? "Consider with interview"
      : "Needs work";

  return {
    resumeScore,
    fitScore,
    avgSkillScore,
    avgAptitudeScore,
    recruiterAvg,
    topSkills,
    riskFlags: app?.screening?.riskFlags || [],
    lastSkill,
    lastAptitude,
    skillTimeline,
    aptitudeTimeline,
    recruiterTimeline,
    recruiterLatest: rResults[0]
      ? { score: round1(rResults[0].score || 0), at: rResults[0]?.createdAt }
      : null,
    recommendation,
  };
}

async function buildResults(applicationId) {
  const app = await loadApp(applicationId);

  const skillRows = await SkillTestResult.find({ user: app.student?._id })
    .sort({ createdAt: -1 })
    .populate("skill", "name")
    .lean();

  const aptitudeRows = await AptitudeResult.find({ user: app.student?._id })
    .sort({ createdAt: -1 })
    .lean();

  const assigns = await RecruiterTestAssign.find({ application: applicationId })
    .sort({ createdAt: -1 })
    .lean();

  const assignIds = assigns.map(a => a._id);
  const rResults = assignIds.length
    ? await RecruiterTestResult.find({ assign: { $in: assignIds } }).sort({ createdAt: -1 }).lean()
    : [];

  const kpi = {
    atsResume: app?.screening?.resumeScore ?? null,
    atsFit: app?.screening?.fitScore ?? null,
    avgSkill: skillRows.length
      ? round1(skillRows.reduce((s, r) => s + (Number(r.score) || 0), 0) / skillRows.length)
      : null,
    avgAptitude: aptitudeRows.length
      ? round1(aptitudeRows.reduce((s, r) => s + (Number(r.score) || 0), 0) / aptitudeRows.length)
      : null,
    recruiterAvg: rResults.length
      ? round1(rResults.reduce((s, r) => s + (Number(r.score) || 0), 0) / rResults.length)
      : null,
  };

  const ats = {
    topSkills: (app?.screening?.topSkills && Array.isArray(app.screening.topSkills))
      ? app.screening.topSkills.slice(0, 10)
      : (app?.screening?.notes || "")
          .toString()
          .split(/[•,]/)
          .map(s => s.trim())
          .filter(Boolean)
          .slice(0, 10),
    riskFlags: app?.screening?.riskFlags || [],
    experienceSummary: app?.screening?.experienceSummary || "",
    education: app?.screening?.education || "",
  };

  const series = {
    skillTimeline: toXY(skillRows, "score", "total", "createdAt").map((p, i) => ({
      ...p,
      label: (skillRows[i]?.skill?.name) || "Skill",
    })),
  };

  const aptitudeSeries = toXY(aptitudeRows, "score", "total", "createdAt").map((p, i) => ({
    ...p,
    label: (aptitudeRows[i]?.title) || "Aptitude",
  }));

  const recruiterSeries = (rResults || []).slice().reverse().map(r => ({
    x: new Date(r.createdAt).getTime(),
    y: round1(r.score || 0),
    label: "Recruiter Test",
  }));

  const skillTable = skillRows.map(r => ({
    when: r.createdAt,
    skill: r?.skill?.name || "Skill",
    score: round1(r.score || 0),
    total: Number(r.total || 10),
    pct: pct(r.score, r.total),
  }));

  const aptitudeTable = aptitudeRows.map(r => ({
    when: r.createdAt,
    title: r?.title || "Aptitude",
    score: round1(r.score || 0),
    total: Number(r.total || 10),
    pct: pct(r.score, r.total),
  }));

  const findAssign = (assignId) => assigns.find(a => String(a._id) === String(assignId)) || null;
  const recruiterTable = rResults.map(r => {
    const a = findAssign(r.assign);
    return {
      when: r?.createdAt,
      title: "Recruiter Test",
      score: round1(r.score || 0),
      total: Number(r.total || 10),
      pct: pct(r.score, r.total),
      dueAt: a?.dueAt || null,
      assignedAt: a?.createdAt || null,
    };
  });

  return {
    application: {
      id: app._id,
      jobTitle: app?.job?.title || "",
      student: { name: app?.student?.name || "", email: app?.student?.email || "" },
      status: app?.status || "applied",
      interview: app?.interview || null,
    },
    kpi,
    ats,
    series: {
      skillTimeline: series.skillTimeline,
      aptitudeTimeline: aptitudeSeries,
      recruiterTimeline: recruiterSeries,
    },
    tables: {
      skills: skillTable,
      aptitude: aptitudeTable,
      recruiter: recruiterTable,
    },
  };
}

/* -------------------------------- routes --------------------------------- */

// COMPACT header cards (used by InsightsPanel)
router.get("/summary", companyOrAdminAuth, async (req, res) => {
  try {
    const { applicationId } = req.query || {};
    const out = await buildSummary(applicationId);
    res.json(out);
  } catch (e) {
    console.error("screening:summary error:", e);
    res.status(e.status || 500).json({ message: e.message || "Failed to load summary" });
  }
});

// DETAILED results for the Results drawer (query param form)
router.get("/results", companyOrAdminAuth, async (req, res) => {
  try {
    const { applicationId } = req.query || {};
    const out = await buildResults(applicationId);
    res.json(out);
  } catch (e) {
    console.error("screening:results error:", e);
    res.status(e.status || 500).json({ message: e.message || "Failed to load results" });
  }
});

// Alias: path form used by your UI: /applications/:id/results
router.get("/applications/:id/results", companyOrAdminAuth, async (req, res) => {
  try {
    const out = await buildResults(req.params.id);
    res.json(out);
  } catch (e) {
    console.error("screening:applications:results error:", e);
    res.status(e.status || 500).json({ message: e.message || "Failed to load results" });
  }
});

module.exports = router;
