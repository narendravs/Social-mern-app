const { verifyAccessToken } = require("../utils/jwt");

function auth(req, res, next) {
  // Expect Authorization: Bearer <token>
  const authHeader = req.headers["authorization"] || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!token)
    return res.status(401).json({
      error: { code: "UNAUTHORIZED", message: "Missing access token" },
    });
  try {
    const decoded = verifyAccessToken(token);
    req.user = { id: decoded.sub, roles: decoded.roles || [] };
    return next();
  } catch (err) {
    return res.status(401).json({
      error: { code: "UNAUTHORIZED", message: "Invalid or expired token" },
    });
  }
}

module.exports = auth;
