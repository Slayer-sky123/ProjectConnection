// server/models/RecruiterTestSubmission.js
const mongoose = require("mongoose");

const answerSchema = new mongoose.Schema(
  {
    qIndex: Number,
    chosen: Number,
    correct: Boolean,
  },
  { _id: false }
);

const assignSchema = new mongoose.Schema(
  {
    application: { type: mongoose.Schema.Types.ObjectId, ref: "Application", required: true, index: true },
    company: { type: mongoose.Schema.Types.ObjectId, ref: "CompanyProfile", required: true },
    student: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    template: { type: mongoose.Schema.Types.ObjectId, ref: "RecruiterTest", required: true },
    dueAt: { type: Date, default: null },
    token: { type: String, required: true, unique: true }, // simple access token for test link
    status: { type: String, enum: ["assigned", "submitted", "expired"], default: "assigned" },
  },
  { timestamps: true }
);

const resultSchema = new mongoose.Schema(
  {
    assign: { type: mongoose.Schema.Types.ObjectId, ref: "RecruiterTestAssign", required: true, index: true },
    score: { type: Number, required: true }, // 0–10
    total: { type: Number, default: 10 },
    answers: { type: [answerSchema], default: [] },
    startedAt: { type: Date, default: Date.now },
    submittedAt: { type: Date, default: Date.now },
    meta: { type: Object, default: {} },
  },
  { timestamps: true }
);

module.exports = {
  RecruiterTestAssign: mongoose.model("RecruiterTestAssign", assignSchema),
  RecruiterTestResult: mongoose.model("RecruiterTestResult", resultSchema),
};
