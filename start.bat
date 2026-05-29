@echo off
echo ========================================
echo   WebRTC 视频通话 Demo
echo ========================================
echo.

cd /d "%~dp0"

:: 安装依赖
if not exist node_modules (
    echo [1/2] 安装依赖...
    call npm install
    echo.
)

:: 启动信令服务器
echo [2/2] 启动信令服务器 (ws://localhost:8080)...
echo    请用浏览器打开: http://localhost:8080
echo    或者访问: http://127.0.0.1:8080
echo.
echo    打开两个浏览器窗口/标签页，加入同一房间即可通话。
echo.
echo ========================================
pause

call npm start
