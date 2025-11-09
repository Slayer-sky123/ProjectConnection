// server/middleware/adminAuth.js
const jwt = require("jsonwebtoken");
const User = require("../models/User");

module.exports = async function adminAuth(req, res, next) {
  try {
    const auth = req.headers.authorization || "";
    const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;
    if (!token) return res.status(401).json({ message: "No token provided" });

    const secrets = [process.env.ADMIN_JWT_SECRET, process.env.JWT_SECRET].filter(Boolean);
    let decoded = null;
    for (const sec of secrets) { try { decoded = jwt.verify(token, sec); break; } catch {} }
    if (!decoded) return res.status(401).json({ message: "Invalid or expired token" });

    const user = await User.findById(decoded.id).select("role");
    if (!user || user.role !== "admin") return res.status(403).json({ message: "Forbidden (admin only)" });

    req.user = { id: String(user._id), role: user.role };
    next();
  } catch {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};
