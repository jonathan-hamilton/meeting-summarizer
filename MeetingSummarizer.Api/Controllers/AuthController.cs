using Microsoft.AspNetCore.Mvc;
using MeetingSummarizer.Api.Models;
using MeetingSummarizer.Api.Services.Authentication;
using MeetingSummarizer.Api.Services.UserManagement;
using MeetingSummarizer.Api.Services.EmailVerification;

namespace MeetingSummarizer.Api.Controllers;

/// <summary>
/// Authentication API Controller
/// Handles user login, registration, and JWT token management
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Produces("application/json")]
public class AuthController : ControllerBase
{
    private readonly IJwtAuthenticationService _jwtService;
    private readonly IUserManagementService _userService;
    private readonly IEmailVerificationService _verificationService;
    private readonly ILogger<AuthController> _logger;

    public AuthController(
        IJwtAuthenticationService jwtService,
        IUserManagementService userService,
        IEmailVerificationService verificationService,
        ILogger<AuthController> logger)
    {
        _jwtService = jwtService;
        _userService = userService;
        _verificationService = verificationService;
        _logger = logger;
    }

    /// <summary>
    /// Register a new user account with authentication
    /// </summary>
    [HttpPost("register")]
    public async Task<ActionResult<AuthResponse>> Register([FromBody] RegisterRequest request)
    {
        try
        {
            // Validate password is provided for authentication
            if (string.IsNullOrWhiteSpace(request.Password))
            {
                return BadRequest(new { message = "Password is required for user registration" });
            }

            // Create user request from registration data
            var createUserRequest = new CreateUserRequest
            {
                Email = request.Email,
                FirstName = request.FirstName,
                LastName = request.LastName,
                Password = request.Password,
                HasConsentedToDataProcessing = request.HasConsentedToDataProcessing,
                IsPaidUser = false, // New users start as demo users
                InitialTokenBalance = 0,
                Role = Data.Enums.UserRole.User // Default role
            };

            var user = await _userService.CreateUserAsync(createUserRequest);

            // Generate JWT tokens
            var accessToken = _jwtService.GenerateAccessToken(user);
            var refreshToken = _jwtService.GenerateRefreshToken(user);

            var response = new AuthResponse
            {
                AccessToken = accessToken,
                RefreshToken = refreshToken,
                User = new UserResponse
                {
                    Id = user.Id,
                    Email = user.Email,
                    FirstName = user.FirstName,
                    LastName = user.LastName,
                    IsPaidUser = user.IsPaidUser,
                    TokenBalance = user.TokenBalance,
                    HasConsentedToDataProcessing = user.HasConsentedToDataProcessing,
                    ConsentDate = user.ConsentDate,
                    CreatedAt = user.CreatedAt,
                    LastActivityAt = user.LastActivityAt,
                    TotalMeetings = 0,
                    Role = user.Role
                }
            };

            _logger.LogInformation("User registered successfully: {UserId} ({Email})", user.Id, user.Email);

            // Send verification email (don't block registration if email fails)
            try
            {
                var emailSent = await _verificationService.SendVerificationEmailAsync(user.Id);
                if (emailSent)
                {
                    _logger.LogInformation("Verification email sent to new user {UserId}", user.Id);
                }
                else
                {
                    _logger.LogWarning("Failed to send verification email to new user {UserId}", user.Id);
                }
            }
            catch (Exception emailEx)
            {
                _logger.LogError(emailEx, "Error sending verification email to new user {UserId}", user.Id);
                // Continue with successful registration even if email fails
            }

            return CreatedAtAction(nameof(GetProfile), new { }, response);
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogWarning("Registration failed: {Message}", ex.Message);
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during user registration");
            return StatusCode(500, new { message = "An error occurred during registration" });
        }
    }

    /// <summary>
    /// Authenticate user and return JWT tokens
    /// </summary>
    [HttpPost("login")]
    public async Task<ActionResult<AuthResponse>> Login([FromBody] LoginRequest request)
    {
        try
        {
            // Find user by email
            var user = await _userService.GetUserByEmailAsync(request.Email);
            if (user == null)
            {
                _logger.LogWarning("Login attempt with non-existent email: {Email}", request.Email);
                return Unauthorized(new { message = "Invalid email or password" });
            }

            // Verify password
            if (string.IsNullOrWhiteSpace(user.PasswordHash) || 
                !_jwtService.VerifyPassword(request.Password, user.PasswordHash, user.Salt))
            {
                _logger.LogWarning("Invalid password attempt for user: {UserId} ({Email})", user.Id, user.Email);
                return Unauthorized(new { message = "Invalid email or password" });
            }

            // Update last activity
            await _userService.UpdateUserActivityAsync(user.Id);

            // Generate JWT tokens
            var accessToken = _jwtService.GenerateAccessToken(user);
            var refreshToken = _jwtService.GenerateRefreshToken(user);

            var response = new AuthResponse
            {
                AccessToken = accessToken,
                RefreshToken = refreshToken,
                User = new UserResponse
                {
                    Id = user.Id,
                    Email = user.Email,
                    FirstName = user.FirstName,
                    LastName = user.LastName,
                    IsPaidUser = user.IsPaidUser,
                    TokenBalance = user.TokenBalance,
                    HasConsentedToDataProcessing = user.HasConsentedToDataProcessing,
                    ConsentDate = user.ConsentDate,
                    CreatedAt = user.CreatedAt,
                    LastActivityAt = user.LastActivityAt,
                    TotalMeetings = user.Meetings?.Count ?? 0,
                    Role = user.Role
                }
            };

            _logger.LogInformation("User logged in successfully: {UserId} ({Email})", user.Id, user.Email);
            return Ok(response);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during user login");
            return StatusCode(500, new { message = "An error occurred during login" });
        }
    }

    /// <summary>
    /// Refresh access token using refresh token
    /// </summary>
    [HttpPost("refresh")]
    public async Task<ActionResult<AuthResponse>> RefreshToken([FromBody] RefreshTokenRequest request)
    {
        try
        {
            // Validate refresh token
            var userId = _jwtService.ValidateToken(request.RefreshToken);
            if (userId == null)
            {
                _logger.LogWarning("Invalid refresh token provided");
                return Unauthorized(new { message = "Invalid refresh token" });
            }

            // Get current user data
            var user = await _userService.GetUserByIdAsync(userId.Value);
            if (user == null)
            {
                _logger.LogWarning("Refresh token for non-existent user: {UserId}", userId);
                return Unauthorized(new { message = "Invalid refresh token" });
            }

            // Generate new tokens
            var accessToken = _jwtService.GenerateAccessToken(user);
            var refreshToken = _jwtService.GenerateRefreshToken(user);

            var response = new AuthResponse
            {
                AccessToken = accessToken,
                RefreshToken = refreshToken,
                User = new UserResponse
                {
                    Id = user.Id,
                    Email = user.Email,
                    FirstName = user.FirstName,
                    LastName = user.LastName,
                    IsPaidUser = user.IsPaidUser,
                    TokenBalance = user.TokenBalance,
                    HasConsentedToDataProcessing = user.HasConsentedToDataProcessing,
                    ConsentDate = user.ConsentDate,
                    CreatedAt = user.CreatedAt,
                    LastActivityAt = user.LastActivityAt,
                    TotalMeetings = user.Meetings?.Count ?? 0,
                    Role = user.Role
                }
            };

            _logger.LogInformation("Token refreshed for user: {UserId} ({Email})", user.Id, user.Email);
            return Ok(response);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during token refresh");
            return StatusCode(500, new { message = "An error occurred during token refresh" });
        }
    }

    /// <summary>
    /// Get current user profile (requires authentication)
    /// </summary>
    [HttpGet("profile")]
    public async Task<ActionResult<UserResponse>> GetProfile()
    {
        try
        {
            // For now, return a placeholder - this will be enhanced with JWT middleware
            return Ok(new { message = "Profile endpoint - JWT middleware integration coming next" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving user profile");
            return StatusCode(500, new { message = "An error occurred while retrieving profile" });
        }
    }

    /// <summary>
    /// Logout user (invalidate tokens - placeholder for now)
    /// </summary>
    [HttpPost("logout")]
    public IActionResult Logout()
    {
        // For JWT tokens, logout is typically handled client-side by removing tokens
        // Server-side token blacklisting can be added in future enhancement
        _logger.LogInformation("User logout requested");
        return Ok(new { message = "Logged out successfully" });
    }
}
