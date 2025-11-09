const mongoose = require("mongoose");

const hackTeamSchema = new mongoose.Schema({
  hackathon: { type: mongoose.Schema.Types.ObjectId, ref: "Hackathon", required: true },
  name:      { type: String, required: true },
  members:   [{ type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }],
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
}, { timestamps: true });

hackTeamSchema.index({ hackathon: 1, name: 1 }, { unique: true });

module.exports = mongoose.model("HackTeam", hackTeamSchema);
