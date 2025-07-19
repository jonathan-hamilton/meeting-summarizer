using Microsoft.OpenApi.Models;
using Swashbuckle.AspNetCore.SwaggerGen;
using System.Reflection;

namespace MeetingSummarizer.Api.Helpers;

/// <summary>
/// Swagger operation filter to enable file upload support in Swagger UI
/// </summary>
public class SwaggerFileOperationFilter : IOperationFilter
{
    public void Apply(OpenApiOperation operation, OperationFilterContext context)
    {
        // Check if the operation consumes multipart/form-data
        if (operation.RequestBody?.Content?.ContainsKey("multipart/form-data") != true)
            return;

        // Get the form-data schema
        var formDataContent = operation.RequestBody.Content["multipart/form-data"];
        if (formDataContent.Schema?.Properties == null)
            return;

        // Look for IFormFile properties in the request model
        var parameters = context.MethodInfo.GetParameters();
        foreach (var parameter in parameters)
        {
            var properties = parameter.ParameterType.GetProperties();
            foreach (var property in properties)
            {
                if (property.PropertyType == typeof(IFormFile) ||
                    (property.PropertyType.IsGenericType &&
                     property.PropertyType.GetGenericTypeDefinition() == typeof(Nullable<>) &&
                     property.PropertyType.GetGenericArguments()[0] == typeof(IFormFile)) ||
                    property.PropertyType.Name == "IFormFile")
                {
                    var propertyName = char.ToLowerInvariant(property.Name[0]) + property.Name[1..];

                    if (formDataContent.Schema.Properties.ContainsKey(propertyName))
                    {
                        // Update the property to be a file upload
                        formDataContent.Schema.Properties[propertyName] = new OpenApiSchema
                        {
                            Type = "string",
                            Format = "binary",
                            Description = GetFileDescription(property)
                        };
                    }
                }
            }
        }

        // Add file upload specific information to the operation
        if (operation.Summary?.Contains("upload", StringComparison.OrdinalIgnoreCase) == true ||
            operation.OperationId?.Contains("upload", StringComparison.OrdinalIgnoreCase) == true)
        {
            operation.Description += "\n\nSupported file formats: MP3, WAV, M4A, FLAC, OGG\nMaximum file size: 500MB";
        }
    }

    private static string GetFileDescription(PropertyInfo property)
    {
        var description = "File upload";

        if (property.Name.Contains("Audio", StringComparison.OrdinalIgnoreCase))
        {
            description = "Audio file for transcription (MP3, WAV, M4A, FLAC, OGG)";
        }

        return description;
    }
}
