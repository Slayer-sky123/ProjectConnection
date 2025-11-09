// server/models/Job.js
const mongoose = require("mongoose");

const pkgSchema = new mongoose.Schema(
  {
    min: { type: Number, default: 0 },        // numeric only
    max: { type: Number, default: 0 },
    currency: { type: String, default: "INR" }, // ISO or "INR"
    unit: { type: String, enum: ["month", "year"], default: "year" }, // per month / year
  },
  { _id: false }
);

const jobSchema = new mongoose.Schema(
  {
    company: { type: mongoose.Schema.Types.ObjectId, ref: "CompanyProfile", required: true },

    // Transparency core fields
    title: { type: String, required: true },
    location: { type: String, default: "" },
    experience: { type: String, default: "" },           // e.g., "0-2 years", "Fresher"
    startDate: { type: Date, default: null },            // starting date for role
    openings: { type: Number, default: 1 },              // # openings
    package: { type: pkgSchema, default: () => ({}) },   // salary/stipend

    // Project-specific
    minScore: { type: Number, default: 0 },              // 0..10 (eligibility filter)

    // Optional completeness
    type: { type: String, enum: ["job", "internship", "part-time", "contract"], default: "job" },
    description: { type: String, default: "" },
    responsibilities: [{ type: String }],                // optional bullets
    skills: [{ type: mongoose.Schema.Types.ObjectId, ref: "Skill" }], // required skills
    preferredSkills: [{ type: mongoose.Schema.Types.ObjectId, ref: "Skill" }], // optional
    isFeatured: { type: Boolean, default: false },

    // status
    status: { type: String, enum: ["open", "closed", "paused"], default: "open" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Job", jobSchema);
