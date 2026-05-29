/**
 * 简单的静态文件服务器（提供 index.html）
 * 启动后访问 http://localhost:3000
 * 信令服务器另开终端启动: node signaling-server.js
 */

const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = 3000;
const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
};

const server = http.createServer((req, res) => {
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
  console.log(`前端页面启动: http://localhost:${PORT}`);
  console.log(`信令服务器请在另一个终端启动: node signaling-server.js`);
});
