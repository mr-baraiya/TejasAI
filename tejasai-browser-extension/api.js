/**
 * TejasAI Browser Extension - API Client Adapter
 *
 * Communicates with the deployed TejasAI backend API (Express + Groq LPU).
 * All provider keys and model secrets stay safely on the backend.
 * Never bundles or exposes any private API credentials.
 */

export const DEFAULT_API_BASE_URL = 'https://tejasai-eta.vercel.app/api';

/**
 * Enhances a prompt using the TejasAI backend endpoint.
 *
 * @param {Object} options
 * @param {string} options.prompt - Prompt text to enhance (min 3, max 1500 chars)
 * @param {string} [options.targetAI='any'] - Target engine (chatgpt|gemini|claude|perplexity|deepseek|grok|any)
 * @param {string} [options.tweak=''] - Optional quick tweak (shorter|simpler|moreDetail)
 * @param {string} [options.previousResult=''] - Previous enhancement if tweaking
 * @param {string} [options.apiBaseUrl] - Optional custom API base URL
 * @returns {Promise<{ success: boolean, enhancedPrompt?: string, whyBetter?: string[], meta?: object, error?: string }>}
 */
export async function enhancePromptApi({
  prompt,
  targetAI = 'any',
  tweak = '',
  previousResult = '',
  apiBaseUrl = DEFAULT_API_BASE_URL,
}) {
  if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
    return {
      success: false,
      error: 'Please enter a prompt first.',
      statusCode: 400,
      recoverable: false,
    };
  }

  const cleanedPrompt = prompt.trim();

  if (cleanedPrompt.length > 1500) {
    return {
      success: false,
      error: 'Prompt exceeds maximum allowed length of 1,500 characters.',
      statusCode: 400,
      recoverable: false,
    };
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 25000);

  const cleanBaseUrl = (apiBaseUrl || DEFAULT_API_BASE_URL).replace(/\/+$/, '');

  try {
    const response = await fetch(`${cleanBaseUrl}/enhance`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: cleanedPrompt,
        targetAI,
        tweak,
        previousResult,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      if (typeof console !== 'undefined' && console.debug) {
        console.debug('[TejasAI API] HTTP Error:', response.status);
      }

      if (response.status === 400) {
        return {
          success: false,
          error: data?.error || 'Invalid prompt request.',
          statusCode: 400,
          recoverable: false,
        };
      }

      if (response.status === 401 || response.status === 403) {
        return {
          success: false,
          error: data?.error || 'Authentication error connecting to TejasAI service.',
          statusCode: response.status,
          recoverable: false,
        };
      }

      if (response.status === 422) {
        return {
          success: false,
          error: data?.error || "This request cannot be enhanced as it conflicts with TejasAI's content policy.",
          statusCode: 422,
          code: data?.code || 'CONTENT_POLICY_VIOLATION',
          category: data?.category || 'content_policy',
          isPolicyViolation: true,
          recoverable: false,
        };
      }

      if (response.status === 429) {
        return {
          success: false,
          error: data?.error || 'Too many requests. Please wait a moment before trying again.',
          statusCode: 429,
          isRateLimit: true,
          recoverable: true,
        };
      }

      if (response.status === 500) {
        return {
          success: false,
          error: data?.error || 'TejasAI server error. Please try again.',
          statusCode: 500,
          isServerError: true,
          recoverable: true,
        };
      }

      if (response.status === 502 || response.status === 503 || response.status === 504) {
        return {
          success: false,
          error: data?.error || 'AI inference engine is temporarily unavailable. Please retry shortly.',
          statusCode: response.status,
          isServerError: true,
          recoverable: true,
        };
      }

      return {
        success: false,
        error: data?.error || `Server returned error (${response.status}: ${response.statusText}).`,
        statusCode: response.status,
        recoverable: response.status >= 500,
      };
    }

    if (!data || !data.success || !data.enhancedPrompt) {
      return {
        success: false,
        error: data?.error || 'Malformed or empty response received from TejasAI.',
        recoverable: true,
      };
    }

    return {
      success: true,
      enhancedPrompt: data.enhancedPrompt,
      whyBetter: Array.isArray(data.whyBetter) ? data.whyBetter : [],
      meta: data.meta || { targetAI, tweak: tweak || null },
    };
  } catch (err) {
    clearTimeout(timeoutId);

    if (err.name === 'AbortError') {
      return {
        success: false,
        error: 'Enhancement request timed out (25s). Please retry.',
        isTimeout: true,
        recoverable: true,
      };
    }

    const isOffline = typeof navigator !== 'undefined' && navigator.onLine === false;
    return {
      success: false,
      error: isOffline
        ? 'You are currently offline. Please check your internet connection.'
        : 'Network request to TejasAI failed. Please verify connectivity.',
      isNetworkError: true,
      recoverable: true,
    };
  }
}

/**
 * Checks connectivity to the TejasAI server.
 *
 * @param {string} [apiBaseUrl]
 * @returns {Promise<{ status: string, groqConfigured: boolean, groqModel: string }|null>}
 */
export async function checkServerHealth(apiBaseUrl = DEFAULT_API_BASE_URL) {
  const cleanBaseUrl = (apiBaseUrl || DEFAULT_API_BASE_URL).replace(/\/+$/, '');
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000);

  try {
    const res = await fetch(`${cleanBaseUrl}/health`, {
      method: 'GET',
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!res.ok) return null;
    return await res.json();
  } catch {
    clearTimeout(timeoutId);
    return null;
  }
}

/**
 * Analyzes prompt completeness before enhancing in the browser extension.
 * Returns either immediate enhancedPrompt (if sufficient) or Question 1 (if incomplete).
 *
 * @param {Object} options
 * @param {string} options.prompt
 * @param {string} [options.targetAI='any']
 * @param {string} [options.apiBaseUrl]
 */
export async function analyzePromptApi({
  prompt,
  targetAI = 'any',
  apiBaseUrl = DEFAULT_API_BASE_URL,
}) {
  if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
    return {
      success: false,
      error: 'Please enter a prompt first.',
      statusCode: 400,
    };
  }

  const cleanedPrompt = prompt.trim();
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 25000);
  const cleanBaseUrl = (apiBaseUrl || DEFAULT_API_BASE_URL).replace(/\/+$/, '');

  try {
    const response = await fetch(`${cleanBaseUrl}/enhance/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt: cleanedPrompt,
        targetAI,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    const data = await response.json().catch(() => null);

    if (!response.ok) {
      return {
        success: false,
        error: data?.error || `Server responded with status ${response.status}`,
        statusCode: response.status,
      };
    }

    return data || { success: false, error: 'Empty response received.' };
  } catch (err) {
    clearTimeout(timeoutId);
    return {
      success: false,
      error: err.name === 'AbortError' ? 'Request timed out.' : (err.message || 'Network error.'),
      statusCode: 500,
    };
  }
}

/**
 * Submits clarification answer or requests skip in browser extension.
 *
 * @param {Object} options
 * @param {string} options.prompt
 * @param {string} [options.targetAI='any']
 * @param {Array} [options.clarificationHistory=[]]
 * @param {Object|string} [options.currentQuestion]
 * @param {string|Object} [options.answer]
 * @param {boolean} [options.skip=false]
 * @param {string} [options.apiBaseUrl]
 */
export async function clarifyPromptApi({
  prompt,
  targetAI = 'any',
  clarificationHistory = [],
  currentQuestion = null,
  answer,
  skip = false,
  apiBaseUrl = DEFAULT_API_BASE_URL,
}) {
  if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
    return {
      success: false,
      error: 'Original prompt is required.',
      statusCode: 400,
    };
  }

  const cleanedPrompt = prompt.trim();
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 25000);
  const cleanBaseUrl = (apiBaseUrl || DEFAULT_API_BASE_URL).replace(/\/+$/, '');

  try {
    const response = await fetch(`${cleanBaseUrl}/enhance/clarify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt: cleanedPrompt,
        targetAI,
        clarificationHistory,
        currentQuestion,
        answer,
        skip,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    const data = await response.json().catch(() => null);

    if (!response.ok) {
      return {
        success: false,
        error: data?.error || `Server responded with status ${response.status}`,
        statusCode: response.status,
      };
    }

    return data || { success: false, error: 'Empty response received.' };
  } catch (err) {
    clearTimeout(timeoutId);
    return {
      success: false,
      error: err.name === 'AbortError' ? 'Request timed out.' : (err.message || 'Network error.'),
      statusCode: 500,
    };
  }
}
