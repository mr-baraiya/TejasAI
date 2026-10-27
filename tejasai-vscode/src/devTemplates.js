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
      title: 'Feature Architecture & Implementation Spec',
      fields: [
        { id: 'name', label: 'Feature Name', placeholder: 'e.g., Live Team Presence' },
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
  ],

  debug: [
    {
      id: 'debug-diagnosis',
      title: 'Root-Cause Diagnosis & Surgical Fix',
      fields: [
        { id: 'error', label: 'Error / Symptom', placeholder: 'e.g., Unhandled promise rejection / TypeError' },
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
  ],

  testing: [
    {
      id: 'testing-suite',
      title: 'Comprehensive Unit & Edge-Case Test Suite',
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
  ],
};

module.exports = {
  DEVELOPER_CATEGORIES,
  DEVELOPER_TEMPLATES,
};
