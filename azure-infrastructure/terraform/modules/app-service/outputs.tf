# App Service module outputs

output "app_service_name" {
  description = "Name of the App Service"
  value       = azurerm_linux_web_app.main.name
}

output "app_service_url" {
  description = "URL of the App Service"
  value       = "https://${azurerm_linux_web_app.main.default_hostname}"
}

output "app_service_id" {
  description = "ID of the App Service"
  value       = azurerm_linux_web_app.main.id
}

output "service_plan_id" {
  description = "ID of the App Service Plan"
  value       = azurerm_service_plan.main.id
}

output "staging_slot_name" {
  description = "Name of the staging slot (for blue-green deployment)"
  value       = length(azurerm_linux_web_app_slot.staging) > 0 ? azurerm_linux_web_app_slot.staging[0].name : null
}

output "staging_slot_url" {
  description = "URL of the staging slot"
  value       = length(azurerm_linux_web_app_slot.staging) > 0 ? "https://${azurerm_linux_web_app.main.name}-staging.azurewebsites.net" : null
}

output "staging_slot_id" {
  description = "ID of the staging slot"
  value       = length(azurerm_linux_web_app_slot.staging) > 0 ? azurerm_linux_web_app_slot.staging[0].id : null
}

output "app_service_principal_id" {
  description = "Principal ID of the App Service managed identity"
  value       = azurerm_linux_web_app.main.identity[0].principal_id
}

output "staging_slot_principal_id" {
  description = "Principal ID of the staging slot managed identity"
  value       = length(azurerm_linux_web_app_slot.staging) > 0 ? azurerm_linux_web_app_slot.staging[0].identity[0].principal_id : null
}

# Custom Domain Outputs
output "www_domain_url" {
  description = "URL for the WWW custom domain"
  value       = length(azurerm_app_service_custom_hostname_binding.www) > 0 ? "https://${azurerm_app_service_custom_hostname_binding.www[0].hostname}" : null
}

output "api_domain_url" {
  description = "URL for the API custom domain"
  value       = length(azurerm_app_service_custom_hostname_binding.api) > 0 ? "https://${azurerm_app_service_custom_hostname_binding.api[0].hostname}" : null
}

output "custom_domains" {
  description = "List of configured custom domains"
  value = concat(
    length(azurerm_app_service_custom_hostname_binding.www) > 0 ? [azurerm_app_service_custom_hostname_binding.www[0].hostname] : [],
    length(azurerm_app_service_custom_hostname_binding.api) > 0 ? [azurerm_app_service_custom_hostname_binding.api[0].hostname] : []
  )
}

output "ssl_certificates" {
  description = "SSL certificate information"
  value = {
    www_certificate_id = length(azurerm_app_service_managed_certificate.www) > 0 ? azurerm_app_service_managed_certificate.www[0].id : null
    api_certificate_id = length(azurerm_app_service_managed_certificate.api) > 0 ? azurerm_app_service_managed_certificate.api[0].id : null
  }
}
