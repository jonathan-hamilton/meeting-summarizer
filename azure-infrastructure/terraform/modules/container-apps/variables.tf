# Container Apps Module Variables
variable "environment" {
  description = "Environment name (dev, prod)"
  type        = string
  validation {
    condition     = contains(["dev", "prod"], var.environment)
    error_message = "Environment must be one of: dev, prod."
  }
}

variable "location" {
  description = "Azure region where resources will be created"
  type        = string
}

variable "location_short" {
  description = "Short form of Azure region (e.g., eus for East US)"
  type        = string
}

variable "random_suffix" {
  description = "Random suffix for unique naming"
  type        = string
}

variable "resource_group_name" {
  description = "Name of the resource group"
  type        = string
}

variable "log_analytics_workspace_id" {
  description = "ID of the Log Analytics workspace for Container App Environment"
  type        = string
}

variable "tags" {
  description = "A map of tags to assign to the resources"
  type        = map(string)
  default     = {}
}

# Container Registry Variables
variable "registry_sku" {
  description = "SKU for the Container Registry"
  type        = string
  default     = "Basic"
  validation {
    condition     = contains(["Basic", "Standard", "Premium"], var.registry_sku)
    error_message = "Registry SKU must be one of: Basic, Standard, Premium."
  }
}

# Container App Variables
variable "cpu_limit" {
  description = "CPU limit for the container (in cores)"
  type        = number
  default     = 0.5
  validation {
    condition     = var.cpu_limit >= 0.25 && var.cpu_limit <= 4.0
    error_message = "CPU limit must be between 0.25 and 4.0 cores."
  }
}

variable "memory_limit" {
  description = "Memory limit for the container (in Gi)"
  type        = string
  default     = "1.0Gi"
}

variable "min_replicas" {
  description = "Minimum number of replicas"
  type        = number
  default     = 1
  validation {
    condition     = var.min_replicas >= 0 && var.min_replicas <= 25
    error_message = "Min replicas must be between 0 and 25."
  }
}

variable "max_replicas" {
  description = "Maximum number of replicas"
  type        = number
  default     = 10
  validation {
    condition     = var.max_replicas >= 1 && var.max_replicas <= 25
    error_message = "Max replicas must be between 1 and 25."
  }
}

variable "scale_concurrent_requests" {
  description = "Number of concurrent requests that trigger scaling"
  type        = number
  default     = 50
}

variable "aspnet_environment" {
  description = "ASP.NET Core environment name"
  type        = string
  default     = "Production"
}

# Secret Variables
variable "sql_connection_string" {
  description = "SQL Database connection string"
  type        = string
  sensitive   = true
}

variable "openai_api_key" {
  description = "OpenAI API key"
  type        = string
  sensitive   = true
}

variable "azure_speech_key" {
  description = "Azure Speech Services API key"
  type        = string
  sensitive   = true
}

# GitHub Actions Integration
variable "github_actions_object_id" {
  description = "Object ID of the GitHub Actions service principal for ACR access"
  type        = string
  default     = null
}