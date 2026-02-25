@echo off
echo ============================================================
echo              KEYSTONE - INSTALL DEPENDENCIES
echo ============================================================
echo.
echo This will install all required dependencies.
echo You need Bun installed first.
echo.

set BUN_EXE=C:\Users\peace\.bun\bin\bun.exe
set KEYSTONE_DIR=%~dp0

if not exist "%BUN_EXE%" (
    echo ERROR: Bun not found!
    echo.
    echo Install Bun from: https://bun.sh
    echo Or run: powershell -c "irm bun.sh/install.ps1 | iex"
    pause
    exit /b 1
)

echo Installing search dependencies...
cd /d "%KEYSTONE_DIR%search"
%BUN_EXE% install

echo.
echo Installing agents dependencies...
cd /d "%KEYSTONE_DIR%agents"
%BUN_EXE% install

echo.
echo ============================================================
echo  Installation complete!
echo.
echo  Now run SEARCH.bat to search your files.
echo ============================================================
echo.
pause
