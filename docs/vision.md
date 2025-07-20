# Meeting Summarizer - Vision Statement

We are building **MeetingSummarizer**, a modern web application that automates the transcription and summarization of meeting audio. The goal is to help users extract **clear summaries and actionable takeaways**, without replaying or reviewing full meeting recordings.

This project serves as a learning and prototyping tool for exploring how AI can be applied in software development workflows and product design. The goal is to create something useful, extensible, and potentially monetizable — while keeping MVP costs to a minimum.

## 🧠 Mission

To reduce meeting fatigue and information overload by using AI to deliver both full transcripts and **concise, role-relevant summaries** — with the potential to deliver personalized action items by email.

---

## ✅ Sprint 1 Completed Features (PRODUCTION READY)

- ✅ **Audio Transcription**: Real-time transcription using OpenAI Whisper API with speaker diarization
- ✅ **File Upload Interface**: Professional drag & drop with progress tracking and validation
- ✅ **Transcript Display**: Real-time display with color-coded speakers and copy functionality
- ✅ **Production Configuration**: Secure API key management, error handling, and retry logic
- ✅ **Mock Service Fallback**: Automatic fallback for development without API costs
- ✅ **Full-Stack Integration**: Complete workflow from upload to transcript display
- ✅ **Comprehensive Testing**: Demo interface and unit tests for all components

## 🔑 Core Capabilities (MVP Complete)

- Upload audio files (e.g., `.mp3`, `.wav`, `.m4a`) via drag & drop interface
- Transcribe the audio using **OpenAI Whisper** with **speaker diarization enabled**
- Display real-time transcript labeled with generic speakers (e.g., "Speaker 1", "Speaker 2")
- Full-stack React frontend with Material-UI components
- .NET 9 Web API backend with **Swagger UI** for testing
- Production-ready error handling and retry logic
- Secure configuration management with User Secrets

> Sprint 1 delivers a fully functional transcription application that can be used immediately for meeting transcription with minimal setup and cost-effective operation using OpenAI's pay-per-use pricing.

---

## � Sprint 2 Planned Capabilities

- **Speaker Role Assignment**: Allow users to map speaker labels to names/roles post-meeting
- **AI-Powered Summarization**: Submit labeled transcripts to generate concise summaries using **GPT-4**
- **Summary Display & Export**: Professional summary interface with export options
- **Enhanced UI/UX**: Advanced features and improved user experience

## 🎯 Future Capabilities (Sprint 3+)

- Automatically infer roles based on language and interaction context
- Deliver **personalized summaries and action items by email** to each participant based on mapped roles
- Store transcript metadata (e.g., filename, timestamp, mapped roles) in a database
- Retrieve historical transcripts and summaries via API endpoints
- Add webhook support for asynchronous transcription/summarization jobs
- Support for multi-language transcription and role-based access control (RBAC)
- Explore voice ID or advanced diarization for auto-role mapping (optional, long-term)

---

## 🧱️ Technical Overview

- Built with **.NET 9 Web API** backend and **React TypeScript** frontend
- Audio file uploads handled via modern drag & drop interface
- Integrated with **OpenAI Whisper** and **GPT-4** via OpenAI SDK
- Production-ready error handling with exponential backoff retry logic
- Secure API key management via User Secrets and environment variables
- Material-UI components with responsive design and theme support
- Comprehensive testing with demo interfaces and unit tests
- Deployable locally or to cloud platforms like **Azure**, **Render**, or **Railway**

---

## 🎯 Design Goals

- Handle real-world meetings with overlapping conversation and multiple speakers
- Keep latency reasonable for typical meeting lengths (15-60 minutes)
- Summaries are clear, readable, and actionable
- Modular architecture to support future capabilities like personalization and storage
- Cost-effective operation with transparent pricing (~$0.006/minute for transcription)
- Professional user experience suitable for business use
