# Debug batch job API response structure
Write-Host "Debugging Batch Job API Response Structure" -ForegroundColor Green

try {
    # Step 1: Login
    Write-Host "`n1. Logging in..." -ForegroundColor Yellow
    $loginResponse = Invoke-RestMethod -Uri "http://localhost:5029/api/auth/login" -Method POST -Headers @{"Content-Type"="application/json"} -Body '{"email":"test@test.com","password":"Passw0rd!"}'
    $token = $loginResponse.accessToken
    Write-Host "   Login successful!" -ForegroundColor Green
    
    # Step 2: Upload large file
    Write-Host "`n2. Uploading large file..." -ForegroundColor Yellow
    $filePath = "sample-audio-files/25min-mtg-4-voices.wav"
    
    if (-not (Test-Path $filePath)) {
        Write-Host "   File not found: $filePath" -ForegroundColor Red
        exit 1
    }
    
    # Create multipart form data manually
    $fileBytes = [System.IO.File]::ReadAllBytes((Resolve-Path $filePath))
    $boundary = [System.Guid]::NewGuid().ToString()
    
    $bodyLines = @()
    $bodyLines += "--$boundary"
    $bodyLines += 'Content-Disposition: form-data; name="audioFile"; filename="25min-mtg-4-voices.wav"'
    $bodyLines += 'Content-Type: audio/wav'
    $bodyLines += ''
    
    $bodyString = $bodyLines -join "`r`n"
    $bodyBytes = [System.Text.Encoding]::UTF8.GetBytes($bodyString)
    
    $endBoundary = "`r`n--$boundary--`r`n"
    $endBytes = [System.Text.Encoding]::UTF8.GetBytes($endBoundary)
    
    $fullBody = $bodyBytes + $fileBytes + $endBytes
    
    $response = Invoke-RestMethod -Uri "http://localhost:5029/api/summary/transcribe" -Method POST -Headers @{
        Authorization = "Bearer $token"
        "Content-Type" = "multipart/form-data; boundary=$boundary"
    } -Body $fullBody
    
    Write-Host "   Upload completed!" -ForegroundColor Green
    
    # Step 3: Analyze response
    Write-Host "`n3. Response Analysis:" -ForegroundColor Cyan
    Write-Host "Type: $($response.GetType().Name)" -ForegroundColor White
    
    if ($response) {
        Write-Host "`nProperties:" -ForegroundColor White
        $response.PSObject.Properties | ForEach-Object {
            Write-Host "  - $($_.Name): $($_.Value)" -ForegroundColor Gray
        }
        
        # Check for batch job properties
        $hasJobIdPascal = $response.PSObject.Properties.Name -contains "JobId"
        $hasJobIdCamel = $response.PSObject.Properties.Name -contains "jobId"
        $hasTranscriptionId = $response.PSObject.Properties.Name -contains "transcriptionId"
        
        Write-Host "`nBatch Job Check:" -ForegroundColor Cyan
        Write-Host "  JobId (Pascal): $hasJobIdPascal" -ForegroundColor $(if($hasJobIdPascal) {"Green"} else {"Red"})
        Write-Host "  jobId (camel): $hasJobIdCamel" -ForegroundColor $(if($hasJobIdCamel) {"Green"} else {"Red"})
        Write-Host "  transcriptionId: $hasTranscriptionId" -ForegroundColor $(if($hasTranscriptionId) {"Green"} else {"Red"})
        
        Write-Host "`nFull JSON Response:" -ForegroundColor Yellow
        $response | ConvertTo-Json -Depth 3
        
        if ($hasJobIdPascal -or $hasJobIdCamel) {
            $jobId = if ($hasJobIdPascal) { $response.JobId } else { $response.jobId }
            Write-Host "`nResult: This IS a batch job with ID: $jobId" -ForegroundColor Green
        } else {
            Write-Host "`nResult: This is NOT a batch job - likely immediate processing" -ForegroundColor Red
        }
    } else {
        Write-Host "Response is null!" -ForegroundColor Red
    }
    
} catch {
    Write-Host "`nError: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`nThis shows exactly what structure the frontend receives!" -ForegroundColor Cyan