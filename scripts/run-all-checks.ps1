<#
run-all-checks.ps1
- Runs a sequence of diagnostics and tests to verify MongoDB replica set, Prisma connectivity,
  and the app registration flow. Run from the project root in PowerShell.

Usage:
  Open an elevated PowerShell (recommended) and run:
    .\scripts\run-all-checks.ps1

This script does NOT modify databases. It only reads status and runs the project's test scripts.
#>

Write-Host "=== run-all-checks: Starting diagnostics ===" -ForegroundColor Cyan

Write-Host "\n1) mongod process command line" -ForegroundColor Yellow
try {
  $proc = Get-CimInstance Win32_Process -Filter "Name='mongod.exe'" | Select-Object -First 1
  if ($proc) {
    Write-Host "ProcessId: $($proc.ProcessId)";
    Write-Host "CommandLine: $($proc.CommandLine)"; 
  } else { Write-Host "mongod process not found." -ForegroundColor Red }
} catch { Write-Host "Failed to query process: $_" -ForegroundColor Red }

Write-Host "\n2) replica set status (rs.status())" -ForegroundColor Yellow
try {
  $mongosh = $null
  $candidates = @("mongosh", "C:\\Program Files\\mongosh\\mongosh.exe", "C:\\Program Files\\MongoDB\\Server\\8.2\\bin\\mongosh.exe")
  foreach ($c in $candidates) { if (Test-Path $c -PathType Leaf -ErrorAction SilentlyContinue) { $mongosh = $c; break } }
  if (-not $mongosh) { $mongosh = "mongosh" }
  Write-Host "Using mongosh: $mongosh"
  & $mongosh --eval "printjson(rs.status())" 2>&1 | Tee-Object -Variable rsout
} catch { Write-Host "Failed to run mongosh rs.status(): $_" -ForegroundColor Red }

Write-Host "\n3) Prisma connectivity test (check-prisma-direct.js)" -ForegroundColor Yellow
try {
  if (Test-Path '.\scripts\check-prisma-direct.js') {
    node .\scripts\check-prisma-direct.js 2>&1 | Tee-Object -Variable prismaout
  } else {
    Write-Host "Missing scripts/check-prisma-direct.js" -ForegroundColor Red
  }
} catch { Write-Host "Prisma check failed: $_" -ForegroundColor Red }

Write-Host "\n4) App registration test (tmp_register_attempt.js)" -ForegroundColor Yellow
try {
  if (Test-Path '.\tmp_register_attempt.js') {
    node .\tmp_register_attempt.js 2>&1 | Tee-Object -Variable regout
  } else {
    Write-Host "Missing tmp_register_attempt.js" -ForegroundColor Red
  }
} catch { Write-Host "Registration test failed: $_" -ForegroundColor Red }

Write-Host "\n=== run-all-checks: Done. Review outputs above. ===" -ForegroundColor Cyan
