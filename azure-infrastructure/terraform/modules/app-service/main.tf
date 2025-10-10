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

# Local values
locals {
  is_production = var.environment == "prod"
  sku_size = local.is_production ? "P1v3" : (var.environment == "dev" ? "B1" : "S1")
  enable_blue_green = local.is_production
}

# App Service Plan
resource "azurerm_service_plan" "main" {
  name                = "${var.app_service_name}-plan"
  resource_group_name = var.resource_group_name
  location            = var.location
  os_type             = "Linux"
  sku_name            = local.sku_size

  tags = {
    Environment = var.environment
    Application = "MeetingSummary"
  }
}

# App Service
resource "azurerm_linux_web_app" "main" {
  name                = var.app_service_name
  resource_group_name = var.resource_group_name
  location            = var.location
  service_plan_id     = azurerm_service_plan.main.id
  https_only          = true

  site_config {
    application_stack {
      dotnet_version = "8.0"
    }
    always_on = local.is_production
    
    # Production-specific configurations
    dynamic "cors" {
      for_each = local.is_production ? [1] : []
      content {
        allowed_origins = [
          "https://${var.app_service_name}.azurewebsites.net",
          "https://meetingsummary.io"  # Production domain
        ]
        support_credentials = true
      }
    }
  }

  # App settings for all environments
  app_settings = {
    "ASPNETCORE_ENVIRONMENT" = var.environment == "prod" ? "Production" : (var.environment == "dev" ? "Development" : "Staging")
    "WEBSITES_ENABLE_APP_SERVICE_STORAGE" = "false"
    "DOCKER_ENABLE_CI" = "true"
    
    # Health check endpoint
    "WEBSITE_HEALTHCHECK_MAXPINGFAILURES" = "3"
    "WEBSITE_HEALTHCHECK_MAXUNHEALTHYWORKERPERCENT" = "50"
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
resource "azurerm_linux_web_app_slot" "staging" {
  count           = local.enable_blue_green ? 1 : 0
  name            = "staging"
  app_service_id  = azurerm_linux_web_app.main.id
  https_only      = true

  site_config {
    application_stack {
      dotnet_version = "8.0"
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
    "DOCKER_ENABLE_CI" = "true"
    "SLOT_NAME" = "staging"
    
    # Health check endpoint
    "WEBSITE_HEALTHCHECK_MAXPINGFAILURES" = "3"
    "WEBSITE_HEALTHCHECK_MAXUNHEALTHYWORKERPERCENT" = "50"
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
