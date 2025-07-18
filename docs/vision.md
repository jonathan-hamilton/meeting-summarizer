## Vision Statement

We are building **MeetingSummarizer**, a backend web API that automates the transcription and summarization of meeting audio. The goal is to help users extract **clear summaries and actionable takeaways**, without replaying or reviewing full meeting recordings.

This project serves as a learning and prototyping tool for exploring how AI can be applied in software development workflows and product design. The goal is to create something useful, extensible, and potentially monetizable — while keeping MVP costs to a minimum.

### 🧠 Mission

To reduce meeting fatigue and information overload by using AI to deliver both full transcripts and **concise, role-relevant summaries** — with the potential to deliver personalized action items by email.

---

### 🔑 Core Capabilities (MVP)

- Upload audio files (e.g., `.mp3`, `.wav`) via `/api/summary/transcribe`
- Transcribe the audio using **OpenAI Whisper** with **speaker diarization enabled**
- Return the raw transcript labeled with generic speakers (e.g., "Speaker 1", "Speaker 2")
- Allow users to **map speaker labels to names/roles post-meeting**
- Submit the labeled transcript to `/api/summary/summarize` to generate a concise summary using **GPT-4**
- REST API with **Swagger UI** for easy testing

> The MVP is designed to operate with minimal to no recurring cost by using OpenAI’s free tier, limiting audio duration, and leveraging local or free-tier infrastructure. This allows the developer to validate architecture and workflows before scaling.

---

### 🚧 Planned / Future Capabilities

- Automatically infer roles based on language and interaction context
- Deliver **personalized summaries and action items by email** to each participant based on mapped roles
- Store transcript metadata (e.g., filename, timestamp, mapped roles) in a database
- Retrieve historical transcripts and summaries via `/api/summary/history`
- Add webhook support for asynchronous transcription/summarization jobs
- Support for multi-language transcription and role-based access control (RBAC)
- Explore voice ID or advanced diarization for auto-role mapping (optional, long-term)

---

### 🧱️ Technical Overview

- Built in **.NET 8 Web API**
- Audio file uploads handled via `IFormFile`
- Integrated with **OpenAI Whisper** and **GPT-4** via OpenAI-DotNet SDK
- Speaker-role mapping handled post-transcription in the backend
- Config-driven with secure API key management via `appsettings`
- Deployable locally or to cloud platforms like **Azure**, **Render**, or **Railway**

---

### 🎯 Design Goals

- Handle real-world meetings with overlapping conversation and multiple speakers
- Keep latency low for short (5–15 minute) recordings in MVP phase
- Summaries are clear, readable, and under 2 paragraphs
- Modular architecture to support future capabilities like personalization and storage
- Operate under near-zero cost for individual developer testing and learning

