# Build script for ultra-light Signaling Server Docker image
# PowerShell script for Windows

param(
    [Parameter()]
    [ValidateSet("minimal", "standard", "both")]
    [string]$BuildType = "minimal",
    
    [Parameter()]
    [string]$Tag = "latest",
    
    [Parameter()]
    [switch]$Push,
    
    [Parameter()]
    [switch]$NoBuildCache
)

$ErrorActionPreference = "Stop"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host " Signaling Server Docker Build" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

# Change to project root (2 levels up from signaling-server)
$ProjectRoot = (Get-Item $PSScriptRoot).Parent.Parent.FullName
Set-Location $ProjectRoot

Write-Host "[INFO] Project root: $ProjectRoot" -ForegroundColor Gray

# Build context info
Write-Host "[INFO] Calculating build context size..." -ForegroundColor Gray
$ContextSize = (Get-ChildItem -Path "apps/signaling-server" -Recurse -File | 
    Where-Object { $_.Name -notmatch "node_modules|\.git|dist|build" } | 
    Measure-Object -Property Length -Sum).Sum / 1MB
Write-Host "[INFO] Build context size: $([math]::Round($ContextSize, 2)) MB" -ForegroundColor Green

# Docker build arguments
$BuildArgs = @(
    "build",
    "-t", "altamedica/signaling-server:$Tag"
)

if ($NoBuildCache) {
    $BuildArgs += "--no-cache"
}

# Build based on type
switch ($BuildType) {
    "minimal" {
        Write-Host "[BUILD] Building minimal image..." -ForegroundColor Yellow
        $BuildArgs += @(
            "-f", "apps/signaling-server/Dockerfile.minimal",
            "--build-arg", "NODE_ENV=production",
            "."
        )
        
        $StartTime = Get-Date
        docker @BuildArgs
        
        if ($LASTEXITCODE -eq 0) {
            $BuildTime = (Get-Date) - $StartTime
            Write-Host "[SUCCESS] Build completed in $($BuildTime.TotalSeconds) seconds" -ForegroundColor Green
            
            # Show image size
            $ImageSize = docker images altamedica/signaling-server:$Tag --format "table {{.Size}}" | Select-Object -Last 1
            Write-Host "[INFO] Image size: $ImageSize" -ForegroundColor Cyan
            
            # Show layers
            Write-Host "[INFO] Image layers:" -ForegroundColor Gray
            docker history altamedica/signaling-server:$Tag --human=true --format "table {{.CreatedBy}}\t{{.Size}}" | Select-Object -First 10
        } else {
            Write-Host "[ERROR] Build failed!" -ForegroundColor Red
            exit 1
        }
    }
    
    "standard" {
        Write-Host "[BUILD] Building standard image..." -ForegroundColor Yellow
        $BuildArgs += @(
            "-f", "apps/signaling-server/Dockerfile",
            "."
        )
        docker @BuildArgs
    }
    
    "both" {
        # Build both versions
        Write-Host "[BUILD] Building both versions..." -ForegroundColor Yellow
        
        # Minimal
        docker build -t altamedica/signaling-server:minimal -f apps/signaling-server/Dockerfile.minimal .
        
        # Standard
        docker build -t altamedica/signaling-server:standard -f apps/signaling-server/Dockerfile .
        
        Write-Host "[INFO] Comparing image sizes:" -ForegroundColor Cyan
        docker images | Select-String "altamedica/signaling-server"
    }
}

# Test the image
Write-Host "[TEST] Testing the image..." -ForegroundColor Yellow
$TestContainer = "signaling-test-$(Get-Random)"

try {
    # Run container in background
    docker run -d --name $TestContainer -p 8889:8888 altamedica/signaling-server:$Tag
    
    # Wait for startup
    Start-Sleep -Seconds 5
    
    # Check health
    $Response = Invoke-WebRequest -Uri "http://localhost:8889/health" -Method GET -TimeoutSec 5 -ErrorAction SilentlyContinue
    
    if ($Response.StatusCode -eq 200) {
        Write-Host "[SUCCESS] Health check passed!" -ForegroundColor Green
    } else {
        Write-Host "[WARNING] Health check returned status: $($Response.StatusCode)" -ForegroundColor Yellow
    }
    
    # Show logs
    Write-Host "[INFO] Container logs:" -ForegroundColor Gray
    docker logs $TestContainer --tail 20
    
} catch {
    Write-Host "[ERROR] Health check failed: $_" -ForegroundColor Red
} finally {
    # Cleanup
    docker stop $TestContainer | Out-Null
    docker rm $TestContainer | Out-Null
    Write-Host "[INFO] Test container cleaned up" -ForegroundColor Gray
}

# Push if requested
if ($Push) {
    Write-Host "[PUSH] Pushing image to registry..." -ForegroundColor Yellow
    docker push altamedica/signaling-server:$Tag
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "[SUCCESS] Image pushed successfully!" -ForegroundColor Green
    } else {
        Write-Host "[ERROR] Push failed!" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host " Build Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "To run the container:" -ForegroundColor Yellow
Write-Host "  docker run -p 8888:8888 altamedica/signaling-server:$Tag" -ForegroundColor White
Write-Host ""
Write-Host "To run with environment variables:" -ForegroundColor Yellow
Write-Host "  docker run -p 8888:8888 -e REDIS_URL=redis://redis:6379 altamedica/signaling-server:$Tag" -ForegroundColor White