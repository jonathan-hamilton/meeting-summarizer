# Create Test Invitation Code Script
# This script creates a test invitation code for S7.2 testing

$connectionString = "Server=tcp:meetingsummary-dev-sql.database.windows.net,1433;Initial Catalog=meetingsummary-dev-db;Persist Security Info=False;User ID=sqladmin;Password=***REMOVED***;MultipleActiveResultSets=False;Encrypt=true;TrustServerCertificate=False;Connection Timeout=30;"

# Generate a test invitation code
$testCode = "TEST123INVITATION456"
$testEmail = "test@example.com"
$expiresAt = (Get-Date).AddDays(7).ToString("yyyy-MM-dd HH:mm:ss")
$createdAt = (Get-Date).ToString("yyyy-MM-dd HH:mm:ss")

$sql = @"
INSERT INTO InvitationCodes (Code, Email, ExpiresAt, UsedAt, IsActive, CreatedBy, CreatedAt)
VALUES ('$testCode', '$testEmail', '$expiresAt', NULL, 1, 'test-system', '$createdAt')
"@

Write-Host "Creating test invitation code: $testCode"
Write-Host "For email: $testEmail"
Write-Host "Expires: $expiresAt"
Write-Host ""
Write-Host "SQL to execute:"
Write-Host $sql
Write-Host ""

# You can uncomment this to actually execute the SQL
# Invoke-Sqlcmd -ConnectionString $connectionString -Query $sql

Write-Host "TEST INVITATION CODE: $testCode"
Write-Host "Use this code in the registration form to test the positive case!"