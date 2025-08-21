# PowerShell script to run telemedicine tests with different modes
param(
    [Parameter()]
    [ValidateSet("full", "standalone", "mock", "quick")]
    [string]$Mode = "quick",
    
    [Parameter()]
    [switch]$CheckHealth,
    
    [Parameter()]
    [switch]$Verbose
)

$ErrorActionPreference = "Stop"

# Color output functions
function Write-Success { Write-Host $args -ForegroundColor Green }
function Write-Info { Write-Host $args -ForegroundColor Cyan }
function Write-Warning { Write-Host $args -ForegroundColor Yellow }
function Write-Error { Write-Host $args -ForegroundColor Red }

Write-Info "🧪 Telemedicine Test Runner - Mode: $Mode"
Write-Info "=" * 50

# Check Docker services if requested
if ($CheckHealth) {
    Write-Info "Checking infrastructure health..."
    
    $services = @(
        @{Name="API Server"; Port=3001; Required=$true},
        @{Name="Signaling Server"; Port=8888; Required=$true},
        @{Name="Patients App"; Port=3003; Required=$false}
    )
    
    $allHealthy = $true
    foreach ($service in $services) {
        try {
            $response = Invoke-WebRequest -Uri "http://localhost:$($service.Port)/health" -TimeoutSec 2 -ErrorAction SilentlyContinue
            if ($response.StatusCode -eq 200) {
                Write-Success "  ✓ $($service.Name) (port $($service.Port))"
            }
        } catch {
            if ($service.Required) {
                Write-Error "  ✗ $($service.Name) (port $($service.Port)) - REQUIRED"
                $allHealthy = $false
            } else {
                Write-Warning "  ○ $($service.Name) (port $($service.Port)) - optional"
            }
        }
    }
    
    if (-not $allHealthy) {
        Write-Warning "`n⚠️  Required services not available!"
        Write-Info "Solutions:"
        Write-Info "  1. Start services: docker compose up -d api-server signaling-server"
        Write-Info "  2. Use mock mode: .\run-telemed-tests.ps1 -Mode mock"
        Write-Info "  3. Run standalone only: .\run-telemed-tests.ps1 -Mode standalone"
        
        if ($Mode -eq "full") {
            Write-Error "Cannot run full suite without required services"
            exit 1
        }
    }
}

# Set environment variables based on mode
$env:NODE_ENV = "test"

switch ($Mode) {
    "full" {
        Write-Info "Running FULL telemedicine suite (requires all services)..."
        $env:E2E_WEBRTC_MOCK = "0"
        $testPattern = "@telemedicine"
    }
    
    "standalone" {
        Write-Info "Running STANDALONE tests (no signaling required)..."
        $env:E2E_WEBRTC_MOCK = "0"
        $testPattern = "@telemedicine @standalone"
    }
    
    "mock" {
        Write-Info "Running in MOCK mode (simulated WebRTC)..."
        $env:E2E_WEBRTC_MOCK = "1"
        $testPattern = "@telemedicine"
    }
    
    "quick" {
        Write-Info "Running QUICK smoke tests..."
        $env:E2E_WEBRTC_MOCK = "1"
        $testPattern = "@telemedicine @standalone"
    }
}

# Navigate to e2e-tests directory
Push-Location (Join-Path $PSScriptRoot "..")

try {
    # Install dependencies if needed
    if (-not (Test-Path "node_modules")) {
        Write-Info "Installing dependencies..."
        pnpm install
    }
    
    # Build command
    $npxCmd = "npx playwright test"
    $grepArg = "-g `"$testPattern`""
    
    if ($Verbose) {
        $npxCmd += " --debug"
    }
    
    # Execute tests
    Write-Info "`nExecuting: $npxCmd $grepArg"
    Write-Info "-" * 50
    
    $startTime = Get-Date
    
    # Run tests
    Invoke-Expression "$npxCmd $grepArg"
    $exitCode = $LASTEXITCODE
    
    $duration = (Get-Date) - $startTime
    $durationStr = "{0:mm}m {0:ss}s" -f $duration
    
    # Summary
    Write-Info "`n" + "=" * 50
    if ($exitCode -eq 0) {
        Write-Success "✅ Tests PASSED in $durationStr"
    } else {
        Write-Error "❌ Tests FAILED in $durationStr"
    }
    
    # Show report location
    $reportPath = Join-Path (Get-Location) "playwright-report\index.html"
    if (Test-Path $reportPath) {
        Write-Info "`n📊 HTML Report: $reportPath"
        Write-Info "   Open with: playwright show-report"
    }
    
    # Show artifacts if any failures
    if ($exitCode -ne 0) {
        $tracePath = Join-Path (Get-Location) "test-results"
        if (Test-Path $tracePath) {
            Write-Info "`n🎭 Traces available in: $tracePath"
            
            $traces = Get-ChildItem -Path $tracePath -Filter "*.zip" -Recurse
            if ($traces) {
                Write-Info "   Found $($traces.Count) trace file(s)"
                Write-Info "   View with: playwright show-trace <trace-file>"
            }
        }
    }
    
    exit $exitCode
    
} finally {
    Pop-Location
}