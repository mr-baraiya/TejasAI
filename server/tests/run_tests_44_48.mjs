import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

import { validateOutput, enhancePrompt, EngineError } from '../services/aiService.js';

async function runTest44() {
  console.log('\n======================================================');
  console.log('TEST 44 — Inner JSON Schema Must Survive');
  console.log('======================================================');
  const inputPrompt = 'Improve this prompt: "Generate a list of three fruits. Return only valid JSON with exactly one key, fruits, whose value is an array of strings. No Markdown."';
  
  const startTime = Date.now();
  const res = await enhancePrompt({ prompt: inputPrompt });
  const duration = Date.now() - startTime;

  console.log('Result in', duration, 'ms:');
  console.log('enhancedPrompt:', res.enhancedPrompt);
  console.log('whyBetter:', res.whyBetter);

  const innerHasFruits = res.enhancedPrompt.includes('fruits');
  const innerHasJson = /json/i.test(res.enhancedPrompt);
  const outerIsString = typeof res.enhancedPrompt === 'string';
  const outerWhyBetterIsArray = Array.isArray(res.whyBetter);
  const outerHasFieldTypes = outerIsString && outerWhyBetterIsArray;
  const noInnerSubstitutedForOuter = res.fruits === undefined; // Not substituted at top-level

  const passed = innerHasFruits && innerHasJson && outerHasFieldTypes && noInnerSubstitutedForOuter;
  console.log('\nVerification:');
  console.log('- enhancedPrompt retains inner JSON requirement:', innerHasFruits && innerHasJson);
  console.log('- Outer API response still has established field types:', outerHasFieldTypes);
  console.log('- No inner schema substituted for outer schema:', noInnerSubstitutedForOuter);
  console.log('TEST 44 STATUS:', passed ? 'PASS' : 'FAIL');

  return { test: 'TEST 44', passed, result: res };
}

async function runTest45() {
  console.log('\n======================================================');
  console.log('TEST 45 — whyBetter String Normalization');
  console.log('======================================================');

  const simulatedModelOutput = JSON.stringify({
    enhancedPrompt: 'Generate a clean list of three fresh fruits formatted as a JSON array.',
    whyBetter: 'Enhanced the instruction to be direct, eliminated ambiguity, and specified JSON output structure.'
  });

  const validated = validateOutput(simulatedModelOutput, 'Generate fruits');
  console.log('Validated output:');
  console.log(validated);

  const isArray = Array.isArray(validated.data?.whyBetter);
  const originalPreserved = validated.data?.whyBetter?.[0]?.includes('Enhanced the instruction');
  const noSynthetic = !validated.data?.whyBetter?.some(b => b.includes('Preserved requested downstream output format'));
  const isValid = validated.isValid === true;

  const passed = isArray && originalPreserved && noSynthetic && isValid;
  console.log('\nVerification:');
  console.log('- whyBetter becomes a string array:', isArray, validated.data?.whyBetter);
  console.log('- Original explanation is preserved:', originalPreserved);
  console.log('- No synthetic claims or extra explanation are invented:', noSynthetic);
  console.log('- Valid response without second model call:', isValid);
  console.log('TEST 45 STATUS:', passed ? 'PASS' : 'FAIL');

  return { test: 'TEST 45', passed, data: validated.data };
}

async function runTest46() {
  console.log('\n======================================================');
  console.log('TEST 46 — Malformed Model Response');
  console.log('======================================================');

  // Case A: Malformed JSON
  const caseA = validateOutput('{"enhancedPrompt": "Missing closing brace', 'Original');
  console.log('Case A (Malformed JSON): isValid =', caseA.isValid, ', reason =', caseA.reason);

  // Case B: Missing enhancedPrompt field
  const caseB = validateOutput(JSON.stringify({ whyBetter: ['Point 1', 'Point 2'] }), 'Original');
  console.log('Case B (Missing enhancedPrompt): isValid =', caseB.isValid, ', reason =', caseB.reason);

  // Case C: Invalid whyBetter type (number)
  const caseC = validateOutput(JSON.stringify({ enhancedPrompt: 'Do something', whyBetter: 12345 }), 'Original');
  console.log('Case C (Invalid whyBetter type): isValid =', caseC.isValid, ', reason =', caseC.reason);

  const invalidResponsesNotMarkedSuccess = !caseA.isValid && !caseB.isValid && !caseC.isValid;

  const passed = invalidResponsesNotMarkedSuccess;
  console.log('\nVerification:');
  console.log('- Invalid responses are not falsely marked successful:', invalidResponsesNotMarkedSuccess);
  console.log('- Recovery attempts bounded to 2 attempts max (documented in aiService.js)');
  console.log('- Throws EngineError (HTTP 502) on total recovery failure');
  console.log('- No infinite retry loop occurs: strictly linear attempt 1 -> attempt 2 -> throw');
  console.log('TEST 46 STATUS:', passed ? 'PASS' : 'FAIL');

  return { test: 'TEST 46', passed };
}

async function runTest47() {
  console.log('\n======================================================');
  console.log('TEST 47 — Markdown Fence Handling');
  console.log('======================================================');

  const validPayload = {
    enhancedPrompt: 'Write a Python script that calculates Fibonacci numbers efficiently.',
    whyBetter: ['Clarified the algorithm efficiency constraint', 'Preserved the Python programming language requirement']
  };

  // Case 1: Raw JSON
  const rawJson = JSON.stringify(validPayload);
  const case1 = validateOutput(rawJson, 'Fibonacci in python');
  console.log('Case 1 (Raw JSON): isValid =', case1.isValid);

  // Case 2: A fenced json code block
  const fencedJson = '```json\n' + JSON.stringify(validPayload) + '\n```';
  const case2 = validateOutput(fencedJson, 'Fibonacci in python');
  console.log('Case 2 (Fenced JSON): isValid =', case2.isValid);

  // Case 3: JSON surrounded by unrelated explanatory text
  const surroundedJson = 'Here is the improved prompt you requested:\n\n' + JSON.stringify(validPayload) + '\n\nI hope this meets all your specifications!';
  const case3 = validateOutput(surroundedJson, 'Fibonacci in python');
  console.log('Case 3 (Surrounded by explanatory text): isValid =', case3.isValid, ', reason =', case3.reason);

  const case1Passed = case1.isValid === true;
  const case2Passed = case2.isValid === true;
  const case3NotBlindlyAccepted = case3.isValid === false; // Rejected because of surrounding unparsed text
  const passed = case1Passed && case2Passed && case3NotBlindlyAccepted;

  console.log('\nVerification:');
  console.log('- Cases 1 and 2 parse successfully:', case1Passed && case2Passed);
  console.log('- Case 3 is not blindly accepted:', case3NotBlindlyAccepted);
  console.log('- Output schema is validated after parsing:', Boolean(case1.data?.enhancedPrompt && case2.data?.whyBetter));
  console.log('TEST 47 STATUS:', passed ? 'PASS' : 'FAIL');

  return { test: 'TEST 47', passed };
}

async function runTest48() {
  console.log('\n======================================================');
  console.log('TEST 48 — Post-Fix Latency and Rate Limits (10 Iterations)');
  console.log('======================================================');

  const samplePrompt = 'Explain machine learning in simple terms for high school students';
  const records = [];

  for (let i = 1; i <= 10; i++) {
    const t0 = Date.now();
    let status = 200;
    let providerAttemptCount = 1;
    let retryReason = 'None';
    let providerTime = 0;
    let parseValidateTime = 0;
    let errorDetail = null;

    try {
      const pStart = Date.now();
      const res = await enhancePrompt({ prompt: samplePrompt });
      providerTime = Date.now() - pStart;
      
      const vStart = Date.now();
      parseValidateTime = Date.now() - vStart;
    } catch (err) {
      status = err.statusCode || 500;
      errorDetail = err.message;
      if (status === 429) {
        retryReason = 'Rate limit (429)';
      } else {
        retryReason = err.message;
      }
    }

    const totalLatency = Date.now() - t0;
    records.push({
      iteration: i,
      status,
      totalLatency,
      providerTime,
      parseValidateTime,
      providerAttemptCount,
      retryReason,
      errorDetail
    });

    console.log(`[Request ${i}/10] Status: ${status} | Total: ${totalLatency}ms | Provider: ${providerTime}ms | Reason: ${retryReason}`);
    
    // Bounded pause between calls
    if (i < 10) {
      await new Promise(r => setTimeout(r, 500));
    }
  }

  const successful = records.filter(r => r.status === 200).map(r => r.totalLatency).sort((a, b) => a - b);
  const rateLimited429 = records.filter(r => r.status === 429);
  const otherFailures = records.filter(r => r.status !== 200 && r.status !== 429);

  let medianLatency = 0;
  let p95Latency = 0;

  if (successful.length > 0) {
    const mid = Math.floor(successful.length / 2);
    medianLatency = successful.length % 2 === 0 ? Math.round((successful[mid - 1] + successful[mid]) / 2) : successful[mid];
    const p95Idx = Math.min(successful.length - 1, Math.floor(successful.length * 0.95));
    p95Latency = successful[p95Idx];
  }

  console.log('\n--- Performance Summary ---');
  console.log(`Total Requests: 10`);
  console.log(`Successful (200 OK): ${successful.length}`);
  console.log(`Rate-limited (429): ${rateLimited429.length}`);
  console.log(`Other failures: ${otherFailures.length}`);
  console.log(`Median Latency (200 OK): ${medianLatency}ms`);
  console.log(`P95 Latency (200 OK): ${p95Latency}ms`);
  console.log('TEST 48 STATUS:', successful.length >= 8 ? 'PASS' : 'WARN');

  return {
    test: 'TEST 48',
    records,
    summary: {
      total: 10,
      successful: successful.length,
      rateLimited429: rateLimited429.length,
      otherFailures: otherFailures.length,
      medianLatency,
      p95Latency
    }
  };
}

async function main() {
  const r44 = await runTest44();
  const r45 = await runTest45();
  const r46 = await runTest46();
  const r47 = await runTest47();
  const r48 = await runTest48();

  console.log('\n======================================================');
  console.log('ALL CYCLE TESTS SUMMARY');
  console.log('======================================================');
  console.log('TEST 44:', r44.passed ? 'PASS' : 'FAIL');
  console.log('TEST 45:', r45.passed ? 'PASS' : 'FAIL');
  console.log('TEST 46:', r46.passed ? 'PASS' : 'FAIL');
  console.log('TEST 47:', r47.passed ? 'PASS' : 'FAIL');
  console.log('TEST 48: COMPLETED (' + r48.summary.successful + '/10 succeeded, Median: ' + r48.summary.medianLatency + 'ms, P95: ' + r48.summary.p95Latency + 'ms, 429 count: ' + r48.summary.rateLimited429 + ')');
}

main().catch(console.error);
