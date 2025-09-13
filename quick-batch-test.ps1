# Quick batch job response test
Write-Host "Testing batch job response..." -ForegroundColor Green

try {
    # Login
    $loginJson = '{"email":"test@test.com","password":"Passw0rd!"}'
    $loginResult = curl -s -X POST -H "Content-Type: application/json" -d $loginJson http://localhost:5029/api/auth/login
    $login = $loginResult | ConvertFrom-Json
    $token = $login.accessToken
    Write-Host "Logged in successfully" -ForegroundColor Green
    
    # Upload file
    Write-Host "Uploading file..." -ForegroundColor Yellow
    $uploadResult = curl -s -X POST -H "Authorization: Bearer $token" -F "audioFile=@sample-audio-files/25min-mtg-4-voices.wav" http://localhost:5029/api/summary/transcribe
    
    Write-Host "`nRaw API Response:" -ForegroundColor Cyan
    Write-Host $uploadResult -ForegroundColor White
    
    # Parse response
    $response = $uploadResult | ConvertFrom-Json
    
    Write-Host "`nResponse Properties:" -ForegroundColor Cyan
    $response.PSObject.Properties | ForEach-Object {
        Write-Host "  $($_.Name): $($_.Value)" -ForegroundColor Gray
    }
    
    # Check for batch job
    if ($response.JobId) {
        Write-Host "`n✅ BATCH JOB - JobId: $($response.JobId)" -ForegroundColor Green
    } elseif ($response.jobId) {
        Write-Host "`n✅ BATCH JOB - jobId: $($response.jobId)" -ForegroundColor Green
    } elseif ($response.transcriptionId) {
        Write-Host "`n❌ IMMEDIATE - transcriptionId: $($response.transcriptionId)" -ForegroundColor Red
    } else {
        Write-Host "`n❓ UNKNOWN RESPONSE TYPE" -ForegroundColor Yellow
    }
    
} catch {
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
}