@echo off
rem HEXXII remote: restart the dev server. Spawned detached by
rem /api/remote/run (action dev-restart) because this kills the very
rem server that answered the request.
cd /d "%~dp0.."

rem Give the API response a moment to flush before killing the server.
timeout /t 2 /nobreak >nul

for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":3000 " ^| findstr "LISTENING"') do taskkill /f /pid %%a >nul 2>&1

if exist .next rmdir /s /q .next

start "hexxii-dev" cmd /c "npx next dev --webpack -p 3000 >> hexxii-dev.log 2>&1"
