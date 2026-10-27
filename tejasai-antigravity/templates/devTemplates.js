/**
 * TejasAI Developer Prompt Templates
 *
 * Tailored for high-precision vibe coding and agentic execution:
 * 1. Feature Development
 * 2. Debugging
 * 3. Code Generation
 * 4. Refactoring
 * 5. Testing
 */

export const DEVELOPER_CATEGORIES = [
  { id: 'feature', name: 'Feature Development', icon: 'sparkle' },
  { id: 'debug', name: 'Debugging & Fixes', icon: 'bug' },
  { id: 'codegen', name: 'Code Generation', icon: 'code' },
  { id: 'refactor', name: 'Refactoring & Clean Code', icon: 'arrows-split' },
  { id: 'testing', name: 'Testing & QA', icon: 'check-circle' },
];

export const DEVELOPER_TEMPLATES = {
  feature: [
    {
      id: 'feature-spec',
      title: 'Full Feature Specification & Architecture',
      description: 'Generates an end-to-end implementation plan with architecture, edge cases, and testing.',
      fields: [
        { id: 'featureName', label: 'Feature Name', placeholder: 'e.g., Real-time Collaborative Cursor Sync' },
        { id: 'techStack', label: 'Technology Stack', placeholder: 'e.g., React, TypeScript, WebSockets, Redis' },
        { id: 'userProblem', label: 'User Problem / Goal', placeholder: 'e.g., Users cannot see where teammates are typing in shared docs' },
        { id: 'constraints', label: 'Constraints & Non-Goals', placeholder: 'e.g., Latency < 50ms, no canvas re-renders, backward compatible' },
      ],
      buildPrompt: (values) =>
        `Plan and implement the feature "${values.featureName || 'Untitled Feature'}" using ${values.techStack || 'the current stack'}.
Goal: ${values.userProblem || 'Deliver a reliable, production-ready solution'}.
Constraints & Non-Goals: ${values.constraints || 'Follow idiomatic patterns, maintain type safety, and avoid breaking existing APIs'}.
Provide:
1. High-level architectural breakdown and component diagram
2. Data flow and state management approach
3. Step-by-step implementation phases with atomic changes
4. Error handling, fallback mechanisms, and boundary conditions
5. Verification criteria and automated testing strategy`,
    },
    {
      id: 'feature-api',
      title: 'REST / GraphQL API Endpoint Implementation',
      description: 'Designs and builds a robust, secure, and validated API endpoint.',
      fields: [
        { id: 'endpoint', label: 'Endpoint & Method', placeholder: 'e.g., POST /api/v1/workspaces/:id/invitations' },
        { id: 'payload', label: 'Request & Response Schema', placeholder: 'e.g., body: { email, role }, returns 201 with invitation token' },
        { id: 'security', label: 'Security & Auth', placeholder: 'e.g., Bearer JWT, check admin permissions, rate limit 10/min' },
      ],
      buildPrompt: (values) =>
        `Implement the API endpoint "${values.endpoint || 'POST /api/resource'}" with strict validation and production guardrails.
Payload Contract: ${values.payload || 'Validate request JSON, return predictable error envelopes and structured response'}.
Security & Auth: ${values.security || 'Enforce authentication, verify role-based permissions, and apply rate limiting'}.
Include:
- Request validation and parameter sanitization
- Service layer business logic with transaction safety
- Centralized error handling masking internal stack traces
- Integration test cases covering 200, 400, 401, and 429 status codes`,
    },
  ],

  debug: [
    {
      id: 'debug-root-cause',
      title: 'Root-Cause Bug Diagnosis & Fix',
      description: 'Systematically isolates the source of an error and provides a surgical fix.',
      fields: [
        { id: 'symptom', label: 'Observed Symptom / Error', placeholder: 'e.g., TypeError: Cannot read properties of undefined (reading "id")' },
        { id: 'reproSteps', label: 'Reproduction Steps', placeholder: 'e.g., Click user profile while background sync is in progress' },
        { id: 'relevantCode', label: 'Relevant Code / Files', placeholder: 'e.g., src/hooks/useUserProfile.ts or pasted snippet' },
        { id: 'expected', label: 'Expected vs Actual Behavior', placeholder: 'e.g., Expected skeleton loader; Actual: white screen unhandled exception' },
      ],
      buildPrompt: (values) =>
        `Debug and resolve the following issue:
Error / Symptom: ${values.symptom || 'Unhandled runtime exception'}
Reproduction: ${values.reproSteps || 'Triggered under specific user interaction'}
Code Context:
\`\`\`
${values.relevantCode || '// Paste relevant function or component snippet'}
\`\`\`
Expected vs Actual: ${values.expected || 'Should fail gracefully without crashing UI'}
Diagnose the exact root cause, explain why the bug occurs, and provide the minimal, surgical code modification needed to fix it permanently without regressions.`,
    },
    {
      id: 'debug-race-condition',
      title: 'Race Condition & Async Concurrency Fix',
      description: 'Solves out-of-order responses, stale state, or uncancelled async operations.',
      fields: [
        { id: 'scenario', label: 'Concurrency Scenario', placeholder: 'e.g., Fast consecutive tab switching causes stale tab data to overwrite active tab' },
        { id: 'asyncFlow', label: 'Async Logic Involved', placeholder: 'e.g., useEffect fetching data without AbortController or sequence IDs' },
      ],
      buildPrompt: (values) =>
        `Fix the race condition in this asynchronous workflow:
Scenario: ${values.scenario || 'Rapid successive state updates lead to out-of-order execution'}
Async Mechanism: ${values.asyncFlow || 'Multiple unresolved promises updating component state'}
Provide an idiomatic pattern (e.g. AbortController, sequence counters, or state machines) to guarantee deterministic state resolution and avoid memory leaks.`,
    },
  ],

  codegen: [
    {
      id: 'codegen-service',
      title: 'Type-Safe Service / Utility Function',
      description: 'Generates clean, modular, fully typed business logic functions.',
      fields: [
        { id: 'fnPurpose', label: 'Function Purpose & Contract', placeholder: 'e.g., Parse and validate webhook signature from Stripe' },
        { id: 'language', label: 'Language / Framework', placeholder: 'e.g., TypeScript / Node.js 20+' },
        { id: 'inputsOutputs', label: 'Inputs & Return Types', placeholder: 'e.g., (rawBody: Buffer, signature: string, secret: string) => WebhookEvent' },
        { id: 'errorHandling', label: 'Error Requirements', placeholder: 'e.g., Throw custom SignatureVerificationError with detailed code' },
      ],
      buildPrompt: (values) =>
        `Generate a production-grade, type-safe implementation for:
Purpose: ${values.fnPurpose || 'Modular service function'}
Language: ${values.language || 'TypeScript'}
Contract: ${values.inputsOutputs || 'Strict typed parameters and explicit return value'}
Error Handling: ${values.errorHandling || 'Fail-fast validation with custom error classes'}
Requirements: Zero external dependencies where standard library suffices, pure functions where possible, and complete JSDoc/TSDoc comments.`,
    },
    {
      id: 'codegen-component',
      title: 'Accessible UI Component with State',
      description: 'Builds an accessible, keyboard-navigable component matching design standards.',
      fields: [
        { id: 'compName', label: 'Component Name', placeholder: 'e.g., VirtualizedCombobox' },
        { id: 'propsState', label: 'Props & Interactions', placeholder: 'e.g., items, onSelect, search filter, arrow key navigation' },
        { id: 'accessibility', label: 'ARIA & Keyboard Requirements', placeholder: 'e.g., role="combobox", aria-expanded, Esc to dismiss' },
      ],
      buildPrompt: (values) =>
        `Create a polished, accessible UI component: "${values.compName || 'InteractiveComponent'}".
Props & Interactions: ${values.propsState || 'Support keyboard navigation, hover states, and clear callbacks'}.
Accessibility (a11y): ${values.accessibility || 'WCAG 2.1 AA compliant, full keyboard navigation, screen reader announcements'}.
Keep styling clean, composable, and responsive.`,
    },
  ],

  refactor: [
    {
      id: 'refactor-solid',
      title: 'SOLID Decoupling & Clean Architecture',
      description: 'Breaks down monolith functions/files into single-responsibility modules.',
      fields: [
        { id: 'targetFile', label: 'Target Code or File', placeholder: 'e.g., src/services/OrderManager.js (800 lines doing validation, DB, emails)' },
        { id: 'refactorGoal', label: 'Primary Refactoring Goal', placeholder: 'e.g., Extract email notification and payment gateway into injected adapters' },
        { id: 'constraints', label: 'Preservation Constraints', placeholder: 'e.g., Public API interface must remain 100% backward compatible' },
      ],
      buildPrompt: (values) =>
        `Refactor the following code according to Single Responsibility and Dependency Inversion principles:
Target: ${values.targetFile || 'Complex legacy module'}
Goal: ${values.refactorGoal || 'Separate business logic, side-effects, and persistence'}
Constraints: ${values.constraints || 'Maintain exact behavioral parity and external API compatibility'}.
Show the decomposed modules, describe the interface boundaries, and explain why the refactored design is more maintainable.`,
    },
    {
      id: 'refactor-perf',
      title: 'Performance & Memory Optimization',
      description: 'Optimizes algorithms, eliminates unnecessary renders, or reduces bundle weight.',
      fields: [
        { id: 'bottleneck', label: 'Identified Bottleneck', placeholder: 'e.g., O(N^2) array lookup inside render loop causing UI stutter' },
        { id: 'targetMetric', label: 'Target Performance Metric', placeholder: 'e.g., Reduce latency from 350ms to < 16ms (60 FPS)' },
      ],
      buildPrompt: (values) =>
        `Optimize the following code for peak runtime performance:
Bottleneck: ${values.bottleneck || 'High CPU/memory utilization'}
Target Goal: ${values.targetMetric || 'Minimize latency and eliminate redundant computations'}
Replace inefficient patterns (e.g. nested loops, unmemoized selectors, redundant object allocations) with optimal algorithms while keeping the code clean and readable.`,
    },
  ],

  testing: [
    {
      id: 'test-suite',
      title: 'Comprehensive Test Suite (Unit & Integration)',
      description: 'Builds exhaustive test coverage for sunny day, rainy day, and edge cases.',
      fields: [
        { id: 'unitUnderTesting', label: 'Module / Unit to Test', placeholder: 'e.g., AuthService.validateSessionToken' },
        { id: 'framework', label: 'Test Framework', placeholder: 'e.g., Vitest, Jest, or Mocha' },
        { id: 'edgeCases', label: 'Edge Cases & Boundary Scenarios', placeholder: 'e.g., Expired tokens, clock skew, corrupted signatures, concurrent revokes' },
      ],
      buildPrompt: (values) =>
        `Write an exhaustive test suite for "${values.unitUnderTesting || 'Target Module'}" using ${values.framework || 'the project test framework'}.
Scenarios to cover:
1. Happy path: Valid inputs and expected assertions
2. Edge cases: ${values.edgeCases || 'Empty values, null, extremes, network anomalies'}
3. Security / Error states: Malformed inputs, permission errors, graceful failures
4. Mocks: Clean isolation of external I/O and deterministic timer controls`,
    },
  ],
};
