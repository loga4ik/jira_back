const express = require('express');
const router = express.Router();
const { message } = require("../db/models");

// Получение всех сообщений для конкретного проекта
router.get('/project/:projectId', async (req, res) => {
  const { projectId } = req.params;
  try {
    const messages = await message.findAll({
      where: {
        project_id: projectId,
      },
      include: ['User'], // Можно добавить имя пользователя, если необходимо
    });
    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Отправка сообщения в проект
router.post('/project/:projectId', async (req, res) => {
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
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

module.exports = router;
