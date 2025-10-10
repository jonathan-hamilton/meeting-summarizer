#!/bin/bash

# Emergency Rollback Script for Meeting Summary Application
# This script provides immediate rollback capabilities for production deployments

set -e

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
AZURE_SUBSCRIPTION_ID="${AZURE_SUBSCRIPTION_ID}"
RESOURCE_GROUP="rg-meetingsummary-prod"
APP_SERVICE_NAME=""
ROLLBACK_TYPE="slot-swap"
CONFIRM=false
VERBOSE=false

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Usage information
usage() {
    echo "Usage: $0 -a <app_service_name> [-t rollback_type] [-y] [-v] [-h]"
    echo ""
    echo "Arguments:"
    echo "  -a, --app-service   Azure App Service name (required)"
    echo "  -t, --type         Rollback type: slot-swap, infrastructure, database (default: slot-swap)"
    echo "  -y, --yes          Skip confirmation prompts"
    echo "  -v, --verbose      Enable verbose output"
    echo "  -h, --help         Show this help message"
    echo ""
    echo "Rollback Types:"
    echo "  slot-swap     - Swap production and staging slots (fastest)"
    echo "  infrastructure - Rollback infrastructure to previous Terraform state"
    echo "  database      - Rollback database migrations (dangerous)"
    echo ""
    echo "Examples:"
    echo "  $0 -a app-meetingsummary-prod -t slot-swap -y"
    echo "  $0 -a app-meetingsummary-prod -t infrastructure -v"
}

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_verbose() {
    if [ "$VERBOSE" = true ]; then
        echo -e "${BLUE}[DEBUG]${NC} $1"
    fi
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -a|--app-service)
            APP_SERVICE_NAME="$2"
            shift 2
            ;;
        -t|--type)
            ROLLBACK_TYPE="$2"
            shift 2
            ;;
        -y|--yes)
            CONFIRM=true
            shift
            ;;
        -v|--verbose)
            VERBOSE=true
            shift
            ;;
        -h|--help)
            usage
            exit 0
            ;;
        *)
            echo "Unknown option: $1"
            usage
            exit 1
            ;;
    esac
done

# Validate required parameters
if [ -z "$APP_SERVICE_NAME" ]; then
    log_error "App Service name is required"
    usage
    exit 1
fi

# Validate rollback type
case $ROLLBACK_TYPE in
    slot-swap|infrastructure|database)
        ;;
    *)
        log_error "Invalid rollback type: $ROLLBACK_TYPE"
        usage
        exit 1
        ;;
esac

# Confirmation function
confirm_action() {
    local action="$1"
    
    if [ "$CONFIRM" = true ]; then
        return 0
    fi
    
    echo ""
    log_warning "🚨 EMERGENCY ROLLBACK CONFIRMATION 🚨"
    echo ""
    echo "Action: $action"
    echo "App Service: $APP_SERVICE_NAME"
    echo "Resource Group: $RESOURCE_GROUP"
    echo "Type: $ROLLBACK_TYPE"
    echo ""
    echo "This action will:"
    
    case $ROLLBACK_TYPE in
        slot-swap)
            echo "  - Immediately swap production and staging slots"
            echo "  - Revert traffic to the previous deployment"
            echo "  - Take effect within 30 seconds"
            ;;
        infrastructure)
            echo "  - Revert Azure infrastructure to previous Terraform state"
            echo "  - May require application restart"
            echo "  - Take 5-10 minutes to complete"
            ;;
        database)
            echo "  - Rollback database migrations"
            echo "  - POTENTIAL DATA LOSS if migrations modified data"
            echo "  - May require application restart"
            ;;
    esac
    
    echo ""
    read -p "Are you sure you want to proceed? (type 'ROLLBACK' to confirm): " confirmation
    
    if [ "$confirmation" != "ROLLBACK" ]; then
        log_info "Rollback cancelled by user"
        exit 0
    fi
}

# Check Azure CLI login
check_azure_login() {
    log_info "Checking Azure CLI authentication..."
    
    if ! az account show >/dev/null 2>&1; then
        log_error "Not logged in to Azure CLI"
        log_info "Please run: az login"
        exit 1
    fi
    
    local current_subscription=$(az account show --query id -o tsv)
    log_verbose "Current subscription: $current_subscription"
    
    if [ -n "$AZURE_SUBSCRIPTION_ID" ] && [ "$current_subscription" != "$AZURE_SUBSCRIPTION_ID" ]; then
        log_info "Setting subscription to: $AZURE_SUBSCRIPTION_ID"
        az account set --subscription "$AZURE_SUBSCRIPTION_ID"
    fi
    
    log_success "Azure CLI authentication verified"
}

# Verify App Service exists
verify_app_service() {
    log_info "Verifying App Service: $APP_SERVICE_NAME"
    
    if ! az webapp show --name "$APP_SERVICE_NAME" --resource-group "$RESOURCE_GROUP" >/dev/null 2>&1; then
        log_error "App Service not found: $APP_SERVICE_NAME in $RESOURCE_GROUP"
        exit 1
    fi
    
    log_success "App Service verified"
}

# Pre-rollback health check
pre_rollback_health_check() {
    log_info "Performing pre-rollback health check..."
    
    local production_url="https://${APP_SERVICE_NAME}.azurewebsites.net"
    local staging_url="https://${APP_SERVICE_NAME}-staging.azurewebsites.net"
    
    # Check current production status
    local prod_status=$(curl -s -o /dev/null -w "%{http_code}" "$production_url/health" 2>/dev/null || echo "000")
    log_info "Current production health: $prod_status"
    
    # Check staging slot status (what we'll roll back to)
    local staging_status=$(curl -s -o /dev/null -w "%{http_code}" "$staging_url/health" 2>/dev/null || echo "000")
    log_info "Staging slot health (rollback target): $staging_status"
    
    if [ "$staging_status" != "200" ] && [ "$ROLLBACK_TYPE" = "slot-swap" ]; then
        log_warning "Staging slot is not healthy (status: $staging_status)"
        log_warning "Rolling back to this version may not resolve issues"
        
        if [ "$CONFIRM" != true ]; then
            read -p "Continue with rollback anyway? (y/N): " continue_anyway
            if [[ ! "$continue_anyway" =~ ^[Yy]$ ]]; then
                log_info "Rollback cancelled"
                exit 0
            fi
        fi
    fi
}

# Slot swap rollback
rollback_slot_swap() {
    log_info "🔄 Performing slot swap rollback..."
    
    # Get current slot configuration
    log_verbose "Checking current slot configuration..."
    local slots=$(az webapp deployment slot list --name "$APP_SERVICE_NAME" --resource-group "$RESOURCE_GROUP" --query "[].name" -o tsv)
    
    if ! echo "$slots" | grep -q "staging"; then
        log_error "Staging slot not found - cannot perform slot swap rollback"
        exit 1
    fi
    
    # Perform the swap
    log_info "Swapping staging slot to production..."
    az webapp deployment slot swap \
        --name "$APP_SERVICE_NAME" \
        --resource-group "$RESOURCE_GROUP" \
        --slot staging \
        --target-slot production
    
    log_success "Slot swap completed"
    
    # Brief wait for DNS propagation
    log_info "Waiting for DNS propagation..."
    sleep 30
    
    # Verify rollback
    log_info "Verifying rollback..."
    local health_status=$(curl -s -o /dev/null -w "%{http_code}" "https://${APP_SERVICE_NAME}.azurewebsites.net/health" 2>/dev/null || echo "000")
    
    if [ "$health_status" = "200" ]; then
        log_success "✅ Rollback successful - application is responding"
    else
        log_error "❌ Rollback may have failed - health check returned: $health_status"
        exit 1
    fi
}

# Infrastructure rollback
rollback_infrastructure() {
    log_info "🏗️ Performing infrastructure rollback..."
    
    # Check if we're in a repository with Terraform
    if [ ! -d "azure-infrastructure/terraform" ]; then
        log_error "Terraform infrastructure directory not found"
        log_error "This script must be run from the repository root"
        exit 1
    fi
    
    cd azure-infrastructure/terraform
    
    # Initialize Terraform
    log_info "Initializing Terraform..."
    terraform init \
        -backend-config="storage_account_name=${TERRAFORM_STORAGE_ACCOUNT}" \
        -backend-config="container_name=${TERRAFORM_CONTAINER}" \
        -backend-config="key=prod.terraform.tfstate" \
        -backend-config="resource_group_name=${TERRAFORM_RESOURCE_GROUP}"
    
    # List available state versions
    log_info "Available Terraform state versions:"
    az storage blob list \
        --account-name "${TERRAFORM_STORAGE_ACCOUNT}" \
        --container-name "${TERRAFORM_CONTAINER}" \
        --prefix "prod.terraform.tfstate" \
        --query "[].name" \
        -o table
    
    log_warning "Manual intervention required for infrastructure rollback"
    log_info "Steps:"
    log_info "1. Identify the correct state backup to restore"
    log_info "2. Download and restore the state file"
    log_info "3. Run terraform plan and apply to revert changes"
    
    exit 1
}

# Database rollback
rollback_database() {
    log_info "🗄️ Performing database rollback..."
    
    log_error "🚨 DATABASE ROLLBACK IS EXTREMELY DANGEROUS 🚨"
    log_error "This operation can cause permanent data loss!"
    
    if [ "$CONFIRM" != true ]; then
        echo ""
        log_warning "Database rollback requires manual intervention due to data safety"
        log_info "Recommended steps:"
        log_info "1. Create a full database backup before proceeding"
        log_info "2. Identify the exact migration to rollback to"
        log_info "3. Test rollback on a copy of production data first"
        log_info "4. Coordinate with the development team"
        echo ""
        read -p "Do you want to proceed with manual database rollback guidance? (y/N): " proceed
        
        if [[ ! "$proceed" =~ ^[Yy]$ ]]; then
            log_info "Database rollback cancelled"
            exit 0
        fi
    fi
    
    log_info "Database rollback guidance:"
    log_info "1. Connect to production database"
    log_info "2. Create backup: CREATE DATABASE MeetingSummarizerDb_Backup AS COPY OF MeetingSummarizerDb"
    log_info "3. Check migration history: SELECT * FROM __EFMigrationsHistory ORDER BY MigrationId DESC"
    log_info "4. Identify target migration to rollback to"
    log_info "5. Use Entity Framework CLI: dotnet ef database update <target-migration> --connection <connection-string>"
    
    log_warning "Manual database rollback guidance provided - automated rollback not performed"
}

# Post-rollback verification
post_rollback_verification() {
    log_info "🧪 Performing post-rollback verification..."
    
    local base_url="https://${APP_SERVICE_NAME}.azurewebsites.net"
    
    # Run comprehensive health check
    if [ -f "$SCRIPT_DIR/health-check.sh" ]; then
        log_info "Running comprehensive health check..."
        bash "$SCRIPT_DIR/health-check.sh" -u "$base_url" -t 30 -r 3
        
        if [ $? -eq 0 ]; then
            log_success "✅ Post-rollback health check passed"
        else
            log_error "❌ Post-rollback health check failed"
            log_error "Additional investigation required"
            exit 1
        fi
    else
        # Basic health check
        log_info "Running basic health check..."
        local health_status=$(curl -s -o /dev/null -w "%{http_code}" "$base_url/health" 2>/dev/null || echo "000")
        
        if [ "$health_status" = "200" ]; then
            log_success "Basic health check passed"
        else
            log_error "Basic health check failed: $health_status"
            exit 1
        fi
    fi
    
    # Check response time
    local start_time=$(date +%s%3N)
    curl -s "$base_url/health" >/dev/null 2>&1
    local end_time=$(date +%s%3N)
    local response_time=$((end_time - start_time))
    
    log_info "Response time: ${response_time}ms"
    
    if [ $response_time -lt 2000 ]; then
        log_success "Response time acceptable"
    else
        log_warning "Response time slower than expected: ${response_time}ms"
    fi
}

# Generate rollback report
generate_rollback_report() {
    log_info "📋 Generating rollback report..."
    
    local report_file="rollback-report-$(date +%Y%m%d-%H%M%S).txt"
    
    cat > "$report_file" << EOF
EMERGENCY ROLLBACK REPORT
========================

Timestamp: $(date -u)
Operator: $(whoami)
App Service: $APP_SERVICE_NAME
Resource Group: $RESOURCE_GROUP
Rollback Type: $ROLLBACK_TYPE

Pre-Rollback Status:
- Production URL: https://${APP_SERVICE_NAME}.azurewebsites.net
- Staging URL: https://${APP_SERVICE_NAME}-staging.azurewebsites.net

Rollback Actions Performed:
EOF
    
    case $ROLLBACK_TYPE in
        slot-swap)
            echo "- Swapped production and staging deployment slots" >> "$report_file"
            echo "- Previous production version moved to staging slot" >> "$report_file"
            echo "- Traffic immediately redirected to previous version" >> "$report_file"
            ;;
        infrastructure)
            echo "- Infrastructure rollback guidance provided" >> "$report_file"
            echo "- Manual Terraform state restoration required" >> "$report_file"
            ;;
        database)
            echo "- Database rollback guidance provided" >> "$report_file"
            echo "- Manual database migration rollback required" >> "$report_file"
            ;;
    esac
    
    cat >> "$report_file" << EOF

Post-Rollback Verification:
- Health check status: $(curl -s -o /dev/null -w "%{http_code}" "https://${APP_SERVICE_NAME}.azurewebsites.net/health" 2>/dev/null || echo "Failed")
- Application responding: $([ "$(curl -s -o /dev/null -w "%{http_code}" "https://${APP_SERVICE_NAME}.azurewebsites.net/health" 2>/dev/null)" = "200" ] && echo "Yes" || echo "No")

Next Steps:
1. Monitor application performance and error rates
2. Notify stakeholders of rollback completion
3. Investigate root cause of original deployment issue
4. Plan corrective measures for next deployment

Report generated: $(date -u)
EOF
    
    log_success "Rollback report saved: $report_file"
}

# Main rollback execution
main() {
    echo ""
    log_info "🚨 EMERGENCY ROLLBACK INITIATED 🚨"
    log_info "App Service: $APP_SERVICE_NAME"
    log_info "Type: $ROLLBACK_TYPE"
    echo ""
    
    # Confirm the action
    confirm_action "Emergency Rollback"
    
    # Pre-flight checks
    check_azure_login
    verify_app_service
    pre_rollback_health_check
    
    # Record start time
    local start_time=$(date +%s)
    
    # Perform rollback based on type
    case $ROLLBACK_TYPE in
        slot-swap)
            rollback_slot_swap
            ;;
        infrastructure)
            rollback_infrastructure
            ;;
        database)
            rollback_database
            ;;
    esac
    
    # Post-rollback verification
    if [ "$ROLLBACK_TYPE" = "slot-swap" ]; then
        post_rollback_verification
    fi
    
    # Calculate duration
    local end_time=$(date +%s)
    local duration=$((end_time - start_time))
    
    # Generate report
    generate_rollback_report
    
    echo ""
    log_success "🎉 ROLLBACK COMPLETED SUCCESSFULLY 🎉"
    log_info "Duration: ${duration} seconds"
    log_info "Application URL: https://${APP_SERVICE_NAME}.azurewebsites.net"
    echo ""
    log_info "Next steps:"
    log_info "1. Monitor application for stability"
    log_info "2. Notify team and stakeholders"
    log_info "3. Investigate original deployment issue"
    log_info "4. Plan corrective measures"
    echo ""
}

# Run main function
main "$@"