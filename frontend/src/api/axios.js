import axios from "axios";

const RAW_BASE =
  (import.meta && import.meta.env && import.meta.env.VITE_API_BASE) ||
  "http://localhost:5000/api";

const BASE_URL = RAW_BASE.replace(/\/+$/, "");
export const SOCKET_ORIGIN = BASE_URL.replace(/\/api$/, "");

const API = axios.create({
  baseURL: BASE_URL,
  withCredentials: false,
  timeout: 0,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

/* ---------------- helpers ---------------- */
function absUrl(config) {
  const base = config.baseURL || "";
  const url = config.url || "";
  if (/^https?:\/\//i.test(url)) return url;
  return `${base}${url.startsWith("/") ? "" : "/"}${url}`;
}

function pathnameOf(urlLike) {
  try {
    return new URL(urlLike, BASE_URL).pathname;
  } catch {
    return "";
  }
}

function isAdminApi(url) {
  const p = pathnameOf(url);
  return p.startsWith("/api/admin") || p.startsWith("/api/auth/admin");
}

function isCompanyApi(url) {
  const p = pathnameOf(url);
  return p.startsWith("/api/company");
}

function isOnAdminPage() {
  try {
    return typeof window !== "undefined" && window.location.pathname.startsWith("/admin");
  } catch {
    return false;
  }
}

// prefer `token`, but support legacy `userToken`
function getUserToken() {
  return (
    localStorage.getItem("token") ||
    localStorage.getItem("userToken") ||
    null
  );
}

function getAdminToken() {
  return localStorage.getItem("adminToken");
}

/**
 * Requests that should NEVER trigger a redirect on 401.
 * These are safe to call as an anonymous visitor (homepage reads / soft checks).
 */
const NO_REDIRECT_401_ALLOWLIST = [
  /\/api\/auth\/login\b/i,
  /\/api\/auth\/register\b/i,
  /\/api\/student\/jobs\b/i,
  /\/api\/student\/profile\b/i,
  /\/api\/student\/skill-pref\b/i,
];

/** whether this URL is allow-listed from redirect-on-401 behavior */
function isAllowlistedUrl(url) {
  return NO_REDIRECT_401_ALLOWLIST.some((re) => re.test(url));
}

/** whether this request was explicitly marked as public */
function isPublicRequest(config) {
  // Caller can set config.__public = true to prevent auth redirects.
  return Boolean(config && config.__public === true);
}

/* ---------------- REQUEST ---------------- */
API.interceptors.request.use((config) => {
  const url = absUrl(config);
  const adminToken = getAdminToken();
  const userToken = getUserToken();

  let token = null;

  if (isAdminApi(url)) {
    token = adminToken;
  } else if (isCompanyApi(url)) {
    // Prefer admin token when browsing admin pages; else fall back to the user token (company login)
    token = (isOnAdminPage() ? adminToken : null) || userToken;
  } else {
    token = userToken;
  }

  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  } else if (config.headers?.Authorization) {
    delete config.headers.Authorization;
  }

  // Ensure JSON for objects
  if (
    config.data &&
    typeof config.data === "object" &&
    !(config.data instanceof FormData)
  ) {
    config.headers["Content-Type"] = "application/json";
  }

  return config;
});

/* ---------------- RESPONSE ---------------- */
let redirecting = false;

API.interceptors.response.use(
  (res) => res,
  (err) => {
    const status = err?.response?.status;
    const cfg = err?.config || {};
    const url = absUrl(cfg);
    const adminApi = isAdminApi(url);
    const onAdmin = isOnAdminPage();

    // Attach a clean message for UI usage
    const serverMsg =
      err?.response?.data?.message ||
      err?.response?.data?.error ||
      err?.message ||
      "Request failed";

    // Normalize into one shape the UI can show
    err.normalized = {
      status: status || 0,
      url,
      method: (cfg.method || "get").toUpperCase(),
      message: serverMsg,
    };

    // If this is a public/allowlisted read, NEVER redirect on 401.
    if (status === 401 && (isPublicRequest(cfg) || isAllowlistedUrl(url))) {
      return Promise.reject(err);
    }

    // Only redirect for 401 (unauthenticated). Let 403 bubble to UI.
    if (status === 401 && !redirecting) {
      redirecting = true;

      try {
        if (adminApi || onAdmin) {
          localStorage.removeItem("adminToken");
          localStorage.removeItem("adminUser");
          localStorage.removeItem("adminEmail");
          if (typeof window !== "undefined" && window.location.pathname !== "/admin/login") {
            window.location.replace("/admin/login");
          }
        } else {
          localStorage.removeItem("token");
          localStorage.removeItem("userToken");
          localStorage.removeItem("userRole");
          if (typeof window !== "undefined" && window.location.pathname !== "/login") {
            window.location.replace("/login");
          }
        }
      } finally {
        setTimeout(() => {
          redirecting = false;
        }, 500);
      }
    }

    // For 400/403/409/etc., let UI read err.normalized.message
    return Promise.reject(err);
  }
);

export default API;
