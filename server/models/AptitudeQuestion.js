const mongoose = require("mongoose");

const aptitudeQuestionSchema = new mongoose.Schema(
  {
    question: { type: String, required: true },
    options: { type: [String], required: true, validate: a => a.length === 4 },
    answer: { type: String, required: true }, // store the correct option text
  },
  { timestamps: true }
);

module.exports = mongoose.model("AptitudeQuestion", aptitudeQuestionSchema);
