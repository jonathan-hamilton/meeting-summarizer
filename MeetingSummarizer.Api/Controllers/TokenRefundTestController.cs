using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using MeetingSummarizer.Api.Services.TokenManagement;
using MeetingSummarizer.Api.Models.Payment;

namespace MeetingSummarizer.Api.Controllers
{
    /// <summary>
    /// Test controller for verifying the token refund system (S6.11 Phase 4)
    /// Updated to support both Fast Transcription and legacy Batch jobs
    /// This can be removed after testing is complete
    /// </summary>
    [ApiController]
    [Route("api/[controller]")]
    public class TokenRefundTestController : ControllerBase
    {
        private readonly ITokenService _tokenService;
        private readonly ILogger<TokenRefundTestController> _logger;

        public TokenRefundTestController(ITokenService tokenService, ILogger<TokenRefundTestController> logger)
        {
            _tokenService = tokenService;
            _logger = logger;
        }

        /// <summary>
        /// Test endpoint to verify token refund functionality
        /// POST /api/TokenRefundTest/test-refund
        /// </summary>
        [HttpPost("test-refund")]
        public async Task<IActionResult> TestTokenRefund([FromBody] TestRefundRequest request)
        {
            try
            {
                _logger.LogInformation("Testing token refund for transcription job {JobId}", request.BatchJobId);

                // Test 1: Check if refund already processed
                var alreadyProcessed = await _tokenService.IsRefundAlreadyProcessedAsync(request.BatchJobId);
                if (alreadyProcessed)
                {
                    return Ok(new { 
                        Success = true, 
                        Message = $"Refund for transcription job {request.BatchJobId} was already processed",
                        AlreadyProcessed = true
                    });
                }

                // Test 2: Process the refund
                var result = await _tokenService.ProcessAutomaticRefundAsync(request.BatchJobId, request.Reason ?? "Test refund");

                if (result.Success)
                {
                    return Ok(new {
                        Success = true,
                        Message = "Token refund processed successfully",
                        TokensRefunded = result.TokensRefunded,
                        BalanceBefore = result.BalanceBefore,
                        BalanceAfter = result.BalanceAfter,
                        Reason = result.Reason,
                        AlreadyProcessed = result.AlreadyProcessed
                    });
                }
                else
                {
                    return BadRequest(new {
                        Success = false,
                        Message = "Token refund failed",
                        Error = result.ErrorMessage
                    });
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error testing token refund for transcription job {JobId}", request.BatchJobId);
                return StatusCode(500, new {
                    Success = false,
                    Message = "Internal server error during refund test",
                    Error = ex.Message
                });
            }
        }

        /// <summary>
        /// Test endpoint to check if a refund was already processed
        /// GET /api/TokenRefundTest/check-refund/{jobId}
        /// </summary>
        [HttpGet("check-refund/{jobId}")]
        public async Task<IActionResult> CheckRefundStatus(Guid jobId)
        {
            try
            {
                var alreadyProcessed = await _tokenService.IsRefundAlreadyProcessedAsync(jobId);
                return Ok(new {
                    JobId = jobId,
                    AlreadyProcessed = alreadyProcessed,
                    Message = alreadyProcessed ? "Refund already processed" : "No refund found"
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error checking refund status for transcription job {JobId}", jobId);
                return StatusCode(500, new {
                    Success = false,
                    Error = ex.Message
                });
            }
        }
    }

    /// <summary>
    /// Request model for testing token refunds
    /// </summary>
    public class TestRefundRequest
    {
        public Guid BatchJobId { get; set; }
        public string? Reason { get; set; }
    }
}