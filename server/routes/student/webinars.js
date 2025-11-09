// routes/student/webinars.js
const express = require("express");
const router = express.Router();
const Webinar = require("../../models/Webinar");

// NOTE: Browsing webinars should be public for better UX. No auth required here.

// GET /api/student/webinars -> public, upcoming or recently started
router.get("/", async (_req, res) => {
  try {
    const now = new Date();
    const list = await Webinar.find({
      visibility: "public",
      startsAt: { $gte: new Date(now.getTime() - 60 * 60 * 1000) }, // within last hour or future
    })
      .sort({ startsAt: 1 })
      .select("title speaker startsAt durationMins roomId company")
      .lean();
    res.json(list);
  } catch (e) {
    console.error("List student webinars failed:", e);
    res.status(500).json({ message: "Server error" });
  }
});

// GET /api/student/webinars/:roomId -> details for viewer
router.get("/:roomId", async (req, res) => {
  try {
    const w = await Webinar.findOne({ roomId: req.params.roomId, visibility: "public" })
      .select("-meeting.hostToken")
      .lean();
    if (!w) return res.status(404).json({ message: "Webinar not found" });
    res.json(w);
  } catch (e) {
    console.error("Get webinar failed:", e);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
