@echo off
setlocal
cd /d "%~dp0"
set "PORT=4174"
set "URL=http://127.0.0.1:%PORT%/index.html"

echo ============================================================
echo   ACADEMIA NORTEAMERICANA - SPEAK LAB PHASE 0

echo   Flujo: LISTEN - RECORD - REPLAY - RETRY

echo   Fase 0 no envia audio a backend ni calcula notas.
echo ============================================================
echo.

where py >nul 2>&1
if %errorlevel%==0 goto :use_py

where python >nul 2>&1
if %errorlevel%==0 goto :use_python

echo ERROR: No se encontro Python instalado.
echo Instala Python o sirve esta carpeta con cualquier servidor localhost.
echo.
pause
exit /b 1

:use_py
start "SPEAK LAB Phase 0 - servidor" cmd /k "cd /d ""%~dp0"" && py -3 -m http.server %PORT% --bind 127.0.0.1"
goto :open

:use_python
start "SPEAK LAB Phase 0 - servidor" cmd /k "cd /d ""%~dp0"" && python -m http.server %PORT% --bind 127.0.0.1"
goto :open

:open
timeout /t 2 /nobreak >nul
start "" "%URL%"
echo SPEAK LAB se abrio en:
echo %URL%
echo.
echo Mantene abierta la ventana del servidor durante la prueba.
echo Para terminar, cerra la ventana titulada "SPEAK LAB Phase 0 - servidor".
echo.
pause
