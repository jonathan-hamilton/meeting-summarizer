DECLARE @userId UNIQUEIDENTIFIER;
SET @userId = (SELECT Id FROM dbo.Users WHERE Email = 'jhamilton.swe@gmail.com');

Update dbo.Users
SET TokenBalance = 1000
WHERE Id = @userId;

