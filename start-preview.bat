@echo off
setlocal
cd /d "%~dp0"

echo [FightBack] Checking dependencies...
if not exist "node_modules" (
  echo [FightBack] node_modules not found. Running npm install...
  call npm install
  if errorlevel 1 (
    echo [FightBack] npm install failed.
    pause
    exit /b 1
  )
)

echo [FightBack] Building latest preview files...
call npm run build
if errorlevel 1 (
  echo [FightBack] Build failed.
  pause
  exit /b 1
)

echo [FightBack] Starting local preview server at http://localhost:8080
start "" powershell -NoProfile -ExecutionPolicy Bypass -Command "Start-Sleep -Seconds 2; Start-Process 'http://localhost:8080'"
node server.js

echo [FightBack] Preview server stopped.
pause
