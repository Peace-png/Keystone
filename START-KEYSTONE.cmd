@echo off
setlocal enabledelayedexpansion
title Keystone AI Infrastructure

:: Enable ANSI colors in Windows Terminal
for /f %%a in ('echo prompt $E^| cmd') do set "ESC=%%a"

echo.
echo  %ESC%[90m================================================================%ESC%[0m
echo.
echo    %ESC%[92m%ESC%[1m                                                                 %ESC%[0m
echo    %ESC%[92m   ██╗   ██╗ ██████╗ ██╗    ██╗██╗  ██╗███████╗██╗     ██████╗ ██████╗ ██╗  ██╗    %ESC%[0m
echo    %ESC%[92m   ██║   ██║██╔═══██╗██║    ██║██║ ██╔╝██╔════╝██║     ██╔══██╗██╔══██╗██║ ██╔╝    %ESC%[0m
echo    %ESC%[92m   ██║   ██║██║   ██║██║ █╗ ██║█████╔╝ █████╗  ██║     ██████╔╝██████╔╝█████╔╝     %ESC%[0m
echo    %ESC%[92m   ╚██╗ ██╔╝██║   ██║██║███╗██║██╔═██╗ ██╔══╝  ██║     ██╔═══╝ ██╔═══╝ ██╔═██╗     %ESC%[0m
echo    %ESC%[92m    ╚████╔╝ ╚██████╔╝╚███╔███╔╝██║  ██╗███████╗███████╗██║     ██║     ██║  ██╗    %ESC%[0m
echo    %ESC%[92m     ╚═══╝   ╚═════╝  ╚══╝╚══╝ ╚═╝  ╚═╝╚══════╝╚══════╝╚═╝     ╚═╝     ╚═╝  ╚═╝    %ESC%[0m
echo    %ESC%[92m%ESC%[1m                                                                 %ESC%[0m
echo.
echo         %ESC%[97m%ESC%[1mKEYSTONE AI INFRASTRUCTURE%ESC%[0m
echo.
echo  %ESC%[90m================================================================%ESC%[0m
echo.

:: Set Keystone dir first (needed for identity check)
set KEYSTONE_DIR=%~dp0

:: P11 ENFORCEMENT: Identity check BEFORE anything else
echo %ESC%[90m[P11] Checking git identity...%ESC%[0m
call "%KEYSTONE_DIR%CHECK_IDENTITY.bat"
if %ERRORLEVEL% neq 0 (
    echo.
    echo %ESC%[91mIdentity check failed. Fix the issue above, then restart.%ESC%[0m
    pause
    exit /b 1
)
echo.

:: Set up Keystone paths - EVERYTHING FROM ONE FOLDER
set BUN_EXE=C:\Users\peace\.bun\bin\bun.exe
set KEYSTONE_AGENTS=%KEYSTONE_DIR%agents
set KEYSTONE_SEARCH=%KEYSTONE_DIR%search
set KEYSTONE_DATABASE=%KEYSTONE_DIR%database

:: ClawMem GPU config (use Ollama for embed/LLM, allow local fallback for reranker)
set CLAWMEM_LLM_URL=http://localhost:11434
set CLAWMEM_RERANK_URL=http://localhost:11434
set CLAWMEM_EMBED_URL=http://localhost:11434
set CLAWMEM_NO_LOCAL_MODELS=false

:: Check Bun exists
if not exist "%BUN_EXE%" (
    echo [ERROR] Bun not found at %BUN_EXE%
    echo Please install from https://bun.sh
    pause
    exit /b 1
)

:: Health check tracking
set HEALTHY_COUNT=0
set TOTAL_CHECKS=6

:: Step 1: Start Ollama for GPU
echo  %ESC%[90m[%ESC%[0m%ESC%[97m1%ESC%[0m%ESC%[90m/%ESC%[0m%ESC%[97m4%ESC%[0m%ESC%[90m]%ESC%[0m Checking Ollama (GPU)...
tasklist /FI "IMAGENAME eq ollama.exe" 2>NUL | find /I /N "ollama.exe">NUL
if "%ERRORLEVEL%"=="0" (
    echo         Ollama process found, verifying API...
) else (
    echo         Starting Ollama...
    start /B "" "C:\Users\peace\AppData\Local\Programs\Ollama\ollama.exe" serve
    timeout /t 3 /nobreak > nul
)

:: HEALTH CHECK: Verify Ollama API responds
curl -s http://localhost:11434/api/tags >nul 2>&1
if "%ERRORLEVEL%"=="0" (
    echo         Ollama API responding %ESC%[92mOK%ESC%[0m
    set /a HEALTHY_COUNT+=1
) else (
    echo         %ESC%[91mOllama API not responding - GPU features may fail%ESC%[0m
)

:: Step 2: Start Services from Keystone folder
echo  %ESC%[90m[%ESC%[0m%ESC%[97m2%ESC%[0m%ESC%[90m/%ESC%[0m%ESC%[97m4%ESC%[0m%ESC%[90m]%ESC%[0m Starting Services...
set ENV_VARS=set BUN_RUNTIME_TRANSPILER_CACHE_PATH=0 && set CLAWMEM_LLM_URL=http://localhost:11434 && set CLAWMEM_RERANK_URL=http://localhost:11434 && set CLAWMEM_EMBED_URL=http://localhost:11434 && set CLAWMEM_NO_LOCAL_MODELS=false

start "Keystone Core" /MIN cmd /c "cd /d %KEYSTONE_AGENTS% && %ENV_VARS% && set KEYSTONE_DIR=%KEYSTONE_DIR% && %BUN_EXE% run pai-daemon.ts start"
timeout /t 1 /nobreak > nul
start "Keystone Search" /MIN cmd /c "cd /d %KEYSTONE_AGENTS% && %ENV_VARS% && %BUN_EXE% run clawmem-daemon.ts start"
timeout /t 1 /nobreak > nul
start "Keystone Shadow" /MIN cmd /c "cd /d %KEYSTONE_AGENTS% && %ENV_VARS% && %BUN_EXE% run shadow/engine/shadow-daemon.ts start"
timeout /t 1 /nobreak > nul
start "Keystone Firewall" /MIN cmd /c "cd /d %KEYSTONE_AGENTS% && %ENV_VARS% && %BUN_EXE% run cognitive-firewall.ts start"
timeout /t 1 /nobreak > nul
start "Keystone SCAR" /MIN cmd /c "cd /d %KEYSTONE_AGENTS% && %ENV_VARS% && %BUN_EXE% run scar-daemon.ts start"
echo         Services launched, verifying...

:: Wait for services to initialize
timeout /t 3 /nobreak > nul

:: HEALTH CHECK: Verify each service process is running
set CORE_OK=0
set SEARCH_OK=0
set SHADOW_OK=0
set FIREWALL_OK=0
set SCAR_OK=0

:: Check Core (pai-daemon)
tasklist /FI "WINDOWTITLE eq Keystone Core*" 2>NUL | find /I "cmd.exe">NUL
if "%ERRORLEVEL%"=="0" (
    echo         Core service      %ESC%[92mOK%ESC%[0m
    set /a HEALTHY_COUNT+=1
    set CORE_OK=1
) else (
    echo         %ESC%[91mCore service      FAILED%ESC%[0m
)

:: Check Search (clawmem-daemon)
tasklist /FI "WINDOWTITLE eq Keystone Search*" 2>NUL | find /I "cmd.exe">NUL
if "%ERRORLEVEL%"=="0" (
    echo         Search service    %ESC%[92mOK%ESC%[0m
    set /a HEALTHY_COUNT+=1
    set SEARCH_OK=1
) else (
    echo         %ESC%[91mSearch service    FAILED%ESC%[0m
)

:: Check Shadow (shadow-daemon)
tasklist /FI "WINDOWTITLE eq Keystone Shadow*" 2>NUL | find /I "cmd.exe">NUL
if "%ERRORLEVEL%"=="0" (
    echo         Shadow service    %ESC%[92mOK%ESC%[0m
    set /a HEALTHY_COUNT+=1
    set SHADOW_OK=1
) else (
    echo         %ESC%[91mShadow service    FAILED%ESC%[0m
)

:: Check Firewall (cognitive-firewall)
tasklist /FI "WINDOWTITLE eq Keystone Firewall*" 2>NUL | find /I "cmd.exe">NUL
if "%ERRORLEVEL%"=="0" (
    echo         Firewall service  %ESC%[92mOK%ESC%[0m
    set /a HEALTHY_COUNT+=1
    set FIREWALL_OK=1
) else (
    echo         %ESC%[91mFirewall service  FAILED%ESC%[0m
)

:: Check SCAR (scar-daemon) - wait up to 10s for heartbeat
set SCAR_OK=0
set SCAR_WAIT=0
:scar_wait_loop
if exist "%KEYSTONE_AGENTS%\scar-daemon\heartbeat" (
    echo         SCAR service      %ESC%[92mOK%ESC%[0m
    set /a HEALTHY_COUNT+=1
    set SCAR_OK=1
    goto :scar_done
)
set /a SCAR_WAIT+=1
if %SCAR_WAIT% LSS 10 (
    timeout /t 1 /nobreak > nul
    goto :scar_wait_loop
)
echo         %ESC%[91mSCAR service      FAILED%ESC%[0m
:scar_done

:: Step 3: Final health summary
echo.
echo  %ESC%[90m[%ESC%[0m%ESC%[97m3%ESC%[0m%ESC%[90m/%ESC%[0m%ESC%[97m4%ESC%[0m%ESC%[90m]%ESC%[0m Health Summary...
echo.
echo         ┌─────────────────────────────────────────┐
echo         │  SYSTEM STATUS: %HEALTHY_COUNT%/%TOTAL_CHECKS% services healthy        │
echo         └─────────────────────────────────────────┘
echo.

:: Step 4: Start Claude Code in Windows Terminal (proper Ctrl+V support)
echo  %ESC%[90m[%ESC%[0m%ESC%[97m4%ESC%[0m%ESC%[90m/%ESC%[0m%ESC%[97m4%ESC%[0m%ESC%[90m]%ESC%[0m Launching Claude Code...

:: Determine READY status based on health checks
if "%HEALTHY_COUNT%"=="%TOTAL_CHECKS%" (
    echo.
    echo         %ESC%[97m%ESC%[1m=====================================%ESC%[0m
    echo         %ESC%[92m%ESC%[1m          R E A D Y                %ESC%[0m
    echo         %ESC%[97m%ESC%[1m=====================================%ESC%[0m
    echo.
    echo         %ESC%[92mAll systems operational.%ESC%[0m
) else (
    echo.
    echo         %ESC%[97m%ESC%[1m=====================================%ESC%[0m
    echo         %ESC%[93m%ESC%[1m      P A R T I A L   R E A D Y    %ESC%[0m
    echo         %ESC%[97m%ESC%[1m=====================================%ESC%[0m
    echo.
    echo         %ESC%[93m%HEALTHY_COUNT%/%TOTAL_CHECKS% services running. Some features may not work.%ESC%[0m
    echo.
    echo         %ESC%[90mCheck failed services above for details.%ESC%[0m
)
echo         %ESC%[90mWindows Terminal will open with Claude Code.%ESC%[0m
echo         %ESC%[90mType your message. When done, type 'exit'.%ESC%[0m
echo.

:: Run Claude Code in Windows Terminal (use node directly, not .cmd wrapper)
set NODE_EXE=C:\Program Files\nodejs\node.exe
set CLAUDE_CLI=C:\Users\peace\AppData\Roaming\npm\node_modules\@anthropic-ai\claude-code\cli.js
wt.exe --title "Keystone AI" -- "%NODE_EXE%" "%CLAUDE_CLI%" %*

echo.
echo  %ESC%[90m================================================================%ESC%[0m
echo   %ESC%[91m%ESC%[1mSESSION ENDED%ESC%[0m
echo  %ESC%[90m================================================================%ESC%[0m
echo.
echo  Running final updates...
echo.

:: Final updates before closing
echo  %ESC%[90m[%ESC%[0m%ESC%[97m1%ESC%[0m%ESC%[90m/%ESC%[0m%ESC%[97m2%ESC%[0m%ESC%[90m]%ESC%[0m Syncing search index...
cd /d %KEYSTONE_AGENTS% && %BUN_EXE% run clawmem-daemon.ts reindex 2>nul

echo  %ESC%[90m[%ESC%[0m%ESC%[97m2%ESC%[0m%ESC%[90m/%ESC%[0m%ESC%[97m2%ESC%[0m%ESC%[90m]%ESC%[0m Saving session...
echo         Done %ESC%[92mOK%ESC%[0m

echo.
echo  %ESC%[90m================================================================%ESC%[0m
echo   %ESC%[92mSafe to close. All data saved.%ESC%[0m
echo  %ESC%[90m================================================================%ESC%[0m
echo.
pause
