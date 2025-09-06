# S5.4 Increment 0: Legacy Test Audit Results

**Date:** September 5, 2025  
**Purpose:** Identify and remove obsolete test files before modernization effort

## Test Files Analysis

### LEGACY TESTS (Removed)
1. **FileUpload.test.tsx** → MOVED to `disabled-legacy/`
   - **Reason:** Uses `apiService` direct import pattern
   - **Current Implementation:** FileUpload.tsx uses `createApiService` factory pattern
   - **Impact:** -1 test file, reduced complexity for FileUpload testing

### CURRENT TESTS (Keep and Modernize)

#### Component Tests
1. **FileUpload.modern.test.tsx** ✅ CURRENT
   - Uses `createApiService` factory pattern
   - Tests tour integration features
   - **Issue:** Provider context errors (useAppMode)

2. **SpeakerMapping.modern.test.tsx** ✅ CURRENT
   - Uses current store patterns (`useSpeakerSessionStore`, `useTourStore`)
   - Tests tour integration
   - **Issue:** Provider context errors, store mocking issues

3. **SpeakerMapping.performance.test.tsx** ✅ CURRENT
   - Tests S3.0 performance optimizations
   - Uses current Zustand store architecture
   - **Issue:** Provider context errors, memoization test failures

4. **SpeakerMappingDialog.test.tsx** ⚠️ MIXED (Needs Review)
   - Uses current store patterns (`useSpeakerSessionStore`)
   - **LEGACY PATTERN:** Mocks `apiService.saveSpeakerMappings` 
   - **ACTUAL COMPONENT:** SpeakerMappingDialog.tsx doesn't use any API service
   - **Action Required:** Remove API service mocks, focus on dialog state management

5. **TranscriptDisplay.simple.test.tsx** ✅ CURRENT
   - Uses `useSpeakerSessionStore` current pattern
   - **Issue:** Provider context errors, import resolution

#### Store Tests
6. **tourStore.test.ts** ✅ CURRENT
   - Tests current TourStore implementation
   - **Issue:** Logic errors in step advancement and process control

### PASSING TESTS (No Issues)
- Various utility and service tests (3 files passing)

## Summary

**Tests Removed:** 1 file (FileUpload.test.tsx - legacy API pattern)  
**Tests to Modernize:** 5 files (all use current architecture, need context/mock fixes)  
**Immediate Impact:** Reduced from 10 → 9 test files, focused effort on current implementation

## Next Actions

**Increment 1 Focus:** Fix provider context issues for all remaining component tests  
**SpeakerMappingDialog Special Case:** Remove legacy API service mocking, focus on pure dialog state management

**Estimated Time Saved:** 2-3 hours by not trying to fix the legacy FileUpload test

## Modernization Priority Order
1. **Infrastructure:** Fix AppModeProvider context issues (affects all component tests)
2. **Store Logic:** Fix TourStore step advancement issues
3. **Component Mocking:** Update SpeakerMappingDialog to remove API service legacy patterns  
4. **Integration:** Verify all tests use current architecture patterns consistently
