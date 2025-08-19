using Microsoft.Extensions.Options;
using SendGrid;
using MeetingSummarizer.Api.Models;
using MeetingSummarizer.Api.Services;

namespace MeetingSummarizer.Api.Configuration;

/// <summary>
/// Extension methods for registering email services
/// </summary>
public static class EmailServiceExtensions
{
    /// <summary>
    /// Add SendGrid email service to the DI container
    /// </summary>
    /// <param name="services">Service collection</param>
    /// <param name="configuration">Configuration</param>
    /// <returns>Service collection for chaining</returns>
    public static IServiceCollection AddEmailServices(this IServiceCollection services, IConfiguration configuration)
    {
        // Configure SendGrid options
        services.Configure<SendGridOptions>(configuration.GetSection(SendGridOptions.SectionName));
        
        // Validate SendGrid configuration at startup
        services.AddSingleton<IValidateOptions<SendGridOptions>, SendGridOptionsValidator>();
        
        // Register SendGrid client
        services.AddTransient<ISendGridClient>(provider =>
        {
            var options = provider.GetRequiredService<IOptions<SendGridOptions>>().Value;
            return new SendGridClient(options.ApiKey);
        });
        
        // Register email service
        services.AddScoped<IEmailService, SendGridEmailService>();
        
        return services;
    }
}

/// <summary>
/// Validator for SendGrid options
/// </summary>
public class SendGridOptionsValidator : IValidateOptions<SendGridOptions>
{
    public ValidateOptionsResult Validate(string? name, SendGridOptions options)
    {
        var failures = new List<string>();
        
        if (string.IsNullOrWhiteSpace(options.ApiKey))
        {
            failures.Add("SendGrid API Key is required");
        }
        else if (!options.ApiKey.StartsWith("SG."))
        {
            failures.Add("SendGrid API Key must start with 'SG.'");
        }
        
        if (string.IsNullOrWhiteSpace(options.FromEmail))
        {
            failures.Add("SendGrid From Email is required");
        }
        else if (!IsValidEmail(options.FromEmail))
        {
            failures.Add("SendGrid From Email must be a valid email address");
        }
        
        if (string.IsNullOrWhiteSpace(options.FromName))
        {
            failures.Add("SendGrid From Name is required");
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
