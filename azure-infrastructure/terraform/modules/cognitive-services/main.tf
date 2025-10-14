# Cognitive Services Terraform module

variable "speech_service_name" {
  description = "Name of the Speech Service"
  type        = string
}

variable "location" {
  description = "Location for the Cognitive Services"
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

# Local values
locals {
  is_production = var.environment == "prod"
  # Use S0 for all environments since F0 free tier is already used in subscription
  sku_name = "S0"
}

# Cognitive Services Speech Service
resource "azurerm_cognitive_account" "speech" {
  name                = var.speech_service_name
  location            = var.location
  resource_group_name = var.resource_group_name
  kind                = "SpeechServices"
  sku_name            = local.sku_name

  public_network_access_enabled = !local.is_production
  custom_subdomain_name         = var.speech_service_name

  dynamic "network_acls" {
    for_each = local.is_production ? [1] : []
    content {
      default_action = "Deny"
      ip_rules       = []
    }
  }

  tags = {
    Environment = var.environment
    Application = "MeetingSummary"
  }
}
