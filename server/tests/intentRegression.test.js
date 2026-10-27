/**
 * TejasAI Intent Preservation Regression Test Suite
 *
 * Verifies that prompt enhancement is intent-aware, preserving:
 * 1. Factual questions (retained as questions, NEVER answered)
 * 2. Personal inquiries ("tell me about myself" -> "Tell me about myself.")
 * 3. In-group context ("tell me who is our prime minister" -> "Tell me who our current Prime Minister is.")
 * 4. Greetings & simple messages ("how are you?" -> "How are you?")
 * 5. Coding tasks (preserves requested tech stack, adds practical engineering requirements)
 * 6. Ambiguous requests (triggers structured clarification with <= 3 options)
 */

import assert from 'assert';

const API_BASE = process.env.TEST_API_URL || 'http://localhost:5000/api';

let passed = 0;
let total = 0;

async function test(description, fn) {
  total++;
  try {
    await fn();
    console.log(`  ✓ ${description}`);
    passed++;
  } catch (err) {
    console.error(`  ✗ ${description}`);
    console.error(`    Error: ${err.message}`);
    throw err;
  }
}

async function postEnhance(prompt, endpoint = '/enhance') {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt, targetAI: 'any' }),
  });
  const data = await res.json().catch(() => null);
  return { status: res.status, data };
}

async function runRegressionSuite() {
  console.log('\n======================================================');
  console.log('       TejasAI Intent Preservation Test Suite        ');
  console.log(` Target: ${API_BASE}`);
  console.log('======================================================\n');

  console.log('--- 1. Personal & Contextual Queries ---');

  await test('"tell me about myself" enhances prompt without answering or requesting resume', async () => {
    const { status, data } = await postEnhance('tell me about myself');
    assert.strictEqual(status, 200);
    assert.strictEqual(data.success, true);
    assert.strictEqual(data.enhancedPrompt, 'Tell me about myself.');
    assert.ok(!data.enhancedPrompt.toLowerCase().includes('resume'));
    assert.ok(!data.enhancedPrompt.toLowerCase().includes('professional background'));
  });

  await test('"tell me who is our prime minister" outputs "Tell me who our current Prime Minister is."', async () => {
    const { status, data } = await postEnhance('tell me who is our prime minister');
    assert.strictEqual(status, 200);
    assert.strictEqual(data.success, true);
    assert.strictEqual(data.enhancedPrompt, 'Tell me who our current Prime Minister is.');
  });

  await test('"who is our president" outputs "Tell me who our current President is."', async () => {
    const { status, data } = await postEnhance('who is our president');
    assert.strictEqual(status, 200);
    assert.strictEqual(data.success, true);
    assert.strictEqual(data.enhancedPrompt, 'Tell me who our current President is.');
  });

  console.log('\n--- 2. Factual Questions (Enhanced, Never Answered) ---');

  await test('"what is photosynthesis" outputs "What is photosynthesis?" without answering', async () => {
    const { status, data } = await postEnhance('what is photosynthesis');
    assert.strictEqual(status, 200);
    assert.strictEqual(data.success, true);
    assert.strictEqual(data.enhancedPrompt, 'What is photosynthesis?');
    assert.ok(!data.enhancedPrompt.includes('chemical process'), 'Must not answer the question');
  });

  await test('"who wrote hamlet" outputs "Who wrote Hamlet?" without answering William Shakespeare', async () => {
    const { status, data } = await postEnhance('who wrote hamlet');
    assert.strictEqual(status, 200);
    assert.strictEqual(data.success, true);
    assert.ok(data.enhancedPrompt.endsWith('?'));
    assert.ok(!data.enhancedPrompt.includes('Shakespeare'), 'Must not answer the question');
  });

  console.log('\n--- 3. Greetings & Simple Messages ---');

  await test('"how are you?" outputs "How are you?" without answering', async () => {
    const { status, data } = await postEnhance('how are you?');
    assert.strictEqual(status, 200);
    assert.strictEqual(data.success, true);
    assert.strictEqual(data.enhancedPrompt, 'How are you?');
    assert.ok(!data.enhancedPrompt.toLowerCase().includes('doing well'), 'Must not answer');
  });

  await test('"hello" preserves natural greeting without formal system bloat', async () => {
    const { status, data } = await postEnhance('hello');
    assert.strictEqual(status, 200);
    assert.strictEqual(data.success, true);
    assert.strictEqual(data.enhancedPrompt, 'Hello');
  });

  await test('"good morning" preserves greeting tone', async () => {
    const { status, data } = await postEnhance('good morning');
    assert.strictEqual(status, 200);
    assert.strictEqual(data.success, true);
    assert.strictEqual(data.enhancedPrompt, 'Good morning');
  });

  console.log('\n--- 4. Coding Tasks (Preserves Stack & Adds Engineering Requirements) ---');

  await test('"make login page in react" preserves React and adds validation/accessibility', async () => {
    const { status, data } = await postEnhance('make login page in react');
    assert.strictEqual(status, 200);
    assert.strictEqual(data.success, true);
    assert.ok(data.enhancedPrompt.includes('React'), 'Must preserve React framework');
    assert.ok(
      data.enhancedPrompt.toLowerCase().includes('validation') ||
      data.enhancedPrompt.toLowerCase().includes('accessible') ||
      data.enhancedPrompt.toLowerCase().includes('state')
    );
  });

  console.log('\n--- 5. Smart Clarification Analysis Endpoint (/api/enhance/analyze) ---');

  await test('/api/enhance/analyze returns needsClarification: false for "tell me about myself"', async () => {
    const { status, data } = await postEnhance('tell me about myself', '/enhance/analyze');
    assert.strictEqual(status, 200);
    assert.strictEqual(data.success, true);
    assert.strictEqual(data.needsClarification, false);
    assert.strictEqual(data.enhancedPrompt, 'Tell me about myself.');
  });

  await test('/api/enhance/analyze returns needsClarification: false for "tell me who is our prime minister"', async () => {
    const { status, data } = await postEnhance('tell me who is our prime minister', '/enhance/analyze');
    assert.strictEqual(status, 200);
    assert.strictEqual(data.success, true);
    assert.strictEqual(data.needsClarification, false);
    assert.strictEqual(data.enhancedPrompt, 'Tell me who our current Prime Minister is.');
  });

  await test('/api/enhance/analyze returns needsClarification: false for "what is photosynthesis"', async () => {
    const { status, data } = await postEnhance('what is photosynthesis', '/enhance/analyze');
    assert.strictEqual(status, 200);
    assert.strictEqual(data.success, true);
    assert.strictEqual(data.needsClarification, false);
    assert.strictEqual(data.enhancedPrompt, 'What is photosynthesis?');
  });

  await test('/api/enhance/analyze returns needsClarification: false for "how are you?"', async () => {
    const { status, data } = await postEnhance('how are you?', '/enhance/analyze');
    assert.strictEqual(status, 200);
    assert.strictEqual(data.success, true);
    assert.strictEqual(data.needsClarification, false);
    assert.strictEqual(data.enhancedPrompt, 'How are you?');
  });

  await test('/api/enhance/analyze triggers structured question for ambiguous "build a website for"', async () => {
    const { status, data } = await postEnhance('build a website for', '/enhance/analyze');
    assert.strictEqual(status, 200);
    assert.strictEqual(data.success, true);
    assert.strictEqual(data.needsClarification, true);
    assert.ok(data.question && data.question.text);
    assert.ok(Array.isArray(data.question.options) && data.question.options.length <= 4 && data.question.options.includes('Other'));
  });

  console.log('\n--- 6. Response Schema & Metadata Contracts ---');

  await test('Preserves 2-3 whyBetter bullets under 140 characters each', async () => {
    const { data } = await postEnhance('tell me about myself');
    assert.ok(Array.isArray(data.whyBetter));
    assert.ok(data.whyBetter.length >= 2 && data.whyBetter.length <= 3);
    for (const bullet of data.whyBetter) {
      assert.ok(bullet.length <= 140, `Bullet exceeds 140 chars: ${bullet}`);
    }
  });

  console.log('\n======================================================');
  console.log(` All ${passed}/${total} regression tests passed successfully!`);
  console.log('======================================================\n');
}

runRegressionSuite().catch((err) => {
  console.error('\nFatal test failure:', err);
  process.exit(1);
});
