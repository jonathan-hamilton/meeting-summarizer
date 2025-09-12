# Test script to check batch job API response
Write-Host "Testing batch job API..." -ForegroundColor Green

try {
    # Login first
    Write-Host "Logging in..." -ForegroundColor Yellow
    $loginResponse = Invoke-RestMethod -Uri "http://localhost:5029/api/auth/login" -Method POST -Headers @{"Content-Type"="application/json"} -Body '{"email":"test@test.com","password":"Passw0rd!"}'
    $token = $loginResponse.accessToken
    Write-Host "Login successful!" -ForegroundColor Green
    
    # Get batch jobs
    Write-Host "Fetching batch jobs..." -ForegroundColor Yellow
    $response = Invoke-RestMethod -Uri "http://localhost:5029/api/batchjob" -Method GET -Headers @{Authorization="Bearer $token"}
    
    Write-Host "API returned $($response.Count) batch jobs" -ForegroundColor Green
    
    if ($response.Count -gt 0) {
        Write-Host "`nBatch Jobs:" -ForegroundColor Cyan
        $response | Select-Object id, fileName, status, submittedAt, completedAt, progressPercentage | Format-Table -AutoSize
        
        # Show detailed info for first completed job
        $completedJob = $response | Where-Object { $_.status -eq "completed" } | Select-Object -First 1
        if ($completedJob) {
            Write-Host "`nDetailed info for completed job:" -ForegroundColor Cyan
            Write-Host "ID: $($completedJob.id)"
            Write-Host "Status: $($completedJob.status)"
            Write-Host "Progress: $($completedJob.progressPercentage)%"
            Write-Host "Has Results: $($completedJob.results -ne $null)"
            if ($completedJob.results) {
                Write-Host "Results Count: $($completedJob.results.segments.Count) segments"
            }
        }
    } else {
        Write-Host "No batch jobs found" -ForegroundColor Yellow
    }
    
} catch {
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Full error: $($_.Exception)" -ForegroundColor Red
}

Write-Host "`nScript completed!" -ForegroundColor Green