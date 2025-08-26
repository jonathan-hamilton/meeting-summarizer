using MeetingSummarizer.Api.Helpers;
using MeetingSummarizer.Api.Models;
using MeetingSummarizer.Api.Services;
using MeetingSummarizer.Api.Configuration;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        // S3.4: Configure enum serialization as strings to match frontend
        options.JsonSerializerOptions.Converters.Add(new System.Text.Json.Serialization.JsonStringEnumConverter());
    });

// Configure OpenAPI/Swagger
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new Microsoft.OpenApi.Models.OpenApiInfo { Title = "MeetingSummarizer API", Version = "v1" });

    // Enable file upload support in Swagger UI
    c.OperationFilter<SwaggerFileOperationFilter>();
});

// Configure CORS for React frontend development
builder.Services.AddCors(options =>
{
    options.AddPolicy("DevelopmentCorsPolicy", policy =>
    {
        policy.WithOrigins(
                "http://localhost:3000",  // Default Vite React dev server
                "http://localhost:5173",  // Alternative Vite port
                "http://localhost:5174",  // Current Vite port
                "http://localhost:3001"   // Alternative React dev server port
            )
            .AllowAnyMethod()
            .AllowAnyHeader()
            .AllowCredentials();
    });
});

// Add dependency injection for services
// Configure Azure Speech Services (S4.1)
builder.Services.AddAzureSpeechServices(builder.Configuration);

// Configure Azure-only transcription service (OpenAI disabled for transcription)
builder.Services.AddScoped<ITranscriptionService, AzureSpeechService>();

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
builder.Services.AddScoped<IFileProcessingService, FileProcessingService>();

// Note: Additional service registrations will be added in future increments
// builder.Services.AddScoped<ITranscriptionService, TranscriptionService>();

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

app.UseHttpsRedirection();

// Enable CORS for development
if (app.Environment.IsDevelopment())
{
    app.UseCors("DevelopmentCorsPolicy");
}

app.UseAuthorization();

app.MapControllers();

app.Run();

// Make Program class accessible for testing
public partial class Program { }

record WeatherForecast(DateOnly Date, int TemperatureC, string? Summary)
{
    public int TemperatureF => 32 + (int)(TemperatureC / 0.5556);
}
