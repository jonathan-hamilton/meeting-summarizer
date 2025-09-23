# Code Review Checklist - Design Pattern Compliance

## 🏗️ **MANDATORY DESIGN PATTERN VALIDATION**

This checklist ensures all code changes comply with established design patterns documented in [`docs/architecture/design-patterns.md`](../docs/architecture/design-patterns.md).

**🚨 ALL ITEMS MUST BE VALIDATED BEFORE MERGE**

---

## 📋 **Backend Pattern Compliance**

### Service Layer Pattern
- [ ] **Service Interface Exists**: All business services have corresponding interfaces
- [ ] **Dependency Injection Registered**: Services registered in `Program.cs` with appropriate lifetime
- [ ] **Single Responsibility**: Each service handles one business domain
- [ ] **Thin Controllers**: Controllers contain only routing and validation, business logic in services
- [ ] **No Direct Database Access**: Controllers do not directly access `DbContext`

### Repository Pattern (Entity Framework)
- [ ] **EF DbContext Usage**: All data access uses Entity Framework `DbContext`
- [ ] **Migration-Based Schema**: Database schema changes use Code First migrations
- [ ] **Proper Entity Configuration**: Relationships configured via Fluent API where needed
- [ ] **No Raw SQL**: Avoid raw SQL unless specifically justified and documented

### Security Patterns
- [ ] **Authorization Attributes**: Sensitive endpoints use appropriate authorization attributes
- [ ] **Token Security**: Verification tokens are cryptographically secure with expiration
- [ ] **Rate Limiting**: Token-generating endpoints implement rate limiting
- [ ] **Input Validation**: All user inputs properly validated and sanitized

### Configuration Patterns
- [ ] **Environment Configuration**: Settings use appsettings files, not hardcoded values
- [ ] **Configuration Validation**: Startup validation for required configuration values
- [ ] **Secret Management**: Sensitive config supports Azure Key Vault patterns

---

## 🎯 **Frontend Pattern Compliance**

### Factory Pattern (API Services)
- [ ] **Factory Usage**: API services created via `createApiService()` factory
- [ ] **No Direct Imports**: Components do NOT directly import `apiService`, `demoApiService`, or `mockApiService`
- [ ] **Mode-Aware Behavior**: Service behavior changes handled at service layer, not component layer
- [ ] **Consistent API Interface**: All service implementations provide consistent interface

### State Management Pattern (Zustand)
- [ ] **No Local State for App Data**: NO `useState` or `useReducer` for application state
- [ ] **Store Usage**: All application state managed through appropriate Zustand stores
- [ ] **Domain Stores**: State organized by domain (auth, tour, accessibility, etc.)
- [ ] **Proper Store Actions**: State mutations go through store actions, not direct state changes
- [ ] **Ephemeral State Only**: Local state only for hover, focus, temporary animations

### Provider Pattern (React Context)
- [ ] **Context Providers**: App-wide dependencies use React Context providers
- [ ] **Consistent Provider Usage**: Hooks use established provider patterns
- [ ] **Testing Providers**: Tests use universal provider wrappers

### Performance Patterns
- [ ] **Lazy Loading**: Large components use `React.lazy()` with `Suspense`
- [ ] **Code Splitting**: Bundle impact analyzed and justified
- [ ] **Proper Loading States**: Suspense boundaries provide meaningful loading UX

---

## 🔒 **Security & Data Pattern Validation**

### Authentication & Authorization
- [ ] **JWT Implementation**: Token-based auth follows established JWT patterns
- [ ] **Secure Token Handling**: Tokens properly stored and transmitted
- [ ] **Authorization Middleware**: Proper middleware pipeline for auth validation
- [ ] **Role-Based Access**: User roles properly enforced at API level

### Data Access Patterns
- [ ] **Entity Relationships**: Database relationships properly modeled and configured
- [ ] **Query Optimization**: Appropriate includes/projections for performance
- [ ] **Audit Fields**: Consistent CreatedAt/UpdatedAt patterns across entities
- [ ] **Data Validation**: Both client and server-side validation implemented

---

## 🧪 **Testing Pattern Compliance**

### Test Architecture
- [ ] **Provider Patterns**: Tests use `renderWithProviders()` utility
- [ ] **Store Mocking**: Zustand stores properly mocked with selector support
- [ ] **API Service Mocking**: Factory pattern used for API service mocks
- [ ] **Context Setup**: Consistent context provider setup across tests

### Test Coverage
- [ ] **Pattern Coverage**: New patterns validated through appropriate tests
- [ ] **Integration Testing**: Cross-pattern interactions tested (service + store + component)
- [ ] **Error Scenarios**: Pattern failure modes tested and handled

---

## 🚫 **Anti-Pattern Detection**

### Prohibited Backend Patterns
- [ ] **No Business Logic in Controllers**: Controllers are thin routing layers only
- [ ] **No Static Dependencies**: Services use dependency injection, not static classes
- [ ] **No Raw Database Access**: All data access through Entity Framework patterns
- [ ] **No Hardcoded Configuration**: Environment-specific values in configuration files

### Prohibited Frontend Patterns
- [ ] **No Local State for App Data**: Application state must use Zustand stores
- [ ] **No Direct Service Imports**: API services must use factory pattern
- [ ] **No Prop Drilling**: Global state uses context providers, not prop chains
- [ ] **No Inline Complex Logic**: Business logic extracted to services/hooks

### General Anti-Patterns
- [ ] **No Tight Coupling**: Layers communicate through interfaces
- [ ] **No Magic Numbers/Strings**: Constants properly defined and named
- [ ] **No Inconsistent Error Handling**: Error patterns consistent across similar operations
- [ ] **No Missing TypeScript Types**: All interfaces and data structures properly typed

---

## 📊 **Pattern Change Review**

### New Pattern Introduction
- [ ] **Justification Documented**: New patterns have clear benefit analysis
- [ ] **Migration Plan**: Existing code migration plan provided if applicable
- [ ] **Documentation Updated**: `design-patterns.md` updated with new requirements
- [ ] **Team Review**: Architectural review conducted and approved

### Pattern Deviation
- [ ] **Deviation Justified**: Specific technical reasons documented
- [ ] **Alternative Evaluated**: Standard pattern alternatives considered
- [ ] **Impact Assessment**: Deviation impact on existing codebase analyzed
- [ ] **Approval Obtained**: Pattern deviation approved during story planning

---

## ✅ **Final Validation**

### Code Quality
- [ ] **TypeScript Compliance**: No TypeScript errors or warnings
- [ ] **Linting Compliance**: All linting rules pass
- [ ] **Pattern Consistency**: Changes align with existing pattern usage
- [ ] **Performance Impact**: Bundle/performance impact analyzed if applicable

### Documentation
- [ ] **Implementation Plan**: Pattern usage documented in implementation plan
- [ ] **Code Comments**: Complex pattern implementations properly commented
- [ ] **API Documentation**: Service interfaces documented if public-facing
- [ ] **Pattern Reference**: Links to pattern documentation where helpful

---

## 🔄 **Pattern Compliance Checklist Summary**

**Backend Patterns:**
- ✅ Service Layer with DI registration
- ✅ Entity Framework for data access
- ✅ Security attributes and token patterns
- ✅ Configuration-driven settings

**Frontend Patterns:**
- ✅ Factory pattern for API services
- ✅ Zustand stores for ALL application state
- ✅ Provider pattern for context dependencies
- ✅ Lazy loading for performance optimization

**Testing Patterns:**
- ✅ Universal provider wrappers
- ✅ Factory mocks for services
- ✅ Store testing with proper mocking

**No Anti-Patterns:**
- ❌ Business logic in controllers
- ❌ Local state for application data
- ❌ Direct API service imports
- ❌ Tight coupling between layers

---

**Reviewer Signature:** ____________________  
**Date:** ____________________  
**Pattern Compliance Confirmed:** ✅ / ❌  

**Notes:**
_[Any pattern-related observations, deviations approved, or recommendations for future improvements]_