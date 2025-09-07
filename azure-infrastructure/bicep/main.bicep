// Main Bicep template for Meeting Summary application infrastructure
// This template orchestrates all the required Azure resources for the application

@description('Environment name (dev, staging, prod)')
@allowed(['dev', 'staging', 'prod'])
param environment string

@description('Location for all resources')
param location string = resourceGroup().location

@description('Application name prefix')
param appName string = 'meetingsummary'

@description('SQL Administrator login')
@secure()
param sqlAdminLogin string

@description('SQL Administrator password')
@secure()
param sqlAdminPassword string

@description('OpenAI API Key')
@secure()
param openAiApiKey string = ''

@description('SendGrid API Key')
@secure()
param sendGridApiKey string = ''

// Variables for resource naming
var resourceSuffix = '${appName}-${environment}'
var storageAccountName = '${appName}${environment}'

// Key Vault Module
module keyVault 'modules/key-vault.bicep' = {
  name: 'keyVault'
  params: {
    keyVaultName: '${resourceSuffix}-kv'
    location: location
    environment: environment
  }
}

// Storage Account Module
module storage 'modules/storage.bicep' = {
  name: 'storage'
  params: {
    storageAccountName: storageAccountName
    location: location
    environment: environment
  }
}

// SQL Database Module
module sqlDatabase 'modules/sql-database.bicep' = {
  name: 'sqlDatabase'
  params: {
    sqlServerName: '${resourceSuffix}-sql'
    databaseName: '${resourceSuffix}-db'
    location: location
    environment: environment
    administratorLogin: sqlAdminLogin
    administratorLoginPassword: sqlAdminPassword
  }
}

// App Service Module
module appService 'modules/app-service.bicep' = {
  name: 'appService'
  params: {
    appServiceName: '${resourceSuffix}-api'
    location: location
    environment: environment
    keyVaultName: keyVault.outputs.keyVaultName
    sqlConnectionString: sqlDatabase.outputs.connectionString
    storageConnectionString: storage.outputs.connectionString
  }
}

// Cognitive Services Module
module cognitiveServices 'modules/cognitive-services.bicep' = {
  name: 'cognitiveServices'
  params: {
    speechServiceName: '${resourceSuffix}-speech'
    location: location
    environment: environment
  }
}

// Store secrets in Key Vault
resource openAiSecret 'Microsoft.KeyVault/vaults/secrets@2023-07-01' = if (!empty(openAiApiKey)) {
  name: '${keyVault.outputs.keyVaultName}/OpenAIApiKey-${environment == 'dev' ? 'Dev' : environment == 'staging' ? 'Staging' : 'Prod'}'
  properties: {
    value: openAiApiKey
  }
  dependsOn: [keyVault]
}

resource sendGridSecret 'Microsoft.KeyVault/vaults/secrets@2023-07-01' = if (!empty(sendGridApiKey)) {
  name: '${keyVault.outputs.keyVaultName}/SendGridApiKey-${environment == 'dev' ? 'Dev' : environment == 'staging' ? 'Staging' : 'Prod'}'
  properties: {
    value: sendGridApiKey
  }
  dependsOn: [keyVault]
}

resource storageSecret 'Microsoft.KeyVault/vaults/secrets@2023-07-01' = {
  name: '${keyVault.outputs.keyVaultName}/AzureStorageConnectionString-${environment == 'dev' ? 'Dev' : environment == 'staging' ? 'Staging' : 'Prod'}'
  properties: {
    value: storage.outputs.connectionString
  }
  dependsOn: [keyVault, storage]
}

resource databaseSecret 'Microsoft.KeyVault/vaults/secrets@2023-07-01' = {
  name: '${keyVault.outputs.keyVaultName}/DatabaseConnectionString-${environment == 'dev' ? 'Dev' : environment == 'staging' ? 'Staging' : 'Prod'}'
  properties: {
    value: sqlDatabase.outputs.connectionString
  }
  dependsOn: [keyVault, sqlDatabase]
}

resource speechSecret 'Microsoft.KeyVault/vaults/secrets@2023-07-01' = {
  name: '${keyVault.outputs.keyVaultName}/AzureSpeechKey-${environment == 'dev' ? 'Dev' : environment == 'staging' ? 'Staging' : 'Prod'}'
  properties: {
    value: cognitiveServices.outputs.speechKey
  }
  dependsOn: [keyVault, cognitiveServices]
}

// Outputs
output resourceGroupName string = resourceGroup().name
output keyVaultName string = keyVault.outputs.keyVaultName
output appServiceName string = appService.outputs.appServiceName
output storageAccountName string = storage.outputs.storageAccountName
output sqlServerName string = sqlDatabase.outputs.sqlServerName
output databaseName string = sqlDatabase.outputs.databaseName
output speechServiceName string = cognitiveServices.outputs.speechServiceName
output appServiceUrl string = appService.outputs.appServiceUrl
