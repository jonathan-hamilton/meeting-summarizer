# Cognitive Services module outputs

output "speech_service_name" {
  description = "Name of the Speech Service"
  value       = azurerm_cognitive_account.speech.name
}

output "speech_key" {
  description = "Primary access key for Speech Service"
  value       = azurerm_cognitive_account.speech.primary_access_key
  sensitive   = true
}

output "speech_endpoint" {
  description = "Endpoint for Speech Service"
  value       = azurerm_cognitive_account.speech.endpoint
}

output "speech_region" {
  description = "Region/Location of Speech Service"
  value       = azurerm_cognitive_account.speech.location
}
