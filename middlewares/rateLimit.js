const { rateLimit } = require("express-rate-limit");

/*
 * Ограничение частоты запросов к входу и регистрации — защита от подбора
 * пароля перебором и от массовой регистрации ботами. Счётчик по IP, в памяти
 * процесса: для одного сервера этого достаточно.
 *
 * Значения можно поменять переменными окружения (например, в тестах).
 */
const WINDOW_MS = 15 * 60 * 1000; // 15 минут

const limitResponse = (message) => (req, res) =>
  res.status(429).json({ message });

/** Вход: считаем только неудачные попытки — успешный вход счётчик не тратит. */
const loginLimiter = rateLimit({
  windowMs: WINDOW_MS,
  limit: Number(process.env.LOGIN_RATE_LIMIT || 10),
  skipSuccessfulRequests: true,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  handler: limitResponse("Слишком много попыток входа. Попробуйте через 15 минут"),
});

/** Регистрация: не больше нескольких аккаунтов с одного адреса. */
const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // час
  limit: Number(process.env.REGISTER_RATE_LIMIT || 10),
  standardHeaders: "draft-8",
  legacyHeaders: false,
  handler: limitResponse("Слишком много регистраций с этого адреса. Попробуйте позже"),
});

module.exports = { loginLimiter, registerLimiter };
