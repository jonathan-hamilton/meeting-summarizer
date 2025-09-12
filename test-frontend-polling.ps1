# Test what the frontend polling is receiving
Write-Host "Testing frontend batch job polling..." -ForegroundColor Green

try {
    # Login (same as frontend would do)
    $loginResponse = Invoke-RestMethod -Uri "http://localhost:5029/api/auth/login" -Method POST -Headers @{"Content-Type"="application/json"} -Body '{"email":"test@test.com","password":"Passw0rd!"}'
    $token = $loginResponse.accessToken
    Write-Host "Login successful for frontend test" -ForegroundColor Green
    
    # Get the job that's showing in UI (the one that's "processing")
    Write-Host "`nGetting batch jobs list (same as frontend)..." -ForegroundColor Yellow
    $jobs = Invoke-RestMethod -Uri "http://localhost:5029/api/batchjob" -Method GET -Headers @{Authorization="Bearer $token"}
    
    # Find the most recent job (likely the one shown in UI)
    $recentJob = $jobs | Sort-Object submittedAt -Descending | Select-Object -First 1
    
    Write-Host "`nMost recent job (likely the one in UI):" -ForegroundColor Cyan
    Write-Host "Job ID: $($recentJob.jobId)"
    Write-Host "Status: $($recentJob.status)"
    Write-Host "Progress: $($recentJob.progressPercentage)%"
    Write-Host "File: $($recentJob.fileName)"
    Write-Host "Submitted: $($recentJob.submittedAt)"
    Write-Host "Completed: $($recentJob.completedAt)"
    
    # Test the specific status endpoint (what frontend polls)
    if ($recentJob.jobId) {
        Write-Host "`nTesting status endpoint (frontend polling)..." -ForegroundColor Yellow
        $statusUrl = "http://localhost:5029/api/batchjob/$($recentJob.jobId)/status"
        
        try {
            $status = Invoke-RestMethod -Uri $statusUrl -Method GET -Headers @{Authorization="Bearer $token"}
            
            Write-Host "✅ Status endpoint response:" -ForegroundColor Green
            Write-Host "Status: $($status.status)"
            Write-Host "Progress: $($status.progressPercentage)%"
            Write-Host "Has Results: $($status.results -ne $null)"
            
            if ($status.results) {
                Write-Host "Results structure:" -ForegroundColor Green
                Write-Host "Segments count: $($status.results.segments.Count)"
                Write-Host "Processing time: $($status.results.processingTime)"
                Write-Host "First segment text: $($status.results.segments[0].text.Substring(0, 100))..."
            } else {
                Write-Host "❌ No results in status response!" -ForegroundColor Red
            }
            
        } catch {
            Write-Host "❌ Status endpoint failed: $($_.Exception.Message)" -ForegroundColor Red
        }
    }
    
} catch {
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
}