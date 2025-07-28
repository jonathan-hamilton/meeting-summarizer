# Speaker Deletion Requirements - Design Document

## Problem Statement

The current speaker deletion functionality needs clear specification for:

1. What happens to transcript segments when a speaker mapping is deleted
2. How the UI should reflect deleted speakers in the dialog and transcript display
3. How the speaker counts and confidence indicators should update
4. How transcript segments should be relabeled for deleted speakers

## Business Requirements

### BR-DEL-1: Session-Only Speaker Deletion

The system shall support session-only speaker deletion with no persistent storage:

- **Local State Deletion**: Remove speaker from the SpeakerMappingDialog's local state
- **UI State Updates**: Update all related UI components to reflect the deletion
- **No API Persistence**: No backend API calls are made for speaker deletion

### BR-DEL-2: Speaker Removal Workflow

When "Remove Speaker" is clicked:

- The speaker shall be immediately removed from the SpeakerMappingDialog
- The "Save Mappings" button shall become enabled
- The dialog shall remain open to allow further modifications or saving

### BR-DEL-3: Transcript Segment Handling

When a speaker mapping is deleted and changes are saved:

- All transcript segments originally assigned to that speaker shall remain visible
- Segments shall be relabeled as "unassigned" 
- The speaker chip in transcript segments shall display "unassigned" label
- Confidence scores for those segments shall have strikethrough styling

### BR-DEL-4: Speaker Count Updates

After speaker deletion and save:

- Speaker count shall update to reflect the reduced total (e.g., 0/3 becomes 0/2)
- The count shall only include remaining speakers in the dialog
- Confidence percentage for unassigned segments shall have strikethrough styling

## Technical Requirements

### TR-DEL-1: Local State Management

The deletion implementation shall use established state management patterns:

- Remove speaker from `mappedSpeakers` array in SpeakerMappingDialog state
- Update `saveEnabled` state to true when deletion occurs
- Integrate with `speakerStore` and related hooks for consistent state management
- Use existing speaker-related hooks (e.g., `useSpeaker`, `useSpeakerMappings`) for state updates
- No API calls or backend persistence required

### TR-DEL-2: UI Component Updates

Upon speaker deletion:

- **Remove Button**: Immediately remove the speaker row from the dialog
- **Save Button**: Enable "Save Mappings" button to allow user to commit changes
- **Speaker Count**: Maintain current speaker count until save operation
- **Dialog State**: Keep dialog open to allow further modifications

### TR-DEL-3: Save Operation Handling

When "Save Mappings" is clicked after deletion:

- Apply the modified speaker mappings to parent component via established hooks
- Update `speakerStore` state to reflect speaker deletion and mapping changes
- Update transcript segments to reflect "unassigned" status for deleted speaker segments
- Close the SpeakerMappingDialog
- Trigger re-render of TranscriptDisplay with updated mappings via state management hooks

### TR-DEL-4: TranscriptDisplay Integration

After save operation with deleted speaker:

- Display segments with "unassigned" speaker chips
- Apply strikethrough styling to confidence percentages for unassigned segments
- Update speaker count display (e.g., 0/3 → 0/2)
- Maintain all segment visibility and content

## User Experience Requirements

### UX-DEL-1: Immediate Visual Feedback

- User shall see immediate removal of speaker row when "Remove Speaker" is clicked
- "Save Mappings" button shall become enabled to indicate pending changes
- Dialog shall remain open to allow further modifications

### UX-DEL-2: Post-Save Behavior

- Transcript segments shall always remain visible (no content disappears)
After save operation:

- Dialog shall close automatically
- Transcript segments for deleted speaker shall display "unassigned" chips  
- Confidence percentages shall have strikethrough styling
- Speaker count shall update to show reduced total (e.g., 0/3 → 0/2)

### UX-DEL-3: Predictable Workflow

- Changes are only applied when "Save Mappings" is clicked
- All deletions happen within the session only (no persistent storage)
- User can continue working with the updated transcript immediately

## Implementation Priority

**Phase 1 (Current)**: Session-only speaker deletion

- Remove speaker from dialog state immediately
- Enable save button when deletion occurs
- Integrate with existing `speakerStore` and speaker-related hooks for state consistency
- Update transcript display after save with "unassigned" labels
- Implement strikethrough styling for unassigned confidence scores

**Phase 2 (Future)**: Enhanced user experience

- Add confirmation dialogs for speaker deletion
- Add undo functionality within the session
- Add bulk operations for multiple speaker deletion

## Test Scenarios

### Scenario 1: Single Speaker Deletion and Save

1. Start with 3 auto-detected speakers, 1 mapped with name (0/3 mapped state)
2. User clicks "Remove Speaker" for the mapped speaker in dialog
3. Verify: Speaker row is immediately removed from dialog
4. Verify: "Save Mappings" button becomes enabled
5. User clicks "Save Mappings"
6. Verify: Dialog closes automatically
7. Verify: Transcript segments for deleted speaker show "unassigned" chips
8. Verify: Confidence percentages for those segments have strikethrough styling
9. Verify: Speaker count updates to "0/2 mapped"

### Scenario 2: Multiple Speaker Operations

1. Start with 3 auto-detected speakers, 2 mapped (2/3 mapped state)
2. Delete one speaker mapping in dialog
3. Add a mapping for an unmapped speaker
4. Save changes
5. Verify: Dialog closes and all changes are applied
6. Verify: Deleted speaker segments show "unassigned" with strikethrough confidence
7. Verify: Newly mapped speaker segments show correct name
8. Verify: Count updates appropriately

### Scenario 3: Dialog Workflow Without Save

1. Delete a speaker mapping in dialog
2. Verify: Speaker row removed and Save button enabled
3. User closes dialog without saving
4. Verify: Original state is preserved (no changes applied)
5. Reopen dialog
6. Verify: Dialog shows original mappings (deleted speaker is back)

## Open Questions for Product Owner

1. **Confirmation UX**: Should speaker deletion require a confirmation step within the dialog?
2. **Undo Functionality**: Should there be a way to undo speaker deletion within the session?
3. **Bulk Operations**: Should users be able to delete multiple speakers at once?
4. **Visual Indicators**: Are strikethrough confidence scores sufficient for indicating unassigned segments?

## Definition of Done

- [ ] Speaker deletion removes only mapping data, preserves transcript segments with "unassigned" labels
- [ ] Dialog state updates immediately when speaker is deleted (row removed, Save button enabled)
- [ ] Integration with `speakerStore` and related hooks maintains state consistency across components
- [ ] Save operation closes dialog and applies all changes to transcript display via state management
- [ ] Unassigned segments display "unassigned" chips with strikethrough confidence percentages
- [ ] Speaker count updates correctly after save (e.g., 0/3 → 0/2)
- [ ] No API calls are made for speaker deletion (session-only behavior)
- [ ] Dialog can be closed without saving and original state is preserved
- [ ] All test scenarios pass with expected UI behaviors
- [ ] Parent component updates immediately with correct counts
- [ ] Deleted speakers appear in unmapped section if segments exist
- [ ] All transcript content remains visible with original speaker labels
- [ ] API DELETE endpoint returns appropriate success response
- [ ] Test scenarios pass consistently
