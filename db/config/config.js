/**
 * Подключение к базе — из переменных окружения, а не из файла в git.
 * Раньше логин и пароль Postgres лежали в db/config/database.json
 * и уходили в репозиторий вместе с кодом.
 *
 * Два способа задать подключение (см. .env.example):
 *  - DATABASE_URL — одной строкой, так его выдают хостинги (Render, Railway);
 *  - DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD — по отдельности, для локальной базы.
 *
 * Файл читают и приложение (db/models/index.js), и sequelize-cli (.sequelizerc).
 */
require("dotenv").config();

const env = process.env;

const common = {
  dialect: env.DB_DIALECT || "postgres",
  // для тестов на SQLite: DB_DIALECT=sqlite DB_STORAGE=/tmp/test.sqlite
  storage: env.DB_STORAGE,
  // хостинги принимают подключение к Postgres только по TLS
  dialectOptions:
    env.DB_SSL === "true"
      ? { ssl: { require: true, rejectUnauthorized: false } }
      : undefined,
};

const connection = env.DATABASE_URL
  ? { ...common, use_env_variable: "DATABASE_URL" }
  : {
      ...common,
      host: env.DB_HOST || "127.0.0.1",
      port: Number(env.DB_PORT || 5432),
      database: env.DB_NAME || "jira",
      username: env.DB_USER || "postgres",
      password: env.DB_PASSWORD,
    };

// Одни и те же настройки для всех окружений: различаются только значения
// переменных на конкретной машине.
module.exports = {
  development: connection,
  test: connection,
  production: connection,
};
