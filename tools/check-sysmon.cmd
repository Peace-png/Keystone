@echo off
echo ========================================
echo SYSMON STATUS CHECK
echo ========================================
echo.
sc query Sysmon64 | findstr STATE
echo.
echo ========================================
echo RECENT SYSMON EVENTS (last 10)
echo ========================================
echo.
powershell -Command "Get-WinEvent -LogName 'Microsoft-Windows-Sysmon/Operational' -MaxEvents 10 2>$null | Select-Object TimeCreated, Id, @{N='Process';E={$_.Properties[0].Value}} | Format-Table -AutoSize"
echo.
echo If you see events above, Sysmon is working.
echo If you see errors, run this as Administrator.
echo.
pause
