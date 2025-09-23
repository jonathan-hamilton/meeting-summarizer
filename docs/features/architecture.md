# MeetingSummarizer Architecture

## System Overview

**MeetingSummarizer** is a full-stack application built with .NET 9 Web API backend and React/TypeScript frontend that enables users to upload meeting audio files, which are then transcribed and summarized using OpenAI services. The system is designed to return either a full transcript or a concise natural-language summary, with optional role-based insights in future versions.

The app is structured for modularity and extensibility using **established design patterns** documented in [`docs/architecture/design-patterns.md`](../architecture/design-patterns.md). The backend follows service layer patterns with dependency injection, while the frontend uses factory patterns for API services and Zustand for state management. All development must adhere to these architectural standards.

## Design Pattern Implementation

**🏗️ ARCHITECTURAL FOUNDATION**: This system implements mandatory design patterns that ensure consistency, testability, and maintainability across all development work.

**Key Patterns:**
- **Backend**: Service Layer, Repository (EF), Dependency Injection, Composite, Adapter
- **Frontend**: Factory (API services), State Management (Zustand), Provider (React Context), Lazy Loading
- **Security**: Attribute-based authorization, Token-based authentication
- **Testing**: Universal providers, Factory mocks, Store testing patterns

**Pattern Enforcement:** All new development must validate pattern compliance in implementation plans and code reviews. See [`design-patterns.md`](../architecture/design-patterns.md) for complete standards and enforcement procedures.

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

- **Technology Stack**: React 19.1.0 with TypeScript 5.8.3 for type safety and modern development
- **Architecture**: Single Page Application (SPA) consuming the .NET Web API
- **Build Tools**: Vite 7.0.4 for fast development and optimized production builds
- **Styling**: Material-UI 7.2.0 for consistent, professional React components
- **State Management**: Zustand 5.0.2 for lightweight, scalable state management
- **API Integration**: Axios for REST API communication with the backend
- **File Upload**: Material-UI dropzone component for drag-and-drop audio file uploads
- **Performance Optimization**: React.lazy() with Suspense for code splitting and lazy loading
- **Bundle Analysis**: rollup-plugin-visualizer for ongoing performance monitoring
- **Accessibility**: WCAG AA compliant with comprehensive ARIA attributes and semantic HTML

#### Performance Architecture

**Lazy Loading Strategy**: 
- Critical dialogs (EmailCompositionDialog, SpeakerMappingDialog) implement React.lazy() for on-demand loading
- Suspense boundaries provide skeleton loading states during component loading
- Main bundle reduced by 52.4% (1,712kB → 814kB) through strategic code splitting

**Component Loading Pattern**:
```typescript
// Lazy loading with named imports
const EmailCompositionDialog = React.lazy(() => import("./EmailCompositionDialog"));

// Suspense wrapper with skeleton fallback
<Suspense fallback={<Skeleton variant="rectangular" height={600} />}>
  <EmailCompositionDialog />
</Suspense>
```

**Bundle Structure** (Post S5.3 Optimization):
- **Main Bundle**: 814.37 kB (254.24 kB gzipped) - Core application
- **EmailCompositionDialog**: 863.21 kB (301.08 kB gzipped) - Lazy loaded
- **SpeakerMappingDialog**: 14.31 kB (5.13 kB gzipped) - Lazy loaded
- **Additional Dialogs**: ~25 kB total - Various lazy-loaded components

#### Accessibility Architecture

**WCAG AA Compliance Strategy**:
- All disabled interactive elements wrapped in `<span>` for proper tooltip accessibility
- Comprehensive ARIA labeling with `aria-label` and `aria-describedby` attributes
- Semantic HTML structure using proper landmarks (`main`, `section`, `header`)
- Screen reader optimization with descriptive labels and logical heading hierarchy
- Keyboard navigation support for all interactive elements
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

The storage layer will be implemented in **Sprint 6** to provide persistent user data and meeting history with Azure cloud infrastructure.

---

## Sprint 6: Azure Storage Architecture + Production Hosting (Infrastructure Complete ✅)

### Modern Terraform Infrastructure Foundation

**September 7, 2025 - Infrastructure as Code Complete ✅:**
- ✅ **Modular Terraform Architecture**: Complete migration from Bicep with 5 dedicated modules
- ✅ **Multi-Environment Support**: Development, Staging, Production configurations with automated deployment
- ✅ **Security Framework**: Key Vault integration, network restrictions, environment-specific security controls
- ✅ **Deployment Automation**: PowerShell/Bash scripts with validation and comprehensive error handling
- ✅ **Cost Optimization**: Environment-appropriate resource sizing and storage lifecycle policies

### Azure Production Hosting Infrastructure

**Azure App Service Configuration** (Terraform Module: `app-service`):
- **Backend Hosting**: .NET 9 Web API deployed to Azure App Service (Linux)
- **Frontend Hosting**: React SPA deployed to Azure Static Web Apps or App Service
- **Scaling**: Environment-specific SKUs (B1 for dev, P1v3 for production)
- **SSL/TLS**: Custom domain with Azure-managed SSL certificates
- **Environment**: Production configuration with automated secret injection from Key Vault

**Azure Key Vault Integration** (Terraform Module: `key-vault`):
- **API Keys**: Secure storage for OpenAI, Azure Speech Services, SendGrid keys
- **Connection Strings**: Database and storage account connection strings automatically stored
- **Secrets Management**: Automated secret provisioning during infrastructure deployment
- **Configuration**: Environment-specific settings with RBAC and network access controls

**Infrastructure Modules**:
- **`cognitive-services/`**: Azure Speech Services with environment-appropriate SKUs (F0 for dev, S0 for prod)
- **`sql-database/`**: Azure SQL Server and Database with firewall rules and connection string management
- **`storage/`**: Azure Storage Account with blob containers, lifecycle policies, and cost-optimized replication
- **`key-vault/`**: Centralized secrets management with access policies and automated secret provisioning
- **`app-service/`**: App Service Plan and Linux Web App with environment-specific configurations

**Deployment Ready**: Complete infrastructure can be deployed with `./deploy.ps1` script and `terraform.tfvars` configuration.

**CI/CD Pipeline (GitHub Actions)**:
- **Automated Deployment**: Push to main branch triggers production deployment
- **Build Process**: .NET build, React build, automated testing, deployment
- **Environment Management**: Staging and production environment separation
- **Monitoring**: Application Insights integration for telemetry and error tracking

### Production Monitoring & Observability

**Azure Application Insights Integration**:
- **Performance Monitoring**: API response times, throughput, dependency tracking
- **Custom Telemetry**: Audio processing metrics (file size, duration, success rate)
- **Business Metrics**: Token usage, user activity, storage consumption, revenue tracking
- **Error Tracking**: Exception logging with stack traces and correlation IDs
- **Dependency Monitoring**: Azure Speech Services, OpenAI API, database performance

**Real-time Dashboards & Alerting**:
- **System Health Dashboard**: Overall application status, service availability, error rates
- **Business Metrics Dashboard**: Daily/weekly processing volume, user growth, token consumption
- **Performance Dashboard**: Response times, throughput, resource utilization
- **Critical Alerts**: API failures, storage quota warnings, high error rates, cost threshold breaches
- **User Experience Alerts**: Slow page loads, processing timeouts, authentication failures

**Structured Logging Strategy**:
- **Correlation IDs**: Track requests across all services for troubleshooting
- **Business Event Logging**: File uploads, transcription starts/completions, token purchases
- **Security Logging**: Authentication events, suspicious activity, access patterns
- **Performance Logging**: Processing times, memory usage, API call metrics
- **Integration Logging**: Azure Speech Services calls, OpenAI API usage, database operations

**Cost & Resource Monitoring**:
- **Azure Cost Alerts**: Daily/monthly spending thresholds with automatic notifications
- **Storage Usage Tracking**: Blob storage consumption per user and aggregate
- **Compute Resource Monitoring**: App Service CPU/memory usage with auto-scaling triggers
- **AI Service Usage**: Azure Speech Services and OpenAI token consumption tracking

### Persistent Data Infrastructure

**Azure Blob Storage Configuration**:
- **Hot Tier**: Recent meetings (0-30 days) for immediate access
- **Cool Tier**: Older meetings (30-180 days) for cost optimization  
- **Archive Tier**: Long-term storage (180-365 days) for maximum cost efficiency
- **Security**: Azure AD authentication with least-privilege access per user
- **Encryption**: At rest and in transit for all user data

**Azure Database Architecture**:
- **Service**: Azure SQL Database or Cosmos DB for metadata
- **User Data**: Account information, token balances, meeting metadata
- **Meeting History**: File references, transcription status, processing timestamps
- **Storage Mapping**: Logical isolation per user account for data security

### Token-Based Pricing Integration

**Cost Recovery Strategy**:
- **Storage Cost**: ~$0.15/month per typical user (60-80MB meetings)  
- **Token Pricing**: 10-15% increase covers full storage costs (~$3.30 for 60min meeting + 365-day storage)
- **Value Proposition**: "Your meetings stored safely for 365 days" included with token purchase
- **Competitive Advantage**: Industry-standard retention comparable to Otter.ai, Zoom

**Automated Storage Management**:
- **Tier Migration**: Automated Hot→Cool→Archive based on access patterns
- **Cleanup Jobs**: 30-day deletion warnings, automated removal after 365 days
- **Cost Monitoring**: Usage tracking and cost alerts for operational visibility

### Data Retention Policy

**User Data Lifecycle**:
- **Demo Users**: No persistent storage (current behavior maintained)
- **Paid Users**: 365-day retention with automatic tier optimization
- **Deletion Process**: GDPR-compliant with user export/deletion capabilities
- **Audit Logging**: All storage operations logged for compliance

---

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

### Deployment (Production Ready - Sprint 6)

- **Azure App Service**: Production hosting for .NET 9 Web API backend with Linux containers
- **Azure Static Web Apps**: Optimized React frontend hosting with global CDN
- **Azure Key Vault**: Secure storage for OpenAI API keys, database connections, and secrets
- **Azure Storage**: Blob storage for uploaded audio files with automated tier management
- **Azure Application Insights**: Real-time monitoring, logging, and performance telemetry
- **Custom Domain**: Professional domain setup (meeting-summary.io) with SSL certificates
- **GitHub Actions**: Automated CI/CD pipeline for continuous deployment

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

---

## Development Guidelines

### State Management Standards

**Primary Directive**: Use Zustand for all state management needs across the application.

- **Local Component State**: Avoid React `useState` and `useReducer` for any state that might be shared or persisted
- **Global State**: All application state must use Zustand stores
- **Store Organization**: Create dedicated stores for feature domains (e.g., `useEmailStore`, `useTourStore`, `useTranscriptStore`)
- **State Persistence**: Use Zustand's persist middleware for data that should survive page refreshes

**Pattern Examples**:
```typescript
// ✅ CORRECT: Use Zustand store
const useEmailStore = create<EmailState>((set) => ({
  isDialogOpen: false,
  openDialog: () => set({ isDialogOpen: true }),
  closeDialog: () => set({ isDialogOpen: false })
}));

// ❌ INCORRECT: Avoid local React state
const [isDialogOpen, setIsDialogOpen] = useState(false);
```

**Rationale**: Zustand provides:
- Predictable state management without React context complexity
- Better debugging and state inspection capabilities  
- Easier state sharing between components
- Consistent patterns across the entire application
- Reduced prop drilling and cleaner component interfaces

### Code Organization Standards

- **Component Structure**: Keep components focused and use Zustand stores for state management
- **Store Location**: Place stores in `src/stores/` directory with descriptive names
- **Type Safety**: All stores must be fully typed with TypeScript interfaces

---

## Development Guidelines

### State Management Standards

**Primary Directive**: Use Zustand for all state management needs across the application.

- **Local Component State**: Avoid React `useState` and `useReducer` for any state that might be shared or persisted
- **Global State**: All application state must use Zustand stores
- **Store Organization**: Create dedicated stores for feature domains (e.g., `useEmailStore`, `useTourStore`, `useTranscriptStore`)
- **State Persistence**: Use Zustand's persist middleware for data that should survive page refreshes

**Pattern Examples**:
```typescript
// ✅ CORRECT: Use Zustand store
const useEmailStore = create<EmailState>((set) => ({
  isDialogOpen: false,
  openDialog: () => set({ isDialogOpen: true }),
  closeDialog: () => set({ isDialogOpen: false })
}));

// ❌ INCORRECT: Avoid local React state
const [isDialogOpen, setIsDialogOpen] = useState(false);
```

**Rationale**: Zustand provides:
- Predictable state management without React context complexity
- Better debugging and state inspection capabilities  
- Easier state sharing between components
- Consistent patterns across the entire application
- Reduced prop drilling and cleaner component interfaces

### Code Organization Standards

- **Component Structure**: Keep components focused and use Zustand stores for state management
- **Store Location**: Place stores in `src/stores/` directory with descriptive names
- **Type Safety**: All stores must be fully typed with TypeScript interfaces
