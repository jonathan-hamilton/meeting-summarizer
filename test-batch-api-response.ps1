# Test script to debug batch job API response structure
Write-Host "Testing Batch Job API Response Structure" -ForegroundColor Green

try {
    # Login first
    Write-Host "`n1. Logging in..." -ForegroundColor Yellow
    $loginResponse = Invoke-RestMethod -Uri "http://localhost:5029/api/auth/login" -Method POST -Headers @{"Content-Type"="application/json"} -Body '{"email":"test@test.com","password":"Passw0rd!"}'
    $token = $loginResponse.accessToken
    Write-Host "   ✅ Login successful!" -ForegroundColor Green
    
    # Upload a large file to trigger batch processing
    Write-Host "`n2. Uploading large file to trigger batch processing..." -ForegroundColor Yellow
    
    # Create multipart form data
    $boundary = [System.Guid]::NewGuid().ToString()
    $filePath = "sample-audio-files/25min-mtg-4-voices.wav"
    
    if (-not (Test-Path $filePath)) {
        Write-Host "   ❌ Audio file not found: $filePath" -ForegroundColor Red
        Write-Host "   Available files:" -ForegroundColor Yellow
        Get-ChildItem "sample-audio-files/" -Name | ForEach-Object { Write-Host "     - $_" }
        exit 1
    }
    
    # Use form data approach
    $form = @{
        audioFile = Get-Item $filePath
    }
    
    $uploadResponse = Invoke-RestMethod -Uri "http://localhost:5029/api/summary/transcribe" -Method POST -Headers @{
        Authorization = "Bearer $token"
    } -Form $form
    
    Write-Host "   ✅ Upload request completed!" -ForegroundColor Green
    
    # Analyze the response
    Write-Host "`n3. Analyzing API Response Structure..." -ForegroundColor Cyan
    Write-Host "Response Type: $($uploadResponse.GetType().Name)" -ForegroundColor White
    
    if ($uploadResponse.PSObject.Properties) {
        Write-Host "`nResponse Properties:" -ForegroundColor White
        $uploadResponse.PSObject.Properties | ForEach-Object {
            $value = if ($_.Value -is [string] -and $_.Value.Length -gt 50) { 
                $_.Value.Substring(0, 47) + "..." 
            } else { 
                $_.Value 
            }
            Write-Host "  - $($_.Name): $value" -ForegroundColor Gray
        }
    }
    
    # Check for batch job indicators
    Write-Host "`n4. Checking for Batch Job Indicators..." -ForegroundColor Cyan
    
    $hasJobIdPascal = $uploadResponse.PSObject.Properties.Name -contains "JobId"
    $hasJobIdCamel = $uploadResponse.PSObject.Properties.Name -contains "jobId"
    $hasTranscriptionId = $uploadResponse.PSObject.Properties.Name -contains "transcriptionId"
    
    Write-Host "  Has 'JobId' property (PascalCase): $hasJobIdPascal" -ForegroundColor $(if($hasJobIdPascal) {"Green"} else {"Red"})
    Write-Host "  Has 'jobId' property (camelCase): $hasJobIdCamel" -ForegroundColor $(if($hasJobIdCamel) {"Green"} else {"Red"})
    Write-Host "  Has 'transcriptionId' property: $hasTranscriptionId" -ForegroundColor $(if($hasTranscriptionId) {"Green"} else {"Yellow"})
    
    # Show full response as JSON
    Write-Host "`n5. Full Response JSON:" -ForegroundColor Cyan
    $uploadResponse | ConvertTo-Json -Depth 5
    
    # Check if it's actually a batch job
    if ($hasJobIdPascal -or $hasJobIdCamel) {
        $jobId = if ($hasJobIdPascal) { $uploadResponse.JobId } else { $uploadResponse.jobId }
        Write-Host "`n6. ✅ This IS a batch job! Job ID: $jobId" -ForegroundColor Green
        Write-Host "   Frontend should start polling for this job..." -ForegroundColor Yellow
    } elseif ($hasTranscriptionId) {
        Write-Host "`n6. ❌ This is immediate transcription, not batch processing" -ForegroundColor Red
        Write-Host "   File may be too small or different processing path used" -ForegroundColor Yellow
    } else {
        Write-Host "`n6. ❓ Unknown response type - check the JSON above" -ForegroundColor Magenta
    }
    
} catch {
    Write-Host "`n❌ Error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Full error: $($_.Exception)" -ForegroundColor DarkRed
}

Write-Host "`n🔍 This will help debug why frontend polling isn't starting!" -ForegroundColor Cyan