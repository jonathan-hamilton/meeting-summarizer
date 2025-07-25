# Speaker Deletion Requirements - Design Document

## Problem Statement

The current speaker deletion functionality has unclear behavior regarding:
1. What happens to transcript segments when a speaker mapping is deleted
2. How the UI should reflect deleted speakers
3. Whether deletion should be permanent or just remove the name/role mapping

## Business Requirements

### BR-DEL-1: Speaker Mapping Deletion Types
The system shall support two types of speaker deletion:
- **Mapping Deletion**: Remove only the name/role assignment, keeping the speaker segments visible as "Speaker X"
- **Speaker Hiding**: Remove the speaker entirely from the UI display (segments are hidden)

### BR-DEL-2: Default Deletion Behavior
By default, speaker deletion shall perform **Mapping Deletion** - removing only the name/role assignment while preserving all transcript segments with their original speaker labels.

### BR-DEL-3: Transcript Segment Preservation
When a speaker mapping is deleted:
- All transcript segments originally assigned to that speaker shall remain visible
- Segments shall display with the original auto-detected speaker label (e.g., "Speaker 2")
- Confidence scores for those segments shall remain unchanged
- Timestamps and text content shall remain unchanged

### BR-DEL-4: UI State Consistency
After speaker deletion:
- The deleted speaker shall appear in "Unmapped Speakers" section if segments still exist
- Speaker count shall reflect current mapping status (mapped vs total detected)
- Dialog state shall reflect the current mappings accurately
- Parent component shall update to show correct mapped/unmapped counts

## Technical Requirements

### TR-DEL-1: Backend API Behavior
- DELETE `/api/SpeakerMapping/{transcriptionId}` shall remove all speaker mappings for a transcription
- Transcript data and segments shall remain unchanged
- Subsequent GET requests shall return 404 (no mappings found)
- Original auto-detected speakers shall still be available in transcript data

### TR-DEL-2: Frontend State Management
- Dialog state shall accurately reflect current mappings after deletion
- Parent component state shall update immediately when dialog saves changes
- No re-initialization of dialog state should occur after successful save
- Success state shall persist until dialog is closed

### TR-DEL-3: Data Flow
1. User deletes speaker mapping in dialog
2. Dialog removes mapping from local state
3. User clicks "Save Mappings"
4. Dialog calls DELETE API endpoint
5. Dialog shows success message
6. Dialog calls parent callback with updated mappings (empty array for full deletion)
7. Parent updates its state with new mappings
8. Parent UI reflects updated speaker counts and unmapped speakers

## User Experience Requirements

### UX-DEL-1: Clear Feedback
- User shall see immediate visual feedback when speaker is removed in dialog
- Success message shall clearly indicate what was deleted
- Unmapped speakers section shall show previously mapped speakers after deletion

### UX-DEL-2: Predictable Behavior
- Transcript segments shall always remain visible (no content disappears)
- Speaker labels shall revert to original auto-detected names after mapping deletion
- Count displays shall accurately reflect current state

### UX-DEL-3: Recovery Path
- User shall be able to re-map deleted speakers by opening the dialog again
- All original auto-detected speakers shall still be available for mapping

## Implementation Priority

**Phase 1 (Immediate)**: Fix basic deletion with mapping deletion behavior
- Ensure dialog state doesn't revert after save
- Fix parent component state updates
- Verify API DELETE endpoint works correctly

**Phase 2 (Future)**: Enhanced deletion options
- Add "Hide Speaker" option for complete removal from UI
- Add bulk operations for multiple speaker deletion
- Add undo functionality for recent deletions

## Test Scenarios

### Scenario 1: Single Speaker Mapping Deletion
1. Start with 2 auto-detected speakers, both mapped with names
2. Delete Speaker 2 mapping in dialog
3. Save changes
4. Verify: Speaker 2 appears in "Unmapped Speakers" section
5. Verify: Transcript still shows all Speaker 2 segments with original label
6. Verify: Count shows "1/2 mapped"

### Scenario 2: All Speaker Mappings Deletion
1. Start with 2 mapped speakers
2. Delete both speaker mappings
3. Save changes  
4. Verify: Both speakers appear in "Unmapped Speakers" section
5. Verify: Count shows "0/2 mapped"
6. Verify: All transcript segments remain visible

### Scenario 3: Dialog State Consistency
1. Delete a speaker mapping
2. Save changes and see success message
3. Verify dialog still shows correct state (deleted speaker not in mappings)
4. Close dialog and reopen
5. Verify dialog initializes with current state (no deleted speaker)

## Open Questions for Product Owner

1. **Future Enhancement**: Should we add a "Hide Speaker" option that completely removes segments from view?
2. **Bulk Operations**: Should users be able to delete multiple speakers at once?
3. **Undo Functionality**: Should recent deletions be reversible within the same session?
4. **Confirmation Flow**: Is the current confirmation dialog sufficient, or do we need additional warnings?

## Definition of Done

- [ ] Speaker deletion removes only mapping data, preserves transcript segments
- [ ] Dialog state remains consistent after successful save
- [ ] Parent component updates immediately with correct counts
- [ ] Deleted speakers appear in unmapped section if segments exist
- [ ] All transcript content remains visible with original speaker labels
- [ ] API DELETE endpoint returns appropriate success response
- [ ] Test scenarios pass consistently
