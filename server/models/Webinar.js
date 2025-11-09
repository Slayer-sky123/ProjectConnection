// models/Webinar.js
const mongoose = require("mongoose");

function genId(prefix = "wb") {
  // e.g. wb_1712589123456_p8x2qf
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

const webinarSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    speaker: { type: String, default: "" },

    // When it starts and for how long
    startsAt: { type: Date },
    durationMins: { type: Number, default: 60, min: 1 },

    // Visibility: public | private | unlisted
    visibility: { type: String, enum: ["public", "private", "unlisted"], default: "public" },

    // Unique roomId for joining/viewing
    roomId: {
      type: String,
      unique: true,
      index: true,
      default: () => genId("room"),
    },

    // Meeting credentials (your internal signaling layer)
    meeting: {
      meetingId: { type: String, default: () => genId("mtg") },
      hostToken: { type: String, default: () => genId("host") },
      attendeeToken: { type: String, default: () => genId("join") },
    },

    // The company profile that hosts this webinar (REQUIRED)
    hostCompany: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CompanyProfile",
      required: true,
      index: true,
    },

    // Optional: who created it (User)
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Webinar", webinarSchema);
