# Test Coverage Plan - Target 90%

## Current Status Analysis

### ❌ **Current Issues (Test Failures)**
- **Mock Setup Problems**: Multiple tests failing due to incorrect mock configurations
- **Store Mocking**: Zustand store mocks not properly configured
- **API Service Mocks**: Missing default exports in mock configurations
- **Component Integration**: Tests not updated for current component architecture

### 📊 **Component Test Coverage Assessment**

#### ✅ **Existing Tests (Need Fixes)**
- FileUpload.test.tsx (FAILING - mock issues)
- SpeakerMappingDialog.test.tsx (FAILING - mock issues)
- SpeakerMapping.performance.test.tsx (FAILING - mock issues)

#### 🚨 **Missing Critical Component Tests**
- ActionItemsSection.tsx
- EmailCompositionDialog.tsx
- SummaryDisplay.tsx
- SummaryHeader.tsx
- TranscriptDisplay.tsx
- TranscriptSpeakerSegment.tsx
- TourPopover.tsx
- UpsertActionItemDialog.tsx
- SortableActionItem.tsx

#### 🚨 **Missing Store Tests**
- tourStore.ts (CRITICAL - complex process control logic)
- speakerSessionStore.ts (CRITICAL - main data management)
- summaryStore.ts
- userModeStore.ts
- enhancedSessionStore.ts

#### 🚨 **Missing Service Tests**
- apiService.ts integration tests
- sessionManager.ts edge cases
- All demo API services

## 90% Coverage Action Plan

### **Phase 1: Fix Existing Tests (Week 1)**

#### 1.1 Fix Mock Infrastructure
```typescript
// Priority 1: Fix vitest mock setup
- Update __tests__/mocks/apiServiceMocks.ts
- Fix Zustand store mocking patterns
- Create proper test utilities for component rendering
```

#### 1.2 Repair Failing Tests
- FileUpload.test.tsx: Fix API service mocking
- SpeakerMappingDialog.test.tsx: Fix store mocks
- SpeakerMapping.performance.test.tsx: Fix store integration

### **Phase 2: Critical Component Coverage (Week 2)**

#### 2.1 Core UI Components (40% of coverage target)
```typescript
// High-impact components for coverage
1. TranscriptDisplay.tsx - Complex display logic
2. SummaryDisplay.tsx - Action items and email integration  
3. ActionItemsSection.tsx - CRUD operations
4. EmailCompositionDialog.tsx - Email workflow
5. TourPopover.tsx - Tour system logic
```

#### 2.2 Tour System Testing (25% of coverage target)
```typescript
// tourStore.ts - Most complex business logic
- Process control methods (isActionDisabledDuringTour)
- Step management and transitions
- Tour state persistence
- Action validation for all 18 steps
```

### **Phase 3: Store and Service Coverage (Week 3)**

#### 3.1 Store Testing (20% of coverage target)
```typescript
// Critical data management
1. speakerSessionStore.ts - Data CRUD operations
2. summaryStore.ts - Summary and action items
3. userModeStore.ts - Mode switching logic
4. enhancedSessionStore.ts - Session management
```

#### 3.2 Service Integration (15% of coverage target)
```typescript
// API and service layer
1. apiService.ts - All endpoints with error handling
2. sessionManager.ts - Privacy-first session logic
3. Demo API services - Mock workflow testing
```

## Test Architecture Improvements

### **Modern Testing Stack**
```json
{
  "vitest": "Latest configuration with proper mocking",
  "@testing-library/react": "Component testing utilities", 
  "@testing-library/jest-dom": "DOM assertion matchers",
  "@testing-library/user-event": "User interaction simulation"
}
```

### **Test Categories & Coverage Targets**

#### 1. Unit Tests (50% of total coverage)
- Individual component logic
- Store methods and state transitions
- Utility functions and helpers
- **Target**: 45% overall coverage

#### 2. Integration Tests (30% of total coverage)
- Component + Store interactions
- API service integration
- Tour system workflow
- **Target**: 27% overall coverage

#### 3. End-to-End Workflow Tests (20% of total coverage)
- Complete user journeys
- Demo mode workflow
- Email composition flow
- **Target**: 18% overall coverage

## Implementation Timeline

### **Week 1: Foundation Repair**
- ✅ Fix all existing test failures
- ✅ Update mock infrastructure
- ✅ Establish proper test utilities
- **Target Coverage**: 15-20%

### **Week 2: Component Coverage**
- ✅ Add missing component tests
- ✅ Tour system comprehensive testing
- ✅ UI interaction testing
- **Target Coverage**: 50-60%

### **Week 3: Store & Service Coverage**
- ✅ Complete store test coverage
- ✅ API service integration tests
- ✅ Error handling and edge cases
- **Target Coverage**: 80-85%

### **Week 4: Final Push & Optimization**
- ✅ Performance testing
- ✅ Accessibility testing
- ✅ Edge case coverage
- ✅ Test optimization
- **Target Coverage**: 90%+

## Test Quality Standards

### **Required Test Types per Component**
1. **Rendering Tests**: Component mounts without errors
2. **Props Tests**: Handles all prop combinations correctly
3. **User Interaction**: All clickable elements and form inputs
4. **State Management**: Integration with stores
5. **Error Handling**: Graceful error states
6. **Accessibility**: ARIA compliance and keyboard navigation

### **Store Testing Requirements**
1. **State Initialization**: Proper default states
2. **Action Handlers**: All store methods
3. **State Transitions**: Complex state changes
4. **Persistence**: Session storage integration
5. **Error Recovery**: Invalid state handling

### **Coverage Quality Metrics**
- **Statements**: 90%+ (comprehensive logic coverage)
- **Branches**: 85%+ (conditional logic paths)
- **Functions**: 95%+ (all public methods tested)
- **Lines**: 90%+ (actual code execution)

## Critical Test Scenarios

### **Tour System (Highest Priority)**
```typescript
// Must test all 18 tour steps
- Step transitions and process control
- Button state management during tour
- Error recovery and tour cancellation
- Row-specific controls (Steps 6-7)
- Email workflow steps (11-18)
```

### **Speaker Management**
```typescript
// Core business logic
- Speaker detection and mapping
- CRUD operations on speakers
- Session-based overrides
- Cross-speaker drag & drop
```

### **Action Items**
```typescript
// User workflow
- AI action item conversion
- Manual action item creation
- Drag & drop between speakers
- CRUD operations with immediate feedback
```

### **Email Composition**
```typescript
// Complete email workflow
- Recipient selection and validation
- Content editing and preview
- Send functionality and error handling
- Demo vs production mode behavior
```

## Success Criteria

### **Coverage Thresholds**
- ✅ Overall Coverage: 90%+
- ✅ Critical Components: 95%+ (TranscriptDisplay, SummaryDisplay, TourPopover)
- ✅ Store Coverage: 90%+ (tourStore, speakerSessionStore)
- ✅ Service Coverage: 85%+ (apiService, sessionManager)

### **Quality Gates**
- ✅ Zero test failures
- ✅ All critical user journeys covered
- ✅ Performance tests passing
- ✅ Accessibility tests included
- ✅ Error handling thoroughly tested

### **Deployment Readiness**
- ✅ CI/CD integration with coverage reporting
- ✅ Automated test runs on all PRs
- ✅ Coverage gate preventing deployments under 90%
- ✅ Performance regression testing

## Resource Allocation

### **Estimated Effort**
- **Week 1**: 20 hours (Foundation repair)
- **Week 2**: 25 hours (Component coverage)
- **Week 3**: 25 hours (Store/Service coverage)
- **Week 4**: 15 hours (Optimization & edge cases)
- **Total**: 85 hours (~2 weeks full-time)

### **Priority Order**
1. Fix existing test infrastructure
2. Tour system comprehensive testing
3. Core component coverage
4. Store and service integration
5. Edge cases and performance testing
