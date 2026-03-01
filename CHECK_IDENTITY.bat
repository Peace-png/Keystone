@echo off
:: P11 ENFORCEMENT: Silent Churn Protection
:: Runs BEFORE any git write operation to prevent identity mismatch
:: Non-coders don't debug. They just leave. This catches the problem.

setlocal enabledelayedexpansion

:: Colors
for /f %%A in ('echo prompt $E^| cmd') do set "ESC=%%A"
set "GREEN=!ESC![92m"
set "RED=!ESC![91m"
set "YELLOW=!ESC![93m"
set "RESET=!ESC![0m"

:: Step 1: Check if gh CLI is available and authenticated
gh auth status >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo %YELLOW%Identity check: GitHub CLI not authenticated%RESET%
    echo.
    echo I can't verify your GitHub identity automatically.
    echo This is fine for local work, but commits may not link to your account.
    echo.
    echo If you want to fix this later, run: gh auth login
    goto :allow
)

:: Step 2: Get GitHub username
for /f "tokens=*" %%U in ('gh api user --jq .login 2^>nul') do set GITHUB_USER=%%U

if "%GITHUB_USER%"=="" (
    echo %YELLOW%Identity check: Could not fetch GitHub username%RESET%
    goto :allow
)

:: Step 3: Get current git config
for /f "tokens=*" %%E in ('git config --global user.email 2^>nul') do set GIT_EMAIL=%%E
for /f "tokens=*" %%N in ('git config --global user.name 2^>nul') do set GIT_NAME=%%N

:: Expected email format
set EXPECTED_EMAIL=%GITHUB_USER%@users.noreply.github.com

:: Step 4: Check for mismatch
set MISMATCH=0

:: Check if git email contains the GitHub username (case-insensitive check)
echo !GIT_EMAIL! | findstr /i "%GITHUB_USER%@users.noreply.github.com" >nul
if %ERRORLEVEL% neq 0 (
    set MISMATCH=1
)

if %MISMATCH%==0 (
    echo %GREEN%Identity verified. Safe to commit.%RESET%
    echo   GitHub: %GITHUB_USER%
    echo   Git:    !GIT_EMAIL!
    goto :allow
)

:: Step 5: Mismatch detected - try auto-fix
echo %YELLOW%Identity mismatch detected.%RESET%
echo   GitHub says:  %GITHUB_USER%
echo   Git config:   !GIT_EMAIL!
echo.
echo %YELLOW%Auto-fixing...%RESET%

git config --global user.email "%GITHUB_USER%@users.noreply.github.com"

:: Verify fix
for /f "tokens=*" %%E in ('git config --global user.email 2^>nul') do set NEW_EMAIL=%%E

if "%NEW_EMAIL%"=="%GITHUB_USER%@users.noreply.github.com" (
    echo %GREEN%Fixed automatically.%RESET%
    echo   New git email: %NEW_EMAIL%
    goto :allow
)

:: Step 6: Can't auto-fix - block with single instruction
echo.
echo %RED%========================================%RESET%
echo %RED%P11 VIOLATION: Identity mismatch%RESET%
echo %RED%========================================%RESET%
echo.
echo I couldn't fix this automatically.
echo.
echo ONE STEP TO FIX:
echo   Run this command: git config --global user.email "%GITHUB_USER%@users.noreply.github.com"
echo.
echo Then try again.
echo.
exit /b 1

:allow
exit /b 0
