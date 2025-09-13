# Update Azure SQL Server Firewall Rules using Azure CLI
# This script adds the current public IP address to the Azure SQL Server firewall

param(
    [Parameter(Mandatory=$false)]
    [string]$ResourceGroup = "rg-meetingsummary-dev",
    
    [Parameter(Mandatory=$false)]
    [string]$SqlServer = "meetingsummary-dev-sql"
)

Write-Host "Azure SQL Firewall Update Script (CLI)" -ForegroundColor Green
Write-Host "=======================================" -ForegroundColor Green

# Check if Azure CLI is available
try {
    $azVersion = az --version 2>$null
    if (!$azVersion) {
        throw "Azure CLI not found"
    }
    Write-Host "Azure CLI found" -ForegroundColor Green
} catch {
    Write-Host "Azure CLI not found. Please install it from https://docs.microsoft.com/en-us/cli/azure/install-azure-cli" -ForegroundColor Red
    exit 1
}

# Check if logged into Azure
Write-Host "Checking Azure login status..." -ForegroundColor Yellow
try {
    $account = az account show --output json 2>$null | ConvertFrom-Json
    if (!$account) {
        Write-Host "Not logged into Azure. Please run: az login" -ForegroundColor Red
        exit 1
    }
    Write-Host "Logged in as: $($account.user.name)" -ForegroundColor Green
} catch {
    Write-Host "Not logged into Azure. Please run: az login" -ForegroundColor Red
    exit 1
}

# Get current public IP address
try {
    Write-Host "Getting current public IP address..." -ForegroundColor Yellow
    $currentIP = (Invoke-RestMethod -Uri "https://api.ipify.org").Trim()
    Write-Host "Current IP: $currentIP" -ForegroundColor Cyan
} catch {
    Write-Host "Failed to get current IP address" -ForegroundColor Red
    exit 1
}

# Create firewall rule name with timestamp
$timestamp = Get-Date -Format "yyyyMMdd-HHmm"
$ipForName = $currentIP.Replace(".", "-")
$ruleName = "LocalDev-$timestamp-$ipForName"

try {
    Write-Host "Adding firewall rule..." -ForegroundColor Yellow
    Write-Host "Resource Group: $ResourceGroup" -ForegroundColor Gray
    Write-Host "SQL Server: $SqlServer" -ForegroundColor Gray
    Write-Host "Rule Name: $ruleName" -ForegroundColor Gray
    Write-Host "IP Address: $currentIP" -ForegroundColor Gray
    
    # Add firewall rule using Azure CLI
    $result = az sql server firewall-rule create `
        --resource-group $ResourceGroup `
        --server $SqlServer `
        --name $ruleName `
        --start-ip-address $currentIP `
        --end-ip-address $currentIP `
        --output json 2>&1
    
    if ($LASTEXITCODE -eq 0) {
        $ruleInfo = $result | ConvertFrom-Json
        Write-Host "Firewall rule created successfully!" -ForegroundColor Green
        Write-Host "Rule Details:" -ForegroundColor Cyan
        Write-Host "Name: $($ruleInfo.name)" -ForegroundColor White
        Write-Host "Start IP: $($ruleInfo.startIpAddress)" -ForegroundColor White
        Write-Host "End IP: $($ruleInfo.endIpAddress)" -ForegroundColor White
    } else {
        throw "Azure CLI command failed: $result"
    }
    
} catch {
    Write-Host "Failed to create firewall rule: $($_.Exception.Message)" -ForegroundColor Red
    
    # Show existing firewall rules for debugging
    Write-Host "Existing firewall rules:" -ForegroundColor Yellow
    try {
        $existingRules = az sql server firewall-rule list --resource-group $ResourceGroup --server $SqlServer --output json | ConvertFrom-Json
        $existingRules | ForEach-Object {
            Write-Host "- $($_.name): $($_.startIpAddress) - $($_.endIpAddress)" -ForegroundColor Gray
        }
    } catch {
        Write-Host "Could not retrieve existing rules" -ForegroundColor Red
    }
    
    exit 1
}

Write-Host ""
Write-Host "Firewall update completed! You should now be able to connect to the database." -ForegroundColor Green
Write-Host "Tip: Restart your API server to test the connection." -ForegroundColor Cyan