using System.Text.Json.Serialization;

namespace MeetingSummarizer.Api.Models;

/// <summary>
/// Azure Batch Transcription API v3.1 models for job management
/// Reference: https://docs.microsoft.com/en-us/azure/cognitive-services/speech-service/batch-transcription
/// </summary>

/// <summary>
/// Status enumeration for batch transcription jobs
/// </summary>
public enum BatchTranscriptionStatus
{
    NotStarted,
    Running,
    Succeeded,
    Failed,
    Cancelled
}

/// <summary>
/// Request model for creating a batch transcription job
/// </summary>
public class BatchTranscriptionRequest
{
    /// <summary>
    /// Display name for the transcription job
    /// </summary>
    [JsonPropertyName("displayName")]
    public string DisplayName { get; set; } = string.Empty;

    /// <summary>
    /// Description of the transcription job
    /// </summary>
    [JsonPropertyName("description")]
    public string? Description { get; set; }

    /// <summary>
    /// Content URLs array containing the audio file URLs
    /// </summary>
    [JsonPropertyName("contentUrls")]
    public string[] ContentUrls { get; set; } = Array.Empty<string>();

    /// <summary>
    /// Locale for the transcription (e.g., "en-US")
    /// </summary>
    [JsonPropertyName("locale")]
    public string Locale { get; set; } = "en-US";

    /// <summary>
    /// Properties for configuring the transcription
    /// </summary>
    [JsonPropertyName("properties")]
    public BatchTranscriptionProperties Properties { get; set; } = new();
}

/// <summary>
/// Properties for configuring batch transcription behavior
/// </summary>
public class BatchTranscriptionProperties
{
    /// <summary>
    /// Enable speaker diarization
    /// </summary>
    [JsonPropertyName("diarizationEnabled")]
    public bool DiarizationEnabled { get; set; } = true;

    /// <summary>
    /// Maximum number of speakers (optional)
    /// </summary>
    [JsonPropertyName("maxSpeakers")]
    public int? MaxSpeakers { get; set; }

    /// <summary>
    /// Enable word-level timestamps
    /// </summary>
    [JsonPropertyName("wordLevelTimestampsEnabled")]
    public bool WordLevelTimestampsEnabled { get; set; } = true;

    /// <summary>
    /// Punctuation mode
    /// </summary>
    [JsonPropertyName("punctuationMode")]
    public string PunctuationMode { get; set; } = "DictatedAndAutomatic";

    /// <summary>
    /// Profanity filter mode
    /// </summary>
    [JsonPropertyName("profanityFilterMode")]
    public string ProfanityFilterMode { get; set; } = "Masked";

    /// <summary>
    /// Audio channels to process (optional - for mono audio use [0])
    /// </summary>
    [JsonPropertyName("channels")]
    public int[]? Channels { get; set; }
}

/// <summary>
/// Response model for batch transcription job creation and status
/// </summary>
public class BatchTranscriptionResponse
{
    /// <summary>
    /// Self URI for the transcription job
    /// </summary>
    [JsonPropertyName("self")]
    public string Self { get; set; } = string.Empty;

    /// <summary>
    /// Unique identifier for the transcription job (extracted from Self URL)
    /// </summary>
    [JsonIgnore]
    public string Id => ExtractIdFromSelf();
    
    /// <summary>
    /// Extract the transcription job ID from the Self URL
    /// </summary>
    private string ExtractIdFromSelf()
    {
        if (string.IsNullOrEmpty(Self))
            return string.Empty;
            
        // Extract ID from URL like: https://westus.api.cognitive.microsoft.com/speechtotext/v3.1/transcriptions/33158897-9b88-437a-8eb3-3569c3fd7152
        var lastSlashIndex = Self.LastIndexOf('/');
        if (lastSlashIndex >= 0 && lastSlashIndex < Self.Length - 1)
        {
            return Self.Substring(lastSlashIndex + 1);
        }
        
        return string.Empty;
    }

    /// <summary>
    /// Display name of the transcription job
    /// </summary>
    [JsonPropertyName("displayName")]
    public string DisplayName { get; set; } = string.Empty;

    /// <summary>
    /// Description of the transcription job
    /// </summary>
    [JsonPropertyName("description")]
    public string? Description { get; set; }

    /// <summary>
    /// Current status of the transcription job
    /// </summary>
    [JsonPropertyName("status")]
    public string Status { get; set; } = string.Empty;

    /// <summary>
    /// Creation timestamp
    /// </summary>
    [JsonPropertyName("createdDateTime")]
    public DateTime CreatedDateTime { get; set; }

    /// <summary>
    /// Last action timestamp
    /// </summary>
    [JsonPropertyName("lastActionDateTime")]
    public DateTime LastActionDateTime { get; set; }

    /// <summary>
    /// Content URLs that were transcribed
    /// </summary>
    [JsonPropertyName("contentUrls")]
    public string[] ContentUrls { get; set; } = Array.Empty<string>();

    /// <summary>
    /// Locale used for transcription
    /// </summary>
    [JsonPropertyName("locale")]
    public string Locale { get; set; } = string.Empty;

    /// <summary>
    /// Links to related resources
    /// </summary>
    [JsonPropertyName("links")]
    public BatchTranscriptionLinks? Links { get; set; }

    /// <summary>
    /// Properties used for the transcription
    /// </summary>
    [JsonPropertyName("properties")]
    public BatchTranscriptionProperties Properties { get; set; } = new();

    /// <summary>
    /// Error information if the job failed
    /// </summary>
    [JsonPropertyName("error")]
    public BatchTranscriptionError? Error { get; set; }

    /// <summary>
    /// Convert string status to enum
    /// </summary>
    public BatchTranscriptionStatus GetStatusEnum()
    {
        return Status.ToLowerInvariant() switch
        {
            "notstarted" => BatchTranscriptionStatus.NotStarted,
            "running" => BatchTranscriptionStatus.Running,
            "succeeded" => BatchTranscriptionStatus.Succeeded,
            "failed" => BatchTranscriptionStatus.Failed,
            "cancelled" => BatchTranscriptionStatus.Cancelled,
            _ => BatchTranscriptionStatus.NotStarted
        };
    }
}

/// <summary>
/// Links to related resources for a batch transcription job
/// </summary>
public class BatchTranscriptionLinks
{
    /// <summary>
    /// URI to get the result files
    /// </summary>
    [JsonPropertyName("files")]
    public string? Files { get; set; }
}

/// <summary>
/// Error information for failed batch transcription jobs
/// </summary>
public class BatchTranscriptionError
{
    /// <summary>
    /// Error code
    /// </summary>
    [JsonPropertyName("code")]
    public string Code { get; set; } = string.Empty;

    /// <summary>
    /// Error message
    /// </summary>
    [JsonPropertyName("message")]
    public string Message { get; set; } = string.Empty;
}

/// <summary>
/// Response model for batch transcription files listing
/// </summary>
public class BatchTranscriptionFilesResponse
{
    /// <summary>
    /// Array of result files
    /// </summary>
    [JsonPropertyName("values")]
    public BatchTranscriptionFile[] Values { get; set; } = Array.Empty<BatchTranscriptionFile>();
}

/// <summary>
/// Individual result file from batch transcription
/// </summary>
public class BatchTranscriptionFile
{
    /// <summary>
    /// File name
    /// </summary>
    [JsonPropertyName("name")]
    public string Name { get; set; } = string.Empty;

    /// <summary>
    /// File kind (e.g., "Transcription")
    /// </summary>
    [JsonPropertyName("kind")]
    public string Kind { get; set; } = string.Empty;

    /// <summary>
    /// Links to download the file
    /// </summary>
    [JsonPropertyName("links")]
    public BatchTranscriptionFileLinks Links { get; set; } = new();

    /// <summary>
    /// Properties of the file
    /// </summary>
    [JsonPropertyName("properties")]
    public BatchTranscriptionFileProperties? Properties { get; set; }
}

/// <summary>
/// Links for downloading batch transcription result files
/// </summary>
public class BatchTranscriptionFileLinks
{
    /// <summary>
    /// URL to download the content
    /// </summary>
    [JsonPropertyName("contentUrl")]
    public string ContentUrl { get; set; } = string.Empty;
}

/// <summary>
/// Properties of a batch transcription result file
/// </summary>
public class BatchTranscriptionFileProperties
{
    /// <summary>
    /// File size in bytes
    /// </summary>
    [JsonPropertyName("size")]
    public long Size { get; set; }
}

/// <summary>
/// Transcription result from batch API (matches our existing TranscriptionResult structure)
/// </summary>
public class BatchTranscriptionResult
{
    /// <summary>
    /// Source audio file name
    /// </summary>
    [JsonPropertyName("source")]
    public string Source { get; set; } = string.Empty;

    /// <summary>
    /// Combined transcription segments
    /// </summary>
    [JsonPropertyName("combinedRecognizedPhrases")]
    public BatchCombinedPhrase[] CombinedRecognizedPhrases { get; set; } = Array.Empty<BatchCombinedPhrase>();

    /// <summary>
    /// Individual recognition results with speaker information
    /// </summary>
    [JsonPropertyName("recognitionResults")]
    public BatchRecognitionResult[] RecognitionResults { get; set; } = Array.Empty<BatchRecognitionResult>();

    /// <summary>
    /// Individual recognized phrases with speaker information (v3.2 format)
    /// </summary>
    [JsonPropertyName("recognizedPhrases")]
    public BatchRecognitionResult[] RecognizedPhrases { get; set; } = Array.Empty<BatchRecognitionResult>();
}

/// <summary>
/// Combined phrase from batch transcription
/// </summary>
public class BatchCombinedPhrase
{
    /// <summary>
    /// Channel number
    /// </summary>
    [JsonPropertyName("channel")]
    public int Channel { get; set; }

    /// <summary>
    /// Combined display text
    /// </summary>
    [JsonPropertyName("display")]
    public string Display { get; set; } = string.Empty;
}

/// <summary>
/// Recognition result with speaker diarization
/// </summary>
public class BatchRecognitionResult
{
    /// <summary>
    /// Channel number
    /// </summary>
    [JsonPropertyName("channel")]
    public int Channel { get; set; }

    /// <summary>
    /// Array of recognized phrases with speaker information
    /// </summary>
    [JsonPropertyName("nBest")]
    public BatchNBestResult[] NBest { get; set; } = Array.Empty<BatchNBestResult>();
}

/// <summary>
/// N-best recognition result with speaker information
/// </summary>
public class BatchNBestResult
{
    /// <summary>
    /// Confidence score
    /// </summary>
    [JsonPropertyName("confidence")]
    public double Confidence { get; set; }

    /// <summary>
    /// Display text
    /// </summary>
    [JsonPropertyName("display")]
    public string Display { get; set; } = string.Empty;

    /// <summary>
    /// Speaker identification number
    /// </summary>
    [JsonPropertyName("speaker")]
    public int Speaker { get; set; }

    /// <summary>
    /// Individual words with timestamps
    /// </summary>
    [JsonPropertyName("words")]
    public BatchWord[] Words { get; set; } = Array.Empty<BatchWord>();
}

/// <summary>
/// Individual word with timing and speaker information
/// </summary>
public class BatchWord
{
    /// <summary>
    /// Word text
    /// </summary>
    [JsonPropertyName("word")]
    public string Word { get; set; } = string.Empty;

    /// <summary>
    /// Start time in ticks
    /// </summary>
    [JsonPropertyName("offsetInTicks")]
    public double OffsetInTicks { get; set; }

    /// <summary>
    /// Duration in ticks
    /// </summary>
    [JsonPropertyName("durationInTicks")]
    public double DurationInTicks { get; set; }

    /// <summary>
    /// Confidence score for this word
    /// </summary>
    [JsonPropertyName("confidence")]
    public double Confidence { get; set; }

    /// <summary>
    /// Speaker who spoke this word
    /// </summary>
    [JsonPropertyName("speaker")]
    public int Speaker { get; set; }
}
