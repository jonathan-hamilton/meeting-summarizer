# Project Scaffolding Stories for MeetingSummarizer API

## Story SC-001: Setup Core Web API Structure

**As a** developer
**I want to** establish the core Web API project structure with proper dependency injection and configuration
**So that** I have a solid foundation for building the meeting summarization backend services

### SC-001 Acceptance Criteria

- [x] .NET 9 Web API project structure matches architecture document
- [x] Dependency injection container configured for services
- [x] Swagger/OpenAPI documentation enabled with file upload support
- [x] Environment-based configuration setup (Development/Production)
- [x] Basic health check endpoint implemented
- [x] CORS configured for development with React frontend

### SC-001 Technical Notes

- Technology choices: .NET 9, ASP.NET Core, Swagger/OpenAPI
- Component structure: Backend/Controllers/, Backend/Services/, Backend/Models/, Backend/Helpers/ folders
- Configuration details: appsettings.json with nested OpenAI configuration
- Command examples: `dotnet run`, `dotnet build`, `dotnet test`

### SC-001 Definition of Done

- [x] Project runs successfully with `dotnet run`
- [x] Basic structure matches architecture document
- [x] Core dependencies installed (Microsoft.AspNetCore.OpenApi)
- [x] Swagger UI accessible at /swagger endpoint

---

## Story SC-002: Setup React/TypeScript Frontend Foundation

**As a** developer
**I want to** create a React/TypeScript frontend application with modern tooling
**So that** I have a user-friendly interface for the meeting summarization features

### SC-002 Acceptance Criteria

- [x] React + TypeScript project created with Vite
- [x] Material-UI (MUI) configured for styling and components
- [x] Basic project structure with components, services, types, theme folders
- [x] Axios configured for API communication with backend
- [x] Environment configuration for API base URL
- [x] Development server running with hot reload
- [x] MUI theme configuration with light/dark mode support

### SC-002 Technical Notes

- Technology choices: React 18, TypeScript, Vite, Material-UI (MUI), Axios
- Component structure: Frontend/src/components/, Frontend/src/services/, Frontend/src/types/, Frontend/src/theme/
- Configuration details: .env files for API endpoints, vite.config.ts, MUI theme setup
- Command examples: `npm create vite@latest`, `npm install @mui/material @emotion/react @emotion/styled`, `npm run dev`, `npm run build`

### SC-002 Definition of Done

- [x] Frontend project runs successfully with `npm run dev`
- [x] Basic structure matches architecture document
- [x] Core dependencies installed (React, TypeScript, Vite, MUI)
- [x] MUI components render correctly with theme
- [x] Can make test API calls to backend health endpoint

---

## Story SC-003: Implement OpenAI Integration Foundation

**As a** developer
**I want to** integrate the OpenAI-DotNet SDK with proper configuration management
**So that** I can connect to OpenAI services for transcription and future summarization

### SC-003 Acceptance Criteria

- [x] OpenAI-DotNet SDK installed and configured
- [x] Configuration supports appsettings.json and environment variables
- [x] OpenAI API key configuration with fallback hierarchy
- [x] Basic OpenAI client service registration in DI container
- [x] Error handling for missing or invalid API keys
- [x] Configuration validation on startup

### SC-003 Technical Notes

- Technology choices: OpenAI-DotNet SDK, IConfiguration, IOptions pattern
- Component structure: Backend/Services/IOpenAIService interface and implementation
- Configuration details: OpenAI__ApiKey in appsettings, environment variable support
- Command examples: `dotnet add package OpenAI-DotNet`

### SC-003 Definition of Done

- [x] Project runs successfully with OpenAI SDK integrated
- [x] Basic structure matches architecture for OpenAI integration
- [x] Core OpenAI dependencies installed and configured
- [x] Configuration validation passes on startup

---

## Story SC-004: Create File Upload Infrastructure (Backend + Frontend)

**As a** developer
**I want to** implement file upload infrastructure for both backend API and frontend UI
**So that** users can upload audio files for meeting transcription

### SC-004 Acceptance Criteria

- [ ] Backend: SummaryController created with file upload endpoint structure
- [ ] Backend: TranscribeRequest model implemented for file upload
- [ ] Backend: SwaggerFileOperationFilter helper for Swagger file upload UI
- [ ] Backend: File validation for supported audio formats (mp3, wav, m4a)
- [ ] Backend: File size validation (max 500MB as per requirements)
- [ ] Frontend: FileUpload component using MUI with drag-and-drop interface
- [ ] Frontend: MUI progress indicators for file upload (LinearProgress, CircularProgress)
- [ ] Frontend: File validation on client side with MUI error display
- [ ] Frontend: MUI cards and buttons for upload interface

### SC-004 Technical Notes

- Technology choices: ASP.NET Core file upload, IFormFile, Material-UI dropzone, MUI components, custom validation attributes
- Component structure: Backend/Controllers/SummaryController.cs, Backend/Models/TranscribeRequest.cs, Frontend/src/components/FileUpload.tsx
- Configuration details: File upload limits in appsettings.json, TypeScript types for API responses, MUI theme integration
- Command examples: Test with both Swagger UI and React frontend, `npm install react-dropzone @mui/icons-material`

### SC-004 Definition of Done

- [ ] Backend API accepts file uploads via multipart/form-data
- [ ] Frontend can upload files with MUI progress indication
- [ ] File validation works on both client and server with MUI error display
- [ ] MUI components provide consistent styling and user experience
- [ ] End-to-end file upload smoke test passes
