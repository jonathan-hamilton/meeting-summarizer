# Meeting Summary Frontend

Modern React 19.1.0 + TypeScript + Vite frontend application for AI-powered meeting transcription and summarization.

## 🚀 Quick Start

```bash
npm install
npm run dev
```

## 📋 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm test` - Run tests with Vitest
- `npm run test:ui` - Run tests with Vitest UI
- `npm run test:coverage` - Run tests with coverage report

## 🧪 Testing Framework

**Current Status:** Modern testing infrastructure established with coverage analysis
- **Framework:** Vitest 3.2.4 + React Testing Library 16.3.0
- **Test Pass Rate:** 95.7% (135/141 tests passing)
- **Source Code Coverage:** 20.63% ⚠️ (Target: 90%)
- **Architecture:** Global mocks + TestProviders pattern

### Testing Patterns
```typescript
// Component Testing Pattern
import "../mocks/tourStoreMock";
import "../mocks/speakerSessionStoreMock";
import { renderWithProviders } from "../utils/testUtils";

test('renders component correctly', () => {
  renderWithProviders(<Component />, { initialMode: 'demo' });
  // assertions...
});
```

### Coverage Analysis
- **High Coverage:** TourPopover (97.69%), useSessionManagement (91.46%)
- **Moderate Coverage:** SpeakerMapping (51.96%), SpeakerMappingDialog (51.95%)
- **Critical Gaps:** App.tsx (0%), services (<50%), stores (<30%)

## 🏗️ Architecture

- **Framework:** React 19.1.0 + TypeScript + Vite
- **State Management:** Zustand stores (tourStore, speakerSessionStore, summaryStore)
- **Styling:** Material-UI v7 + Emotion
- **Routing:** React Router v6
- **Testing:** Vitest + React Testing Library
- **Bundling:** Vite with TypeScript support

## 🔧 Development

### Component Development
Components follow modern React patterns with:
- Functional components with hooks
- TypeScript for type safety
- Material-UI for consistent styling
- Zustand for state management

### Testing Development  
All new components should include:
- Modern test files using established patterns
- Coverage targeting 90%+ for critical components
- Integration tests for complex workflows

## 📦 Key Dependencies

**Runtime:**
- React 19.1.0 + React DOM
- Material-UI 7.2.0
- Zustand (state management)
- React Router 6.28.0
- Axios 1.10.0 (API client)

**Development:**
- Vite (build tool)
- TypeScript
- ESLint
- Vitest (testing)
- React Testing Library
