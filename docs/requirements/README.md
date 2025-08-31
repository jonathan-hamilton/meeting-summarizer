# Meeting Summarizer Requirements Documentation

This directory contains the complete requirements specification for the Meeting Summarizer application, organized by functional area for better maintainability and navigation.

## Recent Updates (August 31, 2025)

### S5.2 Action Item Management & Email Enhancements
- **43 New Requirements Added** across 4 modular files
- **Action Item Management**: REQ-ACTMGMT-45, REQ-ACTMGMT-46 (UI layout specifications)
- **Email Communication**: REQ-EMAIL-29 through REQ-EMAIL-43 (enhanced recipient management, content editing, demo mode support)
- **Demo Mode**: REQ-DEMO-22 through REQ-DEMO-26 (tour step management and visual styling)
- **AI Summarization**: REQ-AI-SUM-16 through REQ-AI-SUM-20 (mode-aware summary generation)

## Requirements Structure

### Core Functional Requirements
- **[Audio Processing & Transcription](./audio-transcription.md)** - Audio file handling, transcription services, speaker diarization
- **[Speaker Management](./speaker-management.md)** - Speaker identification, mapping, CRUD operations
- **[AI Services & Summarization](./ai-summarization.md)** - AI-powered summary generation, action item extraction
- **[Action Item Management](./action-item-management.md)** - CRUD operations, drag & drop, assignment features

### User Experience & Interface
- **[Demo Mode & Tour System](./demo-mode.md)** - Demo experience, guided tours, user onboarding
- **[User Management & Authentication](./user-management.md)** - Authentication, user modes, routing
- **[Email & Communication](./email-communication.md)** - Email sharing, notifications, delivery

### Business & Infrastructure
- **[Payment & Monetization](./payment-monetization.md)** - Payment processing, token management, billing
- **[Azure Services & Infrastructure](./azure-infrastructure.md)** - Cloud storage, databases, service integration
- **[Multi-Language Support](./multi-language.md)** - Internationalization, language detection, localization

### Quality & Compliance
- **[Non-Functional Requirements](./non-functional.md)** - Performance, security, reliability, scalability
- **[Accessibility & Compliance](./accessibility.md)** - WCAG compliance, assistive technology support
- **[Testing & Quality Assurance](./testing-qa.md)** - Test coverage, validation, quality metrics

## Quick Reference

### Requirement ID Prefixes
- `REQ-AUD-*` - Audio Processing
- `REQ-TRN-*` - Transcription
- `REQ-SPK-*` - Speaker Management
- `REQ-AI-SUM-*` - AI Summarization
- `REQ-ACTMGMT-*` - Action Item Management
- `REQ-DEMO-*` - Demo Mode
- `REQ-USER-*` - User Management
- `REQ-EMAIL-*` - Email & Communication
- `REQ-PAY-*` - Payment & Monetization
- `REQ-AZURE-*` - Azure Services
- `REQ-LANG-*` - Multi-Language Support
- `REQ-NFR-*` - Non-Functional Requirements
- `REQ-ACC-*` - Accessibility
- `REQ-TST-*` - Testing

### Key Dependencies
- **FFmpeg** - Required for audio format conversion (REQ-FPO-2)
- **Azure Speech Services** - Primary transcription provider
- **OpenAI Services** - Fallback transcription and AI summarization
- **Stripe** - Payment processing integration
- **Material-UI** - UI component framework with accessibility support

## Implementation Roadmap

### Phase 1: Core Functionality ✅
- Basic transcription with manual speaker mapping
- Speaker role assignment interface
- AI-powered summarization

### Phase 1.5: Enhanced Speaker Management ✅
- Manual speaker addition and removal capabilities
- Enhanced speaker mapping interface with full CRUD operations
- Audit trail for speaker management actions

### Phase 1.8: Foundation Test Coverage 🔄
- Comprehensive test coverage for state management
- Session management testing with privacy controls
- Performance optimization validation

### Phase 2: Demo Experience & Action Management 🔄
- Complete demo mode with guided tour system
- Action item CRUD with drag & drop functionality
- Enhanced user onboarding experience

### Phase 3: Production Infrastructure
- User authentication and payment processing
- Azure storage and persistent data management
- Multi-language support and accessibility compliance

### Phase 4: Advanced Features
- Voice fingerprinting for speaker recognition
- Calendar system integration
- Machine learning improvements

## Getting Started

1. **For New Developers**: Start with [Demo Mode & Tour System](./demo-mode.md) to understand the user experience
2. **For Backend Developers**: Review [Audio Processing & Transcription](./audio-transcription.md) and [Azure Infrastructure](./azure-infrastructure.md)
3. **For Frontend Developers**: Focus on [Speaker Management](./speaker-management.md) and [Action Item Management](./action-item-management.md)
4. **For DevOps/Infrastructure**: Examine [Azure Services](./azure-infrastructure.md) and [Non-Functional Requirements](./non-functional.md)

## Maintenance Notes

- Each requirements file should be kept under 500 lines for maintainability
- Cross-references between files use relative links
- All requirement IDs are unique across the entire system
- Update the main [Requirements Roadmap](../requirements-analysis-roadmap.md) when adding new requirements
