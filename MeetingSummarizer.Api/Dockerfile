# Multi-stage Dockerfile for .NET 9.0 API with React frontend
FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS base
WORKDIR /app
EXPOSE 8080

# Create non-root user for security
RUN adduser --disabled-password --gecos '' appuser

# Build stage with both .NET SDK and Node.js
FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src

# Install Node.js 20.x for frontend build
RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y nodejs

# Copy project files and restore dependencies
COPY ["MeetingSummarizer.Api/MeetingSummarizer.Api.csproj", "MeetingSummarizer.Api/"]
COPY ["MeetingSummarizer.Api.Tests/MeetingSummarizer.Api.Tests.csproj", "MeetingSummarizer.Api.Tests/"]
RUN dotnet restore "MeetingSummarizer.Api/MeetingSummarizer.Api.csproj"

# Copy all source code
COPY . .

# Build frontend first
WORKDIR "/src/frontend"
RUN npm ci && npm run build

# Build backend
WORKDIR "/src/MeetingSummarizer.Api"
RUN dotnet build "MeetingSummarizer.Api.csproj" -c Release -o /app/build

# Copy frontend build output to wwwroot
RUN mkdir -p /app/build/wwwroot && cp -r /src/frontend/dist/* /app/build/wwwroot/

FROM build AS publish
RUN dotnet publish "MeetingSummarizer.Api.csproj" -c Release -o /app/publish /p:UseAppHost=false

# Copy frontend build output to publish directory
RUN mkdir -p /app/publish/wwwroot && cp -r /src/frontend/dist/* /app/publish/wwwroot/

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