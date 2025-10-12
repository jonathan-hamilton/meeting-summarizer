# Container Apps Infrastructure Module
resource "azurerm_container_app_environment" "main" {
  name                       = "${var.environment}-${var.location_short}-containerenv"
  location                  = var.location
  resource_group_name       = var.resource_group_name
  log_analytics_workspace_id = var.log_analytics_workspace_id

  tags = var.tags
}

# Container Registry for storing application images
resource "azurerm_container_registry" "main" {
  name                = "${var.environment}${var.location_short}registry"
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
resource "azurerm_container_app" "api" {
  name                         = "${var.environment}-${var.location_short}-api"
  container_app_environment_id = azurerm_container_app_environment.main.id
  resource_group_name         = var.resource_group_name
  revision_mode               = "Single"

  template {
    container {
      name   = "meeting-summarizer-api"
      image  = "${azurerm_container_registry.main.login_server}/meeting-summarizer-api:latest"
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

# Grant Container App permission to pull images from Container Registry
resource "azurerm_role_assignment" "container_app_acr_pull" {
  scope                = azurerm_container_registry.main.id
  role_definition_name = "AcrPull"
  principal_id         = azurerm_container_app.api.identity[0].principal_id
}

# Grant Container Registry permission for GitHub Actions CI/CD
resource "azurerm_role_assignment" "github_actions_acr_push" {
  count                = var.github_actions_object_id != null ? 1 : 0
  scope               = azurerm_container_registry.main.id
  role_definition_name = "AcrPush"
  principal_id        = var.github_actions_object_id
}