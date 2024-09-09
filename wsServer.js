const WebSocket = require("ws");
const handleMessage = require("./messageHandlers");
const { message } = require("./db/models");

const setupWebSocketServer = (server) => {
  const wss = new WebSocket.Server({ server }, () => {
    console.log("server ws started");
  });

  wss.on("connection", (ws) => {
    console.log("Client connected");

    // Отправка сообщения клиенту о том, что соединение установлено
    ws.send(
      JSON.stringify({ type: "connection", message: "Connection established" })
    );

    // ws.send(
    //   JSON.stringify(async () => {
    //     return await message.findAll({
    //       where: {
    //         project_id: projectId,
    //       },
    //     });
    //   })
    // );

    ws.on("message", (message) => handleMessage(message, wss));

    ws.on("close", () => {
      console.log("Client disconnected");
    });
  });

  return wss;
};

module.exports = setupWebSocketServer;
