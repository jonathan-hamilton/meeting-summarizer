# VS Code MSSQL Invitation Code Creator
# This script must be run from within VS Code with the MSSQL extension
# Usage: Select all text and run in VS Code terminal or use F5

param(
    [Parameter(Mandatory=$true, HelpMessage="Email address to associate with the invitation code")]
    [string]$Email
)

Write-Host "=== VS Code MSSQL Invitation Code Creator ===" -ForegroundColor Cyan
Write-Host ""

# Generate a random, secure invitation code
$characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
$testCode = -join ((1..20) | ForEach-Object { $characters[(Get-Random -Maximum $characters.Length)] })
$testEmail = $Email
$expiresAt = (Get-Date).AddDays(7).ToString("yyyy-MM-dd HH:mm:ss")
$createdAt = (Get-Date).ToString("yyyy-MM-dd HH:mm:ss")

Write-Host "Creating random secure invitation code: $testCode"
Write-Host "For email: $testEmail"
Write-Host "Expires: $expiresAt"
Write-Host ""

# Create the SQL insert statement
$sql = @"
-- Auto-generated invitation code insertion
-- Generated: $(Get-Date)
-- Email: $testEmail
-- Code: $testCode
-- Expires: $expiresAt

INSERT INTO InvitationCodes (Code, Email, ExpiresAt, UsedAt, IsActive, CreatedBy, CreatedAt)
VALUES ('$testCode', '$testEmail', '$expiresAt', NULL, 1, 'test-system', '$createdAt');

-- Verify insertion
SELECT TOP 1 * FROM InvitationCodes WHERE Code = '$testCode';
"@

# Write SQL to a file for easy execution
$sqlFile = "invitation-code-insert.sql"
$sql | Out-File -FilePath $sqlFile -Encoding UTF8

Write-Host "SQL written to file: $sqlFile" -ForegroundColor Green
Write-Host ""
Write-Host "=== NEXT STEPS ===" -ForegroundColor Yellow
Write-Host "1. Open the file '$sqlFile' in VS Code"
Write-Host "2. Connect to your MSSQL database using the MSSQL extension"
Write-Host "3. Select all the SQL and execute it (Ctrl+Shift+E)"
Write-Host "4. Verify the insertion was successful"
Write-Host ""
Write-Host "=== INVITATION CODE DETAILS ===" -ForegroundColor Green
Write-Host "INVITATION CODE: $testCode" -ForegroundColor Yellow
Write-Host "EMAIL: $testEmail" -ForegroundColor Yellow  
Write-Host "EXPIRES: $expiresAt" -ForegroundColor Yellow
Write-Host "Code Length: $($testCode.Length) characters"
Write-Host ""
Write-Host "Use this code in the registration form to test the positive case!" -ForegroundColor Green

# Also display the SQL for copy-paste
Write-Host ""
Write-Host "=== SQL TO EXECUTE ===" -ForegroundColor Cyan
Write-Host $sql -ForegroundColor Gray