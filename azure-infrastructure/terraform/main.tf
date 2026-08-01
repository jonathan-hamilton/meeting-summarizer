# Main Terraform configuration for Meeting Summary application infrastructure
# This configuration orchestrates all the required Azure resources for the application
# Clean deployment after ALL resource groups deleted - true clean slate
# Backend storage container created manually

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
  
  backend "azurerm" {
    resource_group_name  = "rg-terraform-state"
    storage_account_name = "tfstatemeetingsummary"
    container_name       = "terraform-state"
    # Key will be set via GitHub Actions based on environment
    # Dev: key = "dev/terraform.tfstate"  
    # Prod: key = "prod/terraform.tfstate"
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
  # Static name for dev to prevent destroy/recreate on every apply (timestamp() changes each run and the name is ForceNew). Storage names allow only lowercase alphanumerics.
  storage_account_name   = var.environment == "dev" ? "msiodevv2storage" : "ms${var.environment}${formatdate("MMDDhhmm", timestamp())}"
  environment_title_case = var.environment == "dev" ? "Dev" : var.environment == "staging" ? "Staging" : "Prod"
  
  # Use static naming for development environment, timestamp for production to avoid conflicts
  unique_suffix = var.environment == "dev" ? "${var.app_name}-${var.environment}-v2" : "${var.app_name}-${var.environment}-${formatdate("MMDDhhmm", timestamp())}"
  
  # Descriptive suffix for Container Apps and other resources - use v2 to avoid soft-delete conflicts
  short_suffix = var.environment == "dev" ? "msio-dev-v2" : "msio-${substr(var.environment, 0, 1)}${formatdate("MMDDhhmm", timestamp())}"
}

# Data source for current client configuration
data "azurerm_client_config" "current" {}

# Resource Group - Use static naming for consistent deployments
resource "azurerm_resource_group" "main" {
  name     = "rg-meetingsummary-dev"
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
  github_actions_object_id = var.github_actions_object_id
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
  github_actions_object_id = var.github_actions_object_id
}

# Log Analytics Workspace for Container Apps
resource "azurerm_log_analytics_workspace" "main" {
  name                = "${local.unique_suffix}-logs"
  location            = var.location
  resource_group_name = azurerm_resource_group.main.name
  sku                 = "PerGB2018"
  retention_in_days   = 30

  tags = {
    Environment = var.environment
    Application = var.app_name
    CreatedBy   = "Terraform"
  }
}

# Container Apps Module
module "container_apps" {
  source = "./modules/container-apps"

  environment         = var.environment
  location           = var.location
  location_short     = var.location_short
  random_suffix      = local.short_suffix
  resource_group_name = azurerm_resource_group.main.name
  log_analytics_workspace_id = azurerm_log_analytics_workspace.main.id
  
  # Container configuration
  cpu_limit     = var.container_cpu_limit
  memory_limit  = var.container_memory_limit
  min_replicas  = var.container_min_replicas
  max_replicas  = var.container_max_replicas
  aspnet_environment = var.aspnet_environment
  
  # Secrets from other modules
  sql_connection_string = module.sql_database.connection_string
  openai_api_key       = var.openai_api_key
  azure_speech_key     = module.cognitive_services.speech_key
  
  # GitHub Actions integration
  github_actions_object_id = var.github_actions_object_id

  tags = {
    Environment = var.environment
    Application = var.app_name
    CreatedBy   = "Terraform"
  }

  depends_on = [
    azurerm_log_analytics_workspace.main,
    module.sql_database,
    module.cognitive_services
  ]
}

# DNS Zone Module (optional)
module "dns_zone" {
  count  = var.create_dns_zone && var.custom_domain_name != "" ? 1 : 0
  source = "./modules/dns-zone"

  domain_name           = var.custom_domain_name
  resource_group_name   = azurerm_resource_group.main.name
  environment          = var.environment
  app_service_hostname = module.container_apps.container_app_fqdn
  staging_hostname     = ""  # Container Apps don't have staging slots like App Service
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
