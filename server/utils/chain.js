// server/utils/chain.js
const crypto = require("crypto");
const { deterministicId } = require("./ai"); // you already have this in ai.js

function sha256(jsonish) {
  const raw = typeof jsonish === "string" ? jsonish : JSON.stringify(jsonish);
  return crypto.createHash("sha256").update(raw).digest("hex");
}

/**
 * Canonicalize a certificate payload (order fields & strip volatile props).
 * Ensures same content => same hash.
 */
function canonicalize(c) {
  return {
    universityUsername: c.universityUsername,
    recipientName: c.recipientName,
    recipientEmail: c.recipientEmail || "",
    title: c.title,
    description: c.description || "",
    issueDate: new Date(c.issueDate).toISOString(),
    expiryDate: c.expiryDate ? new Date(c.expiryDate).toISOString() : null,
    meta: {
      cgpa: c.meta?.cgpa || "",
      rollNo: c.meta?.rollNo || "",
      skills: Array.isArray(c.meta?.skills) ? [...c.meta.skills].sort() : [],
      extras: c.meta?.extras || {},
    },
    version: c.version || 1,
    revoked: !!c.revoked,
  };
}

/**
 * “Anchor” to a chain. Here we simulate a quick anchoring
 * by returning a deterministic id derived from the hash + time.
 * Swap this with a real chain call later.
 */
async function anchorToChain({ contentHash }) {
  const seed = `${contentHash}:${Date.now()}`;
  return {
    txId: deterministicId(seed),
    network: process.env.CERT_CHAIN || "demo-chain",
    at: new Date(),
  };
}

module.exports = { sha256, canonicalize, anchorToChain };
