using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.IdentityModel.Tokens;

namespace MeetingSummarizer.Api.Tests.Helpers;

/// <summary>
/// Helper class for generating JWT tokens for integration testing
/// </summary>
public static class TestAuthenticationHelper
{
    private const string TestJwtKey = "test-super-secret-jwt-key-at-least-32-characters-long-for-testing";
    private const string TestJwtIssuer = "MeetingSummary.io";
    private const string TestJwtAudience = "MeetingSummary.io";

    /// <summary>
    /// Generate a JWT token for a test user
    /// </summary>
    /// <param name="userId">User ID to include in the token</param>
    /// <param name="email">User email to include in the token</param>
    /// <param name="expirationMinutes">Token expiration in minutes (default: 60)</param>
    /// <returns>JWT token string</returns>
    public static string GenerateTestJwtToken(Guid userId, string email = "test@example.com", int expirationMinutes = 60)
    {
        var tokenHandler = new JwtSecurityTokenHandler();
        var key = Encoding.ASCII.GetBytes(TestJwtKey);
        
        var tokenDescriptor = new SecurityTokenDescriptor
        {
            Subject = new ClaimsIdentity(new[]
            {
                new Claim(ClaimTypes.NameIdentifier, userId.ToString()),
                new Claim(ClaimTypes.Email, email),
                new Claim("sub", userId.ToString()),
                new Claim("email", email),
                new Claim("jti", Guid.NewGuid().ToString())
            }),
            Expires = DateTime.UtcNow.AddMinutes(expirationMinutes),
            Issuer = TestJwtIssuer,
            Audience = TestJwtAudience,
            SigningCredentials = new SigningCredentials(new SymmetricSecurityKey(key), SecurityAlgorithms.HmacSha256Signature)
        };

        var token = tokenHandler.CreateToken(tokenDescriptor);
        return tokenHandler.WriteToken(token);
    }

    /// <summary>
    /// Get the test JWT configuration values that match the main application
    /// </summary>
    /// <returns>Dictionary with JWT configuration for test setup</returns>
    public static Dictionary<string, string> GetTestJwtConfiguration()
    {
        return new Dictionary<string, string>
        {
            ["JWT:SecretKey"] = TestJwtKey,
            ["JWT:Issuer"] = TestJwtIssuer,
            ["JWT:Audience"] = TestJwtAudience
        };
    }

    /// <summary>
    /// Create a test user ID for consistent testing
    /// </summary>
    /// <returns>Test user ID</returns>
    public static Guid GetTestUserId()
    {
        // Use a deterministic GUID for test consistency
        return new Guid("11111111-1111-1111-1111-111111111111");
    }

    /// <summary>
    /// Add Authorization header to HttpClient with test JWT token
    /// </summary>
    /// <param name="client">HttpClient to configure</param>
    /// <param name="userId">Optional user ID (uses test user if not provided)</param>
    public static void SetAuthorizationHeader(HttpClient client, Guid? userId = null)
    {
        var testUserId = userId ?? GetTestUserId();
        var token = GenerateTestJwtToken(testUserId);
        client.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token);
    }
}