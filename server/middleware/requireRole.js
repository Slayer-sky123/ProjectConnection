// server/middleware/requireRole.js
module.exports = function requireRole(required) {
  const allowed = new Set(Array.isArray(required) ? required : [required]);
  return function (req, res, next) {
    const role = req.user?.role;
    if (role === "admin" || allowed.has(role)) return next();
    return res.status(403).json({ message: "Forbidden" });
  };
};
