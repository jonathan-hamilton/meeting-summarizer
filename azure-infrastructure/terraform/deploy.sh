#!/bin/bash
# Terraform deployment script for Meeting Summary infrastructure

set -e  # Exit on any error

echo "=== Meeting Summary Infrastructure Deployment ==="

# Check if required tools are installed
command -v terraform >/dev/null 2>&1 || { echo "Error: Terraform is required but not installed." >&2; exit 1; }
command -v az >/dev/null 2>&1 || { echo "Error: Azure CLI is required but not installed." >&2; exit 1; }

# Check if terraform.tfvars exists
if [ ! -f "terraform.tfvars" ]; then
    echo "Error: terraform.tfvars file not found."
    echo "Please copy terraform.tfvars.example to terraform.tfvars and fill in your values."
    exit 1
fi

# Check Azure CLI login status
echo "Checking Azure CLI authentication..."
if ! az account show >/dev/null 2>&1; then
    echo "Error: Not logged into Azure. Please run 'az login' first."
    exit 1
fi

# Get current subscription
SUBSCRIPTION=$(az account show --query name -o tsv)
echo "Using Azure subscription: $SUBSCRIPTION"

# Initialize Terraform
echo "Initializing Terraform..."
terraform init

# Validate configuration
echo "Validating Terraform configuration..."
terraform validate

# Plan deployment
echo "Creating deployment plan..."
terraform plan -out=tfplan

# Confirm deployment
read -p "Do you want to apply this plan? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "Applying Terraform configuration..."
    terraform apply tfplan
    echo "=== Deployment Complete ==="
    echo "Run 'terraform output' to see the deployed resources."
else
    echo "Deployment cancelled."
    rm -f tfplan
fi
