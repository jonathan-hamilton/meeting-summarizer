# Project Scaffolding Story Generator

When asked to generate initial scaffolding stories:

## Prerequisites

**Technology Stack Detection (Recommended):**
If working with an existing project, run `detect-project-stack` first to auto-detect:
- [FRONTEND_FRAMEWORK] (React, Vue, Angular, etc.)
- [UI_LIBRARY] (Material-UI, Vuetify, Bootstrap, etc.)
- [BACKEND_FRAMEWORK] (.NET, Node.js, Python, etc.)
- [PACKAGE_MANAGER] (npm, yarn, pip, etc.)

## Process

1. Review provided context:

   - Project requirements
   - Architecture decisions
   - Technology stack (detected or specified)
   - Component structure

2. Summarize your understanding of the above context. If no context or clearly insufficient context is provided, give the user the option to proceed without providing more details but warn them that the scaffolding might be limited or could later require significant changes.

3. Generate 2-3 user stories that will result in:

   - Basic project structure
   - Core dependencies installed
   - Minimal running application
   - No data persistence
   - No security implementation

4. Format each story with unique SC-### identifiers:

   ## Story SC-001: [title]

   **As a** developer
   **I want to** [scaffolding goal]
   **So that** [business value]

   ### Acceptance Criteria

   - [ ] [Specific, testable criteria]
   - [ ] [Include version numbers]
   - [ ] [Reference component names]

   ### Technical Notes

   - Technology choices: [FRONTEND_FRAMEWORK] + [UI_LIBRARY] for frontend, [BACKEND_FRAMEWORK] for API
   - Package management: [PACKAGE_MANAGER] for dependency installation
   - Component structure: [describe structure based on detected framework]
   - Configuration details: [specific settings for detected stack]
   - Command examples: [PACKAGE_MANAGER] install, framework-specific run commands

   ### Definition of Done

   - [ ] Project runs successfully
   - [ ] Basic structure matches architecture
   - [ ] Core dependencies installed
   - [ ] Smoke test passes

5. Validate stories:

- Ensure completeness for basic setup
- Verify alignment with architecture
- Confirm minimal scope
- Check all technical details included
