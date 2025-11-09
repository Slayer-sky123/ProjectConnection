// server/middleware/upload.js
const path = require("path");
const fs = require("fs");
const multer = require("multer");

// ensure folder exists
const ensureDir = (dir) => {
  try { fs.mkdirSync(dir, { recursive: true }); } catch {}
};

const RESUME_DIR = path.join(__dirname, "..", "uploads", "resumes");
ensureDir(RESUME_DIR);

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, RESUME_DIR),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname || "").toLowerCase();
    const name = path.basename(file.originalname || "resume", ext)
      .replace(/[^\w\-]+/g, "_")
      .slice(0, 48);
    cb(null, `${Date.now()}_${name}${ext}`);
  },
});

const allowed = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "image/png",
  "image/jpeg",
  "image/webp",
]);

const fileFilter = (_req, file, cb) => {
  if (!allowed.has(file.mimetype)) {
    return cb(new Error("Unsupported file type"), false);
  }
  cb(null, true);
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

module.exports = upload;
