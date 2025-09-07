# Azure Infrastructure for Meeting Summary App

This directory contains Infrastructure as Code (IaC) templates for deploying the Meeting Summary application to Azure across multiple environments.

## Directory Structure

```
azure-infrastructure/
├── bicep/                          # Bicep templates (recommended)
│   ├── main.bicep                 # Main deployment template
│   ├── modules/                   # Reusable Bicep modules
│   │   ├── app-service.bicep      # App Service resources
│   │   ├── storage.bicep          # Storage Account resources
│   │   ├── sql-database.bicep     # SQL Database resources
│   │   ├── key-vault.bicep        # Key Vault resources
│   │   └── cognitive-services.bicep # Speech Services
│   └── parameters/                # Environment-specific parameters
│       ├── development.bicepparam # Development environment
│       ├── staging.bicepparam     # Staging environment
│       └── production.bicepparam  # Production environment
├── arm/                           # ARM JSON templates (legacy)
│   └── template.json             # Complete ARM template
└── scripts/                      # Deployment scripts
    ├── deploy-dev.ps1            # Deploy development environment
    ├── deploy-staging.ps1        # Deploy staging environment
    ├── deploy-prod.ps1           # Deploy production environment
    └── setup-secrets.ps1         # Configure Key Vault secrets
```

## Environments

### Development Environment
- **Resource Group**: `rg-meetingsummary-dev`
- **App Service**: `meetingsummary-dev-api`
- **Static Web App**: `meetingsummary-dev-web`
- **Storage Account**: `meetingsummarydev`
- **SQL Database**: `meetingsummary-dev-db`
- **Key Vault**: `meetingsummary-dev-kv`
- **Speech Service**: `meetingsummary-dev-speech`

### Staging Environment  
- **Resource Group**: `rg-meetingsummary-staging`
- **App Service**: `meetingsummary-staging-api`
- **Static Web App**: `meetingsummary-staging-web`
- **Storage Account**: `meetingsummarystaging`
- **SQL Database**: `meetingsummary-staging-db`
- **Key Vault**: `meetingsummary-staging-kv`
- **Speech Service**: `meetingsummary-staging-speech`

### Production Environment
- **Resource Group**: `rg-meetingsummary-prod`
- **App Service**: `meetingsummary-prod-api`
- **Static Web App**: `meetingsummary-prod-web`
- **Storage Account**: `meetingsummaryprod`
- **SQL Database**: `meetingsummary-prod-db`
- **Key Vault**: `meetingsummary-prod-kv`
- **Speech Service**: `meetingsummary-prod-speech`

## Cost Estimates

### Development Environment (~$25-35/month)
- App Service (Shared): $10/month
- SQL Database (Basic): $5/month
- Storage Account (LRS): $2/month
- Key Vault: $1/month
- Speech Services: $5-15/month (usage-based)
- Static Web App: Free

### Production Environment (~$50-80/month)
- App Service (Standard S1): $25/month
- SQL Database (Standard S1): $20/month
- Storage Account (GRS): $5/month
- Key Vault: $2/month
- Speech Services: $10-25/month (usage-based)
- Static Web App: $9/month (Standard)

## Deployment Instructions

### Prerequisites
1. Azure CLI installed
2. Azure subscription with appropriate permissions
3. Azure PowerShell module (for PowerShell scripts)

### Deploy Development Environment
```bash
# Login to Azure
az login

# Deploy development resources
./scripts/deploy-dev.ps1

# Configure secrets
./scripts/setup-secrets.ps1 -Environment Development
```

### Deploy Production Environment
```bash
# Deploy production resources
./scripts/deploy-prod.ps1

# Configure secrets
./scripts/setup-secrets.ps1 -Environment Production
```

## Security Considerations

- All services use Azure Managed Identity where possible
- Secrets are stored in Azure Key Vault
- Network security groups restrict access
- SQL Database uses Azure AD authentication
- Storage accounts use private endpoints in production
- Application Insights monitors all environments

## Monitoring and Logging

- Application Insights for application monitoring
- Log Analytics workspace for centralized logging
- Azure Monitor alerts for critical issues
- Cost management alerts to prevent budget overruns

## Backup and Disaster Recovery

- SQL Database automated backups (7-day retention for dev, 35-day for prod)
- Storage account geo-redundant replication in production
- Key Vault soft delete enabled
- Infrastructure as Code allows rapid environment recreation
