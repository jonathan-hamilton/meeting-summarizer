# Terraform Backend Setup Instructions

## Overview
This document explains how to set up the Terraform remote state backend for proper infrastructure management across dev/prod environments.

## Backend Configuration

### Storage Account Details
- **Resource Group**: `rg-terraform-state`
- **Storage Account**: `tfstatemeetingsummary` 
- **Container**: `terraform-state`
- **Location**: `westus`

### State File Organization
- **Development**: `dev/terraform.tfstate`
- **Production**: `prod/terraform.tfstate`

This ensures dev and prod environments have completely separate state files, preventing conflicts.

## Required GitHub Secrets

Add the following secret to your GitHub repository:

### `ARM_ACCESS_KEY`
```
TvQMw4RI1ZGbAW9OGxWxi4BU5gCulYun1vqcFe99qrLvUnmrUhNXmEOXbcZ3VhO2b6P8nRIIikbj+AStpKE/zA==
```

**To add this secret:**
1. Go to GitHub repository → Settings → Secrets and variables → Actions
2. Click "New repository secret"
3. Name: `ARM_ACCESS_KEY`
4. Value: (paste the key above)
5. Click "Add secret"

## How This Solves Infrastructure Management Issues

### Problem Before
- No remote state = Terraform forgets what it created between runs
- Shared state file = Dev and prod could conflict
- Manual resource creation = Drift from Infrastructure as Code

### Solution Now
- ✅ **Remote state backend** = Terraform remembers previous deployments
- ✅ **Separate state per environment** = No dev/prod conflicts
- ✅ **Static resource naming** = Predictable resource names
- ✅ **Infrastructure as Code** = All resources managed via Terraform

### Benefits
1. **No more "resource already exists" errors** - Terraform knows what it created
2. **Consistent deployments** - Same infrastructure every time
3. **Environment isolation** - Dev changes don't affect prod
4. **State persistence** - Infrastructure state survives between deployments
5. **Rollback capability** - Can revert to previous infrastructure versions

## Deployment Flow

### Development
1. Push to `main` branch
2. GitHub Actions runs with `key=dev/terraform.tfstate`
3. Creates/updates dev resources with `-v2` suffix
4. State saved to dev-specific file

### Production  
1. Manual workflow dispatch or production deployment trigger
2. GitHub Actions runs with `key=prod/terraform.tfstate`
3. Creates/updates prod resources (different names)
4. State saved to prod-specific file

## Resource Naming Strategy

### Development Environment
- Resource Group: `rg-meetingsummary-dev`
- Key Vault: `meeting-summary-io-v2-kv`
- Speech Service: `meetingsummary-dev-v2-speech`
- SQL Server: `meetingsummary-dev-v2-sql`

### Production Environment  
- Resource Group: `rg-meetingsummary-prod`
- Key Vault: `meeting-summary-io-v2-kv` (in prod RG)
- Speech Service: `meetingsummary-prod-v2-speech`
- SQL Server: `meetingsummary-prod-v2-sql`

The `-v2` suffix avoids conflicts with soft-deleted resources from previous deployments.

## Verification Commands

After setup, verify the backend:

```bash
# Check storage account
az storage account show --name "tfstatemeetingsummary" --resource-group "rg-terraform-state"

# List state files
az storage blob list --account-name "tfstatemeetingsummary" --container-name "terraform-state" --output table

# Initialize Terraform locally (for testing)
cd azure-infrastructure/terraform
terraform init -backend-config="key=dev/terraform.tfstate"
```

## Next Steps

1. **Add the GitHub secret** (ARM_ACCESS_KEY)
2. **Commit and push** the Terraform changes
3. **Run development deployment** - should work without conflicts
4. **Monitor state files** - verify separate dev/prod state files are created
5. **Set up production deployment** - when ready for prod environment

This setup ensures you have proper Infrastructure as Code management with environment isolation and state persistence.