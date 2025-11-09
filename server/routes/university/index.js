// server/routes/university/index.js
const router = require("express").Router();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const auth = require("../../middleware/auth");
const University = require("../../models/University");
const User = require("../../models/User");
const SkillTestResult = require("../../models/SkillTestResult");
const Application = require("../../models/Application");
const UniversityStudentMeta = require("../../models/UniversityStudentMeta");
const Collaboration = require("../../models/Collaboration");
const CompanyProfile = require("../../models/CompanyProfile");

const { generateGuidance } = require("../../utils/ai"); 

/* --------------------------------- helpers -------------------------------- */
const normalizeUniName =
  (User && User.normalizeUniName) ||
  ((s = "") => String(s).toLowerCase().replace(/[^a-z0-9]/g, ""));

function signJwt(user) {
  const secret = process.env.JWT_SECRET || "dev_secret_change_me";
  const payload = { id: user._id, role: user.role };
  return jwt.sign(payload, secret, { expiresIn: "7d" });
}

async function resolveUniNorm(username) {
  // First try via User (role marker)
  let uniUser = await User.findOne({ username, role: "university" }).lean();
  let uniName = "";
  if (uniUser) {
    uniName = uniUser.university || uniUser.name || "";
  } else {
    // Fallback: from University model (source of truth)
    const uni = await University.findOne({ username }).lean();
    if (!uni) return null;
    uniUser = await User.findById(uni.user).lean();
    if (!uniUser) return null;
    uniName = uni.name || uniUser.university || uniUser.name || "";
  }
  const uniNorm = normalizeUniName(uniName);
  return { uniUser, uniNorm, uniName };
}

/* ----------------- UNIVERSITY LOGIN (creds in University model) ----------------- */
/**
 * POST /api/university/login
 * Body: { identifier, password }
 * identifier can be University.username (normalized) OR University.contactEmail
 * Password is verified against University.passwordHash
 * JWT is signed using the linked User (role='university')
 */
router.post("/login", async (req, res) => {
  try {
    const { identifier, password } = req.body || {};
    if (!identifier || !password) {
      return res.status(400).json({ message: "identifier and password are required" });
    }

    const idStr = String(identifier).trim();
    const idLower = idStr.toLowerCase();

    // try username (normalized letters/digits) OR contactEmail
    const maybeUsername = normalizeUniName(idStr);
    let uni =
      (await University.findOne({ username: maybeUsername }).lean()) ||
      (await University.findOne({ contactEmail: idLower }).lean());

    if (!uni || !uni.passwordHash) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const ok = await bcrypt.compare(String(password), String(uni.passwordHash));
    if (!ok) return res.status(400).json({ message: "Invalid credentials" });

    const uniUser = await User.findById(uni.user).lean();
    if (!uniUser || uniUser.role !== "university") {
      return res.status(500).json({ message: "Linked university account is misconfigured" });
    }

    const token = signJwt(uniUser);
    return res.json({
      token,
      user: {
        id: uniUser._id,
        role: uniUser.role,
        username: uni.username,
        name: uni.name,
        email: uni.contactEmail,
        phone: uni.contactPhone,
      },
      university: { username: uni.username, name: uni.name },
    });
  } catch (e) {
    console.error("university/login error:", e);
    res.status(500).json({ message: "Login failed" });
  }
});

/* --------------------------- WHO AM I (university) -------------------------- */
/**
 * GET /api/university/me
 * Return username/name for the authed university account
 */
router.get("/me", auth, async (req, res) => {
  try {
    if (!req.user || req.user.role !== "university") {
      return res.status(403).json({ message: "Forbidden" });
    }
    const uni = await University.findOne({ user: req.user.id })
      .select("username name contactEmail contactPhone")
      .lean();
    if (!uni) return res.status(404).json({ message: "University not found" });

    res.json({
      username: uni.username,
      name: uni.name,
      email: uni.contactEmail,
      phone: uni.contactPhone,
      role: "university",
    });
  } catch (e) {
    console.error("university/me error:", e);
    res.status(500).json({ message: "Failed to resolve account" });
  }
});

/* --------------------------------- REGISTER -------------------------------- */
/**
 * POST /api/university/register
 * Body: { universityName, email, phone, password, website?, accreditationId?, address?, departments?, placementOfficer? }
 * Creates both: User(role='university') and University docs; credentials stored in University.passwordHash.
 */
router.post("/register", async (req, res) => {
  try {
    const {
      universityName,
      email,
      phone,
      password,
      website = "",
      accreditationId = "",
      address = {},
      departments = [],
      placementOfficer = {},
    } = req.body || {};

    if (!universityName || !email || !phone || !password) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // make shared unique username (letters/digits only)
    let base = normalizeUniName(universityName);
    if (base.length < 4) base = `${base}uni`;
    let username = base;
    let i = 0;
    // ensure no conflict in User
    while (await User.findOne({ username })) {
      i += 1;
      username = `${base}${i}`;
    }

    const hashed = await bcrypt.hash(String(password), 10);

    // identity row
    const user = await User.create({
      name: universityName,
      username,
      email: String(email).toLowerCase(),
      password: hashed, // kept for compatibility only
      phone,
      role: "university",
      university: universityName,
      universityNorm: normalizeUniName(universityName),
    });

    // credentials live here
    const uni = await University.create({
      user: user._id,
      username,
      name: universityName,
      nameNorm: normalizeUniName(universityName),
      passwordHash: hashed,
      website,
      accreditationId,
      contactEmail: user.email,
      contactPhone: user.phone,
      address,
      departments,
      placementOfficer,
    });

    const token = signJwt(user);

    res.json({
      token,
      user: {
        id: user._id,
        role: user.role,
        username: uni.username,
        name: uni.name,
        email: uni.contactEmail,
        phone: uni.contactPhone,
      },
      university: { username: uni.username, name: uni.name },
    });
  } catch (e) {
    console.error("university/register error:", e);
    res.status(500).json({ message: "Registration failed" });
  }
});

/* --------------------------------- PROFILE --------------------------------- */
/** GET /api/university/profile/:username */
router.get("/profile/:username", async (req, res) => {
  try {
    const uni = await University.findOne({ username: req.params.username }).lean();
    if (!uni) return res.status(404).json({ message: "University not found" });

    res.json({
      userId: uni.user,
      username: uni.username,
      name: uni.name,
      website: uni.website || "",
      accreditationId: uni.accreditationId || "",
      contactEmail: uni.contactEmail || "",
      contactPhone: uni.contactPhone || "",
      address: uni.address || {},
      departments: uni.departments || [],
      placementOfficer: uni.placementOfficer || {},
    });
  } catch (e) {
    console.error("profile load error:", e);
    res.status(500).json({ message: "Failed to load profile" });
  }
});

/** POST /api/university/profile  (upsert) */
router.post("/profile", async (req, res) => {
  try {
    const body = req.body || {};
    if (!body.userId) return res.status(400).json({ message: "userId required" });

    const user = await User.findById(body.userId);
    if (!user) return res.status(404).json({ message: "User not found" });
    if (user.role !== "university") return res.status(403).json({ message: "Not a university account" });

    // ensure username uniqueness across both collections if changing
    if (body.username && body.username !== user.username) {
      const existsUser = await User.findOne({ username: body.username });
      const existsUni = await University.findOne({ username: body.username });
      if (existsUser || existsUni) {
        return res.status(409).json({ message: "Username is already taken." });
      }
    }

    // mirror minimal fields on User
    const userSet = {};
    if (body.username) userSet.username = body.username;
    if (body.name) {
      userSet.name = body.name;
      userSet.university = body.name;
      userSet.universityNorm = normalizeUniName(body.name);
    }
    if (body.contactEmail) userSet.email = String(body.contactEmail).toLowerCase();
    if (body.contactPhone) userSet.phone = body.contactPhone;
    if (Object.keys(userSet).length) {
      await User.updateOne({ _id: user._id }, { $set: userSet });
    }

    const uni = await University.findOneAndUpdate(
      { user: user._id },
      {
        user: user._id,
        username: body.username || user.username,
        name: body.name || user.name,
        nameNorm: normalizeUniName(body.name || user.name),
        website: body.website || "",
        accreditationId: body.accreditationId || "",
        contactEmail: body.contactEmail || user.email,
        contactPhone: body.contactPhone || user.phone,
        address: body.address || {},
        departments: Array.isArray(body.departments) ? body.departments : [],
        placementOfficer: body.placementOfficer || {},
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    res.json({
      userId: user._id,
      username: uni.username,
      name: uni.name,
      website: uni.website,
      accreditationId: uni.accredititationId || uni.accreditationId || "",
      contactEmail: uni.contactEmail,
      contactPhone: uni.contactPhone,
      address: uni.address,
      departments: uni.departments,
      placementOfficer: uni.placementOfficer,
    });
  } catch (e) {
    console.error("profile upsert error:", e);
    res.status(500).json({ message: "Unable to save" });
  }
});

/* --------------------------------- OVERVIEW -------------------------------- */
router.get("/:username/overview", auth, async (req, res) => {
  try {
    const r = await resolveUniNorm(req.params.username);
    if (!r) return res.status(404).json({ message: "University not found" });

    const { uniNorm } = r;

    const totalStudents = await User.countDocuments({
      role: "student",
      universityNorm: uniNorm,
    }).catch(() => 0);

    let averageTestPct = 0;
    let activeInternships = 0;
    let industryPartners = 0;
    let placementRate = 0;

    const results = await SkillTestResult.find({})
      .populate("user", "role universityNorm")
      .lean()
      .catch(() => []);
    const uniResults = (results || []).filter(
      (x) => x.user?.role === "student" && x.user?.universityNorm === uniNorm
    );
    if (uniResults.length) {
      const total = uniResults.reduce((acc, r) => acc + (r.total || 0), 0);
      const score = uniResults.reduce((acc, r) => acc + (r.score || 0), 0);
      averageTestPct = total ? Math.round((score / total) * 100) : 0;
    }

    let apps = [];
    try {
      apps = await Application.find({})
        .populate("student", "role universityNorm")
        .lean();
    } catch {}

    const uniApps = (apps || []).filter(
      (a) => a.student?.role === "student" && a.student?.universityNorm === uniNorm
    );
    activeInternships = uniApps.filter((a) =>
      (a.status || "").toLowerCase().includes("intern")
    ).length;
    const placed = uniApps.filter(
      (a) => (a.status || "").toLowerCase() === "hired"
    ).length;
    placementRate = totalStudents ? Math.round((placed / totalStudents) * 100) : 0;

    const partnerSet = new Set(uniApps.map((a) => a.company).filter(Boolean));
    industryPartners = partnerSet.size;

    const trend = [
      { month: "Jan", placed: Math.round(placed * 0.1), internships: Math.round(activeInternships * 0.1) },
      { month: "Feb", placed: Math.round(placed * 0.2), internships: Math.round(activeInternships * 0.2) },
      { month: "Mar", placed: Math.round(placed * 0.3), internships: Math.round(activeInternships * 0.3) },
      { month: "Apr", placed: Math.round(placed * 0.5), internships: Math.round(activeInternships * 0.5) },
      { month: "May", placed: Math.round(placed * 0.7), internships: Math.round(activeInternships * 0.7) },
      { month: "Jun", placed, internships: activeInternships },
    ];

    res.json({
      kpis: {
        totalStudents,
        placementRate,
        activeInternships,
        industryPartners,
        averageTestPct,
        internshipToStudent: totalStudents
          ? +((activeInternships / totalStudents) * 100).toFixed(0)
          : 0,
      },
      trend,
    });
  } catch (e) {
    console.error("overview error:", e?.message);
    res.json({
      kpis: {
        totalStudents: 0,
        placementRate: 0,
        activeInternships: 0,
        industryPartners: 0,
        averageTestPct: 0,
        internshipToStudent: 0,
      },
      trend: [],
    });
  }
});

/* --------------------------- ADVANCED ANALYTICS ---------------------------- */
router.get("/:username/advanced", auth, async (req, res) => {
  try {
    const r = await resolveUniNorm(req.params.username);
    if (!r) return res.status(404).json({ bySkill: [], edu: [], skillCloud: [], monthlyPlacements: [] });
    const { uniNorm } = r;

    const students = await User.find({
      role: "student",
      $or: [
        { universityNorm: uniNorm },
        { university: new RegExp(`^${r.uniName}$`, "i") }, // legacy fallback
      ],
    })
      .select("_id education skills primarySkillName")
      .lean();

    const studentIds = students.map((s) => s._id);

    const results = await SkillTestResult.find({ user: { $in: studentIds } })
      .populate("skill", "name")
      .lean();

    const skillMap = new Map();
    for (const row of results) {
      const key = row.skill?.name || "Unknown";
      const pct = row.total ? (row.score / row.total) * 100 : 0;
      const prev = skillMap.get(key) || { sum: 0, n: 0 };
      prev.sum += pct;
      prev.n += 1;
      skillMap.set(key, prev);
    }
    const bySkill = Array.from(skillMap.entries())
      .map(([skill, { sum, n }]) => ({ skill, avg: Math.round(sum / Math.max(1, n)), attempts: n }))
      .sort((a, b) => b.avg - a.avg)
      .slice(0, 10);

    const eduMap = new Map();
    for (const s of students) {
      const k = s.education || "Other";
      eduMap.set(k, (eduMap.get(k) || 0) + 1);
    }
    const edu = Array.from(eduMap.entries()).map(([education, count]) => ({ education, count }));

    const cloudMap = new Map();
    for (const s of students) {
      const skills = Array.isArray(s.skills) ? s.skills : [];
      const ps = s.primarySkillName ? [s.primarySkillName] : [];
      for (const nm of [...skills, ...ps]) {
        const k = String(nm || "").trim();
        if (!k) continue;
        cloudMap.set(k, (cloudMap.get(k) || 0) + 1);
      }
    }
    const skillCloud = Array.from(cloudMap.entries())
      .map(([skill, count]) => ({ skill, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 30);

    // Optional: placements by month using Application if available
    let monthlyPlacements = [];
    try {
      const apps = await Application.find({}).lean();
      const filt = apps.filter(a => studentIds.some(id => String(id) === String(a.student)));
      const monthMap = new Map();
      for (const a of filt) {
        const m = (a.createdAt ? new Date(a.createdAt) : new Date());
        const key = `${m.getFullYear()}-${String(m.getMonth() + 1).padStart(2, "0")}`;
        const prev = monthMap.get(key) || { placed: 0 };
        if ((a.status || "").toLowerCase() === "hired") prev.placed += 1;
        monthMap.set(key, prev);
      }
      monthlyPlacements = Array.from(monthMap.entries()).sort(([a],[b]) => a > b ? 1 : -1).map(([k, v]) => ({ _id: k, placed: v.placed }));
    } catch {
      monthlyPlacements = [];
    }

    res.json({ bySkill, edu, skillCloud, monthlyPlacements });
  } catch (e) {
    console.error("advanced analytics error:", e);
    res.json({ bySkill: [], edu: [], skillCloud: [], monthlyPlacements: [] });
  }
});

/* ----------------------------- AI (optional) ------------------------------ */
router.get("/:username/ai/overview", auth, async (req, res) => {
  try {
    const r = await resolveUniNorm(req.params.username);
    if (!r) return res.status(404).json({ message: "University not found" });
    const { uniNorm } = r;

    const students = await User.find({ role: "student", universityNorm: uniNorm })
      .select("_id name email skills primarySkillName")
      .lean();

    const results = await SkillTestResult.find({ user: { $in: students.map(s => s._id) } })
      .populate("skill", "name")
      .lean();

    const total = results.reduce((a, x) => a + (x.total || 0), 0);
    const score = results.reduce((a, x) => a + (x.score || 0), 0);
    const avgTestPct = total ? Math.round((score / total) * 100) : null;

    const seededResources = [
      { title: "DSA Patterns", url: "https://cp-algorithms.com/" },
      { title: "System Design Primer", url: "https://github.com/donnemartin/system-design-primer" },
      { title: "REST Best Practices", url: "https://restfulapi.net/" },
      { title: "Frontend Interview Handbook", url: "https://frontendinterviewhandbook.com/" },
      { title: "Backend Roadmap", url: "https://roadmap.sh/backend" },
    ];

    const { payload } = await generateGuidance({
      resumeText: "",
      skillName: "Full-stack development",
      avgTestPct,
      studyDonePct: 50,
      topMissingTopics: ["Testing", "Debugging", "System Design"],
      seededResources,
    });

    res.json({ ok: true, snapshot: { avgTestPct }, guidance: payload });
  } catch (e) {
    console.error("ai/overview error:", e);
    res.status(500).json({ ok: false, message: "AI overview failed" });
  }
});

router.get("/:username/ai/predict-placements", auth, async (req, res) => {
  try {
    const r = await resolveUniNorm(req.params.username);
    if (!r) return res.status(404).json({ message: "University not found" });

    const students = await User.find({ role: "student", universityNorm: r.uniNorm })
      .select("_id name email")
      .lean();

    const results = await SkillTestResult.find({ user: { $in: students.map(s => s._id) } })
      .sort({ createdAt: -1 })
      .populate("skill", "name")
      .lean();

    const lastPct = new Map();
    for (const row of results) {
      const sid = String(row.user);
      if (!lastPct.has(sid)) {
        const pct = row.total ? (row.score / row.total) * 100 : 0;
        lastPct.set(sid, Math.round(pct));
      }
    }

    const scored = students.map(s => ({
      id: String(s._id),
      name: s.name,
      email: s.email,
      score: lastPct.get(String(s._id)) ?? 0,
      probability: Math.min(0.98, Math.max(0.02, ((lastPct.get(String(s._id)) ?? 0) / 100) * 0.8 + 0.1)),
    }));

    const predictedPlacementRate = Math.round(
      (scored.reduce((a, b) => a + b.probability, 0) / Math.max(1, scored.length)) * 100
    );
    const topCandidates = scored.sort((a, b) => b.probability - a.probability).slice(0, 15);

    res.json({ predictedPlacementRate, topCandidates });
  } catch (e) {
    console.error("ai/predict-placements error:", e);
    res.status(500).json({ message: "Prediction failed" });
  }
});

/* ------------------------------- STUDENTS ---------------------------------- */
router.get("/:username/students", auth, async (req, res) => {
  try {
    const r = await resolveUniNorm(req.params.username);
    if (!r) return res.status(404).json({ message: "University not found" });
    const { uniNorm } = r;

    // fetch all students and filter by normalized university name
    const rowsAll = await User.find({ role: "student" })
      .select("_id name username email phone university universityNorm education skills primarySkillName resumeUrl createdAt studentId")
      .lean()
      .catch(() => []);

    const rows = rowsAll.filter((s) => {
      if (s.universityNorm) return s.universityNorm === uniNorm;
      return normalizeUniName(s.university || "") === uniNorm;
    });

    res.json(rows);
  } catch (e) {
    console.error("students error:", e?.message);
    res.json([]);
  }
});

/* --------------------------- STUDENT META (U↔S) --------------------------- */
router.get("/:username/students/:studentId/meta", auth, async (req, res) => {
  try {
    const uniUser = await User.findOne({ username: req.params.username, role: "university" }).lean();
    if (!uniUser) return res.status(404).json({ message: "University not found" });
    const uni = await University.findOne({ user: uniUser._id }).lean();
    if (!uni) return res.status(404).json({ message: "University profile missing" });

    const doc = await UniversityStudentMeta.findOne({ university: uni._id, student: req.params.studentId }).lean();
    res.json(doc || { labels: [], notes: [], status: "active" });
  } catch (e) {
    console.error("get meta error:", e);
    res.json({ labels: [], notes: [], status: "active" });
  }
});

// Search students for this university (name/email/StudentID)
router.get("/:username/students/search", auth, async (req, res) => {
  try {
    const uniUser = await User.findOne({ username: req.params.username, role: "university" }).lean();
    if (!uniUser) return res.status(404).json({ message: "University not found" });

    const uni = await University.findOne({ user: uniUser._id }).lean();
    if (!uni) return res.status(404).json({ message: "University profile missing" });

    // only that uni can query its students
    if (String(req.user.role) !== "university" || String(req.user.id) !== String(uniUser._id)) {
      return res.status(403).json({ message: "Forbidden" });
    }

    const q = String(req.query.q || "").trim().toLowerCase();
    const uniNorm = normalizeUniName(uni.name || "");
    const students = await User.find({ role: "student", universityNorm: uniNorm })
      .select("_id name email studentId university")
      .lean();

    const filtered = students.filter((s) => {
      const blob = [s.name || "", s.email || "", s.studentId || ""].join(" ").toLowerCase();
      return !q || blob.includes(q);
    });

    res.json(filtered.slice(0, 50));
  } catch (e) {
    console.error("university/:username/students/search error:", e);
    res.json([]);
  }
});

router.post("/:username/students/:studentId/meta", auth, async (req, res) => {
  try {
    const uniUser = await User.findOne({ username: req.params.username, role: "university" }).lean();
    if (!uniUser) return res.status(404).json({ message: "University not found" });
    const uni = await University.findOne({ user: uniUser._id }).lean();
    if (!uni) return res.status(404).json({ message: "University profile missing" });

    const { labels = [], note = "", status = "active" } = req.body || {};
    const update = {
      $set: { status, labels: Array.isArray(labels) ? labels : [] },
      ...(note ? { $push: { notes: { text: String(note), at: new Date() } } } : {}),
    };

    const doc = await UniversityStudentMeta.findOneAndUpdate(
      { university: uni._id, student: req.params.studentId },
      update,
      { upsert: true, new: true, setDefaultsOnInsert: true }
    ).lean();

    res.json(doc);
  } catch (e) {
    console.error("save meta error:", e);
    res.status(500).json({ message: "Could not save meta" });
  }
});

/* ------------------------------ PLACEMENTS --------------------------------- */
router.get("/:username/placements", auth, async (req, res) => {
  try {
    const r = await resolveUniNorm(req.params.username);
    if (!r) return res.status(404).json({ message: "University not found" });

    let rows = [];
    try {
      rows = await Application.find({}).populate("student", "role universityNorm name").lean();
    } catch {}

    const filtered = rows.filter(
      (a) => a.student?.role === "student" && a.student?.universityNorm === r.uniNorm
    );
    res.json(
      filtered.map((a) => ({
        id: String(a._id),
        student: a.student?.name || "",
        company: a.company || "",
        role: a.role || "",
        status: a.status || "",
        createdAt: a.createdAt,
      }))
    );
  } catch (e) {
    console.error("placements error:", e?.message);
    res.json([]);
  }
});

router.get("/:username/top-students", auth, async (req, res) => {
  try {
    const r = await resolveUniNorm(req.params.username);
    if (!r) return res.status(404).json({ message: "University not found" });

    const results = await SkillTestResult.find({})
      .populate("user", "role universityNorm name")
      .populate("skill", "name")
      .lean()
      .catch(() => []);

    const uniResults =
      (results || []).filter(
        (x) => x.user?.role === "student" && x.user?.universityNorm === r.uniNorm
      ) || [];

    const map = new Map();
    uniResults.forEach((x) => {
      const key = String(x.user?._id);
      const pct = x.total ? (x.score / x.total) * 100 : 0;
      const entry =
        map.get(key) || { id: key, name: x.user?.name || "", topPct: 0, skill: x.skill?.name || "" };
      if (pct > entry.topPct) {
        entry.topPct = Math.round(pct);
        entry.skill = x.skill?.name || entry.skill;
      }
      map.set(key, entry);
    });

    const top = Array.from(map.values()).sort((a, b) => b.topPct - a.topPct).slice(0, 12);
    res.json(top);
  } catch (e) {
    console.error("top-students error:", e?.message);
    res.json([]);
  }
});

/* -------------------------- placeholders (optional) ------------------------ */
router.get("/:username/collaborations", auth, async (req, res) => {
  try {
    // any authed user may read (UI shows to university admins)
    const uniUser = await User.findOne({ username: req.params.username, role: "university" }).lean();
    if (!uniUser) return res.json([]);

    const uni = await University.findOne({ user: uniUser._id }).lean();
    if (!uni) return res.json([]);

    const items = await Collaboration.find({ university: uni._id })
      .sort({ createdAt: -1 })
      .lean();

    res.json(
      items.map((m) => ({
        id: String(m._id),
        title: m.title,
        company: m.companyName || "—",
        funding: m.funding || 0,
        status: m.status,
        details: m.details || "",
        createdAt: m.createdAt,
        updatedAt: m.updatedAt,
      }))
    );
  } catch (e) {
    console.error("university collaborations list error:", e);
    res.json([]);
  }
});

router.post("/:username/collaborations", auth, async (req, res) => {
  try {
    // Only the university owner can create for their university
    const uniUser = await User.findOne({ username: req.params.username, role: "university" }).lean();
    if (!uniUser) return res.status(404).json({ message: "University not found" });
    if (String(req.user.role) !== "university" || String(req.user.id) !== String(uniUser._id)) {
      return res.status(403).json({ message: "Forbidden" });
    }

    const uni = await University.findOne({ user: uniUser._id }).lean();
    if (!uni) return res.status(404).json({ message: "University profile missing" });

    const { company = "", title = "", funding = 0, details = "" } = req.body || {};
    if (!title.trim()) return res.status(400).json({ message: "Title is required" });

    // Try to resolve company profile by name (best-effort)
    const companyProfile = await CompanyProfile.findOne({ name: new RegExp(`^${company}$`, "i") }).lean();

    const doc = await Collaboration.create({
      university: uni._id,
      universityName: uni.name || "",
      company: companyProfile?._id || null,
      companyName: company || companyProfile?.name || "",
      title: title.trim(),
      funding: Number(funding || 0),
      details: details || "",
      status: "Proposal",
      createdBy: "university",
    });

    res.json({
      id: String(doc._id),
      title: doc.title,
      company: doc.companyName,
      funding: doc.funding,
      status: doc.status,
      details: doc.details,
      createdAt: doc.createdAt,
    });
  } catch (e) {
    console.error("university collaborations create error:", e);
    res.status(500).json({ message: "Could not create collaboration" });
  }
});
router.get("/:username/validation/pending", auth, async (_req, res) => res.json([]));
router.post("/:username/validation/:id/endorse", auth, async (_req, res) => res.json({ ok: true }));
router.get("/:username/recommendations", auth, async (_req, res) => res.json([]));
router.get("/:username/webinars", auth, async (_req, res) => res.json([]));
router.post("/:username/webinars", auth, async (req, res) => res.json({ id: Date.now().toString(), ...req.body }));

module.exports = router;
