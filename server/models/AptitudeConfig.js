const mongoose = require("mongoose");

/**
 * Single-document collection to hold global Aptitude settings.
 * We always read/update the first record; create default if missing.
 */
const aptitudeConfigSchema = new mongoose.Schema(
  {
    durationMinutes: { type: Number, default: 20 },
  },
  { timestamps: true }
);

module.exports = mongoose.model("AptitudeConfig", aptitudeConfigSchema);
