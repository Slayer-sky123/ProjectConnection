const mongoose = require("mongoose");

const scoreItemSchema = new mongoose.Schema({
  rubricKey: String,   // matches Hackathon.rubric.key
  score: { type: Number, default: 0 },
}, { _id: false });

const judgeScoreSchema = new mongoose.Schema({
  judge: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  items: [scoreItemSchema],
  total: { type: Number, default: 0 },
}, { _id: false });

const hackSubmissionSchema = new mongoose.Schema({
  hackathon: { type: mongoose.Schema.Types.ObjectId, ref: "Hackathon", required: true },
  team:      { type: mongoose.Schema.Types.ObjectId, ref: "HackTeam", required: true },
  title:     { type: String, required: true },
  repoUrl:   { type: String, default: "" },
  demoUrl:   { type: String, default: "" },
  notes:     { type: String, default: "" },
  files:     [{ name: String, url: String }],   // if you store uploaded assets

  judgeScores: [judgeScoreSchema],
  finalScore: { type: Number, default: 0 },     // average of judge totals
  rank: { type: Number, default: null },
}, { timestamps: true });

hackSubmissionSchema.index({ hackathon: 1, team: 1 }, { unique: true });

module.exports = mongoose.model("HackSubmission", hackSubmissionSchema);
