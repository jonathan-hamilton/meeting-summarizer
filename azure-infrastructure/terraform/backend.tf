# Configure Terraform Backend for Remote State
# This ensures Terraform remembers what resources it created between deployments

terraform {
  required_version = ">= 1.0"
  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 3.0"
    }
  }
  
  # Remote state backend - stores Terraform state in Azure Storage
  backend "azurerm" {
    resource_group_name  = "rg-terraform-state"
    storage_account_name = "tfstatemeetingsummary"  # Must be globally unique
    container_name       = "tfstate"
    key                  = "dev.terraform.tfstate"
  }
}