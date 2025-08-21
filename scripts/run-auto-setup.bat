@echo off
echo.
echo =====================================================
echo    SETUP AUTOMATICO COMPLETO CI/CD ALTAMEDICA
echo =====================================================
echo.

REM Run the automatic GitHub setup
echo [1/2] Ejecutando configuracion automatica de GitHub...
node scripts/auto-setup-github.js

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo Error durante la configuracion. Intentando setup basico...
    node scripts/setup-ci.js
)

echo.
echo [2/2] Creando labels en GitHub...
node scripts/create-github-labels.js

echo.
echo =====================================================
echo    CONFIGURACION COMPLETADA
echo =====================================================
echo.
echo Comandos disponibles:
echo   pnpm dev          - Desarrollo local
echo   pnpm lint:fix     - Arreglar problemas de lint
echo   pnpm ci:validate  - Validar CI localmente
echo   pnpm ci:build     - Build completo
echo   pnpm test         - Ejecutar tests
echo.
pause