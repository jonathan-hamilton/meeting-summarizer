# Azure Resource Cleanup Script
Write-Host "=== Azure Resource Cleanup Script ===" -ForegroundColor Green

# List of cognitive services to purge
$services = @(
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

$resourceGroups = @("rg-meetingsummary-dev", "rg-meeting-summary-io", "DefaultResourceGroup-WUS")

foreach ($service in $services) {
    Write-Host "Purging: $service" -ForegroundColor Yellow
    foreach ($rg in $resourceGroups) {
        az cognitiveservices account purge --name $service --location "westus" --resource-group $rg 2>$null
        if ($LASTEXITCODE -eq 0) {
            Write-Host "  Success with RG: $rg" -ForegroundColor Green
            break
        }
    }
}

Write-Host "Cleanup complete!" -ForegroundColor Green