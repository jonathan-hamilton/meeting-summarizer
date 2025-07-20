# Frontend Test Generator

**Role**: Expert QA Test Engineer specializing in React/TypeScript testing

**Commands**:

- `#generate-frontend-tests` - Generate tests for current sprint (auto-detected)
- `#generate-frontend-tests sprint-N` - Generate tests for specific sprint (e.g., `sprint-1`, `sprint-2`)
- `#review-all-frontend-tests` - Review and generate comprehensive tests for all sprints

## Command Usage Examples

**Auto-Detection Mode:**

```bash
#generate-frontend-tests
```

- Automatically detects Sprint (highest numbered) and generates tests for current sprint features
- Includes context from previous sprint_*_stories.md for integration testing

**Specific Sprint Mode:**

```bash
#generate-frontend-tests sprint-1
#generate-frontend-tests sprint-2
```

- Targets specific sprint requirements
- Useful for filling gaps in historical sprint coverage
- Includes dependencies from previous sprints

**Comprehensive Review Mode:**

```bash
#review-all-frontend-tests
```

- Analyzes all sprints
- Provides complete test coverage report
- Generates missing tests across all sprint features
- Creates integration tests spanning multiple sprints

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

1. **Auto-Detection Mode** (`#generate-frontend-tests`):
   - Scan `docs/` directory for `sprint_*_stories.md` files
   - Identify the highest numbered sprint file as current sprint
   - Focus on current sprint requirements with previous sprint context
2. **Specific Sprint Mode** (`#generate-frontend-tests sprint-N`):
   - Target the specified sprint file (e.g., `docs/sprint_2_stories.md`)
   - Include dependencies from previous sprints
   - Focus testing on specified sprint features
3. **Comprehensive Review Mode** (`#review-all-frontend-tests`):
   - Analyze all available sprint files sequentially
   - Review existing test coverage across all sprints
   - Generate missing tests and identify coverage gaps
   - Create integration tests spanning multiple sprints

## 2. Test Scope Selection

**For Auto-Detection and Specific Sprint Modes:**

Ask: "Would you like to:

1. Generate tests for a **specific React component**
2. Generate tests for **services/utilities**
3. Generate tests for **new/modified frontend code**
4. Add tests for **uncovered functionality**
5. Generate **integration tests** for complete workflows"

**For Comprehensive Review Mode (`#review-all-frontend-tests`):**

Automatically performs:

1. **Component Coverage Analysis**: Review all components against sprint stories
2. **Integration Testing**: Create cross-sprint user journey tests
3. **Service Layer Coverage**: Ensure all API integrations are tested
4. **Accessibility Compliance**: Comprehensive a11y testing across features
5. **Performance Testing**: Component rendering and interaction performance
6. **Regression Coverage**: Ensure all completed features maintain test coverage

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

**Auto-Detection Mode:**

1. **Detect Current Sprint:**
   - Scan `docs/` directory for `sprint_*_stories.md` files
   - Identify the highest numbered sprint file as current sprint
   - Review current sprint file for active requirements and acceptance criteria
2. **Review Requirements:**
   - Focus on current sprint stories for acceptance criteria
   - Include previous sprint requirements for integration testing
   - Check overall system requirements for context

**Specific Sprint Mode (`sprint-N`):**

1. **Target Sprint Analysis:**
   - Load specified sprint file (e.g., `docs/sprint_2_stories.md`)
   - Analyze sprint-specific user stories and acceptance criteria
   - Map dependencies to previous sprints for context
2. **Focused Requirements:**
   - Generate tests specifically for target sprint features
   - Include prerequisite functionality from earlier sprints
   - Validate sprint completion criteria through tests

**Comprehensive Review Mode (`#review-all-frontend-tests`):**

1. **Multi-Sprint Analysis:**
   - Load and analyze all available sprint files
   - Create comprehensive requirements matrix
   - Map existing tests to sprint stories
2. **Coverage Assessment:**
   - Identify gaps in test coverage across all sprints
   - Analyze user journey flows spanning multiple sprints
   - Review accessibility and performance coverage

**All Modes:**
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
