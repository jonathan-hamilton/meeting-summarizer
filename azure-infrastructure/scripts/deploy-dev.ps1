# Deploy Development Environment for Meeting Summary App
# This script creates all necessary Azure resources for the development environment

param(
    [Parameter(Mandatory=$false)]
    [string]$SubscriptionId = "",
    
    [Parameter(Mandatory=$false)]
    [string]$ResourceGroupName = "rg-meetingsummary-dev",
    
    [Parameter(Mandatory=$false)]
    [string]$Location = "East US",
    
    [Parameter(Mandatory=$true)]
    [string]$SqlAdminPassword
)

# Set error action preference
$ErrorActionPreference = "Stop"

Write-Host "🚀 Starting deployment of Meeting Summary Development Environment" -ForegroundColor Green
Write-Host "📍 Location: $Location" -ForegroundColor Yellow
Write-Host "📦 Resource Group: $ResourceGroupName" -ForegroundColor Yellow

# Login to Azure if not already logged in
try {
    $context = Get-AzContext
    if (!$context) {
        Write-Host "🔐 Please log in to Azure..." -ForegroundColor Yellow
        Connect-AzAccount
    }
} catch {
    Write-Host "🔐 Please log in to Azure..." -ForegroundColor Yellow
    Connect-AzAccount
}

# Set subscription if provided
if ($SubscriptionId) {
    Write-Host "🎯 Setting subscription to: $SubscriptionId" -ForegroundColor Yellow
    Set-AzContext -SubscriptionId $SubscriptionId
}

# Get current subscription
$subscription = Get-AzContext
Write-Host "✅ Using subscription: $($subscription.Subscription.Name) ($($subscription.Subscription.Id))" -ForegroundColor Green

# Create resource group if it doesn't exist
Write-Host "🏗️  Creating resource group: $ResourceGroupName" -ForegroundColor Yellow
try {
    $resourceGroup = Get-AzResourceGroup -Name $ResourceGroupName -ErrorAction SilentlyContinue
    if (!$resourceGroup) {
        $resourceGroup = New-AzResourceGroup -Name $ResourceGroupName -Location $Location
        Write-Host "✅ Created resource group: $($resourceGroup.ResourceGroupName)" -ForegroundColor Green
    } else {
        Write-Host "ℹ️  Resource group already exists: $($resourceGroup.ResourceGroupName)" -ForegroundColor Blue
    }
} catch {
    Write-Error "❌ Failed to create resource group: $($_.Exception.Message)"
    exit 1
}

# Get current user for Key Vault permissions
Write-Host "👤 Getting current user information for Key Vault access..." -ForegroundColor Yellow
try {
    $currentUser = Get-AzADUser -SignedIn
    $currentUserObjectId = $currentUser.Id
    Write-Host "✅ Current user: $($currentUser.DisplayName) ($currentUserObjectId)" -ForegroundColor Green
} catch {
    Write-Warning "⚠️  Could not get current user. Key Vault access may need manual configuration."
    $currentUserObjectId = "PLACEHOLDER"
}

# Prepare deployment parameters
$deploymentName = "meetingsummary-dev-$(Get-Date -Format 'yyyyMMdd-HHmmss')"
$bicepFile = Join-Path $PSScriptRoot "../bicep/main.bicep"

Write-Host "🔧 Preparing deployment parameters..." -ForegroundColor Yellow
$parameters = @{
    environment = "dev"
    location = $Location
    appName = "meetingsummary"
    sqlAdminLogin = "meetingsummaryadmin"
    sqlAdminPassword = $SqlAdminPassword | ConvertTo-SecureString -AsPlainText -Force
}

Write-Host "🚀 Starting Bicep deployment: $deploymentName" -ForegroundColor Green
Write-Host "📄 Template: $bicepFile" -ForegroundColor Yellow

try {
    # Deploy the Bicep template
    $deployment = New-AzResourceGroupDeployment `
        -ResourceGroupName $ResourceGroupName `
        -Name $deploymentName `
        -TemplateFile $bicepFile `
        -TemplateParameterObject $parameters `
        -Verbose

    if ($deployment.ProvisioningState -eq "Succeeded") {
        Write-Host "✅ Deployment completed successfully!" -ForegroundColor Green
        
        # Display deployment outputs
        Write-Host "`n📋 Deployment Outputs:" -ForegroundColor Cyan
        Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
        
        if ($deployment.Outputs) {
            foreach ($output in $deployment.Outputs.GetEnumerator()) {
                Write-Host "🔹 $($output.Key): $($output.Value.Value)" -ForegroundColor White
            }
        }
        
        Write-Host "`n🔑 Next Steps:" -ForegroundColor Cyan
        Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
        Write-Host "1. Configure Key Vault secrets (run setup-secrets.ps1)" -ForegroundColor Yellow
        Write-Host "2. Update appsettings.Staging.json with the Key Vault URI" -ForegroundColor Yellow
        Write-Host "3. Deploy your application to the App Service" -ForegroundColor Yellow
        Write-Host "4. Configure custom domain (optional)" -ForegroundColor Yellow
        
    } else {
        Write-Error "❌ Deployment failed with state: $($deployment.ProvisioningState)"
        exit 1
    }
    
} catch {
    Write-Error "❌ Deployment failed: $($_.Exception.Message)"
    Write-Host "🔍 Check the Azure portal for detailed error information" -ForegroundColor Yellow
    exit 1
}

Write-Host "`n🎉 Development environment deployment completed!" -ForegroundColor Green
Write-Host "🌐 You can now access the Azure resources in the portal:" -ForegroundColor Cyan
Write-Host "   https://portal.azure.com/#@/resource/subscriptions/$($subscription.Subscription.Id)/resourceGroups/$ResourceGroupName" -ForegroundColor Blue
