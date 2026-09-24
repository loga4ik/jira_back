const Router = require("express").Router();
const bcrypt = require("bcryptjs");

const { user } = require("../db/models");
const requireAuth = require("../middlewares/requireAuth");
const authConfig = require("../config/auth");
const tokens = require("../services/tokenService");

const DAY_MS = 24 * 60 * 60 * 1000;

const refreshCookieOptions = {
  httpOnly: true, // недоступна из JavaScript — XSS не вытащит
  sameSite: "strict", // не уходит с запросами с чужих сайтов
  secure: authConfig.isProduction,
  path: authConfig.refreshCookie.path,
};

const setRefreshCookie = (res, token) =>
  res.cookie(authConfig.refreshCookie.name, token, {
    ...refreshCookieOptions,
    maxAge: authConfig.refreshTtlDays * DAY_MS,
  });

const clearRefreshCookie = (res) =>
  res.clearCookie(authConfig.refreshCookie.name, refreshCookieOptions);

const readRefreshCookie = (req) => req.cookies[authConfig.refreshCookie.name];

const userAgentOf = (req) => req.get("User-Agent") ?? null;

/** Пользователь без хеша пароля — на случай экземпляров, созданных через create(). */
const toPublicUser = (instance) => {
  const { password, ...rest } = instance.get({ plain: true });
  return rest;
};

/** Выдаёт пару токенов: access — в теле ответа, refresh — в httpOnly-куке. */
const startSession = async (req, res, account) => {
  await tokens.deleteExpiredTokens(account.id);
  const refreshToken = await tokens.issueRefreshToken({
    userId: account.id,
    userAgent: userAgentOf(req),
  });
  setRefreshCookie(res, refreshToken);
  res.json({
    accessToken: tokens.signAccessToken(account.id),
    user: toPublicUser(account),
  });
};

const serverError = (res, err) => {
  console.error(err);
  res.status(500).json({ message: "Ошибка сервера" });
};

// ---------- публичные маршруты ----------

Router.post("/login", async (req, res) => {
  const { login, password } = req.body;
  try {
    const account =
      login && (await user.scope("withPassword").findOne({ where: { login } }));
    const isMatch =
      account && password && (await bcrypt.compare(password, account.password));

    if (!isMatch) {
      return res.status(401).json({ message: "неверный логин или пароль" });
    }
    await startSession(req, res, account);
  } catch (err) {
    serverError(res, err);
  }
});

Router.post("/create", async (req, res) => {
  const { login, name, surname, patronymic, email, phone, password } = req.body;
  try {
    if (!login || !password) {
      return res.status(400).json({ message: "Логин и пароль обязательны" });
    }
    const isBusy = await user.findOne({ where: { login } });
    if (isBusy) {
      // 409, а не 401: запрос понятен, но конфликтует с существующими данными.
      // 401 к тому же заставил бы фронт пытаться обновить токен.
      return res.status(409).json({ message: "Этот логин уже занят" });
    }
    const account = await user.create({
      login,
      name,
      surname,
      patronymic,
      email,
      phone,
      password,
      role_id: 1,
    });
    await startSession(req, res, account);
  } catch (err) {
    serverError(res, err);
  }
});

Router.post("/refresh", async (req, res) => {
  try {
    const { userId, refreshToken } = await tokens.rotateRefreshToken(
      readRefreshCookie(req),
      userAgentOf(req)
    );
    const account = await user.findByPk(userId);
    if (!account) {
      clearRefreshCookie(res);
      return res.status(401).json({ message: "Сессия недействительна" });
    }
    setRefreshCookie(res, refreshToken);
    res.json({
      accessToken: tokens.signAccessToken(userId),
      user: toPublicUser(account),
    });
  } catch (err) {
    if (err instanceof tokens.RefreshError) {
      clearRefreshCookie(res);
      return res.status(401).json({ message: "Сессия истекла, войдите снова" });
    }
    serverError(res, err);
  }
});

// Логаут работает и с протухшим access-токеном: опирается только на refresh-куку.
Router.delete("/logOut", async (req, res) => {
  try {
    await tokens.revokeRefreshToken(readRefreshCookie(req));
    clearRefreshCookie(res);
    res.json("ok");
  } catch (err) {
    serverError(res, err);
  }
});

// ---------- защищённые маршруты ----------

Router.get("/", requireAuth, async (req, res) => {
  try {
    const data = await user.findByPk(req.userId);
    if (!data) {
      return res.status(401).json({ message: "Пользователь не найден" });
    }
    res.json(data);
  } catch (err) {
    serverError(res, err);
  }
});

Router.get("/getAllUsers", requireAuth, async (req, res) => {
  try {
    res.json(await user.findAll());
  } catch (err) {
    serverError(res, err);
  }
});

Router.get("/:id", requireAuth, async (req, res) => {
  try {
    res.json(await user.findAll({ where: { id: req.params.id } }));
  } catch (err) {
    serverError(res, err);
  }
});

Router.delete("/delete/:id", requireAuth, async (req, res) => {
  const id = Number(req.params.id);
  // Удалить можно только себя — раньше любой мог удалить любого.
  if (id !== req.userId) {
    return res.status(403).json({ message: "Можно удалить только свой аккаунт" });
  }
  try {
    res.json(await user.destroy({ where: { id } }));
  } catch (err) {
    serverError(res, err);
  }
});

module.exports = Router;
