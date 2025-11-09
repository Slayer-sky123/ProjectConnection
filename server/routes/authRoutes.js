const express = require("express");
const router = express.Router();

const { registerUser, loginUser } = require("../controllers/authController");
const auth = require("../middleware/auth");

const User = require("../models/User");
const University = require("../models/University");

/* ============================================================================
 * AUTH ROUTES
 * Single login/register endpoints shared across stakeholders (student/university/company).
 * - University credentials are verified against the University model (passwordHash).
 * - Student/Company/Admin credentials are verified against the User model.
 * - /auth/me returns the currently authenticated principal (based on JWT).
 * ========================================================================== */

/* ----------------------------- REGISTER (POST) ----------------------------- */
// @route   POST /api/auth/register
// @desc    Register new user (student/company). University signup uses /api/university/register.
router.post("/register", registerUser);

/* -------------------------------- LOGIN ----------------------------------- */
// @route   POST /api/auth/login
// @desc    Login (student/company/university)
// Body: { identifier, password, role? }
router.post("/login", loginUser);

/* --------------------------- CHECK USERNAME (GET) -------------------------- */
// @route   GET /api/auth/check-username?username=xyz
// @desc    Check if a username is available (User collection — includes university usernames too)
router.get("/check-username", async (req, res) => {
  const { username } = req.query;

  if (!username) {
    return res.status(400).json({ message: "Username is required" });
  }

  try {
    const uname = String(username).toLowerCase();
    const existingUser = await User.findOne({ username: uname });
    // If a University was created properly, a mirrored User with role=university also exists,
    // so checking User is sufficient. (No need to check University.username separately.)
    res.json({ available: !existingUser });
  } catch (err) {
    console.error("Error checking username:", err.message);
    res.status(500).json({ message: "Server error" });
  }
});

/* --------------------------------- ME (GET) -------------------------------- */
// @route   GET /api/auth/me
// @desc    Return minimal profile for the current token holder
router.get("/me", auth, async (req, res) => {
  try {
    const me = await User.findById(req.user.id).select("-password");
    if (!me) return res.status(404).json({ message: "User not found" });

    // If this is a university user, include university profile snapshot
    if (me.role === "university") {
      const uni = await University.findOne({ username: me.username }).lean();
      return res.json({
        id: me._id,
        role: me.role,
        username: me.username,
        name: uni?.name || me.name || "University",
        email: uni?.contactEmail || me.email,
        phone: uni?.contactPhone || me.phone,
      });
    }

    // Student / company / admin
    res.json({
      id: me._id,
      role: me.role,
      username: me.username,
      name: me.name,
      email: me.email,
      phone: me.phone,
      studentId: me.studentId || null,
    });
  } catch (e) {
    console.error("GET /auth/me error:", e?.message || e);
    res.status(500).json({ message: "Unable to resolve session" });
  }
});

module.exports = router;
