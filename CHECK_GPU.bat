@echo off
echo ============================================================
echo              KEYSTONE - CHECK GPU STATUS
echo ============================================================
echo.
nvidia-smi
echo.
echo ============================================================
echo  If Ollama is running, Keystone will use your GPU.
echo  If not, run: ollama serve
echo ============================================================
echo.
pause
