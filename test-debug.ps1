#!/usr/bin/env pwsh

# Simple test to upload WAV file with debug logging
$uri = "http://localhost:5029/api/upload"
$audioFile = "sample-audio-files\sample-scrum.wav"

Write-Host "Testing WAV file upload with debug routing..." -ForegroundColor Yellow
Write-Host "File: $audioFile"

# Use Invoke-WebRequest for better error handling
try {
    $form = @{
        audioFile = Get-Item $audioFile
        speakerMappingMode = "none"
        format = "text"
    }
    
    Write-Host "Uploading..." -ForegroundColor Cyan
    $response = Invoke-WebRequest -Uri $uri -Method Post -Form $form -TimeoutSec 180
    
    Write-Host "Response Status: $($response.StatusCode)" -ForegroundColor Green
    Write-Host "Check API server console for routing debug logs" -ForegroundColor Yellow
    
} catch {
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        Write-Host "Status: $($_.Exception.Response.StatusCode)"
    }
}
