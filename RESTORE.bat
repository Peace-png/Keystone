@echo off
echo ============================================================
echo              KEYSTONE - RESTORE TO SYSTEM
echo ============================================================
echo.
echo This will copy everything back to your system folders.
echo Use this if you need to restore after a fresh install.
echo.

set KEYSTONE_DIR=%~dp0

echo Restoring search...
xcopy /E /I /Y "%KEYSTONE_DIR%search" "C:\Users\peace\clawmem"

echo Restoring agents...
xcopy /E /I /Y "%KEYSTONE_DIR%agents" "C:\Users\peace\clawd"

echo Restoring settings...
xcopy /E /I /Y "%KEYSTONE_DIR%settings" "C:\Users\peace\.claude"

echo Restoring core...
xcopy /E /I /Y "%KEYSTONE_DIR%core" "C:\Users\peace\.claude"

echo Restoring database...
if not exist "C:\Users\peace\.cache\keystone" mkdir "C:\Users\peace\.cache\keystone"
copy /Y "%KEYSTONE_DIR%database\index.sqlite" "C:\Users\peace\.cache\keystone\"

echo Restoring memory...
xcopy /E /I /Y "%KEYSTONE_DIR%memory" "C:\Users\peace\.claude\projects\C--Users-peace\memory\"

echo.
echo ============================================================
echo  RESTORE COMPLETE!
echo.
echo  Run INSTALL.bat to install dependencies.
echo  Then run START-KEYSTONE.cmd on your Desktop.
echo ============================================================
echo.
pause
