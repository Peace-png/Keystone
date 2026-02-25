@echo off
setlocal enabledelayedexpansion

echo.
echo ============================================================
echo          KEYSTONE - Starting All Services
echo ============================================================
echo.

:: Bun is here (confirmed)
set "BUN_EXE=C:\Users\peace\.bun\bin\bun.exe"

:: Check PATH for bun
where bun >nul 2>&1
if %errorlevel% equ 0 set "BUN_EXE=bun"

if "%BUN_EXE%"=="" (
    echo.
    echo [ERROR] Bun not found!
    echo.
    echo The services need Bun to run. Install it:
    echo   powershell -c "irm bun.sh/install.ps1 ^| iex"
    echo.
    echo Or visit: https://bun.sh
    echo.
    pause
    exit /b 1
)

echo Found Bun at: %BUN_EXE%
echo.
echo Starting services in separate windows...
echo.

:: Disable Bun's transpiler cache to prevent stale code issues
set "BUN_RUNTIME_TRANSPILER_CACHE_PATH=0"

start "Keystone Core" cmd /k "cd /d C:\Users\peace\clawd && set BUN_RUNTIME_TRANSPILER_CACHE_PATH=0 && %BUN_EXE% run engine/pai-daemon.ts start || pause"
timeout /t 2 /nobreak > nul

start "Keystone Search" cmd /k "cd /d C:\Users\peace\clawd && set BUN_RUNTIME_TRANSPILER_CACHE_PATH=0 && %BUN_EXE% run engine/clawmem-daemon.ts start || pause"
timeout /t 2 /nobreak > nul

start "Keystone Shadow" cmd /k "cd /d C:\Users\peace\clawd && set BUN_RUNTIME_TRANSPILER_CACHE_PATH=0 && %BUN_EXE% run agents/shadow/engine/shadow-daemon.ts start || pause"

echo.
echo ============================================================
echo  All services started in separate windows.
echo  Close each window to stop that service.
echo ============================================================
echo.
pause
