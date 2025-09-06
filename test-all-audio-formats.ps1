# Test All Audio Format Conversions
# This script tests the WAV conversion functionality for all supported audio formats

$baseUrl = "http://localhost:5029"
$audioDir = "sample-audio-files"
$testFiles = @(
    "sample-scrum-4-speakers-alternating-no-identifiers.mp3",
    "sample-scrum-4-speakers-alternating-no-identifiers.m4a", 
    "sample-scrum-4-speakers-alternating-no-identifiers.flac",
    "sample-scrum-4-speakers-alternating-no-identifiers.ogg",
    "sample-scrum-4-speakers-alternating-no-identifiers.webm",
    "sample-scrum-4-speakers-alternating-no-identifiers.wav"
)

Write-Host "🎯 Testing WAV Conversion for All Audio Formats" -ForegroundColor Green
Write-Host "=============================================="

foreach ($file in $testFiles) {
    $filePath = Join-Path $audioDir $file
    $extension = [System.IO.Path]::GetExtension($file)
    
    if (Test-Path $filePath) {
        Write-Host "`n📁 Testing $extension format: $file" -ForegroundColor Cyan
        
        try {
            # Test file validation endpoint (which should handle all formats)
            $form = @{
                audioFile = Get-Item $filePath
            }
            
            Write-Host "   ⏳ Sending request to /api/fileprocessing/validate..." -ForegroundColor Yellow
            
            $response = Invoke-RestMethod -Uri "$baseUrl/api/fileprocessing/validate" -Method POST -Form $form -ContentType "multipart/form-data" -TimeoutSec 60
            
            if ($response.Status -eq "Valid") {
                Write-Host "   ✅ SUCCESS: $extension format validated successfully" -ForegroundColor Green
                Write-Host "      📊 File Size: $([Math]::Round($response.ValidationDetails.FileInfo.FileSizeMB, 2)) MB"
                Write-Host "      🎵 Audio Format: $($response.ValidationDetails.AudioContent.DetectedFormat)"
                Write-Host "      ⏱️  Duration: $([Math]::Round($response.ValidationDetails.AudioContent.EstimatedDurationSeconds, 1)) seconds"
                
                if ($response.Warnings -and $response.Warnings.Count -gt 0) {
                    Write-Host "      ⚠️  Warnings: $($response.Warnings -join ', ')" -ForegroundColor Yellow
                }
            } else {
                Write-Host "   ❌ FAILED: $extension format validation failed" -ForegroundColor Red
                Write-Host "      Error: $($response.Message)"
                if ($response.ValidationDetails.Errors) {
                    $response.ValidationDetails.Errors | ForEach-Object {
                        Write-Host "      - $_" -ForegroundColor Red
                    }
                }
            }
        }
        catch {
            Write-Host "   ❌ ERROR: Failed to test $extension format" -ForegroundColor Red
            Write-Host "      Exception: $($_.Exception.Message)" -ForegroundColor Red
        }
    } else {
        Write-Host "   ⚠️  SKIP: File not found: $filePath" -ForegroundColor Yellow
    }
}

Write-Host "`n🎯 Audio Format Testing Complete!" -ForegroundColor Green
Write-Host "=============================================="
