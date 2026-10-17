const express = require("express");
const serverError = require("../services/serverError");
const router = express.Router();
const { message, user } = require("../db/models");
const { requireProjectMember } = require("../middlewares/projectAccess");

// Получение всех сообщений для конкретного проекта.
// Переписку видят и пишут только участники — проверяет requireProjectMember.
router.get("/:projectId", requireProjectMember((req) => req.params.projectId), async (req, res) => {
  const projectId = req.projectId;
  try {
    const messages = await message.findAll({
      where: {
        project_id: projectId,
      },
    });
    messages.map(async (item) => {
      const login = await user.findOne({
        attributes: ["login"],
        where: { id: item.user_id },
      });
      item.dataValues.login = login;
    }).dataValues;

    res.json(messages);
  } catch (err) {
    serverError(res, err);
  }
});

// Отправка сообщения в проект
router.post("/:projectId", requireProjectMember((req) => req.params.projectId), async (req, res) => {
  const projectId = req.projectId;
  const { text } = req.body;
  try {
    // автор — тот, чей токен, а не то, что прислал клиент
    const newMessage = await message.create({
      user_id: req.userId,
      project_id: projectId,
      text,
    });
    res.status(201).json(newMessage);
  } catch (err) {
    serverError(res, err);
  }
});

module.exports = router;
