# Key Vault Terraform module

variable "key_vault_name" {
  description = "Name of the Key Vault"
  type        = string
}

variable "location" {
  description = "Location for the Key Vault"
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

variable "sku_name" {
  description = "SKU for the Key Vault"
  type        = string
  default     = "standard"
}

variable "enable_soft_delete" {
  description = "Enable soft delete"
  type        = bool
  default     = true
}

# Local values
locals {
  soft_delete_retention_days = var.environment == "prod" ? 90 : 7
  is_production = var.environment == "prod"
}

# Data source for current client configuration
data "azurerm_client_config" "current" {}

# Key Vault resource
resource "azurerm_key_vault" "main" {
  name                = var.key_vault_name
  location            = var.location
  resource_group_name = var.resource_group_name
  tenant_id           = data.azurerm_client_config.current.tenant_id
  sku_name            = var.sku_name

  enabled_for_deployment          = false
  enabled_for_template_deployment = true
  enabled_for_disk_encryption     = false
  enable_rbac_authorization       = true
  
  soft_delete_retention_days = local.soft_delete_retention_days
  purge_protection_enabled   = local.is_production

  public_network_access_enabled = !local.is_production

  network_acls {
    bypass         = "AzureServices"
    default_action = local.is_production ? "Deny" : "Allow"
  }

  tags = {
    Environment = var.environment
    Application = "MeetingSummary"
  }
}

# RBAC role assignment for current user/service principal
resource "azurerm_role_assignment" "key_vault_secrets_officer" {
  scope                = azurerm_key_vault.main.id
  role_definition_name = "Key Vault Secrets Officer"
  principal_id         = data.azurerm_client_config.current.object_id
}

# RBAC role assignment for current user/service principal (certificates)
resource "azurerm_role_assignment" "key_vault_certificate_officer" {
  scope                = azurerm_key_vault.main.id
  role_definition_name = "Key Vault Certificates Officer"
  principal_id         = data.azurerm_client_config.current.object_id
}

# RBAC role assignment for current user/service principal (crypto)
resource "azurerm_role_assignment" "key_vault_crypto_officer" {
  scope                = azurerm_key_vault.main.id
  role_definition_name = "Key Vault Crypto Officer"
  principal_id         = data.azurerm_client_config.current.object_id
}
