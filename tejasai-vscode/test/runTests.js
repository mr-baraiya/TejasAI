/**
 * TejasAI VS Code Extension - Automated Test Suite
 *
 * Runs headless unit & live integration tests across:
 * 1. Developer Templates verification (all 13 presets)
 * 2. Favorites Manager CRUD & persistence
 * 3. API validation & live TejasAI endpoint contract
 */

const assert = require('assert');
const { DEVELOPER_TEMPLATES } = require('../src/devTemplates');
const { FavoritesManager } = require('../src/favoritesManager');
const { enhancePrompt, formatApiError } = require('../src/api');

let passedTests = 0;
let totalTests = 0;

function it(name, fn) {
  totalTests++;
  try {
    const res = fn();
    if (res && typeof res.then === 'function') {
      return res
        .then(() => {
          console.log(`  ✓ ${name}`);
          passedTests++;
        })
        .catch((err) => {
          console.error(`  ✗ ${name}:`, err.message);
          throw err;
        });
    }
    console.log(`  ✓ ${name}`);
    passedTests++;
    return Promise.resolve();
  } catch (err) {
    console.error(`  ✗ ${name}:`, err.message);
    return Promise.reject(err);
  }
}

async function run() {
  console.log('\n--- 1. Testing Developer Templates (13 Presets) ---');
  const categories = Object.keys(DEVELOPER_TEMPLATES);
  assert.ok(categories.length >= 5, 'Should have at least 5 template categories');

  let templateCount = 0;
  for (const cat of categories) {
    for (const tpl of DEVELOPER_TEMPLATES[cat]) {
      templateCount++;
      await it(`Template [${cat}] "${tpl.title}" builds clean string`, () => {
        // Test 1: Empty variables fallback
        const emptyOutput = tpl.build({});
        assert.ok(typeof emptyOutput === 'string', 'Output must be string');
        assert.ok(!emptyOutput.includes('undefined'), 'Empty fallback should not contain literal undefined');

        // Test 2: Populated variables
        const dummyVars = {
          name: 'Realtime Chat',
          tech: 'Node.js, WebSocket',
          requirements: 'Low latency, auth',
          error: 'TypeError: cannot read property of null',
          code: 'function test() {}',
          target: 'Clean Architecture',
          unit: 'AuthService.login',
          component: 'Modal Dialog',
          schema: 'Users & Subscriptions',
          cli: 'deploy-tool',
          scenario: 'High concurrency race condition',
          endpoint: 'POST /api/messages',
          auth: 'Bearer token',
          payload: 'JSON object',
          response: '200 OK',
          props: 'isOpen, onClose',
          a11y: 'role="dialog"',
          expected: 'Return 200 without error',
          symptom: 'Memory consumption growth',
          suspect: 'event listener without removal',
          purpose: 'Fetch user data',
          contract: 'IUserService interface',
          tables: 'users, sessions',
          engine: 'PostgreSQL',
          commands: 'sync, audit',
          current: 'Monolithic class',
          modernize: 'Modern ES6+ module',
          stack: 'TypeScript, Express',
          bottleneck: 'N+1 query',
          cases: 'Valid login, expired token',
          coverage: 'Edge cases and boundaries',
          service: 'PaymentService',
          flow: 'Checkout to webhook capture',
        };
        const output = tpl.build(dummyVars);
        assert.ok(typeof output === 'string', 'Output must be string');
        assert.ok(output.length > 50, 'Output must be descriptive prompt');
        assert.ok(!output.includes('undefined'), 'Output should not contain undefined');
      });
    }
  }
  console.log(`  Verified ${templateCount} developer templates successfully.`);

  console.log('\n--- 2. Testing Favorites Manager (CRUD & Local Storage) ---');
  const mockStorage = {};
  const mockContext = {
    globalState: {
      get: (key, def) => mockStorage[key] ?? def,
      update: async (key, val) => {
        mockStorage[key] = val;
      },
    },
  };

  const fm = new FavoritesManager(mockContext);

  await it('Starts with seeded default favorites on clean install', () => {
    const initial = fm.getFavorites();
    assert.ok(Array.isArray(initial), 'Favorites should be an array');
    assert.ok(initial.length >= 2, 'Should include default seeded favorites');
    assert.ok(initial.some((f) => f.id === 'fav-1'), 'Should contain initial seed fav-1');
  });

  let favId = null;
  const initialLength = fm.getFavorites().length;

  await it('Adds a new favorite', async () => {
    const item = await fm.addFavorite({
      title: 'WebSocket Architecture Spec',
      prompt: 'Design a scalable WebSocket gateway with room channels',
      category: 'feature',
    });
    assert.ok(item.id, 'Item must have generated ID');
    assert.strictEqual(item.title, 'WebSocket Architecture Spec');
    favId = item.id;
    assert.strictEqual(fm.getFavorites().length, initialLength + 1);
  });

  await it('Updates / renames favorite inline', async () => {
    const updated = await fm.updateFavorite(favId, {
      title: 'Production WebSocket Architecture',
    });
    assert.ok(updated, 'Update should return true');
    const item = fm.getFavorites().find((f) => f.id === favId);
    assert.strictEqual(item.title, 'Production WebSocket Architecture');
    assert.strictEqual(item.prompt, 'Design a scalable WebSocket gateway with room channels');
  });

  await it('Deletes favorite by ID', async () => {
    const deleted = await fm.deleteFavorite(favId);
    assert.ok(deleted, 'Delete should return true');
    assert.strictEqual(fm.getFavorites().length, initialLength);
  });

  console.log('\n--- 3. Testing API Input Validation & Error Handling ---');

  await it('Rejects prompt with < 3 characters', async () => {
    const res = await enhancePrompt({ prompt: 'hi' });
    assert.strictEqual(res.success, false);
    assert.ok(res.error.includes('at least 3 characters'));
  });

  await it('Rejects prompt exceeding 1500 characters', async () => {
    const longPrompt = 'a'.repeat(1501);
    const res = await enhancePrompt({ prompt: longPrompt });
    assert.strictEqual(res.success, false);
    assert.ok(res.error.includes('1,500') || res.error.includes('1500'));
  });

  await it('Formats timeout errors into user-friendly message', () => {
    const errObj = new Error('Request timed out');
    errObj.name = 'AbortError';
    const res = formatApiError(errObj);
    assert.strictEqual(res.code, 'TIMEOUT');
    assert.ok(res.error.includes('timed out'));
  });

  await it('Formats network connection errors with endpoint hint', () => {
    const errObj = new Error('ECONNREFUSED');
    const res = formatApiError(errObj);
    assert.strictEqual(res.code, 'NETWORK_ERROR');
    assert.ok(res.error.includes('Unable to reach TejasAI API'));
  });

  console.log('\n--- 4. Testing Live TejasAI Endpoint Contract ---');

  await it('Enhances valid prompt via live API endpoint', async () => {
    const res = await enhancePrompt({
      prompt: 'Build a rate limiting middleware for Express using Redis sliding window',
      targetAI: 'chatgpt',
    });

    console.log(`     Response Success: ${res.success}`);
    assert.strictEqual(res.success, true, `API call failed: ${res.error}`);
    assert.ok(res.enhancedPrompt && res.enhancedPrompt.length > 50, 'Enhanced prompt returned');
    assert.ok(Array.isArray(res.whyBetter), 'whyBetter is an array');
    console.log(`     Enhanced Length: ${res.enhancedPrompt.length} chars`);
    console.log(`     Why Better points: ${res.whyBetter.length}`);
  });

  console.log(`\n========================================`);
  console.log(`All ${passedTests}/${totalTests} tests passed successfully!`);
  console.log(`========================================\n`);
}

run().catch((err) => {
  console.error('\nTest suite encountered a fatal error:', err);
  process.exit(1);
});
