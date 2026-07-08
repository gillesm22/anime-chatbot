@echo off
cd /d "C:\Users\G$\anime-chatbot"
start "" http://localhost:3000
rmdir /s /q .next 2>nul
npx next dev --webpack -p 3000
