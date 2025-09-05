Perform these steps one at a time so I can verfiy everthing is working, I want to ensure functionality is preserved, ask for confirmtation before you proceed to the next step

the objective is to reduce the lines in the file SpeakerMappingDialog.tsx to under 500

use the stores/speakerStore.ts for Speaker state management

I would like to keep state managed by Zustand for this project so if any other stores need to be made let me know

Here is the 6 step list:

Suggested Component Breakdown

1. Extract Confirmation Dialog (Already partially done)
Move ConfirmDeleteDialog to its own file:
frontend/src/components/dialogs/ConfirmDeleteDialog.tsx

2. Extract Speaker Form Field Component
Create a dedicated component for individual speaker mapping forms:
frontend/src/components/speaker/SpeakerMappingField.tsx
This would handle the individual speaker form with name/role fields, edit mode, validation display

3. Extract Validation Logic using the following hybrid approach using this suggestion:
I suggest keeping the validation logic as a custom hook (useSpeakerValidation) rather than moving it to the store. Here's why:

-Pure Business Logic in Store: Move the validation rules (duplicate name checking, character validation) to the store as pure functions

- Pure Business Logic in Store: Move validation rules to store as pure functions
- UI State Management in Hook: Keep validation error state in custom hook
- **IMPORTANT**: These store validation functions will be consumed by the hook in step 5

4. Extract Edit Mode Logic using this suggestion:
I'd suggest extracting edit mode logic into a custom hook:

- Create hooks/useSpeakerEditMode.tsx
- Manage: editingMappings Set, originalValues Map, edit operations
- Handle: startEditMode, cancelEditMode, confirmEditMode, hasActiveEdits
- **Integration**: Must work with validation hook from step 3

5. Extract Speaker Management Logic:

- **CRITICAL**: Must integrate with hybrid validation from step 3
- Store speaker operations should call store validation functions
- Hook should manage UI validation state using store's pure functions
Move to TO speakerStore.ts:

-nextSpeakerId calculation and management
-deleteConfirmation state (since it's about speaker operations)
-Speaker add/remove business logic
-Validation rules for speaker operations
<this needs to use the factor in hybrid validation previously implemented in step 3>
ID generation logic

Contains add/remove speaker logic, confirmation dialogs, speaker ID generation
6. Main Dialog Component
The main SpeakerMappingDialog.tsx would become much smaller, focusing on:

Dialog structure and layout
Orchestrating the custom hooks
Rendering the extracted components

## File Dependencies After Refactoring

- speakerStore.ts: Contains pure validation functions + speaker operations
- hooks/useSpeakerValidation.tsx: Uses store validation functions, manages UI errors
- hooks/useEditMode.tsx: Manages edit state for form fields
- components/dialogs/ConfirmDeleteDialog.tsx: Standalone confirmation dialog
- components/speaker/SpeakerMappingField.tsx: Individual speaker form component
- SpeakerMappingDialog.tsx: Orchestrates all hooks and components

## Key Interfaces to Maintain

- SpeakerMappingDialogProps: Keep existing interface
- MappingFormData: May need to be shared between files
- ValidationError: Required for hook integration
- Store must expose: validateSpeakerName, validateSpeakerRole, speaker operations

4. Extract Edit Mode Logic:

- Create hooks/useEditMode.tsx or hooks/useSpeakerEditMode.tsx
- Manage: editingMappings Set, originalValues Map, edit operations
- **Integration**: Must work with validation hook from step 3
- Handle: startEdit, cancelEdit, confirmEdit, hasActiveEdits

## Verification Checklist for Each Step

- [ ] All existing functionality preserved
- [ ] No TypeScript compilation errors
- [ ] Dialog opens and displays speakers correctly
- [ ] Add/Remove speaker operations work
- [ ] Edit mode functions (save/cancel) work
- [ ] Validation displays correctly in real-time
- [ ] Save functionality works end-to-end
- [ ] Confirmation dialogs appear correctly

## Import Strategy

- Use relative imports for local components/hooks
- Ensure proper TypeScript types are exported/imported
- Update index files if using barrel exports
- Check for circular dependencies between store and hooks

6. Main Dialog Component - Final Result Should Have:

- Under 500 lines total
- Minimal local state (only loading, error, success)
- Clean hook composition
- Clear component orchestration
- All business logic moved to store/hooks
- Pure UI rendering and layout
