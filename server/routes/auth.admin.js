// server/routes/auth.admin.js
const express = require("express");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const adminAuth = require("../middleware/adminAuth");
const User = require("../models/User");

const router = express.Router();
const getAdminSecret = () => process.env.ADMIN_JWT_SECRET || process.env.JWT_SECRET;

// POST /api/auth/admin/login
router.post("/admin/login", async (req, res) => {
  try {
    const SECRET = getAdminSecret();
    if (!SECRET) return res.status(500).json({ message: "Missing ADMIN_JWT_SECRET/JWT_SECRET" });

    const { email, password } = req.body || {};
    if (!email || !password) return res.status(400).json({ message: "Email & password required" });

    const user = await User.findOne({ email: String(email).toLowerCase().trim() });
    if (!user || user.role !== "admin") return res.status(401).json({ message: "Invalid credentials" });

    const ok = await bcrypt.compare(password, user.password || "");
    if (!ok) return res.status(401).json({ message: "Invalid credentials" });

    const token = jwt.sign({ id: user._id, role: user.role }, SECRET, { expiresIn: "7d" });
    res.json({ token, user: { id: user._id, name: user.name, email: user.email, role: user.role } });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// GET /api/auth/admin/me
router.get("/admin/me", adminAuth, async (req, res) => {
  const me = await User.findById(req.user.id).select("name email role username phone");
  res.json({ user: me });
});

module.exports = router;
