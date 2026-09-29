@echo off
title FORGEPOINT - Real-Time OEE Platform
color 0E
echo ============================================================
echo   FORGEPOINT: Real-Time OEE Monitoring & Predictive Maint.
echo   Easwari Engineering College - Information Technology
echo   Presented by: Harish Padmavel S B (310624205081)
echo ============================================================
echo.

echo [1/3] Checking MongoDB Local Service...
sc query MongoDB | find "RUNNING" >nul
if %ERRORLEVEL% equ 0 (
    echo [OK] MongoDB is running.
) else (
    echo [INFO] Attempting to start MongoDB service...
    net start MongoDB
)
echo.

echo [2/3] Launching Express + Socket.IO Backend on Port 5001...
start "OEE Backend (:5001)" cmd /c "cd /d 03-backend-code && node server.js"
timeout /t 3 /nobreak >nul
echo.

echo [3/3] Launching React + Vite Frontend on Port 5173...
start "OEE Frontend (:5173)" cmd /c "cd /d frontend && npm.cmd run dev"
timeout /t 4 /nobreak >nul
echo.

echo ============================================================
echo   Platform is running!
echo   Frontend: http://localhost:5173
echo   Backend:  http://localhost:5001
echo ============================================================
echo Opening dashboard in your default browser...
start http://localhost:5173
pause
