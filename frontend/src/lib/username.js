// src/lib/username.js
export function uniUsernameFromName(name = "") {
  const compact = (name || "").toLowerCase().replace(/[^a-z0-9]/g, "");
  if (compact.length >= 4 && compact.length <= 24) return compact;
  const base = compact || "univ";
  return (base + (Date.now() + "").slice(-4)).slice(0, 24);
}

export function isValidUniUsername(u = "") {
  return /^[a-z0-9]{4,24}$/.test(u);
}
