const mongoose = require("mongoose");

const SkillEndorsementSchema = new mongoose.Schema(
  {
    university: { type: mongoose.Schema.Types.ObjectId, ref: "University", index: true, required: true },
    student: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true, required: true },
    skillName: { type: String, required: true },
    evidence: { type: String, default: "" },
    endorsed: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model("SkillEndorsement", SkillEndorsementSchema);
