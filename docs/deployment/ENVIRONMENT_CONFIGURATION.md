# Meeting-Summary.io Environment Configuration Reference

## Overview
This document describes the 4 deployment environments for Meeting-Summary.io and their security configurations.

## Security Principle
**NO real API keys, secrets, or credentials should be stored in any appsettings.json files that are committed to source control.**

---

## Environment 1: Local 2-Server Development
- **Configuration File**: `appsettings.Local.json`
- **Deployment**: Two separate processes (API + Frontend) running locally
- **Usage**: Developer runs API and Frontend in separate terminals
- **Security Model**: ✅ **SECURE** - Uses .NET User Secrets for all sensitive values with Program.cs integration
- **Key Characteristics**:
  - API runs on `http://localhost:5000` (or similar)
  - Frontend runs on `http://localhost:5173`
  - Direct database connection
  - No containerization

### Status: ✅ FIXED (October 18, 2025)
- ✅ All secrets migrated to .NET User Secrets
- ✅ Program.cs enhanced with User Secrets loading for Local environment  
- ✅ appsettings.Local.json cleaned of all hardcoded credentials

### Target Configuration:
```json
// appsettings.Local.json (safe version)
{
  "SendGrid": {
    "ApiKey": "",  // From user secrets
    "FromEmail": "jhamilton.swe@gmail.com",
    "FromName": "Meeting Summary"
  },
  "ConnectionStrings": {
    "DefaultConnection": ""  // From user secrets
  }
}
```

---

## Environment 2: Local Docker Container
- **Configuration File**: `appsettings.Container.json`
- **Deployment**: Single Docker container running locally via Docker Desktop
- **Usage**: `docker run` or `docker-compose` on developer machine
- **Security Model**: Azure Key Vault integration with service principal authentication
- **Key Characteristics**:
  - Container runs on `http://localhost:8080`
  - Service Principal authentication to Azure Key Vault
  - Containerized application matching Azure deployment

### Current Configuration Status:
```json
// appsettings.Container.json
{
  "SendGrid": {
    "UseKeyVault": true,
    "KeyVaultSecretName": "SendGrid--ApiKey",
    "ApiKey": "",
    "FromEmail": "jhamilton.swe@gmail.com",
    "FromName": "Meeting Summary"
  },
  "KeyVault": {
    "Enabled": true,
    "VaultUri": "https://msio-dev-v2-kv.vault.azure.net/",
    "UseManagedIdentity": false,
    "ClientId": "<SP_CLIENT_ID>",
    "ClientSecret": null,  // From environment variable
    "TenantId": "<AZURE_TENANT_ID>"
  }
}
```

**Status**: ✅ Correctly configured for Key Vault integration (Database secret name fixed: October 18, 2025)

---

## Environment 3: Azure Container Apps (Development)
- **Configuration File**: `appsettings.Development.json`
- **Deployment**: Azure Container Apps in `rg-meetingsummary-dev` resource group
- **Usage**: Live development environment accessible via Azure
- **Security Model**: 
  - **PRIMARY**: Container Apps environment secrets/managed identity
  - **FALLBACK**: Azure Key Vault with service principal
- **Key Characteristics**:
  - Deployed to `dev-api-v2` Container App
  - Public endpoint accessible
  - Managed identity preferred for Azure services

### Current Configuration Status:
```json
// appsettings.Development.json
{
  "SendGrid": {
    "ApiKey": "",  // Should be from env vars or Key Vault
    "FromEmail": "jhamilton.swe@gmail.com",
    "FromName": "Meeting Summary"
  },
  "KeyVault": {
    "Enabled": true,
    "VaultUri": "https://msio-dev-v2-kv.vault.azure.net/",
    "UseManagedIdentity": true,  // ✅ Fixed - Now using Managed Identity
    "ClientId": null,
    "ClientSecret": null,
    "TenantId": null
  }
}
```

**Status**: ✅ Fixed - Now properly configured for Managed Identity authentication (October 31, 2025)

---

## Environment 4: Production
- **Configuration File**: `appsettings.Production.json`
- **Deployment**: Not currently active
- **Security Model**: Managed Identity + Azure Key Vault
- **Key Characteristics**:
  - Should use different Key Vault (`meetingsummary-prod-kv`)
  - Different email domain (`support@meetingsummary.io`)
  - Managed Identity authentication
  - No test features enabled

### Current Configuration Status:
```json
// appsettings.Production.json
{
  "SendGrid": {
    "UseKeyVault": true,
    "KeyVaultSecretName": "SendGridApiKey-Prod",
    "ApiKey": "",
    "FromEmail": "support@meetingsummary.io",  // Needs SendGrid verification
    "FromName": "Meeting Summary"
  }
}
```

**Status**: ✅ Correctly configured (no real secrets), but email not verified with SendGrid

---

## Security Configuration Matrix

| Environment | Secrets Storage | Authentication Method | Email Address | Status |
|-------------|----------------|----------------------|---------------|--------|
| Local 2-Server | .NET User Secrets | N/A | `jhamilton.swe@gmail.com` | ✅ Fixed |
| Local Docker | Azure Key Vault | Service Principal | `jhamilton.swe@gmail.com` | ✅ Fixed |
| Azure Container Apps | Env Variables/Key Vault | Service Principal/Managed Identity | `jhamilton.swe@gmail.com` | ⚠️ Needs Check |
| Production | Azure Key Vault | Managed Identity | `support@meetingsummary.io` | ⚠️ Email Not Verified |

---

## Next Steps

1. ✅ **Local 2-Server**: Fixed - Secrets moved to .NET User Secrets (October 18, 2025)
2. ✅ **Local Docker**: Fixed - Key Vault integration verified and database secret name corrected (October 18, 2025)
3. 🔄 **Azure Container Apps**: Validate proper environment variable configuration and managed identity usage
4. 📋 **Production Prep**: Verify SendGrid email domain when needed

---

## Key Vault Secret Names Reference

| Service | Development Secret Name | Production Secret Name |
|---------|------------------------|------------------------|
| SendGrid | `SendGrid--ApiKey` | `SendGridApiKey-Prod` |
| Database | `DatabaseConnectionString-Dev` | `DatabaseConnectionString-Prod` |
| OpenAI | `OpenAI--ApiKey` | `OpenAI--ApiKey` |
| Stripe | `Stripe--SecretKey` | `Stripe--SecretKey` |
| Azure Storage | `AzureStorageConnectionString-Dev` | `AzureStorageConnectionString-Prod` |
