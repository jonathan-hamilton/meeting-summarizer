# Main Terraform configuration for Meeting Summary application infrastructure
# This configuration orchestrates all the required Azure resources for the application

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
  storage_account_name   = "${var.app_name}${var.environment}"
  environment_title_case = var.environment == "dev" ? "Dev" : var.environment == "staging" ? "Staging" : "Prod"
}

# Data source for current client configuration
data "azurerm_client_config" "current" {}

# Resource Group - Create instead of assuming it exists
resource "azurerm_resource_group" "main" {
  name     = "rg-${local.resource_suffix}"
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

  key_vault_name = "${local.resource_suffix}-kv"
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

  sql_server_name     = "${local.resource_suffix}-sql"
  database_name       = "${local.resource_suffix}-db"
  location           = var.location
  environment        = var.environment
  resource_group_name = azurerm_resource_group.main.name
  administrator_login = var.sql_admin_login
  administrator_login_password = var.sql_admin_password
}

# App Service Module
module "app_service" {
  source = "./modules/app-service"

  app_service_name    = "${local.resource_suffix}-api"
  location           = var.location
  environment        = var.environment
  resource_group_name = azurerm_resource_group.main.name
  key_vault_id       = module.key_vault.key_vault_id
}

# Cognitive Services Module
module "cognitive_services" {
  source = "./modules/cognitive-services"

  speech_service_name = "${local.resource_suffix}-speech"
  location           = var.location
  environment        = var.environment
  resource_group_name = azurerm_resource_group.main.name
}

# Store secrets in Key Vault (with dependency on access policy)
resource "azurerm_key_vault_secret" "storage_connection_string" {
  name         = "AzureStorageConnectionString-${local.environment_title_case}"
  value        = module.storage.connection_string
  key_vault_id = module.key_vault.key_vault_id

  depends_on = [module.key_vault.azurerm_key_vault_access_policy_current_user]
}

resource "azurerm_key_vault_secret" "database_connection_string" {
  name         = "DatabaseConnectionString-${local.environment_title_case}"
  value        = module.sql_database.connection_string
  key_vault_id = module.key_vault.key_vault_id

  depends_on = [module.key_vault.azurerm_key_vault_access_policy_current_user]
}

resource "azurerm_key_vault_secret" "speech_key" {
  name         = "AzureSpeechKey-${local.environment_title_case}"
  value        = module.cognitive_services.speech_key
  key_vault_id = module.key_vault.key_vault_id

  depends_on = [module.key_vault.azurerm_key_vault_access_policy_current_user]
}
