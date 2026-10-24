import Groq from 'groq-sdk';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { SYSTEM_INSTRUCTION } from './systemInstruction.js';

/**
 * Custom error for refused requests (HTTP 422)
 */
export class RefusalError extends Error {
  constructor(message = "Sorry, we can't help with that request.", code = 'CONTENT_POLICY_VIOLATION', category = 'content_policy') {
    super(message);
    this.name = 'RefusalError';
    this.statusCode = 422;
    this.code = code;
    this.category = category;
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

// ---------------------------------------------------------------------------
// Groq â†’ Gemini fallback state
//
// When Groq returns a 429 (rate limit OR daily token exhaustion) we:
//   1. Record groqCooldownUntil = now + 60 min.
//   2. All subsequent requests route to Gemini until the window expires.
//   3. Once expired, the next request automatically retries Groq.
// ---------------------------------------------------------------------------
const GROQ_COOLDOWN_MS = 60 * 60 * 1000; // 60 minutes
let groqCooldownUntil = 0; // epoch ms; 0 = no cooldown active

function isGroqOnCooldown() {
  return Date.now() < groqCooldownUntil;
}

function setGroqCooldown() {
  groqCooldownUntil = Date.now() + GROQ_COOLDOWN_MS;
  console.warn(`[Fallback] Groq rate/daily limit hit. Switching to Gemini until ${new Date(groqCooldownUntil).toISOString()}.`);
}

function clearGroqCooldown() {
  if (groqCooldownUntil !== 0) {
    groqCooldownUntil = 0;
    console.info('[Fallback] Groq cooldown expired. Resuming Groq as primary engine.');
  }
}

/**
 * Builds chat messages for the AI API call.
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

    userContent = `Please rewrite the following previous prompt based on the tweak instruction.\n\nPrevious prompt:\n"""${cleanedPrev}"""\n\nTweak instruction:\n"""${tweakGuidance}"""\n\nOriginal request goal:\n"""${cleanedPrompt}"""`;
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
      content: 'STRICT REMINDER: Your previous response failed validation. Return ONLY a valid JSON object matching {"enhancedPrompt": "...", "whyBetter": [...]}. Follow all rules strictly: Preserve the exact deliverable type (image requests MUST remain direct image generation requests, NEVER "write a prompt for an image"). Preserve all numeric limits, budgets, negative constraints, and verbatim source content. No bracket labels like [ROLE], no headings, no code fences, no conversational filler or typo lectures. For short or ambiguous input, produce a conservative improvement or at most a single concise clarification question without multi-sentence lectures. Keep output concise and proportional to the input. whyBetter must have exactly 2 or 3 items, each under 140 characters.',
    });
  }

  return messages;
}

/**
 * Validates the raw model output.
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
    const refusalReason =
      (typeof parsed.refusalReason === 'string' && parsed.refusalReason.trim()) ||
      (typeof parsed.reason === 'string' && parsed.reason.trim()) ||
      "Sorry, we can't help with that request.";
    return { isValid: true, isRefused: true, refusalReason };
  }

  const enhancedPrompt = parsed.enhancedPrompt;
  let whyBetter = parsed.whyBetter;

  if (typeof enhancedPrompt !== 'string' || enhancedPrompt.trim().length === 0) {
    return { isValid: false, reason: 'enhancedPrompt is missing or empty' };
  }

  let trimmedPrompt = enhancedPrompt.trim();

  // Intent preservation repair for image generation
  const isDirectImageRequest = /\b(create|generate|make|produce)\s+(an?\s+)?image\b/i.test(originalInput);
  if (isDirectImageRequest) {
    trimmedPrompt = trimmedPrompt.replace(/^(please\s+)?(create|write|provide|give\s+me)\s+(a\s+)?(detailed\s+)?prompt\s+for\s+(an?\s+image\s+of\s+)?/i, 'Create an image of ');
  }

  if (/\[[A-Za-z0-9_\s-]{2,}\]/.test(trimmedPrompt)) {
    return { isValid: false, reason: 'Contains bracket labels' };
  }

  if (/```/.test(trimmedPrompt)) {
    return { isValid: false, reason: 'Enhanced prompt contains code fences' };
  }

  if (/(^|\n)\s*#{1,6}\s+/.test(trimmedPrompt)) {
    return { isValid: false, reason: 'Contains markdown headings' };
  }

  const startsWithFluff = /^(Here('?s| is| are)|Sure|Certainly|Of course|Gladly|Okay|Alright)\b/i.test(trimmedPrompt);
  const inputStartsWithFluff = /^(Here('?s| is| are)|Sure|Certainly|Of course|Gladly|Okay|Alright)\b/i.test(originalInput);
  if (startsWithFluff && !inputStartsWithFluff) {
    return { isValid: false, reason: 'Contains conversational intro' };
  }

  if (/^The input\s+['"].*['"]\s+appears to be a typo/i.test(trimmedPrompt)) {
    return { isValid: false, reason: 'Contains conversational typo lecture' };
  }

  const words = trimmedPrompt.split(/\s+/).filter(Boolean);
  if (words.length > 220) {
    return { isValid: false, reason: `Word count exceeds 220 words (${words.length} words)` };
  }

  if (typeof whyBetter === 'string' && whyBetter.trim().length > 0) {
    const segments = whyBetter.split(/(?:\r?\n|(?<=[.!?])\s+)/).map((s) => s.trim()).filter(Boolean);
    whyBetter = segments.length >= 1 ? segments.slice(0, 3) : [whyBetter.trim()];
  }

  if (!Array.isArray(whyBetter) || whyBetter.length < 1 || whyBetter.length > 3) {
    return { isValid: false, reason: 'whyBetter must contain 1 to 3 items' };
  }

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

// ---------------------------------------------------------------------------
// Groq call
// ---------------------------------------------------------------------------
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

      const isJsonValidateFailed =
        err.status === 400 &&
        (err.message?.includes('json_validate_failed') ||
          err.error?.error?.code === 'json_validate_failed' ||
          err.message?.includes('Failed to validate JSON'));

      if (isJsonValidateFailed) {
        console.warn(`[Groq JSON Mode Fix] Model '${currentModel}' failed constrained JSON decoding. Retrying without response_format...`);
        try {
          const unconstrainedController = new AbortController();
          const unconstrainedTimeoutId = setTimeout(() => unconstrainedController.abort(), timeoutMs);
          const unconstrainedCompletion = await groq.chat.completions.create(
            {
              model: currentModel,
              messages,
              temperature: 0.3,
              max_tokens: 600,
            },
            { signal: unconstrainedController.signal }
          );
          clearTimeout(unconstrainedTimeoutId);
          return unconstrainedCompletion.choices?.[0]?.message?.content || '';
        } catch (unconstrainedErr) {
          lastError = unconstrainedErr;
        }
      }

      if (isRateLimit) {
        const raw = err.error?.error?.message || err.message || '';
        const shortRetry = raw.match(/try again in (\d+(?:\.\d+)?)(ms|s)/i);
        if (shortRetry) {
          const val = parseFloat(shortRetry[1]);
          const unit = shortRetry[2].toLowerCase();
          const waitMs = unit === 's' ? val * 1000 : val;
          if (waitMs <= 2500) {
            console.warn(`[Groq Rate Limit] Short burst wait (${waitMs}ms). Pausing ${waitMs + 150}ms before retrying '${currentModel}'...`);
            await new Promise((r) => setTimeout(r, waitMs + 150));
            try {
              const retryController = new AbortController();
              const retryTimeoutId = setTimeout(() => retryController.abort(), timeoutMs);
              const retryCompletion = await groq.chat.completions.create(
                {
                  model: currentModel,
                  messages,
                  response_format: { type: 'json_object' },
                  temperature: 0.3,
                  max_tokens: 600,
                },
                { signal: retryController.signal }
              );
              clearTimeout(retryTimeoutId);
              return retryCompletion.choices?.[0]?.message?.content || '';
            } catch (retryErr) {
              lastError = retryErr;
            }
          }
        }
      }

      if ((isRateLimit || isNotFound || isServerDown) && nextModel) {
        console.warn(
          `[Groq Resilient Failover] Model '${currentModel}' returned ${err.status} (${
            err.message?.includes('TPD') ? 'Daily token limit' : 'Rate limit / Service busy'
          }). Seamlessly failing over to '${nextModel}'...`
        );
        if (isRateLimit) {
          await new Promise((r) => setTimeout(r, 400));
        }
        continue;
      }
      throw err;
    }
  }

  throw lastError;
}

// ---------------------------------------------------------------------------
// Gemini fallback call
// ---------------------------------------------------------------------------
async function callGeminiChat(messages, timeoutMs) {
  const geminiApiKey = process.env.GEMINI_API_KEY;
  if (!geminiApiKey || geminiApiKey.trim() === '' || geminiApiKey === 'your_gemini_api_key_here') {
    throw new Error('Gemini API key is not configured.');
  }

  const geminiModel = process.env.GEMINI_FALLBACK_MODEL || 'gemini-3.5-flash-lite';
  const genAI = new GoogleGenerativeAI(geminiApiKey.trim());

  const systemMsg = messages.find((m) => m.role === 'system');
  const userMsgs = messages.filter((m) => m.role !== 'system');

  const model = genAI.getGenerativeModel({
    model: geminiModel,
    systemInstruction: systemMsg ? systemMsg.content : undefined,
    generationConfig: {
      responseMimeType: 'application/json',
      temperature: 0.3,
      maxOutputTokens: 600,
    },
  });

  // Build chat history from all but the last user message
  const history = [];
  for (let i = 0; i < userMsgs.length - 1; i++) {
    history.push({
      role: userMsgs[i].role === 'assistant' ? 'model' : 'user',
      parts: [{ text: userMsgs[i].content }],
    });
  }

  const lastUserMsg = userMsgs[userMsgs.length - 1];
  const chat = model.startChat({ history });

  const timeoutPromise = new Promise((_, reject) =>
    setTimeout(() => reject(new Error('Gemini request timed out.')), timeoutMs)
  );

  const result = await Promise.race([
    chat.sendMessage(lastUserMsg.content),
    timeoutPromise,
  ]);

  const text = result.response.text();
  console.info(`[Gemini Fallback] Request served via ${geminiModel}.`);
  return text;
}

// ---------------------------------------------------------------------------
// Unified AI call: Groq primary → Gemini fallback (with auto-recovery)
// ---------------------------------------------------------------------------
async function callAI(messages, timeoutMs, groq, groqModel) {
  // Still in cooldown window — route directly to Gemini
  if (isGroqOnCooldown()) {
    console.info('[Fallback] Groq on cooldown — routing to Gemini.');
    const text = await callGeminiChat(messages, timeoutMs);
    return { text, engine: 'gemini' };
  }

  // Cooldown expired — clear it and retry Groq
  clearGroqCooldown();

  try {
    const text = await callGroqChat(groq, groqModel, messages, timeoutMs);
    return { text, engine: 'groq' };
  } catch (err) {
    const isRateLimit =
      err.status === 429 ||
      err.statusCode === 429 ||
      err.error?.error?.code === 'rate_limit_exceeded' ||
      err.message?.includes('rate_limit_exceeded') ||
      err.message?.includes('TPD') ||
      err.message?.includes('tokens per day');

    if (isRateLimit) {
      // Activate 60-minute cooldown and switch to Gemini
      setGroqCooldown();

      const geminiKey = process.env.GEMINI_API_KEY;
      if (!geminiKey || geminiKey.trim() === '' || geminiKey === 'your_gemini_api_key_here') {
        // No Gemini key — surface a clean error instead of crashing
        const rateError = new Error('Daily request limit reached. Please try again later.');
        rateError.statusCode = 429;
        throw rateError;
      }

      console.warn('[Fallback] Groq rate/daily limit hit → Switching to Gemini fallback...');
      const text = await callGeminiChat(messages, timeoutMs);
      return { text, engine: 'gemini' };
    }

    // All other Groq errors — rethrow unchanged
    throw err;
  }
}

/**
 * Enhances a given prompt. Uses Groq as the primary engine and automatically
 * falls back to Gemini when Groq hits a rate or daily token limit.
 * Automatically shifts back to Groq once the 60-minute cooldown expires.
 *
 * @param {Object} options
 * @param {string} options.prompt - The cleaned user prompt.
 * @param {string} [options.targetAI='any'] - Target AI platform.
 * @param {string} [options.tweak=''] - Optional quick tweak (shorter | simpler | moreDetail).
 * @param {string} [options.previousResult=''] - Previous result for tweaking.
 * @returns {Promise<{ enhancedPrompt: string, whyBetter: string[], engineUsed?: string }>}
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
  const groq = new Groq({ apiKey: apiKey.trim() });

  const cleanedInput = cleanInput(prompt);
  const comparisonInput = tweak && previousResult ? cleanInput(previousResult) : cleanedInput;

  // ── Attempt 1 ─────────────────────────────────────────────────────────────
  let messages = buildMessages({ prompt: cleanedInput, targetAI, tweak, previousResult, isRetry: false });

  let aiRes1;
  try {
    aiRes1 = await callAI(messages, timeoutMs, groq, model);
  } catch (err) {
    console.error('[AI Engine Error]:', err.status, err.message, err.error?.error?.message || '');

    if (err.name === 'AbortError') {
      const e = new Error('Request timed out. Please try again.'); e.statusCode = 504; throw e;
    }
    if (err.status === 401 || err.status === 403) {
      const e = new Error('Authentication with AI engine failed.'); e.statusCode = 401; throw e;
    }
    if (err.statusCode === 429 || err.status === 429) {
      const e = new Error(err.message || 'Too many requests. Please wait a moment and try again.'); e.statusCode = 429; throw e;
    }
    throw new EngineError('Something went wrong. Please try again.');
  }

  const validation1 = validateOutput(aiRes1.text, comparisonInput);
  if (validation1.isRefused) throw new RefusalError(validation1.refusalReason || "Sorry, we can't help with that request.");
  if (validation1.isValid) return { ...validation1.data, engineUsed: aiRes1.engine };

  // ── Attempt 2 — stricter retry ───────────────────────────────────────────
  messages = buildMessages({ prompt: cleanedInput, targetAI, tweak, previousResult, isRetry: true });

  let aiRes2;
  try {
    aiRes2 = await callAI(messages, timeoutMs, groq, model);
  } catch (err) {
    if (err.statusCode === 429 || err.status === 429) {
      const e = new Error(err.message || 'Too many requests. Please wait a moment and try again.'); e.statusCode = 429; throw e;
    }
    throw new EngineError('Something went wrong. Please try again.');
  }

  const validation2 = validateOutput(aiRes2.text, comparisonInput);
  if (validation2.isRefused) throw new RefusalError(validation2.refusalReason || "Sorry, we can't help with that request.");
  if (validation2.isValid) return { ...validation2.data, engineUsed: aiRes2.engine };

  throw new EngineError('Something went wrong. Please try again.');
}


/**
 * Custom error for refused requests (HTTP 422)
 */
