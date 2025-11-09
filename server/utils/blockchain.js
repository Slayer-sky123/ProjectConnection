// server/utils/blockchain.js
// A safe, local "blockchain" shim. You can later replace this with an on-chain integration.
// For now, we hash the certificate payload and produce a stable txId-like value.

const crypto = require("crypto");

function sha256(data) {
  return crypto.createHash("sha256").update(data).digest("hex");
}

function fakeTxId(hash) {
  // Fake tx id from hash (prefix + last 32 chars)
  return "mocktx_" + hash.slice(-32);
}

/**
 * "Issue" a credential: compute a content hash and a deterministic txId.
 * Return an object shaped like a chain receipt.
 */
function issueCredential(data) {
  const payload = JSON.stringify(data);
  const hash = sha256(payload);
  const txId = fakeTxId(hash);
  const network = "mockchain";
  const explorerUrl = ""; // could point to your block explorer later
  return { hash, txId, network, explorerUrl };
}

/** Verify by recomputing hash and comparing */
function verifyCredential(data, expectedHash) {
  const payload = JSON.stringify(data);
  const hash = sha256(payload);
  return hash === expectedHash;
}

module.exports = {
  issueCredential,
  verifyCredential,
};
