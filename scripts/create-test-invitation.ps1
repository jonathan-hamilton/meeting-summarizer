# Create Test Invitation Code Script
# This script creates a test invitation code for S7.2 testing
# Usage: .\create-test-invitation.ps1 -Email "user@example.com"

param(
    [Parameter(Mandatory=$true, HelpMessage="Email address to associate with the invitation code")]
    [string]$Email
)

# Generate a random, secure invitation code
$characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
$testCode = -join ((1..20) | ForEach-Object { $characters[(Get-Random -Maximum $characters.Length)] })
$testEmail = $Email
$expiresAt = (Get-Date).AddDays(7).ToString("yyyy-MM-dd HH:mm:ss")
$createdAt = (Get-Date).ToString("yyyy-MM-dd HH:mm:ss")

$sql = @"
INSERT INTO InvitationCodes (Id, Code, Email, ExpiresAt, UsedAt, IsActive, CreatedBy, CreatedAt)
VALUES (NEWID(), '$testCode', '$testEmail', '$expiresAt', NULL, 1, 'test-system', '$createdAt')
"@

Write-Host "Creating random secure invitation code: $testCode"
Write-Host "For email: $testEmail"
Write-Host "Expires: $expiresAt"
Write-Host ""
Write-Host "SQL to execute:"
Write-Host $sql
Write-Host ""

# Execute the SQL to create the invitation code
Write-Host "Executing SQL to create invitation code..."

# Create a temporary SQL file and a companion script
$tempSqlFile = Join-Path $env:TEMP "invitation_insert.sql"
$tempPsFile = Join-Path $env:TEMP "run_invitation_insert.ps1"

# Write the SQL to a temporary file
$sql | Out-File -FilePath $tempSqlFile -Encoding UTF8

# Create a PowerShell script that uses .NET SqlClient
$dbScript = @"
# Database insertion script
Add-Type -AssemblyName System.Data

`$connectionString = "Server=tcp:meetingsummary-dev-v2-sql.database.windows.net,1433;Initial Catalog=meetingsummary-dev-v2-db;Persist Security Info=False;Authentication=Active Directory Default;MultipleActiveResultSets=False;Encrypt=True;TrustServerCertificate=False;Connection Timeout=30;"

`$sql = @'
$sql
'@

try {
    `$connection = New-Object System.Data.SqlClient.SqlConnection(`$connectionString)
    `$connection.Open()
    
    `$command = New-Object System.Data.SqlClient.SqlCommand(`$sql, `$connection)
    `$result = `$command.ExecuteNonQuery()
    
    if (`$result -eq 1) {
        Write-Host "✅ Invitation code created successfully in database!" -ForegroundColor Green
        `$connection.Close()
        exit 0
    } else {
        Write-Host "❌ Failed to insert invitation code" -ForegroundColor Red
        `$connection.Close()
        exit 1
    }
} catch {
    Write-Host "❌ Database error: `$(`$_.Exception.Message)" -ForegroundColor Red
    if (`$connection) { `$connection.Close() }
    exit 1
}
"@

$dbScript | Out-File -FilePath $tempPsFile -Encoding UTF8

# Try to execute the database script
Write-Host "Attempting to insert into database..." -ForegroundColor Yellow
try {
    $result = & PowerShell -ExecutionPolicy Bypass -File $tempPsFile
    $exitCode = $LASTEXITCODE
    
    if ($exitCode -eq 0) {
        Write-Host "✅ Database insertion successful!" -ForegroundColor Green
    } else {
        Write-Host "❌ Database insertion failed. Manual insertion required." -ForegroundColor Red
        Write-Host "SQL file created at: $tempSqlFile" -ForegroundColor Cyan
        Write-Host "Run the SQL above in VS Code using the MSSQL extension." -ForegroundColor Cyan
    }
} catch {
    Write-Host "❌ Failed to execute database script: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "SQL file created at: $tempSqlFile" -ForegroundColor Cyan
    Write-Host "Run the SQL above in VS Code using the MSSQL extension." -ForegroundColor Cyan
}

# Clean up temp files
Remove-Item $tempSqlFile -ErrorAction SilentlyContinue
Remove-Item $tempPsFile -ErrorAction SilentlyContinue

Write-Host ""
Write-Host "=== INVITATION CODE DETAILS ===" -ForegroundColor Green
Write-Host "INVITATION CODE: $testCode" -ForegroundColor Yellow
Write-Host "EMAIL: $testEmail" -ForegroundColor Yellow  
Write-Host "EXPIRES: $expiresAt" -ForegroundColor Yellow
Write-Host "Code Length: $($testCode.Length) characters"
Write-Host ""
Write-Host "Use this code in the registration form to test the positive case!" -ForegroundColor Green