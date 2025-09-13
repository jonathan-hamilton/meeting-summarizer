# Simple batch job response test using curl
Write-Host "Testing Batch Job Response with curl" -ForegroundColor Green

try {
    # Step 1: Login
    Write-Host "`n1. Logging in..." -ForegroundColor Yellow
    $loginJson = '{"email":"test@test.com","password":"Passw0rd!"}'
    $loginResponse = curl -s -X POST -H "Content-Type: application/json" -d $loginJson http://localhost:5029/api/auth/login | ConvertFrom-Json
    $token = $loginResponse.accessToken
    Write-Host "   Login successful!" -ForegroundColor Green
    
    # Step 2: Upload file using curl
    Write-Host "`n2. Uploading large file with curl..." -ForegroundColor Yellow
    $filePath = "sample-audio-files/25min-mtg-4-voices.wav"
    
    if (-not (Test-Path $filePath)) {
        Write-Host "   File not found: $filePath" -ForegroundColor Red
        exit 1
    }
    
    $curlResponse = curl -s -X POST -H "Authorization: Bearer $token" -F "audioFile=@$filePath" http://localhost:5029/api/summary/transcribe
    $response = $curlResponse | ConvertFrom-Json
    
    Write-Host "   Upload completed!" -ForegroundColor Green
    
    # Step 3: Analyze response structure
    Write-Host "`n3. Response Analysis:" -ForegroundColor Cyan
    Write-Host "Raw curl response:" -ForegroundColor White
    Write-Host $curlResponse -ForegroundColor Gray
    
    Write-Host "`nParsed response type: $($response.GetType().Name)" -ForegroundColor White
    
    if ($response) {
        Write-Host "`nResponse Properties:" -ForegroundColor White
        $response.PSObject.Properties | ForEach-Object {
            $value = if ($_.Value -is [string] -and $_.Value.Length -gt 100) { 
                $_.Value.Substring(0, 97) + "..." 
            } else { 
                $_.Value 
            }
            Write-Host "  - $($_.Name): $value" -ForegroundColor Gray
        }
        
        # Check batch job indicators
        $hasJobIdPascal = $response.PSObject.Properties.Name -contains "JobId"
        $hasJobIdCamel = $response.PSObject.Properties.Name -contains "jobId"
        $hasTranscriptionId = $response.PSObject.Properties.Name -contains "transcriptionId"
        
        Write-Host "`nBatch Job Detection:" -ForegroundColor Cyan
        Write-Host "  Has JobId (Pascal): $hasJobIdPascal" -ForegroundColor $(if($hasJobIdPascal) {"Green"} else {"Red"})
        Write-Host "  Has jobId (camel): $hasJobIdCamel" -ForegroundColor $(if($hasJobIdCamel) {"Green"} else {"Red"})
        Write-Host "  Has transcriptionId: $hasTranscriptionId" -ForegroundColor $(if($hasTranscriptionId) {"Yellow"} else {"Red"})
        
        # Determine result
        if ($hasJobIdPascal) {
            $jobId = $response.JobId
            Write-Host "`n✅ BATCH JOB DETECTED - JobId (Pascal): $jobId" -ForegroundColor Green
            Write-Host "   Frontend should poll: /api/batchjob/$jobId/status" -ForegroundColor Yellow
        } elseif ($hasJobIdCamel) {
            $jobId = $response.jobId
            Write-Host "`n✅ BATCH JOB DETECTED - jobId (camel): $jobId" -ForegroundColor Green
            Write-Host "   Frontend should poll: /api/batchjob/$jobId/status" -ForegroundColor Yellow
        } elseif ($hasTranscriptionId) {
            Write-Host "`n❌ IMMEDIATE TRANSCRIPTION - transcriptionId: $($response.transcriptionId)" -ForegroundColor Red
            Write-Host "   File processed immediately, no polling needed" -ForegroundColor Yellow
        } else {
            Write-Host "`n❓ UNKNOWN RESPONSE TYPE" -ForegroundColor Magenta
            Write-Host "   Check the response structure above" -ForegroundColor Yellow
        }
    } else {
        Write-Host "`n❌ Response is null!" -ForegroundColor Red
    }
    
} catch {
    Write-Host "`n❌ Error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "   Full error: $($_.Exception)" -ForegroundColor DarkRed
}

Write-Host "`n🔍 This reveals the exact API response structure the frontend sees!" -ForegroundColor Cyan