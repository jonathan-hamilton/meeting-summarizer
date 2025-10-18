# Start Local Development Script
Write-Host "🚀 Starting Local Development Environment..." -ForegroundColor Yellow

# Get the repository root directory (parent of scripts folder)
$repoRoot = Split-Path -Parent $MyInvocation.MyCommand.Path | Split-Path -Parent

# Start API in background
Write-Host "Starting API server..." -ForegroundColor Cyan
$apiPath = Join-Path $repoRoot "MeetingSummarizer.Api"
$apiCmd = "cd '$apiPath'; dotnet run --launch-profile local | Tee-Object -FilePath '../api.log'"
Start-Process powershell -ArgumentList "-NoExit", "-Command", $apiCmd -WindowStyle Normal

# Wait a moment for API to start
Start-Sleep -Seconds 2

# Start Frontend in new window
Write-Host "Starting Frontend server..." -ForegroundColor Cyan
$frontendPath = Join-Path $repoRoot "frontend"
$frontendCmd = "cd '$frontendPath'; npm run dev"
Start-Process powershell -ArgumentList "-NoExit", "-Command", $frontendCmd -WindowStyle Normal

# Wait and check if processes started
Start-Sleep -Seconds 5

# Check API health
try {
    $apiHealth = Invoke-RestMethod -Uri "http://localhost:5029/health" -TimeoutSec 5 -ErrorAction Stop
    Write-Host "✅ API: Running ($($apiHealth.environment))" -ForegroundColor Green
} catch {
    Write-Host "❌ API: Failed to start or not responding" -ForegroundColor Red
}

# Check Frontend
try {
    $frontendResponse = Invoke-WebRequest -Uri "http://localhost:5173" -TimeoutSec 5 -ErrorAction Stop
    if ($frontendResponse.StatusCode -eq 200) {
        Write-Host "✅ Frontend: Running" -ForegroundColor Green
    }
} catch {
    Write-Host "❌ Frontend: Failed to start or not responding" -ForegroundColor Red
}

Write-Host "`n🎯 Development servers started in separate windows" -ForegroundColor Yellow
Write-Host "API: http://localhost:5029" -ForegroundColor Gray
Write-Host "Frontend: http://localhost:5173" -ForegroundColor Gray