// server/utils/ai.js
const fetch = (...a) => import("node-fetch").then(({ default: f }) => f(...a));
const crypto = require("crypto");

/* ------------------------------------------------------------------ */
/*                       INTERNAL HELPER UTILITIES                    */
/* ------------------------------------------------------------------ */

const clamp = (v, min = 0, max = 100) => Math.max(min, Math.min(max, v));

/** Deterministic short id (useful for certs/predictions) */
function deterministicId(input) {
  return crypto.createHash("sha256").update(String(input)).digest("hex").slice(0, 32);
}

/* ------------------------------------------------------------------ */
/*                    EXISTING GUIDANCE GENERATION                    */
/* ------------------------------------------------------------------ */

async function tryProvider(prompt, { timeoutMs = 12000 } = {}) {
  try {
    const url =
      process.env.INTERNAL_AI_URL ||
      `http://localhost:${process.env.PORT || 5000}/api/ai/generate`;

    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), timeoutMs);

    const r = await fetch(url, {
      method: "POST",
      body: JSON.stringify({ prompt }),
      headers: { "Content-Type": "application/json" },
      signal: ctrl.signal,
    });
    clearTimeout(t);

    if (!r.ok) throw new Error(`AI gateway responded ${r.status}`);
    const data = await r.json();
    const text = data?.text || data?.content || data?.result;
    if (!text) throw new Error("Empty AI text");
    return { ok: true, text };
  } catch (e) {
    return { ok: false, error: e?.message || "AI provider failed" };
  }
}

function fallbackCompose({
  resumeText = "",
  skillName = "",
  avgTestPct = null,
  studyDonePct = 0,
  topMissingTopics = [],
  seededResources = [],
}) {
  const lower = (s) => (s || "").toLowerCase();
  const has = (kw) =>
    lower(resumeText).includes(lower(kw)) || lower(skillName).includes(lower(kw));

  const strengths = [];
  const gaps = [];

  if (has("project") || has("internship")) strengths.push("Hands-on exposure through projects/internships");
  if (has("react") || has("node") || has("python") || has("java")) strengths.push("Practical programming experience");
  if (has("communication") || has("presentation")) strengths.push("Communication & presentation skills");
  if (avgTestPct !== null && avgTestPct >= 70) strengths.push("Solid performance on recent assessments");

  if (avgTestPct === null || avgTestPct < 70) gaps.push("Strengthen fundamentals with targeted practice");
  if (studyDonePct < 40) gaps.push("Increase consistency and complete more study items weekly");
  if (!has("testing") && ["web", "frontend", "backend"].some(has)) gaps.push("Software testing & debugging workflows");
  if (!has("system design") && (has("backend") || has("full stack"))) gaps.push("System design basics (scalability, reliability)");

  const suggestedTopics = [
    ...topMissingTopics.slice(0, 5),
    ...(has("data") ? [] : ["Data Structures & Algorithms – core patterns"]),
    ...(has("apis") ? [] : ["REST & API design (auth, pagination, rate limits)"]),
  ].filter(Boolean);

  const keywords = [skillName, "problem solving", "teamwork", "version control", "debugging", "testing"];

  const projects = [
    {
      title: `${skillName} Portfolio Project`,
      description: `Build a public, polished project demonstrating core ${skillName} competencies.`,
      outline: [
        "Define scope & features tied to job descriptions",
        "Implement clean architecture; write tests",
        "Write a README with screenshots and setup instructions",
      ],
    },
  ];

  const weeklyPlan = Array.from({ length: 7 }).map((_, i) => ({
    day: `Day ${i + 1}`,
    focus: i < 3 ? "Fundamentals & practice" : i < 5 ? "Build & apply" : "Review & reflect",
    tasks:
      i < 3
        ? ["Study 2 concept notes", "Solve 3–5 practice questions", "Summarize learnings"]
        : i < 5
        ? ["Add one feature to your project", "Refactor & write tests", "Share progress log"]
        : ["Revisit weak topics", "Create flashcards", "Plan next week’s goals"],
    resources: (seededResources || [])
      .slice(i * 2, i * 2 + 2)
      .map((r) => ({ title: r.title, url: r.url })),
  }));

  return {
    strengths: strengths.length ? strengths : ["Motivated to upskill in " + skillName],
    gaps: gaps.length ? gaps : ["Identify and practice weaker subtopics systematically"],
    suggestedTopics: Array.from(new Set(suggestedTopics)).slice(0, 8),
    weeklyPlan,
    projects,
    keywords: Array.from(new Set(keywords)).slice(0, 10),
    notes: "Plan adapts weekly based on your test scores and completed study items.",
    snapshot: { avgTestPct, studyDonePct },
  };
}

async function generateGuidance({
  resumeText,
  skillName,
  avgTestPct,
  studyDonePct,
  topMissingTopics,
  seededResources,
}) {
  const prompt = `
You are a career mentor. Create a compact JSON guidance plan tailored to the user's resume and selected skill.

RESUME:
${resumeText?.slice(0, 4000) || "N/A"}

SKILL: ${skillName}

SNAPSHOT:
- Average test %: ${avgTestPct ?? "unknown"}
- Study completed %: ${studyDonePct}

MISSING TOPICS: ${Array.isArray(topMissingTopics) ? topMissingTopics.join(", ") : "N/A"}

RESOURCES (title,url):
${(seededResources || []).map(r => `- ${r.title} | ${r.url || ""}`).join("\n")}

Return valid JSON with:
{
  "strengths": string[],
  "gaps": string[],
  "suggestedTopics": string[],
  "weeklyPlan": [{ "day": "Day X", "focus": string, "tasks": string[], "resources": [{ "title": string, "url": string }] }],
  "projects": [{ "title": string, "description": string, "outline": string[] }],
  "keywords": string[],
  "notes": string
}
Do not include any commentary outside JSON.
`.trim();

  const tried = await tryProvider(prompt, { timeoutMs: 11000 });
  if (tried.ok) {
    try {
      const jsonStart = tried.text.indexOf("{");
      const jsonEnd = tried.text.lastIndexOf("}");
      const raw = tried.text.slice(jsonStart, jsonEnd + 1);
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === "object") {
        return {
          payload: {
            strengths: parsed.strengths || [],
            gaps: parsed.gaps || [],
            suggestedTopics: parsed.suggestedTopics || [],
            weeklyPlan: parsed.weeklyPlan || [],
            projects: parsed.projects || [],
            keywords: parsed.keywords || [],
            notes: parsed.notes || "",
            snapshot: { avgTestPct, studyDonePct },
          },
        };
      }
    } catch {
      // fall through to fallback
    }
  }

  const payload = fallbackCompose({
    resumeText,
    skillName,
    avgTestPct,
    studyDonePct,
    topMissingTopics,
    seededResources,
  });
  return { payload };
}

/* ------------------------------------------------------------------ */
/*              NEW: OVERVIEW & PREDICTIVE PLACEMENTS HELPERS         */
/* ------------------------------------------------------------------ */

function buildAiOverview({ students = [], results = [], placedCount = 0 }) {
  const totalStudents = students.length || 1;

  const byStudent = new Map();
  results.forEach(r => {
    const total = r.total || 0;
    const score = r.score || 0;
    const pct = total ? (score / total) * 100 : 0;
    const id = String(r.user?._id || r.user);
    const entry = byStudent.get(id) || { cnt: 0, sum: 0 };
    entry.cnt += 1;
    entry.sum += pct;
    byStudent.set(id, entry);
  });

  const avgs = Array.from(byStudent.values()).map(v => (v.cnt ? v.sum / v.cnt : 0));
  const cohortAvg = avgs.length ? avgs.reduce((a, b) => a + b, 0) / avgs.length : 0;

  const readinessIndex = clamp(Math.round(cohortAvg * 0.85 + (placedCount / totalStudents) * 100 * 0.15));
  const riskIndex = clamp(100 - readinessIndex);

  const skillCounts = new Map();
  students.forEach(s => {
    (s.skills || []).forEach(sk => {
      const k = String(sk || "").trim().toLowerCase();
      if (!k) return;
      skillCounts.set(k, (skillCounts.get(k) || 0) + 1);
    });
  });
  const topSkills = Array.from(skillCounts.entries())
    .map(([skill, count]) => ({ skill, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 20);

  return { readinessIndex, riskIndex, topSkills };
}

function predictPlacements({ students = [], results = [] }) {
  const avgMap = new Map();
  const countMap = new Map();

  results.forEach(r => {
    const total = r.total || 0;
    const score = r.score || 0;
    const pct = total ? (score / total) * 100 : 0;
    const id = String(r.user?._id || r.user);
    avgMap.set(id, (avgMap.get(id) || 0) + pct);
    countMap.set(id, (countMap.get(id) || 0) + 1);
  });

  const studentAvgs = students.map(s => {
    const id = String(s._id);
    const sum = avgMap.get(id) || 0;
    const cnt = countMap.get(id) || 0;
    const avgPct = cnt ? sum / cnt : 0;
    const bonus = s.primarySkillName ? 5 : 0;
    const base = clamp(Math.round(avgPct + bonus));
    return { studentId: id, name: s.name, primarySkillName: s.primarySkillName || "", base };
  });

  const ranked = studentAvgs
    .map(x => ({ ...x, probability: clamp(Math.round(x.base * 0.9 + 10)) }))
    .sort((a, b) => b.probability - a.probability)
    .slice(0, 50);

  const roleCounts = new Map();
  students.forEach(s => {
    (s.skills || []).forEach(sk => {
      const low = String(sk || "").toLowerCase();
      if (low.includes("react") || low.includes("frontend")) {
        roleCounts.set("Frontend Developer", (roleCounts.get("Frontend Developer") || 0) + 1);
      } else if (low.includes("node") || low.includes("backend")) {
        roleCounts.set("Backend Developer", (roleCounts.get("Backend Developer") || 0) + 1);
      } else if (low.includes("ml") || low.includes("data")) {
        roleCounts.set("Data/ML Engineer", (roleCounts.get("Data/ML Engineer") || 0) + 1);
      } else if (low.includes("android") || low.includes("kotlin") || low.includes("flutter")) {
        roleCounts.set("Mobile Developer", (roleCounts.get("Mobile Developer") || 0) + 1);
      } else if (low.includes("cloud") || low.includes("devops")) {
        roleCounts.set("Cloud/DevOps Engineer", (roleCounts.get("Cloud/DevOps Engineer") || 0) + 1);
      }
    });
  });

  const totalRole = Array.from(roleCounts.values()).reduce((a, b) => a + b, 0) || 1;
  const roles = Array.from(roleCounts.entries())
    .map(([role, c]) => ({ role, probability: clamp(Math.round((c / totalRole) * 100)) }))
    .sort((a, b) => b.probability - a.probability)
    .slice(0, 6);

  return { roles, matches: ranked };
}

/* ------------------------------------------------------------------ */
/*                               EXPORTS                              */
/* ------------------------------------------------------------------ */

module.exports = {
  generateGuidance,
  buildAiOverview,
  predictPlacements,
  deterministicId,
};
