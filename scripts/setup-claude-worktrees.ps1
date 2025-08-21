# setup-claude-worktrees.ps1
# Script optimizado para configurar Git Worktrees con Claude
# Modelo: Híbrido por tipo de trabajo

param(
    [Parameter(Position=0)]
    [ValidateSet("init", "create", "switch", "status", "clean")]
    [string]$Command = "status",
    
    [Parameter(Position=1)]
    [ValidateSet("hotfix", "next", "sandbox", "custom")]
    [string]$Type,
    
    [Parameter(Position=2)]
    [string]$BranchName
)

$BaseDir = Split-Path (Get-Location)
$MainRepo = "devaltamedica"
$CurrentBranch = git branch --show-current

# Configuración de cada tipo de worktree
$WorktreeConfigs = @{
    hotfix = @{
        name = "devaltamedica-hotfix"
        claudeInstructions = @"
# 🔥 HOTFIX Worktree - Correcciones Urgentes

## Prioridad
1. Correcciones rápidas y críticas
2. Bugs en producción
3. Errores de CI/CD

## Reglas para Claude
- Cambios mínimos y quirúrgicos
- NO refactoring grande
- NO nuevas features
- Foco en estabilidad
- Tests obligatorios para cada fix

## Contexto
- Branch base: main o release/*
- Merge strategy: cherry-pick a main
- Tiempo máximo: 2-4 horas por fix
"@
    }
    
    next = @{
        name = "devaltamedica-next"
        claudeInstructions = @"
# 🚀 NEXT Worktree - Próxima Feature Grande

## Prioridad
1. Desarrollo de features completas
2. Refactoring mayor
3. Nuevas integraciones

## Reglas para Claude
- Libertad para refactoring
- Crear nuevos packages si necesario
- Documentación completa
- Testing exhaustivo
- Optimización de performance

## Contexto
- Branch base: develop o feature/*
- Merge strategy: PR con review
- Tiempo: 1-2 semanas por feature
"@
    }
    
    sandbox = @{
        name = "devaltamedica-sandbox"
        claudeInstructions = @"
# 🧪 SANDBOX Worktree - Experimentos con Claude

## Prioridad
1. Probar ideas nuevas
2. POCs y prototipos
3. Testing de herramientas
4. Auditorías con Claude

## Reglas para Claude
- Total libertad creativa
- Permitido romper cosas
- No restrictions en refactoring
- Generar reportes y análisis
- Explorar optimizaciones

## Contexto
- Branch base: cualquiera
- NO merge directo a main
- Tiempo: ilimitado
- Objetivo: aprendizaje y exploración
"@
    }
}

function Initialize-Worktrees {
    Write-Host "`n🎯 Inicializando modelo de worktrees recomendado para Claude..." -ForegroundColor Cyan
    
    # Crear estructura base
    foreach ($config in $WorktreeConfigs.GetEnumerator()) {
        $worktreePath = "$BaseDir\$($config.Value.name)"
        
        if (Test-Path $worktreePath) {
            Write-Host "⚠️  $($config.Value.name) ya existe" -ForegroundColor Yellow
        } else {
            Write-Host "📁 Creando $($config.Key) worktree..." -ForegroundColor Green
            
            # Determinar branch según tipo
            $branch = switch ($config.Key) {
                "hotfix" { "main" }
                "next" { if (git branch -r | Select-String "develop") { "develop" } else { "main" } }
                "sandbox" { $CurrentBranch }
            }
            
            # Crear worktree
            git worktree add "$worktreePath" $branch
            
            # Configurar Claude
            Setup-ClaudeConfig -Path $worktreePath -Config $config.Value
        }
    }
    
    Write-Host "`n✅ Modelo de worktrees configurado!" -ForegroundColor Green
    Show-Status
}

function Setup-ClaudeConfig {
    param($Path, $Config)
    
    $claudeDir = "$Path\.claude"
    New-Item -ItemType Directory -Force -Path $claudeDir | Out-Null
    
    # Crear CLAUDE.md específico
    $Config.claudeInstructions | Out-File "$claudeDir\CLAUDE.md" -Encoding UTF8
    
    # Crear settings.json
    $settings = @{
        worktreeType = $Config.name
        contextStrategy = "full"
        autoAudit = $true
        lintOnSave = $true
    } | ConvertTo-Json -Depth 2
    
    $settings | Out-File "$claudeDir\settings.json" -Encoding UTF8
}

function Create-Worktree {
    param($Type, $BranchName)
    
    if (-not $Type -or -not $BranchName) {
        Write-Error "Tipo y nombre de branch requeridos"
        exit 1
    }
    
    $config = $WorktreeConfigs[$Type]
    if (-not $config) {
        Write-Error "Tipo no válido: $Type"
        exit 1
    }
    
    $worktreeName = if ($Type -eq "custom") { 
        "devaltamedica-$BranchName" 
    } else { 
        $config.name 
    }
    
    $worktreePath = "$BaseDir\$worktreeName"
    
    # Crear worktree
    Write-Host "🌳 Creando worktree: $worktreeName" -ForegroundColor Green
    git worktree add "$worktreePath" -b $BranchName
    
    # Configurar Claude
    Setup-ClaudeConfig -Path $worktreePath -Config $config
    
    Write-Host "✅ Worktree creado y configurado para Claude!" -ForegroundColor Green
    Write-Host "📂 Path: $worktreePath" -ForegroundColor Cyan
    Write-Host "🎯 Tipo: $Type" -ForegroundColor Yellow
}

function Switch-Worktree {
    param($Type)
    
    if (-not $Type) {
        Write-Error "Tipo requerido para switch"
        exit 1
    }
    
    $config = $WorktreeConfigs[$Type]
    $worktreePath = "$BaseDir\$($config.name)"
    
    if (Test-Path $worktreePath) {
        Set-Location $worktreePath
        Write-Host "📂 Cambiado a: $($config.name)" -ForegroundColor Green
        
        # Mostrar contexto Claude
        if (Test-Path ".claude\CLAUDE.md") {
            Write-Host "`n📋 Instrucciones de Claude para este worktree:" -ForegroundColor Cyan
            Get-Content ".claude\CLAUDE.md" | Select-Object -First 10
        }
        
        # Mostrar estado git
        Write-Host "`n📊 Estado Git:" -ForegroundColor Yellow
        git status -s
    } else {
        Write-Error "Worktree no encontrado: $Type"
    }
}

function Show-Status {
    Write-Host "`n📊 Estado de Worktrees:" -ForegroundColor Cyan
    Write-Host "=" * 60 -ForegroundColor DarkGray
    
    git worktree list | ForEach-Object {
        $line = $_
        if ($line -match "(.*?)\s+\w+\s+\[(.+?)\]") {
            $path = $Matches[1].Trim()
            $branch = $Matches[2].Trim()
            $name = Split-Path $path -Leaf
            
            $type = switch -Wildcard ($name) {
                "*-hotfix" { "🔥 HOTFIX" }
                "*-next" { "🚀 NEXT" }
                "*-sandbox" { "🧪 SANDBOX" }
                default { "📁 MAIN" }
            }
            
            Write-Host "$type | $name | [$branch]" -ForegroundColor $(
                if ($path -eq (Get-Location).Path) { "Green" } else { "White" }
            )
        }
    }
    
    Write-Host "=" * 60 -ForegroundColor DarkGray
    Write-Host "`n💡 Usa 'switch' para cambiar entre worktrees" -ForegroundColor Yellow
}

function Clean-Worktrees {
    Write-Host "🧹 Limpiando worktrees huérfanos..." -ForegroundColor Yellow
    git worktree prune
    Write-Host "✅ Limpieza completada" -ForegroundColor Green
}

# Ejecutar comando
switch ($Command) {
    "init" { Initialize-Worktrees }
    "create" { Create-Worktree -Type $Type -BranchName $BranchName }
    "switch" { Switch-Worktree -Type $Type }
    "status" { Show-Status }
    "clean" { Clean-Worktrees }
    default { Show-Status }
}