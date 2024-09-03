const WebSocket = require("ws");
const { message } = require("./db/models");

const handleMessage = async (userMessage, wss) => {
  console.log(wss);
  
  try {
    const parsedMessage = JSON.parse(userMessage);
    const { projectId, user_id, text } = parsedMessage;

    // Сохраняем сообщение в базу данных
    const newMessage = await message.create({
      user_id,
      project_id: projectId,
      text: text,
    });
    console.log(newMessage);

    // Отправка сообщения всем клиентам
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(newMessage));
      }
    });
  } catch (error) {
    console.error("Error handling message:", error);
  }
};

module.exports = handleMessage;
