const mongoose = require("mongoose");

const studyProgressSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    skill: { type: mongoose.Schema.Types.ObjectId, ref: "Skill", required: true, index: true },
    material: { type: mongoose.Schema.Types.ObjectId, ref: "StudyMaterial", required: true, index: true },
    status: {
      type: String,
      enum: ["todo", "in-progress", "done"],
      default: "todo",
    },
    notes: { type: String, default: "" },
    lastTouchedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

studyProgressSchema.index({ user: 1, skill: 1, material: 1 }, { unique: true });

module.exports = mongoose.model("StudyProgress", studyProgressSchema);
