# API Test Generator

**Role**: Expert QA Test Engineer specializing in .NET/C# testing

**Commands**:

- `generate-api-tests` - Generate tests for current sprint (auto-detected)
- `generate-api-tests sprint-N` - Generate tests for specific sprint (e.g., `sprint-1`, `sprint-2`)
- `review-all-api-tests` - Review and generate comprehensive tests for all sprints

## Command Usage Examples

**Auto-Detection Mode:**

```bash
#generate-api-tests
```

- Automatically detects Sprint 2 (highest numbered) and generates tests for current sprint features
- Includes context from Sprint 1 for integration testing

**Specific Sprint Mode:**

```bash
#generate-api-tests sprint-1
#generate-api-tests sprint-2
```

- Targets specific sprint requirements
- Useful for filling gaps in historical sprint coverage
- Includes dependencies from previous sprints

**Comprehensive Review Mode:**

```bash
#review-all-api-tests
```

- Analyzes all sprints (1, 2, and future)
- Provides complete test coverage report
- Generates missing tests across all sprint features
- Creates integration tests spanning multiple sprints

## Project Context

Target codebase: **API** (.NET C#)

- Directory: `MeetingSummarizer.Api/`
- Framework: ASP.NET Core Web API
- Testing: MSTest with Moq for mocking
- Language: C# with dependency injection

## 1. Requirements Analysis

Before generating tests, review:

- `docs/sprint_*_stories.md` - Review all available sprint files to determine current sprint and requirements
- `docs/meeting-summarizer-requirements.md` - Overall system requirements
- Existing tests in test projects for patterns and coverage gaps

**Sprint Detection Strategy:**

1. **Auto-Detection Mode** (`#generate-api-tests`):
   - Scan `docs/` directory for `sprint_*_stories.md` files
   - Identify the highest numbered sprint file as current sprint
   - Focus on current sprint requirements with previous sprint context
2. **Specific Sprint Mode** (`#generate-api-tests sprint-N`):
   - Target the specified sprint file (e.g., `docs/sprint_2_stories.md`)
   - Include dependencies from previous sprints
   - Focus testing on specified sprint features
3. **Comprehensive Review Mode** (`#review-all-api-tests`):
   - Analyze all available sprint files sequentially
   - Review existing test coverage across all sprints
   - Generate missing tests and identify coverage gaps
   - Create integration tests spanning multiple sprints

## 2. Test Scope Selection

**For Auto-Detection and Specific Sprint Modes:**

Ask: "Would you like to:

1. Generate tests for **Controllers** (HTTP endpoints)
2. Generate tests for **Services** (business logic)
3. Generate tests for **Models** (data validation)
4. Generate tests for **new/modified API code**
5. Add tests for **uncovered functionality**

**For Comprehensive Review Mode (`#review-all-api-tests`):**

Automatically performs:

1. **Sprint Coverage Analysis**: Review all sprint stories and map to existing tests
2. **Gap Identification**: Find untested features across all sprints
3. **Integration Testing**: Create cross-sprint workflow tests
4. **Regression Coverage**: Ensure all completed features have test coverage
5. **Future-Proofing**: Identify areas needing tests for upcoming features

## 3. Code Analysis

### Controller Analysis

- Identify HTTP action methods (GET, POST, PUT, DELETE)
- Map route parameters and request models
- Review authorization attributes and requirements
- Find validation logic and model binding
- Check error handling and response formatting

### Service Analysis

- Map service dependencies and interfaces
- Identify business logic and processing methods
- Find external service integrations (OpenAI API)
- Review data transformation and validation
- Check exception handling patterns

### Model Analysis

- Review data annotation attributes
- Identify validation rules and constraints
- Check property relationships and dependencies
- Find custom validation logic

### Existing Test Patterns

- Review test project structure and organization
- Analyze existing controller tests for mocking patterns
- Study service tests for dependency injection setup
- Check helper methods and test utilities

## 4. Framework Detection & Setup

### MSTest Configuration

- Verify test project references and dependencies
- Check test discovery and execution settings
- Validate Moq framework availability
- Ensure proper dependency injection setup

### Required Using Statements

```csharp
using Microsoft.VisualStudio.TestTools.UnitTesting;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Moq;
using MeetingSummarizer.Api.Controllers;
using MeetingSummarizer.Api.Services;
using MeetingSummarizer.Api.Models;
```

### Mock Setup Patterns

```csharp
// Service mocking
private Mock<IOpenAIService> _mockOpenAIService;
private Mock<ILogger<Controller>> _mockLogger;

// Setup in TestInitialize
[TestInitialize]
public void Setup()
{
    _mockOpenAIService = new Mock<IOpenAIService>();
    _mockLogger = new Mock<ILogger<Controller>>();
}
```

## 5. Test Structure Templates

### Controller Test

```csharp:MeetingSummarizer.Api.Tests/Controllers/ControllerNameTests.cs
using Microsoft.VisualStudio.TestTools.UnitTesting;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Moq;
using MeetingSummarizer.Api.Controllers;
using MeetingSummarizer.Api.Services;
using MeetingSummarizer.Api.Models;

[TestClass]
public class ControllerNameTests
{
    private Mock<IService> _mockService;
    private Mock<ILogger<ControllerName>> _mockLogger;
    private ControllerName _controller;

    [TestInitialize]
    public void Setup()
    {
        _mockService = new Mock<IService>();
        _mockLogger = new Mock<ILogger<ControllerName>>();
        _controller = new ControllerName(_mockService.Object, _mockLogger.Object);
    }

    [TestCleanup]
    public void Cleanup()
    {
        _controller?.Dispose();
    }

    [TestMethod]
    public async Task GetAsync_WithValidId_ReturnsOkResult()
    {
        // Arrange
        var id = 1;
        var expectedData = new ResponseModel { Id = id, Name = "Test" };
        _mockService.Setup(s => s.GetByIdAsync(id))
                   .ReturnsAsync(expectedData);

        // Act
        var result = await _controller.GetAsync(id);

        // Assert
        Assert.IsInstanceOfType(result, typeof(OkObjectResult));
        var okResult = result as OkObjectResult;
        Assert.AreEqual(expectedData, okResult.Value);
    }

    [TestMethod]
    public async Task PostAsync_WithValidModel_ReturnsCreatedResult()
    {
        // Arrange
        var request = new CreateRequestModel { Name = "Test" };
        var createdItem = new ResponseModel { Id = 1, Name = "Test" };
        _mockService.Setup(s => s.CreateAsync(request))
                   .ReturnsAsync(createdItem);

        // Act
        var result = await _controller.PostAsync(request);

        // Assert
        Assert.IsInstanceOfType(result, typeof(CreatedAtActionResult));
    }

    [TestMethod]
    public async Task GetAsync_WithInvalidId_ReturnsNotFound()
    {
        // Arrange
        var invalidId = -1;
        _mockService.Setup(s => s.GetByIdAsync(invalidId))
                   .ReturnsAsync((ResponseModel)null);

        // Act
        var result = await _controller.GetAsync(invalidId);

        // Assert
        Assert.IsInstanceOfType(result, typeof(NotFoundResult));
    }

    [TestMethod]
    public async Task PostAsync_WithInvalidModel_ReturnsBadRequest()
    {
        // Arrange
        var invalidRequest = new CreateRequestModel(); // Missing required fields
        _controller.ModelState.AddModelError("Name", "Name is required");

        // Act
        var result = await _controller.PostAsync(invalidRequest);

        // Assert
        Assert.IsInstanceOfType(result, typeof(BadRequestObjectResult));
    }
}
```

### Service Test

```csharp:MeetingSummarizer.Api.Tests/Services/ServiceNameTests.cs
using Microsoft.VisualStudio.TestTools.UnitTesting;
using Microsoft.Extensions.Logging;
using Moq;
using MeetingSummarizer.Api.Services;
using MeetingSummarizer.Api.Models;

[TestClass]
public class ServiceNameTests
{
    private Mock<IDependency> _mockDependency;
    private Mock<ILogger<ServiceName>> _mockLogger;
    private ServiceName _service;

    [TestInitialize]
    public void Setup()
    {
        _mockDependency = new Mock<IDependency>();
        _mockLogger = new Mock<ILogger<ServiceName>>();
        _service = new ServiceName(_mockDependency.Object, _mockLogger.Object);
    }

    [TestMethod]
    public async Task ProcessAsync_WithValidInput_ReturnsExpectedResult()
    {
        // Arrange
        var input = "valid input";
        var expectedOutput = "processed output";
        _mockDependency.Setup(d => d.ProcessAsync(input))
                      .ReturnsAsync(expectedOutput);

        // Act
        var result = await _service.ProcessAsync(input);

        // Assert
        Assert.AreEqual(expectedOutput, result);
        _mockDependency.Verify(d => d.ProcessAsync(input), Times.Once);
    }

    [TestMethod]
    public async Task ProcessAsync_WithNullInput_ThrowsArgumentNullException()
    {
        // Arrange
        string nullInput = null;

        // Act & Assert
        await Assert.ThrowsExceptionAsync<ArgumentNullException>(
            () => _service.ProcessAsync(nullInput));
    }

    [TestMethod]
    public async Task ProcessAsync_WhenDependencyThrows_PropagatesException()
    {
        // Arrange
        var input = "input";
        _mockDependency.Setup(d => d.ProcessAsync(input))
                      .ThrowsAsync(new InvalidOperationException("Dependency error"));

        // Act & Assert
        await Assert.ThrowsExceptionAsync<InvalidOperationException>(
            () => _service.ProcessAsync(input));
    }
}
```

### Model Validation Test

```csharp:MeetingSummarizer.Api.Tests/Models/ModelNameTests.cs
using Microsoft.VisualStudio.TestTools.UnitTesting;
using System.ComponentModel.DataAnnotations;
using MeetingSummarizer.Api.Models;

[TestClass]
public class ModelNameTests
{
    [TestMethod]
    public void Model_WithValidData_PassesValidation()
    {
        // Arrange
        var model = new ModelName
        {
            RequiredProperty = "Valid Value",
            OptionalProperty = "Optional Value"
        };

        // Act
        var validationResults = ValidateModel(model);

        // Assert
        Assert.AreEqual(0, validationResults.Count);
    }

    [TestMethod]
    public void Model_WithMissingRequiredProperty_FailsValidation()
    {
        // Arrange
        var model = new ModelName
        {
            // RequiredProperty not set
            OptionalProperty = "Optional Value"
        };

        // Act
        var validationResults = ValidateModel(model);

        // Assert
        Assert.AreEqual(1, validationResults.Count);
        Assert.IsTrue(validationResults.Any(v => v.MemberNames.Contains("RequiredProperty")));
    }

    private List<ValidationResult> ValidateModel(object model)
    {
        var validationResults = new List<ValidationResult>();
        var validationContext = new ValidationContext(model);
        Validator.TryValidateObject(model, validationContext, validationResults, true);
        return validationResults;
    }
}
```

## 6. Test Coverage Focus

### Controller Testing Priorities

- **HTTP Methods**: All action methods with proper status codes
- **Request Validation**: Model binding and validation attributes
- **Authorization**: Authentication and authorization requirements
- **Error Handling**: Exception handling and error responses
- **Response Format**: Correct JSON structure and content types

### Service Testing Priorities

- **Business Logic**: All decision paths and processing rules
- **Dependency Interaction**: All external service calls
- **Data Validation**: Input sanitization and validation
- **Exception Handling**: Error scenarios and recovery
- **Performance**: Response time and resource usage

### Integration Testing Focus

- **End-to-End Workflows**: Complete API request/response cycles
- **OpenAI Integration**: Transcription service interaction
- **File Processing**: Audio file upload and validation
- **Error Recovery**: Full error handling across service boundaries

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

**Comprehensive Review Mode (`#review-all-api-tests`):**

1. **Multi-Sprint Analysis:**
   - Load and analyze all available sprint files
   - Create comprehensive requirements matrix
   - Map existing tests to sprint stories
2. **Coverage Assessment:**
   - Identify gaps in test coverage across all sprints
   - Analyze integration points between sprint features
   - Review regression test coverage for completed sprints

**All Modes:**
3. **Assess Coverage:**

- Identify controllers/services needing tests
- Check existing test coverage gaps

### Step 2: Generate Tests

1. Choose target controller/service
2. Analyze dependencies and interfaces
3. Generate comprehensive test suite
4. Include all required mock setups

### Step 3: Validation

```bash
cd MeetingSummarizer.Api/
dotnet test --verbosity normal
dotnet test --collect:"XPlat Code Coverage"
```

### Step 4: Integration

1. Ensure tests pass in CI/CD pipeline
2. Verify coverage meets project standards
3. Update test documentation

## 8. Quality Checklist

### Before Test Generation

- [ ] Requirements reviewed from sprint stories
- [ ] Existing tests analyzed for patterns
- [ ] Service dependencies mapped
- [ ] Mock strategies identified

### After Test Generation

- [ ] All test cases pass locally
- [ ] Coverage targets met
- [ ] No dependency conflicts
- [ ] Authorization scenarios covered
- [ ] Error scenarios included
- [ ] Integration workflows tested

### Test Quality Standards

- [ ] Clear test method names following convention
- [ ] Proper Arrange/Act/Assert structure
- [ ] Comprehensive edge case coverage
- [ ] Appropriate mock verification
- [ ] Fast execution (< 10s per test class)
