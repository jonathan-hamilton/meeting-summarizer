# Documentation Ecosystem Overview

**Role**: Documentation Workflow Guide & Process Orchestrator

**Commands**:
- `documentation-ecosystem-overview` - Display complete workflow and prompt relationships
- `workflow-status` - Show current position in documentation-driven development cycle

## The 8-Step Documentation-Driven Development Process

This ecosystem implements a **documentation-first development methodology** where each step builds upon the previous one, ensuring traceability from vision to implementation.

```
🎯 VISION.md (Strategic Foundation)
    ↓
📊 REQUIREMENTS (Distributed Specifications)
    ↓  
📈 REQUIREMENTS-ROADMAP.md (Sprint Planning)
    ↓
📝 SPRINT STORIES (Feature Breakdown)
    ↓
⚙️ IMPLEMENTATION PLANS (Technical Execution)
    ↓
💻 CODE DEVELOPMENT (Implementation)
    ↓
📋 DOCUMENTATION UPDATES (Progress Tracking)
    ↓
🧪 TESTING & VALIDATION (Quality Assurance)
```

## Prompt Integration Map

### **Phase 1: Project Foundation**
**Prompts**: `detect-project-stack.md`, `generate-initial-project-requirements.md`

**Purpose**: Establish project structure and core requirements
**Outputs**: 
- Technology stack variables: `[PROJECT_NAME]`, `[FRONTEND_FRAMEWORK]`, `[BACKEND_FRAMEWORK]`
- Initial requirements documentation in `docs/requirements/`
- Architecture decisions in `docs/design/`

**Next Phase**: Project Scaffolding

---

### **Phase 2: Project Scaffolding** 
**Prompts**: `generate-project-scaffolding-user-stories.md`

**Purpose**: Create basic running application with minimal features
**Prerequisites**: 
- Technology stack detected via `detect-project-stack`
- Basic requirements and architecture defined
**Outputs**: 
- SC-### stories (Scaffolding stories)
- Basic project structure
- Core dependencies installed
- Minimal running application

**Next Phase**: Sprint Planning

---

### **Phase 3: Sprint Planning**
**Prompts**: `generate-next-sprint-user-stories.md`

**Purpose**: Plan incremental feature development based on dependencies
**Prerequisites**: 
- Scaffolding complete (Phase 2)
- Previous sprint documentation
- Implementation status report
**Outputs**: 
- S<X.Y> stories (Sprint stories) 
- 8-section sprint documentation structure
- Technical dependency analysis
- Progress tracking tables

**Next Phase**: Story Implementation

---

### **Phase 4: Story Implementation**
**Prompts**: `implement-story.md`

**Purpose**: Execute individual user stories with dependency management
**Prerequisites**: 
- Sprint stories planned (Phase 3)
- Technology stack variables set
**Outputs**: 
- Implementation plans in `docs/sprints/implementations/`
- Code changes following architectural patterns
- Incremental feature delivery

**Next Phase**: Documentation Updates

---

### **Phase 5: Documentation Updates**
**Prompts**: `update-commit.md`

**Purpose**: Synchronize all documentation after story completion
**Prerequisites**: 
- Story implementation complete (Phase 4)
- Git changes to analyze
**Outputs**: 
- Updated sprint documentation with completion status
- Synchronized progress trackers across ecosystem
- Updated requirements roadmap
- Git commits with comprehensive documentation

**Next Phase**: Testing & Validation

---

### **Phase 6: Testing & Validation**
**Prompts**: `generate-api-tests.md`, `generate-frontend-tests.md`, `generate-unit-tests.md`

**Purpose**: Ensure quality and completeness of implemented features
**Prerequisites**: 
- Story implementation complete
- Documentation updated
- Technology stack detected
**Outputs**: 
- Comprehensive test coverage for implemented features
- Integration tests spanning multiple sprints
- Technology-specific test patterns

**Next Phase**: Next Sprint (return to Phase 3) or Project Enhancement

---

## Documentation Ecosystem Structure

### **Core Documentation Files** (Referenced by `docs/DOCUMENTATION_MAP.md`)

**Strategic Level:**
- `docs/planning/vision.md` - Product vision and mission
- `docs/planning/*-strategy-*.md` - Strategic planning documents

**Requirements Level:**
- `docs/requirements/requirements-roadmap.md` - **Master tracker** for all sprint progress
- `docs/requirements/*.md` - Feature-specific requirements
- `docs/features/*.md` - Detailed feature specifications

**Implementation Level:**
- `docs/sprints/sprint_X_stories.md` - Sprint work breakdown
- `docs/sprints/implementations/` - Technical implementation plans
- `docs/design/` - Design patterns and architectural decisions

### **Progress Synchronization Points**

The ecosystem maintains **3 synchronized progress trackers**:

1. **`docs/requirements/requirements-roadmap.md`** - Strategic view
2. **`docs/sprints/sprint_X_stories.md`** - Sprint view (single file sprints)  
3. **`docs/sprints/sprint_X/README.md`** - Sprint view (folder-based sprints)

**Critical Rule**: All trackers MUST show identical completion status and story counts.

## Workflow Integration Patterns

### **Technology Stack Integration**
1. Run `detect-project-stack` → Sets variables: `[PROJECT_NAME]`, `[FRONTEND_FRAMEWORK]`, etc.
2. All subsequent prompts reference these variables for technology-appropriate operations
3. Package management, testing frameworks, and directory structures adapt automatically

### **Dependency Management**
1. **Requirements → Sprint Stories**: Requirements roadmap drives sprint planning
2. **Sprint Stories → Implementation**: Story dependencies determine implementation order  
3. **Implementation → Documentation**: Code changes trigger documentation updates
4. **Documentation → Testing**: Updated documentation drives test generation

### **Error Handling & Recovery**
1. **Hard Stops**: `generate-next-sprint-user-stories.md` requires previous sprint documentation
2. **Validation Gates**: `implement-story.md` validates acceptance criteria before proceeding
3. **Consistency Checks**: `update-commit.md` synchronizes progress trackers across ecosystem
4. **Quality Gates**: Test generation prompts ensure coverage for implemented features

## Prompt Orchestration Examples

### **Starting a New Project**
```bash
# 1. Analyze existing structure
detect-project-stack

# 2. Generate initial scaffolding  
generate-project-scaffolding-user-stories

# 3. Implement scaffolding stories
implement-story SC-001
implement-story SC-002

# 4. Update documentation
update-commit

# 5. Generate tests
generate-api-tests
generate-frontend-tests
```

### **Continuing Development**
```bash
# 1. Plan next sprint
generate-next-sprint-user-stories

# 2. Implement sprint stories
implement-story S2.1
update-commit
implement-story S2.2  
update-commit

# 3. Generate comprehensive tests
generate-api-tests sprint-2
generate-frontend-tests sprint-2
```

### **Quality Assurance Cycle**
```bash
# 1. Review documentation completeness
documentation-ecosystem-overview

# 2. Generate missing tests
review-all-api-tests
review-all-frontend-tests

# 3. Update documentation
update-commit
```

## Ecosystem Health Indicators

### **Documentation Consistency**
- [ ] Progress trackers show identical completion status
- [ ] Sprint directories use underscore naming convention
- [ ] All implemented stories marked complete in documentation
- [ ] Requirements roadmap reflects actual implementation status

### **Workflow Completeness**
- [ ] Technology stack variables set and current
- [ ] All sprint stories have corresponding implementation plans
- [ ] Code changes documented in sprint progress
- [ ] Test coverage exists for all completed features

### **Traceability Validation**
- [ ] Vision elements traceable to requirements
- [ ] Requirements traceable to sprint stories
- [ ] Sprint stories traceable to implementation plans
- [ ] Implementation plans traceable to code changes

## Integration with External Documentation

This prompt ecosystem is designed to work with:

**External Documentation:**
- `README.md` - Project overview and status dashboard
- `docs/DOCUMENTATION_MAP.md` - Navigation and traceability matrix
- `docs/design/design-patterns.md` - Mandatory architectural standards

**Generated Documentation:**
- Sprint documentation (`docs/sprints/`)
- Implementation plans (`docs/sprints/implementations/`)
- Requirements tracking (`docs/requirements/`)

## Usage Guidelines

### **For New Projects**
1. Start with `detect-project-stack` to establish technology foundation
2. Use `generate-project-scaffolding-user-stories` for initial setup
3. Follow the 8-step process through completion

### **For Ongoing Development**
1. Begin each sprint with `generate-next-sprint-user-stories`
2. Use `implement-story` for each story in dependency order
3. Run `update-commit` after each story completion
4. Generate tests at sprint completion

### **For Process Validation**
1. Use `documentation-ecosystem-overview` to review workflow status
2. Check ecosystem health indicators
3. Validate traceability from vision to implementation

## Advanced Integration

### **Custom Technology Stacks**
The ecosystem automatically adapts to detected technology through `detect-project-stack`:
- Package management (npm/yarn/pip/dotnet/maven/gradle)
- Testing frameworks (Jest/Vitest/MSTest/pytest/etc.)
- Directory structures (frontend/, api/, src/, etc.)

### **Cross-Project Reusability**
All prompts are generalized with technology variables, making the entire ecosystem reusable across:
- Different programming languages
- Different frameworks  
- Different project structures
- Different team sizes

### **Scalability Patterns**
- Small projects: Single sprint files
- Large projects: Directory-based sprint organization
- Enterprise projects: Multi-repository coordination

---

## Quick Reference

**Start Development**: `detect-project-stack` → `generate-project-scaffolding-user-stories`  
**Plan Sprint**: `generate-next-sprint-user-stories`  
**Implement**: `implement-story` → `update-commit` (repeat)  
**Test**: `generate-api-tests` + `generate-frontend-tests`  
**Validate**: `documentation-ecosystem-overview`

**Emergency Recovery**: Run any prompt's status command (e.g., `implement-story-status`) to see current state and resume from proper step.

---

*This ecosystem represents a complete documentation-driven development methodology. Each prompt is designed to work independently while contributing to the larger workflow. The system maintains consistency, traceability, and quality throughout the development lifecycle.*