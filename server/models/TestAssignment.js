const mongoose = require("mongoose");

const testAssignmentSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    application: { type: mongoose.Schema.Types.ObjectId, ref: "Application", required: true, index: true },
    type: { type: String, enum: ["skill", "aptitude", "custom"], default: "skill", index: true },
    skill: { type: mongoose.Schema.Types.ObjectId, ref: "Skill", default: null },
    title: { type: String, default: "" },
    status: { type: String, enum: ["pending", "in_progress", "completed", "expired"], default: "pending", index: true },
    startAt: { type: Date, default: null },
    endAt: { type: Date, default: null },
    durationMins: { type: Number, default: 30 },
    score: { type: Number, default: null },
    total: { type: Number, default: null },
    attemptId: { type: mongoose.Schema.Types.ObjectId, ref: "TestAttempt", default: null },
  },
  { timestamps: true }
);

// ❌ Removed the unique composite index so multiple assignments are allowed.
// If it exists in your DB: db.testassignments.dropIndex("student_1_application_1_type_1_skill_1")

testAssignmentSchema.index({ application: 1, createdAt: -1 });
testAssignmentSchema.index({ student: 1, createdAt: -1 });

module.exports = mongoose.model("TestAssignment", testAssignmentSchema);
