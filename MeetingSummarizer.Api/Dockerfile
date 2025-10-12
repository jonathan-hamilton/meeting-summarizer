# Multi-stage Dockerfile for .NET 8.0 API
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS base
WORKDIR /app
EXPOSE 8080

# Create non-root user for security
RUN adduser --disabled-password --gecos '' appuser

FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Copy project files and restore dependencies
COPY ["MeetingSummarizer.Api/MeetingSummarizer.Api.csproj", "MeetingSummarizer.Api/"]
COPY ["MeetingSummarizer.Api.Tests/MeetingSummarizer.Api.Tests.csproj", "MeetingSummarizer.Api.Tests/"]
RUN dotnet restore "MeetingSummarizer.Api/MeetingSummarizer.Api.csproj"

# Copy source code and build
COPY . .
WORKDIR "/src/MeetingSummarizer.Api"
RUN dotnet build "MeetingSummarizer.Api.csproj" -c Release -o /app/build

FROM build AS publish
RUN dotnet publish "MeetingSummarizer.Api.csproj" -c Release -o /app/publish /p:UseAppHost=false

FROM base AS final
WORKDIR /app

# Copy published application
COPY --from=publish /app/publish .

# Switch to non-root user
USER appuser

# Set environment variables for container
ENV ASPNETCORE_URLS=http://+:8080
ENV ASPNETCORE_ENVIRONMENT=Production

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:8080/health || exit 1

ENTRYPOINT ["dotnet", "MeetingSummarizer.Api.dll"]