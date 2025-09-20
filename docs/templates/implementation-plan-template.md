# Implementation Plan Template

## Overview
[Brief description of the story and its objectives]

## 🏗️ **ARCHITECTURAL DIRECTIVES - MANDATORY**

### **State Management Requirements**
⚠️ **CRITICAL**: Use Zustand stores for ALL state management - avoid local component state unless absolutely necessary for ephemeral UI state only (e.g., temporary hover states, input focus).

### **Zustand Store Integration**
- **Centralized Management**: All application state MUST go through appropriate Zustand stores
- **No Local State**: Do not use `useState`, `useReducer`, or local component state for any feature that needs persistence or cross-component coordination
- **Store Creation**: If new state is needed, extend existing stores or create dedicated stores following established patterns
- **Existing Stores**: Use existing stores where appropriate:
  - `accessibilityStore.ts` - Accessibility state (announcements, dialog states, keyboard navigation)
  - `speakerSessionStore.ts` - Speaker mapping persistence
  - Additional domain-specific stores as needed

### **Implementation Pattern**
```typescript
// ✅ CORRECT: Use store-based state
const { someState, someAction } = useSomeStore();

// ❌ WRONG: Avoid local state for application features
const [someState, setSomeState] = useState(''); // DON'T DO THIS unless ephemeral UI only
```

### **Store Usage Guidelines**
- **Dialog States**: Use stores for modal open/close states, not local useState
- **Form Data**: Persistent form data goes through stores
- **User Preferences**: All user settings and preferences in stores
- **Global State**: Any state needed by multiple components must use stores
- **Announcements**: Screen reader announcements and notifications through accessibilityStore

## User Story
[Story details and acceptance criteria]

## Dependencies
[Dependencies and prerequisites]

## Implementation Plan

### Increment [N]: [Name]
**Purpose:** [What this increment achieves]

**Files Modified:**
- `path/to/file.tsx` - [Description of changes]
- `src/stores/someStore.ts` - [Store modifications/extensions]

**Changes:**
- [Specific implementation changes]
- **Store Integration**: [Explicit description of how Zustand stores are used]
- [Additional changes]

**Acceptance Criteria Addressed:**
- ✅ [Specific criteria this increment addresses]

**Risk Mitigation:** [How risks are handled]

**Store Usage Pattern:**
```typescript
// Example of correct store usage for this increment
const { stateProperty, actionMethod } = useAppropriateStore();
```

[Repeat for additional increments]

## Testing Strategy
- [Testing approach]
- **Store Testing**: Verify state management through stores works correctly
- [Additional testing notes]

## Success Criteria
- [Success metrics]
- All state managed through appropriate Zustand stores
- No inappropriate local component state usage
- [Additional criteria]

## Integration Points
- [How this integrates with existing features and stores]