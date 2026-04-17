@echo off
echo ========================================
echo   SprachBrücke - Installation
echo ========================================
echo.

echo [1/2] Installiere Server-Pakete...
cd /d %~dp0server
call npm install
if %errorlevel% neq 0 (
    echo FEHLER bei Server-Installation!
    pause
    exit /b 1
)

echo.
echo [2/2] Installiere Client-Pakete...
cd /d %~dp0client
call npm install
if %errorlevel% neq 0 (
    echo FEHLER bei Client-Installation!
    pause
    exit /b 1
)

echo.
echo ========================================
echo   Installation erfolgreich!
echo.
echo   Naechste Schritte:
echo   1. server\.env Datei oeffnen
echo   2. OPENAI_API_KEY eintragen
echo   3. start.bat doppelklicken
echo ========================================
echo.
pause
