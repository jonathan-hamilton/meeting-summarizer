# Docker Container Local Development Script
# Runs the Meeting Summarizer application in a container with Azure Key Vault access

param(
    [string]$ClientSecret = "",
    [switch]$Build = $false,
    [switch]$Clean = $false,
    [string]$Tag = "latest"
)

# Total number of steps for progress tracking
$totalSteps = 12

Write-Host "Docker Meeting Summarizer - Container Development Mode" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan

# Step 1/12: Check directory
Write-Host "#1/$totalSteps Check if we're in the right directory" -ForegroundColor Yellow
if (-not (Test-Path "MeetingSummarizer.Api\MeetingSummarizer.Api.csproj")) {
    Write-Host "Error: Please run this script from the repository root directory" -ForegroundColor Red
    exit 1
}

# Step 2/12: Validate Azure CLI
Write-Host "#2/$totalSteps Get Azure CLI account info for validation" -ForegroundColor Yellow
try {
    $azAccount = az account show | ConvertFrom-Json
    Write-Host "Azure CLI authenticated as: $($azAccount.user.name)" -ForegroundColor Green
} catch {
    Write-Host "Error: Azure CLI not authenticated. Run 'az login' first" -ForegroundColor Red
    exit 1
}

# Step 3/12: Handle client secret
Write-Host "#3/$totalSteps Handle Service Principal authentication" -ForegroundColor Yellow
if ([string]::IsNullOrEmpty($ClientSecret)) {
    # Check for environment variable first
    $ClientSecret = $env:AZURE_CLIENT_SECRET_CONTAINER
    
    if ([string]::IsNullOrEmpty($ClientSecret)) {
        Write-Host ""
        Write-Host "Azure Service Principal Authentication Required" -ForegroundColor Yellow
        Write-Host "The container needs the Service Principal client secret to access Key Vault" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "You can either:"
        Write-Host "1. Set environment variable: `$env:AZURE_CLIENT_SECRET_CONTAINER = 'your-secret'"
        Write-Host "2. Pass as parameter: .\start-container.ps1 -ClientSecret 'your-secret'"
        Write-Host "3. Enter it now (will not be saved)"
        Write-Host ""
        Write-Host "You can find the secret in:"
        Write-Host "• Azure Portal > App Registrations > meeting-summary-io-app > Certificates and secrets"
        Write-Host "• Or ask your Azure administrator"
        Write-Host ""
        
        $ClientSecret = Read-Host "Enter the client secret (or press Enter to skip and use Azure CLI passthrough)"
        
        if ([string]::IsNullOrEmpty($ClientSecret)) {
            Write-Host "No client secret provided. Container will attempt Azure CLI credential passthrough" -ForegroundColor Yellow
        }
    } else {
        Write-Host "Using client secret from environment variable AZURE_CLIENT_SECRET_CONTAINER" -ForegroundColor Green
    }
}

# Step 4/12: Clean previous builds if requested
if ($Clean) {
    Write-Host "#4/$totalSteps Cleaning previous builds..." -ForegroundColor Yellow
    docker rmi meeting-summary-api:$Tag -f 2>$null
    docker builder prune -f
}

# Step 5/12: Check if Docker image exists or needs building
Write-Host "#5/$totalSteps Check Docker image status" -ForegroundColor Yellow
$imageName = "meeting-summary-api:$Tag"
$imageExists = docker images -q $imageName

if ($Build -or -not $imageExists) {
    Write-Host "#6/$totalSteps Building Docker image: $imageName" -ForegroundColor Yellow
    Write-Host "   Build context: $(Get-Location)" -ForegroundColor Gray
    Write-Host "   Dockerfile: MeetingSummarizer.Api/Dockerfile" -ForegroundColor Gray
    Write-Host "" 
    
    Write-Host "Starting Docker build process..." -ForegroundColor Cyan
    $buildResult = docker build -t $imageName -f MeetingSummarizer.Api/Dockerfile . --progress=plain
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Docker build failed" -ForegroundColor Red
        exit 1
    }
    
    Write-Host ""
    Write-Host "Docker image built successfully" -ForegroundColor Green
} else {
    Write-Host "#6/$totalSteps Using existing Docker image: $imageName" -ForegroundColor Green
}

# Step 7/12: Prepare environment variables
Write-Host "#7/$totalSteps Prepare environment variables" -ForegroundColor Yellow
$envVars = @()

# Step 8/12: Configure Azure authentication
Write-Host "#8/$totalSteps Configure Azure authentication" -ForegroundColor Yellow
if (-not [string]::IsNullOrEmpty($ClientSecret)) {
    $envVars += "-e", "AZURE_CLIENT_ID=5ed62488-7c1f-42bf-b855-d501d84f1f7c"
    $envVars += "-e", "AZURE_CLIENT_SECRET=$ClientSecret"
    $envVars += "-e", "AZURE_TENANT_ID=1c30d7a8-9627-4b0c-b799-12bae25a849b"
    Write-Host "Container will use Service Principal authentication" -ForegroundColor Green
    Write-Host "   Client ID: 5ed62488-7c1f-42bf-b855-d501d84f1f7c" -ForegroundColor Gray
    Write-Host "   Tenant ID: 1c30d7a8-9627-4b0c-b799-12bae25a849b" -ForegroundColor Gray
} else {
    Write-Host "Container will attempt credential passthrough" -ForegroundColor Yellow
}

# Step 9/12: Add container-specific environment variables
Write-Host "#9/$totalSteps Set container environment variables" -ForegroundColor Yellow
$envVars += "-e", "ASPNETCORE_ENVIRONMENT=Container"
$envVars += "-e", "DOTNET_RUNNING_IN_CONTAINER=true"
$envVars += "-e", "ASPNETCORE_URLS=http://+:8080"

Write-Host ""
Write-Host "Environment Variables Set:" -ForegroundColor Cyan
Write-Host "   ASPNETCORE_ENVIRONMENT=Container" -ForegroundColor Gray
Write-Host "   DOTNET_RUNNING_IN_CONTAINER=true" -ForegroundColor Gray
Write-Host "   ASPNETCORE_URLS=http://+:8080" -ForegroundColor Gray

# Step 10/12: Stop any existing container
Write-Host "#10/$totalSteps Stop any existing container" -ForegroundColor Yellow
$existingContainer = docker ps -q -f name=meeting-summary-container
if ($existingContainer) {
    Write-Host "Stopping existing container..." -ForegroundColor Yellow
    docker stop meeting-summary-container | Out-Null
    docker rm meeting-summary-container | Out-Null
    Write-Host "Previous container stopped and removed" -ForegroundColor Green
} else {
    Write-Host "No existing container to stop" -ForegroundColor Gray
}

# Step 11/12: Prepare container launch
Write-Host "#11/$totalSteps Prepare container launch" -ForegroundColor Yellow
Write-Host "   Port: http://localhost:8080" -ForegroundColor Gray
Write-Host "   Environment: Container" -ForegroundColor Gray
Write-Host "   Key Vault: Enabled" -ForegroundColor Gray
Write-Host "   Database: Azure SQL (from Key Vault)" -ForegroundColor Gray

$dockerArgs = @(
    "run", "--rm", "-it",
    "--name", "meeting-summary-container",
    "-p", "8080:8080"
) + $envVars + @($imageName)

Write-Host ""
Write-Host "Docker Command:" -ForegroundColor Cyan
Write-Host "docker $($dockerArgs -join ' ')" -ForegroundColor Gray
Write-Host ""

# Step 12/12: Launch container in external terminal
Write-Host "#12/$totalSteps Launching container in external terminal..." -ForegroundColor Yellow
Write-Host "Opening new terminal window to display container output..." -ForegroundColor Cyan

# Create a temporary script file for the external terminal
$tempScript = [System.IO.Path]::GetTempFileName() + ".ps1"
$scriptContent = @"
# Container startup script - generated automatically
Write-Host "Meeting Summarizer Container - External Terminal" -ForegroundColor Cyan
Write-Host "===============================================" -ForegroundColor Cyan
Write-Host "Container starting with Azure database connection..." -ForegroundColor Green
Write-Host ""

# Run the container
docker $($dockerArgs -join ' ')

Write-Host ""
Write-Host "Container stopped. Press any key to close this window..." -ForegroundColor Yellow
`$null = `$Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

# Cleanup temp script
Remove-Item "$tempScript" -ErrorAction SilentlyContinue
"@

$scriptContent | Out-File -FilePath $tempScript -Encoding UTF8

# Launch external terminal
try {
    Start-Process powershell -ArgumentList "-NoExit", "-ExecutionPolicy", "Bypass", "-File", $tempScript -WindowStyle Normal
    Write-Host ""
    Write-Host "Container launched in external terminal window." -ForegroundColor Green
    Write-Host "Check the new terminal window for container output and logs." -ForegroundColor Cyan
} catch {
    Write-Host ""
    Write-Host "Failed to launch external terminal. Running container in current terminal:" -ForegroundColor Yellow
    Write-Host $_.Exception.Message -ForegroundColor Red
    Write-Host ""
    # Fallback to current terminal
    & $tempScript
}
Write-Host ""
Write-Host "Container Info:" -ForegroundColor Yellow
Write-Host "   • URL: http://localhost:8080" -ForegroundColor Gray
Write-Host "   • Name: meeting-summary-container" -ForegroundColor Gray
Write-Host "   • Environment: Container (Azure database)" -ForegroundColor Gray
Write-Host "   • Authentication: Service Principal + Key Vault" -ForegroundColor Gray
Write-Host ""
Write-Host "To stop the container manually: docker stop meeting-summary-container" -ForegroundColor Gray