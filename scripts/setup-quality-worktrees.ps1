# setup-quality-worktrees.ps1
# Modelo de Worktrees basado en CALIDAD y PREVENCIÓN DE ERRORES
# Diseñado para maximizar visibilidad de Claude y prevenir duplicaciones

param(
    [Parameter(Position=0)]
    [ValidateSet("init", "audit", "integrate", "validate", "status", "sync")]
    [string]$Command = "status",
    
    [Parameter(Position=1)]
    [string]$Target
)

$BaseDir = Split-Path (Get-Location)
$MainRepo = "devaltamedica"

# MODELO DE 4 WORKTREES: AUDIT → INTEGRATE → VALIDATE → PRODUCTION
$WorktreeModel = @{
    audit = @{
        name = "devaltamedica-audit"
        branch = "audit/cleanup-and-analysis"
        purpose = "Detectar y eliminar duplicaciones, código muerto, errores de tipos"
        claudeInstructions = @"
# 🔍 AUDIT WORKTREE - Análisis y Limpieza Profunda

## MISIÓN CRÍTICA
DETECTAR Y ELIMINAR:
- Duplicaciones de código
- Archivos obsoletos
- Imports no usados
- Tipos incorrectos
- Violaciones de lint
- Dependencias circulares
- Código muerto

## HERRAMIENTAS OBLIGATORIAS ANTES DE CUALQUIER ACCIÓN

\`\`\`powershell
# SIEMPRE ejecutar antes de cualquier cambio
powershell -File scripts/pre-operation-check.ps1 -Detailed

# Buscar duplicaciones
powershell -File scripts/find-duplications.ps1

# Verificar tipos
pnpm type-check

# Verificar lint
pnpm lint
\`\`\`

## REGLAS ESTRICTAS

1. **ANTES de crear CUALQUIER archivo**: Buscar 5 veces si ya existe
2. **ANTES de crear CUALQUIER función**: Grep en TODO el proyecto
3. **ANTES de crear CUALQUIER tipo**: Revisar @altamedica/types completamente
4. **ANTES de crear CUALQUIER componente**: Revisar @altamedica/ui exhaustivamente

## CHECKLIST DE AUDITORÍA

- [ ] Sin duplicaciones en packages/
- [ ] Sin duplicaciones en apps/
- [ ] Todos los tipos centralizados en @altamedica/types
- [ ] Todos los hooks centralizados en @altamedica/hooks
- [ ] Sin archivos .d.ts locales
- [ ] Sin imports circulares
- [ ] Cobertura de tipos 100%
- [ ] Lint passing 100%

## REPORTES OBLIGATORIOS

Después de cada sesión, generar:
- AUDIT_REPORT_[fecha].md
- DUPLICATIONS_FOUND_[fecha].md
- TYPES_VIOLATIONS_[fecha].md
"@
    }
    
    integrate = @{
        name = "devaltamedica-integrate"
        branch = "integrate/connect-features"
        purpose = "Conectar features existentes, hacer que funcionen E2E"
        claudeInstructions = @"
# 🔗 INTEGRATE WORKTREE - Integración de Features Existentes

## MISIÓN CRÍTICA
Las features YA ESTÁN PROGRAMADAS. Tu trabajo es:
- CONECTARLAS correctamente
- HACERLAS FUNCIONAR para el usuario final
- VERIFICAR flujos E2E completos
- NO crear nuevas features
- NO duplicar código existente

## ANÁLISIS OBLIGATORIO ANTES DE INTEGRAR

\`\`\`powershell
# Mapear todas las features existentes
powershell -File scripts/map-existing-features.ps1

# Verificar conexiones rotas
powershell -File scripts/check-integrations.ps1

# Listar todos los endpoints API
powershell -File scripts/list-api-endpoints.ps1
\`\`\`

## PROCESO DE INTEGRACIÓN

1. **IDENTIFICAR** la feature existente en el código
2. **MAPEAR** sus dependencias (API, tipos, hooks)
3. **CONECTAR** frontend con backend
4. **VERIFICAR** flujo completo E2E
5. **DOCUMENTAR** la integración

## PUNTOS DE INTEGRACIÓN CRÍTICOS

### Frontend → Backend
- Verificar que useQuery apunte a endpoints correctos
- Verificar que los tipos match exactamente
- Verificar autenticación y permisos

### Apps → Packages
- Importar SOLO desde packages/@altamedica/*
- NUNCA crear componentes locales si existen en packages
- SIEMPRE reutilizar hooks existentes

### Flujos E2E Prioritarios
1. Login → Dashboard → Feature
2. Patient → Appointment → Telemedicine
3. Doctor → Schedule → VideoCall
4. Admin → Reports → Analytics

## PROHIBICIONES ABSOLUTAS

❌ NUNCA crear nuevos componentes sin verificar packages/ui
❌ NUNCA crear nuevos hooks sin verificar packages/hooks
❌ NUNCA crear nuevos tipos sin verificar packages/types
❌ NUNCA duplicar lógica de API
❌ NUNCA crear features nuevas (ya están todas)

## VERIFICACIÓN POST-INTEGRACIÓN

- [ ] Feature visible en UI
- [ ] Datos fluyendo desde API
- [ ] Sin errores en consola
- [ ] Sin errores de tipos
- [ ] Tests E2E pasando
"@
    }
    
    validate = @{
        name = "devaltamedica-validate"
        branch = "validate/testing-and-qa"
        purpose = "Validar que todo funciona, correr tests, verificar builds"
        claudeInstructions = @"
# ✅ VALIDATE WORKTREE - Validación y Testing Completo

## MISIÓN CRÍTICA
VERIFICAR que TODO funciona:
- Sin errores de build
- Sin errores de tipos
- Sin errores de lint
- Tests pasando
- Features funcionando E2E

## BATERÍA DE VALIDACIÓN COMPLETA

\`\`\`powershell
# Suite completa de validación
powershell -File scripts/full-validation-suite.ps1

# Incluye:
# - Type checking todos los packages
# - Lint todos los packages
# - Build todos los packages
# - Tests unitarios
# - Tests E2E
# - Verificación de imports
# - Detección de código muerto
\`\`\`

## MATRIZ DE VALIDACIÓN

| Área | Comando | Criterio de Éxito |
|------|---------|-------------------|
| Types | pnpm type-check | 0 errores |
| Lint | pnpm lint | 0 errores, 0 warnings |
| Build | pnpm build | Todos los packages built |
| Tests | pnpm test | >80% coverage |
| E2E | pnpm test:e2e | Flujos críticos passing |

## CHECKLIST DE VALIDACIÓN POR APP

### Patients App
- [ ] Login funciona
- [ ] Dashboard carga
- [ ] Appointments visibles
- [ ] Telemedicine conecta
- [ ] Profile editable

### Doctors App
- [ ] Login funciona
- [ ] Schedule visible
- [ ] Patients listados
- [ ] VideoCall funciona
- [ ] Prescriptions creables

### Admin App
- [ ] Login funciona
- [ ] Métricas visibles
- [ ] Users gestionables
- [ ] Reports generables

## REPORTE DE VALIDACIÓN

Generar después de cada sesión:
- VALIDATION_REPORT_[fecha].md
- TEST_RESULTS_[fecha].md
- BUILD_STATUS_[fecha].md
"@
    }
    
    production = @{
        name = "devaltamedica"
        branch = "main"
        purpose = "Código limpio, validado y listo para producción"
        claudeInstructions = @"
# 🚀 PRODUCTION WORKTREE - Código Listo para Deploy

## ESTADO REQUERIDO
- ✅ Auditado (sin duplicaciones)
- ✅ Integrado (features funcionando)
- ✅ Validado (tests pasando)
- ✅ Optimizado (performance OK)

## SOLO CAMBIOS PERMITIDOS
- Hotfixes críticos
- Ajustes de configuración
- Updates de seguridad

## PROHIBICIONES
- NO nuevas features
- NO refactoring
- NO cambios experimentales
"@
    }
}

# Función para crear script de búsqueda de duplicaciones
function Create-DuplicationFinder {
    $scriptContent = @'
# find-duplications.ps1
param([string]$Target = "all")

Write-Host "🔍 Buscando duplicaciones en el proyecto..." -ForegroundColor Cyan

$duplications = @()

# Buscar componentes duplicados
$components = @{}
Get-ChildItem -Path . -Include "*.tsx","*.jsx" -Recurse | ForEach-Object {
    if ($_.FullName -notmatch "node_modules|dist|build") {
        $content = Get-Content $_.FullName -Raw
        if ($content -match "export\s+(function|const)\s+(\w+)") {
            $componentName = $Matches[2]
            if ($components.ContainsKey($componentName)) {
                $duplications += "DUPLICADO: Component '$componentName' en $($_.FullName) y $($components[$componentName])"
            } else {
                $components[$componentName] = $_.FullName
            }
        }
    }
}

# Buscar hooks duplicados
$hooks = @{}
Get-ChildItem -Path . -Include "use*.ts","use*.tsx" -Recurse | ForEach-Object {
    if ($_.FullName -notmatch "node_modules|dist|build") {
        $hookName = $_.BaseName
        if ($hooks.ContainsKey($hookName)) {
            $duplications += "DUPLICADO: Hook '$hookName' en $($_.FullName) y $($hooks[$hookName])"
        } else {
            $hooks[$hookName] = $_.FullName
        }
    }
}

# Buscar tipos duplicados
$types = @{}
Get-ChildItem -Path . -Include "*.types.ts","*.d.ts" -Recurse | ForEach-Object {
    if ($_.FullName -notmatch "node_modules|dist|build|@types") {
        $content = Get-Content $_.FullName -Raw
        if ($content -match "export\s+(interface|type)\s+(\w+)") {
            $typeName = $Matches[2]
            if ($types.ContainsKey($typeName)) {
                $duplications += "DUPLICADO: Type '$typeName' en $($_.FullName) y $($types[$typeName])"
            } else {
                $types[$typeName] = $_.FullName
            }
        }
    }
}

# Generar reporte
if ($duplications.Count -gt 0) {
    Write-Host "❌ Se encontraron $($duplications.Count) duplicaciones:" -ForegroundColor Red
    $duplications | ForEach-Object { Write-Host "  $_" -ForegroundColor Yellow }
    
    # Guardar reporte
    $date = Get-Date -Format "yyyy-MM-dd"
    $duplications | Out-File "DUPLICATIONS_FOUND_$date.md"
} else {
    Write-Host "✅ No se encontraron duplicaciones!" -ForegroundColor Green
}

# Resumen
Write-Host "`n📊 Resumen:" -ForegroundColor Cyan
Write-Host "  Componentes únicos: $($components.Count)" -ForegroundColor White
Write-Host "  Hooks únicos: $($hooks.Count)" -ForegroundColor White
Write-Host "  Tipos únicos: $($types.Count)" -ForegroundColor White
Write-Host "  Duplicaciones: $($duplications.Count)" -ForegroundColor $(if ($duplications.Count -eq 0) { "Green" } else { "Red" })
'@
    
    $scriptContent | Out-File "$BaseDir\$MainRepo\scripts\find-duplications.ps1" -Encoding UTF8
}

# Función para crear script de mapeo de features
function Create-FeatureMapper {
    $scriptContent = @'
# map-existing-features.ps1
Write-Host "🗺️ Mapeando todas las features existentes..." -ForegroundColor Cyan

$features = @{
    "Authentication" = @{
        Backend = @(
            "apps/api-server/src/routes/auth/*"
            "packages/auth/src/*"
        )
        Frontend = @(
            "apps/*/src/app/auth/*"
            "packages/auth/src/components/*"
        )
        Status = "Implementado"
    }
    "Telemedicine" = @{
        Backend = @(
            "apps/api-server/src/routes/telemedicine/*"
            "packages/telemedicine-core/*"
        )
        Frontend = @(
            "apps/doctors/src/app/telemedicine/*"
            "apps/patients/src/app/video-call/*"
        )
        Status = "Necesita integración"
    }
    "Appointments" = @{
        Backend = @(
            "apps/api-server/src/routes/appointments/*"
        )
        Frontend = @(
            "apps/patients/src/app/appointments/*"
            "apps/doctors/src/app/schedule/*"
        )
        Status = "Parcialmente integrado"
    }
    "Medical Records" = @{
        Backend = @(
            "apps/api-server/src/routes/medical-records/*"
            "packages/medical-services/*"
        )
        Frontend = @(
            "apps/doctors/src/app/patients/[id]/history/*"
            "packages/medical/src/components/*"
        )
        Status = "Implementado"
    }
}

# Verificar existencia de archivos
foreach ($feature in $features.GetEnumerator()) {
    Write-Host "`n📦 $($feature.Key) - Estado: $($feature.Value.Status)" -ForegroundColor Yellow
    
    Write-Host "  Backend:" -ForegroundColor Cyan
    foreach ($path in $feature.Value.Backend) {
        $exists = Test-Path $path
        $color = if ($exists) { "Green" } else { "Red" }
        $symbol = if ($exists) { "✓" } else { "✗" }
        Write-Host "    $symbol $path" -ForegroundColor $color
    }
    
    Write-Host "  Frontend:" -ForegroundColor Cyan
    foreach ($path in $feature.Value.Frontend) {
        $exists = Test-Path $path
        $color = if ($exists) { "Green" } else { "Red" }
        $symbol = if ($exists) { "✓" } else { "✗" }
        Write-Host "    $symbol $path" -ForegroundColor $color
    }
}

# Generar reporte
$date = Get-Date -Format "yyyy-MM-dd"
$features | ConvertTo-Json -Depth 3 | Out-File "FEATURES_MAP_$date.json"
Write-Host "`n✅ Mapa de features guardado en FEATURES_MAP_$date.json" -ForegroundColor Green
'@
    
    $scriptContent | Out-File "$BaseDir\$MainRepo\scripts\map-existing-features.ps1" -Encoding UTF8
}

# Función para crear suite de validación completa
function Create-ValidationSuite {
    $scriptContent = @'
# full-validation-suite.ps1
Write-Host "🔧 Ejecutando Suite de Validación Completa..." -ForegroundColor Cyan
Write-Host "=" * 60 -ForegroundColor DarkGray

$results = @{
    TypeCheck = @{}
    Lint = @{}
    Build = @{}
    Tests = @{}
    Overall = "PENDING"
}

# 1. Type Checking
Write-Host "`n📝 Type Checking..." -ForegroundColor Yellow
$typeResult = & pnpm type-check 2>&1
$results.TypeCheck.Success = $LASTEXITCODE -eq 0
$results.TypeCheck.Output = $typeResult -join "`n"

if ($results.TypeCheck.Success) {
    Write-Host "  ✅ Type check passed!" -ForegroundColor Green
} else {
    Write-Host "  ❌ Type check failed!" -ForegroundColor Red
    Write-Host $results.TypeCheck.Output -ForegroundColor DarkRed
}

# 2. Linting
Write-Host "`n🧹 Linting..." -ForegroundColor Yellow
$lintResult = & pnpm lint 2>&1
$results.Lint.Success = $LASTEXITCODE -eq 0
$results.Lint.Output = $lintResult -join "`n"

if ($results.Lint.Success) {
    Write-Host "  ✅ Lint passed!" -ForegroundColor Green
} else {
    Write-Host "  ❌ Lint failed!" -ForegroundColor Red
}

# 3. Build
Write-Host "`n🏗️ Building packages..." -ForegroundColor Yellow
$buildResult = & pnpm build 2>&1
$results.Build.Success = $LASTEXITCODE -eq 0
$results.Build.Output = $buildResult -join "`n"

if ($results.Build.Success) {
    Write-Host "  ✅ Build successful!" -ForegroundColor Green
} else {
    Write-Host "  ❌ Build failed!" -ForegroundColor Red
}

# 4. Tests (si existen)
Write-Host "`n🧪 Running tests..." -ForegroundColor Yellow
if (Test-Path "package.json") {
    $packageJson = Get-Content "package.json" | ConvertFrom-Json
    if ($packageJson.scripts.test) {
        $testResult = & pnpm test 2>&1
        $results.Tests.Success = $LASTEXITCODE -eq 0
        $results.Tests.Output = $testResult -join "`n"
        
        if ($results.Tests.Success) {
            Write-Host "  ✅ Tests passed!" -ForegroundColor Green
        } else {
            Write-Host "  ❌ Tests failed!" -ForegroundColor Red
        }
    } else {
        Write-Host "  ⚠️ No tests configured" -ForegroundColor Yellow
        $results.Tests.Success = $true
    }
}

# Overall Result
$results.Overall = if (
    $results.TypeCheck.Success -and 
    $results.Lint.Success -and 
    $results.Build.Success -and 
    $results.Tests.Success
) { "PASSED" } else { "FAILED" }

# Generar reporte
Write-Host "`n" + "=" * 60 -ForegroundColor DarkGray
if ($results.Overall -eq "PASSED") {
    Write-Host "🎉 VALIDACIÓN COMPLETA EXITOSA!" -ForegroundColor Green
} else {
    Write-Host "❌ VALIDACIÓN FALLÓ" -ForegroundColor Red
    Write-Host "Revisa los errores arriba para más detalles" -ForegroundColor Yellow
}

# Guardar reporte
$date = Get-Date -Format "yyyy-MM-dd-HHmm"
$results | ConvertTo-Json -Depth 3 | Out-File "VALIDATION_REPORT_$date.json"
Write-Host "`n📄 Reporte guardado en VALIDATION_REPORT_$date.json" -ForegroundColor Cyan
'@
    
    $scriptContent | Out-File "$BaseDir\$MainRepo\scripts\full-validation-suite.ps1" -Encoding UTF8
}

function Initialize-QualityWorktrees {
    Write-Host "`n🎯 Inicializando Modelo de Worktrees por Calidad..." -ForegroundColor Cyan
    Write-Host "Este modelo está diseñado para PREVENIR DUPLICACIONES y ERRORES" -ForegroundColor Yellow
    
    # Crear scripts auxiliares
    Write-Host "`n📝 Creando scripts de análisis..." -ForegroundColor Green
    Create-DuplicationFinder
    Create-FeatureMapper
    Create-ValidationSuite
    
    # Crear worktrees
    foreach ($wt in @("audit", "integrate", "validate")) {
        $config = $WorktreeModel[$wt]
        $worktreePath = "$BaseDir\$($config.name)"
        
        if (Test-Path $worktreePath) {
            Write-Host "⚠️  $($config.name) ya existe" -ForegroundColor Yellow
        } else {
            Write-Host "`n📁 Creando $wt worktree..." -ForegroundColor Green
            
            # Crear branch si no existe
            $branchExists = git branch -r | Select-String $config.branch
            if (-not $branchExists) {
                git branch $config.branch
            }
            
            # Crear worktree
            git worktree add "$worktreePath" $config.branch
            
            # Configurar Claude
            $claudeDir = "$worktreePath\.claude"
            New-Item -ItemType Directory -Force -Path $claudeDir | Out-Null
            $config.claudeInstructions | Out-File "$claudeDir\CLAUDE.md" -Encoding UTF8
            
            # Copiar scripts al worktree
            Copy-Item "$BaseDir\$MainRepo\scripts\*.ps1" "$worktreePath\scripts\" -Force
        }
    }
    
    Write-Host "`n✅ Modelo de Calidad configurado!" -ForegroundColor Green
    Write-Host "`n📋 FLUJO DE TRABAJO:" -ForegroundColor Cyan
    Write-Host "  1. AUDIT → Limpia duplicaciones y errores" -ForegroundColor White
    Write-Host "  2. INTEGRATE → Conecta features existentes" -ForegroundColor White
    Write-Host "  3. VALIDATE → Verifica que todo funciona" -ForegroundColor White
    Write-Host "  4. PRODUCTION → Merge a main cuando esté perfecto" -ForegroundColor White
}

function Run-Audit {
    param($Target)
    
    $auditPath = "$BaseDir\devaltamedica-audit"
    if (-not (Test-Path $auditPath)) {
        Write-Error "Audit worktree no existe. Ejecuta 'init' primero"
        return
    }
    
    Set-Location $auditPath
    Write-Host "🔍 Ejecutando auditoría en: $Target" -ForegroundColor Cyan
    
    # Ejecutar scripts de auditoría
    & powershell -File scripts\find-duplications.ps1 -Target $Target
    & powershell -File scripts\pre-operation-check.ps1 -Detailed
    
    # Type check
    Write-Host "`n📝 Verificando tipos..." -ForegroundColor Yellow
    & pnpm type-check
    
    # Lint check
    Write-Host "`n🧹 Verificando lint..." -ForegroundColor Yellow
    & pnpm lint
}

function Show-QualityStatus {
    Write-Host "`n📊 Estado del Modelo de Calidad:" -ForegroundColor Cyan
    Write-Host "=" * 60 -ForegroundColor DarkGray
    
    foreach ($wt in $WorktreeModel.GetEnumerator()) {
        $path = "$BaseDir\$($wt.Value.name)"
        $exists = Test-Path $path
        $symbol = if ($exists) { "✅" } else { "❌" }
        $color = if ($exists) { "Green" } else { "Red" }
        
        Write-Host "$symbol $($wt.Key.ToUpper().PadRight(12)) | $($wt.Value.purpose)" -ForegroundColor $color
        
        if ($exists) {
            Push-Location $path
            $branch = git branch --show-current
            $status = git status --porcelain
            $modified = if ($status) { "📝 Cambios pendientes" } else { "✨ Limpio" }
            Pop-Location
            
            Write-Host "   └─ Branch: $branch | Estado: $modified" -ForegroundColor DarkGray
        }
    }
    
    Write-Host "=" * 60 -ForegroundColor DarkGray
    Write-Host "`n💡 Comandos disponibles:" -ForegroundColor Yellow
    Write-Host "  audit [target]   - Ejecutar auditoría completa" -ForegroundColor White
    Write-Host "  integrate        - Cambiar a worktree de integración" -ForegroundColor White
    Write-Host "  validate         - Ejecutar validación completa" -ForegroundColor White
}

# Ejecutar comando
switch ($Command) {
    "init" { Initialize-QualityWorktrees }
    "audit" { Run-Audit -Target $Target }
    "integrate" { Set-Location "$BaseDir\devaltamedica-integrate" }
    "validate" { 
        Set-Location "$BaseDir\devaltamedica-validate"
        & powershell -File scripts\full-validation-suite.ps1
    }
    "status" { Show-QualityStatus }
    "sync" {
        Write-Host "🔄 Sincronizando worktrees..." -ForegroundColor Cyan
        git worktree list | ForEach-Object {
            if ($_ -match "(.*?)\s+") {
                $path = $Matches[1].Trim()
                Push-Location $path
                git pull origin main --rebase
                Pop-Location
            }
        }
    }
    default { Show-QualityStatus }
}