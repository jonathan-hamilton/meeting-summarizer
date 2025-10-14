# Purge all soft-deleted Cognitive Services accounts related to meeting-summary
# This ensures no naming conflicts with future deployments

Write-Host "Purging soft-deleted Cognitive Services accounts..." -ForegroundColor Yellow

# List of soft-deleted accounts to purge
$accounts = @(
    "ss-meeting-summary-io",
    "ai-meetingsummaryio708206843444",
    "meetingsummary-dev-10112202-speech",
    "meetingsummary-dev-10112241-speech", 
    "meetingsummary-dev-10112305-speech",
    "meetingsummary-dev-10112343-speech",
    "meetingsummary-dev-10120159-speech",
    "meetingsummary-dev-10120309-speech",
    "meetingsummary-dev-10120338-speech",
    "meetingsummary-dev-10120349-speech",
    "meetingsummary-dev-10120520-speech",
    "meetingsummary-dev-10120530-speech",
    "meetingsummary-dev-10120540-speech",
    "meetingsummary-dev-10120551-speech",
    "meetingsummary-dev-10120602-speech",
    "meetingsummary-dev-10120613-speech",
    "meetingsummary-dev-10120640-speech",
    "meetingsummary-dev-10120650-speech",
    "meetingsummary-dev-10120701-speech",
    "meetingsummary-dev-10120716-speech",
    "meetingsummary-dev-10120736-speech",
    "meetingsummary-dev-10120804-speech",
    "meetingsummary-dev-10120818-speech",
    "meetingsummary-dev-10120835-speech"
)

# Try to purge each account
foreach ($account in $accounts) {
    Write-Host "Purging: $account" -ForegroundColor Cyan
    
    # Try purging without resource group first
    try {
        az cognitiveservices account purge --name $account --location "westus" --force-purge
        Write-Host "✅ Successfully purged: $account" -ForegroundColor Green
    }
    catch {
        Write-Host "❌ Failed to purge: $account - $($_.Exception.Message)" -ForegroundColor Red
    }
    
    Start-Sleep -Seconds 1
}

Write-Host "`nPurge operation completed!" -ForegroundColor Yellow
Write-Host "Verifying remaining soft-deleted accounts..." -ForegroundColor Yellow

# Verify what's left
az cognitiveservices account list-deleted --query "[?contains(name, 'meeting') || contains(name, 'summary')].{Name:name, Location:location}" --output table