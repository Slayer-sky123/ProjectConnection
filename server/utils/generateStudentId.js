const User = require("../models/User");

/**
 * Generate a unique 6-digit studentId.
 * Ensures no collision in the User collection.
 */
async function generateUniqueStudentId() {
  let id;
  let exists = true;

  while (exists) {
    id = String(Math.floor(100000 + Math.random() * 900000)); // 6-digit
    exists = await User.findOne({ studentId: id }).lean();
  }

  return id;
}

module.exports = { generateUniqueStudentId };
