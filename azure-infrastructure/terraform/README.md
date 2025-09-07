# Meeting Summary Terraform Infrastructure

This directory contains Terraform configurations for deploying the Meeting Summary application infrastructure to Azure.

## Prerequisites

1. **Terraform** installed (>= 1.0)
2. **Azure CLI** installed and authenticated (`az login`)
3. **Resource Group** must exist before running Terraform

## Quick Start

1. **Create a resource group** (if it doesn't exist):
   ```bash
   az group create --name rg-meetingsummary-dev --location "East US"
   ```

2. **Copy the example variables file**:
   ```bash
   cp terraform.tfvars.example terraform.tfvars
   ```

3. **Edit `terraform.tfvars`** with your values:
   - Set your SQL admin credentials
   - Add your API keys (optional)
   - Set the environment (dev, staging, prod)

4. **Initialize and apply Terraform**:
   ```bash
   terraform init
   terraform plan
   terraform apply
   ```

## Module Structure

- **main.tf** - Main configuration orchestrating all modules
- **variables.tf** - Variable definitions
- **outputs.tf** - Output values
- **modules/** - Individual resource modules:
  - **app-service/** - App Service and Service Plan
  - **cognitive-services/** - Azure Speech Services
  - **key-vault/** - Key Vault for secrets management
  - **sql-database/** - SQL Server and Database
  - **storage/** - Storage Account with containers

## Resource Naming Convention

Resources are named using the pattern: `{app_name}-{environment}-{resource_type}`

For example, in dev environment:
- Resource Group: `rg-meetingsummary-dev`
- App Service: `meetingsummary-dev-api`
- SQL Server: `meetingsummary-dev-sql`
- Key Vault: `meetingsummary-dev-kv`
- Storage Account: `meetingsummarydev` (no hyphens due to Azure restrictions)

## Environment Differences

| Resource | Dev | Staging | Prod |
|----------|-----|---------|------|
| App Service | B1 | B1 | P1v3 |
| SQL Database | Basic | Basic | S1 |
| Storage | LRS | LRS | GRS |
| Key Vault | 7-day retention | 7-day retention | 90-day retention |
| Network Access | Allow all | Allow all | Restricted |

## Secrets Management

The following secrets are automatically stored in Key Vault:
- `OpenAIApiKey-{Environment}`
- `SendGridApiKey-{Environment}`
- `AzureStorageConnectionString-{Environment}`
- `DatabaseConnectionString-{Environment}`
- `AzureSpeechKey-{Environment}`

## Outputs

After deployment, Terraform outputs important information:
- App Service URL
- Key Vault name and URI
- Storage Account name
- SQL Server and Database names
- Speech Service name

## Cleanup

To destroy all resources:
```bash
terraform destroy
```

**Warning**: This will permanently delete all resources and data. Use with caution in production environments.
