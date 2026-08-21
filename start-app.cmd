@echo off
setlocal

set "PROJECT_ROOT=%~dp0"
set "BACKEND_DIR=%PROJECT_ROOT%Backend\Backend"
set "FRONTEND_DIR=%PROJECT_ROOT%frontend"

echo Starting AI Recruitment Platform...
echo.
echo Backend:  https://localhost:7184
echo Frontend: http://localhost:5173
echo.

start "AI Recruitment Backend" /D "%BACKEND_DIR%" cmd /k "dotnet run --launch-profile https"
start "AI Recruitment Frontend" /D "%FRONTEND_DIR%" cmd /k "npm.cmd run dev"

echo Waiting for the development servers...
timeout /t 5 /nobreak >nul
start "" "http://localhost:5173"

endlocal
