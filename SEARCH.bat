@echo off
setlocal enabledelayedexpansion

echo ============================================================
echo              KEYSTONE SEARCH
echo ============================================================
echo.

set KEYSTONE_DIR=%~dp0
set SEARCH_DIR=%KEYSTONE_DIR%search
set INDEX_PATH=%KEYSTONE_DIR%database\index.sqlite
set KEYSTONE_EMBED_URL=http://localhost:11434
set KEYSTONE_LLM_URL=http://localhost:11434
set BUN_EXE=C:\Users\peace\.bun\bin\bun.exe

cd /d "%SEARCH_DIR%"

if "%1"=="" (
    echo USAGE: SEARCH.bat [command] [query]
    echo.
    echo COMMANDS:
    echo   search "query"     - Text search (keyword matching)
    echo   vsearch "query"    - Vector search (semantic understanding)
    echo   status             - Check index status
    echo   update             - Add new files to index
    echo.
    echo EXAMPLES:
    echo   SEARCH.bat search "security"
    echo   SEARCH.bat vsearch "how does protection work"
    echo.
    pause
    goto :end
)

if "%1"=="search" (
    %BUN_EXE% run src/clawmem.ts search %2 %3 %4 %5
    goto :end
)

if "%1"=="vsearch" (
    %BUN_EXE% run src/clawmem.ts vsearch %2 %3 %4 %5
    goto :end
)

if "%1"=="query" (
    %BUN_EXE% run src/clawmem.ts query %2 %3 %4 %5
    goto :end
)

if "%1"=="status" (
    %BUN_EXE% run src/clawmem.ts status
    goto :end
)

if "%1"=="update" (
    %BUN_EXE% run src/clawmem.ts update
    goto :end
)

echo Unknown command: %1
echo Use: search, vsearch, query, or status

:end
pause
