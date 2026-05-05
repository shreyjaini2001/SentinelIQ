# SentinelIQ dev startup script
# Usage: .\scripts\dev.ps1

$root = Split-Path -Parent $PSScriptRoot

# Check for .env file
if (-not (Test-Path "$root\.env")) {
    Write-Host "No .env file found. Copying from .env.example..." -ForegroundColor Yellow
    Copy-Item "$root\.env.example" "$root\.env"
    Write-Host "Please edit $root\.env and add your ANTHROPIC_API_KEY" -ForegroundColor Red
    Write-Host "Then re-run this script." -ForegroundColor Red
    exit 1
}

Write-Host "Starting SentinelIQ development servers..." -ForegroundColor Cyan
Write-Host "  API:  http://localhost:8000" -ForegroundColor Green
Write-Host "  Web:  http://localhost:5173" -ForegroundColor Green
Write-Host "  Docs: http://localhost:8000/docs" -ForegroundColor Green
Write-Host ""

# Find uvicorn
$uvicorn = Get-Command uvicorn -ErrorAction SilentlyContinue
if (-not $uvicorn) {
    $uvicornPath = "$env:LOCALAPPDATA\Packages\PythonSoftwareFoundation.Python.3.12_qbz5n2kfra8p0\LocalCache\local-packages\Python312\Scripts\uvicorn.exe"
    if (Test-Path $uvicornPath) {
        $env:PATH += ";$($uvicornPath | Split-Path)"
    }
}

# Start API in background
$apiJob = Start-Job -ScriptBlock {
    param($apiDir)
    Set-Location $apiDir
    & uvicorn main:app --reload --port 8000
} -ArgumentList "$root\apps\api"

# Start web in background
$webJob = Start-Job -ScriptBlock {
    param($webDir)
    Set-Location $webDir
    & npm run dev
} -ArgumentList "$root\apps\web"

Write-Host "Both servers starting. Press Ctrl+C to stop." -ForegroundColor Yellow
Write-Host ""

try {
    while ($true) {
        Receive-Job $apiJob | ForEach-Object { Write-Host "[API] $_" -ForegroundColor DarkGray }
        Receive-Job $webJob | ForEach-Object { Write-Host "[WEB] $_" -ForegroundColor DarkBlue }
        Start-Sleep -Milliseconds 500
    }
} finally {
    Stop-Job $apiJob, $webJob
    Remove-Job $apiJob, $webJob
    Write-Host "Servers stopped." -ForegroundColor Yellow
}
