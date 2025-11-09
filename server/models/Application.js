// server/models/Application.js
const mongoose = require("mongoose");

const interviewSchema = new mongoose.Schema(
  {
    startsAt: { type: Date, default: null },
    durationMins: { type: Number, default: 45 },
    stage: { type: String, default: "screening" },
    roomId: { type: String, default: null },
    notes: { type: String, default: "" },
  },
  { _id: false }
);

const screeningSchema = new mongoose.Schema(
  {
    resumeScore: { type: Number, default: null },
    testScore: { type: Number, default: null },
    fitScore: { type: Number, default: null },
    notes: { type: String, default: "" },
  },
  { _id: false }
);

const applicationSchema = new mongoose.Schema(
  {
    job: { type: mongoose.Schema.Types.ObjectId, ref: "Job", required: true, index: true },
    company: { type: mongoose.Schema.Types.ObjectId, ref: "CompanyProfile", required: true, index: true },
    student: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },

    status: {
      type: String,
      enum: ["applied", "shortlisted", "interview", "offer", "rejected"],
      default: "applied",
      index: true,
    },

    cvUrl: { type: String, default: null },

    screening: { type: screeningSchema, default: () => ({}) },

    // Embedded (to match UI)
    interview: { type: interviewSchema, default: null },
  },
  { timestamps: true }
);

// ensure one app per student per job
applicationSchema.index({ job: 1, student: 1 }, { unique: true });

module.exports = mongoose.model("Application", applicationSchema);
