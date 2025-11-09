const jwt = require("jsonwebtoken");

/**
 * Generic JWT middleware.
 * - Expects Authorization: Bearer <token>
 * - Attaches req.user = { id, role }
 */
module.exports = function (req, res, next) {
  const authHeader = req.headers["authorization"];
  if (!authHeader) {
    return res.status(401).json({ message: "No token, authorization denied" });
  }

  const token = authHeader.split(" ")[1];
  if (!token) {
    return res.status(401).json({ message: "Invalid token format" });
  }

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "dev_secret_change_me"
    );
    req.user = decoded; // { id, role }
    next();
  } catch (err) {
    console.error("auth middleware error:", err.message);
    return res.status(401).json({ message: "Token is not valid" });
  }
};
