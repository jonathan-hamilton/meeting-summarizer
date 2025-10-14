@echo off
REM Terraform Protection Script for Windows
REM This script prevents manual terraform execution and redirects to CI/CD

echo.
echo 🚫 MANUAL TERRAFORM EXECUTION BLOCKED
echo.
echo ⚠️  This Terraform configuration must be executed through GitHub Actions CI/CD pipeline
echo.

REM Check if this is being run in CI/CD
if "%GITHUB_ACTIONS%"=="true" (
    echo ✅ Running in GitHub Actions - proceeding with terraform execution
    echo.
    exit /b 0
)

REM Block manual execution
echo ❌ Manual terraform execution is prohibited for:
echo    • Infrastructure consistency
echo    • Security compliance  
echo    • Change management
echo    • Audit requirements
echo.

echo 📋 Correct Process:
echo.
echo Development Environment:
echo    1. Make your changes and commit to any branch
echo    2. Push to GitHub
echo    3. GitHub Actions will automatically deploy to development
echo.
echo Production Environment:
echo    1. Ensure changes are in main branch
echo    2. Go to GitHub Actions → 'Deploy to Production'
echo    3. Run workflow and wait for approval
echo    4. Monitor deployment progress
echo.

echo 🔗 Quick Links:
echo    • GitHub Actions: https://github.com/jonathan-hamilton/meeting-summarizer/actions
echo    • Documentation: docs/sprints/sprint_7/s7.1-deployment-operations-guide.md
echo.

echo 🆘 Emergency? Contact DevOps team lead for authorization
echo.

exit /b 1