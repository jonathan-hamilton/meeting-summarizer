# Implementation Compliance Checklist

**MANDATORY PRE-IMPLEMENTATION CHECK - USE BEFORE ANY CODE CHANGES**

## ⚠️ CRITICAL REQUIREMENTS CHECK

### State Management Compliance ✅
- [ ] **LOCAL STATE JUSTIFIED**: If using `useState`/`useReducer`, is it for legitimate ephemeral UI state only?
- [ ] **STORE STATE REQUIRED**: Am I using Zustand stores for cross-component, persistent, or accessibility state?
- [ ] **STORE INTEGRATION**: Does this integrate with `accessibilityStore`, `speakerSessionStore`, or other established stores?
- [ ] **ARCHITECTURAL COMPLIANCE**: Does this follow the mandatory Zustand store directives in implementation plans?

### Command Syntax Compliance ✅  
- [ ] **POWERSHELL ONLY**: Am I using PowerShell syntax for all terminal commands?
- [ ] **NO UNIX COMMANDS**: Have I avoided `npm run dev`, `cd folder &&`, or Unix-style syntax?
- [ ] **PROPER SYNTAX**: Using `Set-Location` instead of `cd`, PowerShell operators instead of Unix ones?

### Documentation Directive Compliance ✅
- [ ] **REVIEW DIRECTIVES**: Have I reviewed the relevant implementation plan architectural directives?
- [ ] **FOLLOW PATTERNS**: Am I following established patterns from existing store implementations?
- [ ] **TEMPLATE COMPLIANCE**: Does this match the implementation template patterns?

## 🔍 POST-IMPLEMENTATION VERIFICATION

### Code Review ✅
- [ ] **NO USESTATE VIOLATIONS**: Scanned code for `useState`, `useReducer`, local state patterns
- [ ] **STORE USAGE VERIFIED**: Confirmed all state management uses Zustand stores
- [ ] **COMMAND SYNTAX VERIFIED**: All terminal commands use PowerShell syntax
- [ ] **PATTERN CONSISTENCY**: Code follows established architectural patterns

### Integration Check ✅
- [ ] **EXISTING STORE INTEGRATION**: Properly integrated with existing stores without conflicts
- [ ] **NO ARCHITECTURAL VIOLATIONS**: No anti-patterns or violations of documented directives
- [ ] **PROPER IMPORTS**: Importing from correct stores and following established patterns

## 🎯 SPECIFIC S6.6 ACCESSIBILITY CHECKS

### Modal Management ✅
- [ ] **ACCESSIBILITY STORE**: Using `useAccessibilityStore()` for modal state management
- [ ] **NO DIALOG LOCAL STATE**: Not using local state for dialog open/close status
- [ ] **FOCUS MANAGEMENT**: Using store-based focus restoration and management
- [ ] **PROPER ANNOUNCEMENTS**: Using store announcement functions for screen readers

### Focus Trap Integration ✅
- [ ] **FOCUS-TRAP-REACT**: Using focus-trap-react library for modal focus containment
- [ ] **STORE INTEGRATION**: Focus management integrated with accessibility store
- [ ] **NO LOCAL FOCUS STATE**: Not managing focus state in local component state

## ⚡ EMERGENCY STOP CONDITIONS

**STOP IMPLEMENTATION IF:**
- ❌ I find myself writing `useState` or `useReducer`
- ❌ I'm writing `npm run` or Unix-style commands
- ❌ I'm not using established Zustand store patterns
- ❌ I'm violating documented architectural directives

**INSTEAD:**
1. ✅ Reference the accessibility store implementation
2. ✅ Use PowerShell command syntax
3. ✅ Follow established Zustand patterns
4. ✅ Review implementation plan directives

## 📋 IMPLEMENTATION PATTERN REFERENCE

### ✅ CORRECT Store Usage (Cross-Component/Persistent State)
```typescript
// Use existing accessibility store for modal management
const { openModal, closeModal, announceModalOpen } = useAccessibilityStore();

// Integration with effects
useEffect(() => {
  if (open) {
    openModal(modalId);
  }
}, [open, openModal, modalId]);
```

### ✅ LEGITIMATE Local State (Ephemeral UI State)
```typescript
// ACCEPTABLE - Component-specific temporary state
const [isLoading, setIsLoading] = useState(false);
const [inputValue, setInputValue] = useState('');
const [isHovering, setIsHovering] = useState(false);
const [error, setError] = useState<string | null>(null);
```

### ❌ PROHIBITED Local State (Should Use Store)
```typescript
// DON'T DO THIS - Cross-component/persistent state
const [isModalOpen, setIsModalOpen] = useState(false); // Use accessibilityStore
const [speakers, setSpeakers] = useState([]); // Use speakerSessionStore
const [announcement, setAnnouncement] = useState(''); // Use accessibilityStore
```

## 🎯 STATE MANAGEMENT DECISION MATRIX

### ✅ USE ZUSTAND STORE WHEN:
- State persists across component unmounts
- State is shared between multiple components  
- State affects accessibility (modals, announcements, focus)
- State represents business data or user preferences
- State needs to be accessed globally

### ✅ USE LOCAL STATE WHEN:
- Temporary UI interactions (hover, focus, animation)
- Form input values before submission/validation
- Loading/error states for component-specific async operations
- Component-internal state that never leaves the component
- Side effects and derived state calculations

### ✅ CORRECT PowerShell Commands
```powershell
# Use PowerShell syntax
Set-Location frontend
npm run build
```

### ❌ PROHIBITED Unix Commands  
```bash
# DON'T DO THIS - Unix syntax violation
cd frontend && npm run build
```

---

**USE THIS CHECKLIST BEFORE EVERY IMPLEMENTATION**  
**VERIFY COMPLIANCE BEFORE SUBMITTING CODE**