const mongoose = require("mongoose");

const AdminSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    username: { type: String, required: true, unique: true, trim: true },
    phone: { type: String, required: true, trim: true },
    password: { type: String, required: true }, // hashed
    role: { type: String, default: "admin" },   // keep it simple, no enum collision with User
    name: { type: String, default: "Admin" }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Admin", AdminSchema);
