using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;
using MeetingSummarizer.Api.Models;
using MeetingSummarizer.Api.Services.Authentication;
using MeetingSummarizer.Api.Services.UserManagement;
using MeetingSummarizer.Api.Services.EmailVerification;
using MeetingSummarizer.Api.Services.Invitation;

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
    private readonly IInvitationService _invitationService;
    private readonly IWebHostEnvironment _environment;
    private readonly IConfiguration _configuration;
    private readonly ILogger<AuthController> _logger;

    public AuthController(
        IJwtAuthenticationService jwtService,
        IUserManagementService userService,
        IEmailVerificationService verificationService,
        IInvitationService invitationService,
        IWebHostEnvironment environment,
        IConfiguration configuration,
        ILogger<AuthController> logger)
    {
        _jwtService = jwtService;
        _userService = userService;
        _verificationService = verificationService;
        _invitationService = invitationService;
        _environment = environment;
        _configuration = configuration;
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

            // Validate invitation code based on configuration
            var requireInvitation = _configuration.GetValue<bool>("Environment:FeatureFlags:RequireInvitationForRegistration", false);
            
            if (requireInvitation)
            {
                if (string.IsNullOrWhiteSpace(request.InvitationCode))
                {
                    _logger.LogWarning("Registration attempted without invitation code when required: {Email}", request.Email);
                    return BadRequest(new { message = "Invitation code is required for registration" });
                }

                var invitationCode = await _invitationService.ValidateInvitationCodeAsync(request.InvitationCode, request.Email);
                if (invitationCode == null)
                {
                    _logger.LogWarning("Invalid invitation code used during registration: {Code} for {Email}", request.InvitationCode, request.Email);
                    return BadRequest(new { message = "Invalid or expired invitation code" });
                }

                _logger.LogInformation("Valid invitation code {Code} used for registration: {Email}", request.InvitationCode, request.Email);
            }
            else
            {
                // When invitation is not required, still validate if provided
                if (!string.IsNullOrWhiteSpace(request.InvitationCode))
                {
                    var invitationCode = await _invitationService.ValidateInvitationCodeAsync(request.InvitationCode, request.Email);
                    if (invitationCode == null)
                    {
                        _logger.LogWarning("Invalid invitation code provided in production registration: {Code} for {Email}", request.InvitationCode, request.Email);
                        return BadRequest(new { message = "Invalid or expired invitation code" });
                    }
                    _logger.LogInformation("Valid invitation code {Code} used for production registration: {Email}", request.InvitationCode, request.Email);
                }
            }

            // Create user request from registration data
            var createUserRequest = new CreateUserRequest
            {
                Email = request.Email,
                FirstName = request.FirstName,
                LastName = request.LastName,
                Password = request.Password,
                HasConsentedToDataProcessing = request.HasConsentedToDataProcessing,
                IsPaidUser = false, // New users start with basic access
                InitialTokenBalance = 0,
                Role = Data.Enums.UserRole.User // Default role
            };

            var user = await _userService.CreateUserAsync(createUserRequest);

            // Mark invitation code as used if provided
            if (!string.IsNullOrWhiteSpace(request.InvitationCode))
            {
                var codeMarked = await _invitationService.MarkInvitationCodeAsUsedAsync(request.InvitationCode, user.Id);
                if (codeMarked)
                {
                    _logger.LogInformation("Invitation code {Code} marked as used by user {UserId}", request.InvitationCode, user.Id);
                }
                else
                {
                    _logger.LogWarning("Failed to mark invitation code {Code} as used by user {UserId}", request.InvitationCode, user.Id);
                }
            }

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
    public Task<ActionResult<UserResponse>> GetProfile()
    {
        try
        {
            // For now, return a placeholder - this will be enhanced with JWT middleware
            return Task.FromResult<ActionResult<UserResponse>>(Ok(new { message = "Profile endpoint - JWT middleware integration coming next" }));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving user profile");
            return Task.FromResult<ActionResult<UserResponse>>(StatusCode(500, new { message = "An error occurred while retrieving profile" }));
        }
    }

    /// <summary>
    /// Validate password meets security requirements
    /// </summary>
    private static bool IsValidPassword(string password)
    {
        if (string.IsNullOrWhiteSpace(password) || password.Length < 8)
        {
            return false;
        }

        bool hasUpper = false, hasLower = false, hasDigit = false;
        foreach (char c in password)
        {
            if (char.IsUpper(c)) hasUpper = true;
            else if (char.IsLower(c)) hasLower = true;
            else if (char.IsDigit(c)) hasDigit = true;
        }

        return hasUpper && hasLower && hasDigit;
    }

    /// <summary>
    /// Change user password (requires authentication)
    /// </summary>
    [HttpPost("change-password")]
    [Authorize]
    public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordRequest request)
    {
        try
        {
            // Get user ID from JWT claims
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdClaim) || !Guid.TryParse(userIdClaim, out var userId))
            {
                _logger.LogWarning("Change password attempt with invalid user ID claim");
                return Unauthorized(new { message = "Invalid authentication" });
            }

            // Get current user
            var user = await _userService.GetUserByIdAsync(userId);
            if (user == null)
            {
                _logger.LogWarning("Change password attempt for non-existent user: {UserId}", userId);
                return Unauthorized(new { message = "User not found" });
            }

            // Verify current password
            if (string.IsNullOrWhiteSpace(user.PasswordHash) || 
                !_jwtService.VerifyPassword(request.CurrentPassword, user.PasswordHash, user.Salt))
            {
                _logger.LogWarning("Password change failed - incorrect current password for user: {UserId}", userId);
                return BadRequest(new { message = "Current password is incorrect" });
            }

            // Validate new password meets requirements (8+ chars, mixed case, numbers)
            if (!IsValidPassword(request.NewPassword))
            {
                return BadRequest(new { message = "New password does not meet security requirements: minimum 8 characters with mixed case letters and numbers" });
            }

            // Hash new password
            var (passwordHash, salt) = _jwtService.HashPassword(request.NewPassword);

            // Update user password
            await _userService.UpdatePasswordAsync(userId, passwordHash, salt);

            _logger.LogInformation("Password changed successfully for user: {UserId}", userId);
            return Ok(new { message = "Password changed successfully" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during password change");
            return StatusCode(500, new { message = "An error occurred while changing password" });
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

    /// <summary>
    /// Development testing endpoint - Create test invitation code
    /// WARNING: This endpoint should be removed before production
    /// </summary>
    [HttpPost("test/create-invitation")]
    public async Task<ActionResult<object>> CreateTestInvitation([FromBody] CreateTestInvitationRequest request)
    {
        // Only allow in development environment
        if (!_environment.IsDevelopment())
        {
            return NotFound();
        }

        try
        {
            _logger.LogInformation("Creating test invitation for email: {Email}", request.Email);
            
            var invitation = await _invitationService.GenerateInvitationCodeAsync(
                request.Email, 
                999, // Use test user ID for development testing
                expirationDays: 7
            );

            return Ok(new { 
                invitationCode = invitation.Code, 
                email = invitation.Email,
                expiresAt = invitation.ExpiresAt,
                message = "Test invitation created successfully" 
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to create test invitation for email: {Email}", request.Email);
            return StatusCode(500, new { message = "Failed to create test invitation" });
        }
    }
}

/// <summary>
/// Request model for creating test invitations (development only)
/// </summary>
public class CreateTestInvitationRequest
{
    public string Email { get; set; } = string.Empty;
}
