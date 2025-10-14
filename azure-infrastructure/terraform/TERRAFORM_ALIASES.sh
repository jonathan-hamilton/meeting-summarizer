# Terraform Manual Execution Prevention

# Add these aliases to prevent manual terraform execution
# Add to your ~/.bashrc, ~/.zshrc, or PowerShell profile

# Bash/Zsh aliases
alias terraform='echo "🚫 Manual terraform blocked - use CI/CD pipeline. See azure-infrastructure/terraform/MANUAL_EXECUTION_BLOCKED.md" && false'
alias tf='echo "🚫 Manual terraform blocked - use CI/CD pipeline. See azure-infrastructure/terraform/MANUAL_EXECUTION_BLOCKED.md" && false'

# PowerShell function (add to your $PROFILE)
function terraform {
    Write-Host "🚫 Manual terraform blocked - use CI/CD pipeline" -ForegroundColor Red
    Write-Host "See azure-infrastructure/terraform/MANUAL_EXECUTION_BLOCKED.md" -ForegroundColor Yellow
    throw "Manual terraform execution is prohibited"
}

function tf {
    Write-Host "🚫 Manual terraform blocked - use CI/CD pipeline" -ForegroundColor Red  
    Write-Host "See azure-infrastructure/terraform/MANUAL_EXECUTION_BLOCKED.md" -ForegroundColor Yellow
    throw "Manual terraform execution is prohibited"
}

# Alternative: Create wrapper scripts that check for CI/CD context
# Place these in your PATH before the real terraform binary

# To temporarily bypass (emergency only):
# unalias terraform  # Bash/Zsh
# Remove-Item Function:terraform  # PowerShell