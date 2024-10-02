const WebSocket = require("ws");
const { message } = require("./db/models");

const handleMessage = async (userMessage, wss, ws) => {
  try {
    const parsedMessage = JSON.parse(userMessage);
    const { user_id, text } = parsedMessage;

    // Используем projectId, который был сохранен для текущего клиента
    const projectId = ws.projectId;

    if (!projectId) {
      console.error("No project ID found for the client.");
      return;
    }

    // Сохраняем сообщение в базу данных
    const newMessage = await message.create({
      user_id,
      project_id: projectId,
      text,
    });

    // Отправка сообщения только клиентам, подключенным к этой комнате
    wss.clients.forEach((client) => {
      if (
        client.readyState === WebSocket.OPEN &&
        client.projectId === projectId
      ) {
        client.send(JSON.stringify(newMessage));
      }
    });
  } catch (error) {
    console.error("Error handling message:", error);
  }
};

module.exports = handleMessage;
