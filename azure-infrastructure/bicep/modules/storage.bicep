// Storage Account Bicep module

@description('Name of the storage account')
param storageAccountName string

@description('Location for the storage account')
param location string = resourceGroup().location

@description('Environment (dev, staging, prod)')
param environment string

@description('Storage account SKU')
param skuName string = environment == 'prod' ? 'Standard_GRS' : 'Standard_LRS'

@description('Access tier for the storage account')
param accessTier string = 'Hot'

resource storageAccount 'Microsoft.Storage/storageAccounts@2023-04-01' = {
  name: storageAccountName
  location: location
  sku: {
    name: skuName
  }
  kind: 'StorageV2'
  properties: {
    accessTier: accessTier
    allowBlobPublicAccess: false
    allowSharedKeyAccess: true
    minimumTlsVersion: 'TLS1_2'
    supportsHttpsTrafficOnly: true
    networkAcls: environment == 'prod' ? {
      bypass: 'AzureServices'
      defaultAction: 'Deny'
    } : {
      bypass: 'AzureServices'
      defaultAction: 'Allow'
    }
    encryption: {
      services: {
        blob: {
          enabled: true
          keyType: 'Account'
        }
        file: {
          enabled: true
          keyType: 'Account'
        }
      }
      keySource: 'Microsoft.Storage'
    }
  }
  tags: {
    Environment: environment
    Application: 'MeetingSummary'
  }
}

// Blob service configuration
resource blobService 'Microsoft.Storage/storageAccounts/blobServices@2023-04-01' = {
  parent: storageAccount
  name: 'default'
  properties: {
    cors: {
      corsRules: [
        {
          allowedOrigins: environment == 'dev' ? [
            'http://localhost:3000'
            'http://localhost:5173'
            'http://localhost:5174'
          ] : environment == 'staging' ? [
            'https://dev.meetingsummary.io'
            'https://meetingsummary-staging-web.azurestaticapps.net'
          ] : [
            'https://meetingsummary.io'
            'https://app.meetingsummary.io'
            'https://meetingsummary-prod-web.azurestaticapps.net'
          ]
          allowedMethods: [
            'GET'
            'POST'
            'PUT'
            'DELETE'
            'OPTIONS'
          ]
          allowedHeaders: [
            '*'
          ]
          exposedHeaders: [
            '*'
          ]
          maxAgeInSeconds: 3600
        }
      ]
    }
    deleteRetentionPolicy: {
      enabled: true
      days: environment == 'prod' ? 30 : 7
    }
    containerDeleteRetentionPolicy: {
      enabled: true
      days: environment == 'prod' ? 30 : 7
    }
  }
}

// Container for audio files
resource audioContainer 'Microsoft.Storage/storageAccounts/blobServices/containers@2023-04-01' = {
  parent: blobService
  name: 'audio-files'
  properties: {
    publicAccess: 'None'
    metadata: {
      description: 'Container for uploaded audio files'
    }
  }
}

// Container for user data (will contain per-user subcontainers)
resource userDataContainer 'Microsoft.Storage/storageAccounts/blobServices/containers@2023-04-01' = {
  parent: blobService
  name: 'user-data'
  properties: {
    publicAccess: 'None'
    metadata: {
      description: 'Container for user-specific data and meeting artifacts'
    }
  }
}

// Lifecycle management for cost optimization
resource lifecyclePolicy 'Microsoft.Storage/storageAccounts/managementPolicies@2023-04-01' = {
  parent: storageAccount
  name: 'default'
  properties: {
    policy: {
      rules: [
        {
          name: 'AudioFilesTierManagement'
          enabled: true
          type: 'Lifecycle'
          definition: {
            filters: {
              blobTypes: [
                'blockBlob'
              ]
              prefixMatch: [
                'audio-files/'
              ]
            }
            actions: {
              baseBlob: {
                tierToCool: {
                  daysAfterModificationGreaterThan: environment == 'dev' ? 7 : 30
                }
                tierToArchive: {
                  daysAfterModificationGreaterThan: environment == 'dev' ? 30 : 180
                }
                delete: {
                  daysAfterModificationGreaterThan: 365 // GDPR compliance
                }
              }
              snapshot: {
                delete: {
                  daysAfterCreationGreaterThan: 30
                }
              }
            }
          }
        }
        {
          name: 'UserDataManagement'
          enabled: true
          type: 'Lifecycle'
          definition: {
            filters: {
              blobTypes: [
                'blockBlob'
              ]
              prefixMatch: [
                'user-data/'
              ]
            }
            actions: {
              baseBlob: {
                tierToCool: {
                  daysAfterModificationGreaterThan: environment == 'dev' ? 7 : 30
                }
                tierToArchive: {
                  daysAfterModificationGreaterThan: environment == 'dev' ? 30 : 180
                }
                delete: {
                  daysAfterModificationGreaterThan: 365 // GDPR compliance
                }
              }
            }
          }
        }
      ]
    }
  }
}

output storageAccountName string = storageAccount.name
output storageAccountId string = storageAccount.id
output connectionString string = 'DefaultEndpointsProtocol=https;AccountName=${storageAccount.name};AccountKey=${storageAccount.listKeys().keys[0].value};EndpointSuffix=${environment().suffixes.storage}'
output primaryEndpoint string = storageAccount.properties.primaryEndpoints.blob
