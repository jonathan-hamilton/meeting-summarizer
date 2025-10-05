using Microsoft.EntityFrameworkCore;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;
using MeetingSummarizer.Api.Data;
using MeetingSummarizer.Api.Data.Entities;
using MeetingSummarizer.Api.Models;
using System.Text.Json;

namespace MeetingSummarizer.Api.Services;

public class DocumentService : IDocumentService
{
    private readonly MeetingSummarizerDbContext _context;
    private readonly ILogger<DocumentService> _logger;

    public DocumentService(MeetingSummarizerDbContext context, ILogger<DocumentService> logger)
    {
        _context = context;
        _logger = logger;
        
        // Configure QuestPDF license (Community license for non-commercial use)
        QuestPDF.Settings.License = LicenseType.Community;
    }

    public async Task<byte[]> GenerateTranscriptPdfAsync(string transcriptionId, List<Models.SpeakerMapping> speakerMappings)
    {
        try
        {
            // Find the meeting by transcription ID (could be fast transcription job ID or meeting ID)
            Meeting? meeting = null;
            
            if (Guid.TryParse(transcriptionId, out var transcriptionGuid))
            {
                // First try to find by fast transcription job ID
                var fastJob = await _context.FastTranscriptionJobs
                    .Where(f => f.Id == transcriptionGuid)
                    .FirstOrDefaultAsync();

                if (fastJob != null && fastJob.MeetingId.HasValue)
                {
                    // Found fast job, get the associated meeting
                    meeting = await _context.Meetings
                        .Where(m => m.Id == fastJob.MeetingId.Value)
                        .FirstOrDefaultAsync();
                }
                else
                {
                    // Try to find meeting by ID directly
                    meeting = await _context.Meetings
                        .Where(m => m.Id == transcriptionGuid)
                        .FirstOrDefaultAsync();
                }
            }

            if (meeting == null)
            {
                throw new ArgumentException($"Meeting not found for transcription ID: {transcriptionId}");
            }

            // Parse speaker segments from transcription JSON
            List<PdfSpeakerSegment> speakerSegments = new();
            
            _logger.LogInformation("Processing meeting {MeetingId} with TranscriptionJson length: {Length}", 
                meeting.Id, meeting.TranscriptionJson?.Length ?? 0);

            if (!string.IsNullOrEmpty(meeting.TranscriptionJson))
            {
                _logger.LogDebug("TranscriptionJson content preview: {Preview}", 
                    meeting.TranscriptionJson.Length > 200 ? meeting.TranscriptionJson[..200] + "..." : meeting.TranscriptionJson);

                try
                {
                    // First try to parse as a TranscriptionResponse object
                    var transcriptionResponse = System.Text.Json.JsonSerializer.Deserialize<TranscriptionResponseForPdf>(meeting.TranscriptionJson);
                    if (transcriptionResponse?.SpeakerSegments != null && transcriptionResponse.SpeakerSegments.Any())
                    {
                        speakerSegments = transcriptionResponse.SpeakerSegments;
                        _logger.LogInformation("Successfully parsed {Count} segments from TranscriptionResponse", speakerSegments.Count);
                    }
                    else
                    {
                        // Try to parse as array directly
                        speakerSegments = System.Text.Json.JsonSerializer.Deserialize<List<PdfSpeakerSegment>>(meeting.TranscriptionJson) ?? new();
                        _logger.LogInformation("Successfully parsed {Count} segments as direct array", speakerSegments.Count);
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Failed to parse TranscriptionJson, trying alternative approaches");
                    
                    // Try to extract from a wrapper object with different property names
                    var transcriptionData = System.Text.Json.JsonSerializer.Deserialize<System.Text.Json.JsonElement>(meeting.TranscriptionJson);
                    
                    var possibleProperties = new[] { "speakerSegments", "SpeakerSegments", "segments", "Segments" };
                    foreach (var prop in possibleProperties)
                    {
                        if (transcriptionData.TryGetProperty(prop, out var segmentsElement))
                        {
                            try
                            {
                                speakerSegments = System.Text.Json.JsonSerializer.Deserialize<List<PdfSpeakerSegment>>(segmentsElement.GetRawText()) ?? new();
                                if (speakerSegments.Any())
                                {
                                    _logger.LogInformation("Successfully parsed {Count} segments from property '{Property}'", speakerSegments.Count, prop);
                                    break;
                                }
                            }
                            catch (Exception propEx)
                            {
                                _logger.LogDebug(propEx, "Failed to parse segments from property '{Property}'", prop);
                            }
                        }
                    }
                }
            }
            else
            {
                _logger.LogWarning("Meeting {MeetingId} has no TranscriptionJson data", meeting.Id);
            }

            if (!speakerSegments.Any())
            {
                _logger.LogError("No speaker segments found for meeting {MeetingId}. TranscriptionJson is {IsEmpty}", 
                    meeting.Id, string.IsNullOrEmpty(meeting.TranscriptionJson) ? "empty" : "not empty");
                throw new InvalidOperationException("No speaker segments found for this meeting");
            }

            // Generate PDF document
            var document = Document.Create(container =>
            {
                container.Page(page =>
                {
                    page.Size(PageSizes.A4);
                    page.Margin(2, Unit.Centimetre);
                    page.PageColor(Colors.White);
                    page.DefaultTextStyle(x => x.FontSize(11).FontFamily(Fonts.Arial));

                    // Header
                    page.Header()
                        .Height(80)
                        .Background(Colors.Grey.Lighten3)
                        .Padding(20)
                        .Row(row =>
                        {
                            row.RelativeItem().Column(column =>
                            {
                                column.Item().Text("Meeting Transcript")
                                    .FontSize(24)
                                    .Bold()
                                    .FontColor(Colors.Blue.Darken2);
                                
                                column.Item().Text($"Generated on {DateTime.UtcNow:MMMM dd, yyyy 'at' HH:mm} UTC")
                                    .FontSize(10)
                                    .FontColor(Colors.Grey.Darken2);
                            });
                            
                            row.ConstantItem(120).AlignRight().Column(column =>
                            {
                                column.Item().Text($"Created: {meeting.CreatedAt:MMM dd, yyyy}")
                                    .FontSize(9)
                                    .FontColor(Colors.Grey.Darken1);
                                
                                if (speakerMappings.Any())
                                {
                                    column.Item().Text($"Participants: {speakerMappings.Count}")
                                        .FontSize(9)
                                        .FontColor(Colors.Grey.Darken1);
                                }
                            });
                        });

                    // Content
                    page.Content()
                        .PaddingVertical(20)
                        .Column(column =>
                        {
                            // Participants section (if mappings exist)
                            if (speakerMappings.Any())
                            {
                                column.Item().PaddingBottom(10).Text("Meeting Participants")
                                    .FontSize(16)
                                    .SemiBold()
                                    .FontColor(Colors.Blue.Darken2);

                                foreach (var mapping in speakerMappings.OrderBy(m => m.SpeakerId))
                                {
                                    column.Item().Row(row =>
                                    {
                                        row.ConstantItem(20).Text("•").FontSize(12);
                                        row.RelativeItem().Text(text =>
                                        {
                                            text.Span($"{mapping.Name}");
                                            if (!string.IsNullOrEmpty(mapping.Role))
                                            {
                                                text.Span($" - {mapping.Role}").FontColor(Colors.Grey.Darken2);
                                            }
                                            if (!string.IsNullOrEmpty(mapping.Email))
                                            {
                                                text.Span($" ({mapping.Email})").FontColor(Colors.Grey.Darken1).FontSize(9);
                                            }
                                        });
                                    });
                                }

                                column.Item().PaddingTop(20).LineHorizontal(1).LineColor(Colors.Grey.Lighten2);
                                column.Item().PaddingBottom(15);
                            }

                            // Transcript section
                            column.Item().Text("Full Transcript")
                                .FontSize(16)
                                .SemiBold()
                                .FontColor(Colors.Blue.Darken2);

                            // Speaker segments
                            foreach (var segment in speakerSegments.OrderBy(s => s.Start))
                            {
                                var speakerMapping = speakerMappings.FirstOrDefault(m => m.SpeakerId == segment.Speaker);
                                var displayName = speakerMapping?.Name ?? segment.Speaker;
                                var role = speakerMapping?.Role;

                                column.Item().PaddingBottom(8).Row(row =>
                                {
                                    // Timestamp
                                    row.ConstantItem(60).Text(FormatTimestamp(segment.Start))
                                        .FontSize(9)
                                        .FontColor(Colors.Grey.Darken2);

                                    // Speaker name and content
                                    row.RelativeItem().Column(speakerColumn =>
                                    {
                                        speakerColumn.Item().Text(text =>
                                        {
                                            text.Span(displayName).SemiBold().FontColor(Colors.Blue.Darken3);
                                            if (!string.IsNullOrEmpty(role))
                                            {
                                                text.Span($" ({role})").FontSize(9).FontColor(Colors.Grey.Darken2);
                                            }
                                            text.Span(":").SemiBold();
                                        });

                                        speakerColumn.Item().PaddingTop(3).Text(segment.Text)
                                            .LineHeight(1.4f);
                                    });
                                });
                            }
                        });

                    // Footer
                    page.Footer()
                        .Height(30)
                        .AlignCenter()
                        .Text("Generated by Meeting Summarizer")
                        .FontSize(8)
                        .FontColor(Colors.Grey.Darken1);
                });
            });

            // Generate and return PDF bytes
            return document.GeneratePdf();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error generating PDF for transcription {TranscriptionId}", transcriptionId);
            throw;
        }
    }

    public async Task<byte[]> GenerateSummaryPdfAsync(string summaryId, List<Models.SpeakerMapping> speakerMappings)
    {
        try
        {
            // Find the saved summary by ID
            SavedSummary? savedSummary = null;
            
            if (Guid.TryParse(summaryId, out var summaryGuid))
            {
                savedSummary = await _context.SavedSummaries
                    .Include(s => s.Meeting)
                    .Include(s => s.ActionItems)
                    .Where(s => s.Id == summaryGuid)
                    .FirstOrDefaultAsync();
            }

            if (savedSummary == null)
            {
                throw new ArgumentException($"Meeting summary not found for ID: {summaryId}");
            }

            // Parse the summary data from JSON
            Models.MeetingSummary? meetingSummary = null;
            string summaryContent = string.Empty;
            
            _logger.LogInformation("Processing summary {SummaryId} with SummaryData length: {Length}", 
                savedSummary.Id, savedSummary.SummaryData?.Length ?? 0);

            if (!string.IsNullOrEmpty(savedSummary.SummaryData))
            {
                try
                {
                    // Configure JSON options to handle camelCase from frontend
                    var jsonOptions = new JsonSerializerOptions
                    {
                        PropertyNameCaseInsensitive = true,
                        PropertyNamingPolicy = JsonNamingPolicy.CamelCase
                    };
                    
                    meetingSummary = System.Text.Json.JsonSerializer.Deserialize<Models.MeetingSummary>(savedSummary.SummaryData, jsonOptions);
                    summaryContent = meetingSummary?.MeetingOverview ?? string.Empty;
                    
                    _logger.LogInformation("Deserialized summary for {SummaryId}: MeetingOverview length: {Length}, HasActionItems: {HasActionItems}", 
                        savedSummary.Id, summaryContent.Length, meetingSummary?.ActionItemsByRole?.Any() == true);
                        
                    // Log the first 500 characters of the raw JSON to understand the structure
                    var jsonPreview = savedSummary.SummaryData.Length > 500 ? savedSummary.SummaryData[..500] + "..." : savedSummary.SummaryData;
                    _logger.LogInformation("Raw JSON preview for {SummaryId}: {JsonPreview}", savedSummary.Id, jsonPreview);
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Failed to parse summary data for summary {SummaryId}, content preview: {ContentPreview}", 
                        savedSummary.Id, savedSummary.SummaryData.Length > 200 ? savedSummary.SummaryData[..200] + "..." : savedSummary.SummaryData);
                }
            }

            // If we don't have summary content from the JSON, try to construct it from the saved summary fields
            if (string.IsNullOrEmpty(summaryContent))
            {
                summaryContent = savedSummary.Description ?? "Meeting Summary";
                _logger.LogInformation("Using saved summary description as content for summary {SummaryId}", savedSummary.Id);
            }

            if (string.IsNullOrEmpty(summaryContent))
            {
                throw new InvalidOperationException("No summary content found for this meeting");
            }

            // Generate PDF document
            var document = Document.Create(container =>
            {
                container.Page(page =>
                {
                    page.Size(PageSizes.A4);
                    page.Margin(2, Unit.Centimetre);
                    page.PageColor(Colors.White);
                    page.DefaultTextStyle(x => x.FontSize(11).FontFamily(Fonts.Arial));

                    // Header
                    page.Header()
                        .Height(80)
                        .Background(Colors.Grey.Lighten3)
                        .Padding(20)
                        .Row(row =>
                        {
                            row.RelativeItem().Column(column =>
                            {
                                column.Item().Text("Meeting Summary")
                                    .FontSize(24)
                                    .Bold()
                                    .FontColor(Colors.Blue.Darken2);
                                
                                column.Item().Text($"Generated on {DateTime.UtcNow:MMMM dd, yyyy 'at' HH:mm} UTC")
                                    .FontSize(10)
                                    .FontColor(Colors.Grey.Darken2);
                            });
                            
                            row.ConstantItem(120).AlignRight().Column(column =>
                            {
                                var createdDate = savedSummary.Meeting?.CreatedAt ?? savedSummary.CreatedAt;
                                column.Item().Text($"Created: {createdDate:MMM dd, yyyy}")
                                    .FontSize(9)
                                    .FontColor(Colors.Grey.Darken1);
                                
                                if (speakerMappings.Any())
                                {
                                    column.Item().Text($"Participants: {speakerMappings.Count}")
                                        .FontSize(9)
                                        .FontColor(Colors.Grey.Darken1);
                                }
                            });
                        });

                    // Content
                    page.Content()
                        .PaddingVertical(20)
                        .Column(column =>
                        {
                            // Participants section (if mappings exist)
                            if (speakerMappings.Any())
                            {
                                column.Item().PaddingBottom(10).Text("Meeting Participants")
                                    .FontSize(16)
                                    .SemiBold()
                                    .FontColor(Colors.Blue.Darken2);

                                foreach (var mapping in speakerMappings.OrderBy(m => m.SpeakerId))
                                {
                                    column.Item().Row(row =>
                                    {
                                        row.ConstantItem(20).Text("•").FontSize(12);
                                        row.RelativeItem().Text(text =>
                                        {
                                            text.Span($"{mapping.Name}");
                                            if (!string.IsNullOrEmpty(mapping.Role))
                                            {
                                                text.Span($" - {mapping.Role}").FontColor(Colors.Grey.Darken2);
                                            }
                                            if (!string.IsNullOrEmpty(mapping.Email))
                                            {
                                                text.Span($" ({mapping.Email})").FontColor(Colors.Grey.Darken1).FontSize(9);
                                            }
                                        });
                                    });
                                }

                                column.Item().PaddingTop(20).LineHorizontal(1).LineColor(Colors.Grey.Lighten2);
                                column.Item().PaddingBottom(15);
                            }

                            // Summary section
                            column.Item().Text("Meeting Summary")
                                .FontSize(16)
                                .SemiBold()
                                .FontColor(Colors.Blue.Darken2);

                            // Process summary content - split by double newlines for better formatting
                            var paragraphs = summaryContent.Split(new[] { "\n\n", "\r\n\r\n" }, StringSplitOptions.RemoveEmptyEntries);
                            
                            foreach (var paragraph in paragraphs)
                            {
                                var cleanParagraph = paragraph.Trim();
                                if (!string.IsNullOrEmpty(cleanParagraph))
                                {
                                    // Check if this looks like a section header (ends with :)
                                    if (cleanParagraph.EndsWith(":") && cleanParagraph.Length < 100)
                                    {
                                        column.Item().PaddingTop(15).PaddingBottom(5).Text(cleanParagraph)
                                            .FontSize(14)
                                            .SemiBold()
                                            .FontColor(Colors.Blue.Darken3);
                                    }
                                    else
                                    {
                                        column.Item().PaddingBottom(8).Text(cleanParagraph)
                                            .LineHeight(1.4f);
                                    }
                                }
                            }

                            // Action Items section - Prioritize database action items over JSON action items
                            // Database action items are the most up-to-date (includes manually added items)
                            if (savedSummary.ActionItems?.Any() == true)
                            {
                                column.Item().PaddingTop(20).Text("Action Items")
                                    .FontSize(16)
                                    .SemiBold()
                                    .FontColor(Colors.Blue.Darken2);

                                // Group action items by assignee
                                var groupedItems = savedSummary.ActionItems
                                    .GroupBy(a => string.IsNullOrEmpty(a.AssignedTo) ? "Unassigned" : a.AssignedTo)
                                    .OrderBy(g => g.Key == "Unassigned" ? 1 : 0) // Put assigned items first, unassigned last
                                    .ThenBy(g => g.Key);

                                foreach (var group in groupedItems)
                                {
                                    column.Item().PaddingTop(10).Text($"{group.Key}:")
                                        .FontSize(13)
                                        .SemiBold()
                                        .FontColor(Colors.Blue.Darken3);

                                    foreach (var actionItem in group.OrderBy(a => a.SortOrder))
                                    {
                                        column.Item().Row(row =>
                                        {
                                            row.ConstantItem(20).Text("•").FontSize(12);
                                            row.RelativeItem().Text(actionItem.Description).LineHeight(1.3f);
                                        });
                                    }
                                }
                            }
                            
                            // Fallback: If no database action items, use action items from original JSON
                            else if (meetingSummary?.ActionItemsByRole?.Any() == true || meetingSummary?.UnassignedActionItems?.Any() == true)
                            {
                                column.Item().PaddingTop(20).Text("Action Items")
                                    .FontSize(16)
                                    .SemiBold()
                                    .FontColor(Colors.Blue.Darken2);

                                // Action items by role
                                if (meetingSummary.ActionItemsByRole != null)
                                {
                                    foreach (var roleGroup in meetingSummary.ActionItemsByRole)
                                    {
                                        if (roleGroup.ActionItems?.Any() == true)
                                        {
                                            column.Item().PaddingTop(10).Text($"{roleGroup.SpeakerName}:")
                                                .FontSize(13)
                                                .SemiBold()
                                                .FontColor(Colors.Blue.Darken3);

                                            foreach (var item in roleGroup.ActionItems)
                                            {
                                                column.Item().Row(row =>
                                                {
                                                    row.ConstantItem(20).Text("•").FontSize(12);
                                                    row.RelativeItem().Text(item.Description)
                                                        .LineHeight(1.3f);
                                                });
                                            }
                                        }
                                    }
                                }

                                // Unassigned action items
                                if (meetingSummary?.UnassignedActionItems?.Any() == true)
                                {
                                    column.Item().PaddingTop(10).Text("Unassigned Items:")
                                        .FontSize(13)
                                        .SemiBold()
                                        .FontColor(Colors.Blue.Darken3);

                                    foreach (var item in meetingSummary.UnassignedActionItems)
                                    {
                                        column.Item().Row(row =>
                                        {
                                            row.ConstantItem(20).Text("•").FontSize(12);
                                            row.RelativeItem().Text(item.Description)
                                                .LineHeight(1.3f);
                                        });
                                    }
                                }
                            }
                        });

                    // Footer
                    page.Footer()
                        .Height(30)
                        .AlignCenter()
                        .Text("Generated by Meeting Summarizer")
                        .FontSize(8)
                        .FontColor(Colors.Grey.Darken1);
                });
            });

            // Generate and return PDF bytes
            return document.GeneratePdf();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error generating summary PDF for summary {SummaryId}", summaryId);
            throw;
        }
    }

    private static string FormatDuration(int? durationSeconds)
    {
        if (!durationSeconds.HasValue || durationSeconds <= 0)
            return "Unknown";

        var timeSpan = TimeSpan.FromSeconds(durationSeconds.Value);
        if (timeSpan.TotalHours >= 1)
            return $"{(int)timeSpan.TotalHours}h {timeSpan.Minutes}m";
        
        return $"{timeSpan.Minutes}m {timeSpan.Seconds}s";
    }

    private static string FormatTimestamp(double startSeconds)
    {
        var timeSpan = TimeSpan.FromSeconds(startSeconds);
        return $"[{timeSpan:mm\\:ss}]";
    }
}

// Helper classes for transcription data deserialization for PDF generation
public class PdfSpeakerSegment
{
    public string Speaker { get; set; } = string.Empty;
    public string Text { get; set; } = string.Empty;
    public double Start { get; set; }
    public double End { get; set; }
    public double? Confidence { get; set; }
}

public class TranscriptionResponseForPdf
{
    public string? TranscribedText { get; set; }
    public List<PdfSpeakerSegment>? SpeakerSegments { get; set; }
    public double? ProcessingTimeMs { get; set; }
}