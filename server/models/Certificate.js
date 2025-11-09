// server/models/Certificate.js
const mongoose = require("mongoose");
const crypto = require("crypto");

const CertificateSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    university: { type: mongoose.Schema.Types.ObjectId, ref: "University", required: true, index: true },

    // Display/meta (not required for creation; filled by routes for convenience)
    studentName: { type: String, default: "" },
    studentEmail: { type: String, default: "" },
    universityName: { type: String, default: "" },
    universityUsername: { type: String, default: "" },

    title: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    issueDate: { type: Date, default: Date.now },

    // Status kept simple: issued | revoked
    status: { type: String, enum: ["issued", "revoked"], default: "issued", index: true },

    // Public verification
    hash: { type: String, unique: true, index: true }, // 16-char hex
    publicId: { type: String, unique: true, sparse: true, default: undefined },
    serial: { type: String, unique: true, sparse: true, default: undefined },

    // Bag for small extras like numeric studentId shown in UI
    extras: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

/* ---------- helpers ---------- */
function makeHash(seed = "") {
  return crypto
    .createHash("sha256")
    .update(`${seed}::${Date.now()}::${crypto.randomBytes(8).toString("hex")}`)
    .digest("hex")
    .slice(0, 16);
}

function makeSerial() {
  const y = new Date().getFullYear();
  return `C-${y}-${crypto.randomBytes(3).toString("hex").toUpperCase()}`;
}

function makePublicId() {
  return `PUB-${crypto.randomBytes(6).toString("hex")}`;
}

/**
 * Ensure derived fields exist before validation/saving.
 * This runs for new and existing docs that are being updated.
 */
CertificateSchema.pre("validate", async function ensureFields(next) {
  try {
    if (!this.issueDate) this.issueDate = new Date();
    if (!this.status) this.status = "issued";

    // hash (unique, short)
    if (!this.hash) {
      let candidate = makeHash(String(this.student || "") + String(this.title || ""));
      let tries = 0;
      // ensure uniqueness with a few attempts (extremely unlikely to collide)
      // eslint-disable-next-line no-await-in-loop
      while (await this.constructor.exists({ hash: candidate })) {
        candidate = makeHash(candidate);
        tries += 1;
        if (tries > 5) break;
      }
      this.hash = candidate;
    }

    // serial / publicId (not strictly required by UI, but helps avoid unique null issues)
    if (!this.serial) this.serial = makeSerial();
    if (!this.publicId) this.publicId = makePublicId();

    next();
  } catch (e) {
    next(e);
  }
});

/**
 * Backfill helper for older docs that may be missing fields.
 * Usage: await Certificate.ensureComputedFields(docId)
 */
CertificateSchema.statics.ensureComputedFields = async function ensureComputedFields(id) {
  const doc = await this.findById(id);
  if (!doc) return null;

  let changed = false;
  if (!doc.hash) {
    doc.hash = makeHash(String(doc.student || "") + String(doc.title || ""));
    changed = true;
  }
  if (!doc.serial) {
    doc.serial = makeSerial();
    changed = true;
  }
  if (!doc.publicId) {
    doc.publicId = makePublicId();
    changed = true;
  }

  if (changed) {
    await doc.save();
  }
  return doc;
};

module.exports = mongoose.model("Certificate", CertificateSchema);
