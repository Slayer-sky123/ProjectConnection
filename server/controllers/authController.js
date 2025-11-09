// server/controllers/authController.js
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const University = require("../models/University");
const { generateUniqueStudentId } = require("../utils/generateStudentId");

const sign = (user) =>
  jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET || "dev_secret_change_me",
    { expiresIn: "7d" }
  );

/* -------------------------------- register -------------------------------- */
exports.registerUser = async (req, res) => {
  try {
    const { name, username, email, password, phone, role, university, education, skills } = req.body;

    const exists = await User.findOne({
      $or: [{ email: String(email).toLowerCase() }, { username: String(username).toLowerCase() }],
    });
    if (exists) return res.status(409).json({ message: "User already exists" });

    const hashed = await bcrypt.hash(String(password), 10);

    // Allocate studentId only for students
    let studentId = null;
    const roleNorm = (role || "student").toLowerCase();
    if (roleNorm === "student") {
      studentId = await generateUniqueStudentId();
    }

    const user = await User.create({
      name,
      username: String(username).toLowerCase(),
      email: String(email).toLowerCase(),
      password: hashed,
      phone,
      role: roleNorm,
      university: university || "",
      education: education || "UG",
      skills: (skills || "").split(",").map((s) => s.trim()).filter(Boolean),
      studentId,
    });

    const token = sign(user);
    res.json({
      token,
      user: { id: user._id, role: user.role, name: user.name, studentId: user.studentId || null },
    });
  } catch (e) {
    console.error(e);
    if (e?.code === 11000) {
      const k = Object.keys(e.keyPattern || {})[0] || "field";
      return res.status(409).json({ message: `Duplicate ${k}. Please try a different value.` });
    }
    res.status(500).json({ message: "Registration failed" });
  }
};

/* --------------------------------- login ---------------------------------- */
/**
 * Unified login for all stakeholders.
 *
 * IMPORTANT for your UI:
 * - Your login form **does not send `role`**. This controller automatically detects
 *   university logins by looking up `University` by username/contactEmail and
 *   authenticating against `University.passwordHash`.
 * - If not a university, it falls back to the regular `User` model auth.
 * - If you DO send `role: "university"`, it forces the university path (backward compatible).
 */
exports.loginUser = async (req, res) => {
  try {
    const { identifier, password, role } = req.body;
    const idLower = String(identifier || "").toLowerCase();
    const roleNorm = (role || "").toLowerCase();

    /* -------- Path A: University login (explicit role OR auto-detection) -------- */
    let maybeUni = null;

    // If the caller explicitly says "university", try university auth first.
    if (roleNorm === "university") {
      maybeUni = await University.findOne({
        $or: [{ username: idLower }, { contactEmail: idLower }],
      }).lean();
    } else {
      // Auto-detect: if identifier matches a University record, treat this as a university login
      maybeUni = await University.findOne({
        $or: [{ username: idLower }, { contactEmail: idLower }],
      }).lean();
    }

    if (maybeUni) {
      const ok = await bcrypt.compare(String(password), String(maybeUni.passwordHash || ""));
      if (!ok) return res.status(400).json({ message: "Invalid credentials" });

      // We still issue JWT from the linked User row (role=university), created during /university/register
      const uniUser = await User.findOne({ role: "university", username: maybeUni.username });
      if (!uniUser) return res.status(500).json({ message: "Linked university account missing" });

      const token = sign(uniUser);
      return res.json({
        token,
        user: {
          id: uniUser._id,
          role: uniUser.role,
          name: maybeUni.name,
          username: maybeUni.username, // critical for /university/:username/... redirects
          email: maybeUni.contactEmail,
          phone: maybeUni.contactPhone,
        },
      });
    }

    /* --------------------------- Path B: User login --------------------------- */
    // Student / Company / Admin (and any non-university credential)
    const query = idLower.includes("@") ? { email: idLower } : { username: idLower };
    const user = await User.findOne(query);
    if (!user) return res.status(400).json({ message: "Invalid credentials" });

    // If role was provided and mismatches actual role, block (prevents cross-role misuse)
    if (role && role.toLowerCase() !== user.role) return res.status(403).json({ message: "Role mismatch" });

    const ok = await bcrypt.compare(String(password), String(user.password));
    if (!ok) return res.status(400).json({ message: "Invalid credentials" });

    // Backfill studentId for legacy student accounts
    if (user.role === "student" && !user.studentId) {
      try {
        const sid = await generateUniqueStudentId();
        user.studentId = sid;
        await user.save();
      } catch (err) {
        console.warn("studentId backfill on login failed:", err?.message || err);
      }
    }

    const token = sign(user);

    // Include username if this is a university user row (rarely used directly—your front uses University creds)
    const payload = { id: user._id, role: user.role, name: user.name, studentId: user.studentId || null };
    if (user.role === "university") payload.username = user.username;

    res.json({ token, user: payload });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Login failed" });
  }
};
