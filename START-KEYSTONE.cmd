@echo off
setlocal enabledelayedexpansion
title Keystone AI Infrastructure

echo.
echo  ================================================================
echo    K   K  EEEEE  Y   Y   SSS  TTTTT  OOO  N   N  EEEEE
echo    K  K   E       Y Y   S       T   O   O NN  N  E
echo    KKK    EEE      Y     SSS    T   O   O N N N  EEE
echo    K  K   E        Y       S   T   O   O N  NN  E
echo    K   K  EEEEE    Y    SSS    T    OOO  N   N  EEEEE
echo.
echo    Keystone AI Infrastructure - Starting Up
echo  ================================================================
echo.

:: Set up Keystone paths - EVERYTHING FROM ONE FOLDER
set BUN_EXE=C:\Users\peace\.bun\bin\bun.exe
set KEYSTONE_DIR=%~dp0
set KEYSTONE_AGENTS=%KEYSTONE_DIR%agents
set KEYSTONE_SEARCH=%KEYSTONE_DIR%search
set KEYSTONE_DATABASE=%KEYSTONE_DIR%database

:: Check Bun exists
if not exist "%BUN_EXE%" (
    echo [ERROR] Bun not found at %BUN_EXE%
    echo Please install from https://bun.sh
    pause
    exit /b 1
)

:: Step 1: Start Ollama for GPU
echo [1/4] Checking Ollama (GPU)...
tasklist /FI "IMAGENAME eq ollama.exe" 2>NUL | find /I /N "ollama.exe">NUL
if "%ERRORLEVEL%"=="0" (
    echo       Ollama already running
) else (
    echo       Starting Ollama...
    start /B "" "C:\Users\peace\AppData\Local\Programs\Ollama\ollama.exe" serve
    timeout /t 3 /nobreak > nul
    echo       Ollama started
)

:: Step 2: Start Services from Keystone folder
echo [2/4] Starting Services...
start "Keystone Core" /MIN cmd /c "cd /d %KEYSTONE_AGENTS% && set BUN_RUNTIME_TRANSPILER_CACHE_PATH=0 && %BUN_EXE% run engine/pai-daemon.ts start"
timeout /t 1 /nobreak > nul
start "Keystone Search" /MIN cmd /c "cd /d %KEYSTONE_AGENTS% && set BUN_RUNTIME_TRANSPILER_CACHE_PATH=0 && %BUN_EXE% run engine/clawmem-daemon.ts start"
timeout /t 1 /nobreak > nul
start "Keystone Shadow" /MIN cmd /c "cd /d %KEYSTONE_AGENTS% && set BUN_RUNTIME_TRANSPILER_CACHE_PATH=0 && %BUN_EXE% run agents/shadow/engine/shadow-daemon.ts start"
echo       3 services started (minimized)

:: Step 3: Wait for everything to initialize
echo [3/4] Initializing...
timeout /t 3 /nobreak > nul

:: Step 4: Start Claude Code
echo [4/4] Launching Claude Code...
echo.
echo  ================================================================
echo   KEYSTONE is ready. Services running in background.
echo.
echo   Type your message. When done, type 'exit' or close window.
echo  ================================================================
echo.

:: Run Claude Code in this window
claude %*

echo.
echo  ================================================================
echo   SESSION ENDED
echo  ================================================================
echo.
echo  Running final updates...
echo.

:: Final updates before closing
echo  [1/2] Syncing search index...
cd /d %KEYSTONE_SEARCH%
set KEYSTONE_EMBED_URL=http://localhost:11434
set INDEX_PATH=%KEYSTONE_DATABASE%\index.sqlite
%BUN_EXE% run src/clawmem.ts update 2>nul

echo  [2/2] Saving session...
echo       Done

echo.
echo  ================================================================
echo   Safe to close. All data saved.
echo  ================================================================
echo.
pause
