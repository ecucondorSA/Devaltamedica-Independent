@echo off
echo.
echo 🏥 ===================================================
echo    🩺 ALTAMEDICA - DIAGNÓSTICO MÉDICO DIGITAL
echo    👨‍⚕️ Dr. Claude - Especialista en Apps Médicas
echo 🏥 ===================================================
echo.

echo 📋 Verificando que la aplicación esté corriendo...
timeout /t 2 /nobreak >nul

curl -s http://localhost:3003 >nul
if %errorlevel% neq 0 (
    echo ❌ ERROR: La aplicación no está corriendo en localhost:3003
    echo 💊 TRATAMIENTO: Ejecutar 'npm run dev' antes de continuar
    echo.
    pause
    exit /b 1
)

echo ✅ Aplicación detectada en localhost:3003
echo.

echo 🔬 Instalando dependencias de diagnóstico...
call npm install @playwright/test
if %errorlevel% neq 0 (
    echo ❌ Error instalando Playwright
    pause
    exit /b 1
)

echo.
echo 🎭 Instalando navegadores de Playwright...
call npx playwright install chromium
if %errorlevel% neq 0 (
    echo ❌ Error instalando navegadores
    pause
    exit /b 1
)

echo.
echo 🩺 ===================================================
echo    INICIANDO DIAGNÓSTICO MÉDICO COMPLETO
echo 🩺 ===================================================
echo.

echo 📋 Paso 1: Diagnóstico general de la aplicación...
echo.
call npm run medical-diagnosis
if %errorlevel% neq 0 (
    echo ⚠️  Diagnóstico general completado con observaciones
) else (
    echo ✅ Diagnóstico general: EXITOSO
)

echo.
echo 🔐 Paso 2: Análisis especializado de autenticación...
echo.
call npm run auth-diagnosis
if %errorlevel% neq 0 (
    echo ⚠️  Análisis de autenticación completado con observaciones
) else (
    echo ✅ Análisis de autenticación: EXITOSO
)

echo.
echo 📡 Paso 3: Diagnóstico de red y conectividad...
echo.
call npx playwright test tests/network-diagnostic.spec.ts --headed --reporter=list
if %errorlevel% neq 0 (
    echo ⚠️  Análisis de red completado con observaciones
) else (
    echo ✅ Análisis de red: EXITOSO
)

echo.
echo 📊 ===================================================
echo    GENERANDO REPORTE MÉDICO COMPLETO
echo 📊 ===================================================
echo.

echo 📋 Generando reporte HTML completo...
call npm run full-health-check
if %errorlevel% neq 0 (
    echo ⚠️  Reporte generado con observaciones
) else (
    echo ✅ Reporte HTML generado exitosamente
)

echo.
echo 🏥 ===================================================
echo    DIAGNÓSTICO MÉDICO COMPLETADO
echo 🏥 ===================================================
echo.
echo ✅ Todos los análisis médicos han sido ejecutados
echo 📊 Reporte disponible en: test-results/html-report/
echo 📋 Logs detallados en: test-results/
echo.
echo 💊 Próximos pasos recomendados:
echo    1. Revisar reporte HTML para detalles visuales
echo    2. Implementar soluciones sugeridas por el Dr. Claude
echo    3. Ejecutar diagnósticos periódicamente
echo.
echo 📞 ¿Necesitas consulta especializada?
echo    Ejecuta: npm run playwright:ui
echo    Para análisis interactivo paso a paso
echo.

pause