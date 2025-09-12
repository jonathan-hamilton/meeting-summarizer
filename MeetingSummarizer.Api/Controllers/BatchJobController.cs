using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using System.Security.Claims;
using MeetingSummarizer.Api.Data;
using MeetingSummarizer.Api.Data.Entities;
using MeetingSummarizer.Api.Models;
using MeetingSummarizer.Api.Models.BatchTranscription;
using MeetingSummarizer.Api.Services;
using MeetingSummarizer.Api.Services.Configuration;

namespace MeetingSummarizer.Api.Controllers;

/// <summary>
/// Controller for managing batch transcription jobs for longer audio files
/// Provides async processing capabilities to eliminate timeout issues
/// </summary>
[ApiController]
[Route("api/[controller]")]
public class BatchJobController : ControllerBase
{
    private readonly MeetingSummarizerDbContext _context;
    private readonly AzureBatchTranscriptionService _batchService;
    private readonly IAzureConfigurationService _azureConfig;
    private readonly AzureSpeechOptions _speechOptions;
    private readonly ILogger<BatchJobController> _logger;

    public BatchJobController(
        MeetingSummarizerDbContext context,
        AzureBatchTranscriptionService batchService,
        IAzureConfigurationService azureConfig,
        IOptions<AzureSpeechOptions> speechOptions,
        ILogger<BatchJobController> logger)
    {
        _context = context;
        _batchService = batchService;
        _azureConfig = azureConfig;
        _speechOptions = speechOptions.Value;
        _logger = logger;
    }

    /// <summary>
    /// Submit a new batch transcription job for processing
    /// </summary>
    /// <param name="request">Job submission details</param>
    /// <returns>Job submission response with job ID for tracking</returns>
    [HttpPost("submit")]
    [Authorize]
    public async Task<ActionResult<SubmitBatchJobResponse>> SubmitJob([FromBody] SubmitBatchJobRequest request)
    {
        try
        {
            var userId = GetCurrentUserId();
            _logger.LogInformation("User {UserId} submitting batch job for file: {FileName}", userId, request.FileName);

            // Validate user exists and has sufficient tokens
            var user = await _context.Users.FindAsync(userId);
            if (user == null)
            {
                return NotFound("User not found");
            }

            if (user.TokenBalance < request.TokensToCharge)
            {
                return BadRequest($"Insufficient tokens. Required: {request.TokensToCharge}, Available: {user.TokenBalance}");
            }

            // Create batch job record
            var batchJob = new BatchTranscriptionJob
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                FileName = request.FileName,
                EstimatedDurationMinutes = request.EstimatedDurationMinutes,
                TokensCharged = request.TokensToCharge,
                Status = "submitted",
                SubmittedAt = DateTime.UtcNow
            };

            // Deduct tokens immediately
            user.TokenBalance -= request.TokensToCharge;

            _context.BatchTranscriptionJobs.Add(batchJob);
            await _context.SaveChangesAsync();

            _logger.LogInformation("Created batch job {JobId} for user {UserId}, charged {Tokens} tokens", 
                batchJob.Id, userId, request.TokensToCharge);

            var response = new SubmitBatchJobResponse
            {
                JobId = batchJob.Id,
                Status = batchJob.Status,
                EstimatedTime = $"{request.EstimatedDurationMinutes * 0.3:F0}-{request.EstimatedDurationMinutes * 0.5:F0} minutes",
                CheckStatusUrl = Url.Action("GetStatus", new { jobId = batchJob.Id }) ?? "",
                SubmittedAt = batchJob.SubmittedAt
            };

            return Ok(response);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error submitting batch job for user {UserId}", GetCurrentUserId());
            return StatusCode(500, "An error occurred while submitting the job");
        }
    }

    /// <summary>
    /// Check the status of a batch transcription job
    /// </summary>
    /// <param name="jobId">Job identifier</param>
    /// <returns>Current job status and progress</returns>
    [HttpGet("{jobId}/status")]
    [Authorize]
    public async Task<ActionResult<BatchJobStatusResponse>> GetStatus(Guid jobId)
    {
        try
        {
            var userId = GetCurrentUserId();
            
            var job = await _context.BatchTranscriptionJobs
                .Where(j => j.Id == jobId && j.UserId == userId)
                .FirstOrDefaultAsync();

            if (job == null)
            {
                return NotFound("Job not found");
            }

            var response = new BatchJobStatusResponse
            {
                JobId = job.Id,
                Status = job.Status,
                ProgressPercentage = job.ProgressPercentage,
                SubmittedAt = job.SubmittedAt,
                CompletedAt = job.CompletedAt,
                EstimatedDurationMinutes = job.EstimatedDurationMinutes,
                FileName = job.FileName,
                ErrorMessage = job.ErrorMessage,
                RetryCount = job.RetryCount,
                MaxRetries = job.MaxRetries,
                RefundIssued = job.RefundIssued,
                ProcessingDuration = job.ProcessingDuration
            };

            // If job is completed, include results
            if (job.Status == "completed" && !string.IsNullOrEmpty(job.ResultsJson))
            {
                try
                {
                    response.Results = _batchService.ParseAzureResults(job.ResultsJson);
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Error parsing results for job {JobId}", jobId);
                    // Don't fail the status request if parsing fails
                }
            }

            return Ok(response);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting status for job {JobId}", jobId);
            return StatusCode(500, "An error occurred while getting job status");
        }
    }

    /// <summary>
    /// Get all batch jobs for the current user
    /// </summary>
    /// <param name="status">Optional status filter</param>
    /// <param name="limit">Maximum number of jobs to return (default: 50)</param>
    /// <returns>List of user's batch jobs</returns>
    [HttpGet]
    [Authorize]
    public async Task<ActionResult<List<BatchJobStatusResponse>>> GetUserJobs(
        [FromQuery] string? status = null,
        [FromQuery] int limit = 50)
    {
        try
        {
            var userId = GetCurrentUserId();
            
            var query = _context.BatchTranscriptionJobs
                .Where(j => j.UserId == userId);

            if (!string.IsNullOrEmpty(status))
            {
                query = query.Where(j => j.Status == status);
            }

            var jobs = await query
                .OrderByDescending(j => j.SubmittedAt)
                .Take(Math.Min(limit, 100)) // Cap at 100
                .Select(job => new BatchJobStatusResponse
                {
                    JobId = job.Id,
                    Status = job.Status,
                    ProgressPercentage = job.ProgressPercentage,
                    SubmittedAt = job.SubmittedAt,
                    CompletedAt = job.CompletedAt,
                    EstimatedDurationMinutes = job.EstimatedDurationMinutes,
                    FileName = job.FileName,
                    ErrorMessage = job.ErrorMessage,
                    RetryCount = job.RetryCount,
                    MaxRetries = job.MaxRetries,
                    RefundIssued = job.RefundIssued,
                    ProcessingDuration = job.ProcessingDuration
                })
                .ToListAsync();

            return Ok(jobs);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting batch jobs for user {UserId}", GetCurrentUserId());
            return StatusCode(500, "An error occurred while getting batch jobs");
        }
    }

    /// <summary>
    /// Cancel a pending or processing batch job
    /// </summary>
    /// <param name="jobId">Job identifier</param>
    /// <returns>Cancellation result</returns>
    [HttpPost("{jobId}/cancel")]
    [Authorize]
    public async Task<ActionResult> CancelJob(Guid jobId)
    {
        try
        {
            var userId = GetCurrentUserId();
            
            var job = await _context.BatchTranscriptionJobs
                .Where(j => j.Id == jobId && j.UserId == userId)
                .FirstOrDefaultAsync();

            if (job == null)
            {
                return NotFound("Job not found");
            }

            if (job.Status == "completed" || job.Status == "failed")
            {
                return BadRequest("Cannot cancel a completed or failed job");
            }

            // Try to cancel with Azure if we have an Azure job ID
            bool azureCancelled = true;
            if (!string.IsNullOrEmpty(job.AzureJobId))
            {
                try
                {
                    var speechApiKey = _speechOptions.Key;
                    azureCancelled = await _batchService.CancelJobAsync(job.AzureJobId);
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Failed to cancel Azure job {AzureJobId} for job {JobId}", 
                        job.AzureJobId, jobId);
                    // Continue with local cancellation even if Azure fails
                }
            }

            // Update job status
            job.Status = "failed";
            job.CompletedAt = DateTime.UtcNow;
            job.ErrorMessage = "Job cancelled by user";

            // Issue refund if not already refunded
            if (!job.RefundIssued)
            {
                var user = await _context.Users.FindAsync(userId);
                if (user != null)
                {
                    user.TokenBalance += job.TokensCharged;
                    job.RefundIssued = true;
                    _logger.LogInformation("Issued refund of {Tokens} tokens for cancelled job {JobId}", 
                        job.TokensCharged, jobId);
                }
            }

            await _context.SaveChangesAsync();

            _logger.LogInformation("Cancelled job {JobId} for user {UserId}", jobId, userId);
            return Ok(new { message = "Job cancelled successfully", refunded = job.RefundIssued });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error cancelling job {JobId}", jobId);
            return StatusCode(500, "An error occurred while cancelling the job");
        }
    }

    /// <summary>
    /// Get the current user's ID from the JWT token
    /// </summary>
    /// <returns>User ID</returns>
    private Guid GetCurrentUserId()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userIdClaim) || !Guid.TryParse(userIdClaim, out var userId))
        {
            throw new UnauthorizedAccessException("Invalid user token");
        }
        return userId;
    }
}
