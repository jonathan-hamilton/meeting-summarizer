SELECT TOP (1000) 
       [Code]
      ,[Email]
      ,[UsedAt]
      ,[Id]
      ,[ExpiresAt]
      ,[UsedByUserId]
      ,[IsActive]
      ,[CreatedAt]
      ,[CreatedBy]
  FROM [dbo].[InvitationCodes]

INSERT INTO InvitationCodes (
    Id, 
    Code, 
    Email, 
    ExpiresAt, 
    UsedAt, 
    IsActive, 
    CreatedBy)
    VALUES (
        NEWID(),
        'Q8Cj98!:xTJVRMp4', 
        'marc.c.david@gmail.com', 
        '2025-10-25 11:45:21', 
        NULL, 
        1, 
        'test-system'
        );

UPDATE [dbo].[Users]
SET EmailVerified = 1
WHERE Email = 'jhamilton.swe@gmail.com';

UPDATE [dbo].[Users]
SET TokenBalance = 1000
WHERE Email = 'jhamilton.swe@gmail.com';

SELECT TOP (10) email, 
EmailVerified, 
LegalDisclaimerAcknowledgedAt, 
AiChatDiscoveryShownAt,
TokenBalance,
*
FROM [dbo].[Users]

SELECT Code, UsedAt, Email, * from dbo.InvitationCodes
WHERE Email = 'heathmjones@gmail.com'