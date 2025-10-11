# Custom Domain Implementation for Meeting Summary.io

## Overview

This document outlines the complete custom domain implementation for the Meeting Summary application, providing professional subdomain structure for `meeting-summary.io`.

## Domain Structure

### Production Environment
- **Root Domain**: `meeting-summary.io`
- **WWW Domain**: `www.meeting-summary.io` 
- **API Domain**: `api.meeting-summary.io`

### Development Environment
- **WWW Domain**: `dev.meeting-summary.io`
- **API Domain**: `api.dev.meeting-summary.io`
- **Staging Slot**: `dev-staging.meeting-summary.io` (if enabled)

### Staging Environment
- **WWW Domain**: `staging.meeting-summary.io`
- **API Domain**: `api.staging.meeting-summary.io`

## Terraform Configuration

### New Variables Added

```hcl
variable "custom_domain_name" {
  description = "Custom domain name for the application (e.g., meeting-summary.io)"
  type        = string
  default     = ""
}

variable "create_dns_zone" {
  description = "Whether to create and manage Azure DNS Zone for the custom domain"
  type        = bool
  default     = false
}

variable "enable_custom_domain" {
  description = "Whether to configure custom domain binding on App Service"
  type        = bool
  default     = false
}
```

### Environment Configuration

#### Development (`terraform.tfvars`)
```hcl
custom_domain_name = "meeting-summary.io"
create_dns_zone = true
enable_custom_domain = true
```

#### Staging (`staging.tfvars`)
```hcl
custom_domain_name = "meeting-summary.io"
create_dns_zone = false  # Use existing DNS zone from production
enable_custom_domain = true
```

#### Production (`prod.tfvars`)
```hcl
custom_domain_name = "meeting-summary.io"
create_dns_zone = true
enable_custom_domain = true
```

## New Terraform Modules

### DNS Zone Module (`modules/dns-zone/`)

**Purpose**: Manages Azure DNS Zone and DNS records for custom domain

**Features**:
- DNS Zone creation and management
- Environment-specific CNAME records
- Domain verification TXT records
- Staging slot DNS records (development only)

**Outputs**:
- DNS zone ID and name servers
- Full domain names for each subdomain
- Domain verification TXT record values

### App Service Updates (`modules/app-service/`)

**New Features**:
- Custom domain binding for WWW and API subdomains
- Managed SSL certificate provisioning
- Certificate binding with SNI SSL
- Enhanced CORS configuration for custom domains

## Infrastructure Components

### 1. DNS Zone Resources
```hcl
# DNS Zone
azurerm_dns_zone.main

# CNAME Records
azurerm_dns_cname_record.www
azurerm_dns_cname_record.api
azurerm_dns_cname_record.staging (dev only)

# TXT Records for Domain Verification
azurerm_dns_txt_record.domain_verification
azurerm_dns_txt_record.api_domain_verification
```

### 2. App Service Custom Domain Resources
```hcl
# Custom Hostname Bindings
azurerm_app_service_custom_hostname_binding.www
azurerm_app_service_custom_hostname_binding.api

# Managed SSL Certificates
azurerm_app_service_managed_certificate.www
azurerm_app_service_managed_certificate.api

# Certificate Bindings
azurerm_app_service_certificate_binding.www
azurerm_app_service_certificate_binding.api
```

## Deployment Process

### 1. Prerequisites
- Domain ownership verification for `meeting-summary.io`
- Azure subscription with appropriate permissions
- Terraform initialized and authenticated

### 2. Deployment Steps

#### Step 1: Deploy Infrastructure
```bash
# Development environment
terraform plan
terraform apply

# Staging environment
terraform plan -var-file="staging.tfvars"
terraform apply -var-file="staging.tfvars"

# Production environment
terraform plan -var-file="prod.tfvars"
terraform apply -var-file="prod.tfvars"
```

#### Step 2: Configure Domain DNS (One-time setup)
1. After deployment, retrieve DNS name servers from Terraform output:
   ```bash
   terraform output dns_name_servers
   ```

2. Update domain registrar to use Azure DNS name servers

#### Step 3: Verify Domain Configuration
1. Check DNS propagation:
   ```bash
   nslookup dev.meeting-summary.io
   nslookup api.dev.meeting-summary.io
   ```

2. Verify SSL certificates are installed
3. Test HTTPS access to custom domains

## Outputs and Information

### Terraform Outputs
```hcl
# Custom Domain URLs
www_domain_url = "https://dev.meeting-summary.io"
api_domain_url = "https://api.dev.meeting-summary.io"

# DNS Configuration
dns_zone_id = "/subscriptions/.../resourceGroups/.../providers/Microsoft.Network/dnszones/meeting-summary.io"
dns_name_servers = ["ns1-xx.azure-dns.com", "ns2-xx.azure-dns.net", ...]

# Domain Configuration Summary
domain_configuration_summary = {
  domain_name = "meeting-summary.io"
  dns_zone_created = true
  custom_domain_enabled = true
  www_domain = "dev.meeting-summary.io"
  api_domain = "api.dev.meeting-summary.io"
  staging_domain = null
}
```

## Security Features

### SSL/TLS Configuration
- **Managed SSL Certificates**: Automatically provisioned by Azure
- **SNI SSL**: Server Name Indication for multiple SSL certificates
- **HTTPS Enforcement**: All traffic redirected to HTTPS
- **TLS 1.2 Minimum**: Modern TLS version enforcement

### Domain Verification
- **TXT Records**: Azure App Service domain verification
- **CNAME Validation**: DNS-based domain ownership verification

## Monitoring and Maintenance

### Certificate Management
- **Automatic Renewal**: Azure manages certificate lifecycle
- **Certificate Monitoring**: Built-in Azure monitoring for expiration
- **Certificate Binding**: Automatic binding to custom domains

### DNS Management
- **TTL Configuration**: 300 seconds for faster propagation during setup
- **Record Management**: Environment-specific DNS record creation
- **Zone Management**: Centralized DNS zone for all environments

## Troubleshooting

### Common Issues

1. **Domain Verification Failures**
   - Verify TXT records are properly configured
   - Check DNS propagation (can take up to 48 hours)
   - Ensure domain ownership verification is complete

2. **SSL Certificate Issues**
   - Custom domain must be verified before certificate creation
   - DNS records must be properly configured
   - Allow time for certificate provisioning (up to 30 minutes)

3. **DNS Propagation Delays**
   - DNS changes can take up to 48 hours to fully propagate
   - Use online DNS checker tools to verify propagation
   - Clear local DNS cache if testing locally

### Verification Commands
```bash
# Check DNS records
dig dev.meeting-summary.io CNAME
dig api.dev.meeting-summary.io CNAME

# Check SSL certificate
openssl s_client -connect dev.meeting-summary.io:443 -servername dev.meeting-summary.io

# Test domain verification TXT records
dig asuid.dev.meeting-summary.io TXT
dig asuid.api.dev.meeting-summary.io TXT
```

## Cost Considerations

### Azure DNS Zone
- **Monthly Base Cost**: ~$0.50 per zone per month
- **Query Costs**: First 1 billion queries per month included
- **Record Sets**: 25 record sets included per zone

### SSL Certificates
- **Managed Certificates**: Included with App Service
- **No Additional Cost**: For basic SSL certificates

### Additional Costs
- **Custom Domain**: No additional Azure costs
- **Domain Registration**: External cost (domain registrar)

## Future Enhancements

### Potential Improvements
1. **CDN Integration**: Azure CDN for performance optimization
2. **Advanced SSL**: Extended validation certificates for production
3. **Geographic DNS**: Traffic routing based on user location
4. **API Gateway**: Custom API domain with Azure API Management
5. **Monitoring**: Application Insights custom domain tracking

### Scalability Considerations
- DNS zone supports unlimited subdomains
- App Service custom domains scale with plan tier
- Certificate management scales automatically with Azure

## Documentation References

- [Azure DNS Documentation](https://docs.microsoft.com/en-us/azure/dns/)
- [App Service Custom Domains](https://docs.microsoft.com/en-us/azure/app-service/app-service-web-tutorial-custom-domain)
- [Managed SSL Certificates](https://docs.microsoft.com/en-us/azure/app-service/configure-ssl-certificate)
- [Terraform Azure Provider](https://registry.terraform.io/providers/hashicorp/azurerm/latest/docs)