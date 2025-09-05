# MeetingSummarizer Architecture

## System Overview

**MeetingSummarizer** is a full-stack application built with .NET 9 Web API backend and React/TypeScript frontend that enables users to upload meeting audio files, which are then transcribed and summarized using OpenAI services. The system is designed to return either a full transcript or a concise natural-language summary, with optional role-based insights in future versions.

The app is structured for modularity and extensibility. It includes endpoints for uploading files, triggering transcription via OpenAI Whisper, and summarizing content via GPT-4. Speaker diarization is used to label speakers in the transcript, and users can map these labels to real names and roles after the meeting. This role metadata can be used to generate personalized summaries in future iterations.

---

## Key Components

### Backend API (.NET 9)

#### Controllers

- `SummaryController.cs`:
  Exposes endpoints for uploading audio files, triggering transcription (`/api/summary/transcribe`), and sending transcripts for summarization (`/api/summary/summarize`).

#### Services

- `TranscriptionService.cs`:
  Handles sending audio files to OpenAI Whisper using the `CreateTranscriptionTextAsync` method from the OpenAI-DotNet SDK.

- *(Future)* `SummarizationService.cs`:
  Will send transcript text to GPT-4 and return a concise summary.

#### Models

- `TranscribeRequest.cs`:
  Wraps the uploaded `IFormFile` for use in the API.

- *(Future)* `SummarizeRequest.cs`:
  Will include the raw transcript and (optionally) speaker-role mapping.

#### Helpers

- `SwaggerFileOperationFilter.cs`:
  Ensures file upload support is enabled in Swagger UI for local development and testing.

### Frontend Application

- **Technology Stack**: React with TypeScript for type safety and modern development
- **Architecture**: Single Page Application (SPA) consuming the .NET Web API
- **Build Tools**: Vite for fast development and build process
- **Styling**: Material-UI (MUI) for consistent, professional React components
- **State Management**: React hooks and context for simple state, potentially Redux Toolkit for complex state
- **API Integration**: Axios for REST API communication with the backend
- **File Upload**: Material-UI dropzone component for drag-and-drop audio file uploads
- **Real-time Updates**: WebSocket or polling for transcription progress updates
- **Theme**: MUI theming system for consistent design and dark/light mode support

### OpenAI Integration

- Uses [OpenAI-DotNet](https://github.com/betalgo/openai) SDK.
- Configured to pull the API key from `appsettings.json` or environment variables.
- Currently uses Whisper for transcription.
- Future: Will use GPT-4 for summarization via chat completions.

### Speaker Role Mapping Implementation

- MVP: user manually maps diarized speaker labels (e.g., "Speaker 1") to actual names/roles post-transcription.
- This mapping will be injected into the transcript before summarization.

### (Future) Storage Layer

- Optional SQLite or Postgres integration.
- Will store: transcript text, mapped roles, summary, filename, timestamp.
- Enables `/api/summary/history` endpoint for past meetings.

### (Future) Authentication & Authorization

- Role-based access control (RBAC) to restrict transcript visibility.
- Identity provider or simple token-based system (to be defined).

---

## Data Flow

### 1. Audio Upload

- **Endpoint:** `POST /api/summary/transcribe`
- **Input:** An audio file (`.mp3`, `.wav`, etc.) uploaded via multipart/form-data.
- **Action:** Passed to `TranscriptionService`, which uses OpenAI Whisper with speaker diarization enabled.

### 2. Transcription Processing

- **Backend:** Audio file is sent to OpenAI Whisper API.
- **Output:** Returns a transcript with speaker labels like "Speaker 1", "Speaker 2", etc.
- **Response:** Raw transcript text is returned to the frontend.

### 3. Speaker Role Mapping

- **Frontend:** User reviews the transcript and assigns real names/roles to each speaker.
- **Input:** `{ "Speaker 1": "John (Manager)", "Speaker 2": "Sarah (Developer)" }`

### 4. Summarization

- **Endpoint:** `POST /api/summary/summarize`
- **Input:** Transcript + optional speaker-role mapping.
- **Backend:** Text is sent to GPT-4 with a prompt to generate a concise summary.
- **Output:** A structured summary highlighting key points, decisions, and action items.

### 5. Future: Persistent Storage

- Transcripts, mappings, and summaries will be stored for historical access.
- Users can retrieve past meetings via `/api/summary/history`.

---

## Technology Stack

### Backend

- **.NET 9 Web API**: Modern ASP.NET Core framework with minimal APIs
- **OpenAI-DotNet SDK**: Official .NET SDK for OpenAI API integration
- **Swagger/OpenAPI**: API documentation and testing interface
- **File Upload Support**: Multipart form data handling for audio files

### Frontend

- **React 18**: Modern React with concurrent features
- **TypeScript**: Type safety and enhanced developer experience
- **Vite**: Fast build tool and development server
- **Material-UI (MUI)**: React component library with theming
- **Axios**: HTTP client for API communication

### AI Services

- **OpenAI Whisper**: Speech-to-text transcription with speaker diarization
- **OpenAI GPT-4**: Natural language summarization and analysis

### Development Tools

- **VS Code**: Primary development environment
- **Git**: Version control
- **ESLint/Prettier**: Code formatting and linting for frontend

### Deployment (Future)

- **Azure App Service**: Hosting for both backend and frontend
- **Azure Key Vault**: Secure storage for OpenAI API keys
- **Azure Storage**: File storage for uploaded audio files

---

## API Endpoints

### Current Endpoints

#### `POST /api/summary/transcribe`

- **Purpose**: Upload audio file and get transcription
- **Input**: Multipart form data with audio file
- **Output**: JSON with transcript text and speaker labels
- **Processing**: Uses OpenAI Whisper with speaker diarization

#### `GET /api/health`

- **Purpose**: Health check endpoint
- **Output**: API status and version information

### Future Endpoints

#### `POST /api/summary/summarize`

- **Purpose**: Generate summary from transcript
- **Input**: JSON with transcript and optional speaker mapping
- **Output**: Structured summary with key points and action items

#### `GET /api/summary/history`

- **Purpose**: Retrieve past meeting summaries
- **Output**: List of historical transcripts and summaries

#### `POST /api/summary/speaker-mapping`

- **Purpose**: Save speaker role mappings for future use
- **Input**: Speaker label to name/role mappings

---

## Security Considerations

### API Security

- **CORS**: Configured for frontend domain access
- **File Validation**: Audio file type and size restrictions
- **Rate Limiting**: Prevent API abuse (future implementation)

### Data Privacy

- **Audio Files**: Temporary storage, deleted after processing
- **Transcripts**: Encrypted at rest (future implementation)
- **API Keys**: Stored securely in configuration/environment variables

### Future Security Features

- **Authentication**: User login and session management
- **Authorization**: Role-based access to transcripts
- **Audit Logging**: Track who accessed which transcripts
