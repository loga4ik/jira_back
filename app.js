require("dotenv").config();
const http = require("http");
const express = require("express");
const morgan = require("morgan");
const cookieParser = require("cookie-parser");

// Проверка конфигурации при старте: без секрета для токенов сервер не поднимется,
// а не упадёт на первом же входе пользователя.
require("./config/auth");

const routes = require("./importRoutes");
const setupWebSocketServer = require("./wsServer");

const app = express();
const PORT = process.env.PORT ?? 3001;
const server = http.createServer(app);

app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  next();
});

app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use("/api", routes);
setupWebSocketServer(server);

server.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
});
