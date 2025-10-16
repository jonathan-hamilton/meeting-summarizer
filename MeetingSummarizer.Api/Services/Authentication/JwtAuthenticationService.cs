using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.IdentityModel.Tokens;
using MeetingSummarizer.Api.Data.Entities;
using BCrypt.Net;

namespace MeetingSummarizer.Api.Services.Authentication;

/// <summary>
/// JWT authentication service implementation
/// </summary>
public class JwtAuthenticationService : IJwtAuthenticationService
{
    private readonly IConfiguration _configuration;
    private readonly ILogger<JwtAuthenticationService> _logger;
    private readonly string _secretKey;
    private readonly string _issuer;
    private readonly string _audience;
    private readonly int _accessTokenExpiryMinutes;
    private readonly int _refreshTokenExpiryDays;

    public JwtAuthenticationService(
        IConfiguration configuration,
        ILogger<JwtAuthenticationService> logger)
    {
        _configuration = configuration;
        _logger = logger;
        
        // Get JWT configuration from Key Vault (--) or appsettings (:)
        _secretKey = _configuration["JWT--SecretKey"] ?? 
                    _configuration["JWT:SecretKey"] ?? 
                    throw new ArgumentException("JWT SecretKey not configured");
        _issuer = _configuration["JWT--Issuer"] ?? 
                 _configuration["JWT:Issuer"] ?? 
                 "MeetingSummary.io";
        _audience = _configuration["JWT--Audience"] ?? 
                   _configuration["JWT:Audience"] ?? 
                   "MeetingSummary.io";
        _accessTokenExpiryMinutes = _configuration.GetValue<int>("JWT--AccessTokenExpiryMinutes") != 0 ? 
                                   _configuration.GetValue<int>("JWT--AccessTokenExpiryMinutes") :
                                   _configuration.GetValue<int>("JWT:AccessTokenExpiryMinutes", 30);
        _refreshTokenExpiryDays = _configuration.GetValue<int>("JWT--RefreshTokenExpiryDays") != 0 ? 
                                 _configuration.GetValue<int>("JWT--RefreshTokenExpiryDays") :
                                 _configuration.GetValue<int>("JWT:RefreshTokenExpiryDays", 7);
        
        // Validate secret key length for security
        if (_secretKey.Length < 32)
        {
            throw new ArgumentException("JWT SecretKey must be at least 32 characters long");
        }
    }

    public string GenerateAccessToken(User user)
    {
        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new Claim(ClaimTypes.Email, user.Email),
            new Claim(ClaimTypes.Name, $"{user.FirstName} {user.LastName}"),
            new Claim(ClaimTypes.Role, user.Role.ToString()),
            new Claim("isPaidUser", user.IsPaidUser.ToString()),
            new Claim("tokenBalance", user.TokenBalance.ToString()),
            new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
            new Claim(JwtRegisteredClaimNames.Iat, 
                new DateTimeOffset(DateTime.UtcNow).ToUnixTimeSeconds().ToString(), 
                ClaimValueTypes.Integer64)
        };

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_secretKey));
        var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var token = new JwtSecurityToken(
            issuer: _issuer,
            audience: _audience,
            claims: claims,
            expires: DateTime.UtcNow.AddMinutes(_accessTokenExpiryMinutes),
            signingCredentials: credentials
        );

        var tokenString = new JwtSecurityTokenHandler().WriteToken(token);
        
        _logger.LogInformation("Generated access token for user {UserId} ({Email}) expires at {Expiry}", 
            user.Id, user.Email, token.ValidTo);
            
        return tokenString;
    }

    public string GenerateRefreshToken(User user)
    {
        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new Claim(ClaimTypes.Email, user.Email),
            new Claim("tokenType", "refresh"),
            new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
            new Claim(JwtRegisteredClaimNames.Iat, 
                new DateTimeOffset(DateTime.UtcNow).ToUnixTimeSeconds().ToString(), 
                ClaimValueTypes.Integer64)
        };

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_secretKey));
        var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var token = new JwtSecurityToken(
            issuer: _issuer,
            audience: _audience,
            claims: claims,
            expires: DateTime.UtcNow.AddDays(_refreshTokenExpiryDays),
            signingCredentials: credentials
        );

        var tokenString = new JwtSecurityTokenHandler().WriteToken(token);
        
        _logger.LogInformation("Generated refresh token for user {UserId} ({Email}) expires at {Expiry}", 
            user.Id, user.Email, token.ValidTo);
            
        return tokenString;
    }

    public Guid? ValidateToken(string token)
    {
        try
        {
            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_secretKey));
            
            var validationParameters = new TokenValidationParameters
            {
                ValidateIssuerSigningKey = true,
                IssuerSigningKey = key,
                ValidateIssuer = true,
                ValidIssuer = _issuer,
                ValidateAudience = true,
                ValidAudience = _audience,
                ValidateLifetime = true,
                ClockSkew = TimeSpan.Zero // No tolerance for expired tokens
            };

            var tokenHandler = new JwtSecurityTokenHandler();
            var principal = tokenHandler.ValidateToken(token, validationParameters, out var validatedToken);
            
            var userIdClaim = principal.FindFirst(ClaimTypes.NameIdentifier);
            if (userIdClaim != null && Guid.TryParse(userIdClaim.Value, out var userId))
            {
                _logger.LogDebug("Successfully validated token for user {UserId}", userId);
                return userId;
            }
            
            _logger.LogWarning("Token validation failed: missing or invalid user ID claim");
            return null;
        }
        catch (SecurityTokenExpiredException)
        {
            _logger.LogInformation("Token validation failed: token expired");
            return null;
        }
        catch (SecurityTokenException ex)
        {
            _logger.LogWarning("Token validation failed: {Error}", ex.Message);
            return null;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error during token validation");
            return null;
        }
    }

    public (string passwordHash, string salt) HashPassword(string password)
    {
        if (string.IsNullOrWhiteSpace(password))
        {
            throw new ArgumentException("Password cannot be null or empty", nameof(password));
        }

        // Generate salt and hash password with bcrypt
        var salt = BCrypt.Net.BCrypt.GenerateSalt(workFactor: 12); // 12 rounds for strong security
        var passwordHash = BCrypt.Net.BCrypt.HashPassword(password, salt);
        
        _logger.LogDebug("Password hashed successfully with bcrypt work factor 12");
        
        return (passwordHash, salt);
    }

    public bool VerifyPassword(string password, string passwordHash, string? salt = null)
    {
        if (string.IsNullOrWhiteSpace(password) || string.IsNullOrWhiteSpace(passwordHash))
        {
            return false;
        }

        try
        {
            // bcrypt includes salt in the hash, so we can verify directly
            var isValid = BCrypt.Net.BCrypt.Verify(password, passwordHash);
            
            _logger.LogDebug("Password verification result: {IsValid}", isValid);
            
            return isValid;
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Password verification failed due to exception");
            return false;
        }
    }
}
