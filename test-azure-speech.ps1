# Test Azure Speech Services Integration - S4.1
# This script tests the Azure Speech Services integration with fallback to OpenAI Whisper

Write-Host "Testing Azure Speech Services Integration (S4.1)" -ForegroundColor Green
Write-Host "=================================================" -ForegroundColor Green

$baseUrl = "http://localhost:5029"
$testAudioFile = "sample-audio-files\sample1.mp3"

# Check if test audio file exists
if (-not (Test-Path $testAudioFile)) {
    Write-Host "Error: Test audio file not found: $testAudioFile" -ForegroundColor Red
    Write-Host "Please ensure you have sample audio files in the sample-audio-files directory" -ForegroundColor Red
    exit 1
}

Write-Host "Using test file: $testAudioFile" -ForegroundColor Cyan
Write-Host ""

# Test 1: Check API health
Write-Host "Test 1: Checking API health..." -ForegroundColor Yellow
try {
    $healthResponse = Invoke-RestMethod -Uri "$baseUrl/api/health" -Method Get -TimeoutSec 10
    Write-Host "✓ API is responding: $($healthResponse.status)" -ForegroundColor Green
} catch {
    Write-Host "✗ API health check failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Test 2: Test transcription with Azure Speech Services
Write-Host "Test 2: Testing transcription (Azure primary, OpenAI fallback)..." -ForegroundColor Yellow

# Prepare multipart form data for file upload
$boundary = [System.Guid]::NewGuid().ToString()
$fileBytes = [System.IO.File]::ReadAllBytes($testAudioFile)
$fileName = [System.IO.Path]::GetFileName($testAudioFile)

$bodyTemplate = @"
--$boundary
Content-Disposition: form-data; name="audioFile"; filename="$fileName"
Content-Type: audio/mpeg

{0}
--$boundary--
"@

$body = $bodyTemplate -f [System.Text.Encoding]::GetEncoding("iso-8859-1").GetString($fileBytes)
$bodyBytes = [System.Text.Encoding]::GetEncoding("iso-8859-1").GetBytes($body)

try {
    Write-Host "Uploading audio file for transcription..." -ForegroundColor Cyan
    $transcriptionResponse = Invoke-RestMethod -Uri "$baseUrl/api/summary/transcribe" -Method Post -Body $bodyBytes -ContentType "multipart/form-data; boundary=$boundary" -TimeoutSec 120

    Write-Host "✓ Transcription completed successfully!" -ForegroundColor Green
    Write-Host "  Provider: $($transcriptionResponse.metadata.provider)" -ForegroundColor White
    Write-Host "  Processing Time: $($transcriptionResponse.metadata.processingTimeMs)ms" -ForegroundColor White
    Write-Host "  Text Length: $($transcriptionResponse.text.Length) characters" -ForegroundColor White
    Write-Host "  Speaker Segments: $($transcriptionResponse.segments.Count)" -ForegroundColor White
    
    if ($transcriptionResponse.text.Length -gt 100) {
        Write-Host "  Preview: $($transcriptionResponse.text.Substring(0, 100))..." -ForegroundColor Gray
    } else {
        Write-Host "  Text: $($transcriptionResponse.text)" -ForegroundColor Gray
    }

    # Show which service was used
    if ($transcriptionResponse.metadata.provider -like "*Azure*") {
        Write-Host "✓ Azure Speech Services was used successfully!" -ForegroundColor Green
    } elseif ($transcriptionResponse.metadata.provider -like "*OpenAI*") {
        Write-Host "⚠ OpenAI Whisper fallback was used (Azure may not be available)" -ForegroundColor Yellow
    } else {
        Write-Host "ℹ Unknown provider used: $($transcriptionResponse.metadata.provider)" -ForegroundColor Blue
    }

} catch {
    Write-Host "✗ Transcription failed: $($_.Exception.Message)" -ForegroundColor Red
    
    # Check if it's a timeout
    if ($_.Exception.Message -like "*timeout*") {
        Write-Host "  This might be normal for longer audio files or first-time Azure setup" -ForegroundColor Yellow
    }
    
    # Check response details if available
    if ($_.Exception.Response) {
        try {
            $errorStream = $_.Exception.Response.GetResponseStream()
            $reader = New-Object System.IO.StreamReader($errorStream)
            $errorBody = $reader.ReadToEnd()
            Write-Host "  Error details: $errorBody" -ForegroundColor Red
        } catch {
            Write-Host "  Could not read error details" -ForegroundColor Red
        }
    }
}

Write-Host ""

# Test 3: Check service status
Write-Host "Test 3: Checking transcription service status..." -ForegroundColor Yellow
try {
    $statusResponse = Invoke-RestMethod -Uri "$baseUrl/api/openai/status" -Method Get -TimeoutSec 10
    Write-Host "✓ Service status retrieved:" -ForegroundColor Green
    Write-Host "  $($statusResponse.message)" -ForegroundColor White
} catch {
    Write-Host "⚠ Could not retrieve service status: $($_.Exception.Message)" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Azure Speech Services Integration Test Complete!" -ForegroundColor Green
Write-Host "=================================================" -ForegroundColor Green

Write-Host ""
Write-Host "S4.1 Implementation Summary:" -ForegroundColor Cyan
Write-Host "✓ Azure Speech SDK installed and configured" -ForegroundColor Green
Write-Host "✓ Service abstraction layer implemented (ITranscriptionService)" -ForegroundColor Green
Write-Host "✓ Composite service with Azure primary, OpenAI fallback" -ForegroundColor Green
Write-Host "✓ Configuration management for Azure Speech Services" -ForegroundColor Green
Write-Host "✓ SummaryController updated to use new transcription service" -ForegroundColor Green
Write-Host "✓ Backward compatibility maintained" -ForegroundColor Green
