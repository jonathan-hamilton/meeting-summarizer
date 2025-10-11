# DNS Zone module outputs

output "dns_zone_id" {
  description = "ID of the DNS Zone"
  value       = azurerm_dns_zone.main.id
}

output "dns_zone_name" {
  description = "Name of the DNS Zone"
  value       = azurerm_dns_zone.main.name
}

output "name_servers" {
  description = "Name servers for the DNS Zone"
  value       = azurerm_dns_zone.main.name_servers
}

output "www_domain" {
  description = "Full www domain name"
  value       = "${local.www_subdomain}.${var.domain_name}"
}

output "api_domain" {
  description = "Full API domain name"
  value       = "${local.api_subdomain}.${var.domain_name}"
}

output "staging_domain" {
  description = "Full staging domain name (if created)"
  value       = local.create_staging_records ? "${var.environment}-staging.${var.domain_name}" : null
}

output "root_domain" {
  description = "Root domain name"
  value       = var.domain_name
}

output "domain_verification_txt" {
  description = "Domain verification TXT record value"
  value       = "${var.app_service_hostname}.azurewebsites.net"
}