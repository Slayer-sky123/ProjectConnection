const mongoose = require("mongoose");

const UniversityCollaborationSchema = new mongoose.Schema(
  {
    university: { type: mongoose.Schema.Types.ObjectId, ref: "University", index: true, required: true },
    company: { type: String, required: true, trim: true },
    title: { type: String, required: true, trim: true },
    funding: { type: Number, default: 0 },
    status: { type: String, enum: ["Active", "Pending", "Completed"], default: "Pending" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("UniversityCollaboration", UniversityCollaborationSchema);
