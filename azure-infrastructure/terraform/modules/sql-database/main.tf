# SQL Database Terraform module (basic version)

variable "sql_server_name" {
  description = "Name of the SQL Server"
  type        = string
}

variable "database_name" {
  description = "Name of the database"
  type        = string
}

variable "location" {
  description = "Location for the SQL Server"
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

variable "administrator_login" {
  description = "SQL Administrator login"
  type        = string
  sensitive   = true
}

variable "administrator_login_password" {
  description = "SQL Administrator password"  
  type        = string
  sensitive   = true
}

# Local values
locals {
  is_production = var.environment == "prod"
  sku_name = local.is_production ? "S1" : "Basic"
  max_size_gb = local.is_production ? 250 : 32
}

# SQL Server
resource "azurerm_mssql_server" "main" {
  name                         = var.sql_server_name
  resource_group_name          = var.resource_group_name
  location                     = var.location
  version                      = "12.0"
  administrator_login          = var.administrator_login
  administrator_login_password = var.administrator_login_password
  minimum_tls_version          = "1.2"
  
  public_network_access_enabled = !local.is_production

  tags = {
    Environment = var.environment
    Application = "MeetingSummary"
  }
}

# SQL Database
resource "azurerm_mssql_database" "main" {
  name           = var.database_name
  server_id      = azurerm_mssql_server.main.id
  sku_name       = local.sku_name
  max_size_gb    = local.max_size_gb

  tags = {
    Environment = var.environment
    Application = "MeetingSummary"
  }
}

# Firewall rule (allow Azure services)
resource "azurerm_mssql_firewall_rule" "azure_services" {
  name             = "AllowAzureServices"
  server_id        = azurerm_mssql_server.main.id
  start_ip_address = "0.0.0.0"
  end_ip_address   = "0.0.0.0"
}
