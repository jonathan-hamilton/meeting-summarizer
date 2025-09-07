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

# Variables
variable "environment" {
  description = "Environment name (dev, staging, prod)"
  type        = string
  validation {
    condition = contains(["dev", "staging", "prod"], var.environment)
    error_message = "Environment must be one of: dev, staging, prod."
  }
}

variable "location" {
  description = "Location for all resources"
  type        = string
  default     = "East US"
}

variable "app_name" {
  description = "Application name prefix"
  type        = string
  default     = "meetingsummary"
}

variable "sql_admin_login" {
  description = "SQL Administrator login"
  type        = string
  sensitive   = true
}

variable "sql_admin_password" {
  description = "SQL Administrator password"
  type        = string
  sensitive   = true
}

variable "openai_api_key" {
  description = "OpenAI API Key"
  type        = string
  sensitive   = true
  default     = ""
}

variable "sendgrid_api_key" {
  description = "SendGrid API Key"
  type        = string
  sensitive   = true
  default     = ""
}

# Local values for resource naming
locals {
  resource_suffix        = "${var.app_name}-${var.environment}"
  storage_account_name   = "${var.app_name}${var.environment}"
  environment_title_case = var.environment == "dev" ? "Dev" : var.environment == "staging" ? "Staging" : "Prod"
}

# Data source for current client configuration
data "azurerm_client_config" "current" {}

# Resource Group (assuming it exists)
data "azurerm_resource_group" "main" {
  name = "rg-${local.resource_suffix}"
}

# Key Vault Module
module "key_vault" {
  source = "./modules/key-vault"

  key_vault_name = "${local.resource_suffix}-kv"
  location       = var.location
  environment    = var.environment
  resource_group_name = data.azurerm_resource_group.main.name
}

# Storage Account Module
module "storage" {
  source = "./modules/storage"

  storage_account_name = local.storage_account_name
  location            = var.location
  environment         = var.environment
  resource_group_name = data.azurerm_resource_group.main.name
}

# SQL Database Module
module "sql_database" {
  source = "./modules/sql-database"

  sql_server_name     = "${local.resource_suffix}-sql"
  database_name       = "${local.resource_suffix}-db"
  location           = var.location
  environment        = var.environment
  resource_group_name = data.azurerm_resource_group.main.name
  administrator_login = var.sql_admin_login
  administrator_login_password = var.sql_admin_password
}

# App Service Module
module "app_service" {
  source = "./modules/app-service"

  app_service_name    = "${local.resource_suffix}-api"
  location           = var.location
  environment        = var.environment
  resource_group_name = data.azurerm_resource_group.main.name
  key_vault_id       = module.key_vault.key_vault_id
}

# Cognitive Services Module
module "cognitive_services" {
  source = "./modules/cognitive-services"

  speech_service_name = "${local.resource_suffix}-speech"
  location           = var.location
  environment        = var.environment
  resource_group_name = data.azurerm_resource_group.main.name
}

# Store secrets in Key Vault
resource "azurerm_key_vault_secret" "openai_api_key" {
  count = var.openai_api_key != "" ? 1 : 0
  
  name         = "OpenAIApiKey-${local.environment_title_case}"
  value        = var.openai_api_key
  key_vault_id = module.key_vault.key_vault_id

  depends_on = [module.key_vault]
}

resource "azurerm_key_vault_secret" "sendgrid_api_key" {
  count = var.sendgrid_api_key != "" ? 1 : 0
  
  name         = "SendGridApiKey-${local.environment_title_case}"
  value        = var.sendgrid_api_key
  key_vault_id = module.key_vault.key_vault_id

  depends_on = [module.key_vault]
}

resource "azurerm_key_vault_secret" "storage_connection_string" {
  name         = "AzureStorageConnectionString-${local.environment_title_case}"
  value        = module.storage.connection_string
  key_vault_id = module.key_vault.key_vault_id

  depends_on = [module.key_vault, module.storage]
}

resource "azurerm_key_vault_secret" "database_connection_string" {
  name         = "DatabaseConnectionString-${local.environment_title_case}"
  value        = module.sql_database.connection_string
  key_vault_id = module.key_vault.key_vault_id

  depends_on = [module.key_vault, module.sql_database]
}

resource "azurerm_key_vault_secret" "speech_key" {
  name         = "AzureSpeechKey-${local.environment_title_case}"
  value        = module.cognitive_services.speech_key
  key_vault_id = module.key_vault.key_vault_id

  depends_on = [module.key_vault, module.cognitive_services]
}
