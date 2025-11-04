DECLARE @Code NVARCHAR(50) = 'QV04OWDWT5MBL797FI48';
DECLARE @Email NVARCHAR(255) = 'user@example.com';
DECLARE @ExpiresAt DATETIME2 = '2025-10-25 11:45:21';
DECLARE @CreatedAt DATETIME2 = GETUTCDATE();

INSERT INTO InvitationCodes 
(Code, Email, ExpiresAt, UsedAt, IsActive, CreatedBy, CreatedAt)
VALUES 
(@Code, @Email, @ExpiresAt, NULL, 1, 'admin-system', @CreatedAt);

-- Verify insertion
SELECT TOP 1 * FROM InvitationCodes WHERE Code = @Code;