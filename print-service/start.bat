@echo off
title Super Noodles Print Service
cd /d "%~dp0"

:loop
if exist "print-service.log" (
  for %%A in ("print-service.log") do if %%~zA gtr 10485760 del "print-service.log"
)
echo [%date% %time%] starting print-service.js >> print-service.log
node print-service.js >> print-service.log 2>&1
echo [%date% %time%] print-service.js exited, restarting in 5s >> print-service.log
timeout /t 5 /nobreak > nul
goto loop
