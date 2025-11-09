const Skill = require("../models/Skill");
const SkillTestResult = require("../models/SkillTestResult");
const Company = require("../models/Company");
const Job = require("../models/Job");
const Application = require("../models/Application");
const Hackathon = require("../models/Hackathon");
const Webinar = require("../models/Webinar");
const Partnership = require("../models/Partnership");
const User = require("../models/User");

// ------- Helpers
const avgScoreBySkillMap = async (studentId) => {
  const results = await SkillTestResult.find({ user: studentId })
    .populate("skill", "name")
    .lean();
  const map = {};
  results.forEach(r => {
    const name = r.skill?.name;
    if (!name) return;
    if (!map[name]) map[name] = [];
    map[name].push(r.score / (r.total || 10) * 10); // normalize to /10
  });
  const avg = {};
  Object.keys(map).forEach(k => {
    const arr = map[k];
    avg[k] = arr.reduce((a, b) => a + b, 0) / arr.length;
  });
  return avg;
};

const computeFit = (student, requiredSkills, avgScoreMap) => {
  // skill coverage
  const studentSkillNames = (student.skills || []).map(s => s.toLowerCase());
  let coverage = 0;
  requiredSkills.forEach(rs => {
    if (studentSkillNames.includes(rs.name?.toLowerCase())) coverage++;
  });
  const coveragePct = requiredSkills.length ? (coverage / requiredSkills.length) : 1;

  // test score avg for those skills
  const testScores = requiredSkills.map(rs => avgScoreMap[rs.name] || 0);
  const meanTest = testScores.length
    ? testScores.reduce((a, b) => a + b, 0) / testScores.length
    : 0;

  // quick heuristic 0..100
  return Math.round((coveragePct * 0.6 + (meanTest / 10) * 0.4) * 100);
};

// ------- Profile
exports.getCompanyProfile = async (req, res) => {
  const owner = req.user.id;
  const profile = await Company.findOne({ owner }).lean();
  res.json(profile || null);
};

exports.upsertCompanyProfile = async (req, res) => {
  const owner = req.user.id;
  const { name, website, logoUrl, hq, about } = req.body;
  const profile = await Company.findOneAndUpdate(
    { owner },
    { name, website, logoUrl, hq, about, owner },
    { upsert: true, new: true }
  );
  res.json(profile);
};

// ------- Jobs
exports.listJobs = async (req, res) => {
  const owner = req.user.id;
  const company = await Company.findOne({ owner }).lean();
  if (!company) return res.json([]);
  const jobs = await Job.find({ company: company._id })
    .populate("skills", "name")
    .sort({ createdAt: -1 });
  res.json(jobs);
};

exports.createJob = async (req, res) => {
  const owner = req.user.id;
  const company = await Company.findOne({ owner });
  if (!company) return res.status(400).json({ message: "Create company profile first" });

  const { title, type, location, skills = [], description, minScore = 0, isFeatured = false } = req.body;

  const job = await Job.create({
    company: company._id,
    title, type, location, skills, description, minScore, isFeatured,
  });
  const populated = await job.populate("skills", "name");
  res.status(201).json(populated);
};

exports.toggleJobStatus = async (req, res) => {
  const job = await Job.findById(req.params.id);
  if (!job) return res.status(404).json({ message: "Job not found" });
  job.status = job.status === "open" ? "closed" : "open";
  await job.save();
  res.json(job);
};

// ------- Applications (basic)
exports.listApplications = async (req, res) => {
  const owner = req.user.id;
  const company = await Company.findOne({ owner }).lean();
  if (!company) return res.json([]);
  const jobIds = (await Job.find({ company: company._id }).select("_id")).map(j => j._id);
  const apps = await Application.find({ job: { $in: jobIds } })
    .populate("job", "title")
    .populate("student", "name email skills")
    .sort({ createdAt: -1 })
    .lean();

  res.json(apps);
};

// ------- Talent Search (AI-ish ranking)
exports.searchTalent = async (req, res) => {
  const { skillIds = [], minScore = 0 } = req.query;
  const ids = Array.isArray(skillIds) ? skillIds : (skillIds ? [skillIds] : []);
  const requiredSkills = await Skill.find({ _id: { $in: ids } }).lean();

  // Pull student users with any skills overlap first (simple heuristic)
  const students = await User.find({ role: "student" }).select("name email university skills").lean();

  // prefetch skill average scores for each student
  const cache = {};
  const results = [];
  for (const s of students) {
    if (!cache[s._id]) cache[s._id] = await avgScoreBySkillMap(s._id);
    const fit = computeFit(s, requiredSkills, cache[s._id]);

    // minScore filter: mean of required skills should be >= minScore
    const meanReq = requiredSkills.length
      ? requiredSkills
          .map(r => cache[s._id][r.name] || 0)
          .reduce((a, b) => a + b, 0) / requiredSkills.length
      : 0;

    if (meanReq >= Number(minScore)) {
      results.push({
        student: s,
        fitScore: fit,
        avgRequiredSkillScore: Math.round(meanReq * 10) / 10,
      });
    }
  }

  results.sort((a, b) => b.fitScore - a.fitScore);
  res.json(results.slice(0, 100));
};

// ------- Hackathons
exports.listHackathons = async (req, res) => {
  const owner = req.user.id;
  const company = await Company.findOne({ owner }).lean();
  if (!company) return res.json([]);
  const items = await Hackathon.find({ company: company._id }).populate("skills", "name").sort({ createdAt: -1 });
  res.json(items);
};

exports.createHackathon = async (req, res) => {
  const owner = req.user.id;
  const company = await Company.findOne({ owner });
  if (!company) return res.status(400).json({ message: "Create company profile first" });

  const { title, brief, skills = [], startAt, endAt, prize } = req.body;
  const item = await Hackathon.create({ company: company._id, title, brief, skills, startAt, endAt, prize });
  res.status(201).json(await item.populate("skills", "name"));
};

// ------- Webinars
exports.listWebinars = async (req, res) => {
  const owner = req.user.id;
  const company = await Company.findOne({ owner }).lean();
  if (!company) return res.json([]);
  const items = await Webinar.find({ company: company._id }).sort({ startsAt: 1 });
  res.json(items);
};

exports.createWebinar = async (req, res) => {
  const owner = req.user.id;
  const company = await Company.findOne({ owner });
  if (!company) return res.status(400).json({ message: "Create company profile first" });

  const { title, speaker, description, url, startsAt, durationMins } = req.body;
  const item = await Webinar.create({ company: company._id, title, speaker, description, url, startsAt, durationMins });
  res.status(201).json(item);
};

// ------- Partnerships
exports.listPartnerships = async (req, res) => {
  const owner = req.user.id;
  const company = await Company.findOne({ owner }).lean();
  if (!company) return res.json([]);
  const items = await Partnership.find({ company: company._id }).sort({ createdAt: -1 });
  res.json(items);
};

exports.createPartnership = async (req, res) => {
  const owner = req.user.id;
  const company = await Company.findOne({ owner });
  if (!company) return res.status(400).json({ message: "Create company profile first" });

  const { university, title, details, status } = req.body;
  const item = await Partnership.create({ company: company._id, university, title, details, status });
  res.status(201).json(item);
};

exports.updateApplicationStatus = async (req, res) => {
  const { id } = req.params; // application id
  const { status = "applied", notes = "" } = req.body;

  const app = await Application.findById(id)
    .populate({ path: "job", select: "company" });
  if (!app) return res.status(404).json({ message: "Application not found" });

  // ensure this company owns the job
  const owner = req.user.id;
  const company = await Company.findOne({ owner }).lean();
  if (!company || String(app.job.company) !== String(company._id)) {
    return res.status(403).json({ message: "Not allowed" });
  }

  app.status = status;
  app.screening.notes = notes;
  await app.save();
  res.json({ message: "Updated", app });
};
