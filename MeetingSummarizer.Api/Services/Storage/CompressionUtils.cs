using System.IO.Compression;
using System.Text;

namespace MeetingSummarizer.Api.Services.Storage;

/// <summary>
/// Utilities for compressing and decompressing transcript data for efficient blob storage
/// </summary>
public static class CompressionUtils
{
    /// <summary>
    /// Compress JSON string using GZip compression
    /// </summary>
    /// <param name="jsonContent">JSON content to compress</param>
    /// <returns>Compressed byte array</returns>
    public static byte[] CompressJson(string jsonContent)
    {
        if (string.IsNullOrEmpty(jsonContent))
            return Array.Empty<byte>();

        var bytes = Encoding.UTF8.GetBytes(jsonContent);
        return CompressBytes(bytes);
    }

    /// <summary>
    /// Decompress GZip compressed bytes back to JSON string
    /// </summary>
    /// <param name="compressedData">Compressed byte array</param>
    /// <returns>Decompressed JSON string</returns>
    public static string DecompressJson(byte[] compressedData)
    {
        if (compressedData == null || compressedData.Length == 0)
            return string.Empty;

        var decompressed = DecompressBytes(compressedData);
        return Encoding.UTF8.GetString(decompressed);
    }

    /// <summary>
    /// Compress JSON string to stream for direct blob upload
    /// </summary>
    /// <param name="jsonContent">JSON content to compress</param>
    /// <returns>Compressed memory stream positioned at start</returns>
    public static MemoryStream CompressJsonToStream(string jsonContent)
    {
        if (string.IsNullOrEmpty(jsonContent))
            return new MemoryStream();

        var outputStream = new MemoryStream();
        using (var gzipStream = new GZipStream(outputStream, CompressionMode.Compress, leaveOpen: true))
        using (var writer = new StreamWriter(gzipStream, Encoding.UTF8))
        {
            writer.Write(jsonContent);
        }
        
        outputStream.Position = 0; // Reset to beginning for reading
        return outputStream;
    }

    /// <summary>
    /// Decompress stream back to JSON string
    /// </summary>
    /// <param name="compressedStream">Compressed stream</param>
    /// <returns>Decompressed JSON string</returns>
    public static async Task<string> DecompressStreamToJsonAsync(Stream compressedStream)
    {
        if (compressedStream == null)
            return string.Empty;

        compressedStream.Position = 0; // Ensure we're at the beginning
        using var gzipStream = new GZipStream(compressedStream, CompressionMode.Decompress);
        using var reader = new StreamReader(gzipStream, Encoding.UTF8);
        return await reader.ReadToEndAsync();
    }

    /// <summary>
    /// Calculate compression ratio as percentage
    /// </summary>
    /// <param name="originalSize">Original uncompressed size in bytes</param>
    /// <param name="compressedSize">Compressed size in bytes</param>
    /// <returns>Compression ratio (0-100%)</returns>
    public static double CalculateCompressionRatio(long originalSize, long compressedSize)
    {
        if (originalSize == 0) return 0;
        return Math.Round((double)compressedSize / originalSize * 100, 2);
    }

    /// <summary>
    /// Estimate if content should be compressed based on size threshold
    /// </summary>
    /// <param name="contentSize">Size of content in bytes</param>
    /// <param name="threshold">Size threshold in KB (default: 10KB)</param>
    /// <returns>True if content should be compressed</returns>
    public static bool ShouldCompress(long contentSize, int threshold = 10)
    {
        return contentSize > (threshold * 1024); // Convert KB to bytes
    }

    // Internal helper methods
    private static byte[] CompressBytes(byte[] data)
    {
        using var output = new MemoryStream();
        using (var gzipStream = new GZipStream(output, CompressionMode.Compress))
        {
            gzipStream.Write(data, 0, data.Length);
        }
        return output.ToArray();
    }

    private static byte[] DecompressBytes(byte[] compressedData)
    {
        using var input = new MemoryStream(compressedData);
        using var output = new MemoryStream();
        using (var gzipStream = new GZipStream(input, CompressionMode.Decompress))
        {
            gzipStream.CopyTo(output);
        }
        return output.ToArray();
    }
}