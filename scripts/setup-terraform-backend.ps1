# Setup Terraform Backend Storage
# Run this ONCE to create the storage account for Terraform state

Write-Host "Setting up Terraform backend storage..." -ForegroundColor Green

$resourceGroupName = "rg-terraform-state"
$storageAccountName = "tfstatemeetingsummary"  # Must be globally unique
$containerName = "tfstate"
$location = "westus"

# Create resource group for Terraform state
Write-Host "Creating resource group: $resourceGroupName" -ForegroundColor Yellow
az group create --name $resourceGroupName --location $location

# Create storage account for Terraform state
Write-Host "Creating storage account: $storageAccountName" -ForegroundColor Yellow
az storage account create `
    --resource-group $resourceGroupName `
    --name $storageAccountName `
    --sku Standard_LRS `
    --encryption-services blob

# Get storage account key
$accountKey = az storage account keys list --resource-group $resourceGroupName --account-name $storageAccountName --query '[0].value' -o tsv

# Create blob container for Terraform state
Write-Host "Creating blob container: $containerName" -ForegroundColor Yellow
az storage container create `
    --name $containerName `
    --account-name $storageAccountName `
    --account-key $accountKey

Write-Host "Backend storage setup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Backend configuration:" -ForegroundColor Cyan
Write-Host "  Resource Group: $resourceGroupName"
Write-Host "  Storage Account: $storageAccountName"
Write-Host "  Container: $containerName"
Write-Host ""
Write-Host "Add these GitHub secrets for the workflow:" -ForegroundColor Yellow
Write-Host "  ARM_ACCESS_KEY: $accountKey"