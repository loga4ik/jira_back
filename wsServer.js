const WebSocket = require("ws");
const handleMessage = require("./messageHandlers");
const { verifyAccessToken } = require("./services/tokenService");
const { isProjectMember } = require("./services/access");

const WS_PATH = "/ws";

const rejectUpgrade = (socket, status, reason) => {
  socket.write(`HTTP/1.1 ${status} ${reason}\r\nConnection: close\r\n\r\n`);
  socket.destroy();
};

const setupWebSocketServer = (server) => {
  const wss = new WebSocket.Server({ noServer: true });

  // Авторизация на рукопожатии, до открытия соединения.
  // Браузерный WebSocket не умеет передавать заголовки,
  // поэтому access-токен приходит query-параметром.
  server.on("upgrade", (req, socket, head) => {
    const url = new URL(req.url, "http://localhost");
    if (url.pathname !== WS_PATH) {
      return rejectUpgrade(socket, 404, "Not Found");
    }

    const userId = verifyAccessToken(url.searchParams.get("token"));
    if (!userId) {
      return rejectUpgrade(socket, 401, "Unauthorized");
    }

    wss.handleUpgrade(req, socket, head, (ws) => {
      ws.userId = userId;
      wss.emit("connection", ws, req);
    });
  });

  wss.on("connection", (ws) => {
    ws.on("message", async (raw) => {
      let parsed;
      try {
        parsed = JSON.parse(raw);
      } catch {
        return;
      }

      if (parsed.type === "join_room") {
        const projectId = Number(parsed.projectId);
        // войти в комнату проекта может только его участник —
        // раньше любой мог читать переписку любого проекта
        if (!(await isProjectMember(ws.userId, projectId))) {
          ws.send(JSON.stringify({ type: "error", message: "Нет доступа к проекту" }));
          return;
        }
        ws.projectId = projectId;
        return;
      }

      handleMessage(parsed, wss, ws);
    });
  });

  return wss;
};

module.exports = setupWebSocketServer;
