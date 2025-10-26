using MeetingSummarizer.Api.Services.TokenManagement;

namespace MeetingSummarizer.Api.Services.Background;

/// <summary>
/// Background service to clean up expired token reservations
/// </summary>
public class TokenReservationCleanupService : BackgroundService
{
    private readonly IServiceProvider _serviceProvider;
    private readonly ILogger<TokenReservationCleanupService> _logger;
    private readonly TimeSpan _cleanupInterval = TimeSpan.FromMinutes(15); // Run every 15 minutes

    public TokenReservationCleanupService(
        IServiceProvider serviceProvider,
        ILogger<TokenReservationCleanupService> logger)
    {
        _serviceProvider = serviceProvider;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("TokenReservationCleanupService started - running every {Interval} minutes", _cleanupInterval.TotalMinutes);

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await CleanupExpiredReservationsAsync();
                await Task.Delay(_cleanupInterval, stoppingToken);
            }
            catch (OperationCanceledException)
            {
                _logger.LogInformation("TokenReservationCleanupService stopping...");
                break;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in TokenReservationCleanupService");
                
                // Wait a bit before retrying on error
                try
                {
                    await Task.Delay(TimeSpan.FromMinutes(5), stoppingToken);
                }
                catch (OperationCanceledException)
                {
                    break;
                }
            }
        }

        _logger.LogInformation("TokenReservationCleanupService stopped");
    }

    private async Task CleanupExpiredReservationsAsync()
    {
        using var scope = _serviceProvider.CreateScope();
        var tokenService = scope.ServiceProvider.GetRequiredService<ITokenService>();

        try
        {
            var cleanedCount = await tokenService.CleanupExpiredReservationsAsync();
            
            if (cleanedCount > 0)
            {
                _logger.LogInformation("Cleaned up {Count} expired token reservations", cleanedCount);
            }
            else
            {
                _logger.LogDebug("No expired token reservations found during cleanup");
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during token reservation cleanup");
            throw;
        }
    }
}