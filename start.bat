@echo off
title Surplus to Share (FoodLink) Launcher
echo ========================================================
echo       Starting Surplus to Share (FoodLink) Locally
echo ========================================================
echo.

set ROOT_DIR=%~dp0

echo [1/2] Starting Backend Server (FastAPI on http://localhost:8001)...
start "FoodLink Backend (Port 8001)" cmd /k "cd /d "%ROOT_DIR%backend" && python server.py"

timeout /t 2 /nobreak > nul

echo [2/2] Starting Frontend App (Vite on http://localhost:3000)...
start "FoodLink Frontend (Port 3000)" cmd /k "cd /d "%ROOT_DIR%frontend" && npm run dev"

timeout /t 3 /nobreak > nul

echo.
echo Opening http://localhost:3000 in your browser...
start http://localhost:3000

echo.
echo ========================================================
echo Application is running!
echo Frontend: http://localhost:3000
echo Backend:  http://localhost:8001
echo API Docs: http://localhost:8001/api/docs
echo ========================================================
echo.
