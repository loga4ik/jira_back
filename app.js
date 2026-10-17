require("dotenv").config();
const http = require("http");
const express = require("express");
const morgan = require("morgan");
const cookieParser = require("cookie-parser");

// Проверка конфигурации при старте: без секрета для токенов сервер не поднимется,
// а не упадёт на первом же входе пользователя.
require("./config/auth");

const routes = require("./importRoutes");
const cors = require("./middlewares/cors");
const setupWebSocketServer = require("./wsServer");

const app = express();
const PORT = process.env.PORT ?? 3001;
const server = http.createServer(app);

// не сообщаем всем подряд, на чём написан сервер
app.disable("x-powered-by");
// за прокси хостинга (Render, Railway) IP клиента приходит в X-Forwarded-For —
// без этого ограничение попыток входа считало бы всех одним пользователем
if (process.env.TRUST_PROXY) app.set("trust proxy", Number(process.env.TRUST_PROXY));

app.use(cors);

app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use("/api", routes);
setupWebSocketServer(server);

server.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
});
