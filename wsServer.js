const WebSocket = require("ws");
const handleMessage = require("./messageHandlers");

const setupWebSocketServer = (server) => {
  const wss = new WebSocket.Server({ server }, () => {
    console.log("server ws started");
  });

  wss.on("connection", (ws) => {
    console.log("Client connected");

    // Сохраняем projectId при подключении
    ws.on("message", (message) => {
      const parsedMessage = JSON.parse(message);

      // Проверяем, является ли это сообщение о присоединении к комнате
      if (parsedMessage.type === "join_room") {
        ws.projectId = parsedMessage.projectId; // Сохраняем projectId для текущего клиента
        return; // Выходим из функции, чтобы не обрабатывать это сообщение как обычное
      }

      // Обрабатываем остальные сообщения
      handleMessage(message, wss, ws); // Передаем ws для дальнейшего использования
    });

    ws.on("close", () => {
      console.log("Client disconnected");
    });
  });

  return wss;
};

module.exports = setupWebSocketServer;
