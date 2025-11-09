const express = require("express");
const mongoose = require("mongoose");
const router = express.Router();

const authMiddleware = require("../middleware/auth");
const upload = require("../middleware/upload");

const User = require("../models/User");
const SkillTestResult = require("../models/SkillTestResult");
const Skill = require("../models/Skill");
const { generateUniqueStudentId } = require("../utils/generateStudentId");

// ---------- 1) Skill Progress ----------
router.get("/skill-progress", authMiddleware, async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: "Unauthorized access" });

    const results = await SkillTestResult.find({ user: userId })
      .populate("skill", "name")
      .sort({ createdAt: -1 });

    const grouped = {};
    results.forEach((result) => {
      const skillId = String(result.skill?._id || result.skill);
      if (!grouped[skillId]) {
        grouped[skillId] = {
          skill: result.skill,
          history: [],
        };
      }
      grouped[skillId].history.push({
        score: result.score,
        total: result.total,
        createdAt: result.createdAt,
      });
    });

    res.json(Object.values(grouped));
  } catch (err) {
    console.error("Error fetching skill progress:", err.message);
    res.status(500).json({ message: "Failed to fetch skill progress" });
  }
});

// ---------- 2) Career Roadmap ----------
router.get("/career-roadmap", authMiddleware, async (req, res) => {
  try {
    const results = await SkillTestResult.find({ user: req.user.id })
      .populate("skill", "name")
      .lean();

    if (!results.length) {
      return res.json({ message: "No roadmap available", roadmap: {} });
    }

    const skillScores = {};
    results.forEach(({ skill, score }) => {
      const skillName = skill?.name || String(skill);
      if (!skillScores[skillName]) skillScores[skillName] = [];
      skillScores[skillName].push(score);
    });

    const roadmap = {};
    for (const skill in skillScores) {
      const scores = skillScores[skill];
      const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
      const steps = [];
      if (avg < 4) {
        steps.push(
          {
            id: "start",
            type: "Start",
            title: `Start Learning ${skill}`,
            description: `Build a solid foundation in ${skill}.`,
            parent: null,
            link: null,
          },
          {
            id: "course1",
            type: "Course",
            title: `Beginner Course for ${skill}`,
            description: `Understand core concepts of ${skill} from scratch.`,
            parent: "start",
            link: `https://www.coursera.org/search?query=${encodeURIComponent(
              skill
            )}`,
          },
          {
            id: "basics",
            type: "Practice",
            title: `Hands-on Practice for ${skill}`,
            description: `Practice with beginner-level problems.`,
            parent: "course1",
            link: null,
          }
        );
      } else if (avg < 7) {
        steps.push(
          {
            id: "project",
            type: "Project",
            title: `Intermediate ${skill} Projects`,
            description: `Apply your knowledge in real-world use cases.`,
            parent: null,
            link: `https://github.com/search?q=${encodeURIComponent(
              skill
            )}+intermediate+project`,
          },
          {
            id: "mentor",
            type: "Mentorship",
            title: `Join a ${skill} Community`,
            description: `Get feedback and collaborate with peers.`,
            parent: "project",
            link: `https://discord.com/search?q=${encodeURIComponent(
              skill
            )}&type=public`,
          }
        );
      } else {
        steps.push(
          {
            id: "certification",
            type: "Certification",
            title: `Get Certified in ${skill}`,
            description: `Showcase your proficiency in ${skill}.`,
            parent: null,
            link: `https://www.edx.org/search?q=${encodeURIComponent(skill)}`,
          },
          {
            id: "oss",
            type: "Contribute",
            title: `Open Source ${skill} Projects`,
            description: `Contribute to codebases.`,
            parent: "certification",
            link: `https://github.com/search?q=${encodeURIComponent(
              skill
            )}+good+first+issue`,
          }
        );
      }
      roadmap[skill] = steps;
    }

    res.json({ roadmap });
  } catch (err) {
    console.error("Failed to generate roadmap:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// ---------- 3) Submit Skill Test Result ----------
router.post("/skill-test/submit", authMiddleware, async (req, res) => {
  try {
    const { skill, score, total } = req.body;
    if (!skill || score == null || total == null) {
      return res.status(400).json({ message: "Incomplete data" });
    }
    const SkillTestResultModel = mongoose.model("SkillTestResult");
    const newResult = new SkillTestResultModel({
      user: req.user.id,
      skill: new mongoose.Types.ObjectId(skill),
      score: Number(score),
      total: Number(total),
    });
    await newResult.save();
    res.status(201).json({ message: "Result saved" });
  } catch (err) {
    console.error("Error saving test result:", err);
    res.status(500).json({ message: "Server error while saving result" });
  }
});

// ---------- 4) Get Student Profile (populate primarySkillId safely) ----------
router.get("/profile", authMiddleware, async (req, res) => {
  try {
    // NOTE: strictPopulate:false avoids crashes if the schema ever changes
    const user = await User.findById(req.user.id)
      .select("-password")
      .populate({
        path: "primarySkillId",
        select: "name",
        options: { strictPopulate: false },
      });

    if (!user) return res.status(404).json({ message: "User not found" });

    // Only students get studentId; if missing, create once (backfill)
    if (user.role === "student" && !user.studentId) {
      try {
        user.studentId = await generateUniqueStudentId();
        await user.save();
      } catch (e) {
        // ignore rare collision; return current doc regardless
      }
    }

    res.json(user.toObject ? user.toObject() : user);
  } catch (err) {
    console.error("Profile fetch error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// ---------- 5) Update Student Profile (normalize university) ----------
const normalize = (s = "") => s.toLowerCase().replace(/[^a-z0-9]/g, "");

router.post(
  "/profile/update",
  authMiddleware,
  upload.single("resume"),
  async (req, res) => {
    try {
      const user = await User.findById(req.user.id);
      if (!user) return res.status(404).json({ message: "User not found" });

      const name = (req.body.name || "").trim();
      const email = (req.body.email || "").trim().toLowerCase();
      const phone = (req.body.phone || "").trim();
      const university = (req.body.university || "").trim();
      const education = (req.body.education || user.education);
      const skills = (req.body.skills || "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

      const primarySkillIdRaw = (req.body.primarySkillId || "").trim();
      let primarySkillId = null;
      let primarySkillName = user.primarySkillName || "";
      if (primarySkillIdRaw && mongoose.isValidObjectId(primarySkillIdRaw)) {
        const s = await Skill.findById(primarySkillIdRaw).select("name");
        if (s) {
          primarySkillId = s._id;
          primarySkillName = s.name;
        }
      }

      if (name) user.name = name;
      if (email) user.email = email;
      if (phone) user.phone = phone;
      if (university) {
        user.university = university;
        user.universityNorm = normalize(university);
      }
      if (education) user.education = education;
      if (skills.length) user.skills = skills;

      if (primarySkillId) user.primarySkillId = primarySkillId;
      if (primarySkillName) user.primarySkillName = primarySkillName;

      // DO NOT allow editing studentId; ensure it exists for students
      if (user.role === "student" && !user.studentId) {
        try {
          user.studentId = await generateUniqueStudentId();
        } catch (e) {
          // ignore
        }
      }

      if (req.file) user.resumeUrl = `/uploads/resumes/${req.file.filename}`;

      await user.save();

      const fresh = await User.findById(user._id)
        .select("-password")
        .populate({
          path: "primarySkillId",
          select: "name",
          options: { strictPopulate: false },
        })
        .lean();

      res.json({ success: true, message: "Profile updated", user: fresh });
    } catch (err) {
      console.error("Profile update error:", err);
      res.status(500).json({ message: "Update failed" });
    }
  }
);

module.exports = router;
