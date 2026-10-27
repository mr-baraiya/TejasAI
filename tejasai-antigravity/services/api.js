/**
 * TejasAI Antigravity Integration - Live API Client
 *
 * Connects exclusively to the live TejasAI production backend.
 * Provides prompt enhancement, intent analysis, clarification workflows, and health status.
 */

export const LIVE_API_BASE_URL = 'https://tejasai-eta.vercel.app/api';

/**
 * Enhances a user prompt or vibe-coding task using the live TejasAI API.
 *
 * @param {Object} params
 * @param {string} params.prompt - The input prompt to enhance (min 3 chars).
 * @param {string} [params.targetAI='any'] - Target model: 'any' | 'chatgpt' | 'claude' | 'gemini'.
 * @param {string} [params.tweak=''] - Quick tweak: 'shorter' | 'simpler' | 'moreDetail'.
 * @param {string} [params.previousResult=''] - Previous enhanced prompt for tweaks.
 * @returns {Promise<{ success: boolean, enhancedPrompt?: string, whyBetter?: string[], meta?: object, error?: string }>}
 */
export async function enhancePrompt({
  prompt,
  targetAI = 'any',
  tweak = '',
  previousResult = '',
}) {
  if (!prompt || typeof prompt !== 'string' || prompt.trim().length < 3) {
    return {
      success: false,
      error: 'Prompt must be at least 3 characters long.',
      statusCode: 400,
    };
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000);

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
        error: data?.error || `Server responded with HTTP ${res.status}`,
        statusCode: res.status,
      };
    }

    return (
      data || {
        success: false,
        error: 'Empty response received from TejasAI API.',
      }
    );
  } catch (err) {
    clearTimeout(timeoutId);
    return {
      success: false,
      error: err.name === 'AbortError' ? 'Request timed out after 30 seconds.' : err.message,
      statusCode: 500,
    };
  }
}

/**
 * Analyzes a prompt before enhancing to check for completeness and sufficiency.
 *
 * @param {Object} params
 * @param {string} params.prompt
 * @param {string} [params.targetAI='any']
 * @returns {Promise<object>}
 */
export async function analyzePrompt({ prompt, targetAI = 'any' }) {
  if (!prompt || typeof prompt !== 'string' || prompt.trim().length < 3) {
    return {
      success: false,
      error: 'Prompt must be at least 3 characters long.',
      statusCode: 400,
    };
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 20000);

  try {
    const res = await fetch(`${LIVE_API_BASE_URL}/enhance/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt: prompt.trim(),
        targetAI,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    const data = await res.json().catch(() => null);

    if (!res.ok) {
      return {
        success: false,
        error: data?.error || `Analysis failed with HTTP ${res.status}`,
        statusCode: res.status,
      };
    }

    return data || { success: false, error: 'Empty analysis response.' };
  } catch (err) {
    clearTimeout(timeoutId);
    return {
      success: false,
      error: err.name === 'AbortError' ? 'Analysis timed out.' : err.message,
      statusCode: 500,
    };
  }
}

/**
 * Submits an answer to a clarification question or requests skip.
 *
 * @param {Object} params
 * @returns {Promise<object>}
 */
export async function clarifyPrompt({
  prompt,
  targetAI = 'any',
  clarificationHistory = [],
  currentQuestion = null,
  answer,
  skip = false,
}) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 25000);

  try {
    const res = await fetch(`${LIVE_API_BASE_URL}/enhance/clarify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt: prompt.trim(),
        targetAI,
        clarificationHistory,
        currentQuestion,
        answer,
        skip,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    const data = await res.json().catch(() => null);

    if (!res.ok) {
      return {
        success: false,
        error: data?.error || `Clarification failed with HTTP ${res.status}`,
        statusCode: res.status,
      };
    }

    return data || { success: false, error: 'Empty clarification response.' };
  } catch (err) {
    clearTimeout(timeoutId);
    return {
      success: false,
      error: err.name === 'AbortError' ? 'Clarification request timed out.' : err.message,
      statusCode: 500,
    };
  }
}

/**
 * Verifies live connection to the TejasAI backend.
 *
 * @returns {Promise<{ online: boolean, app?: string, model?: string, error?: string }>}
 */
export async function checkHealth() {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000);

  try {
    const res = await fetch(`${LIVE_API_BASE_URL}/health`, {
      method: 'GET',
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!res.ok) {
      return { online: false, error: `HTTP ${res.status}` };
    }

    const data = await res.json();
    return {
      online: data.status === 'online',
      app: data.app,
      model: data.groqModel,
      groqConfigured: data.groqConfigured,
      timestamp: data.timestamp,
    };
  } catch (err) {
    clearTimeout(timeoutId);
    return { online: false, error: err.message };
  }
}
