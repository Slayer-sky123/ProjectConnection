// server/services/resumeAnalyzer.js
const { chat } = require("./aiClient");

function clamp(n, min = 0, max = 100) {
  const v = Math.max(min, Math.min(max, Number(n) || 0));
  return Math.round(v);
}
function safeJson(text) {
  try { return JSON.parse(text); } catch {
    const m = text.match(/\{[\s\S]*\}/);
    if (m) { try { return JSON.parse(m[0]); } catch {} }
    return null;
  }
}

/**
 * ATS-style analysis focused on the target job.
 * Prioritizes must-have skills, years, education & quantifiable evidence.
 */
async function analyzeResume({ resumeText, skills = [], job = null }) {
  const sys =
    "You are an ATS-style resume screener. Return JSON only. Be strict and job-requirement driven.";
  const mustSkills = (job?.skills || []).join(", ");
  const jobBlock = job
    ? `JobTitle: ${job.title || ""}
MustSkills: ${mustSkills}
JobDescription: ${(job.description || "").slice(0, 2000)}
`
    : "";

  const prompt = `
Given the resume text and job details, return compact JSON:

{
  "topSkills": ["skill1","skill2","skill3"],
  "experienceSummary": "1-3 lines. Include roles and impact.",
  "resumeScore": 0-100, // overall quality, structure, quant outcomes
  "fitScore": 0-100, // match against MustSkills and JobDescription
  "riskFlags": ["e.g. long gaps", "too generic", "no must-have skillX"],
  "recommendations": ["short, actionable bullets for candidate"],
  "education": "short line",
  "yearsExperience": number
}

Rules:
- FitScore must reflect explicit alignment to MustSkills and required experience.
- Penalize missing must-have skills and lack of quantifiable experience.
- ResumeScore is about clarity and evidence (metrics, outcomes).
- Keep arrays concise (≤6 items). Keep strings short.

${jobBlock}

DeclaredSkills: ${skills.join(", ")}

Resume:
"""${(resumeText || "").slice(0, 5000)}"""
`;

  const content = await chat({
    system: sys,
    messages: [{ role: "user", content: prompt }],
    temperature: 0.1,
  });
  if (!content) throw new Error("AI returned empty content");

  const parsed = safeJson(content) || {};
  return {
    topSkills: parsed.topSkills || [],
    experienceSummary: parsed.experienceSummary || "",
    resumeScore: clamp(parsed.resumeScore, 0, 100),
    fitScore: clamp(parsed.fitScore, 0, 100),
    riskFlags: parsed.riskFlags || [],
    recommendations: parsed.recommendations || [],
    education: parsed.education || "",
    yearsExperience: Number(parsed.yearsExperience || 0),
    raw: content,
  };
}

module.exports = { analyzeResume };
