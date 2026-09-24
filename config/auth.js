require("dotenv").config();

const required = (name) => {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `Не задана переменная окружения ${name} — см. .env.example`
    );
  }
  return value;
};

module.exports = {
  accessSecret: required("JWT_ACCESS_SECRET"),
  accessTtl: process.env.ACCESS_TOKEN_TTL || "15m",
  refreshTtlDays: Number(process.env.REFRESH_TOKEN_TTL_DAYS || 7),
  reuseGraceSeconds: Number(process.env.REFRESH_REUSE_GRACE_SECONDS ?? 10),
  refreshCookie: {
    name: "refresh_token",
    // кука уходит только на маршруты авторизации, а не с каждым запросом к API
    path: "/api/user",
  },
  isProduction: process.env.NODE_ENV === "production",
};
