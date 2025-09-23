using MeetingSummarizer.Api.Helpers;
using MeetingSummarizer.Api.Models;
using MeetingSummarizer.Api.Services.Transcription;
using MeetingSummarizer.Api.Services.SpeakerMapping;
using MeetingSummarizer.Api.Services.Validation;
using MeetingSummarizer.Api.Services.FileProcessing;
using MeetingSummarizer.Api.Services.Storage;
using MeetingSummarizer.Api.Services.UserManagement;
using MeetingSummarizer.Api.Services.DataRetention;
using MeetingSummarizer.Api.Services.Authentication;
using MeetingSummarizer.Api.Services.TokenManagement;
using MeetingSummarizer.Api.Services.Payment;
using MeetingSummarizer.Api.Services;
using MeetingSummarizer.Api.Services.Interfaces;
using MeetingSummarizer.Api.Middleware;
using MeetingSummarizer.Api.Configuration;
using MeetingSummarizer.Api.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using System.Text.Json;

var builder = WebApplication.CreateBuilder(args);

// Add Azure Key Vault configuration if enabled (S6.1 Increment 2)
builder.Configuration.AddAzureKeyVault(builder.Configuration);

// Add services to the container.
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        // S3.4: Configure enum serialization as strings to match frontend
        options.JsonSerializerOptions.Converters.Add(new System.Text.Json.Serialization.JsonStringEnumConverter());
        
        // Ensure DateTime serialization is consistent and includes timezone info
        options.JsonSerializerOptions.PropertyNamingPolicy = JsonNamingPolicy.CamelCase;
    });

// Configure form options for large file uploads
builder.Services.Configure<Microsoft.AspNetCore.Http.Features.FormOptions>(options =>
{
    // Set limits to match AudioFileValidator.MaxFileSizeBytes (1GB)
    options.ValueLengthLimit = int.MaxValue;
    options.MultipartBodyLengthLimit = 1024L * 1024L * 1024L; // 1GB
    options.MultipartHeadersLengthLimit = int.MaxValue;
});

// Configure OpenAPI/Swagger
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new Microsoft.OpenApi.Models.OpenApiInfo { Title = "MeetingSummarizer API", Version = "v1" });

    // Enable file upload support in Swagger UI
    c.OperationFilter<SwaggerFileOperationFilter>();
});

// Configure environment-specific settings
builder.Services.Configure<EnvironmentOptions>(builder.Configuration.GetSection(EnvironmentOptions.SectionName));
builder.Services.Configure<CorsOptions>(builder.Configuration.GetSection(CorsOptions.SectionName));

// Configure CORS based on environment
var corsOptions = new CorsOptions();
builder.Configuration.GetSection(CorsOptions.SectionName).Bind(corsOptions);

builder.Services.AddCors(options =>
{
    options.AddPolicy("EnvironmentCorsPolicy", policy =>
    {
        if (corsOptions.AllowedOrigins.Any())
        {
            policy.WithOrigins(corsOptions.AllowedOrigins.ToArray())
                .WithMethods(corsOptions.AllowedMethods.ToArray())
                .WithHeaders(corsOptions.AllowedHeaders.ToArray());

            if (corsOptions.AllowCredentials)
                policy.AllowCredentials();

            policy.SetPreflightMaxAge(TimeSpan.FromSeconds(corsOptions.MaxAge));
        }
        else
        {
            // Fallback for development
            policy.WithOrigins(
                    "http://localhost:3000",  // Default Vite React dev server
                    "http://localhost:5173",  // Alternative Vite port
                    "http://localhost:5174",  // Current Vite port
                    "http://localhost:3001"   // Alternative React dev server port
                )
                .AllowAnyMethod()
                .AllowAnyHeader()
                .AllowCredentials();
        }
    });
});

// Configure Entity Framework for user data persistence (S6.1)
builder.Services.AddDbContext<MeetingSummarizerDbContext>(options =>
{
    var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");
    if (!string.IsNullOrEmpty(connectionString))
    {
        options.UseSqlServer(connectionString, sqlServerOptions =>
        {
            sqlServerOptions.EnableRetryOnFailure(
                maxRetryCount: 3,
                maxRetryDelay: TimeSpan.FromSeconds(30),
                errorNumbersToAdd: null);
        });
    }
    // If no connection string, EF will be registered but not functional
    // This maintains backward compatibility for existing functionality
});

// Add Azure configuration services (S6.1 Increment 2)
builder.Services.AddAzureConfigurationServices(builder.Configuration);

// Add Azure Blob Storage client (S6.1 Increment 3)
builder.Services.AddAzureBlobStorage(builder.Configuration);

// Add dependency injection for services
// Configure Azure Speech Services (S4.1)
builder.Services.AddAzureSpeechServices(builder.Configuration);

// Configure Azure-only transcription service using conversation transcription
builder.Services.AddScoped<ITranscriptionService, AzureConversationTranscriptionService>();

// Register transcript parsing service for S6.4 hybrid storage optimization
builder.Services.AddScoped<MeetingSummarizer.Api.Services.Transcription.ITranscriptParsingService, MeetingSummarizer.Api.Services.Transcription.TranscriptParsingService>();

// Register session-based speaker mapping service (S3.1)
builder.Services.AddScoped<ISpeakerMappingService, SessionSpeakerMappingService>();
builder.Services.AddScoped<ISessionSpeakerMappingService, SessionSpeakerMappingService>();

// Register summarization service with automatic OpenAI/Mock fallback (S2.3)
builder.Services.AddSummarizationService(builder.Configuration);

// Register email service (S3.4 Increment 4)
builder.Services.AddEmailServices(builder.Configuration);

// Register configuration validation service (S4.3)
builder.Services.AddScoped<IConfigurationValidationService, ConfigurationValidationService>();

// Register enhanced file processing service (S4.3)
builder.Services.AddScoped<IFilePreProcessingService, FilePreProcessingService>();

// Register User Storage Service (S6.1 Increment 3)
builder.Services.AddScoped<IUserStorageService, UserStorageService>();

// Register User Management Service (S6.1 Increment 4)
builder.Services.AddScoped<IUserManagementService, UserManagementService>();

// Register Meeting Service for persistent meeting records (S6.5 Increment 3)
builder.Services.AddScoped<MeetingSummarizer.Api.Services.Interfaces.IMeetingService, MeetingSummarizer.Api.Services.MeetingService>();

// Register Data Retention Service (S6.1 Increment 4)
builder.Services.AddScoped<IDataRetentionService, DataRetentionService>();

// Register JWT Authentication Service (S6.2 Increment 1)
builder.Services.AddScoped<MeetingSummarizer.Api.Services.Authentication.IJwtAuthenticationService, MeetingSummarizer.Api.Services.Authentication.JwtAuthenticationService>();

// Register Email Verification Service (S6.8 Increment 2)
builder.Services.AddScoped<MeetingSummarizer.Api.Services.EmailVerification.IEmailVerificationService, MeetingSummarizer.Api.Services.EmailVerification.EmailVerificationService>();

// Register SignalR for real-time meeting progress updates (S6.5 Increment 2)
builder.Services.AddSignalR();
builder.Services.AddScoped<MeetingSummarizer.Api.Hubs.IMeetingProgressNotificationService, MeetingSummarizer.Api.Hubs.MeetingProgressNotificationService>();

// Configure ASP.NET Core Authentication with JWT Bearer (S6.2 Fix)
builder.Services.AddAuthentication("Bearer")
    .AddJwtBearer("Bearer", options =>
    {
        var jwtKey = builder.Configuration["JWT:SecretKey"] ?? 
                     Environment.GetEnvironmentVariable("JWT_SECRET_KEY") ?? 
                     "your-super-secret-jwt-key-at-least-32-characters-long-for-security";
        var jwtIssuer = builder.Configuration["JWT:Issuer"] ?? "MeetingSummary.io";
        var jwtAudience = builder.Configuration["JWT:Audience"] ?? "MeetingSummary.io";
        
        options.TokenValidationParameters = new Microsoft.IdentityModel.Tokens.TokenValidationParameters
        {
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new Microsoft.IdentityModel.Tokens.SymmetricSecurityKey(
                System.Text.Encoding.UTF8.GetBytes(jwtKey)),
            ValidateIssuer = true,
            ValidIssuer = jwtIssuer,
            ValidateAudience = true,
            ValidAudience = jwtAudience,
            ValidateLifetime = true,
            ClockSkew = TimeSpan.Zero
        };
    });

// Register Token Calculation Service (S6.3 Increment 2)
builder.Services.AddScoped<MeetingSummarizer.Api.Services.TokenManagement.ITokenCalculationService, MeetingSummarizer.Api.Services.TokenManagement.TokenCalculationService>();

// Register Token Service (S6.3 Increment 3)
builder.Services.AddScoped<MeetingSummarizer.Api.Services.TokenManagement.ITokenService, MeetingSummarizer.Api.Services.TokenManagement.TokenService>();

// Register Payment Service (S6.3 Increment 4)
builder.Services.AddScoped<MeetingSummarizer.Api.Services.Payment.IPaymentService, MeetingSummarizer.Api.Services.Payment.StripePaymentService>();

// Register Document Service (S6.5 PDF Export)
builder.Services.AddScoped<IDocumentService, DocumentService>();

// Register Summary Persistence Service (S6.10 Summary Persistence)
builder.Services.AddScoped<ISummaryPersistenceService, SummaryPersistenceService>();

// Register Batch Transcription Services (S6.3.6)
builder.Services.AddHttpClient<AzureBatchTranscriptionService>();
builder.Services.AddScoped<AzureBatchTranscriptionService>();
builder.Services.AddHostedService<BatchJobMonitorService>();

// Configure Kestrel server for large file uploads
builder.Services.Configure<Microsoft.AspNetCore.Server.Kestrel.Core.KestrelServerOptions>(options =>
{
    // Set max request body size to match AudioFileValidator.MaxFileSizeBytes (1GB)
    options.Limits.MaxRequestBodySize = 1024L * 1024L * 1024L; // 1GB
    // Increase request timeout for large file processing
    options.Limits.KeepAliveTimeout = TimeSpan.FromMinutes(10);
    options.Limits.RequestHeadersTimeout = TimeSpan.FromMinutes(2);
});

// Note: Additional service registrations will be added in future increments

var app = builder.Build();

// Validate OpenAI and Azure configuration on startup
using (var scope = app.Services.CreateScope())
{
    var openAIOptions = scope.ServiceProvider.GetRequiredService<Microsoft.Extensions.Options.IOptions<OpenAIOptions>>();
    var logger = scope.ServiceProvider.GetRequiredService<ILogger<Program>>();

    if (!openAIOptions.Value.IsValid())
    {
        logger.LogWarning("OpenAI API key is not configured. Summarization features will not be available. " +
                         "Transcription will use Azure Speech Services. " +
                         "Configure the OpenAI:ApiKey setting in appsettings.json or set the OPENAI_API_KEY environment variable.");
    }
    else
    {
        logger.LogInformation("OpenAI configuration validated successfully. Using model: {ChatModel} for summarization (transcription handled by Azure Speech Services)",
            openAIOptions.Value.DefaultChatModel);
    }

    // Validate Azure Speech Services configuration (S4.1)
    scope.ServiceProvider.ValidateAzureSpeechConfiguration();
    
    // Validate Azure configuration services (S6.1 Increment 2)
    await scope.ValidateAzureConfigurationAsync(logger);

    // Perform comprehensive startup validation (S4.3)
    var validationService = scope.ServiceProvider.GetService<IConfigurationValidationService>();
    if (validationService != null)
    {
        try
        {
            var validationResult = await validationService.ValidateStartupConfigurationAsync();
            
            if (validationResult.IsValid)
            {
                logger.LogInformation("✅ Startup configuration validation passed - {Summary} (Duration: {Duration}ms)",
                    validationResult.Summary, validationResult.ValidationDuration.TotalMilliseconds);
                
                if (validationResult.GetAllWarnings().Any())
                {
                    logger.LogWarning("⚠️ Configuration warnings: {Warnings}",
                        string.Join("; ", validationResult.GetAllWarnings()));
                }
            }
            else
            {
                logger.LogError("❌ Startup configuration validation failed - {Summary}", validationResult.Summary);
                logger.LogError("Configuration errors: {Errors}", 
                    string.Join("; ", validationResult.GetAllErrors()));
                
                // Continue startup but log the failures for monitoring
                logger.LogWarning("Application will start with configuration issues. Check health endpoints for details.");
            }
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Failed to perform startup configuration validation");
        }
    }
    else
    {
        logger.LogWarning("Configuration validation service not available");
    }
}

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(c =>
    {
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "MeetingSummarizer API v1");
        c.RoutePrefix = "swagger"; // Serve Swagger UI at /swagger
        c.EnableDeepLinking();
        c.EnableValidator();
        c.EnableFilter();
        c.EnableTryItOutByDefault();
    });
}

// Only redirect to HTTPS in production to avoid CORS issues in development
if (!app.Environment.IsDevelopment())
{
    app.UseHttpsRedirection();
}

// Enable environment-specific CORS policy
app.UseCors("EnvironmentCorsPolicy");

// Add Stripe webhook middleware (S6.3 Increment 4)
app.UseMiddleware<StripeWebhookMiddleware>();

// Add ASP.NET Core Authentication middleware (S6.2 Fix)
app.UseAuthentication();

// Add JWT authentication middleware (S6.2 Increment 2)
app.UseJwtAuthentication();

app.UseAuthorization();

app.MapControllers();

// Map SignalR hub for real-time meeting progress updates (S6.5 Increment 2)
app.MapHub<MeetingSummarizer.Api.Hubs.MeetingProgressHub>("/meetingProgressHub");

app.Run();

// Make Program class accessible for testing
public partial class Program { }

record WeatherForecast(DateOnly Date, int TemperatureC, string? Summary)
{
    public int TemperatureF => 32 + (int)(TemperatureC / 0.5556);
}
