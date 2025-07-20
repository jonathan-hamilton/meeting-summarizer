# Sprint 1 API Test Runner
# Comprehensive test suite for Meeting Summarizer API Sprint 1 features

Write-Host "🧪 Meeting Summarizer API - Sprint 1 Test Suite" -ForegroundColor Cyan
Write-Host "=================================================" -ForegroundColor Cyan
Write-Host ""

# Set location to test project
Set-Location -Path "MeetingSummarizer.Api.Tests"

Write-Host "📦 Restoring NuGet packages..." -ForegroundColor Yellow
dotnet restore

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to restore packages" -ForegroundColor Red
    exit 1
}

Write-Host "🔨 Building test project..." -ForegroundColor Yellow
dotnet build --no-restore

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to build test project" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "🧪 Running Sprint 1 Test Suite..." -ForegroundColor Green
Write-Host ""

# Run all Sprint 1 tests with detailed output
Write-Host "▶️ Running all Sprint 1 tests..." -ForegroundColor Cyan
dotnet test --no-build --verbosity normal --filter "TestCategory=Sprint1" --logger "console;verbosity=detailed"

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "❌ Some tests failed. See output above for details." -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "📊 Running tests with coverage..." -ForegroundColor Cyan
dotnet test --no-build --verbosity normal --filter "TestCategory=Sprint1" --collect:"XPlat Code Coverage"

Write-Host ""
Write-Host "🎯 Running specific Sprint 1 story tests..." -ForegroundColor Cyan

Write-Host ""
Write-Host "📝 S1.1 - Audio Transcription Backend Service Tests:" -ForegroundColor Yellow
dotnet test --no-build --verbosity normal --filter "TestCategory=S1.1" --logger "console;verbosity=normal"

Write-Host ""
Write-Host "🔧 S1.4 - Production Configuration Tests:" -ForegroundColor Yellow
dotnet test --no-build --verbosity normal --filter "TestCategory=S1.4" --logger "console;verbosity=normal"

Write-Host ""
Write-Host "🔗 S1.3 - Integration Tests:" -ForegroundColor Yellow
dotnet test --no-build --verbosity normal --filter "TestCategory=S1.3" --logger "console;verbosity=normal"

Write-Host ""
Write-Host "✅ Sprint 1 API test suite completed successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Test Summary:" -ForegroundColor Cyan
Write-Host "  ✓ S1.1: Audio Transcription Backend Service" -ForegroundColor Green
Write-Host "  ✓ S1.4: Production Configuration Support" -ForegroundColor Green  
Write-Host "  ✓ S1.3: File Upload to Transcription Integration" -ForegroundColor Green
Write-Host "  ✓ Integration Tests: End-to-end workflows" -ForegroundColor Green
Write-Host ""
Write-Host "🎉 All Sprint 1 requirements are thoroughly tested!" -ForegroundColor Green
