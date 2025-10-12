# 🚀 Meeting Summarizer Deployment Workflows

This repository uses **separated deployment workflows** for better reliability and maintainability.

## 📋 Workflow Structure

### Development Environment

#### 🏗️ Infrastructure: `dev-infrastructure.yml`
**Triggers:**
- Manual dispatch
- Changes to `azure-infrastructure/**` 
- Changes to workflow file

**Purpose:** Deploy/update Azure infrastructure (Terraform)
- Container Apps Environment
- Container Registry  
- SQL Database
- Key Vault
- Storage Account

#### 🚀 Application: `dev-application.yml`
**Triggers:**
- Push to `main` branch (code changes)
- Changes to `MeetingSummarizer.Api/**`
- Changes to `frontend/**`
- Manual dispatch

**Purpose:** Build and deploy application code
- Build Docker image
- Push to Azure Container Registry
- Update Container App with new image

### Production Environment

#### 🏗️ Infrastructure: `prod-infrastructure.yml`
**Triggers:**
- Manual dispatch only

**Purpose:** Deploy/update production infrastructure
- Requires manual approval
- Same resources as dev but in production

#### 🚀 Application: `prod-application.yml`
**Triggers:**
- Manual dispatch only

**Purpose:** Deploy application to production
- Requires manual approval
- Blue-green deployment capability
- Health checks
- Rollback capability

## 🔄 Typical Deployment Flow

### First Time Setup
1. Run `dev-infrastructure.yml` to create development infrastructure
2. Run `dev-application.yml` to deploy initial application

### Ongoing Development
1. Push code changes to `main` branch
2. `dev-application.yml` automatically deploys new version
3. Infrastructure only changes when needed

### Production Deployment
1. Run `prod-infrastructure.yml` if infrastructure changes needed
2. Run `prod-application.yml` to deploy tested code to production
3. Both require manual approval

## 🛠️ Benefits of This Approach

- ✅ **Faster deployments**: App changes don't need full infrastructure cycle
- ✅ **Better reliability**: Separate concerns, clearer error isolation
- ✅ **Easier rollbacks**: Application can be rolled back without affecting infrastructure  
- ✅ **Cost efficiency**: Infrastructure changes less frequently
- ✅ **Better testing**: Can test infrastructure and application changes independently

## 🔧 Environment Configuration

Make sure these GitHub environments are configured:
- `development` - For dev deployments
- `production` - For prod deployments  
- `production-approval` - For prod approval gates

## 📝 Required Secrets

All workflows require these repository secrets:
- `AZURE_CLIENT_ID`
- `AZURE_TENANT_ID` 
- `AZURE_SUBSCRIPTION_ID`
- `ARM_ACCESS_KEY`
- `SQL_ADMIN_LOGIN`
- `SQL_ADMIN_PASSWORD`
- `OPENAI_API_KEY`
- `SENDGRID_API_KEY`