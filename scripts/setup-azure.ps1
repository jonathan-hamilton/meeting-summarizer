# Azure Speech Services Setup Script
# This script configures Azure Speech Services for the Meeting-Summary.io application

Write-Host "Azure Speech Services Setup" -ForegroundColor Green
Write-Host "================================" -ForegroundColor Green

# Check if .env file exists in API project
$envPath = "MeetingSummarizer.Api\.env"
$envExists = Test-Path $envPath

if (-not $envExists) {
    Write-Host "Creating .env file for Azure configuration..." -ForegroundColor Yellow
    New-Item -Path $envPath -ItemType File -Force | Out-Null
}

Write-Host ""
Write-Host "Please provide your Azure Speech Services configuration:" -ForegroundColor Cyan
Write-Host ""

# Get Azure Speech Services Key
$azureKey = Read-Host "Enter your Azure Speech Services Key (KEY 1 from Azure portal)"
if ([string]::IsNullOrWhiteSpace($azureKey)) {
    Write-Host "Error: Azure Speech Services Key is required!" -ForegroundColor Red
    exit 1
}

# Get Azure Speech Services Endpoint
$defaultEndpoint = "https://westus.api.cognitive.microsoft.com/"
$azureEndpoint = Read-Host "Enter your Azure Speech Services Endpoint (default: $defaultEndpoint)"
if ([string]::IsNullOrWhiteSpace($azureEndpoint)) {
    $azureEndpoint = $defaultEndpoint
}

# Get Azure Speech Services Region
$defaultRegion = "westus"
$azureRegion = Read-Host "Enter your Azure Speech Services Region (default: $defaultRegion)"
if ([string]::IsNullOrWhiteSpace($azureRegion)) {
    $azureRegion = $defaultRegion
}

Write-Host ""
Write-Host "Configuring Azure Speech Services..." -ForegroundColor Yellow

# Read existing .env content
$envContent = @()
if (Test-Path $envPath) {
    $envContent = Get-Content $envPath
}

# Remove existing Azure configuration if present
$envContent = $envContent | Where-Object { 
    $_ -notmatch "^AZURE_SPEECH_KEY=" -and 
    $_ -notmatch "^AZURE_SPEECH_ENDPOINT=" -and 
    $_ -notmatch "^AZURE_SPEECH_REGION=" 
}

# Add Azure Speech Services configuration
$envContent += ""
$envContent += "# Azure Speech Services Configuration"
$envContent += "AZURE_SPEECH_KEY=$azureKey"
$envContent += "AZURE_SPEECH_ENDPOINT=$azureEndpoint"
$envContent += "AZURE_SPEECH_REGION=$azureRegion"

# Write updated .env file
$envContent | Out-File -FilePath $envPath -Encoding UTF8

Write-Host "Azure Speech Services configuration added to .env file" -ForegroundColor Green

# Update appsettings.Development.json
$appsettingsPath = "MeetingSummarizer.Api\appsettings.Development.json"
if (Test-Path $appsettingsPath) {
    Write-Host "Updating appsettings.Development.json..." -ForegroundColor Yellow
    
    $appsettings = Get-Content $appsettingsPath | ConvertFrom-Json
    
    # Add Azure Speech Services configuration
    if (-not $appsettings.AzureSpeechServices) {
        $appsettings | Add-Member -Type NoteProperty -Name "AzureSpeechServices" -Value @{}
    }
    
    $appsettings.AzureSpeechServices = @{
        "Key" = $azureKey
        "Endpoint" = $azureEndpoint
        "Region" = $azureRegion
    }
    
    $appsettings | ConvertTo-Json -Depth 10 | Out-File -FilePath $appsettingsPath -Encoding UTF8
    Write-Host "Azure configuration added to appsettings.Development.json" -ForegroundColor Green
}

Write-Host ""
Write-Host "Azure Speech Services Setup Complete!" -ForegroundColor Green
Write-Host "================================" -ForegroundColor Green
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Install Azure Speech SDK NuGet package" -ForegroundColor White
Write-Host "2. Implement Azure Speech Services integration" -ForegroundColor White
Write-Host "3. Create service abstraction layer" -ForegroundColor White
Write-Host "4. Test Azure transcription functionality" -ForegroundColor White
Write-Host ""
Write-Host "Configuration complete! Ready for S4.1 implementation." -ForegroundColor Yellow
