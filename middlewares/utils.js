const { project, team, user } = require("../db/models");
const { Op } = require("sequelize");

const getFreeAndActiveUsers = async (project_id, req) => {
  try {
    // Получаем активных пользователей команды
    const teamActiveUsers = await team.findAll({
      where: { project_id },
    });

    const activeUserIds = teamActiveUsers.map((user) => user.user_id);

    // Получаем текущего пользователя
    const currentUserId = req.session.user_id;

    // Убираем текущего пользователя из списка активных пользователей
    const filteredActiveUserIds = activeUserIds.filter(id => id !== currentUserId);

    // Получаем свободных пользователей
    const freeUsers = await user.findAll({
      attributes: ["id", "login", "name", "surname", "profile_image"],
      where: {
        id: {
          [Op.notIn]: [...filteredActiveUserIds, currentUserId],
        },
      },
    });

    // Получаем активных пользователей (исключая текущего)
    const activeUsers = await user.findAll({
      attributes: ["id", "login", "name", "surname", "profile_image"],
      where: {
        id: filteredActiveUserIds,
      },
    });

    return { freeUsers, activeUsers };
  } catch (error) {
    console.error(
      "Ошибка при получении свободных и активных пользователей:",
      error
    );
    throw new Error("Не удалось получить пользователей");
  }
};

module.exports = getFreeAndActiveUsers;
