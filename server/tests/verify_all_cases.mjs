import assert from 'assert';
import { validatePrompt } from '../utils/validatePrompt.js';
import { validateOutput } from '../services/aiService.js';
import { enhancePromptApi } from '../../tejasai-browser-extension/api.js';

console.log('\n=== RUNNING TEJASAI FULL INTEGRATION & EDGE-CASE TEST SUITE ===\n');

let passedCount = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`✓ PASS: ${name}`);
    passedCount++;
  } catch (err) {
    console.error(`✗ FAIL: ${name}`);
    console.error(err);
    process.exit(1);
  }
}

async function asyncTest(name, fn) {
  try {
    await fn();
    console.log(`✓ PASS: ${name}`);
    passedCount++;
  } catch (err) {
    console.error(`✗ FAIL: ${name}`);
    console.error(err);
    process.exit(1);
  }
}

// 1. Empty & Whitespace Inputs
test('validatePrompt rejects empty string with 400', () => {
  const res = validatePrompt({ prompt: '' });
  assert.strictEqual(res.isValid, false);
  assert.strictEqual(res.statusCode, 400);
});

test('validatePrompt rejects whitespace-only string with 400', () => {
  const res = validatePrompt({ prompt: '    \n\t  ' });
  assert.strictEqual(res.isValid, false);
  assert.strictEqual(res.statusCode, 400);
});

// 2. Short Inputs (hir, hi, AI, C#)
test('validatePrompt accepts short 3-letter input "hir"', () => {
  const res = validatePrompt({ prompt: 'hir' });
  assert.strictEqual(res.isValid, true);
  assert.strictEqual(res.sanitizedPrompt, 'hir');
});

test('validatePrompt accepts short 2-letter input "hi" and "AI"', () => {
  const res1 = validatePrompt({ prompt: 'hi' });
  assert.strictEqual(res1.isValid, true);
  assert.strictEqual(res1.sanitizedPrompt, 'hi');

  const res2 = validatePrompt({ prompt: 'AI' });
  assert.strictEqual(res2.isValid, true);
  assert.strictEqual(res2.sanitizedPrompt, 'AI');
});

// 3. Meaningful Short Prompt
test('validatePrompt accepts meaningful short prompt "Explain Java"', () => {
  const res = validatePrompt({ prompt: 'Explain Java', targetAI: 'deepseek' });
  assert.strictEqual(res.isValid, true);
  assert.strictEqual(res.sanitizedPrompt, 'Explain Java');
  assert.strictEqual(res.targetAI, 'deepseek');
});

// 4. Long Detailed Prompt
test('validatePrompt accepts long prompts within 1500 chars and rejects > 1500', () => {
  const longPrompt = 'Please optimize this instruction: '.repeat(40);
  const resValid = validatePrompt({ prompt: longPrompt.slice(0, 1400) });
  assert.strictEqual(resValid.isValid, true);

  const tooLong = 'x'.repeat(1501);
  const resInvalid = validatePrompt({ prompt: tooLong });
  assert.strictEqual(resInvalid.isValid, false);
  assert.strictEqual(resInvalid.statusCode, 400);
});

// 5. Output Validation: Typo lectures must be rejected
test('validateOutput rejects conversational typo lectures', () => {
  const typoLecture = JSON.stringify({
    enhancedPrompt: "The input 'hir' appears to be a typo or abbreviation. Please clarify if you meant 'hi', 'hire', 'hair'...",
    whyBetter: ["Asked for clarification", "Identified possible typos"]
  });
  const res = validateOutput(typoLecture, 'hir');
  assert.strictEqual(res.isValid, false);
  assert.strictEqual(res.reason, 'Contains conversational typo lecture');
});

test('validateOutput accepts concise, conservative improvements on short input', () => {
  const validOutput = JSON.stringify({
    enhancedPrompt: "hir",
    whyBetter: ["Preserved input as intent is ambiguous", "Returned unchanged without assuming context"]
  });
  const res = validateOutput(validOutput, 'hir');
  assert.strictEqual(res.isValid, true);
  assert.strictEqual(res.data.enhancedPrompt, 'hir');
});

// 6. Extension API client input validation
await asyncTest('enhancePromptApi rejects empty and whitespace inputs locally', async () => {
  const emptyRes = await enhancePromptApi({ prompt: '   ' });
  assert.strictEqual(emptyRes.success, false);
  assert.strictEqual(emptyRes.statusCode, 400);
  assert.strictEqual(emptyRes.recoverable, false);
});

// 7. Mock HTTP status codes against enhancePromptApi
const originalFetch = globalThis.fetch;

await asyncTest('enhancePromptApi handles HTTP 400 without generic network error', async () => {
  globalThis.fetch = async () => ({
    ok: false,
    status: 400,
    statusText: 'Bad Request',
    json: async () => ({ error: 'Custom 400 validation error' }),
  });
  const res = await enhancePromptApi({ prompt: 'Test Prompt' });
  assert.strictEqual(res.success, false);
  assert.strictEqual(res.statusCode, 400);
  assert.strictEqual(res.recoverable, false);
  assert.strictEqual(res.error, 'Custom 400 validation error');
});

await asyncTest('enhancePromptApi handles HTTP 401/403 without generic network error', async () => {
  globalThis.fetch = async () => ({
    ok: false,
    status: 401,
    statusText: 'Unauthorized',
    json: async () => ({ error: 'Unauthorized key' }),
  });
  const res = await enhancePromptApi({ prompt: 'Test Prompt' });
  assert.strictEqual(res.success, false);
  assert.strictEqual(res.statusCode, 401);
  assert.strictEqual(res.recoverable, false);
});

await asyncTest('enhancePromptApi handles HTTP 429 rate limit with recoverable: true', async () => {
  globalThis.fetch = async () => ({
    ok: false,
    status: 429,
    statusText: 'Too Many Requests',
    json: async () => ({ error: 'Rate limit exceeded' }),
  });
  const res = await enhancePromptApi({ prompt: 'Test Prompt' });
  assert.strictEqual(res.success, false);
  assert.strictEqual(res.statusCode, 429);
  assert.strictEqual(res.isRateLimit, true);
  assert.strictEqual(res.recoverable, true);
});

await asyncTest('enhancePromptApi handles HTTP 500 server error with recoverable: true', async () => {
  globalThis.fetch = async () => ({
    ok: false,
    status: 500,
    statusText: 'Internal Server Error',
    json: async () => ({ error: 'Internal failure' }),
  });
  const res = await enhancePromptApi({ prompt: 'Test Prompt' });
  assert.strictEqual(res.success, false);
  assert.strictEqual(res.statusCode, 500);
  assert.strictEqual(res.isServerError, true);
  assert.strictEqual(res.recoverable, true);
});

await asyncTest('enhancePromptApi handles HTTP 503 inference unavailable with recoverable: true', async () => {
  globalThis.fetch = async () => ({
    ok: false,
    status: 503,
    statusText: 'Service Unavailable',
    json: async () => ({ error: 'Groq LPU temporarily busy' }),
  });
  const res = await enhancePromptApi({ prompt: 'Test Prompt' });
  assert.strictEqual(res.success, false);
  assert.strictEqual(res.statusCode, 503);
  assert.strictEqual(res.isServerError, true);
  assert.strictEqual(res.recoverable, true);
});

await asyncTest('enhancePromptApi handles malformed JSON response safely', async () => {
  globalThis.fetch = async () => ({
    ok: true,
    status: 200,
    statusText: 'OK',
    json: async () => { throw new Error('Invalid JSON syntax'); },
  });
  const res = await enhancePromptApi({ prompt: 'Test Prompt' });
  assert.strictEqual(res.success, false);
  assert.strictEqual(res.recoverable, true);
  assert.match(res.error, /Malformed or empty response/);
});

await asyncTest('enhancePromptApi handles missing required response fields', async () => {
  globalThis.fetch = async () => ({
    ok: true,
    status: 200,
    statusText: 'OK',
    json: async () => ({ success: false }),
  });
  const res = await enhancePromptApi({ prompt: 'Test Prompt' });
  assert.strictEqual(res.success, false);
  assert.strictEqual(res.recoverable, true);
});

await asyncTest('enhancePromptApi handles timeout AbortError cleanly', async () => {
  globalThis.fetch = async () => {
    const err = new Error('The operation was aborted');
    err.name = 'AbortError';
    throw err;
  };
  const res = await enhancePromptApi({ prompt: 'Test Prompt' });
  assert.strictEqual(res.success, false);
  assert.strictEqual(res.isTimeout, true);
  assert.strictEqual(res.recoverable, true);
  assert.match(res.error, /timed out/i);
});

// Restore original fetch
globalThis.fetch = originalFetch;

console.log(`\n🎉 ALL ${passedCount} TEST CASES PASSED SUCCESSFULLY!\n`);
