const mongoose = require("mongoose");

const skillTestResultSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  skill: { type: mongoose.Schema.Types.ObjectId, ref: "Skill", required: true },
  score: Number,
  total: Number,
}, { timestamps: true });

module.exports = mongoose.model("SkillTestResult", skillTestResultSchema);
