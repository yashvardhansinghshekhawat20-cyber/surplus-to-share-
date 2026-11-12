# Surplus to Share (FoodLink) PowerShell Launcher
$ErrorActionPreference = "Stop"

Write-Host "========================================================" -ForegroundColor Green
Write-Host "      Starting Surplus to Share (FoodLink) Locally" -ForegroundColor Green
Write-Host "========================================================" -ForegroundColor Green
Write-Host ""

$rootDir = Split-Path -Parent $MyInvocation.MyCommand.Path

Write-Host "[1/2] Starting Backend Server (FastAPI on http://localhost:8001)..." -ForegroundColor Cyan
Start-Process -FilePath "cmd.exe" -ArgumentList "/k cd /d `"$rootDir\backend`" && python server.py" -WindowStyle Normal

Start-Sleep -Seconds 2

Write-Host "[2/2] Starting Frontend App (Vite on http://localhost:3000)..." -ForegroundColor Cyan
Start-Process -FilePath "cmd.exe" -ArgumentList "/k cd /d `"$rootDir\frontend`" && npm.cmd run dev" -WindowStyle Normal

Start-Sleep -Seconds 3

Write-Host ""
Write-Host "Opening http://localhost:3000 in your browser..." -ForegroundColor Yellow
Start-Process "http://localhost:3000"

Write-Host ""
Write-Host "========================================================" -ForegroundColor Green
Write-Host "Application is running!" -ForegroundColor Green
Write-Host "Frontend: http://localhost:3000" -ForegroundColor White
Write-Host "Backend:  http://localhost:8001" -ForegroundColor White
Write-Host "API Docs: http://localhost:8001/api/docs" -ForegroundColor White
Write-Host "========================================================" -ForegroundColor Green
