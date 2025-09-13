-- Check Batch Transcription Job Status
-- Run this in SQL Server Management Studio or Azure Data Studio

-- 1. Get all recent batch jobs with their status
SELECT 
    Id,
    UserId,
    FileName,
    Status,
    ProgressPercentage,
    SubmittedAt,
    CompletedAt,
    ProcessingDuration,
    ErrorMessage,
    RetryCount,
    -- New hybrid storage fields
    TranscriptBlobUrl,
    IsTranscriptInBlobStorage,
    CompressedTranscriptSize,
    -- Legacy field (will be null for large transcripts)
    CASE 
        WHEN LEN(ResultsJson) > 100 THEN CONCAT(LEFT(ResultsJson, 100), '... (', LEN(ResultsJson), ' total chars)')
        ELSE ResultsJson 
    END AS ResultsJsonPreview
FROM BatchTranscriptionJobs 
ORDER BY SubmittedAt DESC;

-- 2. Get jobs by status
SELECT Status, COUNT(*) as JobCount
FROM BatchTranscriptionJobs 
GROUP BY Status;

-- 3. Get jobs that use blob storage vs database storage
SELECT 
    IsTranscriptInBlobStorage,
    COUNT(*) as JobCount,
    AVG(CAST(CompressedTranscriptSize as FLOAT)) as AvgCompressedSize,
    AVG(CASE WHEN ResultsJson IS NOT NULL THEN LEN(ResultsJson) ELSE NULL END) as AvgJsonSize
FROM BatchTranscriptionJobs 
WHERE Status = 'completed'
GROUP BY IsTranscriptInBlobStorage;

-- 4. Get transcript segments for a specific job (replace with actual JobId)
-- SELECT * FROM TranscriptSegments WHERE JobId = 'your-job-id-here';

-- 5. Find large transcripts that should be in blob storage
SELECT 
    Id,
    FileName,
    Status,
    IsTranscriptInBlobStorage,
    TranscriptBlobUrl,
    CompressedTranscriptSize,
    LEN(ResultsJson) as JsonSize
FROM BatchTranscriptionJobs 
WHERE Status = 'completed' 
  AND (CompressedTranscriptSize > 1024*1024 OR LEN(ResultsJson) > 1024*1024)
ORDER BY CompressedTranscriptSize DESC, LEN(ResultsJson) DESC;