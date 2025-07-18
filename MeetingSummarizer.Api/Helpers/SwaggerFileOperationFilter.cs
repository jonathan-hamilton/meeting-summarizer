using Microsoft.OpenApi.Models;
using Swashbuckle.AspNetCore.SwaggerGen;

namespace MeetingSummarizer.Api.Helpers;

/// <summary>
/// Swagger operation filter to enable file upload support in Swagger UI
/// </summary>
public class SwaggerFileOperationFilter : IOperationFilter
{
    public void Apply(OpenApiOperation operation, OperationFilterContext context)
    {
        // This will be enhanced in future increments to handle file upload operations
        // For now, it's just a placeholder to satisfy the dependency
    }
}
