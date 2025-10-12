# Main Terraform configuration for Meeting Summary application infrastructure
# This configuration orchestrates all the required Azure resources for the application

# 🚫 WARNING: DO NOT RUN TERRAFORM MANUALLY
# This configuration MUST be executed through GitHub Actions CI/CD pipeline only
# See MANUAL_EXECUTION_BLOCKED.md for details

terraform {
  required_version = ">= 1.0"
  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 3.0"
    }
  }
}

provider "azurerm" {
  features {
    key_vault {
      purge_soft_delete_on_destroy    = true
      recover_soft_deleted_key_vaults = true
    }
  }
}

# Local values for resource naming
locals {
  resource_suffix        = "${var.app_name}-${var.environment}"
  storage_account_name   = "ms${var.environment}${formatdate("MMDDhhmm", timestamp())}"  # Keep it short for storage account
  environment_title_case = var.environment == "dev" ? "Dev" : var.environment == "staging" ? "Staging" : "Prod"
  # Use timestamp suffix to avoid conflicts with existing resources
  unique_suffix         = "${var.app_name}-${var.environment}-${formatdate("MMDDhhmm", timestamp())}"  # More unique timestamp
  # Very short suffix for resources with strict naming requirements
  short_suffix          = "ms${substr(var.environment, 0, 1)}${formatdate("MMDDhhmm", timestamp())}"  # e.g., msd10112241
}

# Data source for current client configuration
data "azurerm_client_config" "current" {}

# Resource Group - Create with unique naming to avoid conflicts
resource "azurerm_resource_group" "main" {
  name     = "rg-${local.unique_suffix}"
  location = var.location

  tags = {
    Environment = var.environment
    Application = var.app_name
    CreatedBy   = "Terraform"
  }
}

# Key Vault Module
module "key_vault" {
  source = "./modules/key-vault"

  key_vault_name = "${local.short_suffix}-kv"
  location       = var.location
  environment    = var.environment
  resource_group_name = azurerm_resource_group.main.name
}

# Storage Account Module
module "storage" {
  source = "./modules/storage"

  storage_account_name = local.storage_account_name
  location            = var.location
  environment         = var.environment
  resource_group_name = azurerm_resource_group.main.name
}

# SQL Database Module
module "sql_database" {
  source = "./modules/sql-database"

  sql_server_name     = "${local.unique_suffix}-sql"
  database_name       = "${local.unique_suffix}-db"
  location           = var.location
  environment        = var.environment
  resource_group_name = azurerm_resource_group.main.name
  administrator_login = var.sql_admin_login
  administrator_login_password = var.sql_admin_password
}

# App Service Module
module "app_service" {
  source = "./modules/app-service"

  app_service_name    = "${local.unique_suffix}-api"
  location           = var.location
  environment        = var.environment
  resource_group_name = azurerm_resource_group.main.name
  key_vault_id       = module.key_vault.key_vault_id
  
  # Custom domain configuration
  custom_domain_name    = var.custom_domain_name
  enable_custom_domain  = var.enable_custom_domain
}

# DNS Zone Module (optional)
module "dns_zone" {
  count  = var.create_dns_zone && var.custom_domain_name != "" ? 1 : 0
  source = "./modules/dns-zone"

  domain_name           = var.custom_domain_name
  resource_group_name   = azurerm_resource_group.main.name
  environment          = var.environment
  app_service_hostname = module.app_service.app_service_name
  staging_hostname     = module.app_service.staging_slot_name != null ? "${module.app_service.app_service_name}-staging.azurewebsites.net" : ""
}

# Cognitive Services Module
module "cognitive_services" {
  source = "./modules/cognitive-services"

  speech_service_name = "${local.unique_suffix}-speech"
  location           = var.location
  environment        = var.environment
  resource_group_name = azurerm_resource_group.main.name
}

# Store secrets in Key Vault (with dependency on access policy)
resource "azurerm_key_vault_secret" "storage_connection_string" {
  name         = "AzureStorageConnectionString-${local.environment_title_case}"
  value        = module.storage.connection_string
  key_vault_id = module.key_vault.key_vault_id

  depends_on = [module.key_vault]
}

resource "azurerm_key_vault_secret" "database_connection_string" {
  name         = "DatabaseConnectionString-${local.environment_title_case}"
  value        = module.sql_database.connection_string
  key_vault_id = module.key_vault.key_vault_id

  depends_on = [module.key_vault]
}

resource "azurerm_key_vault_secret" "speech_key" {
  name         = "AzureSpeechKey-${local.environment_title_case}"
  value        = module.cognitive_services.speech_key
  key_vault_id = module.key_vault.key_vault_id

  depends_on = [module.key_vault]
}
