# Project Technology Stack Detection

**Role**: Project Structure Analyzer

**Commands**:
- `detect-project-stack` - Analyze current project and set technology variables
- `show-project-stack` - Display detected technology stack information

## Command: `detect-project-stack`

This prompt analyzes the current project structure and sets technology stack variables that other prompts can use for context-aware operations.

## Detection Logic

### 1. Frontend Framework Detection

Analyze project files to determine frontend technology:

**React Detection:**
- Look for `package.json` with React dependencies
- Check for `.tsx/.jsx` files
- Look for `vite.config.ts` or `webpack.config.js`
- Set: `[FRONTEND_FRAMEWORK] = "React"`

**Vue Detection:**
- Look for `package.json` with Vue dependencies
- Check for `.vue` files
- Look for `vue.config.js` or `vite.config.ts`
- Set: `[FRONTEND_FRAMEWORK] = "Vue"`

**Angular Detection:**
- Look for `angular.json`
- Check for `package.json` with Angular dependencies
- Look for `.component.ts` files
- Set: `[FRONTEND_FRAMEWORK] = "Angular"`

**Svelte Detection:**
- Look for `package.json` with Svelte dependencies
- Check for `.svelte` files
- Set: `[FRONTEND_FRAMEWORK] = "Svelte"`

**Fallback:**
- Set: `[FRONTEND_FRAMEWORK] = "Unknown"`

### 2. UI Library Detection

Based on `package.json` dependencies:

**Material-UI/MUI (React):**
- Dependencies: `@mui/material`, `@mui/icons-material`
- Set: `[UI_LIBRARY] = "Material-UI"`

**Vuetify (Vue):**
- Dependencies: `vuetify`
- Set: `[UI_LIBRARY] = "Vuetify"`

**Bootstrap:**
- Dependencies: `bootstrap`, `react-bootstrap`, `vue-bootstrap`
- Set: `[UI_LIBRARY] = "Bootstrap"`

**Tailwind CSS:**
- Dependencies: `tailwindcss`
- Set: `[UI_LIBRARY] = "Tailwind CSS"`

**Ant Design:**
- Dependencies: `antd`
- Set: `[UI_LIBRARY] = "Ant Design"`

**Fallback:**
- Set: `[UI_LIBRARY] = "Custom/Unknown"`

### 3. Backend Framework Detection

Analyze project structure for backend technology:

**.NET Detection:**
- Look for `.csproj` files
- Check for `Program.cs` or `Startup.cs`
- Look for `Controllers/` directory
- Set: `[BACKEND_FRAMEWORK] = ".NET"`

**Node.js Detection:**
- Look for `package.json` with Express/Fastify/Koa
- Check for `server.js` or `app.js`
- Look for `routes/` or similar directory
- Set: `[BACKEND_FRAMEWORK] = "Node.js"`

**Python Detection:**
- Look for `requirements.txt` or `pyproject.toml`
- Check for Flask/Django/FastAPI imports
- Look for `app.py` or `main.py`
- Set: `[BACKEND_FRAMEWORK] = "Python"`

**Java Detection:**
- Look for `pom.xml` or `build.gradle`
- Check for Spring Boot annotations
- Look for `src/main/java/` structure
- Set: `[BACKEND_FRAMEWORK] = "Java"`

**Fallback:**
- Set: `[BACKEND_FRAMEWORK] = "Unknown"`

### 4. Package Manager Detection

Based on lock files and project structure:

**npm:**
- Presence of `package-lock.json`
- Set: `[PACKAGE_MANAGER] = "npm"`

**yarn:**
- Presence of `yarn.lock`
- Set: `[PACKAGE_MANAGER] = "yarn"`

**pnpm:**
- Presence of `pnpm-lock.yaml`
- Set: `[PACKAGE_MANAGER] = "pnpm"`

**pip (Python):**
- Presence of `requirements.txt` or `Pipfile`
- Set: `[PACKAGE_MANAGER] = "pip"`

**NuGet (.NET):**
- Presence of `.csproj` files
- Set: `[PACKAGE_MANAGER] = "dotnet/nuget"`

**Maven (Java):**
- Presence of `pom.xml`
- Set: `[PACKAGE_MANAGER] = "mvn"`

**Gradle (Java):**
- Presence of `build.gradle`
- Set: `[PACKAGE_MANAGER] = "gradle"`

### 5. Test Framework Detection

Analyze dependencies and file patterns:

**Frontend Testing:**
- Jest: `package.json` contains `jest`
- Vitest: `package.json` contains `vitest`
- Cypress: `package.json` contains `cypress`
- Set: `[FRONTEND_TEST_FRAMEWORK] = "Jest|Vitest|Cypress"`

**Backend Testing (.NET):**
- MSTest: `.csproj` contains `Microsoft.VisualStudio.TestTools`
- xUnit: `.csproj` contains `xunit`
- NUnit: `.csproj` contains `NUnit`
- Set: `[BACKEND_TEST_FRAMEWORK] = "MSTest|xUnit|NUnit"`

**Backend Testing (Node.js):**
- Jest: `package.json` contains `jest`
- Mocha: `package.json` contains `mocha`
- Set: `[BACKEND_TEST_FRAMEWORK] = "Jest|Mocha"`

**Backend Testing (Python):**
- pytest: `requirements.txt` contains `pytest`
- unittest: Standard library (detect by test file patterns)
- Set: `[BACKEND_TEST_FRAMEWORK] = "pytest|unittest"`

### 6. Directory Structure Detection

Scan project for common directory patterns:

**Frontend Directory:**
- Look for: `frontend/`, `client/`, `web/`, `src/`, `public/`
- Set: `[FRONTEND_DIR] = "detected_directory"`

**Backend Directory:**
- Look for: `backend/`, `server/`, `api/`, directories with `.csproj`
- Set: `[BACKEND_DIR] = "detected_directory"`

**Project Name:**
- Extract from root `package.json` name field
- Extract from `.csproj` AssemblyName
- Extract from directory name as fallback
- Set: `[PROJECT_NAME] = "detected_name"`

## Output Format

After detection, provide a summary:

```markdown
## Detected Technology Stack

**Project Name:** [PROJECT_NAME]
**Frontend Framework:** [FRONTEND_FRAMEWORK]
**UI Library:** [UI_LIBRARY]
**Backend Framework:** [BACKEND_FRAMEWORK]
**Package Manager:** [PACKAGE_MANAGER]
**Frontend Tests:** [FRONTEND_TEST_FRAMEWORK]
**Backend Tests:** [BACKEND_TEST_FRAMEWORK]

**Directory Structure:**
- Frontend: [FRONTEND_DIR]
- Backend: [BACKEND_DIR]

**Variables Set:**
All technology variables have been detected and are ready for use in other prompts.
```

## Usage in Other Prompts

Other prompts can reference these detected values:

```markdown
# Example usage in implement-story.md
Current [PROJECT_NAME] needs these [PACKAGE_MANAGER] updates:

[FRONTEND_FRAMEWORK] dependencies:
{
  "dependencies": {
    "[UI_LIBRARY]": "latest"
  }
}

After updating package.json ([PACKAGE_MANAGER]):
1. Delete node_modules (recommended)
2. Delete package-lock.json (for npm) / yarn.lock (for yarn)
3. Run: [PACKAGE_MANAGER] install
```

## Integration Notes

- Run `detect-project-stack` at the beginning of any sprint or when setting up prompts for a new project
- Technology variables persist for the session and can be referenced by all subsequent prompts
- Re-run detection if project structure changes significantly
- Detection is non-destructive and only reads/analyzes existing files