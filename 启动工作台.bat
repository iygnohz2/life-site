@echo off
cd /d "%~dp0"
title DreamLand Studio
echo.
echo   Starting DreamLand Studio...
echo.
if not exist node_modules (
  echo   Installing dependencies, this may take a few minutes...
  call npm install
)
start "" http://localhost:4000
call npm run studio
echo.
echo   Studio stopped. Press any key to close.
pause >nul
