/**
 * Ответ 500 без подробностей. Раньше в ответ уходил сам объект ошибки
 * Sequelize (res.status(500).json(err)) — с текстом SQL-запроса, именами
 * таблиц и полей. Подробности нужны разработчику, а не клиенту: они
 * остаются в логе сервера.
 */
const serverError = (res, err) => {
  console.error(err);
  res.status(500).json({ message: "Ошибка сервера" });
};

module.exports = serverError;
