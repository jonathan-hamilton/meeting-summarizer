# Container Apps Infrastructure Module
resource "azurerm_container_app_environment" "main" {
  name                       = "${var.environment}-env-v2"
  location                  = var.location
  resource_group_name       = var.resource_group_name
  log_analytics_workspace_id = var.log_analytics_workspace_id

  tags = var.tags
}

# Container Registry for storing application images
resource "azurerm_container_registry" "main" {
  name                = "msio${var.environment}acr"
  resource_group_name = var.resource_group_name
  location           = var.location
  sku               = var.registry_sku
  admin_enabled     = true

  # Enable system-assigned managed identity
  identity {
    type = "SystemAssigned"
  }

  tags = var.tags
}

# Container App for the API
# Note: Initial deployment uses a placeholder image to avoid chicken-and-egg problem
# The CI/CD pipeline will update this with the actual application image after deployment
resource "azurerm_container_app" "api" {
  name                         = "${var.environment}-api-v2"
  container_app_environment_id = azurerm_container_app_environment.main.id
  resource_group_name         = var.resource_group_name
  revision_mode               = "Single"

  template {
    container {
      name   = "meeting-summarizer-api"
      # Use placeholder image during initial deployment - will be updated by CI/CD
      image  = "mcr.microsoft.com/dotnet/samples:aspnetapp"
      cpu    = var.cpu_limit
      memory = var.memory_limit

      # Environment variables
      env {
        name  = "ASPNETCORE_ENVIRONMENT"
        value = var.aspnet_environment
      }

      env {
        name  = "ASPNETCORE_URLS"
        value = "http://+:8080"
      }

      env {
        name        = "ConnectionStrings__DefaultConnection"
        secret_name = "connection-string"
      }

      env {
        name        = "OpenAI__ApiKey"
        secret_name = "openai-api-key"
      }

      env {
        name        = "AzureSpeech__ApiKey"
        secret_name = "azure-speech-key"
      }

      env {
        name  = "AzureSpeech__Region"
        value = var.location
      }
    }

    # Minimum and maximum replicas for auto-scaling
    min_replicas = var.min_replicas
    max_replicas = var.max_replicas
  }

  # Secrets configuration
  secret {
    name  = "connection-string"
    value = var.sql_connection_string
  }

  secret {
    name  = "openai-api-key"
    value = var.openai_api_key
  }

  secret {
    name  = "azure-speech-key"
    value = var.azure_speech_key
  }

  # Container Registry credentials for pulling images
  secret {
    name  = "acr-username"
    value = azurerm_container_registry.main.admin_username
  }

  secret {
    name  = "acr-password"
    value = azurerm_container_registry.main.admin_password
  }

  # Registry configuration for private registry access
  registry {
    server   = azurerm_container_registry.main.login_server
    username = azurerm_container_registry.main.admin_username
    password_secret_name = "acr-password"
  }

  # Ingress configuration for external access
  ingress {
    allow_insecure_connections = false
    external_enabled          = true
    target_port               = 8080

    traffic_weight {
      percentage      = 100
      latest_revision = true
    }
  }

  # Managed identity for accessing other Azure services
  identity {
    type = "SystemAssigned"
  }

  tags = var.tags

  depends_on = [
    azurerm_container_registry.main,
    azurerm_container_app_environment.main
  ]
}

# Note: Using admin_enabled = true on the Container Registry instead of role assignments
# This avoids permission issues with the GitHub Actions service principal
# The Container App can authenticate using the registry's admin credentials
# GitHub Actions will use the admin credentials for push operations