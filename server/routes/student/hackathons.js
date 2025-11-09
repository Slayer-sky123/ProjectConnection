// routes/student/hackathons.js
const express = require("express");
const router = express.Router();
const path = require("path");
const fs = require("fs");
const multer = require("multer");
const auth = require("../../middleware/auth");

const Hackathon = require("../../models/Hackathon");
const HackathonRegistration = require("../../models/HackathonRegistration");
const HackathonSubmission = require("../../models/HackathonSubmission");

// uploads for submissions
const uploadDir = path.join(__dirname, "../../uploads/hackathons");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const ts = Date.now();
    const safe = file.originalname.replace(/[^\w.\-]+/g, "_");
    cb(null, `${ts}_${safe}`);
  },
});
const upload = multer({ storage });

// PUBLIC: list public + live/upcoming (+recent ended optional)
router.get("/", async (_req, res) => {
  const now = new Date();
  const list = await Hackathon.find({
    visibility: "public",
    endAt: { $gte: new Date(now.getTime() - 1000 * 60 * 60 * 24) }
  })
    .sort({ startAt: 1 })
    .populate("skills", "name")
    .lean();
  res.json(list);
});

// PUBLIC: detail
router.get("/:id", async (req, res) => {
  const doc = await Hackathon.findById(req.params.id).populate("skills", "name").lean();
  if (!doc) return res.status(404).json({ message: "Not found" });
  res.json(doc);
});

// AUTH: my registration
router.get("/:id/registration", auth, async (req, res) => {
  const reg = await HackathonRegistration.findOne({ hackathon: req.params.id, student: req.user.id }).lean();
  res.json(reg || null);
});

// AUTH: register
router.post("/:id/register", auth, async (req, res) => {
  const doc = await Hackathon.findById(req.params.id);
  if (!doc) return res.status(404).json({ message: "Hackathon not found" });
  const now = new Date();
  if (now > doc.endAt) return res.status(400).json({ message: "Registration closed" });

  const reg = await HackathonRegistration.findOneAndUpdate(
    { hackathon: doc._id, student: req.user.id },
    { $setOnInsert: { teamName: (req.body?.teamName || "").trim() } },
    { upsert: true, new: true }
  );
  res.json(reg);
});

// AUTH: unregister
router.delete("/:id/register", auth, async (req, res) => {
  await HackathonRegistration.findOneAndDelete({ hackathon: req.params.id, student: req.user.id });
  res.json({ success: true });
});

// AUTH: submit (multipart optional)
router.post("/:id/submit", auth, upload.single("file"), async (req, res) => {
  const hack = await Hackathon.findById(req.params.id);
  if (!hack) return res.status(404).json({ message: "Hackathon not found" });

  const now = new Date();
  if (now < hack.startAt) return res.status(400).json({ message: "Hackathon not started" });
  if (now > hack.endAt) return res.status(400).json({ message: "Submission window closed" });

  const fileUrl = req.file ? `/uploads/hackathons/${req.file.filename}` : "";

  const sub = await HackathonSubmission.findOneAndUpdate(
    { hackathon: hack._id, student: req.user.id },
    {
      $set: {
        repoUrl: (req.body?.repoUrl || "").trim(),
        demoUrl: (req.body?.demoUrl || "").trim(),
        notes: (req.body?.notes || "").trim(),
        ...(fileUrl ? { fileUrl } : {}),
      },
    },
    { upsert: true, new: true }
  );
  res.json(sub);
});

// PUBLIC: leaderboard (once ranked)
router.get("/:id/leaderboard", async (req, res) => {
  const subs = await HackathonSubmission.find({ hackathon: req.params.id, rank: { $ne: null } })
    .populate("student", "name")
    .sort({ rank: 1 })
    .lean();
  res.json(subs);
});

module.exports = router;
