# Terraform variable definitions for Meeting Summary infrastructure

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
  default     = "West US 2"
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

variable "custom_domain_name" {
  description = "Custom domain name for the application (e.g., meeting-summary.io)"
  type        = string
  default     = ""
}

variable "create_dns_zone" {
  description = "Whether to create and manage Azure DNS Zone for the custom domain"
  type        = bool
  default     = false
}

variable "enable_custom_domain" {
  description = "Whether to configure custom domain binding on App Service"
  type        = bool
  default     = false
}
