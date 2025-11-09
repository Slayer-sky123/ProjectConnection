// models/CompanyProfile.js
const mongoose = require("mongoose");

const companyProfileSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
      unique: true, // one profile per company account
    },
      user:  { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true }, 
    name: { type: String, required: true, trim: true },
    website: { type: String, trim: true },
    logoUrl: { type: String, trim: true },
    description: { type: String, trim: true },
    size: { type: String, enum: ["1-10", "11-50", "51-200", "201-500", "500+"], default: "1-10" },
    locations: { type: [String], default: [] },
    domains: { type: [String], default: [] },
    contactEmail: { type: String, trim: true },
    contactPhone: { type: String, trim: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("CompanyProfile", companyProfileSchema);
