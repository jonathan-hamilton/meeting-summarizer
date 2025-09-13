# Test batch job response structure
Write-Host "Testing batch job response structure..." -ForegroundColor Green

try {
    # Step 1: Login
    $loginJson = '{"email":"test@test.com","password":"Passw0rd!"}'
    $loginResult = curl -s -X POST -H "Content-Type: application/json" -d $loginJson http://localhost:5029/api/auth/login
    $login = $loginResult | ConvertFrom-Json
    $token = $login.accessToken
    Write-Host "Login successful" -ForegroundColor Green
    
    # Step 2: Upload large file
    Write-Host "Uploading large file..." -ForegroundColor Yellow
    $uploadResult = curl -s -X POST -H "Authorization: Bearer $token" -F "audioFile=@sample-audio-files/25min-mtg-4-voices.wav" http://localhost:5029/api/summary/transcribe
    
    Write-Host "`nRaw Response:" -ForegroundColor Cyan
    Write-Host $uploadResult -ForegroundColor White
    
    # Step 3: Parse and analyze
    $response = $uploadResult | ConvertFrom-Json
    
    Write-Host "`nProperties:" -ForegroundColor Cyan
    $response.PSObject.Properties | ForEach-Object {
        Write-Host "  $($_.Name): $($_.Value)" -ForegroundColor Gray
    }
    
    # Step 4: Check batch job type
    if ($response.JobId) {
        Write-Host "`nResult: BATCH JOB (Pascal) - JobId: $($response.JobId)" -ForegroundColor Green
    } elseif ($response.jobId) {
        Write-Host "`nResult: BATCH JOB (camel) - jobId: $($response.jobId)" -ForegroundColor Green  
    } elseif ($response.transcriptionId) {
        Write-Host "`nResult: IMMEDIATE PROCESSING - transcriptionId: $($response.transcriptionId)" -ForegroundColor Red
    } else {
        Write-Host "`nResult: UNKNOWN TYPE - Check properties above" -ForegroundColor Yellow
    }
    
} catch {
    Write-Host "Error occurred: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`nThis shows exactly what the frontend receives!" -ForegroundColor Cyan