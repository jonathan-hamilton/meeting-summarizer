# Azure Integration & Service Abstraction Requirements

## Azure Speech Services Integration

- REQ-AZR-1: System shall create Azure AI Speech resource in West Coast US region (westus2)
- REQ-AZR-2: System shall configure authentication using API key for development, Managed Identity for production
- REQ-AZR-4: System shall implement Azure-specific error handling and retry logic
- REQ-AZR-5: System shall monitor usage against Free tier limits (5 hours/month) with usage alerts
- REQ-AZR-6: System shall transform Azure Speech Services JSON response to match existing frontend data contracts
- REQ-AZR-7: System shall map Azure speaker labels and timestamps to existing SpeakerSegment format
- REQ-AZR-8: System shall preserve Azure confidence scores and metadata for display and debugging
- REQ-AZR-9: System shall implement service abstraction layer supporting both Azure and OpenAI providers
- REQ-AZR-10: System shall provide configuration-driven service selection with factory pattern implementation

## Service Abstraction & Migration

- REQ-ABS-1: System shall implement ITranscriptionService interface for provider abstraction
- REQ-ABS-2: System shall use factory pattern with configuration-driven service selection
- REQ-ABS-3: System shall support Azure Speech Services, OpenAI, and Mock providers through common interface
- REQ-ABS-4: System shall enable provider switching without code changes through configuration
- REQ-ABS-5: System shall maintain backward compatibility with existing transcription data during migration
- REQ-ABS-6: System shall provide configuration toggle between Azure and OpenAI services during transition
- REQ-ABS-7: System shall preserve all existing speaker mapping functionality with improved accuracy

## Fallback Strategy

- REQ-FALL-1: System shall attempt Azure Speech Services as primary transcription service
- REQ-FALL-2: When Azure fails, system shall automatically fall back to OpenAI Whisper service
- REQ-FALL-3: When both services fail, system shall enable "manual-only" mode with bulk segment reassignment tools
- REQ-FALL-4: System shall clearly indicate which service was used for each transcription in UI and logs
- REQ-FALL-5: System shall log fallback occurrences for service reliability monitoring and debugging

## Cost Management & Monitoring

- REQ-COST-1: System shall track API usage metrics for Azure Speech Services and OpenAI separately
- REQ-COST-2: System shall implement cost monitoring with configurable monthly spending alerts
- REQ-COST-3: System shall provide cost-per-transcription reporting for business decision making
- REQ-COST-4: System shall log service provider usage for reliability and cost analysis
- REQ-COST-5: System shall optimize service selection based on historical accuracy and cost data
