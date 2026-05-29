/**
 * WebRTC Signaling Server (WebSocket)
 * 转发 SDP Offer/Answer 和 ICE 候选
 *
 * 启动: node signaling-server.js
 */

const WebSocket = require("ws");

const PORT = process.env.PORT || 8080;
const rooms = new Map(); // roomId -> Set<WebSocket>

const wss = new WebSocket.Server({ port: PORT }, () => {
  console.log(`信令服务器启动在 ws://localhost:${PORT}`);
});

wss.on("connection", (ws) => {
  let roomId = null;

  ws.on("message", (raw) => {
    const msg = JSON.parse(raw.toString());

    switch (msg.type) {
      case "join":
        roomId = msg.room;
        if (!rooms.has(roomId)) {
          rooms.set(roomId, new Set());
        }
        rooms.get(roomId).add(ws);
        console.log(`[${roomId}] 加入，当前在线: ${rooms.get(roomId).size}`);

        // 第二个加入的人通知第一个
        if (rooms.get(roomId).size === 2) {
          for (const peer of rooms.get(roomId)) {
            if (peer.readyState === 1) {
              peer.send(JSON.stringify({ type: "peer-ready", room: roomId }));
            }
          }
        }
        break;

      case "offer":
      case "answer":
      case "ice-candidate":
        // 转发给同房间的其他人
        if (roomId && rooms.has(roomId)) {
          for (const peer of rooms.get(roomId)) {
            if (peer !== ws && peer.readyState === 1) {
              peer.send(JSON.stringify(msg));
            }
          }
        }
        break;

      case "leave":
        ws.close();
        break;
    }
  });

  ws.on("close", () => {
    if (roomId && rooms.has(roomId)) {
      rooms.get(roomId).delete(ws);
      if (rooms.get(roomId).size === 0) {
        rooms.delete(roomId);
      }
      // 通知房间内其他人
      for (const peer of rooms.get(roomId) || []) {
        if (peer.readyState === 1) {
          peer.send(JSON.stringify({ type: "peer-left", room: roomId }));
        }
      }
    }
    roomId = null;
  });

  ws.on("error", (err) => {
    console.error("WebSocket 错误:", err.message);
  });
});

process.on("SIGINT", () => {
  wss.close();
  process.exit(0);
});
