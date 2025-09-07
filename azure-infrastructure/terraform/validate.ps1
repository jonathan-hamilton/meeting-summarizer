# Terraform validation script

Write-Host "=== Terraform Configuration Validation ===" -ForegroundColor Green

# Check if we're in the right directory
if (-not (Test-Path "main.tf")) {
    Write-Host "Error: main.tf not found. Please run this script from the terraform directory." -ForegroundColor Red
    exit 1
}

# Check all module directories exist
$requiredModules = @("app-service", "cognitive-services", "key-vault", "sql-database", "storage")

foreach ($module in $requiredModules) {
    $modulePath = "modules\$module"
    if (-not (Test-Path $modulePath)) {
        Write-Host "Error: Module directory '$modulePath' not found." -ForegroundColor Red
        exit 1
    }
    
    $mainTf = "$modulePath\main.tf"
    if (-not (Test-Path $mainTf)) {
        Write-Host "Error: Module main.tf not found at '$mainTf'." -ForegroundColor Red
        exit 1
    }
    
    Write-Host "✓ Module $module found" -ForegroundColor Green
}

# Run terraform validate
Write-Host "`nValidating Terraform syntax..." -ForegroundColor Yellow
& terraform init -backend=false
if ($LASTEXITCODE -eq 0) {
    & terraform validate
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ Terraform configuration is valid!" -ForegroundColor Green
    } else {
        Write-Host "✗ Terraform validation failed!" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "✗ Terraform initialization failed!" -ForegroundColor Red
    exit 1
}

Write-Host "`n=== Validation Complete ===" -ForegroundColor Green
