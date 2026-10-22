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
 * @param {string} [options.targetAI='any'] - Target engine (chatgpt|gemini|claude|perplexity|deepseek|any)
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
      error: 'Prompt cannot be empty.',
    };
  }

  const cleanedPrompt = prompt.trim();

  if (cleanedPrompt.length < 3) {
    return {
      success: false,
      error: 'Please enter a prompt with at least 3 characters.',
    };
  }

  if (cleanedPrompt.length > 1500) {
    return {
      success: false,
      error: 'Prompt exceeds maximum allowed length of 1,500 characters.',
    };
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 45000);

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
      if (response.status === 429) {
        return {
          success: false,
          error: data?.error || 'Rate limit reached. Please wait a moment before trying again.',
          statusCode: 429,
        };
      }

      if (response.status === 400) {
        return {
          success: false,
          error: data?.error || 'Invalid prompt request.',
          statusCode: 400,
        };
      }

      if (response.status === 503) {
        return {
          success: false,
          error: data?.error || 'AI service temporarily unavailable. Please retry shortly.',
          statusCode: 503,
        };
      }

      return {
        success: false,
        error: data?.error || `Server returned error (${response.status}: ${response.statusText}).`,
        statusCode: response.status,
      };
    }

    if (!data || !data.success || !data.enhancedPrompt) {
      return {
        success: false,
        error: data?.error || 'Invalid response received from TejasAI server.',
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
        error: 'Enhancement request timed out (45s). Please try again.',
      };
    }

    return {
      success: false,
      error: 'Could not connect to TejasAI server. Please check your internet connection.',
      isNetworkError: true,
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
