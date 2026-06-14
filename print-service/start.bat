@echo off
title Super Noodles Print Service
cd /d "%~dp0"
echo Starting Super Noodles Print Service...
echo.
node print-service.js
echo.
echo Service stopped. Press any key to close.
pause > nul
