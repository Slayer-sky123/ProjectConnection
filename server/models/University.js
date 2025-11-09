const mongoose = require("mongoose");

const UniversitySchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    username: { type: String, required: true, unique: true, index: true },

    name: { type: String, required: true },
    nameNorm: { type: String, required: true },

    passwordHash: { type: String, required: true }, // bcrypt hash

    website: { type: String, default: "" },
    accreditationId: { type: String, default: "" },

    contactEmail: { type: String, required: true },
    contactPhone: { type: String, required: true },

    address: {
      line1: { type: String, default: "" },
      line2: { type: String, default: "" },
      city: { type: String, default: "" },
      state: { type: String, default: "" },
      country: { type: String, default: "" },
      pincode: { type: String, default: "" },
    },

    departments: [{ type: String }],
    placementOfficer: {
      name: { type: String, default: "" },
      email: { type: String, default: "" },
      phone: { type: String, default: "" },
    },

    createdAt: { type: Date, default: Date.now },
  },
  { minimize: true }
);

module.exports = mongoose.model("University", UniversitySchema);
