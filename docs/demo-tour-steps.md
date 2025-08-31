# Demo Mode Tour Steps Documentation

# Demo Mode Tour Steps Documentation

## Overview

The guided tour in Demo mode walks users through the complete meeting transcription and summarization workflow using simulated data and interactions.

## Tour Step Definitions

### **Step 1: File Upload Simulation**
- **Target**: "SELECT FILE" button in FileUpload component
- **Action**: Click to begin simulated transcription processing
- **Behavior**: Triggers mock upload progress sequence without file picker
- **Description**: "Click 'SELECT FILE' to start the demo transcription process with our sample meeting audio."
- **Demo Data**: Uses predefined demo meeting audio file

### **Step 2: Transcription Statistics Overview**
- **Target**: Transcription results metadata chips area
- **Action**: Acknowledge and explain the transcription statistics
- **Behavior**: Highlight the metadata chips showing processing time, file size, audio duration, speaker mapping status, confidence score, and detected language
- **Description**: "Great! Your audio has been processed. Here you can see the transcription statistics: processing time, file size, audio duration, speaker mapping progress, AI confidence score, and detected language."
- **Demo Data**: Shows actual values from the demo transcription (e.g., "45s processing", "1.66 MB", "17s audio", "0/4 speakers named", "99% confidence", "EN")

### **Step 3: Speaker Management**
- **Target**: "MANAGE NAMES" button (appears after transcription completes)
- **Action**: Click to open SpeakerMappingDialog for speaker name assignment
- **Behavior**: Opens dialog with detected speakers using demo data
- **Description**: "Click 'MANAGE NAMES' to assign names to the speakers we detected in the meeting."
- **Demo Data**: Shows 4 detected speakers (Speaker 1, Speaker 2, Speaker 3, Speaker 4)

### **Step 4: (Optional) Add Speaker**
- **Target**: "ADD SPEAKER" button in SpeakerMappingDialog
- **Action**: Click to add an additional speaker to the meeting
- **Behavior**: Opens new speaker entry form
- **Description**: "You can add additional speakers if someone was missed during automatic detection. Note: Adding speakers may affect the AI confidence score."
- **Demo Data**: Shows form to add new speaker with name, role, and email fields
- **Warning**: "Adding speakers will break the AI confidence score calculation"

### **Step 5: (Optional) Delete Speaker**
- **Target**: Red delete button (trash icon) on speaker rows in SpeakerMappingDialog
- **Action**: Click to remove a speaker from the meeting
- **Behavior**: Shows delete confirmation and removes speaker
- **Description**: "You can delete speakers if they were incorrectly detected. Note: Deleting speakers may affect the AI confidence score."
- **Demo Data**: Highlights delete button on speaker rows
- **Warning**: "Deleting speakers will break the AI confidence score calculation"

### **Step 6: (Optional) Edit Speaker**
- **Target**: Pencil (edit) icon on speaker rows in SpeakerMappingDialog
- **Action**: Click to edit speaker information
- **Behavior**: Enables editing mode for the selected speaker row
- **Description**: "Click the pencil to edit the Speaker. You can modify their name, role, and email address."
- **Demo Data**: Shows editable fields for speaker information
- **Condition**: Available for all detected speakers

### **Step 7: Save Row**
- **Target**: Checkmark "Save" button for individual speaker row
- **Action**: Highlight save action for edited row
- **Behavior**: Appears when user begins editing a speaker
- **Description**: "After editing speaker details, click the checkmark to save changes for this speaker."
- **Condition**: Only show when user has made edits to a speaker row

### **Step 8: SAVE MAPPINGS**
- **Target**: "SAVE MAPPINGS" button
- **Action**: Complete speaker mapping process
- **Behavior**: Save all speaker assignments and close dialog
- **Description**: "Once you've finished editing speakers, click 'SAVE MAPPINGS' to apply all changes."
- **Condition**: Show after all edited rows have been saved

### **Step 9: Summary Generation**
- **Target**: "Generate Meeting Summary" button
- **Action**: Click to create AI-powered meeting summary
- **Behavior**: Triggers mock summary generation with demo content
- **Description**: "Click 'Generate Meeting Summary' to create an AI-powered summary of the meeting discussion."
- **Demo Data**: Uses predefined summary content

### **Step 10: Review Summary and Action Items**
- **Target**: SummaryDisplay component (meeting overview and action items sections)
- **Action**: Review generated summary content
- **Behavior**: Highlight summary sections and action items
- **Description**: "Review the AI-generated meeting summary and action items. Notice how speakers are organized and tasks are extracted from the conversation."
- **Demo Data**: Shows summary with action items organized by speaker

### **Step 11: Copy Summary**
- **Target**: Copy button in SummaryDisplay component
- **Action**: Click to copy summary to clipboard
- **Behavior**: Simulate copying summary content
- **Description**: "You can copy the summary to your clipboard using this button to paste it elsewhere."
- **Demo Data**: Copies formatted summary text

### **Step 12: Share Summary via Email**
- **Target**: "SHARE" button in SummaryDisplay component
- **Action**: Click to open email composition dialog
- **Behavior**: Opens EmailCompositionDialog with demo data
- **Description**: "Click 'SHARE' to send the meeting summary and action items via email to participants."

### **Step 13: Add Email Recipients**
- **Target**: Email input field in EmailCompositionDialog
- **Action**: Add recipient email addresses
- **Behavior**: Show options to manually enter emails or select from speaker emails if available
- **Description**: "Add email addresses for meeting participants. If you entered emails during speaker mapping, you can select from those."
- **Demo Data**: Shows sample email addresses from speaker mappings

### **Step 14: Edit Email Content**
- **Target**: Email subject and body fields in EmailCompositionDialog
- **Action**: Modify email subject line and message content
- **Behavior**: Highlight editable email content areas
- **Description**: "Customize the email subject and add a personal message. The meeting summary will be included automatically."
- **Demo Data**: Pre-filled subject and customizable message body

### **Step 15: Preview Email**
- **Target**: Email preview section in EmailCompositionDialog
- **Action**: Review final email appearance
- **Behavior**: Show formatted email preview with summary content
- **Description**: "Preview how your email will look with the meeting summary and action items included."
- **Demo Data**: Formatted email preview with demo summary content

### **Step 16: Save Draft**
- **Target**: "SAVE DRAFT" button in EmailCompositionDialog
- **Action**: Save email as draft for later sending
- **Behavior**: Simulate saving email draft
- **Description**: "Save your email as a draft to send later. This is useful for reviewing with your team first."
- **Demo Data**: Simulates draft saving confirmation

### **Step 17: Send Email**
- **Target**: "SEND EMAIL" button in EmailCompositionDialog
- **Action**: Send the meeting summary email
- **Behavior**: Simulate email sending process
- **Description**: "Send the meeting summary and action items to all recipients. In demo mode, no actual emails are sent."
- **Demo Data**: Shows sending confirmation message

### **Step 18: Tour Completion**
- **Target**: Tour completion overlay
- **Action**: Complete demo tour
- **Behavior**: Show tour completion message and next steps
- **Description**: "Congratulations! You've completed the demo tour. Sign up to start processing your own meeting recordings."

### **Step 20+: Additional Steps (Pending Summary Integration)**

*The following steps depend on fixing the MeetingSummary functionality integration:*

- ~~**Step 6**: Summary review and editing~~ ✅ **DEFINED ABOVE**
- ~~**Step 7**: Email composition and sharing~~ ✅ **DEFINED ABOVE**  
- ~~**Step 8**: Tour completion and sign-up prompt~~ ✅ **DEFINED ABOVE**

## Tour Behavior Requirements

### **Navigation Controls**
- **Next**: Advance to next step
- **Previous**: Return to previous step  
- **Skip/Close**: Exit tour at any time
- **Auto-advance**: Some steps auto-advance based on user actions

### **Step Highlighting**
- Use Material-UI Backdrop to dim non-target elements
- Use Material-UI Popover positioned near target element
- Target elements should be clearly highlighted and accessible

### **Conditional Logic**
- Step 7 is conditional based on user editing behavior (save row)
- Tour should adapt to user actions within the SpeakerMappingDialog

### **Demo Data Integration**
- All tour steps use static/mock data from demo API service
- No real file uploads, API calls, or emails sent
- Clear indicators that all actions are simulated

## Implementation Priority

1. **High Priority**: Steps 1-3 (File upload through transcription statistics acknowledgment)
2. **Medium Priority**: Steps 4-8 (Add speaker, delete speaker, edit speaker, save row, save mappings) in SpeakerMappingDialog
3. **Medium Priority**: Steps 9-11 (Summary generation, review and copy functionality)
4. **Low Priority**: Steps 12-17 (Email sharing workflow)
5. **Low Priority**: Step 18 (Tour completion and sign-up flow)

## Next Actions Required

1. **Fix MeetingSummary Integration**: SummaryDisplay component not integrated in main workflow
2. **Implement Tour Foundation**: Create TourPopover component and step management
3. **Define Tour Step Data Structure**: TypeScript interfaces and step configuration
4. **Integrate with Demo Mode**: Connect tour to existing AppModeContext
