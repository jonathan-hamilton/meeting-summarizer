# Frontend Test Generator

**Role**: Expert QA Test Engineer specializing in React/TypeScript testing

**Command**: `#write-frontend-tests`

## Project Context

Target codebase: **Frontend** (React/TypeScript)

- Directory: `frontend/`
- Framework: React with TypeScript
- Testing: Vitest + React Testing Library + jest-dom
- Build: Vite

## 1. Requirements Analysis

Before generating tests, review:

- `docs/sprint_*_stories.md` - Review all available sprint files to determine current sprint and requirements
- `docs/meeting-summarizer-requirements.md` - Overall system requirements
- Existing tests in `frontend/src/__tests__/` for patterns and coverage gaps

**Sprint Detection Strategy:**
1. Scan `docs/` directory for `sprint_*_stories.md` files
2. Identify the highest numbered sprint file (e.g., `sprint_2_stories.md` = Sprint 2)
3. Use the latest sprint file as the current active sprint
4. Include previous sprint requirements for integration and regression testing

## 2. Test Scope Selection

Ask: "Would you like to:

1. Generate tests for a **specific React component**
2. Generate tests for **services/utilities**
3. Generate tests for **new/modified frontend code**
4. Add tests for **uncovered functionality**
5. Generate **integration tests** for complete workflows"

## 3. Code Analysis

### Component Analysis

- Identify React component props and state
- Map component dependencies and imports
- Detect hooks usage (useState, useEffect, custom hooks)
- Find user interaction points (clicks, form submissions, file uploads)
- Review conditional rendering logic
- Check accessibility requirements (ARIA labels, keyboard navigation)

### Service Analysis

- Map API service endpoints and methods
- Identify data transformation logic
- Find error handling patterns
- Review browser API usage (clipboard, file system)
- Check utility function inputs/outputs

### Existing Test Patterns

- Review `src/__tests__/setup.ts` for test configuration
- Analyze `src/__tests__/utils/testUtils.tsx` for helper functions
- Study existing component tests for mocking patterns
- Check `src/__tests__/mocks/` for reusable mock implementations

## 4. Framework Detection & Setup

### Vitest Configuration

- Verify `vitest.config.ts` settings
- Check test environment setup
- Validate jest-dom matcher availability
- Ensure proper TypeScript compilation

### Required Imports Pattern

```typescript
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
import { renderWithTheme } from "../utils/testUtils";
```

### Mock Patterns

```typescript
// Service mocking
vi.mock('../../services/apiService');

// MUI Icons mocking (prevent EMFILE errors)
vi.mock('@mui/icons-material', () => ({
  IconName: ({ 'data-testid': dataTestId, ...props }) => 
    <div data-testid={dataTestId || 'icon-name'} {...props} />
}));

// Browser API mocking
Object.assign(navigator, {
  clipboard: { writeText: vi.fn().mockResolvedValue(undefined) }
});
```

## 5. Test Structure Templates

### React Component Test

```typescript:src/__tests__/components/ComponentName.test.tsx
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
import ComponentName from "../../components/ComponentName";
import { renderWithTheme } from "../utils/testUtils";
import { mockData } from "../mocks/mockData";

// Mock dependencies
vi.mock('../../services/apiService');

describe('ComponentName', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render without crashing', () => {
      renderWithTheme(<ComponentName />);
      expect(screen.getByRole('main')).toBeInTheDocument();
    });

    it('should display required elements', () => {
      renderWithTheme(<ComponentName prop="value" />);
      expect(screen.getByText('Expected Text')).toBeInTheDocument();
    });
  });

  describe('User Interactions', () => {
    it('should handle button click', async () => {
      renderWithTheme(<ComponentName />);
      const button = screen.getByRole('button', { name: /button text/i });
      
      await userEvent.click(button);
      
      expect(/* expected result */).toBeTruthy();
    });
  });

  describe('Props Handling', () => {
    it('should render correctly with different props', () => {
      renderWithTheme(<ComponentName variant="secondary" />);
      expect(/* prop-specific behavior */).toBeTruthy();
    });
  });

  describe('Error States', () => {
    it('should handle error gracefully', () => {
      renderWithTheme(<ComponentName error="Error message" />);
      expect(screen.getByText('Error message')).toBeInTheDocument();
    });
  });
});
```

### Service/Utility Test

```typescript:src/__tests__/services/serviceName.test.ts
import { vi } from 'vitest';
import { serviceFunction } from '../../services/serviceName';

describe('serviceName', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('serviceFunction', () => {
    it('should return expected result for valid input', () => {
      // Arrange
      const input = 'valid input';
      
      // Act
      const result = serviceFunction(input);
      
      // Assert
      expect(result).toEqual('expected output');
    });

    it('should handle invalid input', () => {
      // Arrange
      const invalidInput = null;
      
      // Act & Assert
      expect(() => serviceFunction(invalidInput)).toThrow();
    });
  });
});
```

## 6. Test Coverage Focus

### Component Testing Priorities

- **Rendering**: All conditional rendering paths
- **Props**: All prop combinations and edge cases
- **State**: State changes and side effects
- **Events**: User interactions (click, input, form submission)
- **Accessibility**: ARIA labels, keyboard navigation, screen reader support
- **Error Boundaries**: Error handling and fallback UI

### Service Testing Priorities

- **API Calls**: All endpoint interactions with success/error scenarios
- **Data Transformation**: Input validation and output formatting
- **Browser APIs**: Clipboard, file handling, local storage
- **Error Handling**: Network failures, timeout scenarios
- **Edge Cases**: Boundary values, null/undefined inputs

### Integration Testing Focus

- **File Upload Workflow**: Complete file upload → transcription → display flow
- **Speaker Mapping**: End-to-end speaker identification and assignment
- **Error Recovery**: Full error handling across component boundaries

## 7. Execution Workflow

### Step 1: Analyze Requirements

1. **Detect Current Sprint:**
   - Scan `docs/` directory for `sprint_*_stories.md` files
   - Identify the highest numbered sprint file as current sprint
   - Review current sprint file for active requirements and acceptance criteria
2. **Review Requirements:**
   - Focus on current sprint stories for acceptance criteria
   - Include previous sprint requirements for integration testing
   - Check overall system requirements for context
3. **Assess Coverage:**
   - Identify components/services needing tests
   - Check existing test coverage gaps

### Step 2: Generate Tests

1. Choose target component/service
2. Analyze code structure and dependencies
3. Generate comprehensive test suite
4. Include all required mock setups

### Step 3: Validation

```bash
cd frontend/
npm run test ComponentName.test.tsx
npm run test:coverage
```

### Step 4: Integration

1. Ensure tests pass in CI/CD pipeline
2. Verify coverage meets project standards
3. Update test documentation

## 8. Quality Checklist

### Before Test Generation

- [ ] Requirements reviewed from sprint stories
- [ ] Existing tests analyzed for patterns
- [ ] Component/service dependencies mapped
- [ ] Mock strategies identified

### After Test Generation

- [ ] All test cases pass locally
- [ ] Coverage targets met
- [ ] No resource leaks (EMFILE errors resolved)
- [ ] Accessibility requirements covered
- [ ] Error scenarios included
- [ ] Integration workflows tested

### Test Quality Standards

- [ ] Clear test descriptions
- [ ] Proper arrange/act/assert structure
- [ ] Comprehensive edge case coverage
- [ ] Appropriate mock usage
- [ ] Fast execution (< 5s per suite)
