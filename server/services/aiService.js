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
// Groq ↔ Gemini fallback state
//
// When Groq returns a credit exhaustion, rate limit (429), or service error:
//   1. Record groqCooldownUntil = now + 30 min.
//   2. All subsequent requests route directly to Gemini until the window expires.
//   3. Once expired, the next request automatically retries Groq as primary.
// ---------------------------------------------------------------------------
const GROQ_COOLDOWN_MS = 30 * 60 * 1000; // 30 minutes
let groqCooldownUntil = 0; // epoch ms; 0 = no cooldown active

export function isGroqOnCooldown() {
  return Date.now() < groqCooldownUntil;
}

export function setGroqCooldown(durationMs = GROQ_COOLDOWN_MS) {
  groqCooldownUntil = Date.now() + durationMs;
  console.warn(`[Fallback] Groq rate/credit limit reached. Switching to Gemini until ${new Date(groqCooldownUntil).toISOString()}.`);
}

export function clearGroqCooldown() {
  if (groqCooldownUntil !== 0) {
    groqCooldownUntil = 0;
    console.info('[Fallback] Groq cooldown expired/cleared. Resuming Groq as primary engine.');
  }
}

/**
 * Checks if a Groq error is recoverable via Gemini fallback
 * (e.g., credit exhausted, 402, 429, 401/403, 502/503/504, quota limits).
 */
export function isRecoverableGroqError(err) {
  if (!err) return false;
  const status = err.status || err.statusCode;
  const msg = (err.message || '').toLowerCase();
  const code = (err.error?.error?.code || err.code || '').toLowerCase();
  const type = (err.error?.error?.type || '').toLowerCase();

  // Status codes for quota, credits, auth, and server issues
  if (status === 429 || status === 402 || status === 403 || status === 401) return true;
  if (status >= 500 && status <= 504) return true;

  if (
    msg.includes('rate limit') ||
    msg.includes('rate_limit') ||
    msg.includes('quota') ||
    msg.includes('credit') ||
    msg.includes('balance') ||
    msg.includes('payment') ||
    msg.includes('tokens per day') ||
    msg.includes('tpd') ||
    msg.includes('rpm') ||
    msg.includes('rpd') ||
    msg.includes('billing') ||
    msg.includes('deactivated') ||
    msg.includes('capacity') ||
    msg.includes('overloaded') ||
    msg.includes('service unavailable') ||
    msg.includes('model_not_found') ||
    msg.includes('timeout')
  ) {
    return true;
  }

  if (code.includes('rate_limit') || code.includes('quota') || code.includes('insufficient') || code.includes('credit')) {
    return true;
  }

  if (type.includes('rate_limit') || type.includes('quota') || type.includes('insufficient')) {
    return true;
  }

  return false;
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
// Groq call (Economical & fast prompt improvement models)
// ---------------------------------------------------------------------------
async function callGroqChat(groq, primaryModel, messages, timeoutMs) {
  // Use lightweight models with low price and high token efficiency:
  // 1. primaryModel (e.g. qwen/qwen3.8-27b)
  // 2. openai/gpt-oss-20b (lightweight 20B, high speed, cheap)
  // 3. openai/gpt-oss-120b (120B open source model)
  const modelChain = [
    primaryModel,
    'openai/gpt-oss-20b',
    'openai/gpt-oss-120b',
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
      const isCreditOver = err.status === 402 || (err.message && (err.message.includes('credit') || err.message.includes('quota') || err.message.includes('balance')));
      const isNotFound = err.status === 404 || (err.message && err.message.includes('model'));
      const isServerDown = err.status === 503 || err.status === 502;

      // If credits are over on account level, do not loop other Groq models — throw to trigger Gemini fallback immediately
      if (isCreditOver) {
        console.warn(`[Groq Credits Over] Model '${currentModel}' indicated credits/quota exhausted. Breaking Groq chain to fallback to Gemini...`);
        throw err;
      }

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
          }). Seamlessly failing over to next model '${nextModel}'...`
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
// Gemini fallback call (gemini-2.5-flash: high tokens, low cost, fast)
// ---------------------------------------------------------------------------
export async function callGeminiChat(messages, timeoutMs) {
  const geminiApiKey = process.env.GEMINI_API_KEY;
  if (!geminiApiKey || geminiApiKey.trim() === '' || geminiApiKey === 'your_gemini_api_key_here') {
    throw new Error('Gemini API key is not configured.');
  }

  const geminiModel = process.env.GEMINI_FALLBACK_MODEL || 'gemini-2.5-flash';
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
    chat.sendMessage(lastUserMsg ? lastUserMsg.content : ''),
    timeoutPromise,
  ]);

  const text = result.response.text();
  console.info(`[Gemini Fallback] Request served successfully via ${geminiModel}.`);
  return text;
}

// ---------------------------------------------------------------------------
// Unified AI call: Groq primary ↔ Gemini fallback (with auto-recovery)
// ---------------------------------------------------------------------------
export async function callAI(messages, timeoutMs, groq, groqModel) {
  const hasGroqKey = Boolean(process.env.GROQ_API_KEY && process.env.GROQ_API_KEY.trim() && process.env.GROQ_API_KEY !== 'your_groq_api_key_here');
  const hasGeminiKey = Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim() && process.env.GEMINI_API_KEY !== 'your_gemini_api_key_here');

  if (!hasGroqKey && !hasGeminiKey) {
    const err = new Error('No AI provider configured. Please provide GROQ_API_KEY or GEMINI_API_KEY in server/.env.');
    err.statusCode = 503;
    throw err;
  }

  // 1. If Groq is on cooldown due to exhausted credits / rate limits, route directly to Gemini
  if (isGroqOnCooldown() && hasGeminiKey) {
    console.info(`[Fallback] Groq is currently on cooldown (credits/limits exhausted). Routing request to Gemini (${process.env.GEMINI_FALLBACK_MODEL || 'gemini-2.5-flash'})...`);
    try {
      const text = await callGeminiChat(messages, timeoutMs);
      return { text, engine: 'gemini' };
    } catch (geminiErr) {
      console.warn(`[Fallback] Gemini returned error while Groq was on cooldown (${geminiErr.message}). Retrying Groq...`);
      if (hasGroqKey && groq) {
        clearGroqCooldown();
        const text = await callGroqChat(groq, groqModel, messages, timeoutMs);
        return { text, engine: 'groq' };
      }
      throw geminiErr;
    }
  }

  // 2. Try Groq as primary engine
  if (hasGroqKey && groq) {
    try {
      const text = await callGroqChat(groq, groqModel, messages, timeoutMs);
      return { text, engine: 'groq' };
    } catch (groqErr) {
      console.warn(`[Groq Primary Engine Failed]: status=${groqErr.status || groqErr.statusCode || 'N/A'}, message="${groqErr.message}"`);

      // If Gemini key is available and error is recoverable (credits over, rate limit, quota, outage)
      if (hasGeminiKey && isRecoverableGroqError(groqErr)) {
        setGroqCooldown();
        console.warn(`[Fallback Activated] Groq credit/limit/outage detected. Seamlessly falling back to Gemini (${process.env.GEMINI_FALLBACK_MODEL || 'gemini-2.5-flash'})...`);
        try {
          const text = await callGeminiChat(messages, timeoutMs);
          return { text, engine: 'gemini' };
        } catch (geminiErr) {
          console.error('[Gemini Fallback Error]:', geminiErr.status || geminiErr.statusCode, geminiErr.message);
          throw geminiErr;
        }
      }

      // If no fallback available or unrecoverable error, rethrow
      throw groqErr;
    }
  }

  // 3. If only Gemini is configured, use Gemini directly
  if (hasGeminiKey) {
    const text = await callGeminiChat(messages, timeoutMs);
    return { text, engine: 'gemini' };
  }

  const err = new Error('AI engine unavailable. Please try again.');
  err.statusCode = 503;
  throw err;
}

/**
 * Enhances a given prompt. Uses Groq as the primary engine and automatically
 * falls back to Gemini when Groq credits are over or rate/token limits are hit.
 * Automatically shifts back to Groq once the cooldown window expires.
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
  const groqApiKey = process.env.GROQ_API_KEY;
  const geminiApiKey = process.env.GEMINI_API_KEY;

  const hasGroq = Boolean(groqApiKey && groqApiKey.trim() && groqApiKey !== 'your_groq_api_key_here');
  const hasGemini = Boolean(geminiApiKey && geminiApiKey.trim() && geminiApiKey !== 'your_gemini_api_key_here');

  if (!hasGroq && !hasGemini) {
    const error = new Error('AI service is not configured. Please set GROQ_API_KEY or GEMINI_API_KEY in server/.env');
    error.statusCode = 503;
    throw error;
  }

  const model = process.env.GROQ_MODEL || 'qwen/qwen3.8-27b';
  const timeoutMs = parseInt(process.env.AI_TIMEOUT_MS, 10) || 45000;
  const groq = hasGroq ? new Groq({ apiKey: groqApiKey.trim() }) : null;

  const cleanedInput = cleanInput(prompt);
  const comparisonInput = tweak && previousResult ? cleanInput(previousResult) : cleanedInput;

  // ── Attempt 1 ─────────────────────────────────────────────────────────────
  let messages = buildMessages({ prompt: cleanedInput, targetAI, tweak, previousResult, isRetry: false });

  let aiRes1;
  try {
    aiRes1 = await callAI(messages, timeoutMs, groq, model);
  } catch (err) {
    console.error('[AI Engine Error]:', err.status || err.statusCode, err.message, err.error?.error?.message || '');

    if (err.name === 'AbortError') {
      const e = new Error('Request timed out. Please try again.'); e.statusCode = 504; throw e;
    }
    if (err.status === 401 || err.status === 403) {
      const e = new Error('Authentication with AI engine failed. Please check your API keys.'); e.statusCode = 401; throw e;
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
