// models/HackathonRegistration.js
const mongoose = require("mongoose");

const regSchema = new mongoose.Schema(
  {
    hackathon: { type: mongoose.Schema.Types.ObjectId, ref: "Hackathon", required: true },
    student:   { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    teamName:  { type: String, default: "" },
  },
  { timestamps: true }
);

regSchema.index({ hackathon: 1, student: 1 }, { unique: true });

module.exports = mongoose.model("HackathonRegistration", regSchema);
