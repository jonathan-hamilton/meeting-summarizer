# Technical Debt & Known Issues

## Environment Variable Loading Issue

**Status**: Open  
**Priority**: Medium  
**Component**: Frontend (Vite/React)  
**Date Identified**: 2025-07-18  

### Description

The frontend Vite application is not properly loading the `VITE_API_BASE_URL` environment variable from `.env.local` file. Despite multiple attempts to clear cache and restart services, the application continues to use a cached/default value of `http://localhost:5003` instead of the configured `http://localhost:5029`.

### Current Workaround

Hardcoded the API base URL in `frontend/src/services/apiService.ts`:

```typescript
// Using hardcoded URL until environment variable issue is resolved
this.baseURL = 'http://localhost:5029';
```

### Environment Files Affected

- `frontend/src/services/apiService.ts` (line ~10)
- `frontend/.env.local` (created but not being read)

### Reproduction Steps

1. Set `VITE_API_BASE_URL=http://localhost:5029` in `.env.local`
2. Use `import.meta.env.VITE_API_BASE_URL` in apiService.ts
3. Restart Vite dev server
4. Environment variable returns undefined or cached value

### Attempted Solutions

- ✅ Created `.env.local` file with correct variable
- ✅ Restarted Vite development server multiple times
- ✅ Cleared browser cache and hard refresh
- ✅ Removed `dist/` and `node_modules/.vite` cache directories
- ✅ Closed/reopened VS Code completely
- ❌ Environment variable still not loaded correctly

### Next Steps

- [ ] Investigate Vite configuration for environment variable loading
- [ ] Check if there are conflicting environment files
- [ ] Consider using a different environment variable name
- [ ] Test with a fresh Vite project to isolate the issue
- [ ] Research Vite caching mechanisms

### Impact

Low - Application works with hardcoded URL, but reduces configurability and makes deployment more complex.

---

## Disabled Test Suite - S2.1 Test Coverage Infrastructure Issues

**Status**: Open  
**Priority**: Medium  
**Component**: Frontend Testing Infrastructure  
**Date Identified**: 2025-07-20  

### Issue Details

During Sprint 2.1 test coverage improvements, 27 comprehensive, well-written tests were developed but had to be disabled due to technical infrastructure issues. These tests are stored in `frontend/src/__tests__/disabled/` and represent significant development value that should be preserved and re-enabled when infrastructure issues are resolved.

### Disabled Test Files

**Location**: `frontend/src/__tests__/disabled/`

1. **Components** (`./components/`)
   - `App.test.tsx` - App component integration tests (7 tests)
   - `HealthCheck.test.tsx` - HealthCheck component tests (6 tests)

2. **Services** (`./services/`)
   - `apiService.test.ts` - API service tests (14 tests)

**Total**: 27 disabled tests providing comprehensive coverage

### Technical Issues

#### 1. File Handle Limit Issues (Component Tests)

- **Error**: `ENOSPC: no space left on device, watch 'node_modules/@mui/icons-material'`
- **Cause**: MUI component trees import hundreds of icon files, exceeding Node.js file handle limits
- **Impact**: Tests fail with file system errors during component rendering

#### 2. TypeScript Constructor Issues (Service Tests)

- **Error**: `"ApiService is not a constructor"`
- **Cause**: ES6 module mocking complexity with Vitest class instantiation
- **Impact**: Cannot properly mock ApiService class for testing

### Temporary Test Handling

Tests moved to `frontend/src/__tests__/disabled/` folder with:

- Comprehensive README documentation
- Vitest config exclusion: `'src/__tests__/disabled/**'`
- Preserved test code ready for re-enablement

### Test Files Affected

- `frontend/src/__tests__/disabled/` (entire folder)
- `frontend/vitest.config.ts` (exclusion configuration)
- `frontend/src/__tests__/disabled/README.md` (documentation)

### Resolution Required

#### For Component Tests

1. **System configuration**: Increase file descriptor limits (`ulimit -n 65536`)
2. **OR Mock strategy**: Implement extensive MUI component mocking
3. **OR Test environment**: Configure test runner for large component trees

#### For Service Tests

1. **Mocking strategy**: Implement proper ES6 class mocking with Vitest
2. **Architecture decision**: Choose between class vs instance mocking approach
3. **Type safety**: Resolve TypeScript strict mode mocking conflicts

### Impact on Development

**Priority**: High - Tests represent significant development investment

**Current**: 25 working tests provide core functionality coverage  
**Potential**: +27 disabled tests would increase coverage by ~30-40%  
**Value**: Significant development investment preserved for future enablement

### Action Plan

- [ ] Infrastructure sprint to resolve file handle limit issues
- [ ] Research and implement proper Vitest class mocking patterns
- [ ] Configure development/CI environments for complex component testing
- [ ] Establish testing guidelines for MUI component hierarchies
- [ ] Re-enable tests once infrastructure issues are resolved

---

## Future Issues

**Note**: Add new issues here as they are discovered
