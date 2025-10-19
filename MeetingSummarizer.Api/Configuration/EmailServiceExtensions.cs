using Microsoft.Extensions.Options;
using Azure.Communication.Email;
using MeetingSummarizer.Api.Models;
using MeetingSummarizer.Api.Services.Email;

namespace MeetingSummarizer.Api.Configuration;

/// <summary>
/// Extension methods for registering email services
/// </summary>
public static class EmailServiceExtensions
{
    /// <summary>
    /// Add Azure Communication Services email service to the DI container
    /// </summary>
    /// <param name="services">Service collection</param>
    /// <param name="configuration">Configuration</param>
    /// <returns>Service collection for chaining</returns>
    public static IServiceCollection AddEmailServices(this IServiceCollection services, IConfiguration configuration)
    {
        // Configure Azure Communication Email options
        services.Configure<AzureCommunicationEmailOptions>(configuration.GetSection(AzureCommunicationEmailOptions.SectionName));
        
        // Validate Azure Communication Email configuration at startup
        services.AddSingleton<IValidateOptions<AzureCommunicationEmailOptions>, AzureCommunicationEmailOptionsValidator>();
        
        // Register Azure Communication Email client
        services.AddTransient<EmailClient>(provider =>
        {
            var options = provider.GetRequiredService<IOptions<AzureCommunicationEmailOptions>>().Value;
            return new EmailClient(options.ConnectionString);
        });
        
        // Register email service
        services.AddScoped<IEmailService, AzureCommunicationEmailService>();
        
        return services;
    }
}

/// <summary>
/// Validator for Azure Communication Email options
/// </summary>
public class AzureCommunicationEmailOptionsValidator : IValidateOptions<AzureCommunicationEmailOptions>
{
    public ValidateOptionsResult Validate(string? name, AzureCommunicationEmailOptions options)
    {
        var failures = new List<string>();
        
        if (string.IsNullOrWhiteSpace(options.ConnectionString))
        {
            failures.Add("Azure Communication Services Connection String is required");
        }
        else if (!options.ConnectionString.Contains("endpoint=", StringComparison.OrdinalIgnoreCase))
        {
            failures.Add("Azure Communication Services Connection String must contain 'endpoint=' parameter");
        }
        
        if (string.IsNullOrWhiteSpace(options.FromEmail))
        {
            failures.Add("From Email is required");
        }
        else if (!IsValidEmail(options.FromEmail))
        {
            failures.Add("From Email must be a valid email address");
        }
        
        if (options.MaxRetryAttempts < 1 || options.MaxRetryAttempts > 5)
        {
            failures.Add("Max retry attempts must be between 1 and 5");
        }
        
        if (options.RetryDelaySeconds < 1 || options.RetryDelaySeconds > 60)
        {
            failures.Add("Retry delay seconds must be between 1 and 60");
        }
        
        return failures.Count > 0 
            ? ValidateOptionsResult.Fail(failures)
            : ValidateOptionsResult.Success;
    }
    
    private static bool IsValidEmail(string email)
    {
        try
        {
            var addr = new System.Net.Mail.MailAddress(email);
            return addr.Address == email;
        }
        catch
        {
            return false;
        }
    }
}
