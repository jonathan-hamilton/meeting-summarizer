using System.Reflection;
using MeetingSummarizer.Api.Services;

// S4.2 Azure Batch Transcription - Duration Estimation Validation
Console.WriteLine("=== S4.2 Azure Batch Transcription - Duration Estimation Validation ===\n");

// Get the private EstimateAudioDuration method via reflection
var method = typeof(AzureSpeechService).GetMethod("EstimateAudioDuration", 
    BindingFlags.NonPublic | BindingFlags.Static);

if (method == null)
{
    Console.WriteLine("ERROR: EstimateAudioDuration method not found!");
    return;
}

// Test cases: file size in bytes, file extension, expected duration range
var testCases = new[]
{
    (Size: 500_000, Extension: ".mp3", MinSeconds: 25, MaxSeconds: 35, Description: "500KB MP3"),
    (Size: 1_000_000, Extension: ".mp3", MinSeconds: 60, MaxSeconds: 80, Description: "1MB MP3"),
    (Size: 2_000_000, Extension: ".mp3", MinSeconds: 120, MaxSeconds: 160, Description: "2MB MP3 (should trigger batch)"),
    (Size: 1_000_000, Extension: ".wav", MinSeconds: 4, MaxSeconds: 8, Description: "1MB WAV (high bitrate)"),
    (Size: 1_000_000, Extension: ".m4a", MinSeconds: 20, MaxSeconds: 35, Description: "1MB M4A"),
    (Size: 1_000_000, Extension: ".xyz", MinSeconds: 60, MaxSeconds: 80, Description: "1MB Unknown (defaults to MP3)"),
};

int passed = 0;
int total = testCases.Length;

foreach (var testCase in testCases)
{
    // Create test audio stream
    var audioData = new byte[testCase.Size];
    var audioStream = new MemoryStream(audioData);
    var fileName = $"test{testCase.Extension}";

    try
    {
        // Call the private method
        var result = (TimeSpan)method.Invoke(null, new object[] { audioStream, fileName })!;
        var durationSeconds = result.TotalSeconds;

        // Check if duration is within expected range
        bool isValid = durationSeconds >= testCase.MinSeconds && durationSeconds <= testCase.MaxSeconds;
        
        Console.WriteLine($"✓ {testCase.Description}:");
        Console.WriteLine($"  Expected: {testCase.MinSeconds}-{testCase.MaxSeconds}s");
        Console.WriteLine($"  Actual: {durationSeconds:F1}s");
        Console.WriteLine($"  Result: {(isValid ? "PASS" : "FAIL")}");
        
        if (isValid) passed++;
        Console.WriteLine();
    }
    catch (Exception ex)
    {
        Console.WriteLine($"✗ {testCase.Description}: ERROR - {ex.Message}");
        Console.WriteLine();
    }
}

// Summary
Console.WriteLine($"=== VALIDATION RESULTS ===");
Console.WriteLine($"Passed: {passed}/{total}");
Console.WriteLine($"Success Rate: {(double)passed / total * 100:F1}%");

if (passed == total)
{
    Console.WriteLine("🎉 All duration estimation tests PASSED!");
    Console.WriteLine("S4.2 Increment 5 validation: SUCCESS");
}
else
{
    Console.WriteLine("❌ Some tests failed. Review implementation.");
}

// Test threshold logic
Console.WriteLine("\n=== THRESHOLD TESTING ===");
var threshold = 90; // seconds (from configuration)

var shortAudio = new MemoryStream(new byte[500_000]); // ~31s MP3
var longAudio = new MemoryStream(new byte[2_000_000]); // ~140s MP3

var shortDuration = (TimeSpan)method.Invoke(null, new object[] { shortAudio, "short.mp3" })!;
var longDuration = (TimeSpan)method.Invoke(null, new object[] { longAudio, "long.mp3" })!;

Console.WriteLine($"Short audio: {shortDuration.TotalSeconds:F1}s → {(shortDuration.TotalSeconds < threshold ? "Real-time API" : "Batch API")}");
Console.WriteLine($"Long audio: {longDuration.TotalSeconds:F1}s → {(longDuration.TotalSeconds < threshold ? "Real-time API" : "Batch API")}");

bool routingWorks = shortDuration.TotalSeconds < threshold && longDuration.TotalSeconds >= threshold;
Console.WriteLine($"Routing Logic: {(routingWorks ? "WORKING" : "BROKEN")}");
Console.WriteLine("\n=== S4.2 VALIDATION COMPLETE ===");
