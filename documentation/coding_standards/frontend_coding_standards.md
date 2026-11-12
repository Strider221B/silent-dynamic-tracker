# Frontend Coding Standards

> **This document is the single source of truth for all frontend coding standards on the project.**
> Every AI agent, prompt, and developer MUST adhere to these rules — regardless of which prompt template or workflow they use.
> If your prompt does not explicitly mention a rule below, the rule still applies.

---

## 1. SOLID Principles (Adapted for React & TypeScript)

Every component, hook, and service must follow all five SOLID principles:

- **S — Single Responsibility**: Each component renders ONE cohesive piece of UI. Each hook encapsulates ONE concern. Each service handles ONE domain. Do not mix data-fetching, business logic, and presentation in a single component.
- **O — Open/Closed**: Design components for extension via props, composition, and the children pattern. Avoid modifying existing components to add new behavior — compose or wrap instead.
- **L — Liskov Substitution**: Any component implementing a shared interface (e.g., a common prop type) must be interchangeable with other components of the same interface without breaking behavior.
- **I — Interface Segregation**: Prop interfaces must be minimal and specific. Do not pass large "god objects" as props. Split prop types when a component only uses a subset.
- **D — Dependency Inversion**: Components and hooks should depend on abstractions (interfaces, context, injected services), not concrete implementations. Use dependency injection via React Context or constructor-style parameters for services.

---

## 2. DRY (Don't Repeat Yourself)

- No duplicated logic. If a pattern is repeated, extract it into a custom hook, utility function, shared component, or higher-order component.
- Reuse shared components and hooks where applicable.

---

## 3. YAGNI (You Aren't Gonna Need It)

- Only implement what is required by the current task/epic. No speculative features, no "nice-to-have" extras, no "future-proofing" code.
- No TODO comments suggesting future work.

---

## 4. Component & Module Architecture

- **Functional components only.** Do not use class components.
- **No business logic in components.** Components handle rendering and user interaction delegation only. Extract all business logic into custom hooks or service classes.
- **Custom hooks** encapsulate stateful logic, side effects, and data-fetching. Prefix with `use` (e.g., `useAuth`, `useDriveSync`).
- **Service classes** encapsulate external API calls, data transformations, and complex business rules. Services are pure TypeScript classes — no React dependencies.
- **Utility functions** are allowed as standalone exports ONLY for pure, stateless helper functions (e.g., formatters, validators, parsers). They must be typed and tested.
- Entry points (e.g., `main.tsx`) must be minimal — mount the root `<App />` component and nothing else.

---

## 5. File & Member Ordering (STRICTLY ENFORCED)

### Within every component file, arrange in this exact order:

1. Imports (external libraries → internal modules → styles/assets)
2. Type/interface definitions (props, local types)
3. Constants (file-scoped)
4. The component function
5. Named sub-components (if tightly coupled and not reused elsewhere — prefer separate files)
6. Default export

### Within every component function, arrange in this exact order:

1. Props destructuring
2. Context consumption (`useContext`)
3. State declarations (`useState`)
4. Refs (`useRef`)
5. Derived/computed values (`useMemo`)
6. Callbacks (`useCallback`)
7. Side effects (`useEffect`)
8. Event handlers (as `const` arrow functions)
9. Early returns / guard clauses
10. JSX return

### Within every service class, arrange in this exact order:

1. Static constants / class-level properties
2. Constructor
3. Public methods (alphabetical or logical grouping)
4. Private methods (prefix: `_` or `#`) (alphabetical or logical grouping)

---

## 6. Function & Component Length Limit — ≤ 30 Lines of Logic

- Count ONLY the logical lines of code in the function/component body. If a long line is split into multiple lines, count it as one.
- Do NOT count: the function signature, type annotations, JSX return block, blank lines, or comments.
- The JSX return block itself is NOT counted toward the 30-line limit, but individual JSX blocks should remain readable (≤ 50 lines of JSX). If JSX exceeds 50 lines, extract sub-components.
- If a function's logic requires more than 30 lines, it MUST be split into smaller helper functions or custom hooks.
- This is a **HARD LIMIT**. No exceptions.

---

## 7. File Length Limit — ≤ 300 Lines

- The entire file (including imports, types, comments, blank lines, everything) must not exceed 300 lines.
- If approaching the limit, split the component, extract hooks, or rethink the design.

---

## 8. One Component Per File

- Each file contains exactly ONE exported React component OR one custom hook OR one service class.
- The file name must match the export name using PascalCase for components (e.g., `UserProfile` → `UserProfile.tsx`), camelCase for hooks (e.g., `useAuth` → `useAuth.ts`), and PascalCase for services (e.g., `DriveService` → `DriveService.ts`).
- Tightly coupled sub-components may live in the same directory but MUST be in separate files.

---

## 9. Testing Standards — 90%+ Coverage

- Use **Vitest** as the testing framework.
- Use **React Testing Library** (`@testing-library/react`) for component tests. Test behavior, not implementation details.
- Use `vi.fn()` and `vi.mock()` for mocking dependencies.
- Every public component, hook, and service method must have unit tests. Every branch/condition must be tested.
- Each test describes ONE behavior/scenario.
- Test naming: `it('should <expected behavior> when <scenario>')` or `describe('<ComponentName>') → it('<scenario>')`.
- Include:
  - ✅ Happy path tests
  - ✅ Edge case tests
  - ✅ Error/exception tests
  - ✅ Boundary condition tests
  - ✅ User interaction tests (click, type, submit)
  - ✅ Accessibility assertions (`getByRole`, `getByLabelText`)
- Use `beforeEach` / `afterEach` for shared setup/teardown.
- Mock ALL external dependencies (APIs, Google Drive, browser APIs, etc.).
- Assert on specific rendered output, not just "no error thrown."
- Aim for 100% line and branch coverage of the unit under test.
- Each test file corresponds to a source file (e.g., `UserProfile.tsx` → `UserProfile.test.tsx`).
- **No snapshot tests.** Test explicit behavior and output instead.

---

## 10. No Magic Strings or Numbers

- All literal strings and numeric values used in logic (status codes, config keys, thresholds, default values, error messages, API endpoints, storage keys, etc.) MUST be defined as named constants.
- If the constant is specific to a single file, define it as a **file-scoped constant** at the top of the file (e.g., `const MAX_RETRIES = 3 as const;`). File-scoped constants MUST NOT be exported — they are internal implementation details.
- If the same constant is used across multiple files, extract it into a **dedicated constants file** (e.g., `constants.ts`) in the appropriate module.
- Raw string/number literals in function bodies (e.g., `if (status === 200)`, `role = "admin"`) are **NOT acceptable**.
- Exception: JSX display text (user-facing labels, headings) is acceptable inline only if not used in logic.

---

## 11. Node.js & Package Management

- Use **Node.js v22 LTS** (or the version specified in `.nvmrc` / `package.json` → `engines`).
- Use **npm** as the package manager. Do not use yarn or pnpm unless explicitly specified in the project.
- All dependency installations (`npm install`) and script executions (`npm run`) MUST be run from the project's frontend root directory.
- Lock file (`package-lock.json`) MUST be committed. Never delete or ignore it.
- Dependencies vs devDependencies must be correctly categorized.

---

## 12. Code Quality Standards

- **TypeScript is mandatory.** No `.js` or `.jsx` files in the source directory. Use `.ts` for logic and `.tsx` for components.
- Use **strict TypeScript** (`"strict": true` in `tsconfig.json`). No `any` types — use `unknown` and type narrowing instead.
- Write **JSDoc comments** for every service class, every custom hook, and every component (documenting purpose, props, and usage).
- Use **meaningful variable names** (no single letters except loop counters like `i`, `j` or event shorthands like `e`).
- Handle errors explicitly — use custom error classes where the plan specifies, otherwise use typed error handling with `try/catch` and discriminated unions for error states.
- Use **absolute imports** via path aliases (e.g., `@/components/...`, `@/hooks/...`). No deep relative imports (`../../../`).
- Follow **ESLint** and **Prettier** formatting rules as configured in the project.
- Use `React.memo()` only when profiling proves a re-render performance problem. Do not prematurely optimize.
- Use **semantic HTML elements** (`<nav>`, `<main>`, `<section>`, `<button>`, etc.) — not `<div>` for everything.
- All interactive elements must be **accessible** (proper ARIA attributes, keyboard navigation, focus management).

---

## 13. High-Level Design Adherence

All work MUST be consistent with the high-level design documents located at `documentation/design/high_level/`. These documents represent agreed-upon architectural decisions and are the **source of truth** for the system's design:

- `01_system_overview.md` — System overview and scope
- `02_architecture_diagram.md` — Architecture and component layout
- `03_data_flow_pipeline.md` — Data flow and pipeline design
- `04_data_model.md` — Data model and schema definitions
- `05_tech_stack.md` — Technology stack decisions
- `06_api_design.md` — API design and contracts
- `07_sequence_diagrams.md` — Interaction and sequence diagrams
- `08_deployment_architecture.md` — Deployment architecture
- `09_non_functional_requirements.md` — Non-functional requirements (performance, security, etc.)

If any implementation contradicts these documents, the conflict MUST be flagged and the deviation justified explicitly.

---

## 14. Local CI Verification (MANDATORY)

Before considering any code complete, you MUST run the full CI pipeline locally and ensure all checks pass. **Code that fails any of these checks will break the CI build — do NOT commit or submit code that has not passed all three stages.**

All commands MUST be run from the frontend root directory (e.g., `frontend/`).

### Stage 1: Lint (ESLint)
```bash
cd frontend
npm run lint
```
- Configuration: `.eslintrc.cjs` or `eslint.config.js` (flat config)
- Rules: `eslint:recommended`, `@typescript-eslint/recommended`, `react-hooks/recommended`, `jsx-a11y/recommended`
- **Zero lint errors allowed**. Warnings should also be resolved. Fix all violations before proceeding.

### Stage 2: Type Check (TypeScript Compiler)
```bash
cd frontend
npx tsc --noEmit
```
- Configuration: `tsconfig.json`
- Mode: `"strict": true`
- **Zero type errors allowed**. Fix all violations before proceeding.

### Stage 3: Tests with Coverage (Vitest)
```bash
cd frontend
npm run test -- --coverage
```
- Configuration: `vitest.config.ts` or `vite.config.ts` → `test` block
- Runs with: coverage reporter (`v8` or `istanbul`)
- Coverage source: `src/` with branch coverage enabled
- **Minimum coverage threshold: 90%**. The build FAILS if coverage drops below this.
- **Zero test failures allowed.**

### If a check fails:
1. Fix the issue in the source code or test code.
2. Re-run the failing stage.
3. Repeat until all three stages pass cleanly.
4. Only THEN mark the task as complete.

---

## 15. Frontend-Specific Standards

### 15.1 State Management
- Use React's built-in state (`useState`, `useReducer`, `useContext`) as the default.
- Avoid external state management libraries unless complexity genuinely warrants it (and only after explicit approval in the design docs).
- Lift state to the lowest common ancestor. Do not over-lift to the app root.

### 15.2 Styling
- Use **CSS Modules** (`.module.css`) or a utility-first framework (e.g., Tailwind CSS) as configured in the project.
- No inline styles except for truly dynamic values (e.g., calculated positions).
- No global CSS beyond resets/themes.
- Class names must be semantic and descriptive (e.g., `.checklist-chip`, `.nav-header`), not presentational (e.g., `.blue-text`, `.mt-custom`).

### 15.3 API & Data Fetching
- Centralize all API calls in service classes. Components never call `fetch` or API clients directly.
- Handle loading, error, and empty states explicitly in every component that fetches data.
- Use proper TypeScript types for all API request/response shapes — no `any`.

### 15.4 Security
- Never store secrets, API keys, or tokens in client-side code or environment variables prefixed with `VITE_` unless they are explicitly public (e.g., Google OAuth Client ID).
- Sanitize all user inputs rendered in the DOM. Use React's built-in escaping — never use `dangerouslySetInnerHTML`.
- Use `Content-Security-Policy` headers where applicable.

### 15.5 Performance
- Lazy-load routes and heavy components using `React.lazy()` + `Suspense`.
- Minimize bundle size — avoid importing entire libraries when only a subset is needed (tree-shake or use named imports).
- Images and assets must be optimized (compressed, appropriately sized).

---

## Verification Checklist

Before submitting any code, verify:

| Check | Status |
|---|---|
| One component/hook/service per file | YES/NO |
| File name matches export name | YES/NO |
| Correct member ordering (imports → types → constants → component → export) | YES/NO |
| All functions/components ≤ 30 lines of logic | YES/NO |
| JSX return blocks ≤ 50 lines | YES/NO |
| File ≤ 300 lines | YES/NO (actual count: ___) |
| Strict TypeScript — no `any` types | YES/NO |
| JSDoc on components, hooks, and service classes | YES/NO |
| No business logic in components | YES/NO |
| Dependencies injected via Context or parameters | YES/NO |
| SOLID compliance | YES/NO |
| DRY compliance | YES/NO |
| YAGNI compliance | YES/NO |
| No magic strings/numbers | YES/NO |
| Semantic HTML and accessibility | YES/NO |
| Local CI passes (ESLint + tsc + Vitest) | YES/NO |

