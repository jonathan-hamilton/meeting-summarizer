# Azure Development Environment - Connection Strings

The Azure infrastructure has been successfully deployed to support local development. All configuration values are stored in Azure Key Vault for security.

## Azure Resources Created
- **Resource Group**: `rg-meetingsummary-dev`
- **Location**: West US
- **Environment**: Development

## Key Vault Configuration
- **Key Vault**: `msio-dev-v2-kv`
- **URI**: `https://msio-dev-v2-kv.vault.azure.net/`
- **Authentication**: Service Principal (Application ID: `REDACTED_SP_CLIENT_ID`)

## Database
- **Server**: `meetingsummary-dev-v2-sql.database.windows.net`
- **Database**: `meetingsummary-dev-v2-db`
- **Authentication**: Azure Active Directory Service Principal (secure, no passwords in config)
- **Key Vault Secret**: `DatabaseConnectionString-Dev`

## Storage Account
- **Account Name**: `msdev10122104`
- **Key Vault Secret**: `AzureStorage--ConnectionString`
- **Containers**: `audio-files`, `transcripts`, `summaries`, `user-data`

## Azure Cognitive Services (Speech)
- **Service Name**: `meetingsummary-dev-v2-speech`
- **Endpoint**: `https://meetingsummary-dev-v2-speech.cognitiveservices.azure.com/`
- **Key Vault Secrets**: 
  - `AzureSpeechServices--Endpoint`
  - `AzureSpeechServices--Key`

## Container Apps
- **Container App**: `dev-api-v2`
- **URL**: `https://dev-api-v2--0000010.niceocean-bec322d9.westus.azurecontainerapps.io`
- **Container Registry**: `msiodevacr.azurecr.io`

## Configuration for .NET API

Your `appsettings.Development.json` is already correctly configured to use Key Vault:

```json
{
  "KeyVault": {
    "Enabled": true,
    "VaultUri": "https://msio-dev-v2-kv.vault.azure.net/",
    "ClientId": "REDACTED_SP_CLIENT_ID",
    "TenantId": "REDACTED_TENANT_ID"
  },
  "Database": {
    "UseKeyVault": true,
    "KeyVaultSecretName": "DatabaseConnectionString-Dev"
  },
  "AzureStorage": {
    "UseKeyVault": true,
    "KeyVaultSecretName": "AzureStorage--ConnectionString"
  }
}
```

## Key Vault Secrets Reference

All sensitive configuration is stored in Key Vault:

- `DatabaseConnectionString-Dev` - Database connection with Service Principal auth
- `AzureStorage--ConnectionString` - Storage account connection
- `AzureSpeechServices--Endpoint` - Speech service endpoint  
- `AzureSpeechServices--Key` - Speech service API key
- `JWT--SecretKey` - JWT token signing key
- `OpenAI--ApiKey` - OpenAI API key
- `SendGrid--ApiKey` - SendGrid email service key
- `Stripe--PublishableKey` - Stripe payment key (public)
- `Stripe--SecretKey` - Stripe payment key (secret)
- `Stripe--WebhookSecret` - Stripe webhook validation key

## Security Notes

- **No hardcoded secrets** - All sensitive data is in Key Vault
- **Service Principal authentication** - More secure than SQL auth
- **RBAC permissions** - Fine-grained access control
- **Automatic rotation** - Key Vault supports secret rotation

## Deployment Pipeline

The GitHub Actions workflow now uses the correct configuration:
- Database connection via Service Principal (more secure)
- All secrets pulled from GitHub repository secrets
- No connection string mismatches

## For Local Development

Your application will automatically:
1. Authenticate to Key Vault using the Service Principal
2. Pull all configuration secrets at startup
3. Use secure Azure AD authentication for database access
4. No local secrets needed in your config files

## Next Steps
1. Update your .NET API configuration with these connection strings
2. Run Entity Framework migrations against the Azure database
3. Test API functionality with Azure storage for file uploads
4. Deploy the API to the Azure App Service when ready

## Resource Cleanup
To clean up all resources when no longer needed:
```bash
az group delete --name rg-meetingsummary-dev --yes --no-wait
```
