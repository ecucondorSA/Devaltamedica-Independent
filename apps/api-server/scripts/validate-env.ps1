# Environment Validation Script for PowerShell
# Valida que todas las variables críticas estén configuradas antes del deploy
# 
# Uso:
# - .\scripts\validate-env.ps1 staging
# - .\scripts\validate-env.ps1 production

param(
    [Parameter(Mandatory=$true)]
    [ValidateSet("staging", "production")]
    [string]$Environment
)

# Configuración de validación por ambiente
$ENV_CONFIGS = @{
    staging = @{
        required = @(
            'NODE_ENV',
            'PORT',
            'API_URL',
            'FIREBASE_PROJECT_ID',
            'FIREBASE_CLIENT_EMAIL',
            'FIREBASE_PRIVATE_KEY',
            'JWT_SECRET',
            'JWT_REFRESH_SECRET',
            'ENCRYPTION_SECRET',
            'ALLOWED_ORIGINS',
            'SIGNALING_SERVER_URL'
        )
        critical = @(
            'JWT_SECRET',
            'JWT_REFRESH_SECRET',
            'ENCRYPTION_SECRET',
            'FIREBASE_PRIVATE_KEY'
        )
        file = '.env.staging'
    }
    production = @{
        required = @(
            'NODE_ENV',
            'PORT',
            'API_URL',
            'FIREBASE_PROJECT_ID',
            'FIREBASE_CLIENT_EMAIL',
            'FIREBASE_PRIVATE_KEY',
            'JWT_SECRET',
            'JWT_REFRESH_SECRET',
            'ENCRYPTION_SECRET',
            'ALLOWED_ORIGINS',
            'SIGNALING_SERVER_URL',
            'DATABASE_URL',
            'REDIS_URL'
        )
        critical = @(
            'JWT_SECRET',
            'JWT_REFRESH_SECRET',
            'ENCRYPTION_SECRET',
            'FIREBASE_PRIVATE_KEY',
            'DATABASE_URL'
        )
        file = '.env.production'
    }
}

# Función para leer archivo .env
function Read-EnvFile {
    param([string]$envPath)
    
    $env = @{}
    
    if (-not (Test-Path $envPath)) {
        throw "Archivo $envPath no encontrado"
    }
    
    $content = Get-Content $envPath -Encoding UTF8
    $lines = $content -split "`n"
    
    foreach ($line in $lines) {
        $trimmed = $line.Trim()
        if ($trimmed -and -not $trimmed.StartsWith('#')) {
            if ($trimmed -match '^([A-Za-z0-9_]+)\s*=(.+)$') {
                $key = $matches[1].Trim()
                $value = $matches[2].Trim()
                $env[$key] = $value
            }
        }
    }
    
    return $env
}

# Función para validar variables
function Validate-Environment {
    param(
        [hashtable]$env,
        [hashtable]$config,
        [string]$envName
    )
    
    $errors = @()
    $warnings = @()
    
    Write-Host "🔍 Validando $envName..." -ForegroundColor Cyan
    
    # Validar variables requeridas
    foreach ($required in $config.required) {
        if (-not $env.ContainsKey($required) -or $env[$required] -eq '') {
            $errors += "❌ Variable requerida faltante: $required"
        } elseif ($env[$required] -like '*REPLACE_WITH_ACTUAL*') {
            $errors += "❌ Variable $required contiene placeholder: $($env[$required])"
        }
    }
    
    # Validar variables críticas
    foreach ($critical in $config.critical) {
        if ($env.ContainsKey($critical)) {
            $value = $env[$critical]
            if ($value.Length -lt 32) {
                $warnings += "⚠️  Variable crítica $critical parece muy corta ($($value.Length) chars)"
            }
            if ($value -like '*dev-*' -or $value -like '*test-*' -or $value -like '*mock*') {
                $errors += "❌ Variable crítica $critical contiene valor de desarrollo: $value"
            }
        }
    }
    
    # Validar NODE_ENV
    if ($env['NODE_ENV'] -ne $envName) {
        $errors += "❌ NODE_ENV debe ser '$envName', actual: $($env['NODE_ENV'])"
    }
    
    # Validar URLs
    if ($env['API_URL'] -and -not $env['API_URL'].StartsWith('https://')) {
        $warnings += "⚠️  API_URL debería usar HTTPS en $envName : $($env['API_URL'])"
    }
    
    if ($env['ALLOWED_ORIGINS'] -and $env['ALLOWED_ORIGINS'] -like '*localhost*') {
        $warnings += "⚠️  ALLOWED_ORIGINS contiene localhost en $envName : $($env['ALLOWED_ORIGINS'])"
    }
    
    # Validar flags de seguridad
    $securityFlags = @('RATE_LIMIT_ENABLED', 'AUDIT_LOGGING_ENABLED', 'RBAC_ENABLED')
    foreach ($flag in $securityFlags) {
        if ($env[$flag] -eq 'false') {
            $warnings += "⚠️  Flag de seguridad $flag está deshabilitado en $envName"
        }
    }
    
    return @{ errors = $errors; warnings = $warnings }
}

# Función principal
function Main {
    $config = $ENV_CONFIGS[$Environment]
    $envPath = Join-Path (Get-Location) $config.file
    
    try {
        $env = Read-EnvFile -envPath $envPath
        $result = Validate-Environment -env $env -config $config -envName $Environment
        
        # Mostrar resultados
        if ($result.warnings.Count -gt 0) {
            Write-Host "`n⚠️  ADVERTENCIAS:" -ForegroundColor Yellow
            foreach ($w in $result.warnings) {
                Write-Host "  $w" -ForegroundColor Yellow
            }
        }
        
        if ($result.errors.Count -gt 0) {
            Write-Host "`n❌ ERRORES CRÍTICOS:" -ForegroundColor Red
            foreach ($e in $result.errors) {
                Write-Host "  $e" -ForegroundColor Red
            }
            Write-Host "`n🚫 Deploy bloqueado. Corrige los errores antes de continuar." -ForegroundColor Red
            exit 1
        }
        
        Write-Host "`n✅ Validación exitosa. Todas las variables críticas están configuradas." -ForegroundColor Green
        Write-Host "📋 Archivo validado: $($config.file)" -ForegroundColor Green
        
    } catch {
        Write-Host "❌ Error durante la validación: $($_.Exception.Message)" -ForegroundColor Red
        exit 1
    }
}

# Ejecutar validación
Main
