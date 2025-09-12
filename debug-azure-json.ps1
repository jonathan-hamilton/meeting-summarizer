# Check what's actually stored in the ResultsJson field
Write-Host "Checking actual Azure results JSON format..." -ForegroundColor Green

try {
    # Login
    $loginResponse = Invoke-RestMethod -Uri "http://localhost:5029/api/auth/login" -Method POST -Headers @{"Content-Type"="application/json"} -Body '{"email":"test@test.com","password":"Passw0rd!"}'
    $token = $loginResponse.accessToken
    
    # Get batch jobs
    $jobs = Invoke-RestMethod -Uri "http://localhost:5029/api/batchjob" -Method GET -Headers @{Authorization="Bearer $token"}
    $completedJob = $jobs | Where-Object { $_.status -eq "completed" } | Select-Object -First 1
    
    if ($completedJob) {
        Write-Host "Found completed job: $($completedJob.jobId)" -ForegroundColor Cyan
        Write-Host "File: $($completedJob.fileName)" -ForegroundColor Cyan
        
        # We need to query the database directly to see the raw ResultsJson
        # Since the API parsing fails, let's create a simple endpoint test
        Write-Host "`nLet's check what properties exist in Azure results by examining the error..." -ForegroundColor Yellow
        
        # This will fail with the parsing error, but we can see in logs what's expected vs actual
        try {
            $jobDetail = Invoke-RestMethod -Uri "http://localhost:5029/api/batchjob/$($completedJob.jobId)/status" -Method GET -Headers @{Authorization="Bearer $token"}
            Write-Host "Unexpected success!" -ForegroundColor Green
        } catch {
            Write-Host "Expected parsing error occurred" -ForegroundColor Yellow
            Write-Host "Check api-debug.log for the actual Azure JSON structure" -ForegroundColor Cyan
        }
        
    } else {
        Write-Host "No completed jobs found" -ForegroundColor Red
    }
    
} catch {
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`nTo see actual Azure JSON format:" -ForegroundColor Cyan
Write-Host "1. Check api-debug.log for download success messages" -ForegroundColor White
Write-Host "2. Look for 'Successfully downloaded transcription results' entries" -ForegroundColor White
Write-Host "3. The actual JSON structure will be different from expected 'combinedRecognizedPhrases'" -ForegroundColor White