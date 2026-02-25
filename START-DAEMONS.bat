@echo off
echo ============================================================
echo              KEYSTONE - START ALL SERVICES
echo ============================================================
echo.
echo Starting background services...
echo.

set KEYSTONE_DIR=%~dp0
set KEYSTONE_AGENTS=%KEYSTONE_DIR%agents
set BUN_EXE=C:\Users\peace\.bun\bin\bun.exe

start "Keystone Core" cmd /k "cd /d %KEYSTONE_AGENTS% && set BUN_RUNTIME_TRANSPILER_CACHE_PATH=0 && %BUN_EXE% run engine/pai-daemon.ts start || pause"
timeout /t 2 /nobreak > nul

start "Keystone Search" cmd /k "cd /d %KEYSTONE_AGENTS% && set BUN_RUNTIME_TRANSPILER_CACHE_PATH=0 && %BUN_EXE% run engine/clawmem-daemon.ts start || pause"
timeout /t 2 /nobreak > nul

start "Keystone Shadow" cmd /k "cd /d %KEYSTONE_AGENTS% && set BUN_RUNTIME_TRANSPILER_CACHE_PATH=0 && %BUN_EXE% run agents/shadow/engine/shadow-daemon.ts start || pause"

echo.
echo ============================================================
echo  All services started in separate windows.
echo  Close each window to stop that service.
echo ============================================================
echo.
pause
