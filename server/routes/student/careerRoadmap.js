// routes/student/careerRoadmap.js
const express = require("express");
const router = express.Router();
const auth = require("../../middleware/auth");
const { chat } = require("../../services/aiClient");
const User = require("../../models/User");

router.get("/career-roadmap", auth, async (req, res) => {
  try {
    if (req.user.role !== "student") return res.status(403).json({ message: "Students only" });

    const student = await User.findById(req.user.id)
      .select("university education skills")
      .lean();

    const latestScores = (student?.skills || []).map((s) => ({ skill: String(s), avg: 6 }));

    const sys = "You are a career coach. Return JSON only. No prose.";
    const user = `
Student:
- University: ${student?.university || "-"}
- Education: ${student?.education || "-"}
- Skills: ${(student?.skills || []).join(", ")}

Skill Averages (0-10):
${latestScores.map(s => `${s.skill}:${s.avg}`).join(", ")}

Produce a JSON object mapping skill name -> 4-6 steps.
Step fields: { "level":"Foundation|Practice|Project|Interview", "title":string, "description"?:string, "topics"?:string[], "resources"?: [{ "title": string, "link": string }] }.
Prefer weakest skills first. Keep titles concise.
`.trim();

    let raw = "";
    try {
      raw = await chat({
        system: sys,
        messages: [{ role: "user", content: user }],
        temperature: 0.2,
      });
    } catch (e) {
      // fallback tiny default
      raw = "{}";
    }

    let roadmap = {};
    try { roadmap = JSON.parse(raw); } catch { roadmap = {}; }

    if (!Object.keys(roadmap).length) {
      const main = latestScores[0]?.skill || "Core Skill";
      roadmap[main] = [
        { level: "Foundation", title: `Basics of ${main}`, topics: ["syntax", "tooling"], resources: [] },
        { level: "Practice",   title: `10 practice tasks in ${main}`, topics: ["arrays", "apis"], resources: [] },
        { level: "Project",    title: `Mini-project using ${main}`, resources: [] },
        { level: "Interview",  title: `Top interview Q&A for ${main}`, resources: [] },
      ];
    }

    res.json({ roadmap });
  } catch (e) {
    console.error("career-roadmap failed:", e);
    res.status(500).json({ message: "Career roadmap failed" });
  }
});

module.exports = router;
