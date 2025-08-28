# Summarization, Email, and Content Management Requirements

## Summarization

- REQ-SUM-1: System shall generate concise meeting summaries from transcriptions
- REQ-SUM-2: System shall extract key topics and discussion points
- REQ-SUM-3: System shall identify action items and decisions made
- REQ-SUM-4: System shall highlight important participants and their contributions
- REQ-SUM-5: System shall provide multiple summary formats (bullet points, paragraph, executive summary)

## AI-Powered Meeting Summary Generation

- REQ-AI-SUM-1: System shall generate comprehensive meeting summaries on user demand after transcript completion
- REQ-AI-SUM-2: Meeting summaries shall include a narrative overview targeting one-page length (flexible for longer meetings)
- REQ-AI-SUM-3: Meeting summaries shall include action items grouped by speaker/role using mapped speaker information
- REQ-AI-SUM-4: System shall detect both explicit task assignments ("John, handle X") and implicit commitments ("I'll look into that")
- REQ-AI-SUM-5: Action items without clear ownership shall be included with visible "Not Assigned" notation
- REQ-AI-SUM-6: System shall use speaker role mappings to organize action items by participant
- REQ-AI-SUM-7: Generated summaries shall be editable within the current session before sharing
- REQ-AI-SUM-8: System shall provide manual trigger for summary generation (not automatic)
- REQ-AI-SUM-9: System shall maintain session-based storage for generated summaries (no persistent storage)
- REQ-AI-SUM-10: System shall integrate with existing OpenAI service infrastructure for AI processing

## Email Sharing and Distribution

- REQ-EMAIL-1: System shall provide email composition interface for sharing generated meeting summaries
- REQ-EMAIL-2: Email content shall be embedded as rich HTML with professional formatting and company branding
- REQ-EMAIL-3: System shall pre-populate email composition with meeting summary and action items
- REQ-EMAIL-4: System shall allow users to edit email content before sending
- REQ-EMAIL-5: System shall auto-suggest email recipients based on meeting participants from speaker mappings
- REQ-EMAIL-6: System shall include sender's contact information automatically in email composition
- REQ-EMAIL-7: System shall support multiple email sends to different recipients during session
- REQ-EMAIL-8: Email drafts shall be saved and editable within the current session
- REQ-EMAIL-9: System shall include clear notification that content is AI-generated in all shared emails
- REQ-EMAIL-10: System shall maintain session-based email composition (no persistent email storage)
- REQ-EMAIL-11: Email content shall include speaker roles and mappings for recipient context
- REQ-EMAIL-12: System shall integrate with SMTP services for reliable email delivery
- REQ-EMAIL-13: System shall support multiple email service providers (SendGrid, Gmail SMTP, Office 365, Mailgun)
- REQ-EMAIL-14: System shall provide configurable email service settings in application configuration
- REQ-EMAIL-15: System shall handle email delivery failures gracefully with user feedback
- REQ-EMAIL-16: System shall support real email sending for testing and production environments
- REQ-EMAIL-17: System shall validate email addresses before attempting to send
- REQ-EMAIL-18: System shall provide delivery confirmation to users upon successful email send

## Content Management

- REQ-CNT-1: System shall store meeting recordings with metadata (date, participants, duration)
- REQ-CNT-2: System shall maintain transcription and summary history
- REQ-CNT-3: System shall allow users to edit and annotate transcriptions
- REQ-CNT-4: System shall support search functionality across meetings and summaries
- REQ-CNT-5: System shall export summaries in multiple formats (PDF, Word, plain text)
- REQ-CNT-6: System shall persist auto-detected speaker information with confidence scores for future reference
- REQ-CNT-7: System shall track manual corrections to auto-detected speaker names for machine learning improvement
- REQ-CNT-8: System shall enable search by participant names across meeting history
- REQ-CNT-9: System shall maintain audit trail of manual speaker additions and removals with timestamps
- REQ-CNT-10: System shall preserve speaker management history for meeting reconstruction and analysis
- REQ-CNT-11: System shall track all manual speaker mapping overrides with user attribution and timestamps
- REQ-CNT-12: System shall provide option to revert manual overrides back to original auto-detected mappings
