# Architectural Directive: Zustand Store Usage

## Problem Statement
Repeated instances of implementing local component state (`useState`, `useReducer`) instead of using the established Zustand store architecture have been identified in development work. This violates the application's architectural principles and creates inconsistencies.

## Mandatory Requirements

### 🚨 **CRITICAL DIRECTIVE**
**ALL state management MUST use Zustand stores** - local component state is only acceptable for truly ephemeral UI state (temporary hover states, input focus, etc.).

## Implementation Standards

### ✅ **Approved State Management**
- **Zustand Stores**: All application state, user data, dialog states, form data
- **Existing Stores**: 
  - `accessibilityStore.ts` - Accessibility features, announcements, dialog states
  - `speakerSessionStore.ts` - Speaker mapping persistence
  - `userProfileStore.ts` - User profile and account data
  - `tokenStore.ts` - Token balance and purchase state

### ❌ **Prohibited Patterns**
```typescript
// DON'T DO THESE:
const [dialogOpen, setDialogOpen] = useState(false);
const [userProfile, setUserProfile] = useState({});
const [tokenBalance, setTokenBalance] = useState(0);
const [announcement, setAnnouncement] = useState('');
const [formData, setFormData] = useReducer(reducer, initialState);
```

### ✅ **Correct Patterns**
```typescript
// DO THESE INSTEAD:
const { isDialogOpen, openDialog, closeDialog } = useAccessibilityStore();
const { userProfile, updateProfile } = useUserProfileStore();
const { tokenBalance, updateBalance } = useTokenStore();
const { announce } = useAccessibilityStore();
```

## Enforcement Mechanisms

### 1. **Implementation Plan Templates**
- All future implementation plans MUST include architectural directives section
- Template located: `docs/templates/implementation-plan-template.md`
- Plans must explicitly show store usage patterns for each increment

### 2. **Code Review Checklist**
- [ ] No `useState` for application state (only ephemeral UI state allowed)
- [ ] No `useReducer` for feature state
- [ ] All persistent state uses appropriate Zustand stores
- [ ] Dialog states managed through stores
- [ ] Form data persistence through stores

### 3. **Implementation Guidelines**
- **Dialog States**: Always use stores (`isDialogOpen`, `openDialog`, `closeDialog`)
- **User Data**: Always through `userProfileStore` or similar
- **Accessibility**: Always through `accessibilityStore` 
- **Announcements**: Always through `accessibilityStore.announce()`
- **Cross-Component State**: Always through appropriate stores

## Documentation Standards

### Implementation Plans Must Include:
```markdown
## 🏗️ **ARCHITECTURAL DIRECTIVES - MANDATORY**

### **State Management Requirements**
⚠️ **CRITICAL**: Use Zustand stores for ALL state management - avoid local component state unless absolutely necessary for ephemeral UI state only.

### **Store Usage Pattern:**
```typescript
// Example of correct store usage for this feature
const { stateProperty, actionMethod } = useAppropriateStore();
```
```

## Exceptions (Rare)
Local state is ONLY acceptable for:
- Temporary hover states
- Input focus management (not input values)
- Transient animation states
- Immediate UI feedback that doesn't need persistence

## Compliance Verification

### Before Implementation:
1. Check implementation plan includes architectural directives
2. Verify store usage patterns are specified
3. Confirm no local state planned for feature data

### During Implementation:
1. Use existing stores where applicable
2. Create new stores following established patterns
3. Avoid `useState`/`useReducer` for application features

### Code Review:
1. Verify no inappropriate local state usage
2. Confirm store integration is correct
3. Check state persistence works across components

## Resources

- **Template**: `docs/templates/implementation-plan-template.md`
- **Existing Stores**: Review `src/stores/` directory
- **Examples**: See `App.tsx` and `TranscriptDisplay.tsx` for correct patterns

## Escalation

If unsure about state management approach:
1. Review existing store patterns
2. Extend existing stores rather than creating local state
3. Create new store following established conventions
4. Document store usage in implementation plan