# OpenAI API Integration Setup Guide

## Overview

This guide covers setting up OpenAI API integration for the Meeting Summarizer application, including configuration, environment variables, and deployment considerations.

## Prerequisites

- OpenAI API account with credits/subscription
- API key from OpenAI platform
- Optional: Organization and Project IDs for better management

## Configuration Options

### 1. appsettings.json Configuration

```json
{
  "OpenAI": {
    "ApiKey": "your-api-key-here",
    "OrganizationId": "org-your-organization-id",
    "ProjectId": "proj_your-project-id",
    "DefaultTranscriptionModel": "whisper-1",
    "DefaultChatModel": "gpt-4o-mini",
    "TimeoutSeconds": 300,
    "MaxRetries": 3
  }
}
```

### 2. Environment Variables (Recommended for Production)

Set these environment variables in your deployment environment:

#### Required

- `OpenAI__ApiKey`: Your OpenAI API key

#### Optional

- `OpenAI__OrganizationId`: Your OpenAI organization ID
- `OpenAI__ProjectId`: Your OpenAI project ID
- `OpenAI__DefaultTranscriptionModel`: Transcription model (default: whisper-1)
- `OpenAI__DefaultChatModel`: Chat model (default: gpt-4o-mini)
- `OpenAI__TimeoutSeconds`: Request timeout in seconds (default: 300)
- `OpenAI__MaxRetries`: Maximum retry attempts (default: 3)

#### Example Environment Variable Setup

```bash
# PowerShell
$env:OpenAI__ApiKey = "sk-your-api-key-here"
$env:OpenAI__OrganizationId = "org-your-organization-id"
$env:OpenAI__ProjectId = "proj_your-project-id"

# Command Prompt
set OpenAI__ApiKey=sk-your-api-key-here
set OpenAI__OrganizationId=org-your-organization-id
set OpenAI__ProjectId=proj_your-project-id

# Docker Environment
OPENAI__APIKEY=sk-your-api-key-here
OPENAI__ORGANIZATIONID=org-your-organization-id
OPENAI__PROJECTID=proj_your-project-id
```

## Getting Your OpenAI Credentials

### 1. API Key

1. Visit [OpenAI Platform](https://platform.openai.com/api-keys)
2. Sign in to your account
3. Navigate to "API Keys" section
4. Click "Create new secret key"
5. Copy the generated key (starts with `sk-`)
6. Store securely - you won't be able to see it again

### 2. Organization ID (Optional)

1. Go to [Organization Settings](https://platform.openai.com/account/org-settings)
2. Copy the Organization ID (starts with `org-`)

### 3. Project ID (Optional)

1. Navigate to [Projects](https://platform.openai.com/settings/organization/projects)
2. Select or create a project
3. Copy the Project ID (starts with `proj_`)

## Model Options

### Transcription Models

- `whisper-1`: Standard Whisper model (recommended)

### Chat Models

- `gpt-4o-mini`: Fast, cost-effective model (recommended for most use cases)
- `gpt-4o`: More capable but slower and more expensive
- `gpt-3.5-turbo`: Budget option with good performance

## Production Deployment Checklist

### Security

- [ ] Never commit API keys to source control
- [ ] Use environment variables or secure key management
- [ ] Enable API key restrictions if available
- [ ] Monitor API usage and costs
- [ ] Set up billing alerts

### Configuration

- [ ] Configure appropriate timeout values
- [ ] Set reasonable retry limits
- [ ] Use production-appropriate models
- [ ] Enable detailed logging for monitoring
- [ ] Configure CORS for frontend integration

### Monitoring

- [ ] Monitor API response times
- [ ] Track error rates and retry attempts
- [ ] Monitor OpenAI usage and costs
- [ ] Set up alerts for service availability
- [ ] Log transcription and summarization metrics

## Cost Considerations

### Whisper API Pricing

- Charged per minute of audio processed
- Current rate: ~$0.006 per minute
- 1-hour meeting ≈ $0.36

### GPT API Pricing

- Charged per token (input + output)
- GPT-4o-mini: ~$0.15 per 1M input tokens, ~$0.60 per 1M output tokens
- Average meeting summary: ~500-1500 output tokens

### Cost Optimization Tips

1. Use gpt-4o-mini for summarization (cost-effective)
2. Optimize prompt length
3. Set reasonable max token limits
4. Monitor usage regularly
5. Consider batching requests if possible

## Troubleshooting

### Common Issues

#### API Key Not Working

- Verify key format (should start with `sk-`)
- Check key hasn't expired
- Ensure sufficient credits/active subscription
- Verify organization/project access

#### Timeout Errors

- Increase `TimeoutSeconds` configuration
- Check network connectivity
- Verify OpenAI service status

#### Rate Limiting

- Implement exponential backoff (already included)
- Consider upgrading OpenAI tier
- Spread requests over time

#### Model Not Available

- Verify model name spelling
- Check model availability in your region
- Ensure API tier has access to requested model

### Debug Commands

```bash
# Test API connectivity
curl -H "Authorization: Bearer $OPENAI_API_KEY" \
     -H "Content-Type: application/json" \
     https://api.openai.com/v1/models

# Check organization access
curl -H "Authorization: Bearer $OPENAI_API_KEY" \
     -H "OpenAI-Organization: $OPENAI_ORG_ID" \
     https://api.openai.com/v1/organizations
```

## Local Development Setup

### Option 1: User Secrets (Recommended)

```bash
dotnet user-secrets set "OpenAI:ApiKey" "sk-your-api-key-here"
dotnet user-secrets set "OpenAI:OrganizationId" "org-your-organization-id"
```

### Option 2: appsettings.Development.json

```json
{
  "OpenAI": {
    "ApiKey": "sk-your-api-key-here",
    "OrganizationId": "org-your-organization-id",
    "ProjectId": "proj_your-project-id"
  }
}
```

**Note:** Add `appsettings.Development.json` to `.gitignore`

### Option 3: Environment Variables

Set in your development environment or IDE configuration.

## Fallback Service

The application includes a mock transcription service that automatically activates when:

- No OpenAI API key is configured
- OpenAI service is unavailable
- API quota is exceeded

This enables development and testing without requiring OpenAI credits.

## Support

- [OpenAI Documentation](https://platform.openai.com/docs)
- [OpenAI Community Forum](https://community.openai.com/)
- [OpenAI API Status](https://status.openai.com/)
