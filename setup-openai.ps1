# OpenAI Environment Setup Script
# This script helps set up OpenAI environment variables for local development

param(
    [Parameter(Mandatory=$true)]
    [string]$ApiKey,
    
    [Parameter(Mandatory=$false)]
    [string]$OrganizationId = "",
    
    [Parameter(Mandatory=$false)]
    [string]$ProjectId = "",
    
    [Parameter(Mandatory=$false)]
    [string]$TranscriptionModel = "whisper-1",
    
    [Parameter(Mandatory=$false)]
    [string]$ChatModel = "gpt-4o-mini",
    
    [Parameter(Mandatory=$false)]
    [int]$TimeoutSeconds = 300,
    
    [Parameter(Mandatory=$false)]
    [int]$MaxRetries = 3,
    
    [Parameter(Mandatory=$false)]
    [switch]$UseUserSecrets = $false
)

Write-Host "Setting up OpenAI environment variables..." -ForegroundColor Green

if ($UseUserSecrets) {
    Write-Host "Using .NET User Secrets..." -ForegroundColor Yellow
    
    # Navigate to API project directory
    $apiPath = Join-Path $PSScriptRoot "MeetingSummarizer.Api"
    
    if (Test-Path $apiPath) {
        Push-Location $apiPath
        
        try {
            dotnet user-secrets set "OpenAI:ApiKey" $ApiKey
            Write-Host "✓ API Key set in user secrets" -ForegroundColor Green
            
            if ($OrganizationId) {
                dotnet user-secrets set "OpenAI:OrganizationId" $OrganizationId
                Write-Host "✓ Organization ID set in user secrets" -ForegroundColor Green
            }
            
            if ($ProjectId) {
                dotnet user-secrets set "OpenAI:ProjectId" $ProjectId
                Write-Host "✓ Project ID set in user secrets" -ForegroundColor Green
            }
            
            dotnet user-secrets set "OpenAI:DefaultTranscriptionModel" $TranscriptionModel
            dotnet user-secrets set "OpenAI:DefaultChatModel" $ChatModel
            dotnet user-secrets set "OpenAI:TimeoutSeconds" $TimeoutSeconds
            dotnet user-secrets set "OpenAI:MaxRetries" $MaxRetries
            
            Write-Host "✓ All configuration set in user secrets" -ForegroundColor Green
        }
        catch {
            Write-Error "Failed to set user secrets: $_"
        }
        finally {
            Pop-Location
        }
    } else {
        Write-Error "API project directory not found at: $apiPath"
    }
} else {
    Write-Host "Setting environment variables for current session..." -ForegroundColor Yellow
    
    # Set environment variables
    $env:OpenAI__ApiKey = $ApiKey
    Write-Host "✓ OpenAI__ApiKey set" -ForegroundColor Green
    
    if ($OrganizationId) {
        $env:OpenAI__OrganizationId = $OrganizationId
        Write-Host "✓ OpenAI__OrganizationId set" -ForegroundColor Green
    }
    
    if ($ProjectId) {
        $env:OpenAI__ProjectId = $ProjectId
        Write-Host "✓ OpenAI__ProjectId set" -ForegroundColor Green
    }
    
    $env:OpenAI__DefaultTranscriptionModel = $TranscriptionModel
    $env:OpenAI__DefaultChatModel = $ChatModel
    $env:OpenAI__TimeoutSeconds = $TimeoutSeconds
    $env:OpenAI__MaxRetries = $MaxRetries
    
    Write-Host "✓ All environment variables set for current session" -ForegroundColor Green
    
    Write-Host ""
    Write-Host "Note: These environment variables are only set for the current PowerShell session." -ForegroundColor Yellow
    Write-Host "To make them permanent, add them to your system environment variables." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Configuration Summary:" -ForegroundColor Cyan
Write-Host "  API Key: $(if ($ApiKey.Length -gt 8) { $ApiKey.Substring(0, 8) + '...' } else { 'Set' })" -ForegroundColor White
Write-Host "  Organization ID: $(if ($OrganizationId) { $OrganizationId } else { 'Not set' })" -ForegroundColor White
Write-Host "  Project ID: $(if ($ProjectId) { $ProjectId } else { 'Not set' })" -ForegroundColor White
Write-Host "  Transcription Model: $TranscriptionModel" -ForegroundColor White
Write-Host "  Chat Model: $ChatModel" -ForegroundColor White
Write-Host "  Timeout: $TimeoutSeconds seconds" -ForegroundColor White
Write-Host "  Max Retries: $MaxRetries" -ForegroundColor White

Write-Host ""
Write-Host "Setup complete! You can now run the application with OpenAI integration." -ForegroundColor Green

# Example usage information
Write-Host ""
Write-Host "Example usage:" -ForegroundColor Cyan
Write-Host "  .\setup-openai.ps1 -ApiKey 'sk-your-api-key-here'" -ForegroundColor Gray
Write-Host "  .\setup-openai.ps1 -ApiKey 'sk-your-api-key-here' -OrganizationId 'org-123' -UseUserSecrets" -ForegroundColor Gray
