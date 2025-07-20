# Sprint 2 User Stories - Speaker Role Mapping and AI Summarization

## Sprint Overview

Sprint **API Endpoints:**

- `/api/summary/generate` - Generate summa```

**Prompt Engineering:**

- Generic summary prompts for meetings without role mapping
- Role-specific prompts that highlight relevant information for each role
- Action item extraction prompts
- Decision and key point identification prompts

---

## Story S2.3: Summary Display and Export Interface

As a user, I want to view, customize, and export my meeting summaries in multiple formats so that I can easily share insights with stakeholders.

### S2.3 Acceptance Criteria

**Display Features:**

- Clean, readable summary presentation with Material-UI components
- `/api/summary/{transcriptionId}/summarize` - Generate summary with stored speaker mappings
- Support for different summary types (overview, action-items, decisions, key-points)

**Backend Services:**

- SummarizationService using OpenAI GPT-4 chat completions
- Template-based prompt engineering for different summary styles
- Integration with speaker role mapping for personalized summaries
- Fallback to basic template-based summarization when GPT-4 is unavailable

### S2.2 Dependencies

S1.1 - Audio Transcription Backend Service, S2.1 - Speaker Role Mapping Interface

### S2.2 Developer Notes

**OpenAI Integration:**

- Use OpenAI-DotNet SDK for GPT-4 chat completionsre transcription pipeline from Sprint 1 to add intelligent speaker role mapping and AI-powered meeting summarization. This sprint transforms raw transcripts into actionable insights by allowing users to assign real names and roles to speakers, then generating personalized summaries based on those roles.

## Sprint 2 Goals

- Enable post-transcription speaker role mapping
- Implement AI-powered meeting summarization using GPT-4
- Create role-aware summary generation
- Establish foundation for future personalized features

## Implementation Progress

### S2.1 Status: PENDING 🔄

### S2.2 Status: PENDING 🔄

### S2.3 Status: PENDING 🔄

---

## Story S2.1: Speaker Role Mapping Interface

As a user, I want to assign real names and roles to the generic speaker labels in my transcript so that I can create meaningful, personalized meeting summaries.

### S2.1 Acceptance Criteria

**Frontend Requirements:**

- Interactive interface to map speaker labels (Speaker 1, Speaker 2) to actual names and roles
- Role selection from predefined options (Manager, Developer, Designer, Product Owner, etc.)
- Custom role input for flexible role assignment
- Real-time preview of mapped speakers in transcript display
- Save/load speaker mappings for reuse across meetings
- Clear visual indication of mapped vs unmapped speakers

**Backend Requirements:**

- SpeakerMapping model to store speaker assignments
- Endpoint to save and retrieve speaker mappings
- Integration with transcript display to show mapped names
- Optional: Store mappings by meeting/file for future reference

### S2.1 Dependencies

S1.2 - Transcript Display Component, S1.3 - File Upload Integration

### S2.1 Developer Notes

**Frontend Implementation:**

- Create SpeakerMappingComponent with Material-UI form controls
- Use MUI Autocomplete for role selection with custom input option
- Implement local state management for mappings before saving
- Integrate with TranscriptDisplay to show real names instead of generic labels
- Consider MUI Stepper to guide users through mapping process

**Backend Implementation:**

- Create SpeakerMapping model (SpeakerId, Name, Role, TranscriptionId)
- Add `/api/summary/speakers/map` endpoint for saving mappings
- Add `/api/summary/speakers/{transcriptionId}` endpoint for retrieving mappings
- Update TranscriptionResponse to include speaker mappings when available

**Data Models:**

```csharp
public class SpeakerMapping
{
    public string SpeakerId { get; set; } // "Speaker 1", "Speaker 2", etc.
    public string Name { get; set; } // "John Smith"
    public string Role { get; set; } // "Manager", "Developer", etc.
    public string TranscriptionId { get; set; }
}

public class SpeakerMappingRequest
{
    public string TranscriptionId { get; set; }
    public List<SpeakerMapping> Mappings { get; set; }
}
```

---

## Story S2.2: AI-Powered Meeting Summarization Backend

As a developer, I want to implement GPT-4 integration for meeting summarization so that users can generate concise, actionable summaries from their transcripts.

### S2.2 Acceptance Criteria

**Core Summarization Features:**

- GPT-4 integration for intelligent meeting summarization
- Support for both generic and role-aware summarization
- Configurable summary styles (brief, detailed, action-items focused)
- Integration with speaker mappings to generate personalized insights
- Error handling for OpenAI API failures with graceful degradation

**API Endpoints:**

- `/api/summary/generate` - Generate summary from transcript
- `/api/summary/{transcriptionId}/summarize` - Generate summary with stored speaker mappings
- Support for different summary types (overview, action-items, decisions, key-points)

**Backend Services:**

- SummarizationService using OpenAI GPT-4 chat completions
- Template-based prompt engineering for different summary styles
- Integration with speaker role mapping for personalized summaries
- Fallback to basic template-based summarization when GPT-4 is unavailable

### S2.2 Dependencies - Summarization

S1.1 - Audio Transcription Backend Service, S2.1 - Speaker Role Mapping Interface

### S2.2 Developer Notes - Implementation

**Implementation Strategy:**

- Use OpenAI-DotNet SDK for GPT-4 chat completions
- Create prompt templates for different summary styles and roles
- Implement retry logic and error handling for API failures
- Consider token limits and chunking for very long transcripts

**Service Architecture:**

```csharp
public interface ISummarizationService
{
    Task<SummaryResult> GenerateSummaryAsync(string transcript, SummaryOptions options);
    Task<SummaryResult> GenerateRoleAwareSummaryAsync(
        string transcript, 
        List<SpeakerMapping> speakerMappings, 
        SummaryOptions options);
}

public class SummaryOptions
{
    public SummaryStyle Style { get; set; } // Brief, Detailed, ActionItems
    public string TargetRole { get; set; } // Optional: Generate for specific role
    public int MaxTokens { get; set; } = 500;
}
```

**Prompt Engineering:**

- Generic summary prompts for meetings without role mapping
- Role-specific prompts that highlight relevant information for each role
- Action item extraction prompts
- Decision and key point identification prompts

---

## Story S2.3 Implementation: Summary Display and Export Interface

As a user, I want to view and export AI-generated meeting summaries so that I can quickly understand key takeaways and share insights with relevant stakeholders.

### S2.3 Acceptance Criteria - Display & Export

**Summary Display Features:**

- Clean, readable summary presentation with Material-UI components
- Different views for different summary types (overview, action items, decisions)
- Role-specific summary highlighting when speaker mappings are available
- Expandable sections for detailed vs brief summaries
- Real-time summary generation with loading states

**Export and Sharing:**

- Copy summary to clipboard functionality
- Export options (plain text, markdown, formatted)
- Email integration for sending summaries to participants
- Save summaries for future reference
- Print-friendly summary formatting

**Integration Features:**

- Seamless integration with transcript display
- Option to regenerate summaries with different parameters
- Side-by-side view of transcript and summary
- Highlight corresponding transcript sections when viewing action items

### S2.3 Dependencies

S2.1 - Speaker Role Mapping Interface, S2.2 - AI-Powered Meeting Summarization Backend

### S2.3 Developer Notes

**Frontend Implementation:**

- Create SummaryDisplayComponent with tabbed interface for different summary types
- Use MUI Accordion for expandable summary sections
- Implement export functionality with different format options
- Add loading states and error handling for summary generation
- Consider MUI Tooltip for explaining different summary types

**Export Options:**

- Plain text for simple copy/paste
- Markdown for documentation systems
- HTML for email sharing
- PDF generation for formal distribution (future enhancement)

**Component Structure:**

```tsx
interface SummaryDisplayProps {
  transcriptionId: string;
  transcript?: string;
  speakerMappings?: SpeakerMapping[];
  onSummaryGenerated?: (summary: SummaryResult) => void;
}

interface SummaryResult {
  id: string;
  transcriptionId: string;
  summaryType: SummaryStyle;
  content: string;
  actionItems?: string[];
  keyDecisions?: string[];
  nextSteps?: string[];
  generatedAt: Date;
  generatedFor?: string; // Role-specific summaries
}
```

---

## Sprint 2 Integration Workflow

### Complete User Journey

1. **Upload & Transcribe** (S1.1-S1.3): User uploads audio, gets transcript with speaker diarization
2. **Map Speakers** (S2.1): User assigns real names and roles to Speaker 1, Speaker 2, etc.
3. **Generate Summary** (S2.2): AI creates role-aware summary highlighting relevant information
4. **Review & Export** (S2.3): User reviews, customizes, and shares the summary

### Technical Architecture

```text
FileUpload → Transcription → SpeakerMapping → Summarization → Export
    ↓            ↓              ↓              ↓           ↓
  S1.3         S1.1           S2.1           S2.2        S2.3
```

## Sprint 2 Success Metrics

- **Functional**: Complete end-to-end workflow from audio upload to actionable summary
- **Quality**: Meaningful, role-aware summaries that highlight relevant information
- **Usability**: Intuitive speaker mapping and summary customization interface
- **Performance**: Reasonable response times for GPT-4 summarization (< 30 seconds)
- **Reliability**: Graceful handling of API failures with fallback options

## Future Sprint Considerations

Sprint 2 establishes the foundation for:

- **Sprint 3**: Email automation and stakeholder distribution
- **Sprint 4**: Meeting history and transcript management
- **Sprint 5**: Advanced role inference and automatic speaker identification
- **Sprint 6**: Multi-language support and international deployment

---

## Technical Rationale

Sprint 2 transforms the application from a basic transcription tool into an intelligent meeting assistant. By adding speaker role mapping and AI summarization, we create immediate value for business users while establishing the architecture for advanced personalization features in future sprints.

The dependency chain (S2.1 → S2.2 → S2.3) ensures each story builds logically on the previous one, with clear integration points and testable deliverables at each stage.
