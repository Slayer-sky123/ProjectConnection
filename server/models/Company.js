const mongoose = require("mongoose");

const companySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    website: { type: String, default: "" },
    logoUrl: { type: String, default: "" },
    hq: { type: String, default: "" },
    about: { type: String, default: "" },
    // optional: link to user account that owns this company profile
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Company", companySchema);
