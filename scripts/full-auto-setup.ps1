# Full Automatic CI/CD Setup for AltaMedica
# PowerShell Script para Windows

$ErrorActionPreference = "Continue"
$ProgressPreference = 'SilentlyContinue'

Write-Host "`n=====================================================" -ForegroundColor Magenta
Write-Host "   🚀 SETUP AUTOMATICO COMPLETO CI/CD ALTAMEDICA" -ForegroundColor Cyan
Write-Host "=====================================================" -ForegroundColor Magenta

# Function to check if a command exists
function Test-Command {
    param($Command)
    try {
        Get-Command $Command -ErrorAction Stop | Out-Null
        return $true
    } catch {
        return $false
    }
}

# Function to install Chocolatey if needed
function Install-Chocolatey {
    if (!(Test-Command "choco")) {
        Write-Host "`n📦 Instalando Chocolatey..." -ForegroundColor Yellow
        Set-ExecutionPolicy Bypass -Scope Process -Force
        [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072
        Invoke-Expression ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))
        
        # Refresh environment
        $env:Path = [System.Environment]::GetEnvironmentVariable("Path", "Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path", "User")
    }
}

# Function to install GitHub CLI
function Install-GitHubCLI {
    Write-Host "`n🔧 Verificando GitHub CLI..." -ForegroundColor Cyan
    
    if (!(Test-Command "gh")) {
        Write-Host "📦 Instalando GitHub CLI..." -ForegroundColor Yellow
        
        # Try winget first
        if (Test-Command "winget") {
            winget install --id GitHub.cli --accept-source-agreements --accept-package-agreements
        } else {
            # Use Chocolatey as fallback
            Install-Chocolatey
            choco install gh -y
        }
        
        # Refresh PATH
        $env:Path = [System.Environment]::GetEnvironmentVariable("Path", "Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path", "User")
    }
    
    $ghVersion = gh --version 2>$null
    if ($ghVersion) {
        Write-Host "✅ GitHub CLI instalado: $($ghVersion.Split("`n")[0])" -ForegroundColor Green
        return $true
    }
    return $false
}

# Main setup process
Write-Host "`n📋 Iniciando configuración automática..." -ForegroundColor Cyan

# Step 1: Install dependencies
Write-Host "`n[1/5] Instalando dependencias del sistema..." -ForegroundColor Yellow

if (!(Test-Command "node")) {
    Write-Host "❌ Node.js no está instalado. Por favor instala Node.js primero." -ForegroundColor Red
    Write-Host "   https://nodejs.org/en/download/" -ForegroundColor Yellow
    exit 1
}

if (!(Test-Command "pnpm")) {
    Write-Host "📦 Instalando pnpm..." -ForegroundColor Yellow
    npm install -g pnpm@8.15.6
}

# Install GitHub CLI
$ghInstalled = Install-GitHubCLI

# Step 2: Run base setup
Write-Host "`n[2/5] Ejecutando setup base del proyecto..." -ForegroundColor Yellow
node scripts/setup-ci.js

# Step 3: Configure GitHub if CLI is available
if ($ghInstalled) {
    Write-Host "`n[3/5] Configurando GitHub automáticamente..." -ForegroundColor Yellow
    
    # Check if authenticated
    $authStatus = gh auth status 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Host "🔐 Necesitas autenticarte con GitHub..." -ForegroundColor Yellow
        Write-Host "   Se abrirá tu navegador para completar la autenticación" -ForegroundColor Cyan
        gh auth login --web --scopes repo,workflow,admin:org
    }
    
    # Run auto setup
    node scripts/auto-setup-github.js
} else {
    Write-Host "`n⚠️ GitHub CLI no disponible. Configuración manual requerida." -ForegroundColor Yellow
}

# Step 4: Install dependencies and build
Write-Host "`n[4/5] Instalando dependencias del proyecto..." -ForegroundColor Yellow
pnpm install --frozen-lockfile

Write-Host "`n[5/5] Construyendo paquetes base..." -ForegroundColor Yellow
pnpm build:packages

# Step 5: Run validation
Write-Host "`n🧪 Validando configuración..." -ForegroundColor Cyan

$validation = @{
    "package.json" = Test-Path "package.json"
    "turbo.json" = Test-Path "turbo.json"
    "codecov.yml" = Test-Path "codecov.yml"
    "CI Workflow" = Test-Path ".github/workflows/ci-optimized.yml"
    "PR Workflow" = Test-Path ".github/workflows/pr-validation.yml"
    ".env.local" = Test-Path ".env.local"
    "node_modules" = Test-Path "node_modules"
}

$allGood = $true
foreach ($item in $validation.GetEnumerator()) {
    if ($item.Value) {
        Write-Host "  ✅ $($item.Key)" -ForegroundColor Green
    } else {
        Write-Host "  ❌ $($item.Key)" -ForegroundColor Red
        $allGood = $false
    }
}

# Final summary
Write-Host "`n=====================================================" -ForegroundColor Green
Write-Host "   ✨ CONFIGURACION COMPLETADA" -ForegroundColor Cyan
Write-Host "=====================================================" -ForegroundColor Green

if ($allGood) {
    Write-Host "`n✅ Todo está configurado correctamente!" -ForegroundColor Green
    
    Write-Host "`n🚀 Comandos disponibles:" -ForegroundColor Cyan
    Write-Host "   pnpm dev          - Desarrollo local" -ForegroundColor White
    Write-Host "   pnpm lint:fix     - Arreglar problemas de lint" -ForegroundColor White
    Write-Host "   pnpm ci:validate  - Validar CI localmente" -ForegroundColor White
    Write-Host "   pnpm ci:build     - Build completo" -ForegroundColor White
    Write-Host "   pnpm test         - Ejecutar tests" -ForegroundColor White
    
    Write-Host "`n📊 GitHub Actions:" -ForegroundColor Cyan
    Write-Host "   • Se ejecutará automáticamente en push/PR" -ForegroundColor White
    Write-Host "   • Dashboard: https://github.com/$env:GITHUB_REPOSITORY/actions" -ForegroundColor White
    
    Write-Host "`n🎯 Próximo paso:" -ForegroundColor Yellow
    Write-Host "   git add -A; git commit -m 'feat: CI/CD pipeline configurado'; git push" -ForegroundColor Cyan
} else {
    Write-Host "`n⚠️ Algunos componentes no se configuraron correctamente" -ForegroundColor Yellow
    Write-Host "   Por favor revisa los errores arriba" -ForegroundColor Yellow
}

Write-Host "" -NoNewline