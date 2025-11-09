const mongoose = require("mongoose");

const skillPreferenceSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", unique: true, required: true },
    skill: { type: mongoose.Schema.Types.ObjectId, ref: "Skill", required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("SkillPreference", skillPreferenceSchema);
