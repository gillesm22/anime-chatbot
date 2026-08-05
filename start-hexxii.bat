@echo off
cd /d "%~dp0"
start "" http://localhost:3000
rmdir /s /q .next 2>nul
npx next dev --webpack -p 3000
