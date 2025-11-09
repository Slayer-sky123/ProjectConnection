const router = require("express").Router();
const crypto = require("crypto");
const mongoose = require("mongoose");

const auth = require("../../middleware/auth");
const User = require("../../models/User");
const University = require("../../models/University");
const Certificate = require("../../models/Certificate");

const normalizeUniName =
  (User && User.normalizeUniName) ||
  ((s = "") => String(s).toLowerCase().replace(/[^a-z0-9]/g, ""));

function genHash(seed = "") {
  const h = crypto
    .createHash("sha256")
    .update(seed + "::" + Date.now() + "::" + crypto.randomBytes(8).toString("hex"))
    .digest("hex");
  return h.slice(0, 16);
}

/* ===================== STUDENT: my certificates ===================== */
router.get("/mine", auth, async (req, res) => {
  try {
    if (req.user?.role !== "student") return res.status(403).json({ message: "Forbidden" });

    const rows = await Certificate.find({ student: req.user.id })
      .populate({ path: "university", select: "name username", options: { strictPopulate: false } })
      .sort({ issueDate: -1, createdAt: -1 })
      .lean();

    res.json(rows || []);
  } catch (e) {
    console.error("certificates/mine error:", e);
    res.json([]);
  }
});

/* ===================== PUBLIC: verify by hash ===================== */
router.get("/public/:hash", async (req, res) => {
  try {
    const hash = String(req.params.hash || "").trim();
    if (!hash) return res.status(400).json({ ok: false, message: "Missing verification hash" });

    const cert = await Certificate.findOne({ hash })
      .populate({ path: "student", select: "name email studentId", options: { strictPopulate: false } })
      .populate({ path: "university", select: "name username", options: { strictPopulate: false } })
      .lean();

    if (!cert) return res.status(404).json({ ok: false, message: "Certificate not found" });

    // Only expose essential public fields
    res.json({
      ok: true,
      certificate: {
        _id: cert._id,
        title: cert.title,
        description: cert.description || "",
        issueDate: cert.issueDate,
        status: cert.status, // "issued" | "revoked"
        hash: cert.hash,
        serial: cert.serial || null,
        publicId: cert.publicId || null,
        student: cert.student
          ? { name: cert.student.name, email: cert.student.email, studentId: cert.student.studentId || null }
          : null,
        university: cert.university
          ? { name: cert.university.name, username: cert.university.username }
          : null,
      },
    });
  } catch (e) {
    console.error("certificates/public error:", e);
    res.status(500).json({ ok: false, message: "Server error" });
  }
});

/* ===================== UNIVERSITY: list/search/create ===================== */
router.get("/:username/list", auth, async (req, res) => {
  try {
    if (req.user?.role !== "university") return res.status(403).json({ message: "Forbidden" });

    const uni = await University.findOne({ user: req.user.id }).lean();
    if (!uni || uni.username !== req.params.username) return res.status(403).json({ message: "Forbidden" });

    const rows = await Certificate.find({ university: uni._id })
      .populate({ path: "student", select: "name email studentId university", options: { strictPopulate: false } })
      .sort({ createdAt: -1 })
      .lean();

    res.json(rows || []);
  } catch (e) {
    console.error("certificates/:username/list error:", e);
    res.json([]);
  }
});

/* generic alias retained */
router.get("/university/:username", auth, async (req, res) => {
  try {
    if (req.user?.role !== "university") return res.status(403).json({ message: "Forbidden" });

    const uni = await University.findOne({ user: req.user.id }).lean();
    if (!uni || uni.username !== req.params.username) return res.status(403).json({ message: "Forbidden" });

    const rows = await Certificate.find({ university: uni._id })
      .populate({ path: "student", select: "name email studentId university", options: { strictPopulate: false } })
      .sort({ createdAt: -1 })
      .lean();

    res.json(rows || []);
  } catch (e) {
    console.error("certificates/university error:", e);
    res.json([]);
  }
});

/* student search (by name/email/StudentID) under university scope */
router.get("/:username/search-students", auth, async (req, res) => {
  try {
    if (req.user?.role !== "university") return res.status(403).json({ message: "Forbidden" });

    const uni = await University.findOne({ user: req.user.id }).lean();
    if (!uni || uni.username !== req.params.username) return res.status(403).json({ message: "Forbidden" });

    const q = String(req.query.q || "").trim().toLowerCase();
    const uniNorm = normalizeUniName(uni.name || "");

    const students = await User.find({ role: "student", universityNorm: uniNorm })
      .select("_id name email studentId university")
      .lean();

    const filtered = students.filter((s) => {
      const blob = [s.name || "", s.email || "", s.studentId || ""].join(" ").toLowerCase();
      return !q || blob.includes(q);
    });

    res.json(filtered.slice(0, 50));
  } catch (e) {
    console.error("certificates/:username/search-students error:", e);
    res.json([]);
  }
});

/* create / issue certificate */
router.post("/:username/create", auth, async (req, res) => {
  try {
    if (req.user?.role !== "university") return res.status(403).json({ message: "Forbidden" });

    const uni = await University.findOne({ user: req.user.id }).lean();
    if (!uni || uni.username !== req.params.username) return res.status(403).json({ message: "Forbidden" });

    const { studentKey, title, description = "", issueDate } = req.body || {};
    if (!studentKey || !title) return res.status(400).json({ message: "studentKey and title are required" });

    // find student within the same uni
    const uniNorm = normalizeUniName(uni.name || "");
    let student = null;

    if (mongoose.isValidObjectId(studentKey)) {
      student = await User.findOne({ _id: studentKey, role: "student", universityNorm: uniNorm }).lean();
    }
    if (!student && /^\d{6}$/.test(String(studentKey))) {
      student = await User.findOne({ studentId: String(studentKey), role: "student", universityNorm: uniNorm }).lean();
    }
    if (!student && /@/.test(String(studentKey))) {
      student = await User.findOne({ email: String(studentKey).toLowerCase(), role: "student", universityNorm: uniNorm }).lean();
    }
    if (!student) return res.status(404).json({ message: "Student not found under this university" });

    // generate non-colliding identifiers
    const mkSerial = () => "SR-" + genHash(`${uni._id}:${student._id}`).toUpperCase();
    const mkPublicId = () => "C-" + genHash(`${student._id}:${Date.now()}`).toUpperCase();
    const mkHash = () => genHash(`${student._id}:${title}:${Date.now()}`);

    let serial = mkSerial();
    while (await Certificate.findOne({ serial }).lean()) serial = mkSerial();

    let publicId = mkPublicId();
    while (await Certificate.findOne({ publicId }).lean()) publicId = mkPublicId();

    let hash = mkHash();
    while (await Certificate.findOne({ hash }).lean()) hash = mkHash();

    const cert = await Certificate.create({
      student: student._id,
      university: uni._id,
      title: String(title).trim(),
      description: String(description || "").trim(),
      issueDate: issueDate ? new Date(issueDate) : new Date(),
      status: "issued",               // enum: ["issued","revoked"]
      hash,
      serial,
      publicId,
      studentName: student.name,
      studentEmail: student.email,
      universityUsername: uni.username,
      extras: { studentId: student.studentId || "" },
    });

    res.status(201).json(cert);
  } catch (e) {
    console.error("certificates/:username/create error:", e);
    if (e?.code === 11000) {
      return res.status(409).json({ message: "Duplicate certificate identifiers, please retry." });
    }
    res.status(500).json({ message: "Could not create certificate" });
  }
});

/* revoke */
router.patch("/:id/revoke", auth, async (req, res) => {
  try {
    if (req.user?.role !== "university") return res.status(403).json({ message: "Forbidden" });
    const uni = await University.findOne({ user: req.user.id }).lean();
    if (!uni) return res.status(403).json({ message: "Forbidden" });

    const cert = await Certificate.findById(req.params.id).lean();
    if (!cert || String(cert.university) !== String(uni._id)) {
      return res.status(404).json({ message: "Certificate not found" });
    }

    await Certificate.updateOne({ _id: cert._id }, { $set: { status: "revoked" } });
    const fresh = await Certificate.findById(cert._id).lean();
    res.json(fresh);
  } catch (e) {
    console.error("certificates/revoke error:", e);
    res.status(500).json({ message: "Could not revoke certificate" });
  }
});

/* un-revoke */
router.patch("/:id/unrevoke", auth, async (req, res) => {
  try {
    if (req.user?.role !== "university") return res.status(403).json({ message: "Forbidden" });
    const uni = await University.findOne({ user: req.user.id }).lean();
    if (!uni) return res.status(403).json({ message: "Forbidden" });

    const cert = await Certificate.findById(req.params.id).lean();
    if (!cert || String(cert.university) !== String(uni._id)) {
      return res.status(404).json({ message: "Certificate not found" });
    }

    await Certificate.updateOne({ _id: cert._id }, { $set: { status: "issued" } });
    const fresh = await Certificate.findById(cert._id).lean();
    res.json(fresh);
  } catch (e) {
    console.error("certificates/unrevoke error:", e);
    res.status(500).json({ message: "Could not un-revoke certificate" });
  }
});

/* delete */
router.delete("/:id", auth, async (req, res) => {
  try {
    if (req.user?.role !== "university") return res.status(403).json({ message: "Forbidden" });
    const uni = await University.findOne({ user: req.user.id }).lean();
    if (!uni) return res.status(403).json({ message: "Forbidden" });

    const cert = await Certificate.findById(req.params.id).lean();
    if (!cert || String(cert.university) !== String(uni._id)) {
      return res.status(404).json({ message: "Certificate not found" });
    }

    await Certificate.deleteOne({ _id: cert._id });
    res.json({ ok: true });
  } catch (e) {
    console.error("certificates/delete error:", e);
    res.status(500).json({ message: "Could not delete certificate" });
  }
});

module.exports = router;
