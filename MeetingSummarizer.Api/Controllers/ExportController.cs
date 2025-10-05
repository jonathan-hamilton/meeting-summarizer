using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MeetingSummarizer.Api.Data;
using MeetingSummarizer.Api.Data.Entities;
using MeetingSummarizer.Api.Services;
using MeetingSummarizer.Api.Models;
using System.Security.Claims;

namespace MeetingSummarizer.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize] // Require authentication for all export operations
public class ExportController : ControllerBase
{
    private readonly IDocumentService _documentService;
    private readonly MeetingSummarizerDbContext _context;
    private readonly ILogger<ExportController> _logger;

    public ExportController(
        IDocumentService documentService, 
        MeetingSummarizerDbContext context,
        ILogger<ExportController> logger)
    {
        _documentService = documentService;
        _context = context;
        _logger = logger;
    }

    /// <summary>
    /// Generate and download a PDF transcript for the specified transcription
    /// </summary>
    /// <param name="transcriptionId">The transcription identifier</param>
    /// <returns>PDF file download</returns>
    [HttpGet("transcript/{transcriptionId}/pdf")]
    public async Task<IActionResult> DownloadTranscriptPdf(string transcriptionId)
    {
        try
        {
            // Get the current user ID from JWT token
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdClaim) || !Guid.TryParse(userIdClaim, out var userId))
            {
                return Unauthorized("Invalid user authentication");
            }

            _logger.LogInformation("PDF download requested for transcriptionId: {TranscriptionId} by user: {UserId}", transcriptionId, userId);

            // Find the meeting by transcription ID (could be fast transcription job ID or meeting ID)
            Meeting? meeting = null;
            
            if (Guid.TryParse(transcriptionId, out var transcriptionGuid))
            {
                _logger.LogDebug("Parsed transcriptionId as GUID: {Guid}", transcriptionGuid);
                
                // First try to find by fast transcription job ID
                var fastJob = await _context.FastTranscriptionJobs
                    .Where(f => f.Id == transcriptionGuid && f.UserId == userId)
                    .FirstOrDefaultAsync();

                if (fastJob != null && fastJob.MeetingId.HasValue)
                {
                    _logger.LogDebug("Found fast job {FastJobId} linked to meeting {MeetingId}", fastJob.Id, fastJob.MeetingId);
                    // Found fast job, get the associated meeting
                    meeting = await _context.Meetings
                        .Where(m => m.Id == fastJob.MeetingId.Value && m.UserId == userId)
                        .FirstOrDefaultAsync();
                }
                else
                {
                    _logger.LogDebug("No fast transcription job found, trying to find meeting by ID directly");
                    // Try to find meeting by ID directly
                    meeting = await _context.Meetings
                        .Where(m => m.Id == transcriptionGuid && m.UserId == userId)
                        .FirstOrDefaultAsync();
                }
            }
            else
            {
                _logger.LogWarning("TranscriptionId {TranscriptionId} is not a valid GUID", transcriptionId);
            }

            if (meeting == null)
            {
                return NotFound($"Meeting not found or access denied for transcription ID: {transcriptionId}");
            }

            // Parse speaker mappings from meeting JSON
            var speakerMappings = new List<Models.SpeakerMapping>();
            if (!string.IsNullOrEmpty(meeting.SpeakerMappingsJson))
            {
                try
                {
                    var mappingData = System.Text.Json.JsonSerializer.Deserialize<Models.SpeakerMappingResponse>(meeting.SpeakerMappingsJson);
                    speakerMappings = mappingData?.Mappings?.ToList() ?? new List<Models.SpeakerMapping>();
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Failed to parse speaker mappings for meeting {MeetingId}", meeting.Id);
                }
            }

            _logger.LogInformation("Generating PDF for transcription {TranscriptionId} with {MappingCount} speaker mappings", 
                transcriptionId, speakerMappings.Count);

            // Generate the PDF
            var pdfBytes = await _documentService.GenerateTranscriptPdfAsync(transcriptionId, speakerMappings);

            // Create filename with timestamp
            var fileName = $"meeting-transcript-{DateTime.UtcNow:yyyy-MM-dd-HH-mm}.pdf";

            _logger.LogInformation("Successfully generated PDF {FileName} ({Size} bytes) for user {UserId}", 
                fileName, pdfBytes.Length, userId);

            // Return the PDF file
            return File(pdfBytes, "application/pdf", fileName);
        }
        catch (ArgumentException ex)
        {
            _logger.LogWarning(ex, "Invalid transcription ID requested: {TranscriptionId}", transcriptionId);
            return BadRequest(new { message = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogWarning(ex, "No transcript data found for transcription ID: {TranscriptionId}", transcriptionId);
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error generating PDF for transcription {TranscriptionId}", transcriptionId);
            return StatusCode(500, new { message = "An error occurred while generating the PDF. Please try again later." });
        }
    }

    /// <summary>
    /// Get export status and available formats for a transcription
    /// </summary>
    /// <param name="transcriptionId">The transcription identifier</param>
    /// <returns>Available export options</returns>
    [HttpGet("transcript/{transcriptionId}/info")]
    public async Task<IActionResult> GetExportInfo(string transcriptionId)
    {
        try
        {
            // Get the current user ID from JWT token
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdClaim) || !Guid.TryParse(userIdClaim, out var userId))
            {
                return Unauthorized("Invalid user authentication");
            }

            // Find the meeting using same logic as DownloadTranscriptPdf
            Meeting? meeting = null;
            
            if (Guid.TryParse(transcriptionId, out var transcriptionGuid))
            {
                var fastJob = await _context.FastTranscriptionJobs
                    .Where(f => f.Id == transcriptionGuid && f.UserId == userId)
                    .FirstOrDefaultAsync();

                if (fastJob != null && fastJob.MeetingId.HasValue)
                {
                    meeting = await _context.Meetings
                        .Where(m => m.Id == fastJob.MeetingId.Value && m.UserId == userId)
                        .FirstOrDefaultAsync();
                }
                else
                {
                    meeting = await _context.Meetings
                        .Where(m => m.Id == transcriptionGuid && m.UserId == userId)
                        .FirstOrDefaultAsync();
                }
            }

            if (meeting == null)
            {
                return NotFound($"Meeting not found or access denied for transcription ID: {transcriptionId}");
            }

            // Count speaker mappings from JSON
            var speakerMappingCount = 0;
            if (!string.IsNullOrEmpty(meeting.SpeakerMappingsJson))
            {
                try
                {
                    var mappingData = System.Text.Json.JsonSerializer.Deserialize<Models.SpeakerMappingResponse>(meeting.SpeakerMappingsJson);
                    speakerMappingCount = mappingData?.Mappings?.Count ?? 0;
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Failed to parse speaker mappings for meeting {MeetingId}", meeting.Id);
                }
            }

            return Ok(new
            {
                transcriptionId,
                availableFormats = new[] { "pdf" },
                speakerMappingCount,
                meetingDate = meeting.CreatedAt,
                completedAt = meeting.CompletedAt,
                status = meeting.Status.ToString()
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting export info for transcription {TranscriptionId}", transcriptionId);
            return StatusCode(500, new { message = "An error occurred while getting export information." });
        }
    }

    /// <summary>
    /// Generate and download a PDF summary for the specified saved summary
    /// </summary>
    /// <param name="summaryId">The saved summary identifier</param>
    /// <returns>PDF file download</returns>
    [HttpGet("summary/{summaryId}/pdf")]
    public async Task<IActionResult> DownloadSummaryPdf(string summaryId)
    {
        try
        {
            // Get the current user ID from JWT token
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdClaim) || !Guid.TryParse(userIdClaim, out var userId))
            {
                return Unauthorized("Invalid user authentication");
            }

            _logger.LogInformation("Summary PDF download requested for summaryId: {SummaryId} by user: {UserId}", summaryId, userId);

            // Find the saved summary by ID and verify ownership
            SavedSummary? savedSummary = null;
            
            if (Guid.TryParse(summaryId, out var summaryGuid))
            {
                savedSummary = await _context.SavedSummaries
                    .Include(s => s.Meeting)
                    .Where(s => s.Id == summaryGuid && s.UserId == userId)
                    .FirstOrDefaultAsync();
            }
            else
            {
                _logger.LogWarning("SummaryId {SummaryId} is not a valid GUID", summaryId);
            }

            if (savedSummary == null)
            {
                return NotFound($"Summary not found or access denied for summary ID: {summaryId}");
            }

            // Parse speaker mappings from the associated meeting (if available)
            var speakerMappings = new List<Models.SpeakerMapping>();
            if (savedSummary.Meeting != null && !string.IsNullOrEmpty(savedSummary.Meeting.SpeakerMappingsJson))
            {
                try
                {
                    var mappingData = System.Text.Json.JsonSerializer.Deserialize<Models.SpeakerMappingResponse>(savedSummary.Meeting.SpeakerMappingsJson);
                    speakerMappings = mappingData?.Mappings?.ToList() ?? new List<Models.SpeakerMapping>();
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Failed to parse speaker mappings for summary {SummaryId}", savedSummary.Id);
                }
            }

            _logger.LogInformation("Generating summary PDF for summary {SummaryId} with {MappingCount} speaker mappings", 
                summaryId, speakerMappings.Count);

            // Generate the PDF
            var pdfBytes = await _documentService.GenerateSummaryPdfAsync(summaryId, speakerMappings);

            // Create filename with timestamp
            var fileName = $"meeting-summary-{DateTime.UtcNow:yyyy-MM-dd-HH-mm}.pdf";

            _logger.LogInformation("Successfully generated summary PDF {FileName} ({Size} bytes) for user {UserId}", 
                fileName, pdfBytes.Length, userId);

            // Return the PDF file
            return File(pdfBytes, "application/pdf", fileName);
        }
        catch (ArgumentException ex)
        {
            _logger.LogWarning(ex, "Invalid summary ID requested: {SummaryId}", summaryId);
            return BadRequest(new { message = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogWarning(ex, "No summary data found for summary ID: {SummaryId}", summaryId);
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error generating summary PDF for summary {SummaryId}", summaryId);
            return StatusCode(500, new { message = "An error occurred while generating the PDF. Please try again later." });
        }
    }
}