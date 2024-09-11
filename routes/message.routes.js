const express = require("express");
const router = express.Router();
const { message, user } = require("../db/models");
const { where } = require("sequelize");

// Получение всех сообщений для конкретного проекта
router.get("/:projectId", async (req, res) => {
  const { projectId } = req.params;
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
      console.log(login);
    }).dataValues;
    // console.log(messages);

    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Отправка сообщения в проект
router.post("/:projectId", async (req, res) => {
  const { projectId } = req.params;
  const { sender_id, message } = req.body;
  try {
    const newMessage = await message.create({
      sender_id,
      project_id: projectId,
      message,
    });
    res.status(201).json(newMessage);
  } catch (err) {
    res.status(500).json({ error: "Internal Server Error" });
  }
});

module.exports = router;
