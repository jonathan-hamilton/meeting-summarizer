# Speaker Creation Requirements - Design Document

## Problem Statement

The current speaker creation functionality needs clear specification for:

1. How new speakers are added to the SpeakerMappingDialog and their initial state
2. How the UI should reflect newly created speakers in both dialog and transcript display
3. How the speaker counts and labeling should update when speakers are manually added
4. How manually created speakers are distinguished from auto-detected speakers

## Business Requirements

### BR-CRE-1: Session-Only Speaker Creation

The system shall support session-only speaker creation with no persistent storage:

- **Local State Addition**: Add new speaker to the SpeakerMappingDialog's local state
- **UI State Updates**: Update all related UI components to reflect the addition
- **No API Persistence**: No backend API calls are made for speaker creation

### BR-CRE-2: Speaker Addition Workflow

When "Add Speaker" is clicked:

- A new speaker shall be immediately added to the top of the SpeakerMappingDialog list
- The new speaker shall be labeled as "unassigned"
- The "Save Mappings" button shall become enabled
- The dialog shall remain open to allow further modifications or saving

### BR-CRE-3: New Speaker Initial State

When a new speaker is created:

- The speaker label shall display "unassigned" text
- A chip shall indicate the speaker was "manually added" (distinct from auto-detected)
- The speaker shall appear at the top of the mapped speakers list
- Name and role fields shall be empty and ready for user input

### BR-CRE-4: Speaker Count Updates

After speaker creation and save:

- Speaker count shall update to reflect the increased total (e.g., 0/3 becomes 0/4)
- The count shall include the newly created speaker in the total
- A new "unassigned" chip shall appear in the TranscriptDisplay speaker section

## Technical Requirements

### TR-CRE-1: Local State Management

The creation implementation shall use established state management patterns:

- Add new speaker to `mappedSpeakers` array in SpeakerMappingDialog state at index 0 (top)
- Update `saveEnabled` state to true when creation occurs
- Integrate with `speakerStore` and related hooks for consistent state management
- Use existing speaker-related hooks (e.g., `useSpeaker`, `useSpeakerMappings`) for state updates
- No API calls or backend persistence required

### TR-CRE-2: UI Component Updates

Upon speaker creation:

- **Add Button**: Immediately add a new speaker row at the top of the dialog
- **Speaker Label**: Display "unassigned" as the speaker identifier
- **Manual Indicator**: Show chip or badge indicating "manually added" status
- **Save Button**: Enable "Save Mappings" button to allow user to commit changes
- **Dialog State**: Keep dialog open to allow further modifications

### TR-CRE-3: Save Operation Handling

When "Save Mappings" is clicked after creation:

- Apply the modified speaker mappings to parent component via established hooks
- Update `speakerStore` state to reflect speaker addition and mapping changes
- Add new "unassigned" speaker chip to TranscriptDisplay
- Close the SpeakerMappingDialog
- Trigger re-render of TranscriptDisplay with updated mappings via state management hooks

### TR-CRE-4: TranscriptDisplay Integration

After save operation with new speaker:

- Display new "unassigned" speaker chip in the speaker section
- Update speaker count display (e.g., 0/3 → 0/4)
- Maintain all existing segment visibility and content
- New speaker initially has no associated transcript segments

## User Experience Requirements

### UX-CRE-1: Immediate Visual Feedback

- User shall see immediate addition of speaker row at top when "Add Speaker" is clicked
- New speaker shall be clearly labeled as "unassigned"
- Manual creation indicator shall distinguish from auto-detected speakers
- "Save Mappings" button shall become enabled to indicate pending changes
- Dialog shall remain open to allow further modifications

### UX-CRE-2: Post-Save Behavior

After save operation:

- Dialog shall close automatically
- TranscriptDisplay shall show new "unassigned" speaker chip
- Speaker count shall update to show increased total (e.g., 0/3 → 0/4)
- User can assign transcript segments to the new speaker in future operations

### UX-CRE-3: Predictable Workflow

- Changes are only applied when "Save Mappings" is clicked
- All additions happen within the session only (no persistent storage)
- User can continue working with the updated speaker list immediately
- New speakers are ready for name/role assignment and segment mapping

## Implementation Priority

**Phase 1 (Current)**: Session-only speaker creation

- Add new speaker to dialog state immediately at top position
- Enable save button when creation occurs
- Integrate with existing `speakerStore` and speaker-related hooks for state consistency
- Update transcript display after save with new "unassigned" chip
- Implement manual creation indicators to distinguish from auto-detected speakers

**Phase 2 (Future)**: Enhanced user experience

- Add pre-populated name suggestions for new speakers
- Add ability to create speakers with immediate name assignment
- Add templates for common speaker roles

## Test Scenarios

### Scenario 1: Single Speaker Creation and Save

1. Start with 3 auto-detected speakers, 0 mapped (0/3 mapped state)
2. User clicks "Add Speaker" button in dialog
3. Verify: New speaker row appears at top of dialog with "unassigned" label
4. Verify: Manual creation indicator/chip is visible
5. Verify: "Save Mappings" button becomes enabled
6. User clicks "Save Mappings"
7. Verify: Dialog closes automatically
8. Verify: TranscriptDisplay shows new "unassigned" speaker chip
9. Verify: Speaker count updates to "0/4 mapped"

### Scenario 2: Multiple Speaker Creation

1. Start with 3 auto-detected speakers (0/3 mapped state)
2. Create two new speakers in dialog
3. Verify: Both appear at top of list, labeled "unassigned"
4. Verify: Manual creation indicators are present for both
5. Save changes
6. Verify: Dialog closes and TranscriptDisplay shows both new "unassigned" chips
7. Verify: Count updates to "0/5 mapped"

### Scenario 3: Create and Immediately Map Speaker

1. Start with 3 auto-detected speakers (0/3 mapped state)
2. Create new speaker in dialog
3. Add name and role to the newly created speaker
4. Save changes
5. Verify: TranscriptDisplay shows named speaker chip (not "unassigned")
6. Verify: Count updates to "1/4 mapped"

### Scenario 4: Dialog Workflow Without Save

1. Create a new speaker in dialog
2. Verify: Speaker row added and Save button enabled
3. User closes dialog without saving
4. Verify: Original state is preserved (new speaker not added)
5. Reopen dialog
6. Verify: Dialog shows original speakers only (created speaker is gone)

## Open Questions for Product Owner

1. **Speaker Ordering**: Should manually created speakers always appear at the top, or should there be configurable ordering?
2. **Default Names**: Should new speakers have default names like "Speaker 4", "Speaker 5" instead of "unassigned"?
3. **Creation Limits**: Should there be a maximum number of speakers that can be manually created?
4. **Bulk Creation**: Should users be able to create multiple speakers at once?

## Definition of Done

- [ ] Speaker creation adds new speaker at top of dialog with "unassigned" label
- [ ] Manual creation indicator distinguishes created speakers from auto-detected ones
- [ ] Dialog state updates immediately when speaker is created (row added, Save button enabled)
- [ ] Integration with `speakerStore` and related hooks maintains state consistency across components
- [ ] Save operation closes dialog and applies all changes to transcript display via state management
- [ ] New "unassigned" speaker chip appears in TranscriptDisplay after save
- [ ] Speaker count updates correctly after save (e.g., 0/3 → 0/4)
- [ ] No API calls are made for speaker creation (session-only behavior)
- [ ] Dialog can be closed without saving and original state is preserved
- [ ] All test scenarios pass with expected UI behaviors
- [ ] New speakers are ready for name/role assignment and future segment mapping
- [ ] Manual creation indicators are visually distinct and clear to users
