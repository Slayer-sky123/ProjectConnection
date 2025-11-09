const mongoose = require("mongoose");

const studyMaterialSchema = new mongoose.Schema(
  {
    skill: { type: mongoose.Schema.Types.ObjectId, ref: "Skill", required: true },
    level: {
      type: String,
      enum: ["Beginner", "Intermediate", "Advanced"],
      default: "Beginner",
      index: true,
    },
    title: { type: String, required: true, trim: true },
    type: {
      type: String,
      enum: ["Article", "Video", "Course", "Docs", "Practice"],
      default: "Article",
    },
    description: { type: String, default: "" },
    url: { type: String, default: "" },
    topics: { type: [String], default: [] },
    difficulty: {
      type: String,
      enum: ["easy", "medium", "hard"],
      default: "easy",
    },
    tags: { type: [String], default: [] },
    // optional curated flag
    curated: { type: Boolean, default: true },
  },
  { timestamps: true }
);

studyMaterialSchema.index({ skill: 1, level: 1 });
studyMaterialSchema.index({ title: "text", description: "text", tags: 1, topics: 1 });

module.exports = mongoose.model("StudyMaterial", studyMaterialSchema);
