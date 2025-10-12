# Terraform variable definitions for Meeting Summary infrastructure

variable "environment" {
  description = "Environment name (dev, prod)"
  type        = string
  validation {
    condition = contains(["dev", "prod"], var.environment)
    error_message = "Environment must be one of: dev, prod."
  }
}

variable "location" {
  description = "Location for all resources"
  type        = string
  default     = "westus"
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
  description = "Whether to configure custom domain binding on Container App"
  type        = bool
  default     = false
}

# Container Apps specific variables
variable "location_short" {
  description = "Short form of Azure region (e.g., eus for East US)"
  type        = string
  default     = "wus"
}

variable "container_cpu_limit" {
  description = "CPU limit for the container (in cores)"
  type        = number
  default     = 0.5
}

variable "container_memory_limit" {
  description = "Memory limit for the container (in Gi)"
  type        = string
  default     = "1.0Gi"
}

variable "container_min_replicas" {
  description = "Minimum number of container replicas"
  type        = number
  default     = 1
}

variable "container_max_replicas" {
  description = "Maximum number of container replicas"
  type        = number
  default     = 10
}

variable "aspnet_environment" {
  description = "ASP.NET Core environment name"
  type        = string
  default     = "Production"
}

variable "github_actions_object_id" {
  description = "Object ID of the GitHub Actions service principal for ACR access"
  type        = string
  default     = null
}
