/**
 * TejasAI VS Code Extension - Live API Client
 *
 * Exclusively communicates with the live deployed TejasAI backend.
 */

const LIVE_API_BASE_URL = 'https://tejasai-eta.vercel.app/api';

/**
 * Enhances a prompt using the live TejasAI API.
 *
 * @param {Object} options
 * @param {string} options.prompt - Prompt text to enhance (min 3 chars).
 * @param {string} [options.targetAI='any'] - Target platform ('any' | 'chatgpt' | 'claude' | 'gemini').
 * @param {string} [options.tweak=''] - Quick modification ('shorter' | 'simpler' | 'moreDetail').
 * @param {string} [options.previousResult=''] - Previous enhancement if tweaking.
 * @returns {Promise<{ success: boolean, enhancedPrompt?: string, whyBetter?: string[], error?: string }>}
 */
async function enhancePrompt({
  prompt,
  targetAI = 'any',
  tweak = '',
  previousResult = '',
}) {
  if (!prompt || typeof prompt !== 'string' || prompt.trim().length < 3) {
    return {
      success: false,
      error: 'Please enter a prompt with at least 3 characters.',
    };
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 25000);

  try {
    const res = await fetch(`${LIVE_API_BASE_URL}/enhance`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt: prompt.trim(),
        targetAI,
        tweak,
        previousResult,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    const data = await res.json().catch(() => null);

    if (!res.ok) {
      return {
        success: false,
        error: data?.error || `HTTP ${res.status}: Failed to enhance prompt.`,
      };
    }

    return (
      data || {
        success: false,
        error: 'Received empty response from TejasAI API.',
      }
    );
  } catch (err) {
    clearTimeout(timeoutId);
    return {
      success: false,
      error: err.name === 'AbortError' ? 'Enhancement request timed out.' : err.message,
    };
  }
}

/**
 * Verifies backend health.
 */
async function checkHealth() {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000);

  try {
    const res = await fetch(`${LIVE_API_BASE_URL}/health`, {
      method: 'GET',
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    if (!res.ok) return { online: false };
    const data = await res.json();
    return { online: data.status === 'online', model: data.groqModel };
  } catch {
    clearTimeout(timeoutId);
    return { online: false };
  }
}

module.exports = {
  LIVE_API_BASE_URL,
  enhancePrompt,
  checkHealth,
};
