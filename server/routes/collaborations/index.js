// server/routes/collaborations/index.js
const express = require("express");
const mongoose = require("mongoose");
const router = express.Router();

const auth = require("../../middleware/auth");
const CompanyProfile = require("../../models/CompanyProfile");
const University = require("../../models/University");
const Collaboration = require("../../models/Collaboration");

// -----------------------------
// Helpers
// -----------------------------
async function getPartyContext(userId) {
  // Company: your model sometimes has both `owner` and `user` – check both
  const companyProfile = await CompanyProfile.findOne({
    $or: [{ owner: userId }, { user: userId }],
  });
  if (companyProfile) return { role: "company", companyProfile };

  // University
  const university = await University.findOne({ user: userId });
  if (university) return { role: "university", university };

  return null;
}

function buildDefaultMoU({ title = "", companyName = "", universityName = "" } = {}) {
  return {
    overview: {
      title: title || `Industry–Academia Collaboration / MoU between ${companyName} and ${universityName}`,
      companyName,
      universityName,
      representatives: { company: "", university: "" },
      effectiveDate: new Date(),
      durationMonths: 36,
    },
    objectives: [
      "Bridge the industry–academia gap.",
      "Offer internships, live projects, and placement opportunities.",
      "Jointly develop curriculum and skill modules aligned to industry needs.",
      "Conduct AI-driven skill validation and career mapping through StudentConnect.",
      "Promote joint research, innovation projects, and hackathons.",
      "Enable faculty development programs (FDPs) and guest lectures.",
    ],
    scope: {
      company: [
        "Provide internship & placement opportunities.",
        "Conduct workshops, seminars, and webinars.",
        "Offer real-world project mentoring.",
        "Share latest industry skill trends via StudentConnect.",
        "Access university’s verified student talent pool for hiring.",
      ],
      university: [
        "Encourage student participation on StudentConnect.",
        "Nominate a University Coordinator for managing collaboration.",
        "Integrate soft and technical skills courses from CITC/StudentConnect.",
        "Facilitate infrastructure (labs/classrooms) for training sessions.",
      ],
      joint: [
        "Create annual collaboration calendars.",
        "Organize Industry-Connect events and Placement Drives.",
        "Share periodic reports on student performance and job readiness.",
      ],
    },
    benefits: [
      "Verified digital credentials and certificates.",
      "Internship & placement opportunities across partner companies.",
      "Access to AI-powered career roadmap and skill validation tests.",
      "Participation in live industry projects.",
      "Free/discounted career guidance sessions and webinars.",
    ],
    operations: {
      nodalOfficers: { company: "", university: "" },
      implementationMode: "StudentConnect portal (university + company dashboards)",
      meetingSchedule: "Quarterly review",
      reporting: "Monthly analytics on participation, tests, internships, and placements",
    },
    kpis: [
      { area: "Internship", deliverable: "No. of students trained or placed", outcome: "Minimum 20/year" },
      { area: "Skill Validation", deliverable: "Number of skills tested via portal", outcome: "200+ students per year" },
      { area: "Webinars", deliverable: "Industry lectures hosted", outcome: "5 per semester" },
      { area: "Research", deliverable: "Joint projects initiated", outcome: "At least 2 per year" },
    ],
    legal: {
      confidentiality: "Non-disclosure & confidentiality of shared data.",
      financialLiability: "No financial liability unless mutually agreed.",
      termRenewal: "Valid for 3 years, renewable by mutual consent.",
      termination: "Either party may terminate with 30-day notice.",
      jurisdiction: "Jurisdiction & dispute resolution as mutually agreed.",
    },
    signatures: {
      company: { name: "", signed: false },
      university: { name: "", signed: false },
    },
  };
}

async function ensureAccess(req, res, next) {
  try {
    const ctx = await getPartyContext(req.user.id);
    if (!ctx) return res.status(403).json({ message: "Forbidden" });

    const collab = await Collaboration.findById(req.params.id)
      .populate("company", "name _id")
      .populate("university", "name username _id");
    if (!collab) return res.status(404).json({ message: "Not found" });

    const collabCompanyId = String(collab.company?._id || collab.company);
    const collabUniversityId = String(collab.university?._id || collab.university);

    const ctxCompanyId = ctx.companyProfile ? String(ctx.companyProfile._id) : null;
    const ctxUniversityId = ctx.university ? String(ctx.university._id) : null;

    const belongsToCompany = ctx.role === "company" && ctxCompanyId === collabCompanyId;
    const belongsToUniversity = ctx.role === "university" && ctxUniversityId === collabUniversityId;

    if (!belongsToCompany && !belongsToUniversity) {
      return res.status(403).json({ message: "Forbidden" });
    }

    req.ctx = ctx;
    req.collab = collab;
    next();
  } catch (e) {
    next(e);
  }
}

// -----------------------------
// Routes
// -----------------------------

// List collaborations for current party
router.get("/list", auth, async (req, res, next) => {
  try {
    const ctx = await getPartyContext(req.user.id);
    if (!ctx) return res.json([]);

    let filter = {};
    if (ctx.role === "company") filter.company = ctx.companyProfile._id;
    if (ctx.role === "university") filter.university = ctx.university._id;

    const rows = await Collaboration.find(filter)
      .populate("company", "name")
      .populate("university", "name username")
      .sort({ updatedAt: -1 })
      .lean();

    res.json(rows);
  } catch (e) {
    next(e);
  }
});

// Start a collaboration
router.post("/start", auth, async (req, res, next) => {
  try {
    const ctx = await getPartyContext(req.user.id);
    if (!ctx) return res.status(403).json({ message: "Forbidden" });

    const { title = "", summary = "", counterpart = "" } = req.body;
    if (!title.trim()) return res.status(400).json({ message: "Title is required" });
    if (!counterpart.trim()) return res.status(400).json({ message: "Counterpart is required" });

    let companyProfileId, universityId, companyName = "", universityName = "";

    if (ctx.role === "company") {
      companyProfileId = ctx.companyProfile._id;
      companyName = ctx.companyProfile.name || "Company";

      const uni =
        (await University.findOne({ username: counterpart })) ||
        (await University.findOne({ contactEmail: counterpart })) ||
        (mongoose.isValidObjectId(counterpart) ? await University.findById(counterpart) : null);

      if (!uni) return res.status(404).json({ message: "University not found" });
      universityId = uni._id;
      universityName = uni.name || "University";
    } else {
      universityId = ctx.university._id;
      universityName = ctx.university.name || "University";

      const comp =
        (await CompanyProfile.findOne({ name: counterpart })) ||
        (mongoose.isValidObjectId(counterpart) ? await CompanyProfile.findById(counterpart) : null);

      if (!comp) return res.status(404).json({ message: "Company not found" });
      companyProfileId = comp._id;
      companyName = comp.name || "Company";
    }

    const collab = await Collaboration.create({
      title: title.trim(),
      summary: summary.trim(),
      company: companyProfileId,
      university: universityId,
      stage: "draft",
      mou: buildDefaultMoU({ title, companyName, universityName }),
      timeline: [
        { type: "created", by: ctx.role, at: new Date(), note: "Collaboration created" },
      ],
      messages: [
        {
          authorId: req.user.id,
          authorRole: ctx.role,
          authorName: "",
          text: "Collaboration started.",
          attachments: [],
        },
      ],
      board: { backlog: [], discussion: [], actions: [], approvals: [] },
    });

    const populated = await Collaboration.findById(collab._id)
      .populate("company", "name")
      .populate("university", "name username");

    res.status(201).json(populated);
  } catch (e) {
    next(e);
  }
});

// Get one
router.get("/:id", auth, ensureAccess, async (req, res) => {
  const c = req.collab;
  // Guarantee safe defaults for front-end
  const safe = c.toObject();
  safe.board = safe.board || { backlog: [], discussion: [], actions: [], approvals: [] };
  if (!safe.board.backlog) safe.board.backlog = [];
  if (!safe.board.discussion) safe.board.discussion = [];
  if (!safe.board.actions) safe.board.actions = [];
  if (!safe.board.approvals) safe.board.approvals = [];
  safe.messages = Array.isArray(safe.messages) ? safe.messages : [];
  safe.timeline = Array.isArray(safe.timeline) ? safe.timeline : [];
  safe.mou = safe.mou || buildDefaultMoU({ title: safe.title });
  if (!safe.mou.signatures) safe.mou.signatures = { company: { signed: false }, university: { signed: false } };
  res.json(safe);
});

// Patch meta (title, stage, or parts of MoU)
router.patch("/:id", auth, ensureAccess, async (req, res, next) => {
  try {
    const collab = req.collab;
    const ctx = req.ctx;
    const { title, stage, mou } = req.body;

    if (title !== undefined) collab.title = String(title).trim();
    if (stage !== undefined) {
      collab.stage = String(stage);
      collab.timeline.push({
        type: "stage",
        by: ctx.role,
        at: new Date(),
        note: `Stage → ${collab.stage}`,
      });
    }

    // Partial MoU merge with defaults
    if (mou && typeof mou === "object") {
      collab.mou = collab.mou || buildDefaultMoU({ title: collab.title });
      // Shallow merge
      for (const k of Object.keys(mou)) {
        if (typeof mou[k] === "object" && mou[k] !== null && !Array.isArray(mou[k])) {
          collab.mou[k] = { ...(collab.mou[k] || {}), ...mou[k] };
        } else {
          collab.mou[k] = mou[k];
        }
      }
      collab.timeline.push({
        type: "meta",
        by: ctx.role,
        at: new Date(),
        note: "MoU updated",
      });
      // Ensure signatures exist
      collab.mou.signatures = collab.mou.signatures || { company: { signed: false }, university: { signed: false } };
    }

    await collab.save();
    const saved = await Collaboration.findById(collab._id)
      .populate("company", "name")
      .populate("university", "name username");
    res.json(saved);
  } catch (e) {
    console.error(e);
    next(e);
  }
});

// Messages (chat)
router.post("/:id/messages", auth, ensureAccess, async (req, res, next) => {
  try {
    const collab = req.collab;
    const ctx = req.ctx;
    const { text = "", attachments = [] } = req.body;

    collab.messages.push({
      authorId: req.user.id,
      authorRole: ctx.role,
      authorName: "",
      text: String(text || ""),
      attachments: Array.isArray(attachments) ? attachments : [],
    });

    collab.timeline.push({
      type: "message",
      by: ctx.role,
      at: new Date(),
      note: "New message",
    });

    await collab.save();
    const saved = await Collaboration.findById(collab._id)
      .populate("company", "name")
      .populate("university", "name username");

    res.json(saved);
  } catch (e) {
    next(e);
  }
});

// Add task
router.post("/:id/tasks", auth, ensureAccess, async (req, res, next) => {
  try {
    const collab = req.collab;
    const ctx = req.ctx;
    const { column = "backlog", title = "", assigneeRole = "both", due, notes = "" } = req.body;

    if (!title.trim()) return res.status(400).json({ message: "Task title required" });
    if (!["backlog", "discussion", "actions", "approvals"].includes(column)) {
      return res.status(400).json({ message: "Invalid column" });
    }

    const task = {
      title: title.trim(),
      assigneeRole,
      due: due ? new Date(due) : undefined,
      notes,
      done: false,
      column,
    };

    collab.board = collab.board || {};
    collab.board[column] = Array.isArray(collab.board[column]) ? collab.board[column] : [];
    collab.board[column].push(task);

    collab.timeline.push({
      type: "task",
      by: ctx.role,
      at: new Date(),
      note: `Task added in ${column}`,
    });

    await collab.save();
    const saved = await Collaboration.findById(collab._id)
      .populate("company", "name")
      .populate("university", "name username");
    res.json(saved);
  } catch (e) {
    next(e);
  }
});

// Update task (move / toggle / edit)
router.patch("/:id/tasks/:taskId", auth, ensureAccess, async (req, res, next) => {
  try {
    const collab = req.collab;
    const ctx = req.ctx;
    const { toColumn, done, title, notes, assigneeRole, due } = req.body;

    // locate task everywhere
    let found = null, fromCol = null, idx = -1;
    for (const col of ["backlog", "discussion", "actions", "approvals"]) {
      const arr = Array.isArray(collab.board[col]) ? collab.board[col] : [];
      const i = arr.findIndex((t) => String(t._id) === String(req.params.taskId));
      if (i >= 0) {
        found = arr[i];
        fromCol = col;
        idx = i;
        break;
      }
    }
    if (!found) return res.status(404).json({ message: "Task not found" });

    // edits
    if (title !== undefined) found.title = String(title);
    if (notes !== undefined) found.notes = String(notes);
    if (assigneeRole !== undefined) found.assigneeRole = String(assigneeRole);
    if (done !== undefined) found.done = !!done;
    if (due !== undefined) found.due = due ? new Date(due) : undefined;

    // move
    if (toColumn && toColumn !== fromCol) {
      if (!["backlog", "discussion", "actions", "approvals"].includes(toColumn)) {
        return res.status(400).json({ message: "Invalid destination column" });
      }
      const fromArr = collab.board[fromCol];
      const [taskDoc] = fromArr.splice(idx, 1);
      taskDoc.column = toColumn;
      collab.board[toColumn] = collab.board[toColumn] || [];
      collab.board[toColumn].push(taskDoc);
      collab.timeline.push({
        type: "task",
        by: ctx.role,
        at: new Date(),
        note: `Task moved ${fromCol} → ${toColumn}`,
      });
    } else {
      collab.timeline.push({
        type: "task",
        by: ctx.role,
        at: new Date(),
        note: "Task updated",
      });
    }

    await collab.save();
    const saved = await Collaboration.findById(collab._id)
      .populate("company", "name")
      .populate("university", "name username");
    res.json(saved);
  } catch (e) {
    next(e);
  }
});

// Sign (either party)
router.post("/:id/sign", auth, ensureAccess, async (req, res, next) => {
  try {
    const collab = req.collab;
    const ctx = req.ctx;
    const { name = "" } = req.body;

    collab.mou = collab.mou || buildDefaultMoU({ title: collab.title });
    collab.mou.signatures = collab.mou.signatures || {
      company: { signed: false }, university: { signed: false }
    };

    if (ctx.role === "company") {
      collab.mou.signatures.company = {
        name: name || collab.mou.signatures.company?.name || "",
        signed: true,
        at: new Date(),
      };
    } else {
      collab.mou.signatures.university = {
        name: name || collab.mou.signatures.university?.name || "",
        signed: true,
        at: new Date(),
      };
    }

    collab.timeline.push({
      type: "signed",
      by: ctx.role,
      at: new Date(),
      note: `${ctx.role} signed`,
    });

    await collab.save();
    const saved = await Collaboration.findById(collab._id)
      .populate("company", "name")
      .populate("university", "name username");
    res.json(saved);
  } catch (e) {
    next(e);
  }
});

module.exports = router;
