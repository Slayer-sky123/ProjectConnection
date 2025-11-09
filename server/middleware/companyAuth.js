// server/middleware/companyAuth.js
const jwt = require("jsonwebtoken");
const User = require("../models/User");

/**
 * Allows role "company" OR "admin" on /api/company/*, accepting either secret.
 */
module.exports = async function companyOrAdminAuth(req, res, next) {
  try {
    const auth = req.headers.authorization || "";
    const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;
    if (!token) return res.status(401).json({ message: "No token provided" });

    const secrets = [process.env.JWT_SECRET, process.env.ADMIN_JWT_SECRET].filter(Boolean);
    if (!secrets.length) return res.status(500).json({ message: "Server misconfigured (no JWT secrets)" });

    let decoded = null;
    for (const sec of secrets) {
      try { decoded = jwt.verify(token, sec); break; } catch {}
    }
    if (!decoded) return res.status(401).json({ message: "Invalid or expired token" });

    const user = await User.findById(decoded.id).select("role");
    if (!user) return res.status(401).json({ message: "User not found" });
    if (user.role !== "company" && user.role !== "admin") {
      return res.status(403).json({ message: "Forbidden (company/admin only)" });
    }

    req.user = { id: String(user._id), role: user.role };
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid token" });
  }
};
