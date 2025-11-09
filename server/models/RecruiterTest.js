// server/models/RecruiterTest.js
const mongoose = require("mongoose");

const questionSchema = new mongoose.Schema(
  {
    text: { type: String, required: true },
    options: { type: [String], required: true },
    answerIndex: { type: Number, default: 0 },
  },
  { _id: false }
);

const recruiterTestSchema = new mongoose.Schema(
  {
    company: { type: mongoose.Schema.Types.ObjectId, ref: "CompanyProfile", required: true, index: true },
    title: { type: String, required: true },
    durationMins: { type: Number, default: 20 },
    negative: { type: Number, default: 0 },
    shuffle: { type: Boolean, default: true },
    questions: { type: [questionSchema], default: [] },
  },
  { timestamps: true }
);

module.exports = mongoose.model("RecruiterTest", recruiterTestSchema);
