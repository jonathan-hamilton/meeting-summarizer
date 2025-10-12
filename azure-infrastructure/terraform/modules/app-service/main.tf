# App Service module with blue-green deployment support

variable "app_service_name" {
  description = "Name of the App Service"
  type        = string
}

variable "location" {
  description = "Location for the App Service"
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

variable "key_vault_id" {
  description = "Key Vault ID"
  type        = string
}

variable "custom_domain_name" {
  description = "Custom domain name (e.g., meeting-summary.io)"
  type        = string
  default     = ""
}

variable "enable_custom_domain" {
  description = "Whether to enable custom domain binding"
  type        = bool
  default     = false
}

# Local values
locals {
  is_production = var.environment == "prod"
  sku_size = local.is_production ? "P1v3" : (var.environment == "dev" ? "B1" : "S1")  # Use B1 (Basic) for dev - better quota availability
  enable_blue_green = local.is_production
  
  # Custom domain configuration
  has_custom_domain = var.enable_custom_domain && var.custom_domain_name != ""
  www_domain = local.has_custom_domain ? (var.environment == "prod" ? "www.${var.custom_domain_name}" : "${var.environment}.${var.custom_domain_name}") : ""
  api_domain = local.has_custom_domain ? (var.environment == "prod" ? "api.${var.custom_domain_name}" : "api.${var.environment}.${var.custom_domain_name}") : ""
  
  # CORS allowed origins including custom domains
  cors_origins = concat(
    [
      "https://${var.app_service_name}.azurewebsites.net"
    ],
    local.has_custom_domain ? [
      "https://${local.www_domain}",
      "https://${local.api_domain}"
    ] : [],
    local.is_production && local.has_custom_domain ? ["https://${var.custom_domain_name}"] : []
  )
}

# App Service Plan
resource "azurerm_service_plan" "main" {
  name                = "${var.app_service_name}-plan"
  resource_group_name = var.resource_group_name
  location            = var.location
  os_type             = "Windows"
  sku_name            = local.sku_size

  tags = {
    Environment = var.environment
    Application = "MeetingSummary"
  }
}

# App Service
resource "azurerm_windows_web_app" "main" {
  name                = var.app_service_name
  resource_group_name = var.resource_group_name
  location            = var.location
  service_plan_id     = azurerm_service_plan.main.id
  https_only          = true

  site_config {
    application_stack {
      dotnet_version = "v8.0"
    }
    always_on = local.is_production && local.sku_size != "F1"  # Free tier doesn't support always_on
    
    # Production-specific configurations
    dynamic "cors" {
      for_each = local.is_production ? [1] : []
      content {
        allowed_origins = local.cors_origins
        support_credentials = true
      }
    }
  }

  # App settings for all environments
  app_settings = {
    "ASPNETCORE_ENVIRONMENT" = var.environment == "prod" ? "Production" : (var.environment == "dev" ? "Development" : "Staging")
    "WEBSITES_ENABLE_APP_SERVICE_STORAGE" = "false"
    
    # Custom application settings (removed reserved WEBSITE_HEALTHCHECK_* settings)
  }

  identity {
    type = "SystemAssigned"
  }

  tags = {
    Environment = var.environment
    Application = "MeetingSummary"
  }
}

# Production Staging Slot for Blue-Green Deployment
resource "azurerm_windows_web_app_slot" "staging" {
  count           = local.enable_blue_green ? 1 : 0
  name            = "staging"
  app_service_id  = azurerm_windows_web_app.main.id
  https_only      = true

  site_config {
    application_stack {
      dotnet_version = "v8.0"
    }
    always_on = true
    
    cors {
      allowed_origins = [
        "https://${var.app_service_name}.azurewebsites.net",
        "https://${var.app_service_name}-staging.azurewebsites.net",
        "https://meetingsummary.io"
      ]
      support_credentials = true
    }
  }

  # Staging slot app settings
  app_settings = {
    "ASPNETCORE_ENVIRONMENT" = "Staging"
    "WEBSITES_ENABLE_APP_SERVICE_STORAGE" = "false"
    "SLOT_NAME" = "staging"
    
    # Custom application settings (removed reserved WEBSITE_HEALTHCHECK_* settings)
  }

  identity {
    type = "SystemAssigned"
  }

  tags = {
    Environment = "${var.environment}-staging"
    Application = "MeetingSummary"
    Purpose = "BlueGreenDeployment"
  }
}

# Custom Domain Binding for WWW subdomain
resource "azurerm_app_service_custom_hostname_binding" "www" {
  count               = local.has_custom_domain ? 1 : 0
  hostname            = local.www_domain
  app_service_name    = azurerm_windows_web_app.main.name
  resource_group_name = var.resource_group_name

  # Depends on DNS configuration being in place
  lifecycle {
    ignore_changes = [ssl_state, thumbprint]
  }
}

# Custom Domain Binding for API subdomain
resource "azurerm_app_service_custom_hostname_binding" "api" {
  count               = local.has_custom_domain ? 1 : 0
  hostname            = local.api_domain
  app_service_name    = azurerm_windows_web_app.main.name
  resource_group_name = var.resource_group_name

  # Depends on DNS configuration being in place
  lifecycle {
    ignore_changes = [ssl_state, thumbprint]
  }
}

# Managed Certificate for WWW domain
resource "azurerm_app_service_managed_certificate" "www" {
  count                      = local.has_custom_domain ? 1 : 0
  custom_hostname_binding_id = azurerm_app_service_custom_hostname_binding.www[0].id

  tags = {
    Environment = var.environment
    Application = "MeetingSummary"
    DomainType  = "WWW"
  }
}

# Managed Certificate for API domain
resource "azurerm_app_service_managed_certificate" "api" {
  count                      = local.has_custom_domain ? 1 : 0
  custom_hostname_binding_id = azurerm_app_service_custom_hostname_binding.api[0].id

  tags = {
    Environment = var.environment
    Application = "MeetingSummary"
    DomainType  = "API"
  }
}

# Certificate Binding for WWW domain
resource "azurerm_app_service_certificate_binding" "www" {
  count           = local.has_custom_domain ? 1 : 0
  hostname_binding_id = azurerm_app_service_custom_hostname_binding.www[0].id
  certificate_id      = azurerm_app_service_managed_certificate.www[0].id
  ssl_state          = "SniEnabled"
}

# Certificate Binding for API domain
resource "azurerm_app_service_certificate_binding" "api" {
  count           = local.has_custom_domain ? 1 : 0
  hostname_binding_id = azurerm_app_service_custom_hostname_binding.api[0].id
  certificate_id      = azurerm_app_service_managed_certificate.api[0].id
  ssl_state          = "SniEnabled"
}
