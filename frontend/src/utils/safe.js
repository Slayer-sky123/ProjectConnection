// src/utils/safe.js

/** Safely parse JSON from any string or storage value. */
export function safeJSONParse(maybe, fallback = {}) {
  if (maybe == null) return fallback;
  try {
    if (typeof maybe === "string") {
      if (!maybe.trim().length) return fallback;
      return JSON.parse(maybe);
    }
    if (typeof maybe === "object") return maybe;
    return fallback;
  } catch {
    return fallback;
  }
}

/** Guarded Object.keys that never throws. */
export function safeKeys(obj) {
  if (!obj || typeof obj !== "object") return [];
  return Object.keys(obj);
}

/** Safe localStorage get (returns fallback if anything fails) */
export function getLS(key, fallback = null) {
  try {
    const v = localStorage.getItem(key);
    return v == null ? fallback : v;
  } catch {
    return fallback;
  }
}

/** Safe localStorage set (no-throw) */
export function setLS(key, value) {
  try {
    localStorage.setItem(key, value);
  } catch {}
}
