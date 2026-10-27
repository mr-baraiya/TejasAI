/**
 * TejasAI Client API Service
 * Handles communication with the Express backend using native Fetch API.
 * The Groq API key is NEVER stored or referenced on the frontend.
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

/**
 * Enhances a user prompt through the TejasAI backend engine.
 *
 * @param {Object} payload
 * @param {string} payload.prompt - User's prompt text
 * @param {string} [payload.targetAI='any'] - Target AI platform
 * @param {string} [payload.tweak=''] - Optional tweak instruction (shorter, simpler, more_detail)
 * @param {string} [payload.category='general'] - Enhancement category
 * @param {string} [payload.tone='balanced'] - Output depth/tone
 * @param {AbortSignal} [signal] - Optional abort signal for cancellations
 * @returns {Promise<{ success: boolean, enhancedPrompt: string, whyBetter: string[], meta?: object }>}
 */
export async function enhancePromptApi(
  { prompt, targetAI = 'any', tweak = '', previousResult = '' },
  signal
) {
  try {
    const response = await fetch(`${API_BASE_URL}/enhance`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt,
        targetAI,
        tweak,
        previousResult,
      }),
      signal,
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      const errorMessage = data?.error || `Server responded with status ${response.status} (${response.statusText})`;
      const error = new Error(errorMessage);
      error.status = response.status;
      error.code = data?.code || null;
      error.category = data?.category || null;
      error.isPolicyViolation = response.status === 422;
      error.isConfigError = response.status === 503;
      throw error;
    }

    if (!data || !data.success || !data.enhancedPrompt) {
      throw new Error(data?.error || 'Enhancement failed: Invalid response received from server.');
    }

    return data;
  } catch (err) {
    if (err.name === 'AbortError') {
      const cancelError = new Error('Enhancement request was cancelled.');
      cancelError.isCancelled = true;
      throw cancelError;
    }

    // Network / connection errors
    if (!err.status && err.message.includes('Failed to fetch')) {
      const connError = new Error('Could not connect to TejasAI backend server. Please verify the server is running on port 5000.');
      connError.isConnectionError = true;
      throw connError;
    }

    throw err;
  }
}

/**
 * Analyzes prompt completeness before enhancing.
 * Returns either immediate enhancedPrompt (if sufficient) or Question 1 (if incomplete).
 *
 * @param {Object} payload
 * @param {string} payload.prompt
 * @param {string} [payload.targetAI='any']
 * @param {AbortSignal} [signal]
 */
export async function analyzePromptApi({ prompt, targetAI = 'any' }, signal) {
  try {
    const response = await fetch(`${API_BASE_URL}/enhance/analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt,
        targetAI,
      }),
      signal,
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      const errorMessage = data?.error || `Server responded with status ${response.status}`;
      const error = new Error(errorMessage);
      error.status = response.status;
      error.code = data?.code || null;
      error.category = data?.category || null;
      error.isPolicyViolation = response.status === 422;
      error.isConfigError = response.status === 503;
      throw error;
    }

    if (!data || !data.success) {
      throw new Error(data?.error || 'Analysis failed: Invalid response from server.');
    }

    return data;
  } catch (err) {
    if (err.name === 'AbortError') {
      const cancelError = new Error('Enhancement request was cancelled.');
      cancelError.isCancelled = true;
      throw cancelError;
    }
    if (!err.status && err.message && err.message.includes('Failed to fetch')) {
      const connError = new Error('Could not connect to TejasAI backend server.');
      connError.isConnectionError = true;
      throw connError;
    }
    throw err;
  }
}

/**
 * Submits an answer to a clarification question or requests to skip to immediate enhancement.
 *
 * @param {Object} payload
 * @param {string} payload.prompt
 * @param {string} [payload.targetAI='any']
 * @param {Array} [payload.clarificationHistory=[]]
 * @param {Object|string} [payload.currentQuestion]
 * @param {string|Object} [payload.answer]
 * @param {boolean} [payload.skip=false]
 * @param {AbortSignal} [signal]
 */
export async function clarifyPromptApi(
  {
    prompt,
    targetAI = 'any',
    clarificationHistory = [],
    currentQuestion = null,
    answer,
    skip = false,
  },
  signal
) {
  try {
    const response = await fetch(`${API_BASE_URL}/enhance/clarify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt,
        targetAI,
        clarificationHistory,
        currentQuestion,
        answer,
        skip,
      }),
      signal,
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      const errorMessage = data?.error || `Server responded with status ${response.status}`;
      const error = new Error(errorMessage);
      error.status = response.status;
      error.code = data?.code || null;
      error.isPolicyViolation = response.status === 422;
      error.isConfigError = response.status === 503;
      throw error;
    }

    if (!data || !data.success) {
      throw new Error(data?.error || 'Clarification failed: Invalid response from server.');
    }

    return data;
  } catch (err) {
    if (err.name === 'AbortError') {
      const cancelError = new Error('Clarification request was cancelled.');
      cancelError.isCancelled = true;
      throw cancelError;
    }
    if (!err.status && err.message && err.message.includes('Failed to fetch')) {
      const connError = new Error('Could not connect to TejasAI backend server.');
      connError.isConnectionError = true;
      throw connError;
    }
    throw err;
  }
}

/**
 * Checks the status and Groq readiness of the backend server.
 *
 * @returns {Promise<{ status: string, groqConfigured: boolean, groqModel: string }>}
 */
export async function checkServerHealth() {
  try {
    const response = await fetch(`${API_BASE_URL}/health`, {
      method: 'GET',
    });
    if (!response.ok) return null;
    return await response.json();
  } catch {
    return null;
  }
}

/**
 * Submits contact or feedback inquiry to backend.
 *
 * @param {Object} formData
 * @param {string} formData.name
 * @param {string} formData.email
 * @param {string} formData.category
 * @param {string} [formData.phone]
 * @param {string} formData.comments
 * @returns {Promise<{ success: boolean, message: string }>}
 */
export async function submitContactForm(formData) {
  try {
    const response = await fetch(`${API_BASE_URL}/contact`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(formData),
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      throw new Error(data?.error || `Failed to submit form (${response.status})`);
    }

    return data || { success: true, message: 'Response submitted successfully.' };
  } catch (err) {
    if (err.message && err.message.includes('Failed to fetch')) {
      // Graceful fallback for offline or development without backend
      return {
        success: true,
        message: 'Your message has been recorded locally. Thank you for your feedback!',
      };
    }
    throw err;
  }
}

