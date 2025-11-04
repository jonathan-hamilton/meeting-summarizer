using Microsoft.Extensions.Logging;
using Microsoft.EntityFrameworkCore;
using NUnit.Framework;
using Moq;
using MeetingSummarizer.Api.Data;
using MeetingSummarizer.Api.Data.Entities;
using MeetingSummarizer.Api.Services.TokenManagement;
using FluentAssertions;

namespace MeetingSummarizer.Api.Tests.Services;

[TestFixture]
public class TokenServiceTests
{
    private MeetingSummarizerDbContext _context = null!;
    private Mock<ILogger<TokenService>> _loggerMock = null!;
    private TokenService _tokenService = null!;
    private User _testUser = null!;

    [SetUp]
    public void Setup()
    {
        // Setup in-memory database
        var options = new DbContextOptionsBuilder<MeetingSummarizerDbContext>()
            .UseInMemoryDatabase(databaseName: $"TestDb_{Guid.NewGuid()}")
            .Options;

        _context = new MeetingSummarizerDbContext(options);
        _loggerMock = new Mock<ILogger<TokenService>>();
        _tokenService = new TokenService(_context, _loggerMock.Object);

        // Create test user
        _testUser = new User
        {
            Id = Guid.NewGuid(),
            Email = "test@example.com",
            FirstName = "Test",
            LastName = "User",
            TokenBalance = 1000 // Start with 1000 tokens
        };

        _context.Users.Add(_testUser);
        _context.SaveChanges();
    }

    [TearDown]
    public void Cleanup()
    {
        _context.Dispose();
    }

    [Test]
    public async Task GetTokenBalanceAsync_ValidUser_ReturnsCorrectBalance()
    {
        // Act
        var balance = await _tokenService.GetTokenBalanceAsync(_testUser.Id.ToString());

        // Assert
        balance.Should().Be(1000);
    }

    [Test]
    public async Task GetTokenBalanceAsync_InvalidUser_ReturnsZero()
    {
        // Arrange
        var invalidUserId = Guid.NewGuid().ToString();

        // Act
        var balance = await _tokenService.GetTokenBalanceAsync(invalidUserId);

        // Assert
        balance.Should().Be(0);
    }

    [Test]
    public async Task UpdateTokenBalanceAsync_AddTokens_UpdatesBalanceCorrectly()
    {
        // Arrange
        var tokensToAdd = 500;

        // Act
        var newBalance = await _tokenService.UpdateTokenBalanceAsync(_testUser.Id.ToString(), tokensToAdd, "Test purchase");

        // Assert
        newBalance.Should().Be(1500);
        
        // Verify database was updated
        var user = await _context.Users.FindAsync(_testUser.Id);
        user!.TokenBalance.Should().Be(1500);
    }

    [Test]
    public async Task UpdateTokenBalanceAsync_SubtractTokens_UpdatesBalanceCorrectly()
    {
        // Arrange
        var tokensToSubtract = -300;

        // Act
        var newBalance = await _tokenService.UpdateTokenBalanceAsync(_testUser.Id.ToString(), tokensToSubtract, "Meeting processing");

        // Assert
        newBalance.Should().Be(700);
        
        // Verify database was updated
        var user = await _context.Users.FindAsync(_testUser.Id);
        user!.TokenBalance.Should().Be(700);
    }

    /* TODO: Fix NUnit async assertion pattern
    [Test]
    public async Task UpdateTokenBalanceAsync_InsufficientTokens_ThrowsInvalidOperationException()
    {
        // Arrange
        var tokensToSubtract = _testUser.TokenBalance + 10;

        // Act & Assert
        var exception = await Assert.ThrowsAsync<InvalidOperationException>(
            () => _tokenService.UpdateTokenBalanceAsync(_testUser.Id.ToString(), tokensToSubtract, "Test")
        );
        exception.Message.Should().Contain("Insufficient tokens");
    }
    */

    [Test]
    public async Task ValidateTokenAvailabilityAsync_SufficientTokens_ReturnsTrue()
    {
        // Arrange
        var requiredTokens = 500;

        // Act
        var result = await _tokenService.ValidateTokenAvailabilityAsync(_testUser.Id.ToString(), requiredTokens);

        // Assert
        result.Should().BeTrue();
    }

    [Test]
    public async Task ValidateTokenAvailabilityAsync_InsufficientTokens_ReturnsFalse()
    {
        // Arrange
        var requiredTokens = 1500;

        // Act
        var result = await _tokenService.ValidateTokenAvailabilityAsync(_testUser.Id.ToString(), requiredTokens);

        // Assert
        result.Should().BeFalse();
    }

    [Test]
    public async Task RecordTokenPurchaseAsync_ValidPurchase_CreatesRecordAndUpdatesBalance()
    {
        // Arrange
        var tokenAmount = 1000;
        var amountPaid = 50.00m;
        var paymentIntentId = "pi_test123";

        // Act
        var purchase = await _tokenService.RecordTokenPurchaseAsync(
            _testUser.Id.ToString(), 
            tokenAmount, 
            amountPaid, 
            paymentIntentId, 
            0.1m); // 10% discount

        // Assert
        purchase.Should().NotBeNull();
        purchase.TokensPurchased.Should().Be(tokenAmount);
        purchase.AmountPaid.Should().Be(amountPaid);
        purchase.PaymentId.Should().Be(paymentIntentId);
        purchase.PaymentStatus.Should().Be("completed");

        // Verify balance was updated
        var user = await _context.Users.FindAsync(_testUser.Id);
        user!.TokenBalance.Should().Be(2000); // 1000 original + 1000 purchased

        // Verify purchase record exists in database
        var purchaseInDb = await _context.TokenPurchases.FindAsync(purchase.Id);
        purchaseInDb.Should().NotBeNull();
    }

    [Test]
    public async Task RecordTokenUsageAsync_ValidUsage_CreatesRecordAndDeductsBalance()
    {
        // Arrange
        var meetingId = Guid.NewGuid().ToString();
        var tokensToUse = 300;
        var durationMinutes = 45;

        // Act
        var usage = await _tokenService.RecordTokenUsageAsync(
            _testUser.Id.ToString(),
            meetingId,
            tokensToUse,
            durationMinutes,
            0.2m); // 20% discount

        // Assert
        usage.Should().NotBeNull();
        usage.TokensUsed.Should().Be(tokensToUse);
        usage.MeetingDurationMinutes.Should().Be(durationMinutes);
        usage.VolumeDiscountApplied.Should().Be(0.2m);
        usage.CostInUsd.Should().Be(15.00m); // 300 tokens * $0.05

        // Verify balance was updated
        var user = await _context.Users.FindAsync(_testUser.Id);
        user!.TokenBalance.Should().Be(700); // 1000 original - 300 used

        // Verify usage record exists in database
        var usageInDb = await _context.TokenUsages.FindAsync(usage.Id);
        usageInDb.Should().NotBeNull();
    }

    /* TODO: Fix NUnit async assertion pattern
    [Test]
    public async Task RecordTokenUsageAsync_InsufficientTokens_ThrowsException()
    {
        // Arrange
        var meetingId = Guid.NewGuid().ToString();
        var tokensToUse = 1500; // More than available

        // Act & Assert
        var exception = await Assert.ThrowsAsync<InvalidOperationException>(
            () => _tokenService.RecordTokenUsageAsync(_testUser.Id.ToString(), meetingId, tokensToUse, 90)
        );
        exception.Message.Should().Contain("Insufficient tokens");
    }
    */

    [Test]
    public async Task GetTokenStatisticsAsync_WithTransactionHistory_ReturnsCorrectStatistics()
    {
        // Arrange
        // Add some purchase and usage history
        await _tokenService.RecordTokenPurchaseAsync(_testUser.Id.ToString(), 500, 25.00m, "pi_test1");
        await _tokenService.RecordTokenUsageAsync(_testUser.Id.ToString(), Guid.NewGuid().ToString(), 200, 30, 0.1m);
        await _tokenService.RecordTokenUsageAsync(_testUser.Id.ToString(), Guid.NewGuid().ToString(), 150, 20, 0m);

        // Act
        var statistics = await _tokenService.GetTokenStatisticsAsync(_testUser.Id.ToString());

        // Assert
        statistics.Should().NotBeNull();
        statistics.CurrentBalance.Should().Be(1150); // 1000 + 500 - 200 - 150
        statistics.TotalPurchased.Should().Be(500);
        statistics.TotalUsed.Should().Be(350);
        statistics.TotalSpent.Should().Be(25.00m);
        statistics.MeetingsProcessed.Should().Be(2);
        statistics.TotalMinutesProcessed.Should().Be(50);
        statistics.AverageTokensPerMeeting.Should().Be(175); // 350 / 2
        statistics.LastPurchaseDate.Should().NotBeNull();
        statistics.LastUsageDate.Should().NotBeNull();
    }

    [Test]
    public async Task GetPurchaseHistoryAsync_WithPurchases_ReturnsOrderedHistory()
    {
        // Arrange
        await _tokenService.RecordTokenPurchaseAsync(_testUser.Id.ToString(), 500, 25.00m, "pi_test1");
        await Task.Delay(10); // Small delay to ensure different timestamps
        await _tokenService.RecordTokenPurchaseAsync(_testUser.Id.ToString(), 1000, 50.00m, "pi_test2");

        // Act
        var history = await _tokenService.GetPurchaseHistoryAsync(_testUser.Id.ToString(), 10);

        // Assert
        var purchaseList = history.ToList();
        purchaseList.Should().HaveCount(2);
        purchaseList[0].TokensPurchased.Should().Be(1000); // Most recent first
        purchaseList[1].TokensPurchased.Should().Be(500);
    }

    [Test]
    public async Task GetUsageHistoryAsync_WithUsages_ReturnsOrderedHistory()
    {
        // Arrange
        await _tokenService.RecordTokenUsageAsync(_testUser.Id.ToString(), Guid.NewGuid().ToString(), 200, 30);
        await Task.Delay(10); // Small delay to ensure different timestamps
        await _tokenService.RecordTokenUsageAsync(_testUser.Id.ToString(), Guid.NewGuid().ToString(), 300, 45);

        // Act
        var history = await _tokenService.GetUsageHistoryAsync(_testUser.Id.ToString(), 10);

        // Assert
        var usageList = history.ToList();
        usageList.Should().HaveCount(2);
        usageList[0].TokensUsed.Should().Be(300); // Most recent first
        usageList[1].TokensUsed.Should().Be(200);
    }
}

