/**
 * HTTPS 统一服务器
 * - 静态文件: 提供 index.html
 * - WSS 信令: 通过 /ws 路径提供 WebSocket
 *
 * 使用 HTTPS 是为了让 iPad 等非 localhost 设备也能调用 getUserMedia
 *
 * 启动: node serve.js
 */

const https = require("https");
const WebSocket = require("ws");
const fs = require("fs");
const path = require("path");
const os = require("os");

const PORT = parseInt(process.env.WEB_PORT) || 3000;

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
};

// rooms: roomId -> Set<WebSocket>
const rooms = new Map();

function getLocalIP() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === "IPv4" && !iface.internal) {
        return iface.address;
      }
    }
  }
  return "127.0.0.1";
}

// ========== 启动服务器（主逻辑） ==========
function startServer(localIP, creds) {
  // ========== HTTPS 服务器 ==========
  const server = https.createServer(creds, (req, res) => {
    let filePath = "." + req.url;
    if (filePath === ".") filePath = "./index.html";

    const ext = path.extname(filePath);
    const contentType = MIME[ext] || "application/octet-stream";

    fs.readFile(path.resolve(filePath), (err, data) => {
      if (err) {
        res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
        res.end("404 Not Found");
        return;
      }
      res.writeHead(200, {
        "Content-Type": contentType,
        "Cache-Control": "no-cache",
      });
      res.end(data);
    });
  });

  server.listen(PORT, "0.0.0.0", () => {
    console.log("========================================");
    console.log("  WebRTC 视频通话 (HTTPS + WSS)");
    console.log("========================================");
    console.log();
    console.log(`前端页面已启动 (HTTPS):`);
    console.log(`  本机访问:   https://localhost:${PORT}`);
    console.log(`  局域网访问: https://${localIP}:${PORT}`);
    console.log();
    console.log(`信令服务器 (WSS):`);
    console.log(`  本机地址:   wss://localhost:${PORT}/ws`);
    console.log(`  局域网地址: wss://${localIP}:${PORT}/ws`);
    console.log();
    console.log(`iPad/手机访问:`);
    console.log(`  1. 确保 iPad 和电脑在同一个 WiFi 下`);
    console.log(`  2. iPad 浏览器打开: https://${localIP}:${PORT}`);
    console.log(`  3. 首次会提示证书不安全，点击"继续访问"`);
    console.log(`  4. 两边输入相同房间号，点"加入通话"即可`);
    console.log();
    console.log(`========================================`);
  });

  process.on("SIGINT", () => {
    wss.close();
    server.close();
    process.exit(0);
  });
}

// ========== 证书加载/生成 ==========
(async function main() {
  const certPath = path.join(__dirname, "cert.pem");
  const keyPath = path.join(__dirname, "key.pem");
  const certExists = fs.existsSync(certPath) && fs.existsSync(keyPath);

  let creds;

  if (certExists) {
    creds = {
      key: fs.readFileSync(keyPath),
      cert: fs.readFileSync(certPath),
    };
  } else {
    console.log("证书不存在，正在生成自签名证书...");
    const localIP = getLocalIP();
    const selfsigned = require("selfsigned");

    const pems = await selfsigned.generate(null, {
      algorithm: "sha256",
      days: 365,
      keySize: 2048,
      extensions: [
        { name: "keyUsage", keyCertSign: true, digitalSignature: true, keyEncipherment: true },
        { name: "extendedKeyUsage", serverAuth: true, clientAuth: true },
        { name: "subjectAltName", altNames: [
          { type: 2, value: "localhost" },
          { type: 7, ip: "127.0.0.1" },
          { type: 7, ip: "::1" },
          { type: 7, ip: localIP },
        ]},
      ],
    });

    fs.writeFileSync(certPath, pems.cert);
    fs.writeFileSync(keyPath, pems.private);
    console.log("证书已生成: cert.pem, key.pem\n");

    creds = { key: pems.private, cert: pems.cert };
    startServer(localIP, creds);
    return;
  }

  const localIP = getLocalIP();
  startServer(localIP, creds);
})();
