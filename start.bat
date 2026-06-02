@echo off
echo ========================================
echo   WebRTC 视频通话 Demo (HTTPS + WSS)
echo ========================================
echo.
echo   跨设备用法:
echo   1. 确保电脑和 iPad 连接同一个 WiFi
echo   2. 启动后，记下显示的局域网地址
echo   3. iPad 浏览器打开该局域网地址
echo   4. 两边输入相同房间号即可通话
echo.
echo ========================================
echo.

cd /d "%~dp0"

:: 安装依赖
if not exist node_modules (
    echo [1/1] 安装依赖...
    call npm install
    echo.
)

:: 启动 HTTPS + WSS 统一服务器
echo [1/1] 启动统一服务器...
echo.
call node serve.js
