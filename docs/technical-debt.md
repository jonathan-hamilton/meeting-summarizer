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

### Files Affected
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

## Future Issues
*Add new issues here as they are discovered*
