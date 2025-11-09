const mongoose = require("mongoose");

const partnershipSchema = new mongoose.Schema({
  company: { type: mongoose.Schema.Types.ObjectId, ref: "CompanyProfile", required: true },
  university: String,
  title: String,
  details: String,
  status: { type: String, enum: ["proposal","active","completed"], default: "proposal" },
}, { timestamps: true });
module.exports = mongoose.model("Partnership", partnershipSchema);
