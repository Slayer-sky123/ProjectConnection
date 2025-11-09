// server/models/UniversityCertificate.js
const mongoose = require("mongoose");

const UniversityCertificateSchema = new mongoose.Schema(
  {
    university: { type: mongoose.Schema.Types.ObjectId, ref: "University", index: true, required: true },
    student: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true, required: true },

    // core details
    studentName: { type: String, required: true },
    studentEmail: { type: String, required: true, lowercase: true, trim: true },
    credentialType: { type: String, required: true }, // e.g. "Certificate", "Diploma"
    title: { type: String, required: true },          // e.g. "Full-Stack Web Dev"
    description: { type: String, default: "" },
    issueDate: { type: Date, default: Date.now },
    expiresAt: { type: Date, default: null },

    // verification payload (canonical JSON)
    payload: { type: Object, required: true },

    // content hashes (sha256 hex)
    payloadHash: { type: String, required: true, index: true, unique: true },

    // optional anchoring to public networks (simulated)
    chain: {
      network: { type: String, default: "" }, // e.g., "ethereum"
      txHash: { type: String, default: "" },
      anchorAt: { type: Date, default: null },
    },

    // viewing
    publicUrlId: { type: String, required: true, unique: true }, // short id for public verify endpoint

    // status/versioning
    version: { type: Number, default: 1 },
    revoked: { type: Boolean, default: false },
    revokeReason: { type: String, default: "" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("UniversityCertificate", UniversityCertificateSchema);
