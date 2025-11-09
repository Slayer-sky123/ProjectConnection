// server/models/AptitudeResult.js
const mongoose = require("mongoose");

const aptitudeResultSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    // optional link to a skill/area if needed
    title: { type: String, default: "General Aptitude", index: true },
    score: { type: Number, required: true }, // e.g., 0–10 scale to match skill tests your UI uses
    total: { type: Number, default: 10 },
    timelineAt: { type: Date, default: Date.now, index: true },
    meta: { type: Object, default: {} },
  },
  { timestamps: true }
);

aptitudeResultSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model("AptitudeResult", aptitudeResultSchema);
