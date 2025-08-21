$ErrorActionPreference = 'Stop'
try {
  $npm = Join-Path $env:APPDATA 'npm'
  if ($env:Path -notlike "*${npm}*") { $env:Path = "$env:Path;$npm" }
  $repoRoot = Resolve-Path (Join-Path $PSScriptRoot '..\..')
  Set-Location (Join-Path $repoRoot 'packages\e2e-tests')
  pnpm exec playwright install --with-deps
  Write-Host "Playwright browsers installed successfully"
} catch {
  Write-Error $_
  exit 1
}
