# MUI Icon Mocking & Test Patterns for This Project

## Why Mock MUI Icons?
Material-UI (MUI) icons import hundreds of SVG files, which can cause "too many open files" (EMFILE) errors in large test suites. To avoid this, we globally mock all MUI icons in our test setup.

## Common Causes of Test Hanging

### 🚨 **Primary Hanging Causes:**
1. **Incomplete MUI Component Mocking** - Only mocking icons while using real MUI components like `Menu`, `MenuItem`, `IconButton`
2. **Missing ThemeProvider** - Not using the custom render utility that includes theme provider
3. **Complex Component Dependencies** - Real MUI components with portals, event listeners, and async behavior
4. **Missing Icon Mocks** - Icons not covered by global proxy mock causing file handle issues

### 🔧 **Solutions That Work:**
- **Mock ALL MUI components** used by your component, not just icons
- **Use custom render utility** from `test/utils/render` (includes theme provider)
- **Mock child components** that have complex dependencies
- **Keep mocks simple** - return basic HTML elements with test IDs

## How to Mock MUI Icons

### 1. Global Mocking (Preferred)
- The file `src/test/setup.ts` globally mocks all `@mui/icons-material` imports using `vi.mock` and a Proxy.
- This ensures that any icon import returns a lightweight mock component, preventing file handle exhaustion.

**Example (from setup.ts):**
```ts
vi.mock('@mui/icons-material', () => {
  const MockIcon = () => null;
  return new Proxy({}, {
    get: () => MockIcon,
    has: () => true,
    ownKeys: () => [],
    getOwnPropertyDescriptor: () => ({ enumerable: true, configurable: true })
  });
});
```

### 2. Adding New Icon Mocks to Setup
When you create a component that uses new MUI icons, add them to `src/test/setup.ts`:

```ts
// Add to src/test/setup.ts
vi.mock('@mui/icons-material/NewIcon', () => ({
  default: () => null,
}));
```

**Icons currently mocked in setup.ts:**
- Search, CheckCircle, Error, ErrorOutline
- ChevronRight, ChevronLeft, PushPin
- Star, StarBorder, Home, Menu
- Settings, Help, Person, Logout, Business, Info

**When to add new mocks:**
- ✅ Component uses icon that's not in the list above
- ✅ Test fails with "Module not found" for an icon
- ✅ Adding a new component with icons to prevent future issues

### 3. Per-Test Icon Mocking (Rarely Needed)
If you need a specific icon to have a test id or custom behavior in a test file, you can add a targeted mock at the top of your test:
```ts
import { vi } from 'vitest';
vi.mock('@mui/icons-material/Search', () => ({
  __esModule: true,
  default: (props: any) => <svg data-testid="SearchIcon" {...props} />,
}));
```

## Best Practices for Writing Tests

### ✅ **DO:**
- **Use the custom render utility:** `import { render } from '../../test/utils/render'` (includes theme provider)
- **Mock ALL MUI components** your component uses, not just icons
- **Keep mocks simple** - return basic HTML elements with data-testid attributes
- **Focus on behavior** - test component logic, not MUI rendering details
- **Add missing icon mocks** to `src/test/setup.ts` when needed

### ❌ **DON'T:**
- **Import real MUI icons in tests** - always rely on global mocks
- **Use real MUI components** without mocking in complex component tests
- **Test MUI-specific behavior** like menu closing on outside clicks
- **Import ThemeProvider manually** - use the custom render utility instead
- **Check for icon SVG content** - use test IDs or presence assertions instead

### 🎯 **Working Test Pattern (Based on ProfileMenu Success):**
```ts
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '../../test/utils/render'; // Custom render with theme
import userEvent from '@testing-library/user-event';
import MyComponent from './MyComponent';

// Mock ALL MUI components to prevent hanging
vi.mock('@mui/material', () => ({
  Menu: ({ children, open }: any) => (
    open ? <div role="menu" data-testid="menu">{children}</div> : null
  ),
  MenuItem: ({ children, onClick }: any) => (
    <div role="menuitem" onClick={onClick} data-testid="menu-item">{children}</div>
  ),
  IconButton: ({ children, onClick, ...props }: any) => (
    <button 
      onClick={onClick} 
      aria-label={props['aria-label']}
      aria-expanded={props['aria-expanded'] || 'false'}
      data-testid="icon-button"
    >
      {children}
    </button>
  ),
  // ... mock other MUI components as needed
}));

// Mock MUI icons (rely on global mocks or add specific ones)
vi.mock('@mui/icons-material', () => ({
  Search: () => <div data-testid="search-icon" />,
  Settings: () => <div data-testid="settings-icon" />,
  // Keep icon mocks simple - no text content to avoid conflicts
}));

describe('MyComponent', () => {
  it('renders and behaves correctly', async () => {
    const user = userEvent.setup();
    render(<MyComponent />); // Uses custom render with theme
    
    // Test behavior, not rendering details
    const button = screen.getByTestId('my-button');
    await user.click(button);
    
    expect(screen.getByTestId('expected-result')).toBeInTheDocument();
  });
});
```

## Troubleshooting Test Hanging Issues

### 🔍 **Symptoms:**
- Test runner starts but hangs indefinitely
- No error messages, just stuck on "RUN" status
- Tests work individually but hang in suite
- Terminal shows "Terminate batch job (Y/N)?" when interrupted

### 🔎 **Debugging Steps:**
1. **Check MUI component usage** - Are you using real `Menu`, `Dialog`, `Drawer`, or other complex components?
2. **Verify render utility** - Are you using `render` from `test/utils/render` or raw `@testing-library/react`?
3. **Review mocks** - Are ALL MUI components used by your component mocked?
4. **Check icon imports** - Are there new icons not covered by setup.ts mocks?

### 🛠️ **Quick Fixes:**
- **Add comprehensive MUI mocks** at the top of your test file
- **Switch to custom render utility** instead of manual ThemeProvider wrapping
- **Mock child components** that use complex MUI features
- **Add missing icon mocks** to `src/test/setup.ts`

### ⚠️ **Common Gotchas:**
- **Portals and overlays** - MUI components like Menu create portals that can cause hanging
- **Event listeners** - Real MUI components add global event listeners that tests can't clean up
- **Async rendering** - Complex MUI components have async behavior that mocks avoid
- **Theme dependencies** - Components expecting theme context that's not provided

## Real Example: ProfileMenu Test Fix

**❌ Before (Hanging):**
```ts
import { render } from '@testing-library/react';
import { ThemeProvider } from '@mui/material/styles';
// Used real MUI Menu, MenuItem, IconButton components
// Manual ThemeProvider wrapping
```

**✅ After (Working):**
```ts
import { render } from '../../test/utils/render';
// Mocked ALL MUI components: Menu, MenuItem, IconButton, Avatar, etc.
// Used custom render utility with theme included
// Added missing icon mocks to setup.ts
```

---

## 🎯 **Key Takeaway**
**Test hanging is usually caused by using real MUI components, not just missing icon mocks.** 

The solution is comprehensive mocking:
1. **Mock ALL MUI components** used by your component
2. **Use the custom render utility** from `test/utils/render`  
3. **Add missing icon mocks** to `src/test/setup.ts`
4. **Focus on testing behavior**, not MUI rendering details

**Always use the global icon mock for new tests unless you have a specific reason to override it.**
