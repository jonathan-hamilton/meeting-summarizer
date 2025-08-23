# Meeting Summarizer 🎤📝

A modern web application for transcribing and summarizing meeting audio using OpenAI's Whisper API and GPT models.

## ✅ Current Status - Sprint 3 COMPLETE ✅

### 🚀 **Production Ready Features**

- **Audio Transcription**: Real-time transcription using OpenAI Whisper API with up to 1GB file support
- **Speaker Diarization**: Automatic speaker identification and segmentation  
- **Speaker Management**: Complete CRUD operations with centralized state management
- **Session-Based Privacy**: Automatic data cleanup with 2-hour session timeout
- **AI-Powered Summaries**: GPT-4 meeting summarization with action item extraction
- **Email Sharing**: Professional email delivery with SendGrid integration
- **Advanced File Upload**: Drag & drop interface with progress tracking (supports up to 1GB files)
- **Real-time Display**: Live transcript display with speaker labels and segment editing
- **Privacy Controls**: Session status indicators with data size tracking and export options

### 📊 **Recent Achievements**

- ✅ **Sprint 1**: Complete audio transcription pipeline with OpenAI integration
- ✅ **Sprint 2**: Speaker role management and AI-powered meeting summarization  
- ✅ **S3.1**: Session-based speaker override system with automatic cleanup
- ✅ **S3.2**: Complete speaker CRUD interface with real-time validation
- ✅ **S3.3**: Segment-level speaker reassignment with confidence tracking
- ✅ **S3.4**: AI meeting summary generation with professional email sharing
- ✅ **S3.5**: Privacy communication and data controls with session management
- ✅ **S3.6**: State management redesign with bug fixes and UI improvements

## 🏗️ Architecture

### Backend (.NET 9 Web API)

- **OpenAI Integration**: Production-ready Whisper API and GPT-4 integration
- **Email Service**: SendGrid integration for professional meeting summary delivery
- **Session Management**: Automatic 2-hour session timeout with data cleanup
- **Mock Fallback Service**: Automatic fallback for development/testing
- **Enhanced Error Handling**: Retry logic with exponential backoff
- **File Support**: Up to 1GB audio file processing with robust validation
- **Secure Configuration**: User secrets and environment variable support
- **Comprehensive Logging**: Detailed operation tracking and monitoring

### Frontend (React + TypeScript + Vite)

- **Material-UI Components**: Professional UI with responsive design and dark/light themes
- **Advanced File Upload**: Drag & drop with progress indicators (1GB file support)
- **Speaker Management**: Complete CRUD interface for speaker role assignment
- **Session Privacy Controls**: Real-time session status with data size tracking
- **Transcript Display**: Color-coded speakers with copy functionality and segment editing
- **AI Summary Interface**: Meeting summary generation with action item extraction
- **Email Composition**: Professional email sharing with customizable recipients
- **Demo Interface**: Comprehensive testing and validation tools

## 🚀 Quick Start

### Prerequisites

- .NET 9 SDK
- Node.js 18+ with npm
- OpenAI API key (optional - falls back to mock service)
- SendGrid API key (optional - for email sharing features)

### 1. Clone and Setup

```bash
git clone https://github.com/jonathan-hamilton/meeting-summarizer.git
cd meeting-summarizer
```

### 2. Backend Setup

```bash
cd MeetingSummarizer.Api

# Configure OpenAI API key (optional)
dotnet user-secrets init
dotnet user-secrets set "OpenAI:ApiKey" "your-openai-api-key-here"

# Configure SendGrid for email sharing (optional)
dotnet user-secrets set "SendGrid:ApiKey" "your-sendgrid-api-key-here"

# Run the API
dotnet run
```

The API will be available at `http://localhost:5029`

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

The frontend will be available at `http://localhost:5173`

## 🔧 Configuration

### OpenAI API Setup

1. Get your API key from [OpenAI Platform](https://platform.openai.com/api-keys)
2. Configure using one of these methods:

#### Option 1: User Secrets (Recommended for development)

```bash
cd MeetingSummarizer.Api
dotnet user-secrets set "OpenAI:ApiKey" "sk-your-api-key-here"
```

### SendGrid Email Setup (Optional)

For email sharing functionality:

1. Create a SendGrid account at [SendGrid](https://sendgrid.com)
2. Generate an API key with Mail Send permissions
3. Configure using user secrets:

```bash
cd MeetingSummarizer.Api
dotnet user-secrets set "SendGrid:ApiKey" "SG.your-sendgrid-api-key-here"
```

#### Option 2: Environment Variables

```bash
export OpenAI__ApiKey="sk-your-api-key-here"
export SendGrid__ApiKey="SG.your-sendgrid-api-key-here"
```

#### Option 3: appsettings.json (Not recommended for production)

```json
{
  "OpenAI": {
    "ApiKey": "sk-your-api-key-here"
  },
  "SendGrid": {
    "ApiKey": "SG.your-sendgrid-api-key-here"
  }
}
```

### Mock Service Fallback

Without API keys, the application automatically uses mock services that provide:

- Realistic speaker diarization simulation (OpenAI Whisper mock)
- Simulated meeting summary generation (GPT-4 mock)
- Local email preview instead of sending (SendGrid mock)
- Consistent development experience
- Zero external dependencies
- Complete end-to-end workflow testing

## 🧪 Testing

### Frontend Testing

```bash
cd frontend
npm test                    # Run unit tests
npm run test:coverage      # Run with coverage report
```

### Demo Interface

Visit `/demo` in the frontend to access comprehensive testing tools:

- **Transcription Testing**: Complete file upload and transcription workflow
- **Speaker Management**: Speaker role assignment and editing validation
- **Summary Generation**: AI-powered meeting summary testing
- **Email Composition**: Email sharing interface validation
- **Error Scenarios**: Failed transcription and API error handling
- **Loading States**: Processing indicators and user feedback
- **Session Management**: Privacy controls and timeout testing

### API Testing

The API includes comprehensive integration testing:

- Real OpenAI API validation
- Mock service fallback testing
- Error handling and retry logic
- File upload and processing

## 📁 Project Structure

```text
meeting-summarizer/
├── MeetingSummarizer.Api/          # .NET Web API Backend
│   ├── Controllers/                # API endpoints
│   ├── Services/                   # Business logic
│   │   ├── OpenAIService.cs       # Production OpenAI integration
│   │   ├── SendGridEmailService.cs # Email delivery service
│   │   └── MockServices/           # Development fallback services
│   ├── Models/                     # Data models and DTOs
│   └── Configuration/              # Service configuration
├── frontend/                       # React Frontend
│   ├── src/
│   │   ├── components/             # React components
│   │   │   ├── FileUpload.tsx     # Advanced file upload interface
│   │   │   ├── TranscriptDisplay.tsx # Transcript display with editing
│   │   │   ├── SpeakerMapping.tsx # Speaker management interface
│   │   │   └── dialogs/            # Modal dialogs and confirmations
│   │   ├── stores/                 # Zustand state management
│   │   ├── services/               # API integration and session management
│   │   ├── demo/                   # Testing and demo tools
│   │   └── __tests__/              # Unit tests
├── docs/                           # Documentation
│   ├── sprints/                    # Sprint planning and progress
│   ├── technical-*.md              # Technical documentation
│   └── *.md                        # Setup guides and requirements
└── sample-audio-files/             # Test audio files
```

## 🔮 Roadmap - Sprint 4

### Planned Features

- **Azure Speech Services Integration**: Enhanced speaker diarization accuracy
- **Advanced Export Formats**: PDF, Word, and structured data exports
- **Performance Optimization**: Large file processing and concurrent session support
- **Security Enhancements**: Advanced authentication and audit logging

## 📚 Documentation

For detailed development information:

- **[Sprint Documentation](docs/sprints/)**: Detailed development progress and technical decisions
- **[Technical Improvements](docs/technical-improvements.md)**: Architecture enhancements and optimizations  
- **[Setup Guides](docs/)**: Comprehensive configuration and deployment guides

## 💰 Cost Considerations

### OpenAI API Pricing (Approximate)

- **Whisper API**: ~$0.006 per minute of audio
- **GPT-4o-mini**: ~$0.15 per 1M input tokens, ~$0.60 per 1M output tokens
- **Example**: 1-hour meeting ≈ $0.36 transcription + ~$0.10 summary = ~$0.46 total

### SendGrid Email Pricing

- **Free Tier**: 100 emails/day
- **Paid Plans**: Starting at $19.95/month for higher volumes

### Cost Optimization

- Use mock services for development (zero cost)
- Efficient prompt engineering for summarization
- Configurable model selection (gpt-4o-mini vs gpt-4o)
- Session-based data management reduces storage costs
- Request batching and caching strategies

## 🛡️ Security & Privacy

- **Session-Based Data**: 2-hour automatic cleanup, no persistent storage
- **API Key Management**: Secure storage using .NET User Secrets
- **Environment Variables**: Production-ready configuration
- **Input Validation**: Comprehensive file and request validation (up to 1GB files)
- **Error Handling**: Secure error messages without sensitive data exposure
- **Privacy Controls**: Real-time session status and data size monitoring

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Documentation**: See the `docs/` directory for detailed guides
- **Issues**: Report bugs and feature requests on GitHub Issues
- **Setup Guide**: `docs/openai-setup-guide.md` for detailed configuration
- **API Reference**: OpenAPI documentation available at `/swagger` when running the API

---

Built with ❤️ using .NET 9, React, TypeScript, and OpenAI
