const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const { Op } = require("sequelize");
const { refresh_token } = require("../db/models");
const authConfig = require("../config/auth");

/**
 * Схема авторизации:
 * - access-токен — JWT на 15 минут. Проверяется по подписи, без обращения к базе,
 *   поэтому дёшев на каждом запросе, но отозвать его нельзя — отсюда короткий срок.
 * - refresh-токен — случайная строка на 7 дней в httpOnly-куке. Проверяется
 *   по таблице refresh_tokens, поэтому его можно отозвать (логаут, кража).
 *   В базе хранится только SHA-256 от токена: у случайных 256 бит нечего
 *   подбирать, медленный bcrypt тут не нужен, а детерминированный хеш
 *   позволяет искать запись по индексу.
 */

const ALGORITHM = "HS256";
const DAY_MS = 24 * 60 * 60 * 1000;

class RefreshError extends Error {}

const hashToken = (raw) =>
  crypto.createHash("sha256").update(raw).digest("hex");

const signAccessToken = (userId) =>
  jwt.sign({ sub: String(userId) }, authConfig.accessSecret, {
    algorithm: ALGORITHM,
    expiresIn: authConfig.accessTtl,
  });

/** id пользователя из токена или null, если токен невалиден или просрочен. */
const verifyAccessToken = (token) => {
  if (!token) return null;
  try {
    // алгоритм фиксируем явно: иначе токен с подменённым alg в заголовке
    // мог бы пройти проверку другим способом
    const payload = jwt.verify(token, authConfig.accessSecret, {
      algorithms: [ALGORITHM],
    });
    const userId = Number(payload.sub);
    return Number.isInteger(userId) ? userId : null;
  } catch {
    return null;
  }
};

/** Новый refresh-токен. В базу уходит хеш, наружу — сам токен. */
const issueRefreshToken = async ({
  userId,
  familyId = crypto.randomUUID(),
  userAgent = null,
}) => {
  const raw = crypto.randomBytes(32).toString("base64url");
  await refresh_token.create({
    user_id: userId,
    token_hash: hashToken(raw),
    family_id: familyId,
    expires_at: new Date(Date.now() + authConfig.refreshTtlDays * DAY_MS),
    user_agent: userAgent,
  });
  return raw;
};

const revokeFamily = (familyId) =>
  refresh_token.update(
    { revoked_at: new Date() },
    { where: { family_id: familyId, revoked_at: null } }
  );

/**
 * Ротация: обмен refresh-токена на новый из той же цепочки (family).
 * Если уже обменянный токен предъявили повторно — значит, у кого-то есть копия.
 * Гасим всю цепочку: разлогинит и владельца, и того, кто украл, но владелец
 * войдёт заново паролем, а укравший — нет.
 */
const rotateRefreshToken = async (raw, userAgent = null) => {
  if (!raw) throw new RefreshError("нет refresh-токена");

  const record = await refresh_token.findOne({
    where: { token_hash: hashToken(raw) },
  });
  if (!record || record.revoked_at || record.expires_at < new Date()) {
    throw new RefreshError("refresh-токен недействителен");
  }

  // Помечаем токен использованным атомарно: из двух одновременных запросов
  // с одним и тем же токеном условие used_at IS NULL выполнится только у одного.
  const [claimed] = await refresh_token.update(
    { used_at: new Date() },
    { where: { id: record.id, used_at: null } }
  );

  if (!claimed) {
    await record.reload();
    const secondsSinceUse = (Date.now() - record.used_at.getTime()) / 1000;
    if (secondsSinceUse > authConfig.reuseGraceSeconds) {
      await revokeFamily(record.family_id);
      throw new RefreshError("повторное использование refresh-токена");
    }
    // Токен обменяли только что — это соседняя вкладка обновилась
    // одновременно с нами, а не кража. Выдаём ей свой токен в той же цепочке.
  }

  const refreshToken = await issueRefreshToken({
    userId: record.user_id,
    familyId: record.family_id,
    userAgent,
  });
  return { userId: record.user_id, refreshToken };
};

/** Логаут: гасим цепочку текущего устройства. */
const revokeRefreshToken = async (raw) => {
  if (!raw) return;
  const record = await refresh_token.findOne({
    where: { token_hash: hashToken(raw) },
  });
  if (record) await revokeFamily(record.family_id);
};

/** Чистим просроченные записи пользователя, чтобы таблица не росла бесконечно. */
const deleteExpiredTokens = (userId) =>
  refresh_token.destroy({
    where: { user_id: userId, expires_at: { [Op.lt]: new Date() } },
  });

module.exports = {
  RefreshError,
  signAccessToken,
  verifyAccessToken,
  issueRefreshToken,
  rotateRefreshToken,
  revokeRefreshToken,
  deleteExpiredTokens,
};
