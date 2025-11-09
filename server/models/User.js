const mongoose = require("mongoose");

const normalizeUniName = (s = "") =>
  String(s).toLowerCase().replace(/[^a-z0-9]/g, "");

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },

    username: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    password: { type: String, required: true },

    phone: { type: String, required: true, trim: true },

    role: {
      type: String,
      enum: ["student", "university", "company", "admin"],
      default: "student",
      index: true,
    },

    // 6-digit, unique, non-editable student ID
    studentId: {
      type: String,
      unique: true,
      sparse: true,
      match: /^\d{6}$/,
      default: null,
      immutable: true,
    },

    // University name as entered by the user (display)
    university: { type: String, default: "", trim: true },

    // Normalized (letters+digits only) for strict matching/filtering
    universityNorm: { type: String, default: "", index: true },

    education: {
      type: String,
      enum: ["UG", "PG", "Diploma", "Other"],
      default: "UG",
    },

    // Free-form skills (strings)
    skills: { type: [String], default: [] },

    // Primary skill (object reference)
    primarySkillId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Skill",
      default: null,
    },

    // Cached/display name of primary skill for faster reads
    primarySkillName: { type: String, default: "" },

    // Resume file URL if uploaded
    resumeUrl: { type: String, default: "" },
  },
  { timestamps: true }
);

// Static util so other modules can reuse the same normalization
userSchema.statics.normalizeUniName = normalizeUniName;

module.exports = mongoose.model("User", userSchema);
