/**
 * Validates and sanitizes the user prompt and options for TejasAI.
 * Requires prompt of at least 3 characters and at most 1500.
 * Accepts targetAI (any|chatgpt|gemini|claude, default any).
 * Supports tweak (shorter|simpler|moreDetail) and previousResult.
 * Ignores category and tone.
 */

const ALLOWED_TARGET_AIS = ['any', 'chatgpt', 'gemini', 'claude', 'perplexity', 'deepseek', 'grok'];
const ALLOWED_TWEAKS = ['shorter', 'simpler', 'moreDetail', 'more_detail'];

export function validatePrompt(body) {
  if (!body || typeof body !== 'object') {
    return {
      isValid: false,
      statusCode: 400,
      error: 'Invalid request body. JSON payload is required.',
    };
  }

  const {
    prompt,
    targetAI = 'any',
    tweak = '',
    previousResult = '',
  } = body;

  if (prompt === undefined || prompt === null) {
    return {
      isValid: false,
      statusCode: 400,
      error: 'Prompt is required.',
    };
  }

  if (typeof prompt !== 'string') {
    return {
      isValid: false,
      statusCode: 400,
      error: 'Prompt must be a string.',
    };
  }

  const trimmedPrompt = prompt.trim();

  if (trimmedPrompt.length < 3) {
    return {
      isValid: false,
      statusCode: 400,
      error: 'Please enter a prompt with at least 3 characters.',
    };
  }

  if (trimmedPrompt.length > 1500) {
    return {
      isValid: false,
      statusCode: 400,
      error: 'Prompt exceeds maximum allowed length of 1,500 characters.',
    };
  }

  const sanitizedTargetAI = typeof targetAI === 'string' && ALLOWED_TARGET_AIS.includes(targetAI.toLowerCase().trim())
    ? targetAI.toLowerCase().trim()
    : 'any';

  let sanitizedTweak = '';
  if (typeof tweak === 'string' && ALLOWED_TWEAKS.includes(tweak.trim())) {
    sanitizedTweak = tweak.trim() === 'more_detail' ? 'moreDetail' : tweak.trim();
  }

  const sanitizedPreviousResult = typeof previousResult === 'string'
    ? previousResult.trim()
    : '';

  return {
    isValid: true,
    sanitizedPrompt: trimmedPrompt,
    targetAI: sanitizedTargetAI,
    tweak: sanitizedTweak,
    previousResult: sanitizedPreviousResult,
  };
}
