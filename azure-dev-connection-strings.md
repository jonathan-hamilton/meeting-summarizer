# Azure Development Environment - Connection Strings

The Azure infrastructure has been successfully deployed to support local development. Here are the connection strings and endpoints you need:

## Azure Resources Created
- **Resource Group**: `rg-meetingsummary-dev`
- **Location**: West US 2
- **Environment**: Development

## Database
- **Server**: `meetingsummary-dev-sql.database.windows.net`
- **Database**: `meetingsummary-dev-db`
- **Admin User**: `sqladmin`
- **Connection String**: 
```
Server=tcp:meetingsummary-dev-sql.database.windows.net,1433;Initial Catalog=meetingsummary-dev-db;Persist Security Info=False;User ID=sqladmin;Password=DevSecurePassword123!;MultipleActiveResultSets=False;Encrypt=true;TrustServerCertificate=False;Connection Timeout=30;
```

## Storage Account
- **Account Name**: `meetingsummarydev`
- **Connection String**:
```
DefaultEndpointsProtocol=https;EndpointSuffix=core.windows.net;AccountName=meetingsummarydev;AccountKey=0C2RZKYD4v9G+Rd3Nf6QKwIQ49DhQd2Np2dslXQDrTQnc+2vpKmNjkRuIvvWMtDMwBwr/GyU4mny+AStldgrwQ==;BlobEndpoint=https://meetingsummarydev.blob.core.windows.net/;FileEndpoint=https://meetingsummarydev.file.core.windows.net/;QueueEndpoint=https://meetingsummarydev.queue.core.windows.net/;TableEndpoint=https://meetingsummarydev.table.core.windows.net/
```
- **Containers**:
  - `audio-files`
  - `transcripts`
  - `summaries`
  - `user-data`

## Azure Cognitive Services (Speech)
- **Service Name**: `meetingsummary-dev-speech`
- **Endpoint**: `https://westus2.api.cognitive.microsoft.com/`
- **API Key**: `8421b6e0ce824ac9b688f871126f13ac`

## App Service (API Hosting)
- **Name**: `meetingsummary-dev-api`
- **URL**: `https://meetingsummary-dev-api.azurewebsites.net`
- **Plan**: Free Tier (F1)

## Key Vault
- **Name**: `meetingsummary-dev-kv`
- **URI**: `https://meetingsummary-dev-kv.vault.azure.net/`

## Configuration for .NET API

Update your `appsettings.Development.json` with:

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=tcp:meetingsummary-dev-sql.database.windows.net,1433;Initial Catalog=meetingsummary-dev-db;Persist Security Info=False;User ID=sqladmin;Password=DevSecurePassword123!;MultipleActiveResultSets=False;Encrypt=true;TrustServerCertificate=False;Connection Timeout=30;",
    "AzureStorage": "DefaultEndpointsProtocol=https;EndpointSuffix=core.windows.net;AccountName=meetingsummarydev;AccountKey=0C2RZKYD4v9G+Rd3Nf6QKwIQ49DhQd2Np2dslXQDrTQnc+2vpKmNjkRuIvvWMtDMwBwr/GyU4mny+AStldgrwQ=="
  },
  "Azure": {
    "SpeechService": {
      "Endpoint": "https://westus2.api.cognitive.microsoft.com/",
      "ApiKey": "8421b6e0ce824ac9b688f871126f13ac",
      "Region": "westus2"
    }
  }
}
```

## Security Notes
- These are development credentials only
- The SQL firewall is configured to allow Azure services
- Storage account allows public blob access for development
- Key Vault is configured for the current user

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
