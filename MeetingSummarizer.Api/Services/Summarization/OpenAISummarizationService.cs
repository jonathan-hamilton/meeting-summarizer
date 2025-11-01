using Microsoft.Extensions.Options;
using MeetingSummarizer.Api.Models;
using System.Text;
using System.Text.Json;
using System.Net.Http;

namespace MeetingSummarizer.Api.Services.Summarization;

/// <summary>
/// OpenAI-powered meeting summarization service using GPT-4
/// </summary>
public class OpenAISummarizationService : ISummarizationService
{
    private readonly OpenAIOptions _options;
    private readonly ILogger<OpenAISummarizationService> _logger;
    private readonly HttpClient _httpClient;

    public OpenAISummarizationService(
        IOptions<OpenAIOptions> options,
        ILogger<OpenAISummarizationService> logger,
        HttpClient httpClient)
    {
        _options = options.Value;
        _logger = logger;
        _httpClient = httpClient;
        
        // Configure HttpClient for OpenAI API
        _httpClient.DefaultRequestHeaders.Add("Authorization", $"Bearer {_options.ApiKey}");
        _httpClient.DefaultRequestHeaders.Add("User-Agent", "MeetingSummarizer/1.0");
    }

    public async Task<SummaryResult> GenerateSummaryAsync(
        string transcript,
        SummaryOptions options,
        CancellationToken cancellationToken = default)
    {
        var stopwatch = System.Diagnostics.Stopwatch.StartNew();

        try
        {
            _logger.LogInformation("Starting summary generation. Style: {Style}, Length: {Length} characters",
                options.Style, transcript.Length);

            ValidateInput(transcript, options);

            // Build the prompt based on summary style
            var prompt = BuildSummaryPrompt(transcript, options);

            // Call OpenAI API directly
            var summaryText = await CallOpenAIAsync(prompt, cancellationToken);

            stopwatch.Stop();

            // Parse structured content if needed
            var result = ParseSummaryResult(summaryText, options, stopwatch.ElapsedMilliseconds);

            _logger.LogInformation("Summary generation completed. Style: {Style}, Output length: {Length} characters, Time: {TimeMs}ms",
                options.Style, result.Content.Length, stopwatch.ElapsedMilliseconds);

            return result;
        }
        catch (Exception ex)
        {
            stopwatch.Stop();
            _logger.LogError(ex, "Error generating summary. Style: {Style}", options.Style);

            return SummaryResult.FromError(
                "unknown",
                options.Style,
                ex.Message,
                stopwatch.ElapsedMilliseconds);
        }
    }

    public async Task<SummaryResult> GenerateRoleAwareSummaryAsync(
        string transcript,
        List<Models.SpeakerMapping> speakerMappings,
        SummaryOptions options,
        CancellationToken cancellationToken = default)
    {
        var stopwatch = System.Diagnostics.Stopwatch.StartNew();

        try
        {
            _logger.LogInformation("Starting role-aware summary generation. Style: {Style}, Speakers: {SpeakerCount}, Target role: {TargetRole}",
                options.Style, speakerMappings.Count, options.TargetRole ?? "None");

            ValidateInput(transcript, options);

            // Replace speaker labels with real names in transcript
            var enhancedTranscript = ApplySpeakerMappings(transcript, speakerMappings);

            // Build role-aware prompt
            var prompt = BuildRoleAwarePrompt(enhancedTranscript, speakerMappings, options);

            // Call OpenAI API directly
            var summaryText = await CallOpenAIAsync(prompt, cancellationToken);

            stopwatch.Stop();

            // Parse structured content
            var result = ParseSummaryResult(summaryText, options, stopwatch.ElapsedMilliseconds);
            result.UsedSpeakerMappings = true;
            result.GeneratedFor = options.TargetRole;

            _logger.LogInformation("Role-aware summary generation completed. Style: {Style}, Speakers: {SpeakerCount}, Output length: {Length} characters, Time: {TimeMs}ms",
                options.Style, speakerMappings.Count, result.Content.Length, stopwatch.ElapsedMilliseconds);

            return result;
        }
        catch (Exception ex)
        {
            stopwatch.Stop();
            _logger.LogError(ex, "Error generating role-aware summary. Style: {Style}, Target role: {TargetRole}",
                options.Style, options.TargetRole);

            return SummaryResult.FromError(
                "unknown",
                options.Style,
                ex.Message,
                stopwatch.ElapsedMilliseconds);
        }
    }

    /// <summary>
    /// S3.4: Generates a meeting summary with role-aware action items
    /// </summary>
    public async Task<MeetingSummary> GenerateMeetingSummaryAsync(
        string transcript,
        List<Models.SpeakerMapping> speakerMappings,
        int maxTokens = 800,
        CancellationToken cancellationToken = default)
    {
        var stopwatch = System.Diagnostics.Stopwatch.StartNew();

        try
        {
            _logger.LogInformation("Starting S3.4 meeting summary generation. Speakers: {SpeakerCount}, MaxTokens: {MaxTokens}",
                speakerMappings.Count, maxTokens);

            ValidateMeetingSummaryInput(transcript, speakerMappings, maxTokens);

            // Replace speaker labels with real names in transcript
            var enhancedTranscript = ApplySpeakerMappings(transcript, speakerMappings);

            // Build specialized prompt for meeting summary with action items
            var prompt = BuildMeetingSummaryPrompt(enhancedTranscript, speakerMappings, maxTokens);

            // Call OpenAI API directly
            var summaryText = await CallOpenAIAsync(prompt, cancellationToken);

            stopwatch.Stop();

            // Parse the structured meeting summary
            var meetingSummary = ParseMeetingSummaryResult(summaryText, transcript, speakerMappings, stopwatch.ElapsedMilliseconds, maxTokens);

            _logger.LogInformation("S3.4 meeting summary generation completed. Speakers: {SpeakerCount}, Action items: {ActionCount}, Time: {TimeMs}ms",
                speakerMappings.Count, meetingSummary.ActionItemsByRole.Sum(g => g.ActionItems.Count), stopwatch.ElapsedMilliseconds);

            return meetingSummary;
        }
        catch (Exception ex)
        {
            stopwatch.Stop();
            _logger.LogError(ex, "Error generating S3.4 meeting summary");

            // Return an error meeting summary
            return new MeetingSummary
            {
                MeetingOverview = $"Error generating meeting summary: {ex.Message}",
                Metadata = new MeetingMetadata
                {
                    Participants = speakerMappings.Select(m => m.Name).ToList(),
                    SpeakerCount = speakerMappings.Count
                },
                Generation = new GenerationMetadata
                {
                    ProcessingTimeMs = stopwatch.ElapsedMilliseconds,
                    IsEditable = false
                }
            };
        }
    }

    public async Task<bool> IsServiceAvailableAsync(CancellationToken cancellationToken = default)
    {
        try
        {
            _logger.LogDebug("Checking OpenAI summarization service availability");
            
            // Simple API test call
            var testRequest = new
            {
                model = _options.Model,
                messages = new[]
                {
                    new { role = "user", content = "Test" }
                },
                max_tokens = 5
            };

            var content = new StringContent(JsonSerializer.Serialize(testRequest), Encoding.UTF8, "application/json");
            var response = await _httpClient.PostAsync("https://api.openai.com/v1/chat/completions", content, cancellationToken);
            
            return response.IsSuccessStatusCode;
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "OpenAI summarization service availability check failed");
            return false;
        }
    }

    public string GetServiceStatus()
    {
        var status = new
        {
            ServiceName = "OpenAI Summarization Service",
            Available = true,
            Model = _options.Model,
            MaxTokens = _options.MaxTokens,
            SupportedStyles = Enum.GetNames<SummaryStyle>(),
            Features = new[]
            {
                "Generic summarization",
                "Role-aware summarization",
                "Action item extraction",
                "Key decision identification",
                "Executive summary generation"
            }
        };

        return JsonSerializer.Serialize(status, new JsonSerializerOptions { WriteIndented = true });
    }

    /// <summary>
    /// Calls OpenAI API directly for text generation
    /// </summary>
    private async Task<string> CallOpenAIAsync(string prompt, CancellationToken cancellationToken)
    {
        var request = new
        {
            model = _options.Model,
            messages = new[]
            {
                new { role = "user", content = prompt }
            },
            max_tokens = _options.MaxTokens,
            temperature = 0.7
        };

        var content = new StringContent(JsonSerializer.Serialize(request), Encoding.UTF8, "application/json");
        var response = await _httpClient.PostAsync("https://api.openai.com/v1/chat/completions", content, cancellationToken);

        if (!response.IsSuccessStatusCode)
        {
            var errorContent = await response.Content.ReadAsStringAsync(cancellationToken);
            throw new HttpRequestException($"OpenAI API call failed: {response.StatusCode} - {errorContent}");
        }

        var responseContent = await response.Content.ReadAsStringAsync(cancellationToken);
        var responseJson = JsonDocument.Parse(responseContent);
        
        return responseJson.RootElement
            .GetProperty("choices")[0]
            .GetProperty("message")
            .GetProperty("content")
            .GetString() ?? string.Empty;
    }

    /// <summary>
    /// Validates input parameters for summary generation
    /// </summary>
    private static void ValidateInput(string transcript, SummaryOptions options)
    {
        if (string.IsNullOrWhiteSpace(transcript))
        {
            throw new ArgumentException("Transcript cannot be null or empty", nameof(transcript));
        }

        if (transcript.Length > 500000) // 500KB limit
        {
            throw new ArgumentException("Transcript is too long for summarization", nameof(transcript));
        }

        if (options.MaxTokens < 50 || options.MaxTokens > 2000)
        {
            throw new ArgumentException("MaxTokens must be between 50 and 2000", nameof(options));
        }
    }

    /// <summary>
    /// Builds a summary prompt based on the requested style
    /// </summary>
    private string BuildSummaryPrompt(string transcript, SummaryOptions options)
    {
        var promptBuilder = new StringBuilder();

        // Base system prompt
        promptBuilder.AppendLine("You are an expert meeting assistant that creates professional, well-formatted summaries of meeting transcripts.");
        promptBuilder.AppendLine("Focus on clarity, accuracy, and actionable insights.");
        promptBuilder.AppendLine("Use clear formatting with section headers, bullet points, and structured content for readability.");
        promptBuilder.AppendLine();

        // Style-specific instructions
        switch (options.Style)
        {
            case SummaryStyle.Brief:
                promptBuilder.AppendLine("Create a brief, high-level summary focusing on the main topics and key outcomes.");
                promptBuilder.AppendLine("Keep it concise - 2-3 paragraphs maximum.");
                promptBuilder.AppendLine("Use clear paragraph breaks and structure your content logically.");
                break;

            case SummaryStyle.Detailed:
                promptBuilder.AppendLine("Create a comprehensive summary that includes:");
                promptBuilder.AppendLine("- Overview of main topics discussed");
                promptBuilder.AppendLine("- Key decisions made");
                promptBuilder.AppendLine("- Action items identified");
                promptBuilder.AppendLine("- Important discussion points");
                promptBuilder.AppendLine("Format with clear section headers and bullet points for easy reading.");
                break;

            case SummaryStyle.ActionItems:
                promptBuilder.AppendLine("Focus specifically on extracting and organizing action items:");
                promptBuilder.AppendLine("- List specific tasks assigned or discussed");
                promptBuilder.AppendLine("- Include who is responsible (if mentioned)");
                promptBuilder.AppendLine("- Note any deadlines or timeline mentioned");
                promptBuilder.AppendLine("Use bullet points and clear formatting to organize action items.");
                break;

            case SummaryStyle.KeyDecisions:
                promptBuilder.AppendLine("Focus on decisions and conclusions:");
                promptBuilder.AppendLine("- What decisions were made during the meeting");
                promptBuilder.AppendLine("- What was decided and why");
                promptBuilder.AppendLine("- Any alternatives considered");
                promptBuilder.AppendLine("Structure decisions clearly with bullet points or numbered lists.");
                break;

            case SummaryStyle.ExecutiveSummary:
                promptBuilder.AppendLine("Create an executive-level summary suitable for leadership:");
                promptBuilder.AppendLine("- High-level outcomes and strategic implications");
                promptBuilder.AppendLine("- Key decisions affecting business operations");
                promptBuilder.AppendLine("- Critical action items requiring attention");
                promptBuilder.AppendLine("Use executive-style formatting with clear sections and bullet points.");
                break;
        }

        // Target role customization
        if (!string.IsNullOrWhiteSpace(options.TargetRole))
        {
            promptBuilder.AppendLine();
            promptBuilder.AppendLine($"Tailor the summary for someone in the role of: {options.TargetRole}");
            promptBuilder.AppendLine("Emphasize information most relevant to this role.");
        }

        promptBuilder.AppendLine();
        promptBuilder.AppendLine("FORMATTING REQUIREMENTS:");
        promptBuilder.AppendLine("- Use clear section headers followed by colons (e.g., 'Key Business Objectives:', 'Technical Goals:')");
        promptBuilder.AppendLine("- Break long content into multiple paragraphs for readability");
        promptBuilder.AppendLine("- Use bullet points for lists (start lines with '- ')");
        promptBuilder.AppendLine("- Separate different topics with clear paragraph breaks");
        promptBuilder.AppendLine("- Avoid wall-of-text formatting");
        promptBuilder.AppendLine();
        promptBuilder.AppendLine("Meeting transcript to summarize:");
        promptBuilder.AppendLine(transcript);

        return promptBuilder.ToString();
    }

    /// <summary>
    /// Builds a role-aware prompt using speaker mappings
    /// </summary>
    private string BuildRoleAwarePrompt(string enhancedTranscript, List<Models.SpeakerMapping> speakerMappings, SummaryOptions options)
    {
        var promptBuilder = new StringBuilder();

        // System prompt with role awareness
        promptBuilder.AppendLine("You are an expert meeting assistant creating a role-aware summary.");
        promptBuilder.AppendLine("Use the speaker names and roles provided to create personalized insights.");
        promptBuilder.AppendLine();

        // Speaker context
        promptBuilder.AppendLine("Meeting participants:");
        foreach (var mapping in speakerMappings)
        {
            promptBuilder.AppendLine($"- {mapping.Name} ({mapping.Role})");
        }
        promptBuilder.AppendLine();

        // Style-specific instructions with role awareness
        switch (options.Style)
        {
            case SummaryStyle.Brief:
                promptBuilder.AppendLine("Create a brief summary highlighting key contributions from each participant.");
                break;

            case SummaryStyle.Detailed:
                promptBuilder.AppendLine("Create a detailed summary organized by:");
                promptBuilder.AppendLine("- Key points raised by each participant");
                promptBuilder.AppendLine("- Decisions involving specific roles");
                promptBuilder.AppendLine("- Role-specific action items and responsibilities");
                break;

            case SummaryStyle.ActionItems:
                promptBuilder.AppendLine("Extract action items with clear role assignments:");
                promptBuilder.AppendLine("- Who is responsible for each action");
                promptBuilder.AppendLine("- Actions grouped by role when relevant");
                break;

            case SummaryStyle.KeyDecisions:
                promptBuilder.AppendLine("Focus on decisions with role context:");
                promptBuilder.AppendLine("- Who made or influenced each decision");
                promptBuilder.AppendLine("- How decisions affect different roles");
                break;

            case SummaryStyle.ExecutiveSummary:
                promptBuilder.AppendLine("Create an executive summary with leadership insights:");
                promptBuilder.AppendLine("- Contributions from management vs individual contributors");
                promptBuilder.AppendLine("- Strategic decisions and their stakeholders");
                break;
        }

        // Target role customization
        if (!string.IsNullOrWhiteSpace(options.TargetRole))
        {
            promptBuilder.AppendLine();
            promptBuilder.AppendLine($"Focus particularly on information relevant to: {options.TargetRole}");
        }

        promptBuilder.AppendLine();
        promptBuilder.AppendLine("Meeting transcript with participant names:");
        promptBuilder.AppendLine(enhancedTranscript);

        return promptBuilder.ToString();
    }

    /// <summary>
    /// Applies speaker mappings to replace generic labels with real names
    /// </summary>
    private string ApplySpeakerMappings(string transcript, List<Models.SpeakerMapping> speakerMappings)
    {
        var result = transcript;

        foreach (var mapping in speakerMappings)
        {
            // Replace "Speaker X:" with "Name (Role):"
            var speakerLabel = $"{mapping.SpeakerId}:";
            var replacement = $"{mapping.Name} ({mapping.Role}):";
            result = result.Replace(speakerLabel, replacement, StringComparison.OrdinalIgnoreCase);
        }

        return result;
    }

    /// <summary>
    /// Parses the summary result and extracts structured information
    /// </summary>
    private SummaryResult ParseSummaryResult(string summaryText, SummaryOptions options, long processingTime)
    {
        var result = new SummaryResult
        {
            Content = summaryText,
            SummaryType = options.Style,
            ProcessingTimeMs = processingTime,
            TokenCount = EstimateTokenCount(summaryText)
        };

        // Extract action items if the style supports it
        if (options.IncludeActionItems)
        {
            result.ActionItems = ExtractActionItems(summaryText);
        }

        // Extract key decisions if the style supports it
        if (options.IncludeKeyDecisions)
        {
            result.KeyDecisions = ExtractKeyDecisions(summaryText);
        }

        return result;
    }

    /// <summary>
    /// Extracts action items from summary text using pattern matching
    /// </summary>
    private List<string> ExtractActionItems(string summaryText)
    {
        var actionItems = new List<string>();

        // Simple pattern matching for common action item indicators
        var lines = summaryText.Split('\n', StringSplitOptions.RemoveEmptyEntries);

        foreach (var line in lines)
        {
            var trimmedLine = line.Trim();

            // Look for lines that seem like action items
            if (trimmedLine.StartsWith("- ") ||
                trimmedLine.StartsWith("• ") ||
                trimmedLine.Contains("will ") ||
                trimmedLine.Contains("should ") ||
                trimmedLine.Contains("action:") ||
                trimmedLine.Contains("todo:") ||
                trimmedLine.Contains("follow up"))
            {
                actionItems.Add(trimmedLine);
            }
        }

        return actionItems;
    }

    /// <summary>
    /// Extracts key decisions from summary text using pattern matching
    /// </summary>
    private List<string> ExtractKeyDecisions(string summaryText)
    {
        var decisions = new List<string>();

        var lines = summaryText.Split('\n', StringSplitOptions.RemoveEmptyEntries);

        foreach (var line in lines)
        {
            var trimmedLine = line.Trim();

            // Look for lines that seem like decisions
            if (trimmedLine.Contains("decided") ||
                trimmedLine.Contains("agreed") ||
                trimmedLine.Contains("resolved") ||
                trimmedLine.Contains("conclusion") ||
                trimmedLine.Contains("determined"))
            {
                decisions.Add(trimmedLine);
            }
        }

        return decisions;
    }

    /// <summary>
    /// Estimates token count for text (rough approximation)
    /// </summary>
    private static int EstimateTokenCount(string text)
    {
        return string.IsNullOrWhiteSpace(text) ? 0 : text.Length / 4;
    }

    /// <summary>
    /// S3.4: Validates input parameters for meeting summary generation
    /// </summary>
    private static void ValidateMeetingSummaryInput(string transcript, List<Models.SpeakerMapping> speakerMappings, int maxTokens)
    {
        if (string.IsNullOrWhiteSpace(transcript))
        {
            throw new ArgumentException("Transcript cannot be null or empty", nameof(transcript));
        }

        if (transcript.Length > 500000) // 500KB limit
        {
            throw new ArgumentException("Transcript is too long for meeting summary generation", nameof(transcript));
        }

        if (speakerMappings == null || speakerMappings.Count == 0)
        {
            throw new ArgumentException("Speaker mappings are required for meeting summary generation", nameof(speakerMappings));
        }

        if (maxTokens < 200 || maxTokens > 1500)
        {
            throw new ArgumentException("MaxTokens must be between 200 and 1500", nameof(maxTokens));
        }
    }

    /// <summary>
    /// S3.4: Builds a specialized prompt for meeting summary with role-aware action items
    /// </summary>
    private string BuildMeetingSummaryPrompt(string enhancedTranscript, List<Models.SpeakerMapping> speakerMappings, int maxTokens)
    {
        var promptBuilder = new StringBuilder();

        // System prompt for S3.4 meeting summary
        promptBuilder.AppendLine("You are an expert meeting assistant that creates structured meeting summaries with role-aware action items.");
        promptBuilder.AppendLine("Your response must be in JSON format with the following structure:");
        promptBuilder.AppendLine("{");
        promptBuilder.AppendLine("  \"overview\": \"Meeting narrative overview (1 page max)\",");
        promptBuilder.AppendLine("  \"actionItemsByRole\": [");
        promptBuilder.AppendLine("    {");
        promptBuilder.AppendLine("      \"speakerId\": \"Speaker identifier\",");
        promptBuilder.AppendLine("      \"speakerName\": \"Speaker name\",");
        promptBuilder.AppendLine("      \"speakerRole\": \"Speaker role\",");
        promptBuilder.AppendLine("      \"actionItems\": [");
        promptBuilder.AppendLine("        {");
        promptBuilder.AppendLine("          \"description\": \"Action item description\",");
        promptBuilder.AppendLine("          \"isExplicitAssignment\": true/false,");
        promptBuilder.AppendLine("          \"confidence\": 0.0-1.0,");
        promptBuilder.AppendLine("          \"sourceText\": \"Source text snippet (optional)\"");
        promptBuilder.AppendLine("        }");
        promptBuilder.AppendLine("      ]");
        promptBuilder.AppendLine("    }");
        promptBuilder.AppendLine("  ],");
        promptBuilder.AppendLine("  \"unassignedActionItems\": [");
        promptBuilder.AppendLine("    {");
        promptBuilder.AppendLine("      \"description\": \"Action item description\",");
        promptBuilder.AppendLine("      \"confidence\": 0.0-1.0,");
        promptBuilder.AppendLine("      \"sourceText\": \"Source text snippet (optional)\",");
        promptBuilder.AppendLine("      \"unassignedReason\": \"Why it couldn't be assigned\"");
        promptBuilder.AppendLine("    }");
        promptBuilder.AppendLine("  ]");
        promptBuilder.AppendLine("}");
        promptBuilder.AppendLine();

        // Analysis instructions
        promptBuilder.AppendLine("Analysis Guidelines:");
        promptBuilder.AppendLine($"1. Create a narrative overview (target: {maxTokens} tokens max)");
        promptBuilder.AppendLine("2. Extract action items and assign them to specific speakers when possible");
        promptBuilder.AppendLine("3. Consider both explicit assignments (\"John will do X\") and implicit commitments (\"I'll handle that\")");
        promptBuilder.AppendLine("4. Use confidence scores: 0.9+ for explicit, 0.6-0.8 for implicit, 0.3-0.5 for inferred");
        promptBuilder.AppendLine("5. If an action item cannot be clearly assigned, put it in unassignedActionItems");
        promptBuilder.AppendLine();

        // Speaker context
        promptBuilder.AppendLine("Meeting participants:");
        foreach (var mapping in speakerMappings)
        {
            promptBuilder.AppendLine($"- {mapping.SpeakerId} = {mapping.Name} ({mapping.Role})");
        }
        promptBuilder.AppendLine();

        promptBuilder.AppendLine("Meeting transcript to analyze:");
        promptBuilder.AppendLine(enhancedTranscript);

        return promptBuilder.ToString();
    }

    /// <summary>
    /// S3.4: Parses the meeting summary result from OpenAI response
    /// </summary>
    private MeetingSummary ParseMeetingSummaryResult(string summaryText, string originalTranscript, List<Models.SpeakerMapping> speakerMappings, long processingTime, int maxTokens)
    {
        try
        {
            // Clean the response text by removing markdown code blocks
            var cleanedText = summaryText.Trim();
            
            // Remove markdown code block formatting if present
            if (cleanedText.StartsWith("```json"))
            {
                cleanedText = cleanedText.Substring(7); // Remove "```json"
            }
            if (cleanedText.StartsWith("```"))
            {
                cleanedText = cleanedText.Substring(3); // Remove "```"
            }
            if (cleanedText.EndsWith("```"))
            {
                cleanedText = cleanedText.Substring(0, cleanedText.Length - 3); // Remove trailing "```"
            }
            
            cleanedText = cleanedText.Trim();
            
            _logger.LogInformation("🔍 Cleaned summary text for JSON parsing: {CleanedText}", cleanedText.Length > 200 ? cleanedText.Substring(0, 200) + "..." : cleanedText);
            
            // Try to parse JSON response
            var jsonDoc = JsonDocument.Parse(cleanedText);
            var root = jsonDoc.RootElement;

            var meetingSummary = new MeetingSummary
            {
                TranscriptionId = string.Empty, // Will be set by controller
                MeetingOverview = root.GetProperty("overview").GetString() ?? string.Empty,
                Metadata = new MeetingMetadata
                {
                    Participants = speakerMappings.Select(m => m.Name).ToList(),
                    SpeakerCount = speakerMappings.Count,
                    Duration = EstimateDuration(originalTranscript)
                },
                Generation = new GenerationMetadata
                {
                    ProcessingTimeMs = processingTime,
                    TokenCount = EstimateTokenCount(summaryText),
                    IsEditable = true
                }
            };

            // Parse action items by role
            if (root.TryGetProperty("actionItemsByRole", out var actionItemsArray))
            {
                foreach (var roleElement in actionItemsArray.EnumerateArray())
                {
                    var actionItemsByRole = new ActionItemsByRole
                    {
                        SpeakerId = roleElement.GetProperty("speakerId").GetString() ?? string.Empty,
                        SpeakerName = roleElement.GetProperty("speakerName").GetString() ?? string.Empty,
                        SpeakerRole = roleElement.GetProperty("speakerRole").GetString() ?? string.Empty
                    };

                    if (roleElement.TryGetProperty("actionItems", out var itemsArray))
                    {
                        foreach (var itemElement in itemsArray.EnumerateArray())
                        {
                            var actionItem = new ActionItem
                            {
                                Description = itemElement.GetProperty("description").GetString() ?? string.Empty,
                                IsExplicitAssignment = itemElement.GetProperty("isExplicitAssignment").GetBoolean(),
                                Confidence = itemElement.GetProperty("confidence").GetDouble(),
                                SourceText = itemElement.TryGetProperty("sourceText", out var sourceTextElement) ? sourceTextElement.GetString() : null
                            };
                            actionItemsByRole.ActionItems.Add(actionItem);
                        }
                    }

                    meetingSummary.ActionItemsByRole.Add(actionItemsByRole);
                }
            }

            // Parse unassigned action items
            if (root.TryGetProperty("unassignedActionItems", out var unassignedArray))
            {
                foreach (var itemElement in unassignedArray.EnumerateArray())
                {
                    var unassignedItem = new UnassignedActionItem
                    {
                        Description = itemElement.GetProperty("description").GetString() ?? string.Empty,
                        Confidence = itemElement.GetProperty("confidence").GetDouble(),
                        SourceText = itemElement.TryGetProperty("sourceText", out var sourceTextElement) ? sourceTextElement.GetString() : null,
                        UnassignedReason = itemElement.TryGetProperty("unassignedReason", out var reasonElement) ? reasonElement.GetString() : null
                    };
                    meetingSummary.UnassignedActionItems.Add(unassignedItem);
                }
            }

            return meetingSummary;
        }
        catch (JsonException ex)
        {
            _logger.LogWarning(ex, "Failed to parse JSON meeting summary, falling back to text parsing");
            
            // Fallback to text-based parsing
            return new MeetingSummary
            {
                MeetingOverview = summaryText,
                Metadata = new MeetingMetadata
                {
                    Participants = speakerMappings.Select(m => m.Name).ToList(),
                    SpeakerCount = speakerMappings.Count,
                    Duration = EstimateDuration(originalTranscript)
                },
                Generation = new GenerationMetadata
                {
                    ProcessingTimeMs = processingTime,
                    TokenCount = EstimateTokenCount(summaryText),
                    IsEditable = true
                }
            };
        }
    }

    /// <summary>
    /// Estimates meeting duration based on transcript length
    /// </summary>
    private static TimeSpan? EstimateDuration(string transcript)
    {
        if (string.IsNullOrWhiteSpace(transcript))
            return null;

        // Rough estimate: 150 words per minute average speaking rate
        var wordCount = transcript.Split(' ', StringSplitOptions.RemoveEmptyEntries).Length;
        var estimatedMinutes = Math.Max(1, wordCount / 150);
        
        return TimeSpan.FromMinutes(estimatedMinutes);
    }
}