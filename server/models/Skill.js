// server/models/Skill.js
const mongoose = require("mongoose");

const roadmapStepSchema = new mongoose.Schema({
  level: {
    type: String,
    enum: ["Beginner", "Intermediate", "Advanced"],
    required: true,
  },
  title: { type: String, required: true },
  description: String,
  topics: [String],
  resources: [
    {
      title: String,
      url: String,
    },
  ],
});

const skillSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    // Admin-set duration for student assessment timer (in minutes)
    durationMinutes: { type: Number, default: 30, min: 1 },

    roadmap: [roadmapStepSchema], // optional
  },
  { timestamps: true }
);

// Optional: enable text search on name
skillSchema.index({ name: "text" });

module.exports = mongoose.model("Skill", skillSchema);
