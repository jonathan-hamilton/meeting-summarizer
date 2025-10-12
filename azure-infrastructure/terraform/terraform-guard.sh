#!/bin/bash

# Terraform Protection Script
# This script prevents manual terraform execution and redirects to CI/CD

set -e

# Colors for output
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
GREEN='\033[0;32m'
NC='\033[0m' # No Color

echo ""
echo -e "${RED}🚫 MANUAL TERRAFORM EXECUTION BLOCKED${NC}"
echo ""
echo -e "${YELLOW}⚠️  This Terraform configuration must be executed through GitHub Actions CI/CD pipeline${NC}"
echo ""

# Check if this is being run in CI/CD
if [[ "$GITHUB_ACTIONS" == "true" ]]; then
    echo -e "${GREEN}✅ Running in GitHub Actions - proceeding with terraform execution${NC}"
    echo ""
    exit 0
fi

# Block manual execution
echo -e "${RED}❌ Manual terraform execution is prohibited for:${NC}"
echo "   • Infrastructure consistency"
echo "   • Security compliance"
echo "   • Change management"
echo "   • Audit requirements"
echo ""

echo -e "${BLUE}📋 Correct Process:${NC}"
echo ""
echo -e "${GREEN}Development Environment:${NC}"
echo "   1. Make your changes and commit to any branch"
echo "   2. Push to GitHub"
echo "   3. GitHub Actions will automatically deploy to development"
echo ""
echo -e "${GREEN}Production Environment:${NC}"
echo "   1. Ensure changes are in main branch"
echo "   2. Go to GitHub Actions → 'Deploy to Production'"
echo "   3. Run workflow and wait for approval"
echo "   4. Monitor deployment progress"
echo ""

echo -e "${BLUE}🔗 Quick Links:${NC}"
echo "   • GitHub Actions: https://github.com/jonathan-hamilton/meeting-summarizer/actions"
echo "   • Documentation: docs/sprints/sprint_7/s7.1-deployment-operations-guide.md"
echo ""

echo -e "${YELLOW}🆘 Emergency? Contact DevOps team lead for authorization${NC}"
echo ""

exit 1