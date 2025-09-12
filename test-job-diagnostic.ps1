# Detailed diagnostic for batch job API
Write-Host "Detailed batch job diagnostic..." -ForegroundColor Green

try {
    # Login
    Write-Host "Logging in..." -ForegroundColor Yellow
    $loginResponse = Invoke-RestMethod -Uri "http://localhost:5029/api/auth/login" -Method POST -Headers @{"Content-Type"="application/json"} -Body '{"email":"test@test.com","password":"Passw0rd!"}'
    $token = $loginResponse.accessToken
    Write-Host "Login successful!" -ForegroundColor Green
    
    # Get batch jobs
    Write-Host "`nGetting batch jobs list..." -ForegroundColor Yellow
    $jobs = Invoke-RestMethod -Uri "http://localhost:5029/api/batchjob" -Method GET -Headers @{Authorization="Bearer $token"}
    
    Write-Host "Found $($jobs.Count) total jobs" -ForegroundColor Cyan
    $completedJobs = $jobs | Where-Object { $_.status -eq "completed" }
    Write-Host "Found $($completedJobs.Count) completed jobs" -ForegroundColor Cyan
    
    if ($completedJobs.Count -gt 0) {
        $job = $completedJobs[0]
        Write-Host "`nSelected job details:" -ForegroundColor Yellow
        Write-Host "ID: $($job.jobId)"
        Write-Host "File: $($job.fileName)"
        Write-Host "Status: $($job.status)"
        Write-Host "Progress: $($job.progressPercentage)%"
        
        # Construct the URL we're trying to call
        $statusUrl = "http://localhost:5029/api/batchjob/$($job.jobId)/status"
        Write-Host "`nTrying to call: $statusUrl" -ForegroundColor Cyan
        
        try {
            $jobDetail = Invoke-RestMethod -Uri $statusUrl -Method GET -Headers @{Authorization="Bearer $token"} -Verbose
            
            Write-Host "`n✅ SUCCESS! Job details retrieved:" -ForegroundColor Green
            Write-Host "Status: $($jobDetail.status)"
            Write-Host "Progress: $($jobDetail.progressPercentage)%"
            Write-Host "Has Results: $($jobDetail.results -ne $null)"
            
            if ($jobDetail.results) {
                Write-Host "Results found!" -ForegroundColor Green
                $jobDetail.results | ConvertTo-Json -Depth 2 | Write-Host
            } else {
                Write-Host "No results in response" -ForegroundColor Red
            }
            
        } catch {
            Write-Host "`n❌ FAILED to get job details:" -ForegroundColor Red
            Write-Host "Error: $($_.Exception.Message)"
            Write-Host "Status Code: $($_.Exception.Response.StatusCode)"
            Write-Host "Status Description: $($_.Exception.Response.StatusDescription)"
            
            # Show the exact URL that failed
            Write-Host "Failed URL: $statusUrl" -ForegroundColor Yellow
        }
        
    } else {
        Write-Host "No completed jobs to test with" -ForegroundColor Yellow
        
        # Show all jobs for debugging
        if ($jobs.Count -gt 0) {
            Write-Host "`nAll jobs:" -ForegroundColor Cyan
            $jobs | Select-Object jobId, fileName, status, progressPercentage | Format-Table -AutoSize
        }
    }
    
} catch {
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
}