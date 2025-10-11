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

output "app_service_name" {
  description = "Name of the App Service"
  value       = module.app_service.app_service_name
}

output "app_service_url" {
  description = "URL of the App Service"
  value       = module.app_service.app_service_url
}

output "staging_slot_name" {
  description = "Name of the staging slot (for blue-green deployment)"
  value       = module.app_service.staging_slot_name
}

output "staging_slot_url" {
  description = "URL of the staging slot"
  value       = module.app_service.staging_slot_url
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
  value       = module.app_service.www_domain_url
}

output "api_domain_url" {
  description = "URL for the API custom domain"  
  value       = module.app_service.api_domain_url
}

output "custom_domains" {
  description = "List of configured custom domains"
  value       = module.app_service.custom_domains
}

output "domain_configuration_summary" {
  description = "Summary of custom domain configuration"
  value = {
    domain_name = var.custom_domain_name
    dns_zone_created = var.create_dns_zone && var.custom_domain_name != ""
    custom_domain_enabled = var.enable_custom_domain
    www_domain = length(module.dns_zone) > 0 ? module.dns_zone[0].www_domain : null
    api_domain = length(module.dns_zone) > 0 ? module.dns_zone[0].api_domain : null
    staging_domain = length(module.dns_zone) > 0 ? module.dns_zone[0].staging_domain : null
  }
}
