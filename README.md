# Meeting Summarizer 🎤📝

A modern web application for transcribing and summarizing meeting audio using OpenAI's Whisper API and GPT models.

## ✅ Current Status - Sprint 1 COMPLETE

### 🚀 **Production Ready Features**

- **Audio Transcription**: Real-time transcription using OpenAI Whisper API
- **Speaker Diarization**: Automatic speaker identification and segmentation
- **File Upload**: Drag & drop interface with progress tracking
- **Real-time Display**: Live transcript display with speaker labels
- **Production Configuration**: Secure API key management and error handling

### 📊 **Sprint 1 Achievements**

- ✅ **S1.1**: Audio Transcription Backend Service (OpenAI + Mock fallback)
- ✅ **S1.2**: Frontend Transcript Display Component
- ✅ **S1.3**: Integrate File Upload with Transcription Workflow
- ✅ **S1.4**: OpenAI API Integration and Production Configuration

## 🏗️ Architecture

### Backend (.NET 9 Web API)

- **OpenAI Integration**: Production-ready Whisper API integration
- **Mock Fallback Service**: Automatic fallback for development/testing
- **Enhanced Error Handling**: Retry logic with exponential backoff
- **Secure Configuration**: User secrets and environment variable support
- **Comprehensive Logging**: Detailed operation tracking and monitoring

### Frontend (React + TypeScript + Vite)

- **Material-UI Components**: Professional UI with responsive design
- **File Upload**: Advanced drag & drop with progress indicators
- **Transcript Display**: Color-coded speakers with copy functionality
- **Demo Interface**: Comprehensive testing and validation tools
- **Theme Support**: Dark/light mode with system preference detection

## 🚀 Quick Start

### Prerequisites

- .NET 9 SDK
- Node.js 18+ with npm
- OpenAI API key (optional - falls back to mock service)

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

#### Option 2: Environment Variables

```bash
export OpenAI__ApiKey="sk-your-api-key-here"
```

#### Option 3: appsettings.json (Not recommended for production)

```json
{
  "OpenAI": {
    "ApiKey": "sk-your-api-key-here"
  }
}
```

### Mock Service Fallback

Without an OpenAI API key, the application automatically uses a mock transcription service that provides:

- Realistic speaker diarization simulation
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

- **S1.2 Testing**: TranscriptDisplay component validation
- **S1.3 Testing**: FileUpload integration testing
- **Error Scenarios**: Failed transcription handling
- **Loading States**: Processing indicators
- **Copy Functionality**: Text selection and clipboard operations

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
│   │   └── MockTranscriptionService.cs # Development fallback
│   ├── Models/                     # Data models
│   └── Configuration/              # Service configuration
├── frontend/                       # React Frontend
│   ├── src/
│   │   ├── components/             # React components
│   │   │   ├── FileUpload.tsx     # File upload interface
│   │   │   └── TranscriptDisplay.tsx # Transcript display
│   │   ├── demo/                   # Testing and demo tools
│   │   ├── services/               # API integration
│   │   └── __tests__/              # Unit tests
├── docs/                           # Documentation
└── sample-audio-files/             # Test audio files
```

## 🔮 Roadmap - Sprint 2

### Planned Features

- **S2.1**: Speaker Role Assignment and Management
- **S2.2**: AI-Powered Meeting Summarization (GPT-4)
- **S2.3**: Summary Display and Export
- **S2.4**: Enhanced UI/UX with Advanced Features

## 💰 Cost Considerations

### OpenAI API Pricing (Approximate)

- **Whisper API**: ~$0.006 per minute of audio
- **GPT-4o-mini**: ~$0.15 per 1M input tokens, ~$0.60 per 1M output tokens
- **Example**: 1-hour meeting ≈ $0.36 transcription + ~$0.10 summary = ~$0.46 total

### Cost Optimization

- Use mock service for development (zero cost)
- Efficient prompt engineering for summarization
- Configurable model selection (gpt-4o-mini vs gpt-4o)
- Request batching and caching strategies

## 🛡️ Security

- **API Key Management**: Secure storage using .NET User Secrets
- **Environment Variables**: Production-ready configuration
- **Input Validation**: Comprehensive file and request validation
- **Error Handling**: Secure error messages without sensitive data exposure

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
