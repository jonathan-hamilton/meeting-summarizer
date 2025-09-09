using FluentAssertions;
using MeetingSummarizer.Api.Services.TokenManagement;
using Microsoft.Extensions.Logging;
using Microsoft.VisualStudio.TestTools.UnitTesting;
using Moq;

namespace MeetingSummarizer.Api.Tests.Services;

/// <summary>
/// Unit tests for TokenCalculationService
/// </summary>
[TestClass]
[TestCategory("S6.3")]
public class TokenCalculationServiceTests
{
    private ITokenCalculationService _tokenCalculationService = null!;

    [TestInitialize]
    public void Setup()
    {
        var mockLogger = new Mock<ILogger<TokenCalculationService>>();
        _tokenCalculationService = new TokenCalculationService(mockLogger.Object);
    }

    [TestMethod]
    [TestCategory("S6.3")]
    public void CalculateTokensRequired_15MinuteMeeting_ReturnsCorrectCalculation()
    {
        // Act
        var result = _tokenCalculationService.CalculateTokensRequired(15);

        // Assert
        result.DurationMinutes.Should().Be(15);
        result.BaseTokens.Should().Be(100);
        result.VolumeDiscountMultiplier.Should().Be(1.0);
        result.VolumeDiscountPercentage.Should().Be(0);
        result.FinalTokens.Should().Be(100);
        result.CostInUsd.Should().Be(5.00m);
    }

    [TestMethod]
    [TestCategory("S6.3")]
    public void CalculateTokensRequired_30MinuteMeeting_AppliesVolumeDiscount()
    {
        // Act
        var result = _tokenCalculationService.CalculateTokensRequired(30);

        // Assert
        result.DurationMinutes.Should().Be(30);
        result.BaseTokens.Should().Be(200);
        result.VolumeDiscountMultiplier.Should().Be(0.9);
        result.VolumeDiscountPercentage.Should().Be(10);
        result.FinalTokens.Should().Be(180);
        result.CostInUsd.Should().Be(9.00m);
    }

    [TestMethod]
    [TestCategory("S6.3")]
    public void CalculateTokensRequired_60MinuteMeeting_MatchesSpecificationExample()
    {
        // This test validates against the specification example:
        // 60-minute meeting should cost $14.00 (280 tokens with 30% discount)
        
        // Act
        var result = _tokenCalculationService.CalculateTokensRequired(60);

        // Assert
        result.DurationMinutes.Should().Be(60);
        result.BaseTokens.Should().Be(400); // 60 minutes = 4 increments = 400 base tokens
        result.VolumeDiscountMultiplier.Should().Be(0.7); // 30% discount
        result.VolumeDiscountPercentage.Should().Be(30);
        result.FinalTokens.Should().Be(280); // 400 * 0.7 = 280
        result.CostInUsd.Should().Be(14.00m); // 280 * $0.05 = $14.00
        result.SavingsFromDiscount.Should().Be(6.00m); // $20.00 - $14.00 = $6.00 saved
    }

    [TestMethod]
    [TestCategory("S6.3")]
    public void CalculateTokensRequired_BaseTokenCalculation_RoundsUpCorrectly()
    {
        // Test various durations that should round up to 15-minute increments
        
        // 1 minute rounds up to 15-minute increment
        var result1 = _tokenCalculationService.CalculateTokensRequired(1);
        result1.BaseTokens.Should().Be(100);
        
        // 16 minutes rounds up to 2 increments
        var result16 = _tokenCalculationService.CalculateTokensRequired(16);
        result16.BaseTokens.Should().Be(200);
        
        // 31 minutes rounds up to 3 increments
        var result31 = _tokenCalculationService.CalculateTokensRequired(31);
        result31.BaseTokens.Should().Be(300);
    }

    [TestMethod]
    [TestCategory("S6.3")]
    public void GetVolumeDiscountMultiplier_VariousDurations_ReturnsCorrectMultiplier()
    {
        // Test various discount tiers
        _tokenCalculationService.GetVolumeDiscountMultiplier(15).Should().Be(1.0); // No discount
        _tokenCalculationService.GetVolumeDiscountMultiplier(30).Should().Be(0.9); // 10% discount
        _tokenCalculationService.GetVolumeDiscountMultiplier(45).Should().Be(0.8); // 20% discount
        _tokenCalculationService.GetVolumeDiscountMultiplier(60).Should().Be(0.7); // 30% discount
        _tokenCalculationService.GetVolumeDiscountMultiplier(120).Should().Be(0.7); // Still 30% discount
    }

    [TestMethod]
    [TestCategory("S6.3")]
    public void GetVolumeDiscountPercentage_VariousDurations_ReturnsCorrectPercentage()
    {
        // Test various discount percentages
        _tokenCalculationService.GetVolumeDiscountPercentage(15).Should().Be(0); // No discount
        _tokenCalculationService.GetVolumeDiscountPercentage(30).Should().Be(10); // 10% discount
        _tokenCalculationService.GetVolumeDiscountPercentage(45).Should().Be(20); // 20% discount
        _tokenCalculationService.GetVolumeDiscountPercentage(60).Should().Be(30); // 30% discount
        _tokenCalculationService.GetVolumeDiscountPercentage(120).Should().Be(30); // Still 30% discount
    }

    [TestMethod]
    [TestCategory("S6.3")]
    public void CalculateCostForTokens_VariousTokenCounts_ReturnsCorrectCost()
    {
        // Test cost calculations
        _tokenCalculationService.CalculateCostForTokens(100).Should().Be(5.00m); // 100 tokens = $5.00
        _tokenCalculationService.CalculateCostForTokens(180).Should().Be(9.00m); // 180 tokens = $9.00
        _tokenCalculationService.CalculateCostForTokens(280).Should().Be(14.00m); // 280 tokens = $14.00
        _tokenCalculationService.CalculateCostForTokens(0).Should().Be(0.00m); // 0 tokens = $0.00
    }

    [TestMethod]
    [TestCategory("S6.3")]
    public void CalculateTokensRequired_TimeSpanOverload_WorksCorrectly()
    {
        // Arrange
        var duration = TimeSpan.FromMinutes(23.5); // Should round up to 24 minutes

        // Act
        var result = _tokenCalculationService.CalculateTokensRequired(duration);

        // Assert
        result.DurationMinutes.Should().Be(24);
        result.BaseTokens.Should().Be(200); // 24 minutes = 2 increments = 200 base tokens
        result.FinalTokens.Should().Be(180); // With 10% discount for 30-minute tier
    }

    [TestMethod]
    [TestCategory("S6.3")]
    public void CalculateTokensRequired_GeneratesCorrectExplanation()
    {
        // Test explanation for 30-minute meeting
        var result30 = _tokenCalculationService.CalculateTokensRequired(30);
        result30.Explanation.Should().Be("This 30-minute meeting requires 180 tokens. Base calculation: 200 tokens, with 10% volume discount applied.");

        // Test explanation for 15-minute meeting (no discount)
        var result15 = _tokenCalculationService.CalculateTokensRequired(15);
        result15.Explanation.Should().Be("This 15-minute meeting requires 100 tokens (100 tokens per 15-minute increment).");
    }

    [TestMethod]
    [TestCategory("S6.3")]
    public void CalculateTokensRequired_InvalidDuration_ThrowsArgumentException()
    {
        // Act & Assert
        Action act1 = () => _tokenCalculationService.CalculateTokensRequired(0);
        act1.Should().Throw<ArgumentException>();

        Action act2 = () => _tokenCalculationService.CalculateTokensRequired(-5);
        act2.Should().Throw<ArgumentException>();
    }

    [TestMethod]
    [TestCategory("S6.3")]
    public void CalculateCostForTokens_NegativeTokens_ThrowsArgumentException()
    {
        // Act & Assert
        Action act = () => _tokenCalculationService.CalculateCostForTokens(-1);
        act.Should().Throw<ArgumentException>();
    }
}
