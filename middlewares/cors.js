/**
 * CORS только для своих адресов фронтенда.
 *
 * Раньше сервер отвечал Access-Control-Allow-Origin: * — то есть разрешал
 * обращаться к API со страниц любого сайта. В разработке CORS вообще не нужен:
 * Vite проксирует /api, и браузер видит один адрес. Нужен он, когда фронт и бэк
 * живут на разных доменах (деплой) — тогда домен фронта указывается в
 * CLIENT_ORIGIN, через запятую, если их несколько.
 *
 * Allow-Credentials нужен, чтобы браузер отправлял refresh-куку на другой домен.
 * С ним нельзя отвечать «*» — только конкретным адресом.
 */
const allowedOrigins = (process.env.CLIENT_ORIGIN ?? "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const cors = (req, res, next) => {
  const origin = req.get("Origin");

  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Access-Control-Allow-Credentials", "true");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  }
  // ответ зависит от Origin — кэши (CDN, браузер) должны это учитывать
  res.setHeader("Vary", "Origin");

  // предварительный запрос браузера: отвечаем сразу, дальше в роуты не пускаем
  if (req.method === "OPTIONS") return res.sendStatus(204);
  next();
};

module.exports = cors;
