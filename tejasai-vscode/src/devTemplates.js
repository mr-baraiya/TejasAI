/**
 * TejasAI Developer Prompt Templates (VS Code Edition)
 *
 * Provides specialized templates for:
 * 1. Feature Development
 * 2. Debugging
 * 3. Code Generation
 * 4. Refactoring
 * 5. Testing
 */

const DEVELOPER_CATEGORIES = [
  { id: 'feature', name: 'Feature Development' },
  { id: 'debug', name: 'Debugging & Fixes' },
  { id: 'codegen', name: 'Code Generation' },
  { id: 'refactor', name: 'Refactoring' },
  { id: 'testing', name: 'Testing & QA' },
];

const DEVELOPER_TEMPLATES = {
  feature: [
    {
      id: 'feature-spec',
      title: 'Feature Architecture & Spec',
      fields: [
        { id: 'name', label: 'Feature Name', placeholder: 'e.g., Realtime Collaboration Cursor' },
        { id: 'tech', label: 'Tech Stack', placeholder: 'e.g., React, TypeScript, WebSockets' },
        { id: 'requirements', label: 'Key Requirements', placeholder: 'e.g., Show active user avatars and typing indicators' },
        { id: 'constraints', label: 'Constraints', placeholder: 'e.g., Zero regressions, latency < 100ms' },
      ],
      build: (v) =>
        `Plan and implement the feature "${v.name || 'New Feature'}" using ${v.tech || 'the active workspace stack'}.
Key Requirements: ${v.requirements || 'Build a clean, robust, and well-tested implementation'}.
Constraints: ${v.constraints || 'Maintain full type safety, avoid unneeded dependencies, and write tests'}.
Deliverables:
1. High-level architecture and data-flow model
2. Step-by-step implementation changes
3. Error handling, boundaries, and unit tests`,
    },
    {
      id: 'feature-api',
      title: 'REST / GraphQL API Endpoint',
      fields: [
        { id: 'endpoint', label: 'Endpoint & Method', placeholder: 'e.g., POST /api/v1/projects/:id/export' },
        { id: 'auth', label: 'Auth & Permissions', placeholder: 'e.g., Bearer JWT, Org admin only' },
        { id: 'payload', label: 'Payload & Validation', placeholder: 'e.g., Zod schema with format: json|csv' },
        { id: 'response', label: 'Success & Error Responses', placeholder: 'e.g., 200 stream, 400 validation error, 403 forbidden' },
      ],
      build: (v) =>
        `Design and implement the API endpoint "${v.endpoint || 'POST /api/endpoint'}":
Authentication & Access: ${v.auth || 'Standard bearer auth with role verification'}.
Payload Contract: ${v.payload || 'Strict schema validation with sanitization'}.
Responses: ${v.response || 'Typed 200 payload with standardized error envelopes'}.
Enforce idempotency, audit logging, and input boundary protection.`,
    },
    {
      id: 'feature-ui',
      title: 'Accessible UI Component',
      fields: [
        { id: 'component', label: 'Component Name', placeholder: 'e.g., FilterableDataTable' },
        { id: 'props', label: 'Props & State', placeholder: 'e.g., items, filters, onSelect, sorting, pagination' },
        { id: 'a11y', label: 'Accessibility (ARIA)', placeholder: 'e.g., Keyboard navigation (arrow keys), role="grid", aria-live' },
      ],
      build: (v) =>
        `Create a production-ready UI component "${v.component || 'UIComponent'}":
Props & State: ${v.props || 'Typed props interface with local state management'}.
Accessibility: ${v.a11y || 'Strict WCAG 2.1 AA compliance with ARIA attributes and keyboard shortcuts'}.
Include responsive styling, loading skeletons, and interactive state transitions.`,
    },
  ],

  debug: [
    {
      id: 'debug-diagnosis',
      title: 'Root-Cause Diagnosis & Surgical Fix',
      fields: [
        { id: 'error', label: 'Error / Symptom', placeholder: 'e.g., Unhandled promise rejection / TypeError: cannot read undefined' },
        { id: 'code', label: 'Relevant Code Context', placeholder: 'e.g., Selected code or stack trace' },
        { id: 'expected', label: 'Expected Behavior', placeholder: 'e.g., Graceful recovery with fallback' },
      ],
      build: (v) =>
        `Diagnose and fix the following bug:
Error / Symptom: ${v.error || 'Runtime bug'}
Context / Code:
\`\`\`
${v.code || '// Paste or select relevant code block'}
\`\`\`
Expected Behavior: ${v.expected || 'Should execute reliably without errors'}
Identify the precise root cause, explain why it happens, and provide the minimal surgical code fix.`,
    },
    {
      id: 'debug-perf',
      title: 'Performance & Memory Leak Fix',
      fields: [
        { id: 'symptom', label: 'Symptom', placeholder: 'e.g., UI freezes on 10k rows / Heap growth over time' },
        { id: 'suspect', label: 'Suspect Code', placeholder: 'e.g., useEffect event listener / unmemoized selector' },
      ],
      build: (v) =>
        `Profile and resolve this performance bottleneck / leak:
Symptom: ${v.symptom || 'High latency / memory leak'}
Suspect Area:
\`\`\`
${v.suspect || '// Suspect code here'}
\`\`\`
1. Pinpoint what causes retention or unnecessary re-renders.
2. Provide optimized code with virtualization, memoization, or proper cleanup.`,
    },
  ],

  codegen: [
    {
      id: 'codegen-service',
      title: 'Type-Safe Service / API Handler',
      fields: [
        { id: 'purpose', label: 'Purpose', placeholder: 'e.g., Authenticate JWT token and attach user to request' },
        { id: 'types', label: 'Input & Output Types', placeholder: 'e.g., (req, res, next) with custom Request.user type' },
        { id: 'handling', label: 'Edge Cases / Validation', placeholder: 'e.g., Expired tokens, clock skew, malformed headers' },
      ],
      build: (v) =>
        `Write a production-grade implementation for:
Task: ${v.purpose || 'Clean service module'}
Types & Contract: ${v.types || 'Strict TypeScript typings'}
Validation & Edge Cases: ${v.handling || 'Comprehensive boundary checking and fail-fast assertions'}.
Ensure zero memory leaks and modular structure.`,
    },
    {
      id: 'codegen-schema',
      title: 'Database Schema & Migration Model',
      fields: [
        { id: 'entity', label: 'Entity Name', placeholder: 'e.g., WorkspaceMembership' },
        { id: 'fields', label: 'Fields & Constraints', placeholder: 'e.g., id UUID, user_id FK, role ENUM, created_at TIMESTAMPTZ' },
        { id: 'indices', label: 'Indexes & Relations', placeholder: 'e.g., Unique on (org_id, user_id), index on role' },
      ],
      build: (v) =>
        `Generate schema definition and migration for entity "${v.entity || 'Entity'}":
Fields & Constraints: ${v.fields || 'Standard UUID primary key with timestamp tracking'}.
Indexes & Foreign Keys: ${v.indices || 'Optimal B-Tree indexes for query access patterns'}.
Include rollback steps and soft-delete support if standard.`,
    },
  ],

  refactor: [
    {
      id: 'refactor-clean',
      title: 'SOLID Decoupling & Clean Architecture',
      fields: [
        { id: 'target', label: 'Target Module', placeholder: 'e.g., Monolithic controller handling DB, auth, and email' },
        { id: 'goal', label: 'Refactoring Objective', placeholder: 'e.g., Separate into single-responsibility service layers' },
      ],
      build: (v) =>
        `Refactor the following module using Single Responsibility and Dependency Inversion:
Target: ${v.target || 'Monolithic code snippet'}
Objective: ${v.goal || 'Decouple side-effects, improve readability, and ease testing'}
Maintain 100% backward compatibility with existing callers.`,
    },
    {
      id: 'refactor-modern',
      title: 'Legacy Code Modernization',
      fields: [
        { id: 'pattern', label: 'Current Pattern', placeholder: 'e.g., Callback hell / Class component with lifecycle methods' },
        { id: 'targetStack', label: 'Target Pattern', placeholder: 'e.g., Async/await with AbortController / Functional React hooks' },
      ],
      build: (v) =>
        `Modernize the following legacy pattern:
Current State: ${v.pattern || 'Legacy structure'}
Target Architecture: ${v.targetStack || 'Modern clean idiomatic patterns'}
Retain all existing edge-case handling while eliminating deprecated APIs.`,
    },
  ],

  testing: [
    {
      id: 'testing-suite',
      title: 'Unit & Edge-Case Test Suite',
      fields: [
        { id: 'unit', label: 'Module Under Test', placeholder: 'e.g., PaymentProcessor.chargeCustomer' },
        { id: 'framework', label: 'Test Framework', placeholder: 'e.g., Vitest, Jest, Mocha' },
        { id: 'cases', label: 'Edge Cases to Cover', placeholder: 'e.g., Network timeouts, declined cards, duplicate idempotency keys' },
      ],
      build: (v) =>
        `Write an exhaustive test suite for "${v.unit || 'Selected Unit'}" using ${v.framework || 'the project testing runner'}.
Must cover:
- Sunny day happy paths
- Edge cases: ${v.cases || 'Null values, boundary values, network failures'}
- Clean mocks and deterministic teardown`,
    },
    {
      id: 'testing-integration',
      title: 'API Integration & Contract Test',
      fields: [
        { id: 'service', label: 'Service / Route', placeholder: 'e.g., /api/checkout flow with Stripe webhook' },
        { id: 'setup', label: 'Mocks & Fixtures', placeholder: 'e.g., Testcontainers Postgres + mocked payment gateway' },
      ],
      build: (v) =>
        `Write an end-to-end integration test for "${v.service || 'API Service'}":
Environment & Mocks: ${v.setup || 'In-memory test database with hermetic fixtures'}.
Verify database state mutations, HTTP headers, rate limiting, and failure rollback.`,
    },
  ],
};

module.exports = {
  DEVELOPER_CATEGORIES,
  DEVELOPER_TEMPLATES,
};
