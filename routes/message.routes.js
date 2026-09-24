const express = require("express");
const router = express.Router();
const { message, user } = require("../db/models");
const { isProjectMember } = require("../services/access");

// Получение всех сообщений для конкретного проекта
router.get("/:projectId", async (req, res) => {
  const projectId = Number(req.params.projectId);
  try {
    // переписку проекта видят только его участники
    if (!(await isProjectMember(req.userId, projectId))) {
      return res.status(403).json({ message: "Нет доступа к проекту" });
    }
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
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Отправка сообщения в проект
router.post("/:projectId", async (req, res) => {
  const projectId = Number(req.params.projectId);
  const { text } = req.body;
  try {
    if (!(await isProjectMember(req.userId, projectId))) {
      return res.status(403).json({ message: "Нет доступа к проекту" });
    }
    // автор — тот, чей токен, а не то, что прислал клиент
    const newMessage = await message.create({
      user_id: req.userId,
      project_id: projectId,
      text,
    });
    res.status(201).json(newMessage);
  } catch (err) {
    res.status(500).json({ error: "Internal Server Error" });
  }
});

module.exports = router;
