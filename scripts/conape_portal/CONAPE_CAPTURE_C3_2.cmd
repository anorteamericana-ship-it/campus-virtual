@echo off
setlocal
cd /d "%~dp0\..\.."
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0run_conape_capture_windows.ps1"
set EXITCODE=%ERRORLEVEL%
echo.
if "%EXITCODE%"=="0" (
  echo C3.2 finalizo correctamente.
) else (
  echo C3.2 termino bloqueado. Codigo: %EXITCODE%
)
pause
exit /b %EXITCODE%
