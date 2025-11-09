// models/Interview.js
const mongoose = require("mongoose");

const interviewSchema = new mongoose.Schema(
  {
    application: { type: mongoose.Schema.Types.ObjectId, ref: "Application", required: true, index: true },
    company:     { type: mongoose.Schema.Types.ObjectId, ref: "CompanyProfile", required: true, index: true },
    student:     { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },

    stage: { type: String, enum: ["screening", "technical", "hr", "final"], default: "technical" },
    startsAt: { type: Date, required: true },
    durationMins: { type: Number, default: 45 },

    // Reuse your in‑platform video infra (same as webinars)
    roomId: { type: String, required: true, unique: true },

    notes: { type: String, default: "" },
    status: { type: String, enum: ["scheduled", "completed", "cancelled"], default: "scheduled" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Interview", interviewSchema);
