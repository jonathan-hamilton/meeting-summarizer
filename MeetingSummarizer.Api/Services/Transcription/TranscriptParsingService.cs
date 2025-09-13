using MeetingSummarizer.Api.Data.Entities;
using MeetingSummarizer.Api.Models;
using Microsoft.Extensions.Logging;
using System.Text;
using System.Text.Json;

namespace MeetingSummarizer.Api.Services.Transcription;

/// <summary>
/// Service for parsing Azure batch transcription results into structured database segments
/// </summary>
public class TranscriptParsingService : ITranscriptParsingService
{
    private readonly ILogger<TranscriptParsingService> _logger;

    public TranscriptParsingService(ILogger<TranscriptParsingService> logger)
    {
        _logger = logger;
    }

    public async Task<ICollection<TranscriptSegment>> ParseAzureResultsToSegmentsAsync(string azureResultsJson, Guid jobId)
    {
        var result = await ParseAzureResultsAsync(azureResultsJson, jobId);
        return result.Segments;
    }

    public async Task<TranscriptParsingResult> ParseAzureResultsAsync(string azureResultsJson, Guid jobId)
    {
        try
        {
            _logger.LogInformation("Parsing Azure transcription results for job {JobId} ({Size} bytes)", 
                jobId, azureResultsJson.Length);

            // First validate the JSON structure
            var validation = await ValidateAzureJsonAsync(azureResultsJson);
            if (!validation.IsValid)
            {
                throw new InvalidOperationException($"Invalid Azure JSON format: {string.Join(", ", validation.Issues)}");
            }

            var azureData = JsonSerializer.Deserialize<JsonElement>(azureResultsJson);
            
            // Find the recognized phrases array using multiple possible property names
            var recognizedPhrases = FindRecognizedPhrases(azureData);
            
            var segments = new List<TranscriptSegment>();
            var fullTextBuilder = new StringBuilder();
            var segmentIndex = 0;

            foreach (var phrase in recognizedPhrases.EnumerateArray())
            {
                var segment = await ParseSinglePhraseAsync(phrase, jobId, segmentIndex);
                if (segment != null)
                {
                    segments.Add(segment);
                    
                    // Build formatted text
                    var speakerText = !string.IsNullOrEmpty(segment.SpeakerId) 
                        ? $"{segment.SpeakerId}: {segment.Text}"
                        : segment.Text;
                    fullTextBuilder.AppendLine(speakerText);
                    
                    segmentIndex++;
                }
            }

            var confidenceValues = segments.Where(s => s.Confidence.HasValue).Select(s => s.Confidence!.Value).ToList();
            
            var result = new TranscriptParsingResult
            {
                Segments = segments,
                FullText = fullTextBuilder.ToString().Trim(),
                TotalSegments = segments.Count,
                SpeakerCount = segments.Select(s => s.SpeakerId).Where(s => !string.IsNullOrEmpty(s)).Distinct().Count(),
                TotalDurationSeconds = segments.Count > 0 ? segments.Max(s => s.EndTime) : 0,
                AverageConfidence = confidenceValues.Any() ? confidenceValues.Average() : 0
            };

            _logger.LogInformation("Successfully parsed {SegmentCount} segments with {SpeakerCount} speakers for job {JobId}",
                result.TotalSegments, result.SpeakerCount, jobId);

            return result;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error parsing Azure transcription results for job {JobId}", jobId);
            throw;
        }
    }

    public async Task<JsonValidationResult> ValidateAzureJsonAsync(string azureResultsJson)
    {
        var result = new JsonValidationResult();

        try
        {
            await Task.CompletedTask; // Suppress async warning
            
            if (string.IsNullOrWhiteSpace(azureResultsJson))
            {
                result.Issues.Add("JSON content is null or empty");
                return result;
            }

            // Try to parse JSON
            JsonElement azureData;
            try
            {
                azureData = JsonSerializer.Deserialize<JsonElement>(azureResultsJson);
            }
            catch (JsonException ex)
            {
                result.Issues.Add($"Invalid JSON format: {ex.Message}");
                return result;
            }

            // Check for recognized phrases in various formats
            JsonElement recognizedPhrases;
            if (azureData.TryGetProperty("combinedRecognizedPhrases", out recognizedPhrases))
            {
                result.DetectedFormat = "Azure Batch Transcription v3.1 (combinedRecognizedPhrases)";
            }
            else if (azureData.TryGetProperty("recognizedPhrases", out recognizedPhrases))
            {
                result.DetectedFormat = "Azure Speech Services (recognizedPhrases)";
            }
            else if (azureData.TryGetProperty("results", out recognizedPhrases))
            {
                result.DetectedFormat = "Generic results format";
            }
            else
            {
                result.Issues.Add($"No recognized phrases found. Available properties: {string.Join(", ", azureData.EnumerateObject().Select(p => p.Name))}");
                return result;
            }

            // Validate array structure
            if (recognizedPhrases.ValueKind != JsonValueKind.Array)
            {
                result.Issues.Add("Recognized phrases is not an array");
                return result;
            }

            result.EstimatedSegmentCount = recognizedPhrases.GetArrayLength();
            
            if (result.EstimatedSegmentCount == 0)
            {
                result.Issues.Add("No phrases found in results array");
                return result;
            }

            // Validate first phrase structure
            var firstPhrase = recognizedPhrases.EnumerateArray().FirstOrDefault();
            if (firstPhrase.ValueKind != JsonValueKind.Undefined)
            {
                var requiredProperties = new[] { "channel", "lexical" };
                var missingProperties = requiredProperties.Where(prop => !firstPhrase.TryGetProperty(prop, out _)).ToList();
                
                if (missingProperties.Any())
                {
                    result.Issues.Add($"Missing required properties in phrase: {string.Join(", ", missingProperties)}");
                    return result;
                }
            }

            result.IsValid = true;
            _logger.LogDebug("JSON validation successful. Format: {Format}, Estimated segments: {Count}",
                result.DetectedFormat, result.EstimatedSegmentCount);

            return result;
        }
        catch (Exception ex)
        {
            result.Issues.Add($"Validation error: {ex.Message}");
            _logger.LogError(ex, "Error during JSON validation");
            return result;
        }
    }

    public SpeakerAnalysis AnalyzeSpeakers(ICollection<TranscriptSegment> segments)
    {
        var analysis = new SpeakerAnalysis();

        if (!segments.Any())
            return analysis;

        var speakerGroups = segments
            .Where(s => !string.IsNullOrEmpty(s.SpeakerId))
            .GroupBy(s => s.SpeakerId)
            .ToList();

        analysis.SpeakerCount = speakerGroups.Count;
        analysis.SpeakerIds = speakerGroups.Select(g => g.Key!).ToList();

        foreach (var group in speakerGroups)
        {
            var speakerId = group.Key!;
            var speakerSegments = group.ToList();

            // Calculate speaking time
            var speakingTime = speakerSegments.Sum(s => s.EndTime - s.StartTime);
            analysis.SpeakingTimeSeconds[speakerId] = speakingTime;
            analysis.TotalSpeakingTime += speakingTime;

            // Count segments
            analysis.SegmentCounts[speakerId] = speakerSegments.Count;

            // Calculate average confidence
            var confidenceScores = speakerSegments.Where(s => s.Confidence.HasValue).Select(s => s.Confidence!.Value);
            analysis.AverageConfidencePerSpeaker[speakerId] = confidenceScores.Any() ? confidenceScores.Average() : 0.0;
        }

        // Find dominant speaker
        if (analysis.SpeakingTimeSeconds.Any())
        {
            analysis.DominantSpeaker = analysis.SpeakingTimeSeconds
                .OrderByDescending(kvp => kvp.Value)
                .First().Key;
        }

        _logger.LogDebug("Speaker analysis complete: {SpeakerCount} speakers, {TotalTime:F1}s total speaking time",
            analysis.SpeakerCount, analysis.TotalSpeakingTime);

        return analysis;
    }

    // Private helper methods

    private JsonElement FindRecognizedPhrases(JsonElement azureData)
    {
        // Try recognizedPhrases first (individual speaker segments with diarization)
        // then fall back to combinedRecognizedPhrases (merged text without speakers)
        var possibleProperties = new[] { "recognizedPhrases", "combinedRecognizedPhrases", "results" };
        
        foreach (var property in possibleProperties)
        {
            if (azureData.TryGetProperty(property, out var phrases))
            {
                return phrases;
            }
        }

        // If none found, log available properties for debugging
        var availableProperties = string.Join(", ", azureData.EnumerateObject().Select(p => p.Name));
        throw new InvalidOperationException($"Unable to find recognized phrases. Available properties: {availableProperties}");
    }

    private async Task<TranscriptSegment?> ParseSinglePhraseAsync(JsonElement phrase, Guid jobId, int segmentIndex)
    {
        try
        {
            await Task.CompletedTask; // Suppress async warning
            // Extract channel (required)
            if (!phrase.TryGetProperty("channel", out var channelElement))
            {
                _logger.LogWarning("Skipping phrase {Index} - missing channel", segmentIndex);
                return null;
            }

            var channel = channelElement.GetInt32();
            
            // Extract text - try multiple possible locations
            string? text = null;
            if (phrase.TryGetProperty("lexical", out var lexicalElement))
            {
                text = lexicalElement.GetString(); // combinedRecognizedPhrases format
            }
            else if (phrase.TryGetProperty("nBest", out var nBestElement) && nBestElement.GetArrayLength() > 0)
            {
                var firstNBest = nBestElement.EnumerateArray().First();
                if (firstNBest.TryGetProperty("display", out var displayElement))
                {
                    text = displayElement.GetString(); // recognizedPhrases format
                }
                else if (firstNBest.TryGetProperty("lexical", out var nBestLexicalElement))
                {
                    text = nBestLexicalElement.GetString(); // alternative recognizedPhrases format
                }
            }

            if (string.IsNullOrWhiteSpace(text))
            {
                _logger.LogDebug("Skipping empty text segment {Index}", segmentIndex);
                return null;
            }

            // Create segment
            var segment = new TranscriptSegment
            {
                JobId = jobId,
                SegmentIndex = segmentIndex,
                Text = text.Trim(),
                SpeakerId = ExtractSpeakerId(phrase, channel), // Extract actual speaker from diarization
                Confidence = ExtractConfidence(phrase),
                StartTime = ExtractTimestamp(phrase, "start", segmentIndex),
                EndTime = ExtractTimestamp(phrase, "end", segmentIndex + 1)
            };

            return segment;
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Error parsing phrase {Index}, skipping", segmentIndex);
            return null;
        }
    }

    private double? ExtractConfidence(JsonElement phrase)
    {
        try
        {
            if (phrase.TryGetProperty("confidence", out var confidenceElement))
            {
                return confidenceElement.GetDouble();
            }

            // Try nested in properties
            if (phrase.TryGetProperty("nBest", out var nBestArray) && nBestArray.ValueKind == JsonValueKind.Array)
            {
                var firstNBest = nBestArray.EnumerateArray().FirstOrDefault();
                if (firstNBest.ValueKind != JsonValueKind.Undefined && 
                    firstNBest.TryGetProperty("confidence", out var nestedConfidence))
                {
                    return nestedConfidence.GetDouble();
                }
            }

            return null; // No confidence available
        }
        catch (Exception ex)
        {
            _logger.LogDebug(ex, "Could not extract confidence from phrase");
            return null;
        }
    }

    private string ExtractSpeakerId(JsonElement phrase, int fallbackChannel)
    {
        try
        {
            // Try multiple possible locations for speaker information
            
            // 1. Direct speaker property (can be string or number)
            if (phrase.TryGetProperty("speaker", out var speakerElement))
            {
                string? speakerId = null;
                
                // Handle both string and numeric speaker IDs
                if (speakerElement.ValueKind == JsonValueKind.String)
                {
                    speakerId = speakerElement.GetString();
                }
                else if (speakerElement.ValueKind == JsonValueKind.Number)
                {
                    speakerId = speakerElement.GetInt32().ToString();
                }
                
                if (!string.IsNullOrEmpty(speakerId))
                {
                    return speakerId;
                }
            }

            // 2. Speaker in nBest array (most common for Azure Speech)
            if (phrase.TryGetProperty("nBest", out var nBestArray) && nBestArray.ValueKind == JsonValueKind.Array)
            {
                var firstNBest = nBestArray.EnumerateArray().FirstOrDefault();
                if (firstNBest.ValueKind != JsonValueKind.Undefined)
                {
                    if (firstNBest.TryGetProperty("speaker", out var nestedSpeaker))
                    {
                        string? speakerId = null;
                        
                        // Handle both string and numeric speaker IDs in nBest
                        if (nestedSpeaker.ValueKind == JsonValueKind.String)
                        {
                            speakerId = nestedSpeaker.GetString();
                        }
                        else if (nestedSpeaker.ValueKind == JsonValueKind.Number)
                        {
                            speakerId = nestedSpeaker.GetInt32().ToString();
                        }
                        
                        if (!string.IsNullOrEmpty(speakerId))
                        {
                            return speakerId;
                        }
                    }
                }
            }

            // 3. Try alternative property names
            var alternativeNames = new[] { "speakerId", "diarizationResult", "speakerTag" };
            foreach (var propName in alternativeNames)
            {
                if (phrase.TryGetProperty(propName, out var element))
                {
                    var speakerId = element.GetString();
                    if (!string.IsNullOrEmpty(speakerId))
                    {
                        return speakerId;
                    }
                }
            }

            // 4. Fallback to channel-based speaker assignment
            return $"Speaker {fallbackChannel + 1}";
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Error extracting speaker ID, using channel {Channel}", fallbackChannel);
            return $"Speaker {fallbackChannel + 1}";
        }
    }

    private double ExtractTimestamp(JsonElement phrase, string timestampType, int fallbackIndex)
    {
        try
        {
            // Try to find timing information in various places
            if (phrase.TryGetProperty("offset", out var offsetElement) && timestampType == "start")
            {
                return offsetElement.GetDouble() / 10000000.0; // Convert from 100ns ticks to seconds
            }

            if (phrase.TryGetProperty("duration", out var durationElement) && timestampType == "end")
            {
                var offset = phrase.TryGetProperty("offset", out var offsetEl) ? offsetEl.GetDouble() / 10000000.0 : 0;
                return offset + (durationElement.GetDouble() / 10000000.0);
            }

            // Try nested timing
            if (phrase.TryGetProperty("nBest", out var nBestArray) && nBestArray.ValueKind == JsonValueKind.Array)
            {
                var firstNBest = nBestArray.EnumerateArray().FirstOrDefault();
                if (firstNBest.ValueKind != JsonValueKind.Undefined)
                {
                    if (timestampType == "start" && firstNBest.TryGetProperty("offset", out var nestedOffset))
                    {
                        return nestedOffset.GetDouble() / 10000000.0;
                    }
                    if (timestampType == "end" && firstNBest.TryGetProperty("duration", out var nestedDuration))
                    {
                        var offset = firstNBest.TryGetProperty("offset", out var nestedOffsetEl) 
                            ? nestedOffsetEl.GetDouble() / 10000000.0 : 0;
                        return offset + (nestedDuration.GetDouble() / 10000000.0);
                    }
                }
            }

            // Fallback: Use index-based estimation (1 second per segment)
            return timestampType == "start" ? fallbackIndex * 1.0 : (fallbackIndex + 1) * 1.0;
        }
        catch (Exception ex)
        {
            _logger.LogDebug(ex, "Could not extract {TimestampType} timestamp, using fallback", timestampType);
            return timestampType == "start" ? fallbackIndex * 1.0 : (fallbackIndex + 1) * 1.0;
        }
    }
}