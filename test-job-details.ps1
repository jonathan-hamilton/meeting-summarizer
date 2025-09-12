# Check database for results data in completed batch jobs
Write-Host "Checking database for batch job results..." -ForegroundColor Green

try {
    # Login first
    $loginResponse = Invoke-RestMethod -Uri "http://localhost:5029/api/auth/login" -Method POST -Headers @{"Content-Type"="application/json"} -Body '{"email":"test@test.com","password":"Passw0rd!"}'
    $token = $loginResponse.accessToken
    
    # Get completed jobs
    $response = Invoke-RestMethod -Uri "http://localhost:5029/api/batchjob" -Method GET -Headers @{Authorization="Bearer $token"}
    $completedJobs = $response | Where-Object { $_.status -eq "completed" }
    
    if ($completedJobs.Count -gt 0) {
        $job = $completedJobs[0]  # Get first completed job
        Write-Host "Checking job: $($job.id)" -ForegroundColor Cyan
        Write-Host "File: $($job.fileName)" -ForegroundColor Cyan
        
        # Get detailed job status
        Write-Host "Getting detailed job status from API..." -ForegroundColor Yellow
        $jobDetail = Invoke-RestMethod -Uri "http://localhost:5029/api/batchjob/$($job.id)/status" -Method GET -Headers @{Authorization="Bearer $token"}
        
        Write-Host "`nJob Detail Response:" -ForegroundColor Cyan
        Write-Host "ID: $($jobDetail.id)"
        Write-Host "Status: $($jobDetail.status)"
        Write-Host "Progress: $($jobDetail.progressPercentage)%"
        Write-Host "Has Results Property: $($jobDetail.PSObject.Properties['results'] -ne $null)"
        
        if ($jobDetail.results) {
            Write-Host "Results Type: $($jobDetail.results.GetType().Name)"
            Write-Host "Results Content:" -ForegroundColor Green
            $jobDetail.results | ConvertTo-Json -Depth 2 | Write-Host
        } else {
            Write-Host "Results is null or missing!" -ForegroundColor Red
            
            # Show all properties to see what's actually in the response
            Write-Host "`nAll properties in response:" -ForegroundColor Yellow
            $jobDetail.PSObject.Properties | ForEach-Object {
                Write-Host "$($_.Name): $($_.Value)"
            }
        }
        
    } else {
        Write-Host "No completed jobs found" -ForegroundColor Yellow
    }
    
} catch {
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
}