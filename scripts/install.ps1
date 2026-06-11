param(
  [switch]$Launch,
  [switch]$DryRun
)

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
Set-Location $Root

Write-Host "CP Forge installer"
Write-Host "=================="

if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
  Write-Error "Node.js 20+ is required. Install from https://nodejs.org/"
}

if (Get-Command corepack -ErrorAction SilentlyContinue) {
  corepack enable 2>$null
  corepack prepare pnpm@latest --activate 2>$null
}

if (-not (Get-Command pnpm -ErrorAction SilentlyContinue)) {
  Write-Host "Installing pnpm..."
  npm install -g pnpm
}

if ($DryRun) {
  Write-Host "[dry-run] Would run: pnpm install && pnpm build"
  exit 0
}

pnpm install
pnpm build

$Cli = Join-Path $Root "apps\cli\dist\index.js"
if (-not (Test-Path $Cli)) {
  throw "Build failed: CLI not found at $Cli"
}

$BinDir = if ($env:CP_FORGE_BIN_DIR) { $env:CP_FORGE_BIN_DIR } else { Join-Path $env:USERPROFILE ".local\bin" }
New-Item -ItemType Directory -Force -Path $BinDir | Out-Null
$Wrapper = Join-Path $BinDir "cp-forge.cmd"
"@echo off`r`nnode `"$Cli`" %*" | Set-Content -Path $Wrapper -Encoding ASCII

Write-Host ""
Write-Host "CP Forge is ready."
Write-Host "  cp-forge launch --goal amazon --days 45 --offline"
Write-Host ""
Write-Host "CLI wrapper: $Wrapper"

if ($Launch) {
  node $Cli launch --goal amazon --days 45 --offline
}
