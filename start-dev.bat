@echo off
title NovaPilot AI - Dev Runner
color 0A

echo =====================================================================
echo    _   _                  ____  _ _       _          _    ___ 
echo   ^| \ ^| ^| _____   ____ _^|  _ \(_) ^| ___ ^| ^|_       / \  ^|_ _^|
echo   ^|  \^| ^|/ _ \ \ / / _` ^| ^|_) ^| ^| ^|/ _ \^| __^|____ / _ \  ^| ^| 
echo   ^| ^|\  ^| (_) \ V / (_^| ^|  __/^| ^| ^| (_) ^| ^|_^|_____/ ___ \ ^| ^| 
echo   ^|_^| \_^|\___/ \_/ \__,_^|_^|   ^|_^|_^|\___/ \__^|    /_/   \_\___^|
echo.
echo           Autonomous Factory ChatOps Gatekeeper v2.0
echo =====================================================================
echo.

set ROOT_DIR=%~dp0
cd /d "%ROOT_DIR%"

echo [1/3] Checking prerequisites...
where bun >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] 'bun' is not installed or not in PATH! Please install bun from https://bun.sh
    pause
    exit /b 1
)

where go >nul 2>nul
if %errorlevel% neq 0 (
    echo [WARNING] 'go' is not found in PATH. Will attempt to run prebuilt server.exe.
)

echo [2/3] Building backend binary if necessary...
if not exist "backend\bin\server.exe" (
    echo Compiling backend...
    cd /d "%ROOT_DIR%backend"
    go build -o .\bin\server.exe .\cmd\server
    cd /d "%ROOT_DIR%"
)

echo [3/3] Launching NovaPilot Microservices...
echo.

:: 1. Launch Go Backend (:8088)
echo [+] Starting Go Backend Core on port 8088...
start "NovaPilot Backend Core (:8088)" cmd /k "cd /d %ROOT_DIR%backend && .\bin\server.exe"

:: 2. Launch WhatsApp ChatOps Gateway (:3002)
echo [+] Starting WhatsApp Baileys & OCR Gateway on port 3002...
start "NovaPilot WA Gateway (:3002)" cmd /k "cd /d %ROOT_DIR%whatsapp-gateway && bun run src/index.ts --mock"

:: 3. Launch SvelteKit Frontend (:3000)
echo [+] Starting SvelteKit Web Cockpit on port 3000...
start "NovaPilot Frontend Cockpit (:3000)" cmd /k "cd /d %ROOT_DIR%frontend && bun run dev --host 0.0.0.0 --port 3000"

echo.
echo =====================================================================
echo   NovaPilot AI Stack Running Successfully!
echo =====================================================================
echo   * Web Cockpit    : http://localhost:3000
echo   * Go Backend API : http://localhost:8088
echo   * WA Gateway API : http://localhost:3002/api/status
echo =====================================================================
echo.
echo Opening Web Cockpit in your default browser...
timeout /t 3 >nul
start http://localhost:3000/dashboard

echo.
echo Press any key to stop all windowed services...
pause >nul

:: Terminate background processes cleanly on exit
taskkill /f /im server.exe >nul 2>nul
echo All services stopped. Goodbye!
