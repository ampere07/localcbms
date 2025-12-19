@echo off
echo Starting CBMS Backend Services...
echo.

REM Start Socket.IO server in a new window
start "Socket.IO Server" cmd /k "node socket-server.js"

REM Wait a moment for socket server to start
timeout /t 2 /nobreak > nul

REM Start Laravel development server
echo Starting Laravel...
php artisan serve

pause
