const WebSocket = require("ws");
const { message } = require("./db/models");

const handleMessage = async ({ text }, wss, ws) => {
  try {
    const projectId = ws.projectId;
    if (!projectId) {
      console.error("Сообщение до входа в комнату проекта — пропускаем");
      return;
    }
    if (typeof text !== "string" || !text.trim()) return;

    // Автор — пользователь из проверенного токена соединения.
    // Раньше user_id приходил от клиента, и писать можно было от имени любого.
    const newMessage = await message.create({
      user_id: ws.userId,
      project_id: projectId,
      text: text.trim(),
    });

    // рассылаем только тем, кто сидит в комнате этого проекта
    wss.clients.forEach((client) => {
      if (
        client.readyState === WebSocket.OPEN &&
        client.projectId === projectId
      ) {
        client.send(JSON.stringify(newMessage));
      }
    });
  } catch (error) {
    console.error("Ошибка обработки сообщения:", error);
  }
};

module.exports = handleMessage;
