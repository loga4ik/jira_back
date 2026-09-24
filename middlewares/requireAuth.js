const { verifyAccessToken } = require("../services/tokenService");

/** Пропускает только запросы с валидным access-токеном, кладёт req.userId. */
module.exports = function requireAuth(req, res, next) {
  const [scheme, token] = (req.get("Authorization") || "").split(" ");
  const userId = scheme === "Bearer" ? verifyAccessToken(token) : null;

  if (!userId) {
    return res.status(401).json({ message: "Требуется авторизация" });
  }

  req.userId = userId;
  next();
};
