# App Service module (basic version)

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
  sku_size = local.is_production ? "P1v3" : "B1"
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
  }

  identity {
    type = "SystemAssigned"
  }

  tags = {
    Environment = var.environment
    Application = "MeetingSummary"
  }
}

output "app_service_name" {
  value = azurerm_linux_web_app.main.name
}

output "app_service_url" {
  value = "https://${azurerm_linux_web_app.main.default_hostname}"
}
