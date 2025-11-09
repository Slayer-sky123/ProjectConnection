const mongoose = require("mongoose");

const testResultSchema = new mongoose.Schema(
  {
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    skill: { type: mongoose.Schema.Types.ObjectId, ref: "Skill", required: true },
    score: { type: Number, required: true },
    total: { type: Number, required: true },
    percentage: { type: Number },
  },
  { timestamps: true }
);

module.exports = mongoose.model("TestResult", testResultSchema);
