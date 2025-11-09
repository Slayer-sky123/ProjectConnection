// models/Hackathon.js
const mongoose = require("mongoose");

const hackathonSchema = new mongoose.Schema(
  {
    company: { type: mongoose.Schema.Types.ObjectId, ref: "CompanyProfile", required: true },
    title: { type: String, required: true },
    brief: { type: String, default: "" },
    skills: [{ type: mongoose.Schema.Types.ObjectId, ref: "Skill" }],
    prize: { type: String, default: "" },
    rules: { type: String, default: "" },
    resources: { type: String, default: "" }, // links, repo templates, dataset links
    startAt: { type: Date, required: true },
    endAt: { type: Date, required: true },
    visibility: { type: String, enum: ["public", "private"], default: "public" },
    status: { type: String, enum: ["upcoming", "live", "ended"], default: "upcoming" },
    bannerUrl: { type: String, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Hackathon", hackathonSchema);
