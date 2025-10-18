# PowerShell Scripts

This folder contains all PowerShell scripts for the Meeting-Summary.io project.

## Development Environment Scripts

### Environment Management
- **`start-local.ps1`** - Starts the Local 2-Server development environment (API + Frontend in separate terminals)
- **`start-dev.ps1`** - Starts the development environment 
- **`start-container.ps1`** - Starts the local containerized development environment with Azure Key Vault access (use `-Build` to rebuild image)

### Configuration Scripts
- **`setup-azure.ps1`** - Sets up Azure resources and configuration
- **`setup-openai.ps1`** - Configures OpenAI API settings
- **`set-container-env.ps1`** - Sets environment variables for container deployment

## Database & User Management Scripts

### User Management
- **`delete-user.ps1`** - Deletes a user from the database
- **`delete-user-fixed.ps1`** - Fixed version of user deletion script
- **`delete-user-fixed-final.ps1`** - Final fixed version of user deletion script
- **`update-user-tokens.ps1`** - Updates user token balance in the database
- **`update-sql-firewall-cli.ps1`** - Updates SQL firewall rules via CLI

### Invitation Management
- **`create-test-invitation.ps1`** - Creates test invitation codes for user registration
- **`create-test-invitation-vscode.ps1`** - VS Code-friendly version of invitation code creator
- **`create-test-invitation-simple.ps1`** - Simplified invitation code creator

## Infrastructure Scripts

### Azure Infrastructure
- **`setup-terraform-backend.ps1`** - Sets up Terraform backend for infrastructure as code
- **`cleanup-azure-resources.ps1`** - Cleans up Azure resources
- **`purge-cognitive-services.ps1`** - Purges Azure Cognitive Services resources

## Usage Examples

### Start Local Development
```powershell
# Environment 1: Local 2-Server Development
.\scripts\start-local.ps1

# Environment 2: Local Docker Container  
# Ensure you're logged into Azure CLI first
az login
.\scripts\start-container.ps1 -Build
```

### Create Test Data
```powershell
# Create invitation code
.\scripts\create-test-invitation.ps1 -Email "user@example.com"

# Update user tokens
.\scripts\update-user-tokens.ps1 -UserId "guid-here" -Tokens 1000
```

### Clean Up
```powershell
# Delete test user
.\scripts\delete-user-fixed-final.ps1 "user@example.com"
```

## Security Notes

- Scripts that contain sensitive operations require appropriate permissions
- Database scripts connect to development databases only
- Always review scripts before execution in production environments
- Some scripts require Azure CLI authentication

## Container Authentication

The `start-container.ps1` script uses **Azure CLI credential passthrough** for secure Key Vault access:

### Recommended Setup (Most Secure):
```powershell
# 1. Login to Azure CLI (one time per session)
az login

# 2. Run container script - it will automatically use your Azure CLI credentials
.\scripts\start-container.ps1 -Build
```

### Alternative: Environment Variable
```powershell
# Set environment variable (one time per session)
$env:AZURE_CLIENT_SECRET_CONTAINER = "your-service-principal-secret"

# Then run container
.\scripts\start-container.ps1 -Build
```

### How it Works:
- Container attempts to use your existing Azure CLI authentication
- Falls back to Service Principal if Azure CLI credentials unavailable
- No secrets hardcoded in files or committed to source control

## Script Dependencies

- **Azure CLI** - Required for Azure-related scripts and container authentication
- **SQL Server cmdlets** - Required for database scripts (or use VS Code MSSQL extension)
- **.NET SDK** - Required for application-related scripts
- **Docker** - Required for container scripts