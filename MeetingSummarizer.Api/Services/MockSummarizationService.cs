using MeetingSummarizer.Api.Models;
using System.Text.Json;

namespace MeetingSummarizer.Api.Services;

/// <summary>
/// Mock summarization service for development and testing when OpenAI is unavailable
/// </summary>
public class MockSummarizationService : ISummarizationService
{
    private readonly ILogger<MockSummarizationService> _logger;

    public MockSummarizationService(ILogger<MockSummarizationService> logger)
    {
        _logger = logger;
    }

    public async Task<SummaryResult> GenerateSummaryAsync(
        string transcript,
        SummaryOptions options,
        CancellationToken cancellationToken = default)
    {
        _logger.LogWarning("Using mock summarization service - OpenAI API not available");

        var stopwatch = System.Diagnostics.Stopwatch.StartNew();

        // Simulate processing time
        await Task.Delay(Random.Shared.Next(1000, 3000), cancellationToken);

        stopwatch.Stop();

        var summary = GenerateMockSummary(transcript, options);

        var result = new SummaryResult
        {
            Content = summary,
            SummaryType = options.Style,
            ProcessingTimeMs = stopwatch.ElapsedMilliseconds,
            TokenCount = summary.Length / 4,
            GeneratedFor = options.TargetRole
        };

        // Add mock action items and decisions for appropriate styles
        if (options.IncludeActionItems)
        {
            result.ActionItems = GenerateMockActionItems();
        }

        if (options.IncludeKeyDecisions)
        {
            result.KeyDecisions = GenerateMockKeyDecisions();
        }

        _logger.LogInformation("Mock summary generated. Style: {Style}, Length: {Length} characters",
            options.Style, summary.Length);

        return result;
    }

    public async Task<SummaryResult> GenerateRoleAwareSummaryAsync(
        string transcript,
        List<SpeakerMapping> speakerMappings,
        SummaryOptions options,
        CancellationToken cancellationToken = default)
    {
        _logger.LogWarning("Using mock role-aware summarization service - OpenAI API not available");

        var stopwatch = System.Diagnostics.Stopwatch.StartNew();

        // Simulate processing time
        await Task.Delay(Random.Shared.Next(1500, 4000), cancellationToken);

        stopwatch.Stop();

        var summary = GenerateMockRoleAwareSummary(transcript, speakerMappings, options);

        var result = new SummaryResult
        {
            Content = summary,
            SummaryType = options.Style,
            ProcessingTimeMs = stopwatch.ElapsedMilliseconds,
            TokenCount = summary.Length / 4,
            GeneratedFor = options.TargetRole,
            UsedSpeakerMappings = true
        };

        // Add mock action items and decisions for appropriate styles
        if (options.IncludeActionItems)
        {
            result.ActionItems = GenerateMockActionItemsWithRoles(speakerMappings);
        }

        if (options.IncludeKeyDecisions)
        {
            result.KeyDecisions = GenerateMockKeyDecisionsWithRoles(speakerMappings);
        }

        _logger.LogInformation("Mock role-aware summary generated. Style: {Style}, Speakers: {SpeakerCount}, Length: {Length} characters",
            options.Style, speakerMappings.Count, summary.Length);

        return result;
    }

    public Task<bool> IsServiceAvailableAsync(CancellationToken cancellationToken = default)
    {
        _logger.LogDebug("Mock summarization service is always available");
        return Task.FromResult(true);
    }

    public string GetServiceStatus()
    {
        var status = new
        {
            ServiceName = "Mock AI Summarization Service",
            Available = true,
            Mode = "Development/Testing",
            SupportedStyles = Enum.GetNames<SummaryStyle>(),
            Features = new[]
            {
                "Mock generic summarization",
                "Mock role-aware summarization",
                "Simulated action item extraction",
                "Simulated key decision identification"
            },
            Note = "This is a mock service for development. Configure OpenAI API key for production features."
        };

        return JsonSerializer.Serialize(status, new JsonSerializerOptions { WriteIndented = true });
    }

    /// <summary>
    /// Generates a mock summary based on the transcript and options
    /// </summary>
    private string GenerateMockSummary(string transcript, SummaryOptions options)
    {
        var wordCount = transcript.Split(' ', StringSplitOptions.RemoveEmptyEntries).Length;
        var characterCount = transcript.Length;

        return options.Style switch
        {
            SummaryStyle.Brief => GenerateBriefMockSummary(wordCount, characterCount),
            SummaryStyle.Detailed => GenerateDetailedMockSummary(wordCount, characterCount),
            SummaryStyle.ActionItems => GenerateActionItemsMockSummary(wordCount, characterCount),
            SummaryStyle.KeyDecisions => GenerateDecisionsMockSummary(wordCount, characterCount),
            SummaryStyle.ExecutiveSummary => GenerateExecutiveMockSummary(wordCount, characterCount),
            _ => GenerateBriefMockSummary(wordCount, characterCount)
        };
    }

    /// <summary>
    /// Generates a mock role-aware summary
    /// </summary>
    private string GenerateMockRoleAwareSummary(string transcript, List<SpeakerMapping> speakerMappings, SummaryOptions options)
    {
        var participantNames = string.Join(", ", speakerMappings.Select(m => $"{m.Name} ({m.Role})"));
        var wordCount = transcript.Split(' ', StringSplitOptions.RemoveEmptyEntries).Length;

        var baseSummary = options.Style switch
        {
            SummaryStyle.Brief => $"[MOCK ROLE-AWARE SUMMARY] Brief meeting summary with participants: {participantNames}. The discussion covered key topics relevant to the roles involved.",
            SummaryStyle.Detailed => $"[MOCK ROLE-AWARE SUMMARY] Detailed meeting analysis with participants: {participantNames}. Each participant contributed according to their role, with specific insights and perspectives shared.",
            SummaryStyle.ActionItems => $"[MOCK ROLE-AWARE SUMMARY] Action items from meeting with participants: {participantNames}. Tasks have been identified with role-specific assignments.",
            SummaryStyle.KeyDecisions => $"[MOCK ROLE-AWARE SUMMARY] Key decisions made with participants: {participantNames}. Decisions reflect input from various roles and expertise areas.",
            SummaryStyle.ExecutiveSummary => $"[MOCK ROLE-AWARE SUMMARY] Executive summary of meeting with participants: {participantNames}. Strategic implications considered from multiple role perspectives.",
            _ => $"[MOCK ROLE-AWARE SUMMARY] Meeting summary with participants: {participantNames}."
        };

        // Add role-specific details
        if (!string.IsNullOrWhiteSpace(options.TargetRole))
        {
            baseSummary += $" This summary is tailored for the {options.TargetRole} role, emphasizing relevant aspects of the discussion.";
        }

        baseSummary += $" Original transcript analyzed: {wordCount} words. This is a simulated summary for development purposes.";

        return baseSummary;
    }

    private string GenerateBriefMockSummary(int wordCount, int characterCount) =>
        $"[MOCK SUMMARY - Brief] This meeting covered several important topics and resulted in actionable next steps. " +
        $"The discussion was productive with good participation from all attendees. " +
        $"Original transcript: {wordCount} words, {characterCount} characters. " +
        $"This is a simulated brief summary for development and testing purposes.";

    private string GenerateDetailedMockSummary(int wordCount, int characterCount) =>
        $"[MOCK SUMMARY - Detailed] This comprehensive meeting covered multiple agenda items with in-depth discussion. " +
        $"Key topics included project updates, strategic planning, and resource allocation. " +
        $"Participants shared valuable insights and reached consensus on critical decisions. " +
        $"Action items were identified with clear ownership and timelines. " +
        $"The meeting concluded with defined next steps and follow-up commitments. " +
        $"Original transcript: {wordCount} words, {characterCount} characters. " +
        $"This is a simulated detailed summary for development and testing purposes.";

    private string GenerateActionItemsMockSummary(int wordCount, int characterCount) =>
        $"[MOCK SUMMARY - Action Items] The following action items were identified during the meeting: " +
        $"1. Complete project documentation review, 2. Schedule follow-up meetings with stakeholders, " +
        $"3. Finalize budget proposals, 4. Update project timeline and milestones. " +
        $"Original transcript: {wordCount} words, {characterCount} characters. " +
        $"This is a simulated action items summary for development and testing purposes.";

    private string GenerateDecisionsMockSummary(int wordCount, int characterCount) =>
        $"[MOCK SUMMARY - Key Decisions] Several important decisions were made: " +
        $"1. Approved budget increase for Q1 initiatives, 2. Selected vendor for upcoming project, " +
        $"3. Agreed on new team structure and responsibilities, 4. Decided on implementation timeline. " +
        $"Original transcript: {wordCount} words, {characterCount} characters. " +
        $"This is a simulated decisions summary for development and testing purposes.";

    private string GenerateExecutiveMockSummary(int wordCount, int characterCount) =>
        $"[MOCK SUMMARY - Executive] Strategic meeting focused on high-level business objectives and operational excellence. " +
        $"Key business decisions were made regarding resource allocation and strategic direction. " +
        $"Leadership alignment achieved on critical initiatives with clear accountability established. " +
        $"Original transcript: {wordCount} words, {characterCount} characters. " +
        $"This is a simulated executive summary for development and testing purposes.";

    private List<string> GenerateMockActionItems() =>
        new()
        {
            "• Complete project documentation review by end of week",
            "• Schedule follow-up meeting with stakeholders",
            "• Finalize budget proposals for next quarter",
            "• Update project timeline and share with team"
        };

    private List<string> GenerateMockKeyDecisions() =>
        new()
        {
            "Approved budget increase for Q1 initiatives",
            "Selected preferred vendor for upcoming project",
            "Agreed on new team structure and responsibilities",
            "Decided on accelerated implementation timeline"
        };

    private List<string> GenerateMockActionItemsWithRoles(List<SpeakerMapping> speakerMappings)
    {
        var actionItems = new List<string>();
        var roles = speakerMappings.Select(m => m.Role).Distinct().ToList();

        foreach (var role in roles.Take(3)) // Limit to 3 for mock
        {
            actionItems.Add($"• {role} to complete role-specific deliverables by deadline");
        }

        actionItems.Add("• Team collaboration on shared objectives");
        return actionItems;
    }

    private List<string> GenerateMockKeyDecisionsWithRoles(List<SpeakerMapping> speakerMappings)
    {
        var decisions = new List<string>();
        var roles = speakerMappings.Select(m => m.Role).Distinct().ToList();

        if (roles.Any())
        {
            decisions.Add($"Leadership decision involving {string.Join(" and ", roles)} perspectives");
            decisions.Add("Consensus reached on strategic direction with input from all roles");
        }

        decisions.Add("Resource allocation approved based on role requirements");
        return decisions;
    }
}
