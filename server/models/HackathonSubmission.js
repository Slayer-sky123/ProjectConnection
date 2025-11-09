// models/HackathonSubmission.js
const mongoose = require("mongoose");

const submissionSchema = new mongoose.Schema(
  {
    hackathon: { type: mongoose.Schema.Types.ObjectId, ref: "Hackathon", required: true },
    student:   { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    repoUrl:   { type: String, default: "" },
    demoUrl:   { type: String, default: "" },
    fileUrl:   { type: String, default: "" }, // uploaded zip/pdf etc.
    notes:     { type: String, default: "" },

    // judging
    score:     { type: Number, default: null }, // 0..100
    feedback:  { type: String, default: "" },
    rank:      { type: Number, default: null },
  },
  { timestamps: true }
);

submissionSchema.index({ hackathon: 1, student: 1 }, { unique: true });

module.exports = mongoose.model("HackathonSubmission", submissionSchema);
