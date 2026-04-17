@echo off
echo ========================================
echo   SprachBrücke - App starten
echo ========================================
echo.
echo [1] Server wird gestartet (Port 5000)...
start "SprachBrücke Server" cmd /k "cd /d %~dp0server && npm run dev"

echo [2] Warte 3 Sekunden...
timeout /t 3 /nobreak > nul

echo [3] Client wird gestartet (Port 5173)...
start "SprachBrücke Client" cmd /k "cd /d %~dp0client && npm run dev"

echo.
echo ========================================
echo   App läuft!
echo   Frontend: http://localhost:5173
echo   Backend:  http://localhost:5000
echo ========================================
echo.
pause
