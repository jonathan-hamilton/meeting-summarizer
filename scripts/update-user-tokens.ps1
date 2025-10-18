param(
    [Parameter(Mandatory=$true)]
    [string]$Email,
    
    [Parameter(Mandatory=$true)]
    [int]$TokenBalance
)

# Update User Tokens Script
Write-Host "Update User Tokens Script" -ForegroundColor Yellow
Write-Host "Email: $Email" -ForegroundColor Cyan
Write-Host "New Token Balance: $TokenBalance" -ForegroundColor Cyan

# Validate email format
if ($Email -notmatch '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$') {
    Write-Host "Invalid email format: $Email" -ForegroundColor Red
    exit 1
}

# Validate token balance (must be non-negative)
if ($TokenBalance -lt 0) {
    Write-Host "Token balance cannot be negative: $TokenBalance" -ForegroundColor Red
    exit 1
}

# Get connection string from Key Vault
Write-Host "Getting database connection from Key Vault..." -ForegroundColor Gray
$connectionString = az keyvault secret show --vault-name msio-dev-v2-kv --name DatabaseConnectionString-Dev --query "value" --output tsv

if (-not $connectionString) {
    Write-Host "Failed to get database connection string from Key Vault" -ForegroundColor Red
    exit 1
}

# Parse connection string to get individual components
$serverPattern = "Server=tcp:([^,;]+)"
$databasePattern = "Initial Catalog=([^;]+)"
$userPattern = "User Id=([^;]+)"
$passwordPattern = "Password=([^;]+)"

$serverName = [regex]::Match($connectionString, $serverPattern).Groups[1].Value
$databaseName = [regex]::Match($connectionString, $databasePattern).Groups[1].Value
$username = [regex]::Match($connectionString, $userPattern).Groups[1].Value
$password = [regex]::Match($connectionString, $passwordPattern).Groups[1].Value

if (-not $serverName -or -not $databaseName) {
    Write-Host "Failed to parse connection string" -ForegroundColor Red
    exit 1
}

Write-Host "Connected to: $serverName\$databaseName" -ForegroundColor Green

# SQL script to update user tokens
$updateScript = @"
DECLARE @userEmail NVARCHAR(255) = '$Email';
DECLARE @newTokenBalance INT = $TokenBalance;
DECLARE @userId UNIQUEIDENTIFIER;
DECLARE @currentTokenBalance INT;

-- Get user details
SELECT @userId = Id, @currentTokenBalance = TokenBalance 
FROM dbo.Users 
WHERE Email = @userEmail;

IF @userId IS NULL
BEGIN
    PRINT 'ERROR: User with email $Email not found';
    RETURN;
END

PRINT 'Found user ID: ' + CAST(@userId AS NVARCHAR(36));
PRINT 'Current token balance: ' + CAST(@currentTokenBalance AS NVARCHAR(10));
PRINT 'New token balance: ' + CAST(@newTokenBalance AS NVARCHAR(10));

-- Update the token balance
UPDATE dbo.Users 
SET TokenBalance = @newTokenBalance,
    LastActivityAt = GETUTCDATE()
WHERE Id = @userId;

DECLARE @rowsUpdated INT = @@ROWCOUNT;

IF @rowsUpdated > 0
BEGIN
    PRINT 'Successfully updated token balance for user: $Email';
    PRINT 'Rows updated: ' + CAST(@rowsUpdated AS NVARCHAR(10));
    
    -- Verify the update
    DECLARE @verifyTokenBalance INT;
    SELECT @verifyTokenBalance = TokenBalance FROM dbo.Users WHERE Id = @userId;
    PRINT 'Verified new token balance: ' + CAST(@verifyTokenBalance AS NVARCHAR(10));
END
ELSE
BEGIN
    PRINT 'ERROR: Failed to update token balance - no rows affected';
END
"@

Write-Host "Executing token balance update..." -ForegroundColor Blue

try {
    # Execute the update script using SQL authentication
    $result = sqlcmd -S $serverName -d $databaseName -U $username -P $password -Q $updateScript -l 30
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Token balance update completed successfully!" -ForegroundColor Green
        Write-Host "Output from database:" -ForegroundColor Gray
        foreach ($line in $result) {
            if ($line -and $line.Trim() -ne "") {
                Write-Host "   $line" -ForegroundColor Gray
            }
        }
    } else {
        Write-Host "Token balance update failed!" -ForegroundColor Red
        Write-Host "Error output:" -ForegroundColor Red
        foreach ($line in $result) {
            if ($line -and $line.Trim() -ne "") {
                Write-Host "   $line" -ForegroundColor Red
            }
        }
        exit 1
    }
} catch {
    Write-Host "Exception occurred during token balance update:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    exit 1
}

Write-Host "Token balance update process completed!" -ForegroundColor Green