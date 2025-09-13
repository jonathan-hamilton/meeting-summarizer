-- Quick database check for BatchTranscriptionJobs
-- Run this in your SQL client (SSMS, Azure Data Studio, etc.)

-- 1. Check if the table exists and see its structure
SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME = 'BatchTranscriptionJobs'
ORDER BY ORDINAL_POSITION;

-- 2. Count all records in the table
SELECT COUNT(*) as TotalJobs FROM BatchTranscriptionJobs;

-- 3. Check recent records (last 24 hours)
SELECT 
    Id,
    UserId,
    FileName,
    Status,
    ProgressPercentage,
    SubmittedAt,
    AzureJobId,
    ErrorMessage
FROM BatchTranscriptionJobs 
WHERE SubmittedAt >= DATEADD(hour, -24, GETUTCDATE())
ORDER BY SubmittedAt DESC;

-- 4. Check all statuses
SELECT Status, COUNT(*) as Count
FROM BatchTranscriptionJobs
GROUP BY Status;

-- 5. Check if there are any records at all
SELECT TOP 10 
    Id,
    FileName,
    Status,
    SubmittedAt
FROM BatchTranscriptionJobs 
ORDER BY SubmittedAt DESC;