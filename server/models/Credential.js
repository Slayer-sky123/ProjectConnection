// server/models/Credential.js
const mongoose = require("mongoose");

const CredentialSchema = new mongoose.Schema(
  {
    certificateId: { type: String, index: true, unique: true }, // public id
    university: { type: mongoose.Schema.Types.ObjectId, ref: "University", required: true, index: true },
    student: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },

    // What is being certified?
    title: { type: String, required: true }, // e.g., "Verified Skill: React"
    skillName: { type: String, default: "" },
    scorePct: { type: Number, default: 0 },
    meta: { type: Object, default: {} },

    // Blockchain receipt (mock)
    network: { type: String, default: "mockchain" },
    txId: { type: String, index: true },
    hash: { type: String, index: true },

    // Issuer snapshot
    issuerName: { type: String, default: "" },
    issuerUsername: { type: String, default: "" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Credential", CredentialSchema);
