import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const { enhancePrompt, setGroqCooldown, clearGroqCooldown } = await import('../services/aiService.js');

console.log('=== TEST 1: Default Primary Engine (Groq) ===');
try {
  clearGroqCooldown();
  const res1 = await enhancePrompt({ prompt: 'Write an email asking for sick leave' });
  console.log('Test 1 Success! Engine used:', res1.engineUsed);
  console.log('Enhanced prompt preview:', res1.enhancedPrompt.slice(0, 100) + '...');
  console.log('Why better:', res1.whyBetter);
} catch (e) {
  console.error('Test 1 Failed:', e);
}

console.log('\n=== TEST 2: Fallback when Groq is on Cooldown (e.g. credits over / rate limit) ===');
try {
  setGroqCooldown(10 * 60 * 1000); // simulate cooldown
  const res2 = await enhancePrompt({ prompt: 'Explain quantum computing in simple terms' });
  console.log('Test 2 Success! Engine used:', res2.engineUsed);
  console.log('Enhanced prompt preview:', res2.enhancedPrompt.slice(0, 100) + '...');
  console.log('Why better:', res2.whyBetter);
} catch (e) {
  console.error('Test 2 Failed:', e);
} finally {
  clearGroqCooldown();
}

console.log('\n=== TEST 3: Fallback when Groq API key is invalid / credits depleted ===');
const originalKey = process.env.GROQ_API_KEY;
try {
  // Simulate invalid key or 401/402 credit issue
  process.env.GROQ_API_KEY = 'gsk_invalid_test_key_simulating_depleted_credits';
  clearGroqCooldown();
  const res3 = await enhancePrompt({ prompt: 'Create a recipe for chocolate chip cookies' });
  console.log('Test 3 Success! Engine used:', res3.engineUsed);
  console.log('Enhanced prompt preview:', res3.enhancedPrompt.slice(0, 100) + '...');
  console.log('Why better:', res3.whyBetter);
} catch (e) {
  console.error('Test 3 Failed:', e);
} finally {
  process.env.GROQ_API_KEY = originalKey;
  clearGroqCooldown();
}

console.log('\n=== ALL TESTS COMPLETE ===');


