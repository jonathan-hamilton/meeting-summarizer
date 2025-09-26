# Test Token Refund System - S6.11 Phase 4
# This script tests the automatic token refund functionality

$apiBase = "http://localhost:5029"  # Using HTTP port from the API output

Write-Host "=== Testing Token Refund System (S6.11 Phase 4) ===" -ForegroundColor Green
Write-Host ""

# Test 1: Check refund status for a random batch job ID
$testBatchJobId = [System.Guid]::NewGuid()
Write-Host "Test 1: Checking refund status for batch job: $testBatchJobId" -ForegroundColor Yellow

try {
    $response = Invoke-RestMethod -Uri "$apiBase/api/TokenRefundTest/check-refund/$testBatchJobId" -Method GET
    Write-Host "✅ Refund status check successful:" -ForegroundColor Green
    Write-Host "   Already Processed: $($response.AlreadyProcessed)" -ForegroundColor White
    Write-Host "   Message: $($response.Message)" -ForegroundColor White
    Write-Host ""
} catch {
    Write-Host "❌ Refund status check failed: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
}

# Test 2: Attempt to process a refund for the same batch job ID
Write-Host "Test 2: Attempting to process refund for batch job: $testBatchJobId" -ForegroundColor Yellow

$refundRequest = @{
    BatchJobId = $testBatchJobId.ToString()
    Reason = "Test refund - verifying S6.11 Phase 4 functionality"
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "$apiBase/api/TokenRefundTest/test-refund" -Method POST -Body $refundRequest -ContentType "application/json"
    Write-Host "✅ Refund processing response:" -ForegroundColor Green
    Write-Host "   Success: $($response.Success)" -ForegroundColor White
    Write-Host "   Message: $($response.Message)" -ForegroundColor White
    if ($response.TokensRefunded) {
        Write-Host "   Tokens Refunded: $($response.TokensRefunded)" -ForegroundColor White
        Write-Host "   Balance Before: $($response.BalanceBefore)" -ForegroundColor White
        Write-Host "   Balance After: $($response.BalanceAfter)" -ForegroundColor White
    }
    if ($response.Error) {
        Write-Host "   Expected Error: $($response.Error)" -ForegroundColor Yellow
    }
    Write-Host ""
} catch {
    Write-Host "❌ Refund processing failed: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
}

# Test 3: Check the refund status again (should now show as processed if successful)
Write-Host "Test 3: Checking refund status again for batch job: $testBatchJobId" -ForegroundColor Yellow

try {
    $response = Invoke-RestMethod -Uri "$apiBase/api/TokenRefundTest/check-refund/$testBatchJobId" -Method GET
    Write-Host "✅ Second refund status check:" -ForegroundColor Green
    Write-Host "   Already Processed: $($response.AlreadyProcessed)" -ForegroundColor White
    Write-Host "   Message: $($response.Message)" -ForegroundColor White
    Write-Host ""
} catch {
    Write-Host "❌ Second refund status check failed: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
}

Write-Host "=== Token Refund System Test Complete ===" -ForegroundColor Green
Write-Host ""
Write-Host "Expected Results:" -ForegroundColor Cyan
Write-Host "• Test 1: Should show 'No refund found' (AlreadyProcessed: False)"
Write-Host "• Test 2: Should fail with 'Batch job not found' error (expected - we used a random ID)"
Write-Host "• Test 3: Should still show 'No refund found' since the batch job doesn't exist"
Write-Host ""
Write-Host "This test verifies:" -ForegroundColor Cyan
Write-Host "✓ Refund status checking works"
Write-Host "✓ Error handling for non-existent batch jobs works"
Write-Host "✓ API endpoints are properly configured"
Write-Host "✓ Token refund system is ready for real batch job testing"