#!/bin/bash

# Health Check Script for Meeting Summary Application
# This script performs comprehensive health validation of the deployed application

set -e

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TIMEOUT=30
MAX_RETRIES=5
VERBOSE=false

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Usage information
usage() {
    echo "Usage: $0 -u <base_url> [-t timeout] [-r retries] [-v] [-h]"
    echo ""
    echo "Arguments:"
    echo "  -u, --url       Base URL of the application (required)"
    echo "  -t, --timeout   Request timeout in seconds (default: 30)"
    echo "  -r, --retries   Maximum number of retries (default: 5)"
    echo "  -v, --verbose   Enable verbose output"
    echo "  -h, --help      Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 -u https://app-meetingsummary-dev.azurewebsites.net"
    echo "  $0 -u https://app-meetingsummary-prod.azurewebsites.net -t 60 -r 3 -v"
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
        -u|--url)
            BASE_URL="$2"
            shift 2
            ;;
        -t|--timeout)
            TIMEOUT="$2"
            shift 2
            ;;
        -r|--retries)
            MAX_RETRIES="$2"
            shift 2
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
if [ -z "$BASE_URL" ]; then
    log_error "Base URL is required"
    usage
    exit 1
fi

# Remove trailing slash from URL
BASE_URL=${BASE_URL%/}

log_info "Starting health checks for: $BASE_URL"
log_info "Timeout: ${TIMEOUT}s, Max retries: $MAX_RETRIES"

# Track overall status
OVERALL_STATUS=0
CHECKS_PASSED=0
CHECKS_FAILED=0

# Function to make HTTP request with retries
make_request() {
    local url="$1"
    local expected_status="$2"
    local description="$3"
    local retries=0
    
    log_info "Testing: $description"
    log_verbose "URL: $url"
    log_verbose "Expected status: $expected_status"
    
    while [ $retries -lt $MAX_RETRIES ]; do
        if [ $retries -gt 0 ]; then
            log_verbose "Retry attempt $retries/$MAX_RETRIES"
            sleep 5
        fi
        
        # Make the request
        response=$(curl -s -w "%{http_code}|%{time_total}" \
                       --connect-timeout $TIMEOUT \
                       --max-time $TIMEOUT \
                       "$url" 2>/dev/null || echo "000|0")
        
        status_code=$(echo "$response" | cut -d'|' -f1)
        response_time=$(echo "$response" | cut -d'|' -f2)
        response_body=$(echo "$response" | cut -d'|' -f3-)
        
        log_verbose "Response: Status=$status_code, Time=${response_time}s"
        
        # Check if status matches expected
        if [[ "$status_code" =~ $expected_status ]]; then
            log_success "$description - Status: $status_code, Time: ${response_time}s"
            CHECKS_PASSED=$((CHECKS_PASSED + 1))
            return 0
        else
            log_warning "$description - Failed with status: $status_code (attempt $((retries + 1)))"
            retries=$((retries + 1))
        fi
    done
    
    log_error "$description - Failed after $MAX_RETRIES attempts"
    CHECKS_FAILED=$((CHECKS_FAILED + 1))
    OVERALL_STATUS=1
    return 1
}

# Function to test JSON endpoint and parse response
test_json_endpoint() {
    local url="$1"
    local description="$2"
    local retries=0
    
    log_info "Testing JSON endpoint: $description"
    log_verbose "URL: $url"
    
    while [ $retries -lt $MAX_RETRIES ]; do
        if [ $retries -gt 0 ]; then
            log_verbose "Retry attempt $retries/$MAX_RETRIES"
            sleep 5
        fi
        
        # Make the request and capture both status and body
        response=$(curl -s -w "%{http_code}" \
                       --connect-timeout $TIMEOUT \
                       --max-time $TIMEOUT \
                       "$url" 2>/dev/null || echo "000")
        
        status_code="${response: -3}"
        response_body="${response%???}"
        
        log_verbose "Response status: $status_code"
        log_verbose "Response body: $response_body"
        
        if [ "$status_code" = "200" ]; then
            # Try to parse JSON
            if echo "$response_body" | jq . >/dev/null 2>&1; then
                log_success "$description - Valid JSON response received"
                
                # Extract specific fields if available
                if echo "$response_body" | jq -e '.status' >/dev/null 2>&1; then
                    app_status=$(echo "$response_body" | jq -r '.status')
                    log_info "Application status: $app_status"
                fi
                
                if echo "$response_body" | jq -e '.database' >/dev/null 2>&1; then
                    db_status=$(echo "$response_body" | jq -r '.database.status // .database')
                    log_info "Database status: $db_status"
                fi
                
                CHECKS_PASSED=$((CHECKS_PASSED + 1))
                return 0
            else
                log_warning "$description - Invalid JSON response"
            fi
        else
            log_warning "$description - HTTP $status_code (attempt $((retries + 1)))"
        fi
        
        retries=$((retries + 1))
    done
    
    log_error "$description - Failed after $MAX_RETRIES attempts"
    CHECKS_FAILED=$((CHECKS_FAILED + 1))
    OVERALL_STATUS=1
    return 1
}

# ======================
# BASIC HEALTH CHECKS
# ======================

log_info "=== Basic Health Checks ==="

# Basic health endpoint
make_request "$BASE_URL/health" "200" "Basic health endpoint"

# Detailed health endpoint (JSON)
test_json_endpoint "$BASE_URL/health/detailed" "Detailed health endpoint"

# Ready endpoint
make_request "$BASE_URL/health/ready" "200" "Ready endpoint"

# ======================
# API ENDPOINT CHECKS
# ======================

log_info "=== API Endpoint Checks ==="

# Authentication endpoint (should return 401 for unauthenticated requests)
make_request "$BASE_URL/api/auth/status" "401|200" "Authentication status endpoint"

# Transcription endpoint (should require authentication)
make_request "$BASE_URL/api/summary/transcribe" "401|405" "Transcription endpoint"

# Health endpoint via API path
make_request "$BASE_URL/api/health" "200|404" "API health endpoint"

# ======================
# SECURITY CHECKS
# ======================

log_info "=== Security Checks ==="

# Check for security headers
security_response=$(curl -s -I --connect-timeout $TIMEOUT "$BASE_URL/health" 2>/dev/null || echo "")

if echo "$security_response" | grep -i "x-frame-options" >/dev/null; then
    log_success "X-Frame-Options header present"
    CHECKS_PASSED=$((CHECKS_PASSED + 1))
else
    log_warning "X-Frame-Options header missing"
    CHECKS_FAILED=$((CHECKS_FAILED + 1))
fi

if echo "$security_response" | grep -i "x-content-type-options" >/dev/null; then
    log_success "X-Content-Type-Options header present"
    CHECKS_PASSED=$((CHECKS_PASSED + 1))
else
    log_warning "X-Content-Type-Options header missing"
    CHECKS_FAILED=$((CHECKS_FAILED + 1))
fi

# Check HTTPS redirection (if using HTTP)
if [[ "$BASE_URL" == http://* ]]; then
    log_info "Testing HTTPS redirection"
    https_url="${BASE_URL/http:/https:}"
    make_request "$https_url/health" "200" "HTTPS redirection"
fi

# ======================
# PERFORMANCE CHECKS
# ======================

log_info "=== Performance Checks ==="

# Measure response time for health endpoint
log_info "Measuring response time for health endpoint"
for i in {1..3}; do
    start_time=$(date +%s%3N)
    response=$(curl -s --connect-timeout $TIMEOUT "$BASE_URL/health" >/dev/null 2>&1)
    end_time=$(date +%s%3N)
    
    response_time=$((end_time - start_time))
    log_info "Response time (attempt $i): ${response_time}ms"
    
    if [ $response_time -lt 2000 ]; then
        log_success "Response time acceptable: ${response_time}ms"
    elif [ $response_time -lt 5000 ]; then
        log_warning "Response time slow: ${response_time}ms"
    else
        log_error "Response time too slow: ${response_time}ms"
        OVERALL_STATUS=1
    fi
done

# ======================
# DATABASE CONNECTIVITY
# ======================

log_info "=== Database Connectivity ==="

# Test database through detailed health endpoint
db_response=$(curl -s --connect-timeout $TIMEOUT "$BASE_URL/health/detailed" 2>/dev/null || echo "{}")

if echo "$db_response" | jq -e '.database' >/dev/null 2>&1; then
    db_status=$(echo "$db_response" | jq -r '.database.status // .database')
    
    if [ "$db_status" = "healthy" ] || [ "$db_status" = "true" ] || [ "$db_status" = "Healthy" ]; then
        log_success "Database connectivity verified"
        CHECKS_PASSED=$((CHECKS_PASSED + 1))
    else
        log_error "Database connectivity issues: $db_status"
        CHECKS_FAILED=$((CHECKS_FAILED + 1))
        OVERALL_STATUS=1
    fi
else
    log_warning "Database status not available in health response"
    CHECKS_FAILED=$((CHECKS_FAILED + 1))
fi

# ======================
# EXTERNAL DEPENDENCIES
# ======================

log_info "=== External Dependencies ==="

# Check if external services are reported as healthy
if echo "$db_response" | jq -e '.openai' >/dev/null 2>&1; then
    openai_status=$(echo "$db_response" | jq -r '.openai.status // .openai')
    log_info "OpenAI service status: $openai_status"
fi

if echo "$db_response" | jq -e '.storage' >/dev/null 2>&1; then
    storage_status=$(echo "$db_response" | jq -r '.storage.status // .storage')
    log_info "Azure Storage status: $storage_status"
fi

if echo "$db_response" | jq -e '.keyvault' >/dev/null 2>&1; then
    kv_status=$(echo "$db_response" | jq -r '.keyvault.status // .keyvault')
    log_info "Key Vault status: $kv_status"
fi

# ======================
# SUMMARY
# ======================

log_info "=== Health Check Summary ==="

TOTAL_CHECKS=$((CHECKS_PASSED + CHECKS_FAILED))
SUCCESS_RATE=$(echo "scale=1; $CHECKS_PASSED * 100 / $TOTAL_CHECKS" | bc -l 2>/dev/null || echo "0")

echo ""
echo "======================================"
echo "HEALTH CHECK RESULTS"
echo "======================================"
echo "Application URL: $BASE_URL"
echo "Total Checks: $TOTAL_CHECKS"
echo "Passed: $CHECKS_PASSED"
echo "Failed: $CHECKS_FAILED"
echo "Success Rate: ${SUCCESS_RATE}%"
echo "======================================"

if [ $OVERALL_STATUS -eq 0 ]; then
    log_success "All critical health checks passed!"
    echo "✅ Application is healthy and ready for traffic"
else
    log_error "Some health checks failed!"
    echo "❌ Application may have issues - review failed checks"
fi

echo ""
exit $OVERALL_STATUS