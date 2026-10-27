/**
 * TejasAI VS Code Extension - Live API Client
 *
 * Exclusively communicates with the live deployed TejasAI backend.
 * Protects user content and guarantees backend-held secrets.
 */

const LIVE_API_BASE_URL = process.env.TEJASAI_API_URL || 'https://tejasai-eta.vercel.app/api';

/**
 * Standardizes API error responses.
 */
function formatApiError(err, res, data) {
  if (err) {
    if (err.name === 'AbortError') {
      return {
        success: false,
        code: 'TIMEOUT',
        error: 'TejasAI request timed out after 25s. Click Retry to re-run.',
        recoverable: true,
      };
    }
    return {
      success: false,
      code: 'NETWORK_ERROR',
      error: `Unable to reach TejasAI API (${err.message}). Please check your connection.`,
      recoverable: true,
    };
  }

  if (res && !res.ok) {
    if (res.status === 422) {
      return {
        success: false,
        code: 'CONTENT_POLICY',
        error: data?.error || 'Prompt conflicts with content safety policies.',
        recoverable: false,
      };
    }
    if (res.status === 400) {
      return {
        success: false,
        code: 'INVALID_INPUT',
        error: data?.error || 'Please enter a valid prompt between 3 and 1,500 characters.',
        recoverable: false,
      };
    }
    if (res.status >= 500) {
      return {
        success: false,
        code: 'SERVER_ERROR',
        error: data?.error || 'AI inference engine is temporarily busy. Click Retry to re-run.',
        recoverable: true,
      };
    }
    return {
      success: false,
      code: 'HTTP_ERROR',
      error: data?.error || `HTTP ${res.status}: Failed to process prompt request.`,
      recoverable: res.status >= 500,
    };
  }

  return {
    success: false,
    code: 'EMPTY_RESPONSE',
    error: 'Received empty response from TejasAI API.',
    recoverable: true,
  };
}

/**
 * Enhances a prompt using the live TejasAI API.
 *
 * @param {Object} options
 * @param {string} options.prompt - Prompt text to enhance (min 3 chars).
 * @param {string} [options.targetAI='any'] - Target platform ('any' | 'chatgpt' | 'claude' | 'gemini').
 * @param {string} [options.tweak=''] - Quick modification ('shorter' | 'simpler' | 'moreDetail').
 * @param {string} [options.previousResult=''] - Previous enhancement if tweaking.
 * @returns {Promise<{ success: boolean, enhancedPrompt?: string, whyBetter?: string[], error?: string, code?: string }>}
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
      code: 'INVALID_INPUT',
      error: 'Please enter a prompt with at least 3 characters.',
    };
  }

  const cleaned = prompt.trim();
  if (cleaned.length > 1500) {
    return {
      success: false,
      code: 'MAX_LENGTH_EXCEEDED',
      error: 'Prompt exceeds maximum allowed length of 1,500 characters.',
    };
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 25000);

  try {
    const res = await fetch(`${LIVE_API_BASE_URL}/enhance`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt: cleaned,
        targetAI,
        tweak,
        previousResult,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    const data = await res.json().catch(() => null);

    if (!res.ok || !data) {
      return formatApiError(null, res, data);
    }

    return (
      data || {
        success: false,
        code: 'EMPTY_RESPONSE',
        error: 'Received empty response from TejasAI API.',
      }
    );
  } catch (err) {
    clearTimeout(timeoutId);
    return formatApiError(err, null, null);
  }
}

/**
 * Analyzes prompt completeness before enhancing in VS Code.
 * Returns either immediate enhancedPrompt (if sufficient) or Question 1 (if incomplete).
 */
async function analyzePrompt({ prompt, targetAI = 'any' }) {
  if (!prompt || typeof prompt !== 'string' || prompt.trim().length < 3) {
    return {
      success: false,
      code: 'INVALID_INPUT',
      error: 'Please enter a prompt with at least 3 characters.',
    };
  }

  const cleaned = prompt.trim();
  if (cleaned.length > 1500) {
    return {
      success: false,
      code: 'MAX_LENGTH_EXCEEDED',
      error: 'Prompt exceeds maximum allowed length of 1,500 characters.',
    };
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 25000);

  try {
    const res = await fetch(`${LIVE_API_BASE_URL}/enhance/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt: cleaned,
        targetAI,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    const data = await res.json().catch(() => null);

    if (!res.ok || !data) {
      return formatApiError(null, res, data);
    }

    return (
      data || {
        success: false,
        code: 'EMPTY_RESPONSE',
        error: 'Received empty response from TejasAI API.',
      }
    );
  } catch (err) {
    clearTimeout(timeoutId);
    return formatApiError(err, null, null);
  }
}

/**
 * Submits user's answer to a clarification question or skips.
 */
async function clarifyPrompt({
  prompt,
  targetAI = 'any',
  clarificationHistory = [],
  currentQuestion = null,
  answer,
  skip = false,
}) {
  if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
    return {
      success: false,
      code: 'INVALID_INPUT',
      error: 'Original prompt is required.',
    };
  }

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
        answer: skip ? 'Skipped' : answer,
        skip,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    const data = await res.json().catch(() => null);

    if (!res.ok || !data) {
      return formatApiError(null, res, data);
    }

    return (
      data || {
        success: false,
        code: 'EMPTY_RESPONSE',
        error: 'Received empty response from TejasAI API.',
      }
    );
  } catch (err) {
    clearTimeout(timeoutId);
    return formatApiError(err, null, null);
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
  analyzePrompt,
  clarifyPrompt,
  checkHealth,
  formatApiError,
};
