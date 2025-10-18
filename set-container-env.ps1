# Set Container Environment Variables
# Run this once to persist Azure client secret for container development

Write-Host "Setting Azure Container Environment Variables" -ForegroundColor Cyan
Write-Host "===========================================" -ForegroundColor Cyan

# Set the client secret environment variable
$env:AZURE_CLIENT_SECRET_CONTAINER = "REDACTED_SP_SECRET"

# Also set it permanently for the current user (optional)
Write-Host "Setting environment variable for current PowerShell session..." -ForegroundColor Yellow
Write-Host "Variable: AZURE_CLIENT_SECRET_CONTAINER" -ForegroundColor Gray
Write-Host "Status: Set for current session" -ForegroundColor Green

Write-Host ""
Write-Host "To make this permanent across PowerShell sessions, run:" -ForegroundColor Yellow
Write-Host '[System.Environment]::SetEnvironmentVariable("AZURE_CLIENT_SECRET_CONTAINER", "REDACTED_SP_SECRET", "User")' -ForegroundColor Gray

Write-Host ""
Write-Host "Environment variable set! You can now run:" -ForegroundColor Green
Write-Host "   .\start-container.ps1" -ForegroundColor Cyan
Write-Host ""
Write-Host "The container will automatically use the stored client secret." -ForegroundColor Green