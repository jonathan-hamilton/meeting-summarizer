# Implementation Plan Template

## Overview
[Brief description of the story and its objectives]

## 🏗️ **ARCHITECTURAL DIRECTIVES - MANDATORY**

### **Design Pattern Compliance**
⚠️ **CRITICAL**: ALL implementation must follow established design patterns documented in [`docs/design/design-patterns.md`](../design/design-patterns.md). 

**Pattern deviations require architectural review and approval during user story planning.**

### **Backend Pattern Requirements**
- **Service Layer Pattern**: All business logic MUST use service interfaces with DI registration
- **Repository Pattern**: Database access MUST use Entity Framework DbContext patterns
- **Security Patterns**: Sensitive endpoints MUST use appropriate authorization attributes
- **Configuration Pattern**: Environment-specific settings MUST use appsettings files

### **Frontend Pattern Requirements**
- **Factory Pattern**: API services MUST use `createApiService()` factory - no direct imports
- **State Management Pattern**: ALL state MUST use Zustand stores (NO `useState` for application data)
- **Provider Pattern**: Context dependencies MUST use established provider patterns
- **Lazy Loading Pattern**: Large components MUST implement React.lazy() with Suspense

### **State Management Requirements**
⚠️ **CRITICAL**: Use Zustand stores for ALL state management - avoid local component state unless absolutely necessary for ephemeral UI state only (e.g., temporary hover states, input focus).

### **Implementation Patterns**
```typescript
// ✅ CORRECT Patterns
const { someState, someAction } = useSomeStore();           // Zustand state
const apiService = createApiService(mode);                   // Factory pattern
const { userProfile, updateProfile } = useAuthStore();      // Domain stores

// ❌ PROHIBITED Patterns  
const [someState, setSomeState] = useState('');            // Local state for app data
import realApiService from '../services/apiService';        // Direct service import
```

### **Pattern Compliance Checklist**
- [ ] Service layer pattern used for backend business logic
- [ ] Factory pattern used for API service creation
- [ ] Zustand stores used for ALL application state management
- [ ] Provider pattern used for context dependencies
- [ ] Security patterns followed for sensitive operations
- [ ] Configuration patterns used for environment settings
- [ ] No anti-patterns introduced (see design-patterns.md)

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