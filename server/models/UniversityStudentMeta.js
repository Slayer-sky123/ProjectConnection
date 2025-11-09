// server/models/UniversityStudentMeta.js
const mongoose = require("mongoose");

const UniversityStudentMetaSchema = new mongoose.Schema(
  {
    university: { type: mongoose.Schema.Types.ObjectId, ref: "University", required: true, index: true },
    student: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    labels: { type: [String], default: [] },
    notes: { type: [{ text: String, at: Date }], default: [] },
    status: { type: String, default: "active" }, // active | blocked | alumni
  },
  { timestamps: true }
);

UniversityStudentMetaSchema.index({ university: 1, student: 1 }, { unique: true });

module.exports = mongoose.model("UniversityStudentMeta", UniversityStudentMetaSchema);
