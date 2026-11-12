@echo off
title Surplus to Share (FoodLink) Launcher
echo ========================================================
echo       Starting Surplus to Share (FoodLink) Locally
echo ========================================================
echo.

cd /d "%~dp0"

echo [1/2] Starting Backend Server (FastAPI on http://localhost:8001)...
start "FoodLink Backend" cmd /k "cd backend && python server.py"

timeout /t 2 /nobreak > nul

echo [2/2] Starting Frontend App (Vite on http://localhost:3000)...
start "FoodLink Frontend" cmd /k "cd frontend && npm.cmd run dev"

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
