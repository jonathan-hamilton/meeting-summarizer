# Unit Test Generator

## Project Context Detection

First, identify the target codebase:

- **Frontend** (React/TypeScript): `frontend/` directory with Vitest/Jest
- **API** (.NET C#): `MeetingSummarizer.Api/` directory with MSTest/xUnit
- **Both**: Generate tests for both codebases (requires separate execution)

## 1. Test Scope Selection

Ask: "Would you like to:

1. Generate tests for **Frontend** code (React components, services, utilities)
2. Generate tests for **API** code (Controllers, services, models)
3. Generate tests for a specific file/component
4. Generate tests for new/modified code
5. Add tests for uncovered functionality"

## 2. Code Analysis

### For Frontend Code

- Identify React component props and state
- Map component dependencies and imports
- Detect hooks usage (useState, useEffect, custom hooks)
- Find user interaction points (clicks, form submissions)
- Review existing test patterns in `src/__tests__/`

### For API Code

- Identify controller actions and HTTP methods
- Map service dependencies and dependency injection
- Detect data models and validation attributes
- Find business logic and edge cases
- Review existing test patterns in test projects

## 3. Test Framework Detection

### Frontend Detection

- Check for Vitest/Jest configuration
- Identify React Testing Library usage
- Match existing component test patterns
- Detect mock patterns for services/APIs

### API Detection

- Check for MSTest, xUnit, or NUnit
- Identify test project structure
- Match existing controller/service test patterns
- Detect mock patterns for dependencies

## 4. Generate Test Suite

Based on detected codebase and framework, generate appropriate test structure.

### Frontend Test Structures

#### React Component Test (Vitest + Testing Library)

```typescript:src/__tests__/components/Component.test.tsx
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
import Component from "../../components/Component";
import { renderWithTheme } from "../utils/testUtils";

// Mock external dependencies
vi.mock('../../services/apiService');

describe('Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render correctly', () => {
    renderWithTheme(<Component />);
    expect(screen.getByText('Expected Text')).toBeInTheDocument();
  });
  
  it('should handle user interaction', async () => {
    renderWithTheme(<Component />);
    const button = screen.getByRole('button');
    
    await userEvent.click(button);
    
    expect(/* expected result */).toBeTruthy();
  });
});
```

#### Service/Utility Test (Vitest)

```typescript:src/__tests__/services/service.test.ts
import { vi } from 'vitest';
import { serviceFunction } from '../../services/service';

describe('serviceFunction', () => {
  it('should return expected result', () => {
    // Arrange
    const input = 'test';
    
    // Act
    const result = serviceFunction(input);
    
    // Assert
    expect(result).toEqual('expected');
  });
});
```

### API Test Structures

#### Controller Test (MSTest)

```csharp:MeetingSummarizer.Api.Tests/Controllers/ControllerTests.cs
using Microsoft.VisualStudio.TestTools.UnitTesting;
using Microsoft.AspNetCore.Mvc;
using Moq;
using MeetingSummarizer.Api.Controllers;
using MeetingSummarizer.Api.Services;

[TestClass]
public class ControllerTests
{
    private Mock<IService> _mockService;
    private Controller _controller;

    [TestInitialize]
    public void Setup()
    {
        _mockService = new Mock<IService>();
        _controller = new Controller(_mockService.Object);
    }

    [TestMethod]
    public async Task GetAsync_ReturnsOkResult()
    {
        // Arrange
        _mockService.Setup(s => s.GetAsync()).ReturnsAsync("test");

        // Act
        var result = await _controller.GetAsync();

        // Assert
        Assert.IsInstanceOfType(result, typeof(OkObjectResult));
    }
}
```

#### Service Test (MSTest)

```csharp:MeetingSummarizer.Api.Tests/Services/ServiceTests.cs
using Microsoft.VisualStudio.TestTools.UnitTesting;
using MeetingSummarizer.Api.Services;

[TestClass]
public class ServiceTests
{
    [TestMethod]
    public void Method_WithValidInput_ReturnsExpectedResult()
    {
        // Arrange
        var service = new Service();
        var input = "test";

        // Act
        var result = service.Method(input);

        // Assert
        Assert.AreEqual("expected", result);
    }
}
```

For Java (JUnit):

``` Java
import org.junit.Test;
import static org.junit.Assert.*;

public class ComponentTest {
    @Test
    public void shouldBehaveAsExpected() {
        // Arrange
        // Act
        // Assert
    }
    
    @Test
    public void shouldHandleEdgeCase() {
        // Edge case testing
    }
}
```

For Python (pytest):

``` Python
from component import Component

def test_should_behave_as_expected():
    # Arrange
    # Act
    # Assert
    
def test_should_handle_edge_case():
    # Edge case testing
```

For Ruby (RSpec):

``` Ruby
require 'component'

RSpec.describe Component do
  it "should behave as expected" do
    # Arrange
    # Act
    # Assert
  end
  
  it "should handle edge case" do
    # Edge case testing
  end
end
```

## 5. Test Cases Include

### Frontend Testing Focus

#### Component Testing

- **Rendering**: Component renders without crashing
- **Props**: Correct handling of different prop combinations
- **State**: State changes and updates
- **User Interactions**: Click, input, form submission events
- **Conditional Rendering**: Different UI states based on props/state
- **Accessibility**: ARIA labels, keyboard navigation

#### Service/Utility Testing

- **API Calls**: HTTP requests and responses
- **Data Transformation**: Input/output formatting
- **Error Handling**: Network failures, invalid responses
- **Browser APIs**: Local storage, clipboard, etc.

### API Testing Focus

#### Controller Testing

- **HTTP Methods**: GET, POST, PUT, DELETE responses
- **Status Codes**: 200, 400, 404, 500 scenarios
- **Request Validation**: Model binding and validation
- **Authorization**: Authentication and authorization checks
- **Response Format**: JSON structure and content

#### Service/Business Logic Testing

- **Business Rules**: Core application logic
- **Data Validation**: Input sanitization and validation
- **Database Operations**: CRUD operations (mocked)
- **External Integrations**: Third-party service calls (mocked)
- **Exception Handling**: Error scenarios and recovery

## 6. Coverage Validation

### Frontend Coverage

#### Component Coverage

- **Render paths**: All conditional rendering branches
- **Event handlers**: All user interaction scenarios
- **State transitions**: All state change paths
- **Error boundaries**: Error handling and fallback UI

#### Service Coverage (Frontend)

- **API endpoints**: All service method calls
- **Data flows**: Request/response transformations
- **Error scenarios**: Network and data errors

### API Coverage

#### Controller Coverage

- **Action methods**: All HTTP endpoint variations
- **Parameter combinations**: Different request scenarios
- **Response types**: Success and error responses
- **Model validation**: All validation rule paths

#### Service Coverage (API)

- **Business logic**: All decision branches
- **Data access**: All repository interactions
- **External dependencies**: All third-party integrations

## 7. Execution Strategy

### Option A: Targeted Generation (Recommended)

Execute separately based on development context:

**Frontend Development Session:**

```bash
# Focus on frontend tests only
cd frontend/
npm run test:generate  # or manual execution targeting React components
```

**API Development Session:**

```bash
# Focus on API tests only  
cd MeetingSummarizer.Api/
dotnet test --generate  # or manual execution targeting controllers/services
```

### Option B: Full Project Generation

Generate tests for both codebases in sequence:

1. **Phase 1**: Generate frontend tests
   - Analyze `frontend/src/` directory
   - Create tests in `frontend/src/__tests__/`
   - Validate with `npm run test`

2. **Phase 2**: Generate API tests
   - Analyze `MeetingSummarizer.Api/` directory  
   - Create tests in test project
   - Validate with `dotnet test`

### Rationale for Separation

- **Different Tech Stacks**: React/TypeScript vs C#/.NET
- **Different Testing Libraries**: Vitest/Testing Library vs MSTest/xUnit
- **Different Mock Patterns**: Frontend mocks vs .NET dependency injection
- **Different Execution Contexts**: npm scripts vs dotnet CLI
- **Focused Development**: Developers typically work on one codebase at a time
