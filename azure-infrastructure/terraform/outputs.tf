# Terraform outputs for Meeting Summary infrastructure

output "resource_group_name" {
  description = "Name of the resource group"
  value       = azurerm_resource_group.main.name
}

output "key_vault_name" {
  description = "Name of the Key Vault"
  value       = module.key_vault.key_vault_name
}

output "key_vault_uri" {
  description = "URI of the Key Vault"
  value       = module.key_vault.key_vault_uri
}

output "container_app_name" {
  description = "Name of the Container App"
  value       = module.container_apps.container_app_name
}

output "container_app_url" {
  description = "URL of the Container App"
  value       = module.container_apps.container_app_url
}

output "container_app_fqdn" {
  description = "Fully qualified domain name of the Container App"
  value       = module.container_apps.container_app_fqdn
}

output "container_registry_name" {
  description = "Name of the Container Registry"
  value       = module.container_apps.container_registry_name
}

output "container_registry_login_server" {
  description = "Login server URL of the Container Registry"
  value       = module.container_apps.container_registry_login_server
}

output "storage_account_name" {
  description = "Name of the Storage Account"
  value       = module.storage.storage_account_name
}

output "sql_server_name" {
  description = "Name of the SQL Server"
  value       = module.sql_database.sql_server_name
}

output "database_name" {
  description = "Name of the database"
  value       = module.sql_database.database_name
}

output "speech_service_name" {
  description = "Name of the Speech Service"
  value       = module.cognitive_services.speech_service_name
}

output "environment" {
  description = "Environment name"
  value       = var.environment
}

# Custom Domain Outputs
output "dns_zone_id" {
  description = "ID of the DNS Zone (if created)"
  value       = length(module.dns_zone) > 0 ? module.dns_zone[0].dns_zone_id : null
}

output "dns_name_servers" {
  description = "Name servers for the DNS Zone (if created)"
  value       = length(module.dns_zone) > 0 ? module.dns_zone[0].name_servers : null
}

output "www_domain_url" {
  description = "URL for the WWW custom domain"
  value       = var.enable_custom_domain && var.custom_domain_name != "" ? "https://www.${var.custom_domain_name}" : null
}

output "api_domain_url" {
  description = "URL for the API custom domain"  
  value       = var.enable_custom_domain && var.custom_domain_name != "" ? "https://api.${var.custom_domain_name}" : null
}

output "custom_domains" {
  description = "List of configured custom domains"
  value       = var.enable_custom_domain && var.custom_domain_name != "" ? [
    "www.${var.custom_domain_name}",
    "api.${var.custom_domain_name}"
  ] : []
}

output "domain_configuration_summary" {
  description = "Summary of custom domain configuration"
  value = {
    domain_name = var.custom_domain_name
    dns_zone_created = var.create_dns_zone && var.custom_domain_name != ""
    custom_domain_enabled = var.enable_custom_domain
    www_domain = length(module.dns_zone) > 0 ? module.dns_zone[0].www_domain : null
    api_domain = length(module.dns_zone) > 0 ? module.dns_zone[0].api_domain : null
    container_app_url = module.container_apps.container_app_url
    container_registry_url = module.container_apps.container_registry_login_server
  }
}
