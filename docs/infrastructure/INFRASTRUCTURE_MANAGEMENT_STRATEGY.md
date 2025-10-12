# Infrastructure Management Strategy for Meeting Summary App
# 
# This document outlines the approach to solve the repeated deployment and resource conflict issues

## Problem Analysis
1. **No Remote State**: Terraform state was stored locally in GitHub Actions, causing it to forget about previously created resources
2. **Soft-Delete Conflicts**: Azure Key Vault and Cognitive Services have 90-day soft-delete, causing name conflicts
3. **Timestamp-Based Naming**: Resources were created with new names each deployment instead of reusing existing ones

## Solution Implementation

### 1. Remote State Backend (CRITICAL)
- Store Terraform state in Azure Storage Account
- Ensures Terraform remembers what resources it created
- Prevents duplicate resource creation
- Enables proper infrastructure drift detection

**Setup Steps:**
1. Run `scripts/setup-terraform-backend.ps1` to create state storage
2. Add `ARM_ACCESS_KEY` secret to GitHub repository
3. Terraform will use `backend.tf` configuration

### 2. Static Resource Naming (IMPLEMENTED)
- Development environment uses static names with `-v2` suffix to avoid soft-delete conflicts
- Production can use timestamps for blue-green deployments
- Key resources:
  - Resource Group: `rg-meetingsummary-dev`
  - Key Vault: `meeting-summary-io-v2-kv`
  - Speech Service: `meetingsummary-dev-v2-speech`

### 3. Soft-Delete Management
- Terraform configured with `purge_soft_delete_on_destroy = true`
- Cleanup script available: `scripts/cleanup-azure-resources.ps1`
- For future: Use different resource names rather than fighting soft-delete

### 4. Deployment Strategy
**First Time Setup:**
1. Clean all existing resources (done)
2. Setup Terraform backend (pending)
3. Deploy with remote state

**Ongoing Deployments:**
1. Terraform will check existing state
2. Only create/update resources that changed
3. Reuse existing resources by default

### 5. Resource Lifecycle
- **Dev Environment**: Static naming, reuse resources
- **Prod Environment**: Blue-green with timestamps
- **State Management**: Always use remote state
- **Cleanup**: Automated scripts for conflicts

## Benefits
✅ No more duplicate resource creation
✅ Consistent resource names
✅ Proper infrastructure versioning  
✅ Cost optimization (reuse resources)
✅ Reduced deployment conflicts
✅ Faster deployments (updates vs recreates)

## Next Steps
1. Setup Terraform backend storage
2. Configure GitHub secrets
3. Run first deployment with remote state
4. Validate resource reuse on subsequent deployments