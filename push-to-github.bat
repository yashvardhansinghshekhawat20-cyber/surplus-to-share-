@echo off
title Push Surplus to Share to GitHub
echo ========================================================
echo Pushing project to https://github.com/yashvardhansinghshekhawat20-cyber/surplus-to-share-.git
echo ========================================================
cd /d "%~dp0"

git remote set-url origin https://github.com/yashvardhansinghshekhawat20-cyber/surplus-to-share-.git
git branch -M main
git push -u origin main

if %ERRORLEVEL% equ 0 (
    echo.
    echo ========================================================
    echo SUCCESS! Project pushed to GitHub successfully.
    echo ========================================================
) else (
    echo.
    echo ========================================================
    echo If you see a permission error, make sure you are signed in 
    echo as yashvardhansinghshekhawat20-cyber or added aksh13singh as collaborator.
    echo ========================================================
)
pause
