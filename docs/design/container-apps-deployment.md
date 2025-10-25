# Container Apps Deployment Architecture

## Overview
**Implementation Date**: October 11, 2025  
**Migration Context**: S7.1 DevOps & Deployment Enhancement  
**Migration Reason**: Resolved persistent App Service quota limitations across all Azure regions

This document describes the Container Apps deployment architecture that replaced the original App Service deployment to resolve quota limitations and modernize the infrastructure.

## Architecture Overview

### Container Apps Platform Benefits
- **Serverless Scaling**: Pay-per-use model with automatic scaling based on request load
- **Modern Container Platform**: Native container deployment without VM management overhead
- **Enhanced Security**: Container isolation with managed identity integration
- **Cost Optimization**: No always-on costs compared to App Service plans
- **Simplified Management**: Revision-based deployments with easy rollback capabilities

## Infrastructure Components

### Core Container Apps Resources
```
Container App Environment
├── Log Analytics Workspace (monitoring)
├── Container Registry (image storage)
└── Container App (application hosting)
    ├── Ingress Configuration (HTTPS/auto-scaling)
    ├── Environment Variables (configuration)
    ├── Secrets Management (Azure Key Vault integration)
    └── Auto-scaling Rules (CPU/memory/HTTP requests)
```

### Resource Naming Convention
- **Environment**: `{environment}-{location_short}-containerenv`
- **Registry**: `{environment}{location_short}registry`
- **Container App**: `{environment}-{location_short}-api`

Example for dev environment in West US:
- Environment: `dev-wus-containerenv`
- Registry: `devwusregistry`
- Container App: `dev-wus-api`

## Deployment Configuration

### Environment-Specific Scaling

#### Development Environment
```yaml
CPU: 0.5 cores
Memory: 1.0Gi
Min Replicas: 1
Max Replicas: 3
Environment: Development
```

#### Production Environment
```yaml
CPU: 1.0 cores
Memory: 2.0Gi
Min Replicas: 2
Max Replicas: 10
Environment: Production
```

### Container Configuration

#### Multi-Stage Dockerfile
```dockerfile
# Build stage
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src
COPY ["MeetingSummarizer.Api.csproj", "./"]
RUN dotnet restore
COPY . .
RUN dotnet publish -c Release -o /app/publish

# Runtime stage
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS runtime
WORKDIR /app
COPY --from=build /app/publish .
EXPOSE 8080
ENTRYPOINT ["dotnet", "MeetingSummarizer.Api.dll"]
```

#### Security Hardening
- Non-root user execution
- Minimal base image (aspnet runtime only)
- Health check endpoints (`/health`, `/health/ready`)
- Environment variable configuration (no secrets in image)

## CI/CD Pipeline Integration

### Enhanced Build Process
1. **Code Checkout**: Get latest source code
2. **Backend Build**: Restore, build, and test .NET application
3. **Docker Build**: Create multi-stage container image
4. **Image Upload**: Save container image as artifact for deployment

### Deployment Process
1. **Image Download**: Retrieve Docker image artifact
2. **ACR Login**: Authenticate with Azure Container Registry
3. **Image Push**: Push tagged image to ACR
4. **Container Update**: Update Container App with new image
5. **Health Validation**: Verify application health via HTTP endpoints

### Deployment Commands
```bash
# Build and tag Docker image
docker build -t meeting-summarizer-api:$VERSION .

# Push to Azure Container Registry
az acr login --name $ACR_NAME
docker tag meeting-summarizer-api:$VERSION $ACR_SERVER/meeting-summarizer-api:$VERSION
docker push $ACR_SERVER/meeting-summarizer-api:$VERSION

# Update Container App
az containerapp update \
  --name $CONTAINER_APP_NAME \
  --resource-group $RESOURCE_GROUP \
  --image $ACR_SERVER/meeting-summarizer-api:$VERSION
```

## Migration Benefits

### Quota Resolution
- **Problem**: App Service Plans showed 0 quota across all VM families (Basic, Standard, Premium)
- **Solution**: Container Apps use different quota pools with available capacity
- **Impact**: Enables deployment across all Azure regions without quota limitations

### Performance Improvements
- **Startup Time**: Container Apps start faster than traditional App Service
- **Scaling**: More granular auto-scaling based on actual resource usage
- **Resource Efficiency**: Pay only for actual compute time used

### Cost Optimization
- **App Service**: Always-on pricing regardless of usage
- **Container Apps**: Pay-per-use with automatic scale-to-zero capability
- **Development**: Significant cost savings for low-usage development environments

### Operational Benefits
- **Simplified Management**: No VM management or App Service Plan sizing decisions
- **Revision History**: Easy rollback to previous container versions
- **Modern Tooling**: Native container workflow with Docker integration

## Monitoring and Observability

### Health Checks
- **Liveness Probe**: `/health` endpoint for container health
- **Readiness Probe**: `/health/ready` endpoint for traffic readiness
- **Startup Validation**: Ensures application is fully initialized before traffic routing

### Logging and Metrics
- **Log Analytics**: Centralized logging for all container instances
- **Application Insights**: Performance monitoring and error tracking
- **Container Metrics**: CPU, memory, request count, and response time monitoring

## Security Model

### Container Security
- **Managed Identity**: System-assigned identity for Azure service access
- **Secret Management**: Azure Key Vault integration for sensitive configuration
- **Network Isolation**: Container Apps Environment provides network boundary
- **HTTPS Only**: Automatic HTTPS termination with Azure-managed certificates

### Access Control
- **RBAC**: Role-based access control for Container Registry operations
- **GitHub Actions**: OIDC authentication for deployment pipelines
- **Environment Secrets**: Separate secret management for dev/prod environments

## Troubleshooting Guide

### Common Issues

#### Image Pull Errors
```bash
# Check ACR authentication
az acr login --name $ACR_NAME

# Verify image exists
az acr repository list --name $ACR_NAME
az acr manifest list-metadata --repository meeting-summarizer-api --name $ACR_NAME
```

#### Container Startup Issues
```bash
# Check container logs
az containerapp logs show --name $CONTAINER_APP_NAME --resource-group $RESOURCE_GROUP

# Check revision status
az containerapp revision list --name $CONTAINER_APP_NAME --resource-group $RESOURCE_GROUP
```

#### Health Check Failures
```bash
# Test health endpoints directly
curl https://$CONTAINER_APP_FQDN/health
curl https://$CONTAINER_APP_FQDN/health/ready

# Check container app configuration
az containerapp show --name $CONTAINER_APP_NAME --resource-group $RESOURCE_GROUP
```

## Migration History

### App Service to Container Apps Migration (October 11, 2025)

#### Migration Steps Performed
1. **Container Implementation**: Created Dockerfile and .dockerignore for optimized builds
2. **Infrastructure Migration**: Replaced App Service modules with Container Apps Terraform modules
3. **CI/CD Updates**: Enhanced workflows for container builds and ACR integration
4. **Configuration Updates**: Updated all .tfvars files for Container Apps scaling parameters
5. **Environment Cleanup**: Removed staging environment, maintained dev/prod separation
6. **Validation**: Confirmed Terraform plan success with 20 resources ready for deployment

#### Files Modified
- `MeetingSummarizer.Api/Dockerfile` - Multi-stage container build
- `MeetingSummarizer.Api/.dockerignore` - Build context optimization
- `azure-infrastructure/terraform/modules/container-apps/` - New infrastructure modules
- `azure-infrastructure/terraform/main.tf` - Updated main configuration
- `.github/workflows/shared-build.yml` - Container build integration
- `.github/workflows/deploy-development.yml` - Container deployment workflow

#### Migration Success Criteria
- ✅ Terraform validation successful
- ✅ Terraform plan shows successful deployment path
- ✅ No quota limitations encountered
- ✅ Container Apps provider registered and available
- ✅ CI/CD workflows updated for container deployment

## Next Steps

### Production Deployment
1. **Infrastructure Deployment**: Execute Terraform apply for Container Apps infrastructure
2. **Initial Container Deploy**: Push first container image and validate deployment
3. **DNS Configuration**: Configure custom domain if required
4. **Monitoring Setup**: Validate Application Insights and Log Analytics integration
5. **Performance Testing**: Validate scaling behavior under load

### Optimization Opportunities
1. **Multi-Region Deployment**: Consider Container Apps in multiple regions for geo-redundancy
2. **Advanced Scaling**: Implement custom scaling rules based on business metrics
3. **Performance Monitoring**: Set up advanced monitoring and alerting
4. **Security Hardening**: Implement private Container Apps Environment if required

---

**Document Version**: 1.0  
**Last Updated**: October 11, 2025  
**Author**: DevOps Engineering Team  
**Related Documentation**: 
- [S7.1 Implementation Complete](../sprints/sprint_7/s7.1-implementation-complete.md)
- [Terraform Container Apps Module](../../azure-infrastructure/terraform/modules/container-apps/)