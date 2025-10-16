param(
    [Parameter(Mandatory=$true)]
    [string]$Email
)

# Delete User Script - Fixed Version
Write-Host "🗑️  Delete User Script (Fixed)" -ForegroundColor Yellow
Write-Host "Email to delete: $Email" -ForegroundColor Cyan

# Database connection details
$serverName = "meetingsummary-dev-v2-sql.database.windows.net"
$databaseName = "meetingsummary-dev-v2-db"
$username = "meetingadmin"
$password = "ir3oNhe8xMAZxrloLVf5JmLhsTunCTv1"

# Validate email format
if ($Email -notmatch "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$") {
    Write-Host "❌ Invalid email format: $Email" -ForegroundColor Red
    exit 1
}

Write-Host "`n🔍 Checking if user exists..." -ForegroundColor Gray

# Get user ID
$getUserQuery = "SELECT Id FROM Users WHERE Email = '$Email'"
$userIdResult = sqlcmd -S $serverName -d $databaseName -U $username -P $password -Q $getUserQuery -h -1 -W

# Extract the GUID from the result
$userId = $null
foreach ($line in $userIdResult) {
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

# Confirm deletion
Write-Host "`n⚠️  This will permanently delete:" -ForegroundColor Yellow
Write-Host "   • User: $Email" -ForegroundColor Yellow
Write-Host "   • All associated meetings" -ForegroundColor Yellow
Write-Host "   • All associated token usages" -ForegroundColor Yellow
Write-Host "   • Clear invitation code references" -ForegroundColor Yellow

$confirmation = Read-Host "`nAre you sure you want to continue? (y/N)"
if ($confirmation -ne "y" -and $confirmation -ne "Y") {
    Write-Host "❌ Operation cancelled by user" -ForegroundColor Red
    exit 0
}

Write-Host "`n🗑️  Deleting user and related records..." -ForegroundColor Red

# Execute deletion in order
Write-Host "   Clearing invitation code references..." -ForegroundColor Gray
$query1 = "UPDATE InvitationCodes SET UsedByUserId = NULL WHERE UsedByUserId = '$userId'"
sqlcmd -S $serverName -d $databaseName -U $username -P $password -Q $query1 -l 10 | Out-Null

Write-Host "   Deleting meetings..." -ForegroundColor Gray
$query2 = "DELETE FROM Meetings WHERE UserId = '$userId'"
sqlcmd -S $serverName -d $databaseName -U $username -P $password -Q $query2 -l 10 | Out-Null

Write-Host "   Deleting token usages..." -ForegroundColor Gray
$query3 = "DELETE FROM TokenUsages WHERE UserId = '$userId'"
sqlcmd -S $serverName -d $databaseName -U $username -P $password -Q $query3 -l 10 | Out-Null

Write-Host "   Deleting user..." -ForegroundColor Gray
$query4 = "DELETE FROM Users WHERE Id = '$userId'; SELECT @@ROWCOUNT as DeletedRows"
$deleteResult = sqlcmd -S $serverName -d $databaseName -U $username -P $password -Q $query4 -l 10

# Check if user was deleted
$deletedCount = 0
foreach ($line in $deleteResult) {
    if ($line -match "^\s*(\d+)\s*$") {
        $deletedCount = [int]$matches[1]
        break
    }
}

if ($deletedCount -eq 1) {
    Write-Host "✅ User '$Email' and all related records deleted successfully" -ForegroundColor Green
    
    # Final verification
    $verifyQuery = "SELECT COUNT(*) as UserCount FROM Users WHERE Email = '$Email'"
    $verifyResult = sqlcmd -S $serverName -d $databaseName -U $username -P $password -Q $verifyQuery -h -1 -W
    
    $userStillExists = $false
    foreach ($line in $verifyResult) {
        if ($line -match "^\s*(\d+)\s*$" -and [int]$matches[1] -gt 0) {
            $userStillExists = $true
            break
        }
    }
    
    if (-not $userStillExists) {
        Write-Host "   ✅ Verified: User completely removed from database" -ForegroundColor Green
    } else {
        Write-Host "   ⚠️  Warning: User may still exist in database" -ForegroundColor Yellow
    }
} else {
    Write-Host "❌ Failed to delete user" -ForegroundColor Red
    exit 1
}

Write-Host "`n🎯 Deletion completed successfully" -ForegroundColor Green