@echo off
title Setting Up FoodLink (Surplus to Share)
echo ========================================================
echo       Setting up FoodLink on your computer
echo ========================================================
echo.

set ROOT_DIR=%~dp0

echo [1/3] Checking prerequisites...
where python >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Python is not installed or not in your system PATH!
    echo Please download and install Python (3.10+) from https://www.python.org/
    echo Make sure to check the box: "Add python.exe to PATH" during installation.
    echo.
    pause
    exit /b 1
)

where npm >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed or not in your system PATH!
    echo Please download and install Node.js (LTS version) from https://nodejs.org/
    echo.
    pause
    exit /b 1
)

echo Python and Node.js detected successfully!
echo.

echo [2/3] Installing Backend Dependencies (FastAPI, Uvicorn, etc.)...
cd /d "%ROOT_DIR%backend"
pip install -r requirements.txt
if %errorlevel% neq 0 (
    echo [NOTE] Retrying with --user flag...
    pip install --user -r requirements.txt
)

echo.
echo [3/3] Installing Frontend Dependencies...
cd /d "%ROOT_DIR%frontend"
call npm install

echo.
echo ========================================================
echo                  SETUP COMPLETE!
echo.
echo All code and the database are ready on your computer!
echo You can now double-click "start.bat" anytime to launch!
echo ========================================================
echo.
pause
