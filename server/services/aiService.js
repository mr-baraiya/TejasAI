import Groq from 'groq-sdk';
import { SYSTEM_INSTRUCTION } from './systemInstruction.js';

/**
 * Custom error for refused requests (HTTP 422)
 */
export class RefusalError extends Error {
  constructor(message = "Sorry, we can't help with that request.") {
    super(message);
    this.name = 'RefusalError';
    this.statusCode = 422;
    this.isRefused = true;
  }
}

/**
 * Custom error for engine failures after retries (HTTP 502)
 */
export class EngineError extends Error {
  constructor(message = "Something went wrong. Please try again.") {
    super(message);
    this.name = 'EngineError';
    this.statusCode = 502;
  }
}

/**
 * Cleans and normalizes user input string.
 */
export function cleanInput(text) {
  if (typeof text !== 'string') return '';
  return text.trim();
}

/**
 * Builds chat messages for the Groq API call.
 */
export function buildMessages({ prompt, targetAI = 'any', tweak = '', previousResult = '', isRetry = false }) {
  const cleanedPrompt = cleanInput(prompt);
  const cleanedPrev = cleanInput(previousResult);

  let userContent = '';

  if (tweak && cleanedPrev) {
    let tweakGuidance = '';
    if (tweak === 'shorter') {
      tweakGuidance = 'Rewrite the previous result to be shorter and more concise while keeping all essential information.';
    } else if (tweak === 'simpler') {
      tweakGuidance = 'Rewrite the previous result using simpler words, shorter sentences, and very easy-to-understand language.';
    } else if (tweak === 'moreDetail') {
      tweakGuidance = 'Rewrite the previous result to include more practical details, helpful steps, and clear structure.';
    }

    userContent = `Please rewrite the following previous prompt based on the tweak instruction.

Previous prompt:
"""${cleanedPrev}"""

Tweak instruction:
"""${tweakGuidance}"""

Original request goal:
"""${cleanedPrompt}"""`;
  } else {
    userContent = `"""${cleanedPrompt}"""`;
  }

  if (targetAI && targetAI !== 'any') {
    userContent += `\nTarget AI: ${targetAI}`;
  }

  const messages = [
    {
      role: 'system',
      content: SYSTEM_INSTRUCTION,
    },
    {
      role: 'user',
      content: userContent,
    },
  ];

  if (isRetry) {
    messages.push({
      role: 'user',
      content: 'STRICT REMINDER: Your previous response failed validation. Return ONLY a valid JSON object matching {"enhancedPrompt": "...", "whyBetter": [...]}. Follow all rules strictly: Preserve the exact deliverable type (image requests MUST remain direct image generation requests, NEVER "write a prompt for an image"). Preserve all numeric limits, budgets, negative constraints, and verbatim source content. No bracket labels like [ROLE], no headings, no code fences. whyBetter must have exactly 2 or 3 items, each under 140 characters.',
    });
  }

  return messages;
}

/**
 * Validates the raw model output.
 *
 * Must reject:
 * - Invalid JSON
 * - Bracket labels like [ROLE]
 * - Markdown headings (#) or code fences (```)
 * - Intros like "Here's", "Sure", etc.
 * - whyBetter not having 2-3 items
 * - Bullets over 150 characters
 * - Word count over 220 words
 */
export function validateOutput(rawText, originalInput) {
  if (!rawText || typeof rawText !== 'string') {
    return { isValid: false, reason: 'Empty or invalid response string' };
  }

  let cleaned = rawText.trim();

  // Strip accidental outer code fences around the JSON object
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\s*\n?/, '').replace(/\n?```\s*$/, '').trim();
  }

  let parsed;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    return { isValid: false, reason: 'Invalid JSON' };
  }

  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    return { isValid: false, reason: 'Response is not a JSON object' };
  }

  // Check refused flag
  if (parsed.refused === true || parsed.refused === 'true') {
    return { isValid: true, isRefused: true };
  }

  const enhancedPrompt = parsed.enhancedPrompt;
  let whyBetter = parsed.whyBetter;

  if (typeof enhancedPrompt !== 'string' || enhancedPrompt.trim().length === 0) {
    return { isValid: false, reason: 'enhancedPrompt is missing or empty' };
  }

  let trimmedPrompt = enhancedPrompt.trim();

  // Intent preservation repair for image generation:
  // "Create an image" must not become "Write a prompt for an image"
  const isDirectImageRequest = /\b(create|generate|make|produce)\s+(an?\s+)?image\b/i.test(originalInput);
  if (isDirectImageRequest) {
    trimmedPrompt = trimmedPrompt.replace(/^(please\s+)?(create|write|provide|give\s+me)\s+(a\s+)?(detailed\s+)?prompt\s+for\s+(an?\s+image\s+of\s+)?/i, 'Create an image of ');
  }

  // Reject bracket labels like [ROLE], [GOAL], [CONTEXT], [FORMAT], [STEP]
  if (/\[[A-Za-z0-9_\s-]{2,}\]/.test(trimmedPrompt)) {
    return { isValid: false, reason: 'Contains bracket labels' };
  }

  // Reject if the enhanced prompt itself contains markdown code fences
  if (/```/.test(trimmedPrompt)) {
    return { isValid: false, reason: 'Enhanced prompt contains code fences' };
  }

  // Reject markdown headings (# Heading)
  if (/(^|\n)\s*#{1,6}\s+/.test(trimmedPrompt)) {
    return { isValid: false, reason: 'Contains markdown headings' };
  }

  // Reject model conversational fluff like "Here's", "Sure", "Certainly" unless original input began with it
  const startsWithFluff = /^(Here('?s| is| are)|Sure|Certainly|Of course|Gladly|Okay|Alright)\b/i.test(trimmedPrompt);
  const inputStartsWithFluff = /^(Here('?s| is| are)|Sure|Certainly|Of course|Gladly|Okay|Alright)\b/i.test(originalInput);
  if (startsWithFluff && !inputStartsWithFluff) {
    return { isValid: false, reason: 'Contains conversational intro' };
  }

  // Reject word count over 220 words
  const words = trimmedPrompt.split(/\s+/).filter(Boolean);
  if (words.length > 220) {
    return { isValid: false, reason: `Word count exceeds 220 words (${words.length} words)` };
  }

  // Normalize string whyBetter into array if model returned a string
  if (typeof whyBetter === 'string' && whyBetter.trim().length > 0) {
    const segments = whyBetter.split(/(?:\r?\n|(?<=[.!?])\s+)/).map((s) => s.trim()).filter(Boolean);
    if (segments.length >= 1) {
      whyBetter = segments.slice(0, 3);
    } else {
      whyBetter = [whyBetter.trim()];
    }
  }

  // Validate whyBetter: must have 1 to 3 items
  if (!Array.isArray(whyBetter) || whyBetter.length < 1 || whyBetter.length > 3) {
    return { isValid: false, reason: 'whyBetter must contain 1 to 3 items' };
  }

  // Validate each bullet: string, <= 150 characters, no bracket labels
  for (const bullet of whyBetter) {
    if (typeof bullet !== 'string' || bullet.trim().length === 0) {
      return { isValid: false, reason: 'Bullet must be a non-empty string' };
    }
    const trimmedBullet = bullet.trim();
    if (trimmedBullet.length > 150) {
      return { isValid: false, reason: `Bullet exceeds 150 characters (${trimmedBullet.length} chars)` };
    }
    if (/\[[A-Za-z0-9_\s-]{2,}\]/.test(trimmedBullet)) {
      return { isValid: false, reason: 'Bullet contains bracket labels' };
    }
  }

  return {
    isValid: true,
    isRefused: false,
    data: {
      enhancedPrompt: trimmedPrompt,
      whyBetter: whyBetter.map((b) => b.trim()),
    },
  };
}

/**
 * Calls Groq API with configured parameters.
 */
async function callGroqChat(groq, primaryModel, messages, timeoutMs) {
  const modelChain = [
    primaryModel,
    'openai/gpt-oss-120b',
    'openai/gpt-oss-20b',
  ].filter((m, i, arr) => arr.indexOf(m) === i && Boolean(m));

  let lastError;

  for (let i = 0; i < modelChain.length; i++) {
    const currentModel = modelChain[i];
    const nextModel = modelChain[i + 1];
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const completion = await groq.chat.completions.create(
        {
          model: currentModel,
          messages,
          response_format: { type: 'json_object' },
          temperature: 0.3,
          max_tokens: 600,
        },
        { signal: controller.signal }
      );
      clearTimeout(timeoutId);
      return completion.choices?.[0]?.message?.content || '';
    } catch (err) {
      clearTimeout(timeoutId);
      lastError = err;

      const isRateLimit = err.status === 429;
      const isNotFound = err.status === 404 || (err.message && err.message.includes('model'));
      const isServerDown = err.status === 503 || err.status === 502;

      if ((isRateLimit || isNotFound || isServerDown) && nextModel) {
        console.warn(
          `[Groq Resilient Failover] Model '${currentModel}' returned ${err.status} (${
            err.message?.includes('TPD') ? 'Daily token limit' : 'Service busy'
          }). Seamlessly failing over to '${nextModel}'...`
        );
        continue;
      }
      throw err;
    }
  }

  throw lastError;
}

/**
 * Enhances a given prompt using the Groq API.
 * Retries once with a stricter reminder if validation fails.
 * Never returns hardcoded or fake enhanced prompts.
 *
 * @param {Object} options
 * @param {string} options.prompt - The cleaned user prompt.
 * @param {string} [options.targetAI='any'] - Target AI platform.
 * @param {string} [options.tweak=''] - Optional quick tweak (shorter | simpler | moreDetail).
 * @param {string} [options.previousResult=''] - Previous result for tweaking.
 * @returns {Promise<{ enhancedPrompt: string, whyBetter: string[] }>}
 */
export async function enhancePrompt({
  prompt,
  targetAI = 'any',
  tweak = '',
  previousResult = '',
}) {
  const apiKey = process.env.GROQ_API_KEY;

  if (!apiKey || apiKey.trim() === '' || apiKey === 'your_groq_api_key_here') {
    const error = new Error('Groq API key is not configured.');
    error.statusCode = 503;
    throw error;
  }

  const model = process.env.GROQ_MODEL || 'qwen/qwen3.8-27b';
  const timeoutMs = parseInt(process.env.AI_TIMEOUT_MS, 10) || 45000;

  const groq = new Groq({
    apiKey: apiKey.trim(),
  });

  const cleanedInput = cleanInput(prompt);
  const comparisonInput = tweak && previousResult ? cleanInput(previousResult) : cleanedInput;

  // Attempt 1
  let messages = buildMessages({
    prompt: cleanedInput,
    targetAI,
    tweak,
    previousResult,
    isRetry: false,
  });

  let rawContent1;
  try {
    rawContent1 = await callGroqChat(groq, model, messages, timeoutMs);
  } catch (err) {
    console.error("[Groq API Error Detail]:", err.status, err.message, err.error?.error?.message || '');
    if (err.name === 'AbortError') {
      const timeoutError = new Error('Request timed out. Please try again.');
      timeoutError.statusCode = 504;
      throw timeoutError;
    }
    if (err.status === 401 || err.status === 403) {
      const authError = new Error('Authentication with Groq API failed.');
      authError.statusCode = 401;
      throw authError;
    }
    if (err.status === 429) {
      let message = 'Too many requests. Please wait a moment and try again.';
      const raw = err.error?.error?.message || err.message || '';
      const retryMatch = raw.match(/try again in ([^.]+)/i);
      if (retryMatch) {
        message = `Groq rate limit reached (Tokens Per Day limit). Please try again in ${retryMatch[1].trim()}.`;
      } else if (raw.includes('TPD') || raw.includes('tokens per day')) {
        message = 'Groq daily token limit reached for this model. Please try again shortly.';
      }
      const rateError = new Error(message);
      rateError.statusCode = 429;
      throw rateError;
    }
    throw new EngineError('Something went wrong. Please try again.');
  }

  const validation1 = validateOutput(rawContent1, comparisonInput);

  if (validation1.isRefused) {
    throw new RefusalError("Sorry, we can't help with that request.");
  }

  if (validation1.isValid) {
    return validation1.data;
  }

  // Attempt 2 (Retry once with stricter reminder)
  messages = buildMessages({
    prompt: cleanedInput,
    targetAI,
    tweak,
    previousResult,
    isRetry: true,
  });

  let rawContent2;
  try {
    rawContent2 = await callGroqChat(groq, model, messages, timeoutMs);
  } catch (err) {
    if (err.status === 429) {
      let message = 'Too many requests. Please wait a moment and try again.';
      const raw = err.error?.error?.message || err.message || '';
      const retryMatch = raw.match(/try again in ([^.]+)/i);
      if (retryMatch) {
        message = `Groq rate limit reached (Tokens Per Day limit). Please try again in ${retryMatch[1].trim()}.`;
      }
      const rateError = new Error(message);
      rateError.statusCode = 429;
      throw rateError;
    }
    throw new EngineError('Something went wrong. Please try again.');
  }

  const validation2 = validateOutput(rawContent2, comparisonInput);

  if (validation2.isRefused) {
    throw new RefusalError("Sorry, we can't help with that request.");
  }

  if (validation2.isValid) {
    return validation2.data;
  }

  // After two failed attempts, return HTTP 502 with exact requested message.
  // Never return a hardcoded or fake enhanced prompt.
  throw new EngineError('Something went wrong. Please try again.');
}
