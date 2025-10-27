param(
    [Parameter(Mandatory=$true)]
    [string]$Email
)

# Delete User Script - Comprehensive Version
Write-Host "🗑️  Delete User Script" -ForegroundColor Yellow
Write-Host "Email to delete: $Email" -ForegroundColor Cyan

# Validate email format
if ($Email -notmatch "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$") {
    Write-Host "❌ Invalid email format: $Email" -ForegroundColor Red
    exit 1
}

# Get connection string from Key Vault
Write-Host "`n� Getting database connection from Key Vault..." -ForegroundColor Gray
$connectionString = az keyvault secret show --vault-name msio-dev-v2-kv --name DatabaseConnectionString-Dev --query "value" --output tsv

if (-not $connectionString) {
    Write-Host "❌ Failed to get database connection string from Key Vault" -ForegroundColor Red
    exit 1
}

# Parse connection string to get individual components
$serverPattern = "Server=tcp:([^,;]+)"
$databasePattern = "Initial Catalog=([^;]+)"
$userPattern = "User ID=([^;]+)"
$passwordPattern = "Password=([^;]+)"

$serverName = [regex]::Match($connectionString, $serverPattern).Groups[1].Value
$databaseName = [regex]::Match($connectionString, $databasePattern).Groups[1].Value
$username = [regex]::Match($connectionString, $userPattern).Groups[1].Value
$password = [regex]::Match($connectionString, $passwordPattern).Groups[1].Value

if (-not $serverName -or -not $databaseName) {
    Write-Host "❌ Failed to parse connection string" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Connected to: $serverName\$databaseName" -ForegroundColor Green

# SQL script with proper variable handling
$deleteScript = @"
SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;

DECLARE @userEmail NVARCHAR(255) = '$Email';
DECLARE @userId UNIQUEIDENTIFIER;

-- Get user ID
SELECT @userId = Id FROM dbo.Users WHERE Email = @userEmail;

IF @userId IS NULL
BEGIN
    PRINT 'ERROR: User with email $Email not found';
    RETURN;
END

PRINT 'Found user ID: ' + CAST(@userId AS NVARCHAR(36));

-- Delete TokenUsages that reference Meetings first
DECLARE @tokenUsagesDeleted INT;
DELETE FROM dbo.TokenUsages WHERE MeetingId IN (SELECT Id FROM dbo.Meetings WHERE UserId = @userId);
SET @tokenUsagesDeleted = @@ROWCOUNT;
PRINT 'Deleted ' + CAST(@tokenUsagesDeleted AS NVARCHAR(10)) + ' token usage(s) linked to meetings';

-- Delete from Meetings
DECLARE @meetingsDeleted INT;
DELETE FROM dbo.Meetings WHERE UserId = @userId;
SET @meetingsDeleted = @@ROWCOUNT;
PRINT 'Deleted ' + CAST(@meetingsDeleted AS NVARCHAR(10)) + ' meeting(s)';

-- Delete from TokenPurchases
DECLARE @tokenPurchasesDeleted INT;
DELETE FROM dbo.TokenPurchases WHERE UserId = @userId;
SET @tokenPurchasesDeleted = @@ROWCOUNT;
PRINT 'Deleted ' + CAST(@tokenPurchasesDeleted AS NVARCHAR(10)) + ' token purchase(s)';

-- Delete from InvitationCodes
DECLARE @invitationsDeleted INT;
DELETE FROM dbo.InvitationCodes WHERE UsedByUserId = @userId;
SET @invitationsDeleted = @@ROWCOUNT;
PRINT 'Deleted ' + CAST(@invitationsDeleted AS NVARCHAR(10)) + ' invitation code(s)';

-- Delete remaining TokenUsages
DECLARE @remainingTokensDeleted INT;
DELETE FROM dbo.TokenUsages WHERE UserId = @userId;
SET @remainingTokensDeleted = @@ROWCOUNT;
PRINT 'Deleted ' + CAST(@remainingTokensDeleted AS NVARCHAR(10)) + ' remaining token usage(s)';

-- Delete from Users
DECLARE @usersDeleted INT;
DELETE FROM dbo.Users WHERE Id = @userId;
SET @usersDeleted = @@ROWCOUNT;
PRINT 'Deleted ' + CAST(@usersDeleted AS NVARCHAR(10)) + ' user(s)';

PRINT 'User deletion completed successfully';
"@

Write-Host "`n🗑️  Executing user deletion..." -ForegroundColor Red

try {
    # Execute the deletion script
    $result = sqlcmd -S $serverName -d $databaseName -U $username -P $password -Q $deleteScript -l 30
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "`n✅ User deletion completed successfully!" -ForegroundColor Green
        Write-Host "Output from database:" -ForegroundColor Gray
        foreach ($line in $result) {
            if ($line -and $line.Trim() -ne "") {
                Write-Host "   $line" -ForegroundColor Gray
            }
        }
    } else {
        Write-Host "`n❌ User deletion failed!" -ForegroundColor Red
        Write-Host "Error output:" -ForegroundColor Red
        foreach ($line in $result) {
            if ($line -and $line.Trim() -ne "") {
                Write-Host "   $line" -ForegroundColor Red
            }
        }
        exit 1
    }
} catch {
    Write-Host "`n❌ Exception occurred during user deletion:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    exit 1
}

Write-Host "`n� User deletion process completed!" -ForegroundColor Green