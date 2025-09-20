import { create } from 'zustand';
import type { MeetingSummary, SpeakerMapping, ActionItem } from '../types';

interface TranscriptData {
  transcriptionId: string;
  fileName: string;
  speakerSegments: any[];
  transcribedText: string;
}

interface EmailState {
  // Dialog state
  isDialogOpen: boolean;
  
  // Email content
  subject: string;
  content: string;
  recipients: string[];
  
  // Email context data
  summary: MeetingSummary | null;
  speakerMappings: SpeakerMapping[];
  actionItems: ActionItem[];
  transcriptData: TranscriptData | null;
  
  // Email options
  includeTranscript: boolean;
  transcriptOnly: boolean;
  includeTranscriptDefault: boolean;
  
  // Loading state
  isSending: boolean;
  
  // UI state
  recipientInput: string;
  isPreview: boolean;
  error: string | null;
  sendSuccess: string | null;
  sendError: string | null;
  
  // Actions
  openDialog: (config: {
    summary?: MeetingSummary | null;
    speakerMappings?: SpeakerMapping[];
    actionItems?: ActionItem[];
    transcriptData?: TranscriptData | null;
    transcriptOnly?: boolean;
    includeTranscriptDefault?: boolean;
  }) => void;
  closeDialog: () => void;
  setSubject: (subject: string) => void;
  setContent: (content: string) => void;
  setRecipients: (recipients: string[]) => void;
  addRecipient: (email: string) => void;
  removeRecipient: (index: number) => void;
  setIncludeTranscript: (include: boolean) => void;
  setSending: (sending: boolean) => void;
  setRecipientInput: (input: string) => void;
  setIsPreview: (preview: boolean) => void;
  setError: (error: string | null) => void;
  setSendSuccess: (success: string | null) => void;
  setSendError: (error: string | null) => void;
  resetEmailState: () => void;
}

export const useEmailStore = create<EmailState>()((set, get) => ({
  // Initial state
  isDialogOpen: false,
  subject: '',
  content: '',
  recipients: [],
  summary: null,
  speakerMappings: [],
  actionItems: [],
  transcriptData: null,
  includeTranscript: false,
  transcriptOnly: false,
  includeTranscriptDefault: false,
  isSending: false,
  recipientInput: '',
  isPreview: false,
  error: null,
  sendSuccess: null,
  sendError: null,

  // Actions
  openDialog: (config) => {
    console.log('🏪 STORE openDialog called with config:', config);
    const {
      summary = null,
      speakerMappings = [],
      actionItems = [],
      transcriptData = null,
      transcriptOnly = false,
      includeTranscriptDefault = false,
    } = config;

    // Generate initial content based on context
    let defaultSubject = '';
    let defaultContent = '';
    let includeTranscript = includeTranscriptDefault;

    if (transcriptOnly && transcriptData) {
      // Scenario 1: Transcript-only email
      const fileBaseName = transcriptData.fileName.replace(/\.[^/.]+$/, ""); // Remove file extension
      defaultSubject = `📝 Meeting Transcript: ${fileBaseName} - ${new Date().toLocaleDateString()}`;
      defaultContent = generateTranscriptEmailContent(transcriptData, speakerMappings);
      includeTranscript = true; // Always include transcript for transcript-only emails
    } else if (summary) {
      // Scenario 2: Summary email (with optional transcript)
      const actionItemCount = actionItems.length;
      const actionItemText = actionItemCount > 0 ? ` (${actionItemCount} Action Items)` : '';
      defaultSubject = `📋 Meeting Summary: ${new Date().toLocaleDateString()}${actionItemText}`;
      defaultContent = generateSummaryEmailContent(summary, speakerMappings, actionItems);
      
      // If transcript should be included by default, append it
      if (includeTranscriptDefault && transcriptData) {
        const transcriptSection = generateTranscriptSection(transcriptData, speakerMappings);
        defaultContent = `${defaultContent}\n\n${transcriptSection}`;
      }
    }

    // Auto-populate recipients from speaker mappings with email addresses
    const suggestedRecipients = generateRecipientSuggestions(speakerMappings);

    console.log('🏪 STORE about to call set() with isDialogOpen: true');
    set({
      isDialogOpen: true,
      summary,
      speakerMappings,
      actionItems,
      transcriptData,
      transcriptOnly,
      includeTranscriptDefault,
      includeTranscript,
      subject: defaultSubject,
      content: defaultContent,
      recipients: suggestedRecipients,
      isSending: false,
    });
    console.log('🏪 STORE set() called, isDialogOpen should now be true');
  },

  closeDialog: () => {
    set({ isDialogOpen: false });
  },

  setSubject: (subject) => {
    set({ subject });
  },

  setContent: (content) => {
    set({ content });
  },

  setRecipients: (recipients) => {
    set({ recipients });
  },

  addRecipient: (email) => {
    const { recipients } = get();
    if (email.trim() && !recipients.includes(email.trim())) {
      set({ recipients: [...recipients, email.trim()] });
    }
  },

  removeRecipient: (index) => {
    const { recipients } = get();
    const newRecipients = recipients.filter((_, i) => i !== index);
    set({ recipients: newRecipients });
  },

  setIncludeTranscript: (include) => {
    const { summary, transcriptData, speakerMappings, actionItems, transcriptOnly } = get();
    
    set({ includeTranscript: include });
    
    // Regenerate content when transcript inclusion changes (only for non-transcript-only emails)
    if (!transcriptOnly && summary) {
      const baseContent = generateSummaryEmailContent(summary, speakerMappings, actionItems);
      
      if (include && transcriptData) {
        // Append transcript to base content
        const transcriptSection = generateTranscriptSection(transcriptData, speakerMappings);
        const newContent = `${baseContent}\n\n${transcriptSection}`;
        set({ content: newContent });
      } else {
        // Remove transcript, show only base content
        set({ content: baseContent });
      }
    }
  },

  setSending: (sending) => {
    set({ isSending: sending });
  },

  setRecipientInput: (input) => {
    set({ recipientInput: input });
  },

  setIsPreview: (preview) => {
    set({ isPreview: preview });
  },

  setError: (error) => {
    set({ error });
  },

  setSendSuccess: (success) => {
    set({ sendSuccess: success });
  },

  setSendError: (error) => {
    set({ sendError: error });
  },

  resetEmailState: () => {
    set({
      isDialogOpen: false,
      subject: '',
      content: '',
      recipients: [],
      summary: null,
      speakerMappings: [],
      actionItems: [],
      transcriptData: null,
      includeTranscript: false,
      transcriptOnly: false,
      includeTranscriptDefault: false,
      isSending: false,
      recipientInput: '',
      isPreview: false,
      error: null,
      sendSuccess: null,
      sendError: null,
    });
  },
}));

// Helper functions for content generation
function generateSummaryEmailContent(
  summary: MeetingSummary, 
  speakerMappings: SpeakerMapping[], 
  actionItems: ActionItem[]
): string {
  const participantsList = speakerMappings
    .map(speaker => `• ${speaker.name}${speaker.role ? ` - ${speaker.role}` : ''}`)
    .join('\n');

  // Group action items by speaker
  const groupedActionItems: { [speakerId: string]: { speakerName: string; items: ActionItem[] } } = {};
  
  actionItems.forEach(item => {
    const speakerId = item.assignedTo || 'Unassigned';
    
    if (!groupedActionItems[speakerId]) {
      const speakerMapping = speakerMappings.find(m => m.speakerId === speakerId);
      const speakerName = speakerMapping?.name || (speakerId === 'Unassigned' ? 'Unassigned' : speakerId);
      
      groupedActionItems[speakerId] = {
        speakerName,
        items: []
      };
    }
    
    groupedActionItems[speakerId].items.push(item);
  });

  let actionItemsText = '';
  if (Object.keys(groupedActionItems).length > 0) {
    actionItemsText = '\n## Action Items\n';
    Object.entries(groupedActionItems).forEach(([, group]) => {
      actionItemsText += `\n### ${group.speakerName}\n`;
      group.items.forEach(item => {
        actionItemsText += `• ${item.description}\n`;
      });
    });
  }

  const meetingDate = new Date().toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  return `Hello team,

I hope this message finds you well. Please find the comprehensive meeting summary from our session on ${meetingDate} below.

## 📋 Meeting Overview
${summary.meetingOverview || 'No overview available.'}

## 👥 Meeting Participants
${participantsList || 'No participants mapped.'}
${actionItemsText}

## 📝 Next Steps
Please review the action items above and reach out if you have any questions or need clarification on your responsibilities.

---
*This summary was generated using AI-powered transcription and may require review for accuracy. Please contact the meeting organizer if you notice any discrepancies.*

Best regards,
Meeting Organizer`;
}

function generateTranscriptEmailContent(
  transcriptData: TranscriptData, 
  speakerMappings: SpeakerMapping[]
): string {
  const participantsList = speakerMappings
    .map(speaker => `• ${speaker.name}${speaker.role ? ` - ${speaker.role}` : ''}`)
    .join('\n');

  // Format transcript with speaker names (one speaker per line/block for readability)
  const formatTranscriptText = (): string => {
    if (transcriptData.speakerSegments && transcriptData.speakerSegments.length > 0) {
      return transcriptData.speakerSegments
        .map(segment => {
          const speakerMapping = speakerMappings.find(m => m.speakerId === segment.speaker);
          const speakerName = speakerMapping?.name || segment.speaker || 'Unknown Speaker';
          return `${speakerName}: ${segment.text}`;
        })
        .join('\n\n');
    } else {
      // Fallback to plain text if no speaker segments
      return transcriptData.transcribedText || 'Transcript content not available.';
    }
  };

  const meetingDate = new Date().toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
  
  const fileBaseName = transcriptData.fileName.replace(/\.[^/.]+$/, ""); // Remove file extension

  return `Hello team,

I hope this message finds you well. Please find the complete meeting transcript from our session on ${meetingDate} below.

## 📁 Meeting Information
- **Session:** ${fileBaseName}
- **Date:** ${meetingDate}
- **Generated:** ${new Date().toLocaleString()}

## 👥 Meeting Participants
${participantsList || 'No participants mapped.'}

## 📝 Complete Transcript
${formatTranscriptText()}

## 📋 Follow-up Actions
Please review the transcript and let me know if you have any questions or if there are action items that need to be addressed from our discussion.

---
*This transcript was generated using AI-powered transcription technology and may require review for accuracy. Please contact the meeting organizer if you notice any discrepancies.*

Best regards,
Meeting Organizer`;
}

function generateTranscriptSection(
  transcriptData: TranscriptData, 
  speakerMappings: SpeakerMapping[]
): string {
  // Format transcript with speaker names (one speaker per line/block for readability)
  const formatTranscriptText = (): string => {
    if (transcriptData.speakerSegments && transcriptData.speakerSegments.length > 0) {
      return transcriptData.speakerSegments
        .map(segment => {
          const speakerMapping = speakerMappings.find(m => m.speakerId === segment.speaker);
          const speakerName = speakerMapping?.name || segment.speaker || 'Unknown Speaker';
          return `${speakerName}: ${segment.text}`;
        })
        .join('\n\n');
    } else {
      // Fallback to plain text if no speaker segments
      return transcriptData.transcribedText || 'Transcript content not available.';
    }
  };

  const fileBaseName = transcriptData.fileName.replace(/\.[^/.]+$/, ""); // Remove file extension
  
  return `## 📝 Complete Meeting Transcript
- **Session:** ${fileBaseName}
- **Generated:** ${new Date().toLocaleString()}

### 💬 Full Discussion
${formatTranscriptText()}

---
*This transcript was generated using AI-powered transcription and may require review for accuracy.*`;
}

// Helper function to generate recipient suggestions from speaker mappings
function generateRecipientSuggestions(speakerMappings: SpeakerMapping[]): string[] {
  const recipients: string[] = [];
  
  speakerMappings.forEach(speaker => {
    if (speaker.email && speaker.email.trim()) {
      // Format: "Speaker Name <email@domain.com>" or just "email@domain.com"
      const formattedRecipient = speaker.name 
        ? `${speaker.name} <${speaker.email.trim()}>` 
        : speaker.email.trim();
      
      // Avoid duplicates
      if (!recipients.includes(formattedRecipient)) {
        recipients.push(formattedRecipient);
      }
    }
  });
  
  console.log('📧 Generated recipient suggestions:', recipients);
  return recipients;
}