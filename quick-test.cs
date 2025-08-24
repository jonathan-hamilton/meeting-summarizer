using System;

class Program
{
    static void Main()
    {
        // Sample WAV file: sample-scrum.wav 
        var wavFileSize = 8782892L; // bytes
        var actualDuration = 99; // seconds (known duration)
        
        Console.WriteLine("=== DURATION ESTIMATION TEST ===");
        Console.WriteLine($"File: sample-scrum.wav");
        Console.WriteLine($"Size: {wavFileSize:N0} bytes");
        Console.WriteLine($"Actual Duration: {actualDuration}s");
        Console.WriteLine();
        
        // OLD algorithm (causing the bug)
        var oldBitrate = 1411200.0; // CD quality bitrate
        var oldDurationBase = (wavFileSize * 8.0) / oldBitrate;
        var oldEstimate = oldDurationBase * 1.1; // 1.1x buffer
        
        Console.WriteLine("OLD Algorithm (buggy):");
        Console.WriteLine($"  Bitrate: {oldBitrate:N0} bps");
        Console.WriteLine($"  Calculation: ({wavFileSize} * 8) / {oldBitrate} * 1.1 = {oldEstimate:F1}s");
        Console.WriteLine($"  Result: {(oldEstimate >= 90 ? "Batch API ✅" : "Real-time API ❌")} (threshold: 90s)");
        Console.WriteLine();
        
        // NEW algorithm (fix)
        var newBitrate = 705600.0; // Half of CD quality
        var newDurationBase = (wavFileSize * 8.0) / newBitrate;
        var newEstimate = newDurationBase * 1.5; // 1.5x buffer
        
        Console.WriteLine("NEW Algorithm (fixed):");
        Console.WriteLine($"  Bitrate: {newBitrate:N0} bps");
        Console.WriteLine($"  Calculation: ({wavFileSize} * 8) / {newBitrate} * 1.5 = {newEstimate:F1}s");
        Console.WriteLine($"  Result: {(newEstimate >= 90 ? "Batch API ✅" : "Real-time API ❌")} (threshold: 90s)");
        Console.WriteLine();
        
        // Analysis
        Console.WriteLine("=== ANALYSIS ===");
        Console.WriteLine($"Old estimate was {(oldEstimate / actualDuration * 100):F1}% of actual duration");
        Console.WriteLine($"New estimate is {(newEstimate / actualDuration * 100):F1}% of actual duration");
        Console.WriteLine($"Routing fixed: {(oldEstimate < 90 && newEstimate >= 90 ? "YES ✅" : "NO ❌")}");
    }
}
