// server/models/Collaboration.js
const mongoose = require("mongoose");

const TimelineEventSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: [
        "created",
        "stage",
        "meta",
        "message",
        "task",
        "file",
        "signed",
        "updated",
      ],
      required: true,
    },
    by: { type: String, default: "" }, // "company" | "university" | user name
    at: { type: Date, default: Date.now },
    note: { type: String, default: "" },
  },
  { _id: false }
);

const MessageSchema = new mongoose.Schema(
  {
    authorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    authorRole: { type: String, enum: ["company", "university"], required: true },
    authorName: { type: String, default: "" },
    text: { type: String, default: "" },
    attachments: [
      {
        name: String,
        url: String, // store link or pre-signed URL; you can swap in GridFS later
      },
    ],
  },
  { timestamps: true }
);

const TaskSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    assigneeRole: {
      type: String,
      enum: ["company", "university", "both"],
      default: "both",
    },
    due: { type: Date },
    notes: { type: String, default: "" },
    done: { type: Boolean, default: false },
    column: {
      type: String,
      enum: ["backlog", "discussion", "actions", "approvals"],
      required: true,
      default: "backlog",
    },
  },
  { timestamps: true }
);

const BoardSchema = new mongoose.Schema(
  {
    backlog: [TaskSchema],
    discussion: [TaskSchema],
    actions: [TaskSchema],
    approvals: [TaskSchema],
  },
  { _id: false }
);

// Minimal but complete MoU shape
const CollaborationMoUSchema = new mongoose.Schema(
  {
    overview: {
      title: { type: String, default: "" },
      companyName: { type: String, default: "" },
      universityName: { type: String, default: "" },
      representatives: {
        company: { type: String, default: "" },
        university: { type: String, default: "" },
      },
      effectiveDate: { type: Date },
      durationMonths: { type: Number, default: 36 }, // 3 years by default
    },
    objectives: { type: [String], default: [] },
    scope: {
      company: { type: [String], default: [] },
      university: { type: [String], default: [] },
      joint: { type: [String], default: [] },
    },
    benefits: { type: [String], default: [] },
    operations: {
      nodalOfficers: {
        company: { type: String, default: "" },
        university: { type: String, default: "" },
      },
      implementationMode: { type: String, default: "StudentConnect Portal" },
      meetingSchedule: { type: String, default: "Quarterly review" },
      reporting: { type: String, default: "Monthly analytics reports" },
    },
    kpis: [
      {
        area: String,
        deliverable: String,
        outcome: String,
      },
    ],
    legal: {
      confidentiality: { type: String, default: "" },
      financialLiability: { type: String, default: "" },
      termRenewal: { type: String, default: "" },
      termination: { type: String, default: "" },
      jurisdiction: { type: String, default: "" },
    },
    signatures: {
      company: {
        name: { type: String, default: "" },
        signed: { type: Boolean, default: false },
        at: { type: Date },
      },
      university: {
        name: { type: String, default: "" },
        signed: { type: Boolean, default: false },
        at: { type: Date },
      },
    },
  },
  { _id: false }
);

const CollaborationSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    summary: { type: String, default: "" },

    // references
    company: { type: mongoose.Schema.Types.ObjectId, ref: "CompanyProfile", required: true, index: true },
    university: { type: mongoose.Schema.Types.ObjectId, ref: "University", required: true, index: true },

    stage: {
      type: String,
      enum: ["draft", "review", "negotiation", "approved", "active", "completed", "archived"],
      default: "draft",
      index: true,
    },

    board: { type: BoardSchema, default: () => ({}) },
    messages: { type: [MessageSchema], default: [] },
    timeline: { type: [TimelineEventSchema], default: [] },

    // Single, curated MoU object
    mou: { type: CollaborationMoUSchema, default: () => ({}) },
  },
  { timestamps: true }
);

// Ensure board columns exist even if missing in payload
CollaborationSchema.pre("validate", function (next) {
  this.board = this.board || {};
  for (const k of ["backlog", "discussion", "actions", "approvals"]) {
    if (!Array.isArray(this.board[k])) this.board[k] = [];
  }
  // Ensure timeline has proper type values; (validation will enforce enum)
  // Ensure mou exists
  if (!this.mou) this.mou = {};
  if (!this.mou.signatures) {
    this.mou.signatures = { company: { signed: false }, university: { signed: false } };
  }
  next();
});

module.exports = mongoose.model("Collaboration", CollaborationSchema);
