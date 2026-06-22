@echo off
title Super Noodles Print Service
cd /d "%~dp0"
node print-service.js >> print-service.log 2>&1
