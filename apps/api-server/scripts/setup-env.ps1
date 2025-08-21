# Environment Setup Script for PowerShell
# Configura automáticamente variables críticas en staging y producción
# 
# Uso:
# - .\scripts\setup-env.ps1 staging
# - .\scripts\setup-env.ps1 production

param(
    [Parameter(Mandatory=$true)]
    [ValidateSet("staging", "production")]
    [string]$Environment
)

# Configuración por ambiente
$ENV_CONFIGS = @{
    staging = @{
        file = '.env.staging'
        api_url = 'https://staging-api.altamedica.com'
        allowed_origins = 'https://staging.altamedica.com,https://staging-doctors.altamedica.com,https://staging-patients.altamedica.com'
        signaling_url = 'https://staging-signaling.altamedica.com'
        redis_url = 'redis://staging-redis:6379'
        database_url = 'postgresql://user:pass@staging-db:5432/altamedica_staging'
        log_level = 'info'
    }
    production = @{
        file = '.env.production'
        api_url = 'https://api.altamedica.com'
        allowed_origins = 'https://altamedica.com,https://doctors.altamedica.com,https://patients.altamedica.com'
        signaling_url = 'https://signaling.altamedica.com'
        redis_url = 'redis://production-redis:6379'
        database_url = 'postgresql://user:pass@production-db:5432/altamedica_production'
        log_level = 'warn'
    }
}

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

function Write-EnvFile {
    param(
        [string]$envPath,
        [hashtable]$env
    )
    
    $lines = @()
    
    # Agregar comentarios de encabezado
    if ($Environment -eq 'staging') {
        $lines += "# Staging Environment - NO usar MOCKS ni defaults"
        $lines += "# Todas las variables deben ser configuradas antes del deploy"
    } else {
        $lines += "# Production Environment - CRÍTICO: NO usar MOCKS ni defaults"
        $lines += "# Todas las variables deben ser configuradas antes del deploy"
        $lines += "# Validar con: pnpm run validate:env:production"
    }
    
    $lines += ""
    
    # Agregar variables organizadas por categoría
    $lines += "# Server Configuration"
    $lines += "NODE_ENV=$Environment"
    $lines += "PORT=3001"
    $lines += "API_URL=$($ENV_CONFIGS[$Environment].api_url)"
    $lines += ""
    
    $lines += "# Firebase Admin SDK (REQUERIDO)"
    $lines += "FIREBASE_PROJECT_ID=altamedic-20f69"
    $lines += "FIREBASE_CLIENT_EMAIL=firebase-adminsdk-fbsvc@altamedic-20f69.iam.gserviceaccount.com"
    $lines += "FIREBASE_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\nREPLACE_WITH_ACTUAL_PRIVATE_KEY\n-----END PRIVATE KEY-----"
    $lines += "GOOGLE_APPLICATION_CREDENTIALS=./altamedic-20f69-firebase-adminsdk-fbsvc-06a561d259.json"
    $lines += ""
    
    $lines += "# JWT Configuration (REQUERIDO)"
    $lines += "JWT_SECRET=REPLACE_WITH_ACTUAL_JWT_SECRET_64_CHARS"
    $lines += "JWT_REFRESH_SECRET=REPLACE_WITH_ACTUAL_REFRESH_SECRET_64_CHARS"
    $lines += "JWT_EXPIRES_IN=1h"
    $lines += "JWT_REFRESH_EXPIRES_IN=7d"
    $lines += ""
    
    $lines += "# Security Features (HABILITADOS)"
    $lines += "RATE_LIMIT_ENABLED=true"
    $lines += "AUDIT_LOGGING_ENABLED=true"
    $lines += "RBAC_ENABLED=true"
    $lines += "PHI_ENCRYPTION_ENABLED=true"
    $lines += "AUDIT_HASH_CHAIN_ENABLED=true"
    $lines += ""
    
    $lines += "# Encryption (REQUERIDO)"
    $lines += "ENCRYPTION_SECRET=REPLACE_WITH_ACTUAL_ENCRYPTION_KEY_32_CHARS"
    $lines += ""
    
    $lines += "# CORS & Networking"
    $lines += "ALLOWED_ORIGINS=$($ENV_CONFIGS[$Environment].allowed_origins)"
    $lines += "SIGNALING_SERVER_URL=$($ENV_CONFIGS[$Environment].signaling_url)"
    $lines += ""
    
    $lines += "# Database & External Services"
    $lines += "REDIS_URL=$($ENV_CONFIGS[$Environment].redis_url)"
    $lines += "DATABASE_URL=$($ENV_CONFIGS[$Environment].database_url)"
    $lines += ""
    
    $lines += "# Monitoring & Logging"
    $lines += "LOG_LEVEL=$($ENV_CONFIGS[$Environment].log_level)"
    $lines += "LOG_FORMAT=json"
    $lines += "SENTRY_DSN=https://sentry-key@sentry.io/$Environment-project"
    $lines += ""
    
    $lines += "# Feature Flags"
    $lines += "ENABLE_ANALYTICS=true"
    $lines += "ENABLE_METRICS=true"
    $lines += "ENABLE_HEALTH_CHECKS=true"
    
    # Agregar configuraciones específicas de producción
    if ($Environment -eq 'production') {
        $lines += ""
        $lines += "# HIPAA Compliance"
        $lines += "PHI_ENCRYPTION_ALGORITHM=AES-256-GCM"
        $lines += "AUDIT_LOG_RETENTION_DAYS=2555"
        $lines += "ENCRYPTION_KEY_ROTATION_DAYS=90"
    }
    
    Set-Content -Path $envPath -Value $lines -Encoding UTF8
}

function Generate-Secrets {
    param([string]$envName)
    
    Write-Host "🔐 Generando secretos para $envName..." -ForegroundColor Cyan
    
    # Generar JWT secrets (64 caracteres)
    $jwtSecret = -join ((33..126) | Get-Random -Count 64 | ForEach-Object { [char]$_ })
    $jwtRefresh = -join ((33..126) | Get-Random -Count 64 | ForEach-Object { [char]$_ })
    
    # Generar encryption key (32 caracteres)
    $encKey = -join ((33..126) | Get-Random -Count 32 | ForEach-Object { [char]$_ })
    
    return @{
        JWT_SECRET = $jwtSecret
        JWT_REFRESH_SECRET = $jwtRefresh
        ENCRYPTION_SECRET = $encKey
    }
}

function Main {
    $config = $ENV_CONFIGS[$Environment]
    $envPath = Join-Path (Get-Location) $config.file
    
    try {
        Write-Host "🚀 Configurando entorno $Environment..." -ForegroundColor Green
        
        # Crear archivo de entorno
        Write-EnvFile -envPath $envPath -env $config
        Write-Host "✅ Archivo $($config.file) creado" -ForegroundColor Green
        
        # Preguntar si generar secretos automáticamente
        $generateSecrets = Read-Host "¿Generar secretos automáticamente? (s/n)"
        
        if ($generateSecrets -eq 's' -or $generateSecrets -eq 'S') {
            $secrets = Generate-Secrets -envName $Environment
            
            # Actualizar archivo con secretos generados
            $env = Read-EnvFile -envPath $envPath
            $env['JWT_SECRET'] = $secrets.JWT_SECRET
            $env['JWT_REFRESH_SECRET'] = $secrets.JWT_REFRESH_SECRET
            $env['ENCRYPTION_SECRET'] = $secrets.ENCRYPTION_SECRET
            
            # Reescribir archivo
            Write-EnvFile -envPath $envPath -env $config
            
            Write-Host "✅ Secretos generados y guardados" -ForegroundColor Green
            Write-Host "⚠️  IMPORTANTE: Guarda estos secretos en un lugar seguro:" -ForegroundColor Yellow
            Write-Host "   JWT_SECRET: $($secrets.JWT_SECRET)" -ForegroundColor Yellow
            Write-Host "   JWT_REFRESH_SECRET: $($secrets.JWT_REFRESH_SECRET)" -ForegroundColor Yellow
            Write-Host "   ENCRYPTION_SECRET: $($secrets.ENCRYPTION_SECRET)" -ForegroundColor Yellow
        } else {
            Write-Host "⚠️  Recuerda configurar manualmente:" -ForegroundColor Yellow
            Write-Host "   - JWT_SECRET (64+ caracteres)" -ForegroundColor Yellow
            Write-Host "   - JWT_REFRESH_SECRET (64+ caracteres)" -ForegroundColor Yellow
            Write-Host "   - ENCRYPTION_SECRET (32+ caracteres)" -ForegroundColor Yellow
            Write-Host "   - FIREBASE_PRIVATE_KEY (desde el JSON del service account)" -ForegroundColor Yellow
        }
        
        Write-Host "`n📋 Próximos pasos:" -ForegroundColor Cyan
        Write-Host "1. Edita $($config.file) con tus valores reales" -ForegroundColor White
        Write-Host "2. Valida con: pnpm run validate:env:$Environment" -ForegroundColor White
        Write-Host "3. Configura FIREBASE_PRIVATE_KEY desde tu service account JSON" -ForegroundColor White
        
        if ($Environment -eq 'production') {
            Write-Host "4. Configura DATABASE_URL y REDIS_URL reales" -ForegroundColor White
        }
        
    } catch {
        Write-Host "❌ Error durante la configuración: $($_.Exception.Message)" -ForegroundColor Red
        exit 1
    }
}

# Ejecutar configuración
Main
