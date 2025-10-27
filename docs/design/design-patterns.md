# Design Patterns & Architectural Standards

## Overview

This document defines the mandatory design patterns used throughout the Meeting-Summary.io application. These patterns have been established through iterative development and must be followed for all new development. Deviations require architectural review and approval during user story planning.

**🚨 ENFORCEMENT**: All implementation plans, user stories, and code reviews must validate adherence to these patterns.

---

## 🏗️ **Mandatory Backend Patterns**

### 1. Service Layer Pattern
**Status:** ✅ **MANDATORY - Comprehensively Implemented**

**Requirements:**
- ✅ Every business service MUST have a corresponding interface
- ✅ All services MUST be registered via Dependency Injection in `Program.cs`
- ✅ Services MUST follow single responsibility principle
- ✅ Controllers MUST remain thin - business logic belongs in services

**Implementation Standard:**
```csharp
// 1. Define Interface
public interface IEmailVerificationService
{
    Task<string> GenerateVerificationTokenAsync(Guid userId);
    Task<bool> VerifyEmailAsync(string token);
}

// 2. Implement Service
public class EmailVerificationService : IEmailVerificationService
{
    // Implementation with proper logging, error handling
}

// 3. Register in Program.cs
builder.Services.AddScoped<IEmailVerificationService, EmailVerificationService>();

// 4. Inject in Controllers
public class AuthController : ControllerBase
{
    private readonly IEmailVerificationService _emailVerificationService;
    
    public AuthController(IEmailVerificationService emailVerificationService)
    {
        _emailVerificationService = emailVerificationService;
    }
}
```

**Enforcement:**
- ❌ **PROHIBITED**: Direct database access in controllers
- ❌ **PROHIBITED**: Business logic in controllers beyond validation and routing
- ❌ **PROHIBITED**: Services without interfaces (except simple utility services)

### 2. Repository Pattern (Entity Framework)
**Status:** ✅ **MANDATORY - Implemented via EF DbContext**

**Requirements:**
- ✅ All data access MUST go through Entity Framework `DbContext`
- ✅ Services MUST NOT contain raw SQL unless absolutely necessary
- ✅ Database migrations MUST be used for schema changes
- ✅ Entity relationships MUST be properly configured via Fluent API

**Implementation Standard:**
```csharp
public class EmailVerificationService
{
    private readonly MeetingSummarizerDbContext _context;
    
    public async Task<User> GetUserByTokenAsync(string token)
    {
        return await _context.Users
            .FirstOrDefaultAsync(u => u.EmailVerificationToken == token);
    }
}
```

### 3. Adapter Pattern 
**Status:** ✅ **ESTABLISHED - Use When Integrating External Services**

**Requirements:**
- ✅ External service integrations MUST use adapter pattern for API consistency
- ✅ Adapters MUST implement common interfaces for service interchangeability
- ✅ Legacy service integration MUST use adapters to avoid breaking changes

**Example:** `OpenAITranscriptionAdapter` adapts OpenAI service to `ITranscriptionService` interface

### 4. Composite Pattern
**Status:** ✅ **ESTABLISHED - Use for Service Orchestration**

**Requirements:**
- ✅ Multiple service providers MUST be orchestrated via composite pattern
- ✅ Failover logic MUST be implemented in composite services
- ✅ Configuration MUST drive service selection priority

**Example:** `CompositeTranscriptionService` orchestrates Azure Speech + OpenAI fallback

---

## 🎯 **Mandatory Frontend Patterns**

### 1. Factory Pattern (API Services)
**Status:** ✅ **MANDATORY - Mode-Aware Service Selection**

**Requirements:**
- ✅ ALL API service creation MUST use `createApiService()` factory
- ✅ Components MUST NOT directly import specific API service implementations
- ✅ Mode-specific behavior MUST be handled at the service layer, not component layer

**Implementation Standard:**
```typescript
// ✅ CORRECT - Factory Pattern Usage
import { createApiService } from '../services/apiServiceFactory';

const MyComponent: React.FC = () => {
  const { mode } = useAppMode();
  const apiService = createApiService(mode);
  
  // Use apiService...
};

// ❌ PROHIBITED - Direct Service Import
import realApiService from '../services/apiService';
```

**Enforcement:**
- ❌ **PROHIBITED**: Direct imports of `apiService`, `demoApiService`, or `mockApiService`
- ❌ **PROHIBITED**: Mode-specific logic in components
- ✅ **REQUIRED**: All API interactions through factory-created services

### 2. State Management Pattern (Zustand)
**Status:** 🚨 **CRITICAL DIRECTIVE - Architecturally Enforced**

**Requirements:**
- ✅ ALL application state MUST use Zustand stores
- ❌ React `useState` ONLY for ephemeral UI state (hover, focus, temporary animations)
- ✅ Dialog states, form data, user data MUST be managed through stores
- ✅ Cross-component communication MUST use stores, NOT prop drilling

**Implementation Standard:**
```typescript
// ✅ CORRECT - Zustand Store Usage
const { isDialogOpen, openDialog, closeDialog } = useAccessibilityStore();
const { userProfile, updateProfile } = useAuthStore();
const { announce } = useAccessibilityStore();

// ❌ PROHIBITED - Local Component State for Application Data
const [dialogOpen, setDialogOpen] = useState(false);
const [userProfile, setUserProfile] = useState({});
const [formData, setFormData] = useReducer(reducer, initialState);

// ✅ ACCEPTABLE - Ephemeral UI State Only
const [isHovered, setIsHovered] = useState(false);
const [inputFocused, setInputFocused] = useState(false);
```

**Store Architecture Requirements:**
- ✅ Domain-specific stores (auth, accessibility, tour, speaker, etc.)
- ✅ Actions and selectors co-located with state
- ✅ TypeScript interfaces for all store state
- ✅ Proper store composition for complex operations

**Recent Compliance Achievement (October 25, 2025):**
✅ **S8.4 FileUpload Component Refactoring**: Complete migration from React useState to Zustand uploadQueueStore
- Moved all application state (validationErrors, tokenError, pendingFile, dialogStates) to store
- Eliminated React useState pattern violations for application data
- Achieved full design pattern compliance in upload flow architecture
- Maintained ephemeral UI state appropriately (hover, focus states)

### 3. Provider Pattern (React Context)
**Status:** ✅ **ESTABLISHED - Context-Based Dependency Injection**

**Requirements:**
- ✅ Application-wide dependencies MUST use React Context providers
- ✅ Mode detection and API service provision MUST use provider pattern
- ✅ Testing MUST use universal provider wrappers for consistency

**Implementation Standard:**
```typescript
// App-level providers
<AppModeProvider>
  <ApiProvider>
    <AccessibilityProvider>
      <App />
    </AccessibilityProvider>
  </ApiProvider>
</AppModeProvider>

// Component usage
const { mode } = useAppMode();
const { apiService } = useApi();
const { announce } = useAccessibility();
```

### 4. Lazy Loading Pattern
**Status:** ✅ **ESTABLISHED - Performance Optimization**

**Requirements:**
- ✅ Large dialog components MUST use React.lazy() for code splitting
- ✅ Suspense boundaries MUST provide skeleton loading states
- ✅ Critical path components MUST be eagerly loaded
- ✅ Bundle analysis MUST validate optimization impact

**Implementation Standard:**
```typescript
// Lazy loading with Suspense
const EmailCompositionDialog = React.lazy(() => import("./EmailCompositionDialog"));

<Suspense fallback={<Skeleton variant="rectangular" height={600} />}>
  {showDialog && <EmailCompositionDialog />}
</Suspense>
```

---

## 🔒 **Security Patterns**

### 1. Attribute-Based Authorization
**Status:** ✅ **ESTABLISHED - Endpoint Protection**

**Requirements:**
- ✅ Sensitive endpoints MUST use custom authorization attributes
- ✅ Feature-specific requirements MUST be enforced via attributes
- ✅ Authorization logic MUST be testable and reusable

**Example:** `RequireEmailVerificationAttribute` for email-verified endpoints

### 2. Token-Based Security
**Status:** ✅ **ESTABLISHED - Secure Token Management**

**Requirements:**
- ✅ Verification tokens MUST be cryptographically secure
- ✅ Tokens MUST have expiration times
- ✅ Single-use tokens MUST be invalidated after use
- ✅ Rate limiting MUST prevent token abuse

---

## � **Mobile & Cross-Browser Patterns**

### 1. Progressive Enhancement Pattern
**Status:** ✅ **ESTABLISHED - Sprint 8 Mobile-First Implementation**

**Requirements:**
- ✅ Mobile-first responsive design MUST be implemented across all components
- ✅ Touch targets MUST meet 44px minimum size requirement (iOS HIG compliance)
- ✅ Desktop functionality MUST be preserved through progressive enhancement
- ✅ Responsive breakpoints MUST use Material-UI theme system consistently

**Implementation Standard:**
```typescript
// Progressive enhancement for mobile vs desktop
const theme = useTheme();
const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

// Touch-optimized components
<Button 
  sx={{ 
    minHeight: 44, // iOS HIG compliance
    minWidth: 44,
    ...theme.spacing(2) // Consistent touch spacing
  }}
>
```

### 2. iOS Safari Compatibility Pattern
**Status:** ✅ **ESTABLISHED - Sprint 8.7 iOS Safari Enhancement**

**Requirements:**
- ✅ iOS Safari MUST use visible file input approach (not hidden + programmatic triggering)
- ✅ File format filtering MUST be iOS-compatible (MP3, M4A, WAV, MP4)
- ✅ User guidance MUST inform iOS Safari users about local storage requirements
- ✅ Progressive enhancement MUST maintain desktop file upload functionality

**Implementation Standard:**
```typescript
// iOS Safari detection and specialized handling
const isIOSSafari = () => {
  const ua = navigator.userAgent;
  return /iPad|iPhone|iPod/.test(ua) && /Safari/.test(ua) && !/Chrome/.test(ua);
};

// iOS Safari file upload component
if (isIOSSafari()) {
  return <IOSSafariFileUpload />; // Visible input approach
} else {
  return <FileDropzone />; // Full desktop experience
}
```

**Enforcement:**
- ✅ **REQUIRED**: iOS Safari MUST use research-based compatibility approaches
- ❌ **PROHIBITED**: Hidden file inputs with programmatic triggering on iOS Safari
- ✅ **REQUIRED**: User education about cloud storage limitations for iOS Safari

---

## �📊 **Data Patterns**

### 1. Entity Framework Patterns
**Status:** ✅ **ESTABLISHED - Database Access**

**Requirements:**
- ✅ Database schema changes MUST use Code First migrations
- ✅ Entity relationships MUST be explicitly configured
- ✅ Query optimization MUST use proper includes and projections
- ✅ Audit fields (CreatedAt, UpdatedAt) MUST be consistent across entities

### 2. Configuration Pattern
**Status:** ✅ **ESTABLISHED - Environment-Specific Configuration**

**Requirements:**
- ✅ Environment-specific settings MUST use appsettings files
- ✅ Sensitive configuration MUST support Azure Key Vault
- ✅ Configuration validation MUST occur at startup
- ✅ Feature flags MUST be configuration-driven

---

## 🧪 **Testing Patterns**

### 1. Test Provider Pattern
**Status:** ✅ **ESTABLISHED - Universal Test Setup**

**Requirements:**
- ✅ ALL component tests MUST use `renderWithProviders()` utility
- ✅ Context providers MUST be consistently mocked across tests
- ✅ Store mocking MUST support both hook and getState() patterns

### 2. Factory Pattern for Test Mocks
**Status:** ✅ **ESTABLISHED - API Service Testing**

**Requirements:**
- ✅ API service mocks MUST use factory pattern
- ✅ Mode-specific behavior MUST be testable
- ✅ Mock setup MUST be consistent across all test files

---

## 🚫 **Anti-Patterns & Prohibitions**

### Backend Anti-Patterns
- ❌ **Business logic in controllers** - Use services
- ❌ **Direct database access in controllers** - Use service layer
- ❌ **Services without interfaces** - Breaks testability and DI
- ❌ **Static dependencies** - Prevents testing and flexibility
- ❌ **Raw SQL without justification** - Use Entity Framework

### Frontend Anti-Patterns  
- ❌ **Local state for application data** - Use Zustand stores
- ❌ **Direct API service imports** - Use factory pattern
- ❌ **Prop drilling for global state** - Use context providers
- ❌ **Inline styles for complex UI** - Use Material-UI system
- ❌ **Component logic in JSX** - Extract to custom hooks or services

### General Anti-Patterns
- ❌ **Tight coupling between layers** - Use interfaces and dependency injection
- ❌ **Hardcoded configuration values** - Use configuration files
- ❌ **Inconsistent error handling** - Follow established patterns
- ❌ **Missing TypeScript types** - All interfaces must be typed

---

## 🔄 **Pattern Evolution Process**

### When to Introduce New Patterns
New design patterns may be introduced only when:

1. **Existing patterns cannot solve the problem** - Documented analysis required
2. **Industry standard patterns provide clear benefit** - Cost/benefit analysis required  
3. **Technical debt reduction justifies pattern change** - Migration plan required
4. **Performance requirements demand new approach** - Benchmarking required

### Pattern Change Approval Process

**📋 MANDATORY PROCESS FOR PATTERN CHANGES:**

1. **User Story Planning Stage:**
   - Pattern deviation MUST be identified during story planning
   - Alternative approaches MUST be evaluated
   - Architectural review MUST occur before implementation
   - Migration impact MUST be assessed

2. **Implementation Planning:**
   - Implementation plans MUST justify pattern deviations
   - Pattern compliance MUST be validated in architectural directives section
   - Code review checklist MUST include pattern validation

3. **Documentation Updates:**
   - This document MUST be updated when patterns change
   - Migration guides MUST be created for breaking pattern changes
   - Training materials MUST be updated to reflect new patterns

### Pattern Compliance Validation

**Code Review Requirements:**
- [ ] Service layer pattern compliance validated
- [ ] Zustand state management pattern followed
- [ ] Factory pattern used for API services
- [ ] Provider pattern used for context dependencies
- [ ] Security patterns followed for sensitive operations
- [ ] Testing patterns implemented for new functionality

**Implementation Plan Requirements:**
- [ ] Architectural directives section includes pattern validation
- [ ] Pattern deviations explicitly documented and justified
- [ ] Migration plan provided for pattern-breaking changes
- [ ] Testing approach validates pattern compliance

---

## 📚 **Integration with Documentation Ecosystem**

This design patterns document is referenced by:

- **Implementation Plans** - Must validate pattern compliance in architectural directives
- **User Story Planning** - Pattern deviations identified during planning phase
- **Code Review Process** - Pattern compliance validated during reviews
- **Architecture Documentation** - Technical foundation for system design
- **Testing Guidelines** - Pattern-specific testing approaches documented
- **Zustand Store Directive** - Specific enforcement of state management patterns

**Pattern Enforcement Tools:**
- Implementation plan templates require architectural directives section
- Code review checklists include pattern validation
- Documentation update process ensures pattern consistency
- Testing standards validate pattern compliance

---

## 📖 **References & Further Reading**

**Internal Documentation:**
- `docs/design/zustand-store-directive.md` - State management enforcement
- `docs/features/architecture.md` - System architecture overview
- `docs/technical-improvements/architecture-decisions.md` - Historical decisions
- `.prompts/documentation-ecosystem-overview.md` - Complete documentation workflow
- `.prompts/update-commit.md` - Documentation update process

**Pattern Implementation Examples:**
- Backend: `MeetingSummarizer.Api/Services/` - Service layer pattern examples
- Frontend: `frontend/src/services/apiServiceFactory.ts` - Factory pattern implementation
- Testing: `frontend/src/__tests__/` - Testing pattern examples
- State Management: `frontend/src/stores/` - Zustand pattern implementations

**External References:**
- Martin Fowler's Enterprise Application Patterns
- Microsoft .NET Architecture Guides  
- React Patterns Documentation
- Zustand State Management Patterns

---

*This document is living architecture documentation. It must be updated whenever design patterns are modified, added, or deprecated. All changes require architectural review and approval through the user story planning process.*