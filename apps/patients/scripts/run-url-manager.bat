@echo off
echo.
echo ====================================
echo   AltaMedica URL Manager
echo   Sistema de Navegacion de URLs
echo ====================================
echo.

REM Verificar si Python esta instalado
python --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Python no esta instalado o no esta en el PATH
    echo Por favor, instala Python 3.x desde https://www.python.org/
    pause
    exit /b 1
)

REM Ejecutar el URL Manager
python url_manager.py %*

REM Si no se pasaron parametros, pausar al final
if "%~1"=="" (
    echo.
    pause
)