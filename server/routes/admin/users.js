const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");

const adminAuth = require("../../middleware/adminAuth");
const User = require("../../models/User");

// GET /api/admin/users
router.get("/", adminAuth, async (req, res) => {
  const { q = "", role = "", page = 1, limit = 20, sort = "-createdAt" } = req.query;

  const find = {};
  if (role) find.role = role;
  if (q) {
    const re = new RegExp(String(q).trim(), "i");
    find.$or = [
      { name: re },
      { email: re },
      { username: re },
      { phone: re },
      { university: re },
      { education: re },
    ];
  }

  const pg = Math.max(1, parseInt(page, 10) || 1);
  const lim = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));

  try {
    const [items, total] = await Promise.all([
      User.find(find).select("-password").sort(sort).skip((pg - 1) * lim).limit(lim).lean(),
      User.countDocuments(find),
    ]);
    res.json({ items, total, page: pg, pages: Math.ceil(total / lim) });
  } catch (e) {
    console.error("Admin users list failed:", e.message);
    res.status(500).json({ message: "Failed to fetch users" });
  }
});

// GET /api/admin/users/:id
router.get("/:id", adminAuth, async (req, res) => {
  try {
    const u = await User.findById(req.params.id).select("-password").lean();
    if (!u) return res.status(404).json({ message: "User not found" });
    res.json(u);
  } catch {
    res.status(500).json({ message: "Failed to fetch user" });
  }
});

// PUT /api/admin/users/:id
router.put("/:id", adminAuth, async (req, res) => {
  const allowed = ["name", "username", "email", "phone", "university", "education", "skills"];
  const payload = {};
  for (const k of allowed) if (k in req.body) payload[k] = req.body[k];
  if (typeof payload.email === "string") payload.email = payload.email.toLowerCase().trim();
  if (typeof payload.username === "string") payload.username = payload.username.trim();
  if (typeof payload.skills === "string") {
    payload.skills = payload.skills.split(",").map((s) => s.trim()).filter(Boolean);
  }
  try {
    const updated = await User.findByIdAndUpdate(req.params.id, { $set: payload }, { new: true })
      .select("-password")
      .lean();
    if (!updated) return res.status(404).json({ message: "User not found" });
    res.json(updated);
  } catch {
    res.status(500).json({ message: "Update failed" });
  }
});

// PATCH /api/admin/users/:id/role
router.patch("/:id/role", adminAuth, async (req, res) => {
  const { role } = req.body || {};
  if (!["student", "company", "admin"].includes(role)) {
    return res.status(400).json({ message: "Invalid role" });
  }
  try {
    const updated = await User.findByIdAndUpdate(req.params.id, { $set: { role } }, { new: true })
      .select("-password")
      .lean();
    if (!updated) return res.status(404).json({ message: "User not found" });
    res.json(updated);
  } catch {
    res.status(500).json({ message: "Role update failed" });
  }
});

// POST /api/admin/users/:id/reset-password
router.post("/:id/reset-password", adminAuth, async (req, res) => {
  const { newPassword } = req.body || {};
  if (!newPassword || newPassword.length < 6) {
    return res.status(400).json({ message: "Password must be at least 6 characters" });
  }
  try {
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(newPassword, salt);
    const ok = await User.updateOne({ _id: req.params.id }, { $set: { password: hash } });
    if (!ok.matchedCount) return res.status(404).json({ message: "User not found" });
    res.json({ message: "Password updated" });
  } catch {
    res.status(500).json({ message: "Reset failed" });
  }
});

module.exports = router;
