const mongoose = require("mongoose");

const UniversityWebinarSchema = new mongoose.Schema(
  {
    university: { type: mongoose.Schema.Types.ObjectId, ref: "University", index: true, required: true },
    title: { type: String, required: true },
    speaker: { type: String, required: true },
    date: { type: Date, required: true },
    mode: { type: String, enum: ["Live", "Recorded"], default: "Live" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("UniversityWebinar", UniversityWebinarSchema);
