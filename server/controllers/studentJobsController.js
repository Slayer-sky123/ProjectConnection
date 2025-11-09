const path = require("path");
const fs = require("fs");
const Job = require("../models/Job");
const Application = require("../models/Application");
const SkillTestResult = require("../models/SkillTestResult");
const Skill = require("../models/Skill");

// quick resume scoring (very simple keyword coverage)
const keywordScore = (text = "", keywords = []) => {
  if (!text || !keywords?.length) return 0;
  const lower = text.toLowerCase();
  let hits = 0;
  keywords.forEach(k => {
    if (lower.includes(k.toLowerCase())) hits++;
  });
  return Math.min(100, Math.round((hits / keywords.length) * 100));
};

const meanRequiredSkillScore = async (userId, skillIds) => {
  if (!skillIds?.length) return 0;
  const skills = await Skill.find({ _id: { $in: skillIds } }).lean();
  const results = await SkillTestResult.find({ user: userId }).populate("skill", "name").lean();
  const map = {};
  results.forEach(r => { map[r.skill?.name] = (r.score / (r.total || 10)) * 10; });

  const arr = skills.map(s => map[s.name] || 0);
  return arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;
};

exports.listOpenJobs = async (req, res) => {
  const jobs = await Job.find({ status: "open" })
    .populate("company", "name logoUrl")
    .populate("skills", "name")
    .sort({ createdAt: -1 })
    .lean();
  res.json(jobs);
};

exports.getJob = async (req, res) => {
  const job = await Job.findById(req.params.id)
    .populate("company", "name logoUrl website")
    .populate("skills", "name")
    .lean();
  if (!job) return res.status(404).json({ message: "Job not found" });
  res.json(job);
};

exports.applyToJob = async (req, res) => {
  const userId = req.user.id;
  const jobId = req.params.id;
  const { coverLetter = "" } = req.body;

  const job = await Job.findById(jobId).populate("skills", "name").lean();
  if (!job || job.status !== "open") {
    return res.status(400).json({ message: "Job is not open or not found" });
  }

  // resume file (optional)
  let cvUrl = "";
  if (req.file) {
    cvUrl = `/uploads/resumes/${req.file.filename}`;
  }

  // smart screening (heuristics you can evolve later)
  const resumeText = (req.body.resumeText || "").slice(0, 20000); // if you embed text
  const resumeScore = keywordScore(resumeText || coverLetter, job.skills.map(s => s.name));
  const testScore = await meanRequiredSkillScore(userId, job.skills.map(s => s._id));

  // combine 0..100
  const fitScore = Math.round(resumeScore * 0.5 + (testScore / 10) * 50);

  const existing = await Application.findOne({ job: jobId, student: userId });
  if (existing) return res.status(409).json({ message: "Already applied" });

  const app = await Application.create({
    job: jobId,
    student: userId,
    cvUrl,
    coverLetter,
    screening: { resumeScore, testScore, fitScore, notes: "" },
    status: "applied",
  });

  res.status(201).json({ message: "Application submitted", applicationId: app._id });
};
