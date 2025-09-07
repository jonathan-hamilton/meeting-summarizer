# Terraform deployment script for Meeting Summary infrastructure (PowerShell)

Write-Host "=== Meeting Summary Infrastructure Deployment ===" -ForegroundColor Green

# Check if required tools are installed
$terraformVersion = & terraform version 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "Error: Terraform is required but not installed." -ForegroundColor Red
    exit 1
}

$azVersion = & az version 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "Error: Azure CLI is required but not installed." -ForegroundColor Red
    exit 1
}

# Check if terraform.tfvars exists
if (-not (Test-Path "terraform.tfvars")) {
    Write-Host "Error: terraform.tfvars file not found." -ForegroundColor Red
    Write-Host "Please copy terraform.tfvars.example to terraform.tfvars and fill in your values."
    exit 1
}

# Check Azure CLI login status
Write-Host "Checking Azure CLI authentication..." -ForegroundColor Yellow
try {
    $subscription = & az account show --query name -o tsv 2>$null
    if ($LASTEXITCODE -ne 0) {
        throw "Not logged in"
    }
    Write-Host "Using Azure subscription: $subscription" -ForegroundColor Green
} catch {
    Write-Host "Error: Not logged into Azure. Please run 'az login' first." -ForegroundColor Red
    exit 1
}

# Initialize Terraform
Write-Host "Initializing Terraform..." -ForegroundColor Yellow
& terraform init
if ($LASTEXITCODE -ne 0) {
    Write-Host "Error: Terraform initialization failed." -ForegroundColor Red
    exit 1
}

# Validate configuration
Write-Host "Validating Terraform configuration..." -ForegroundColor Yellow
& terraform validate
if ($LASTEXITCODE -ne 0) {
    Write-Host "Error: Terraform configuration validation failed." -ForegroundColor Red
    exit 1
}

# Plan deployment
Write-Host "Creating deployment plan..." -ForegroundColor Yellow
& terraform plan -out=tfplan
if ($LASTEXITCODE -ne 0) {
    Write-Host "Error: Terraform planning failed." -ForegroundColor Red
    exit 1
}

# Confirm deployment
$confirmation = Read-Host "Do you want to apply this plan? (y/N)"
if ($confirmation -eq 'y' -or $confirmation -eq 'Y') {
    Write-Host "Applying Terraform configuration..." -ForegroundColor Yellow
    & terraform apply tfplan
    if ($LASTEXITCODE -eq 0) {
        Write-Host "=== Deployment Complete ===" -ForegroundColor Green
        Write-Host "Run 'terraform output' to see the deployed resources." -ForegroundColor Cyan
    } else {
        Write-Host "Error: Terraform apply failed." -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "Deployment cancelled." -ForegroundColor Yellow
    Remove-Item -Path "tfplan" -ErrorAction SilentlyContinue
}
