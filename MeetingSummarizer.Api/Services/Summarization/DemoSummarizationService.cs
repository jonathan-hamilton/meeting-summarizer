using MeetingSummarizer.Api.Models;
using System.Text.Json;

namespace MeetingSummarizer.Api.Services.Summarization;

/// <summary>
/// Demo summarization service for demonstrations when OpenAI is unavailable
/// </summary>
public class DemoSummarizationService : ISummarizationService
{
    private readonly ILogger<DemoSummarizationService> _logger;

    public DemoSummarizationService(ILogger<DemoSummarizationService> logger)
    {
        _logger = logger;
    }

    public async Task<SummaryResult> GenerateSummaryAsync(
        string transcript,
        SummaryOptions options,
        CancellationToken cancellationToken = default)
    {
        _logger.LogWarning("Using demo summarization service - OpenAI API not available");

        var stopwatch = System.Diagnostics.Stopwatch.StartNew();

        // Simulate processing time
        await Task.Delay(Random.Shared.Next(1000, 3000), cancellationToken);

        stopwatch.Stop();

        var summary = GenerateDemoSummary(transcript, options);

        var result = new SummaryResult
        {
            Content = summary,
            SummaryType = options.Style,
            ProcessingTimeMs = stopwatch.ElapsedMilliseconds,
            TokenCount = summary.Length / 4,
            GeneratedFor = options.TargetRole
        };

        // Add demo action items and decisions for appropriate styles
        if (options.IncludeActionItems)
        {
            result.ActionItems = GenerateDemoActionItems();
        }

        if (options.IncludeKeyDecisions)
        {
            result.KeyDecisions = GenerateDemoKeyDecisions();
        }

        _logger.LogInformation("Demo summary generated. Style: {Style}, Length: {Length} characters",
            options.Style, summary.Length);

        return result;
    }

    // TODO: Implement for Demo Mode - currently commented out due to namespace conflicts
    public async Task<SummaryResult> GenerateRoleAwareSummaryAsync(
        string transcript,
        List<Models.SpeakerMapping> speakerMappings,
        SummaryOptions options,
        CancellationToken cancellationToken = default)
    {
        // Temporarily return basic summary until Demo Mode implementation
        _logger.LogWarning("Role-aware demo summarization not yet implemented - falling back to basic summary");
        return await GenerateSummaryAsync(transcript, options, cancellationToken);
    }

    // TODO: Implement for Demo Mode - currently commented out due to namespace conflicts  
    public async Task<MeetingSummary> GenerateMeetingSummaryAsync(
        string transcript,
        List<Models.SpeakerMapping> speakerMappings,
        int maxTokens = 800,
        CancellationToken cancellationToken = default)
    {
        _logger.LogWarning("Demo meeting summary not yet implemented");
        
        // Return a basic demo meeting summary
        await Task.Delay(Random.Shared.Next(1500, 3000), cancellationToken);
        
        return new MeetingSummary
        {
            MeetingOverview = "Demo meeting summary - implementation pending for Demo Mode",
            ActionItemsByRole = new List<ActionItemsByRole>(),
            UnassignedActionItems = new List<UnassignedActionItem>(),
            Metadata = new MeetingMetadata(),
            Generation = new GenerationMetadata
            {
                ProcessingTimeMs = 2000,
                TokenCount = 150
            }
        };
    }

    public Task<bool> IsServiceAvailableAsync(CancellationToken cancellationToken = default)
    {
        _logger.LogDebug("Demo summarization service is always available");
        return Task.FromResult(true);
    }

    public string GetServiceStatus()
    {
        var status = new
        {
            ServiceName = "Demo AI Summarization Service",
            Available = true,
            Mode = "Demo Mode",
            SupportedStyles = Enum.GetNames<SummaryStyle>(),
            Features = new[]
            {
                "Demo generic summarization",
                "Basic role-aware summarization (pending)",
                "Simulated action item extraction",
                "Simulated key decision identification"
            },
            Note = "This is a demo service for demonstrations. Configure OpenAI API key for production features."
        };

        return JsonSerializer.Serialize(status, new JsonSerializerOptions { WriteIndented = true });
    }

    /// <summary>
    /// Generates a demo summary based on the transcript and options
    /// </summary>
    private string GenerateDemoSummary(string transcript, SummaryOptions options)
    {
        var wordCount = transcript.Split(' ', StringSplitOptions.RemoveEmptyEntries).Length;
        var characterCount = transcript.Length;

        return options.Style switch
        {
            SummaryStyle.Brief => GenerateBriefDemoSummary(wordCount, characterCount),
            SummaryStyle.Detailed => GenerateDetailedDemoSummary(wordCount, characterCount),
            SummaryStyle.ActionItems => GenerateActionItemsDemoSummary(wordCount, characterCount),
            SummaryStyle.KeyDecisions => GenerateDecisionsDemoSummary(wordCount, characterCount),
            SummaryStyle.ExecutiveSummary => GenerateExecutiveDemoSummary(wordCount, characterCount),
            _ => GenerateBriefDemoSummary(wordCount, characterCount)
        };
    }

    private string GenerateBriefDemoSummary(int wordCount, int characterCount)
    {
        return $"DEMO SUMMARY: This meeting transcript contained {wordCount} words and {characterCount} characters. " +
               "Key topics discussed included project updates, timeline reviews, and action item assignments. " +
               "The team covered important decisions and next steps for moving forward.";
    }

    private string GenerateDetailedDemoSummary(int wordCount, int characterCount)
    {
        return $"DEMO DETAILED SUMMARY: This comprehensive meeting transcript ({wordCount} words, {characterCount} characters) " +
               "covered several important areas:\n\n" +
               "1. Project Status Updates: Team members provided updates on current initiatives\n" +
               "2. Timeline Reviews: Discussion of upcoming milestones and deadlines\n" +
               "3. Resource Planning: Allocation of team resources and budget considerations\n" +
               "4. Risk Assessment: Identification of potential challenges and mitigation strategies\n" +
               "5. Next Steps: Clear action items and ownership assignments\n\n" +
               "The meeting concluded with agreement on priorities and next meeting scheduling.";
    }

    private string GenerateActionItemsDemoSummary(int wordCount, int characterCount)
    {
        return $"DEMO ACTION ITEMS SUMMARY: Based on the meeting transcript ({wordCount} words), " +
               "the following action items were identified:\n\n" +
               "• Complete project documentation by end of week\n" +
               "• Schedule follow-up meeting with stakeholders\n" +
               "• Review and approve budget proposals\n" +
               "• Finalize timeline for next quarter deliverables\n" +
               "• Update project status dashboard";
    }

    private string GenerateDecisionsDemoSummary(int wordCount, int characterCount)
    {
        return $"DEMO KEY DECISIONS SUMMARY: Important decisions made during this meeting ({wordCount} words):\n\n" +
               "• Approved moving forward with the proposed timeline\n" +
               "• Decided to allocate additional resources to priority projects\n" +
               "• Agreed on new meeting cadence for better communication\n" +
               "• Selected preferred vendor for upcoming implementation\n" +
               "• Confirmed budget allocation for next phase";
    }

    private string GenerateExecutiveDemoSummary(int wordCount, int characterCount)
    {
        return $"DEMO EXECUTIVE SUMMARY: Meeting Overview ({wordCount} words processed)\n\n" +
               "OUTCOMES: Key decisions were reached on project direction and resource allocation. " +
               "The team demonstrated strong alignment on priorities and timeline commitments.\n\n" +
               "NEXT STEPS: Action items assigned with clear ownership and deadlines. " +
               "Follow-up meetings scheduled to ensure progress tracking.\n\n" +
               "RISKS: Minimal risks identified, with mitigation strategies in place for potential challenges.";
    }

    private List<string> GenerateDemoActionItems()
    {
        return new List<string>
        {
            "Complete project documentation review by Friday",
            "Schedule stakeholder alignment meeting",
            "Update budget forecasts for Q4",
            "Finalize resource allocation plans",
            "Prepare status report for leadership team"
        };
    }

    private List<string> GenerateDemoKeyDecisions()
    {
        return new List<string>
        {
            "Approved timeline extension for critical deliverables",
            "Selected preferred technology stack for implementation",
            "Agreed on weekly progress review meetings",
            "Allocated additional budget for external consultants",
            "Confirmed go-live date for new system launch"
        };
    }

    // TODO: Role-aware methods will be implemented during Demo Mode development
    // Currently commented out due to SpeakerMapping namespace conflicts
    
    /*
    private string GenerateDemoRoleAwareSummary(string transcript, List<Models.SpeakerMapping> speakerMappings, SummaryOptions options)
    {
        // Implementation pending for Demo Mode
        return "Role-aware demo summary implementation pending";
    }

    private List<string> GenerateDemoActionItemsWithRoles(List<Models.SpeakerMapping> speakerMappings)
    {
        // Implementation pending for Demo Mode
        return GenerateDemoActionItems();
    }

    private List<string> GenerateDemoKeyDecisionsWithRoles(List<Models.SpeakerMapping> speakerMappings)
    {
        // Implementation pending for Demo Mode
        return GenerateDemoKeyDecisions();
    }
    */
}
