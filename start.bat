@echo off
title FORGEPOINT - Real-Time OEE Platform
color 0E
echo ============================================================
echo   FORGEPOINT: Real-Time OEE Monitoring & Predictive Maint.
echo ============================================================
echo.

echo [1/3] Checking MongoDB...
netstat -ano | findstr "27017" | findstr "LISTENING" >nul
if %ERRORLEVEL% equ 0 (
    echo [OK] MongoDB is already listening on port 27017.
) else (
    echo [INFO] MongoDB not detected on port 27017. Checking service...
    sc query MongoDB | find "RUNNING" >nul
    if %ERRORLEVEL% equ 0 (
        echo [OK] MongoDB Windows service is running.
    ) else (
        net start MongoDB >nul 2>&1
        if %ERRORLEVEL% equ 0 (
            echo [OK] Started MongoDB Windows service.
        ) else (
            if exist "C:\Users\haris\mongodb\MongoDB\Server\8.3\bin\mongod.exe" (
                echo [INFO] Starting portable MongoDB engine...
                if not exist "C:\Users\haris\mongodb\data\db" mkdir "C:\Users\haris\mongodb\data\db"
                if exist "C:\Users\haris\mongodb\data\db\mongod.lock" del /f /q "C:\Users\haris\mongodb\data\db\mongod.lock" >nul 2>&1
                start "MongoDB Engine (:27017)" /min "C:\Users\haris\mongodb\MongoDB\Server\8.3\bin\mongod.exe" --dbpath "C:\Users\haris\mongodb\data\db" --bind_ip 127.0.0.1 --port 27017
                timeout /t 5 /nobreak >nul
                echo [OK] MongoDB engine launched.
            ) else (
                echo [WARN] MongoDB service not found. Please ensure MongoDB is running.
            )
        )
    )
)
echo.

echo [2/3] Launching Express + Socket.IO Backend on Port 5001...
start "OEE Backend (:5001)" cmd /c "cd /d "%~dp003-backend-code" && node server.js"
timeout /t 4 /nobreak >nul
echo.

echo [3/3] Launching React + Vite Frontend on Port 5173...
start "OEE Frontend (:5173)" cmd /c "cd /d "%~dp0frontend" && npm.cmd run dev"
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
