using MeetingSummarizer.Api.Helpers;
using MeetingSummarizer.Api.Models;
using MeetingSummarizer.Api.Services;
using MeetingSummarizer.Api.Configuration;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddControllers();

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
// Configure transcription service with automatic OpenAI/Mock fallback
builder.Services.AddTranscriptionService(builder.Configuration);

// Register speaker mapping service (S2.2)
builder.Services.AddScoped<ISpeakerMappingService, InMemorySpeakerMappingService>();

// Note: Additional service registrations will be added in future increments
// builder.Services.AddScoped<ITranscriptionService, TranscriptionService>();

var app = builder.Build();

// Validate OpenAI configuration on startup
using (var scope = app.Services.CreateScope())
{
    var openAIOptions = scope.ServiceProvider.GetRequiredService<Microsoft.Extensions.Options.IOptions<OpenAIOptions>>();
    var logger = scope.ServiceProvider.GetRequiredService<ILogger<Program>>();

    if (!openAIOptions.Value.IsValid())
    {
        logger.LogWarning("OpenAI API key is not configured. The application will start but OpenAI features will not be available. " +
                         "Configure the OpenAI:ApiKey setting in appsettings.json or set the OPENAI_API_KEY environment variable.");
    }
    else
    {
        logger.LogInformation("OpenAI configuration validated successfully. Using model: {TranscriptionModel} for transcription, {ChatModel} for chat",
            openAIOptions.Value.DefaultTranscriptionModel, openAIOptions.Value.DefaultChatModel);
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
