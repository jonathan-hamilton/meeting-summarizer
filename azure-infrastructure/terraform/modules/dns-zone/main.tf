# DNS Zone module for custom domain management

variable "domain_name" {
  description = "Domain name for the DNS zone"
  type        = string
}

variable "resource_group_name" {
  description = "Name of the resource group"
  type        = string
}

variable "environment" {
  description = "Environment (dev, staging, prod)"
  type        = string
}

variable "app_service_ip" {
  description = "IP address of the App Service for A record"
  type        = string
  default     = ""
}

variable "app_service_hostname" {
  description = "Default hostname of the App Service for CNAME record"
  type        = string
}

variable "staging_hostname" {
  description = "Staging slot hostname for development environments"
  type        = string
  default     = ""
}

variable "custom_domain_verification_id" {
  description = "Container App custom domain verification ID for asuid TXT records"
  type        = string
  default     = ""
}

# Local values for subdomain configuration
locals {
  # Environment-specific subdomain configuration
  api_subdomain = var.environment == "prod" ? "api" : "api.${var.environment}"
  www_subdomain = var.environment == "prod" ? "www" : var.environment
  
  # Create staging subdomain only for non-production environments
  create_staging_records = var.environment != "prod" && var.staging_hostname != ""
}

# DNS Zone for the custom domain
resource "azurerm_dns_zone" "main" {
  name                = var.domain_name
  resource_group_name = var.resource_group_name

  tags = {
    Environment = var.environment
    Application = "MeetingSummary"
    Purpose     = "CustomDomain"
  }
}

# A record for root domain (production only) or environment subdomain
resource "azurerm_dns_a_record" "root" {
  count               = var.app_service_ip != "" ? 1 : 0
  name                = var.environment == "prod" ? "@" : var.environment
  zone_name           = azurerm_dns_zone.main.name
  resource_group_name = var.resource_group_name
  ttl                 = 300
  records             = [var.app_service_ip]

  tags = {
    Environment = var.environment
    Application = "MeetingSummary"
    RecordType  = "Root"
  }
}

# CNAME record for www subdomain pointing to the Container App ingress FQDN
resource "azurerm_dns_cname_record" "www" {
  name                = local.www_subdomain
  zone_name           = azurerm_dns_zone.main.name
  resource_group_name = var.resource_group_name
  ttl                 = 300
  record              = var.app_service_hostname

  tags = {
    Environment = var.environment
    Application = "MeetingSummary"
    RecordType  = "WWW"
  }
}

# CNAME record for API subdomain pointing to the Container App ingress FQDN
resource "azurerm_dns_cname_record" "api" {
  name                = local.api_subdomain
  zone_name           = azurerm_dns_zone.main.name
  resource_group_name = var.resource_group_name
  ttl                 = 300
  record              = var.app_service_hostname

  tags = {
    Environment = var.environment
    Application = "MeetingSummary"
    RecordType  = "API"
  }
}

# CNAME record for staging slot (development environments only)
resource "azurerm_dns_cname_record" "staging" {
  count               = local.create_staging_records ? 1 : 0
  name                = "${var.environment}-staging"
  zone_name           = azurerm_dns_zone.main.name
  resource_group_name = var.resource_group_name
  ttl                 = 300
  record              = var.staging_hostname

  tags = {
    Environment = "${var.environment}-staging"
    Application = "MeetingSummary"
    RecordType  = "Staging"
  }
}

# TXT record for domain verification (Azure App Service)
resource "azurerm_dns_txt_record" "domain_verification" {
  name                = "asuid.${local.www_subdomain}"
  zone_name           = azurerm_dns_zone.main.name
  resource_group_name = var.resource_group_name
  ttl                 = 300

  record {
    value = var.custom_domain_verification_id
  }

  tags = {
    Environment = var.environment
    Application = "MeetingSummary"
    RecordType  = "DomainVerification"
  }
}

# Additional TXT record for API subdomain verification
resource "azurerm_dns_txt_record" "api_domain_verification" {
  name                = "asuid.${local.api_subdomain}"
  zone_name           = azurerm_dns_zone.main.name
  resource_group_name = var.resource_group_name
  ttl                 = 300

  record {
    value = var.custom_domain_verification_id
  }

  tags = {
    Environment = var.environment
    Application = "MeetingSummary"
    RecordType  = "APIDomainVerification"
  }
}