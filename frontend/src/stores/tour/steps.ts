import type { TourStepConfig } from './types';

// Tour step definitions - Complete 18-step guided tour
export const TOUR_STEPS: TourStepConfig[] = [
  {
    id: 1,
    title: "Upload Your Audio",
    description: "Click 'SELECT FILE' to select a mock audio file to transcribe.",
    transitionType: 'user-action',
    triggerAction: 'file-select',
    component: 'FileUpload'
  },
  {
    id: 2,
    title: "Transcription Complete",
    description: "Excellent! Review the transcript statistics shown in the chips above: file size, processing time, duration, Speaker count, confidence score, and detected language. Click 'NEXT' to continue.",
    transitionType: 'acknowledgment',
    component: 'TranscriptDisplay'
  },
  {
    id: 3,
    title: "MANAGE SPEAKERS",
    description: "Click 'MANAGE SPEAKERS' to create/edit/delete Speakers. You can optionally assign Name/Role/Email",
    transitionType: 'user-action',
    triggerAction: 'manage-names',
    component: 'TranscriptDisplay'
  },
  {
    id: 4,
    title: "Add Speaker",
    description: "Click 'ADD SPEAKER' to add additional Speakers if someone was missed during automatic detection. ⚠️ Adding Speakers will break the AI confidence score calculation",
    transitionType: 'user-action',
    triggerAction: 'add-speaker',
    component: 'SpeakerMappingDialog'
  },
  {
    id: 5,
    title: "Speaker Added Successfully",
    description: "Great! A new Speaker has been added to the list. Notice the new colored chip in the auto-detected Speakers section above. Click 'NEXT'.",
    transitionType: 'acknowledgment',
    component: 'SpeakerMappingDialog'
  },
  {
    id: 6,
    title: "Edit/Delete Speaker",
    description: "Click the 'pencil' icon to edit Speaker details or the trash icon to delete Speakers that were incorrectly detected. ⚠️ Deleting Speakers will break the AI confidence score calculation",
    transitionType: 'user-action',
    triggerAction: 'edit-speaker',
    component: 'SpeakerMappingDialog'
  },
  {
    id: 7,
    title: "Save Row",
    description: "After editing Speaker details, click the 'checkmark' to save changes for this Speaker.",
    transitionType: 'user-action',
    triggerAction: 'save-row',
    component: 'SpeakerMappingField'
  },
  {
    id: 8,
    title: "Save All Changes",  
    description: "Once you've finished editing Speakers, click 'SAVE MAPPINGS' to apply all changes.",
    transitionType: 'user-action',
    triggerAction: 'final-save',
    component: 'SpeakerMappingDialog'
  },
  {
    id: 9,
    title: "Reassign Speaker Transcript Segment",
    description: "Click the 'double arrow' icon to reassign a Transcription Segment to another Speaker. Click 'NEXT' to continue",
    transitionType: 'acknowledgment',
    component: 'TranscriptDisplay'
  },
  {
    id: 10,
    title: "Generate Summary",
    description: "Now that Speakers are mapped, click 'GENERATE MEETING SUMMARY' to create an AI-powered Summary of your meeting.",
    transitionType: 'user-action',
    triggerAction: 'generate-summary',
    component: 'SummaryDisplay'
  },
  {
    id: 11,
    title: "Add/Edit/Delete Action Items",
    description: "Click the ▼ to expand the Action Items. You can add, edit, delete, and drag action items between Speakers.",
    transitionType: 'user-action',
    triggerAction: 'expand-action-items',
    component: 'SummaryDisplay'
  },
  {
    id: 12,
    title: "Copy Summary",
    description: "You can copy the Summary to your clipboard using this button to paste it elsewhere. Click 'NEXT'.",
    transitionType: 'acknowledgment',
    component: 'SummaryDisplay'
  },
  {
    id: 13,
    title: "Share Summary via Email",
    description: "Click 'SHARE' to send the Meeting Summary and action items via email to participants.",
    transitionType: 'user-action',
    triggerAction: 'open-email-dialog',
    component: 'SummaryDisplay'
  },
  {
    id: 14,
    title: "Add Email Recipients",
    description: "Here you can add email addresses for meeting participants. If you entered emails during Speaker mapping, you can select from those or type new ones. Click 'ADD ALL PARTICIPANTS' to continue.",
    transitionType: 'user-action',
    triggerAction: 'add-email-recipient',
    component: 'EmailCompositionDialog'
  },
  {
    id: 15,
    title: "Edit Email Content",
    description: "Customize the email subject and add a personal message. The Meeting Summary will be included automatically. Click 'NEXT'.",
    transitionType: 'acknowledgment',
    component: 'EmailCompositionDialog'
  },
  {
    id: 16,
    title: "Preview Email",
    description: "Preview how your email will look with the Meeting Summary and action items included before sending it to recipients. Click 'PREVIEW' to continue",
    transitionType: 'user-action',
    triggerAction: 'preview-email',
    component: 'EmailCompositionDialog'
  },
  {
    id: 17,
    title: "Send Email",
    description: "Send the Meeting Summary and Action Items to all recipients. In demo mode, no actual emails are sent. Click 'SEND EMAIL'.",
    transitionType: 'user-action',
    triggerAction: 'send-email',
    component: 'EmailCompositionDialog'
  },
  {
    id: 18,
    title: "Tour Completion",
    description: "Congratulations! You've completed the demo tour. Sign up to start processing your own meeting recordings.",
    transitionType: 'acknowledgment',
    component: 'TourCompletion'
  }
];