// server/models/Guidance.js
const mongoose = require("mongoose");

const guidanceSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    skill: { type: mongoose.Schema.Types.ObjectId, ref: "Skill", required: true, index: true },
    // compact structured payload we render on the client
    payload: {
      strengths: { type: [String], default: [] },
      gaps: { type: [String], default: [] },
      suggestedTopics: { type: [String], default: [] },
      weeklyPlan: {
        type: [
          {
            day: String,
            focus: String,
            tasks: [String],
            resources: [{ title: String, url: String }],
          },
        ],
        default: [],
      },
      projects: {
        type: [{ title: String, description: String, outline: [String] }],
        default: [],
      },
      keywords: { type: [String], default: [] },
      notes: { type: String, default: "" },
      snapshot: {
        avgTestPct: { type: Number, default: null },
        studyDonePct: { type: Number, default: 0 },
      },
    },
    // for quick revalidation; if older than X days we can rebuild
    builtAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

guidanceSchema.index({ user: 1, skill: 1 }, { unique: true });

module.exports = mongoose.model("Guidance", guidanceSchema);
