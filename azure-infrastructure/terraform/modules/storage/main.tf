# Storage Account Terraform module

variable "storage_account_name" {
  description = "Name of the storage account"
  type        = string
}

variable "location" {
  description = "Location for the storage account"
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

variable "account_tier" {
  description = "Storage account tier"
  type        = string
  default     = "Standard"
}

variable "access_tier" {
  description = "Access tier for the storage account"
  type        = string
  default     = "Hot"
}

# Local values
locals {
  replication_type = var.environment == "prod" ? "GRS" : "LRS"
  is_production   = var.environment == "prod"
}

# Storage Account resource
resource "azurerm_storage_account" "main" {
  name                = var.storage_account_name
  resource_group_name = var.resource_group_name
  location            = var.location
  account_tier        = var.account_tier
  account_replication_type = local.replication_type
  account_kind        = "StorageV2"
  access_tier         = var.access_tier

  allow_nested_items_to_be_public = false
  shared_access_key_enabled       = true
  min_tls_version                 = "TLS1_2"
  https_traffic_only_enabled      = true

  blob_properties {
    delete_retention_policy {
      days = local.is_production ? 30 : 7
    }
    container_delete_retention_policy {
      days = local.is_production ? 30 : 7
    }
    versioning_enabled = local.is_production
  }

  network_rules {
    default_action = local.is_production ? "Deny" : "Allow"
    bypass         = ["AzureServices"]
  }

  tags = {
    Environment = var.environment
    Application = "MeetingSummary"
  }
}

# Blob containers
resource "azurerm_storage_container" "audio_files" {
  name                  = "audio-files"
  storage_account_name  = azurerm_storage_account.main.name
  container_access_type = "private"
}

resource "azurerm_storage_container" "user_data" {
  name                  = "user-data"
  storage_account_name  = azurerm_storage_account.main.name
  container_access_type = "private"
}

resource "azurerm_storage_container" "transcripts" {
  name                  = "transcripts"
  storage_account_name  = azurerm_storage_account.main.name
  container_access_type = "private"
}

resource "azurerm_storage_container" "summaries" {
  name                  = "summaries"
  storage_account_name  = azurerm_storage_account.main.name
  container_access_type = "private"
}

# Management Policy for automatic tiering (production only)
resource "azurerm_storage_management_policy" "lifecycle" {
  count = local.is_production ? 1 : 0
  
  storage_account_id = azurerm_storage_account.main.id

  rule {
    name    = "audiofiles_lifecycle"
    enabled = true
    filters {
      prefix_match = ["audio-files/"]
      blob_types   = ["blockBlob"]
    }
    actions {
      base_blob {
        tier_to_cool_after_days_since_modification_greater_than    = 30
        tier_to_archive_after_days_since_modification_greater_than = 180
        delete_after_days_since_modification_greater_than          = 2555 # 7 years
      }
    }
  }

  rule {
    name    = "userdata_lifecycle"
    enabled = true
    filters {
      prefix_match = ["user-data/"]
      blob_types   = ["blockBlob"]
    }
    actions {
      base_blob {
        tier_to_cool_after_days_since_modification_greater_than = 90
        delete_after_days_since_modification_greater_than       = 2555 # 7 years
      }
    }
  }
}
