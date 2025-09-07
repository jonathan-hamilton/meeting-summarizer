// Key Vault Bicep module

@description('Name of the Key Vault')
param keyVaultName string

@description('Location for the Key Vault')
param location string = resourceGroup().location

@description('Environment (dev, staging, prod)')
param environment string

@description('SKU for the Key Vault')
param skuName string = environment == 'prod' ? 'standard' : 'standard'

@description('Enable soft delete')
param enableSoftDelete bool = true

@description('Soft delete retention days')
param softDeleteRetentionInDays int = environment == 'prod' ? 90 : 7

resource keyVault 'Microsoft.KeyVault/vaults@2023-07-01' = {
  name: keyVaultName
  location: location
  properties: {
    sku: {
      family: 'A'
      name: skuName
    }
    tenantId: tenant().tenantId
    enableSoftDelete: enableSoftDelete
    softDeleteRetentionInDays: softDeleteRetentionInDays
    enableRbacAuthorization: true
    enabledForDeployment: false
    enabledForTemplateDeployment: true
    enabledForDiskEncryption: false
    publicNetworkAccess: environment == 'prod' ? 'Disabled' : 'Enabled'
    networkAcls: environment == 'prod' ? {
      bypass: 'AzureServices'
      defaultAction: 'Deny'
    } : {
      bypass: 'AzureServices'
      defaultAction: 'Allow'
    }
  }
  tags: {
    Environment: environment
    Application: 'MeetingSummary'
  }
}

// Grant current user access to manage secrets during deployment
resource currentUserSecretAccess 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  name: guid(keyVault.id, 'currentUser', 'KeyVaultSecretsOfficer')
  scope: keyVault
  properties: {
    roleDefinitionId: subscriptionResourceId('Microsoft.Authorization/roleDefinitions', 'b86a8fe4-44ce-4948-aee5-eccb2c155cd7') // Key Vault Secrets Officer
    principalId: 'PLACEHOLDER_FOR_CURRENT_USER_OBJECT_ID' // This should be replaced during deployment
    principalType: 'User'
  }
}

output keyVaultName string = keyVault.name
output keyVaultId string = keyVault.id
output keyVaultUri string = keyVault.properties.vaultUri
