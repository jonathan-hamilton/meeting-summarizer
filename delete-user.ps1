param(
    [Parameter(Mandatory=$true)]
    [string]$Email
)

# Delete User Script - Fixed Version
Write-Host "🗑️  Delete User Script" -ForegroundColor Yellow
Write-Host "Email to delete: $Email" -ForegroundColor Cyan

# Database connection details
$serverName = "meetingsummary-dev-v2-sql.database.windows.net"
$databaseName = "meetingsummary-dev-v2-db"
$username = "meetingadmin"
$password = "***REMOVED***"

# Validate email format
if ($Email -notmatch "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$") {
    Write-Host "❌ Invalid email format: $Email" -ForegroundColor Red
    exit 1
}

Write-Host "`n🔍 Checking if user exists..." -ForegroundColor Gray

# Get user ID - use a more reliable approach
$getUserQuery = "SELECT Id FROM Users WHERE Email = '$Email'"
$userIdOutput = sqlcmd -S $serverName -d $databaseName -U $username -P $password -Q $getUserQuery -h -1 -W

# Parse the user ID from output more reliably
$userId = $null
foreach ($line in $userIdOutput) {
    if ($line -match "^[A-F0-9]{8}-[A-F0-9]{4}-[A-F0-9]{4}-[A-F0-9]{4}-[A-F0-9]{12}$") {
        $userId = $line.Trim()
        break
    }
}

if (-not $userId) {
    Write-Host "❌ User with email '$Email' not found in database" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Found user with ID: $userId" -ForegroundColor Green

Write-Host "`n🔍 Checking related records..." -ForegroundColor Gray

# Check related records with individual queries for better reliability
$meetingsQuery = "SELECT COUNT(*) as Count FROM Meetings WHERE UserId = '$userId'"
$tokensQuery = "SELECT COUNT(*) as Count FROM TokenUsages WHERE UserId = '$userId'"
$invitationsQuery = "SELECT COUNT(*) as Count FROM InvitationCodes WHERE UsedByUserId = '$userId'"

$meetingsCount = (sqlcmd -S $serverName -d $databaseName -U $username -P $password -Q $meetingsQuery -h -1 -W | Where-Object { $_ -match "^\s*\d+\s*$" }).Trim()
$tokensCount = (sqlcmd -S $serverName -d $databaseName -U $username -P $password -Q $tokensQuery -h -1 -W | Where-Object { $_ -match "^\s*\d+\s*$" }).Trim()
$invitationsCount = (sqlcmd -S $serverName -d $databaseName -U $username -P $password -Q $invitationsQuery -h -1 -W | Where-Object { $_ -match "^\s*\d+\s*$" }).Trim()

Write-Host "Related records found:" -ForegroundColor Gray
Write-Host "  Meetings: $meetingsCount" -ForegroundColor Gray
Write-Host "  TokenUsages: $tokensCount" -ForegroundColor Gray
Write-Host "  InvitationCodes: $invitationsCount" -ForegroundColor Gray

# Confirm deletion
Write-Host "`n⚠️  This will permanently delete:" -ForegroundColor Yellow
Write-Host "   • User: $Email" -ForegroundColor Yellow
Write-Host "   • All associated meetings ($meetingsCount)" -ForegroundColor Yellow
Write-Host "   • All associated token usages ($tokensCount)" -ForegroundColor Yellow
Write-Host "   • Clear invitation code references ($invitationsCount)" -ForegroundColor Yellow

$confirmation = Read-Host "`nAre you sure you want to continue? (y/N)"
if ($confirmation -ne "y" -and $confirmation -ne "Y") {
    Write-Host "❌ Operation cancelled by user" -ForegroundColor Red
    exit 0
}

Write-Host "`n🗑️  Deleting user and related records..." -ForegroundColor Red

try {
    # Execute deletion using a transaction for data integrity
    $deleteQuery = @"
BEGIN TRANSACTION;
    UPDATE InvitationCodes SET UsedByUserId = NULL WHERE UsedByUserId = '$userId';
    DELETE FROM Meetings WHERE UserId = '$userId';
    DELETE FROM TokenUsages WHERE UserId = '$userId';
    DELETE FROM Users WHERE Id = '$userId';
    SELECT @@ROWCOUNT as DeletedUserCount;
COMMIT TRANSACTION;
"@

    Write-Host "   Executing deletion transaction..." -ForegroundColor Gray
    $deleteResult = sqlcmd -S $serverName -d $databaseName -U $username -P $password -Q $deleteQuery -l 10

    # Check if user was actually deleted by looking for the row count
    $deletedUserCount = 0
    foreach ($line in $deleteResult) {
        if ($line -match "^\s*(\d+)\s*$") {
            $deletedUserCount = [int]$matches[1]
            break
        }
    }

    if ($deletedUserCount -eq 1) {
        Write-Host "✅ User '$Email' and all related records deleted successfully" -ForegroundColor Green
        
        # Final verification - check if user still exists
        $verifyQuery = "SELECT COUNT(*) as UserCount FROM Users WHERE Email = '$Email'"
        $verifyResult = sqlcmd -S $serverName -d $databaseName -U $username -P $password -Q $verifyQuery -h -1 -W
        
        $finalUserCount = 0
        foreach ($line in $verifyResult) {
            if ($line -match "^\s*(\d+)\s*$") {
                $finalUserCount = [int]$matches[1]
                break
            }
        }
        
        if ($finalUserCount -eq 0) {
            Write-Host "   ✅ Verified: User completely removed from database" -ForegroundColor Green
        } else {
            Write-Host "   ⚠️  Warning: User may still exist in database (count: $finalUserCount)" -ForegroundColor Yellow
            exit 1
        }
    } else {
        Write-Host "❌ Failed to delete user (deleted count: $deletedUserCount)" -ForegroundColor Red
        exit 1
    }
    
} catch {
    Write-Host "❌ Exception occurred during deletion: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host "`n🎯 Deletion completed successfully" -ForegroundColor Green