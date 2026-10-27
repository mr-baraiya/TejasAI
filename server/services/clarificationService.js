import Groq from 'groq-sdk';
import { callAI, cleanInput, RefusalError, EngineError } from './aiService.js';
import { SYSTEM_INSTRUCTION } from './systemInstruction.js';
import {
  classifyPromptIntent,
  INTENT_TYPES,
  PERSONAL_SUBTYPES,
  formatGreeting,
  formatInGroupQuestion,
  formatSelfPrompt,
  formatSimpleQuestion,
} from './intentClassifier.js';

/**
 * System instruction for the initial prompt completeness analysis.
 */
const CLARIFICATION_ANALYZE_INSTRUCTION = `You are TejasAI's Smart Prompt Clarification System.
Your job is to inspect the user's prompt BEFORE enhancement and decide:
1. Does this prompt have SUFFICIENT information to be directly enhanced, or is it already sufficient for its intended purpose?
2. Or is it INCOMPLETE / lacking essential context, requiring structured clarification?

PROMPT SUFFICIENCY AND INTENT PRESERVATION RULE (MANDATORY):
Before enhancing a prompt, determine whether it is already sufficient for its intended purpose.
- Greetings, casual conversations, simple questions, direct commands, and other short but meaningful prompts must retain their original conversational intent.
- Do not unnecessarily convert them into formal instructions or add redundant descriptions.
- If a prompt is already clear and actionable, return it unchanged or make only minimal improvements when genuinely beneficial.
- Ask up to three structured clarification questions only when essential information is missing and materially affects the result.
- Never ask questions merely because a prompt is short.
- Preserve the user's intent, tone, and level of simplicity.

CATEGORIES OF SUFFICIENT PROMPTS (MUST return isSufficient: true, NEVER ask questions):
1. Greetings & Casual Conversation:
   * "hi", "hello", "hey there", "how are you?", "tell me a joke", "good morning"
   -> Retain conversational intent and tone. Return unchanged or make minimal natural adjustments. NEVER convert into multi-sentence formal system prompts or corporate directives.
2. Simple Questions:
   * "What is 2 + 2?", "Capital of France?", "Define photosynthesis", "Who wrote Hamlet?"
   -> Return unchanged or make minimal punctuation/clarity fixes. NEVER over-complicate or ask unnecessary questions.
3. Personal & Contextual Queries:
   * "tell me about myself", "who am I?"
   -> Return isSufficient: true. Enhanced prompt: "Tell me about myself." NEVER ask for a resume or professional background.
   * "tell me who is our prime minister", "who is our president?"
   -> Return isSufficient: true. Enhanced prompt: "Tell me who our current Prime Minister is." Preserve collective context without assuming a location.
4. Coding Tasks & Technical Commands:
   * "make login page in react", "build a calculator in react", "write a python script to parse CSV"
   -> Return isSufficient: true. Preserve the requested framework/language and add practical engineering requirements (validation, error states, responsive design, tests).
5. Direct Commands & Standard Inquiries:
   * "tell my team the launch is delayed to friday" (Intent and core message clear)
   * "explain quantum computing in simple terms" (Audience and concept clear)
   * "create a landing page for my bakery" (Domain and page type clear)
   * "draft an email asking for sick leave" (Context and goal clear)
   * "regex to validate email address" (Specific technical requirement clear)
   * "write a python function to add two numbers" (Explicit requirement clear)

CATEGORIES OF INCOMPLETE PROMPTS (Return isSufficient: false, ask Question 1):
An input is INCOMPLETE ONLY if essential information is missing that materially affects the result (e.g. truncated stubs, missing primary subject or domain):
* "Build a website for" (Missing entity / type of website)
* "make an app" (Missing core purpose / domain)
* "write a proposal" (Missing what the proposal is for)
* "create an api for" (Missing resource / entity)
* "compare the pros and cons of" (Missing subject of comparison)

OUTPUT FORMAT (Return strictly valid JSON only, no markdown, no other text):

If SUFFICIENT:
{
  "isSufficient": true,
  "enhancedPrompt": "<Enhanced prompt preserving original intent, tone, and simplicity without unnecessary formalization>",
  "whyBetter": ["<Concise reason 1 under 140 chars>", "<Concise reason 2 under 140 chars>"]
}

If INCOMPLETE:
{
  "isSufficient": false,
  "question": {
    "id": "q1",
    "text": "<Concise, direct question under 80 characters>",
    "type": "multiple_choice" | "yes_no" | "number",
    "options": ["<Option 1>", "<Option 2>", "<Option 3>"],
    "hasOther": true | false
  }
}

QUESTION DESIGN RULES:
- Only ask for the single most essential missing detail.
- Questions must use structured answers:
  * "multiple_choice": Exactly 3 concise, relevant options. The system will provide "Other" as the 4th option (hasOther: true) where the user can write custom text.
  * "yes_no": Binary confirmation (options: ["Yes", "No"], hasOther: false).
  * "number": When selecting a quantity, such as number of pages or items (options: ["1", "3", "5"], hasOther: true).
- NO open-ended text questions.
`;

/**
 * System instruction for evaluating an in-progress clarification step.
 */
const CLARIFICATION_STEP_INSTRUCTION = `You are TejasAI's Smart Prompt Clarification System.
You are evaluating a prompt enhancement request that has collected clarification answers.
You receive:
- The original user prompt
- The history of questions and structured user answers
- Whether the user requested to skip remaining questions

RULES:
1. PROMPT SUFFICIENCY & INTENT PRESERVATION:
   - Combine the original prompt with the user's answers.
   - Preserve all user requirements, technology choices, constraints, and answers.
   - Preserve the user's intent, tone, and level of simplicity.
   - Do NOT invent assumptions or features not requested. Do not unnecessarily convert simple requests into overly formal or bloated instructions.

2. If the user requested to skip, OR if the accumulated information is now sufficient, OR if 3 questions have already been asked:
   - Finalize the enhanced prompt immediately.
   - Return strictly valid JSON:
   {
     "isSufficient": true,
     "enhancedPrompt": "<High-quality enhanced prompt preserving intent, tone, and simplicity>",
     "whyBetter": ["<Concise reason 1 under 140 chars>", "<Concise reason 2 under 140 chars>"]
   }

3. If essential information is STILL missing and fewer than 3 questions have been asked:
   - Ask the NEXT single structured question (Question 2 or 3).
   - Only ask when essential information is missing that materially affects the result.
   - Do NOT ask for information already provided in the original prompt or previous answers.
   - Must be structured: "multiple_choice" (2-5 options), "yes_no" (["Yes", "No"]), or "number".
   - Return strictly valid JSON:
   {
     "isSufficient": false,
     "question": {
       "id": "q<index>",
       "text": "<Concise question under 80 chars>",
       "type": "multiple_choice" | "yes_no" | "number",
       "options": ["<Option 1>", "<Option 2>"],
       "hasOther": true | false
     }
   }
`;

/**
 * Parses JSON output safely from model response.
 */
function parseJsonSafe(rawText) {
  if (!rawText || typeof rawText !== 'string') return null;
  let cleaned = rawText.trim();
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\s*\n?/, '').replace(/\n?```\s*$/, '').trim();
  }
  try {
    return JSON.parse(cleaned);
  } catch {
    return null;
  }
}

/**
 * Normalizes an answer into a clean string representation.
 */
export function formatAnswer(answer) {
  if (!answer) return '';
  if (typeof answer === 'string') return answer.trim();
  if (typeof answer === 'object') {
    if (answer.option === 'Other' && answer.customText) {
      return `Other (${answer.customText.trim()})`;
    }
    return (answer.option || answer.text || answer.value || JSON.stringify(answer)).trim();
  }
  return String(answer).trim();
}

/**
 * Analyzes prompt completeness before enhancing.
 * Returns either immediate enhancedPrompt (if sufficient) or Question 1 (if incomplete).
 */
export async function analyzePromptCompleteness({ prompt, targetAI = 'any' }) {
  const groqApiKey = process.env.GROQ_API_KEY;
  const geminiApiKey = process.env.GEMINI_API_KEY;

  const hasGroq = Boolean(groqApiKey && groqApiKey.trim() && groqApiKey !== 'your_groq_api_key_here');
  const hasGemini = Boolean(geminiApiKey && geminiApiKey.trim() && geminiApiKey !== 'your_gemini_api_key_here');

  if (!hasGroq && !hasGemini) {
    const error = new Error('AI service is not configured. Please set GROQ_API_KEY or GEMINI_API_KEY.');
    error.statusCode = 503;
    throw error;
  }

  const model = process.env.GROQ_MODEL || 'qwen/qwen3.8-27b';
  const timeoutMs = parseInt(process.env.AI_TIMEOUT_MS, 10) || 45000;
  const groq = hasGroq ? new Groq({ apiKey: groqApiKey.trim() }) : null;

  const cleanedPrompt = cleanInput(prompt);

  // Intent-aware preservation fast-paths (greetings, self-knowledge, in-group)
  const classification = classifyPromptIntent(cleanedPrompt);

  if (classification.category === INTENT_TYPES.GREETING_OR_SIMPLE) {
    return {
      success: true,
      needsClarification: false,
      enhancedPrompt: formatGreeting(cleanedPrompt),
      whyBetter: [
        'Preserved conversational greeting tone and simplicity',
        'Formatted with standard capitalization and punctuation without bloat',
      ],
      engineUsed: 'direct-preservation',
      meta: { targetAI },
    };
  }

  if (classification.category === INTENT_TYPES.PERSONAL_CONTEXTUAL) {
    if (classification.subtype === PERSONAL_SUBTYPES.SELF_KNOWLEDGE) {
      return {
        success: true,
        needsClarification: false,
        enhancedPrompt: formatSelfPrompt(cleanedPrompt),
        whyBetter: [
          'Preserved self-referential inquiry without inventing background requirements',
          'Ensured prompt is improved rather than answered',
        ],
        engineUsed: 'intent-preservation',
        meta: { targetAI },
      };
    }
    if (classification.subtype === PERSONAL_SUBTYPES.IN_GROUP_CONTEXT) {
      return {
        success: true,
        needsClarification: false,
        enhancedPrompt: formatInGroupQuestion(cleanedPrompt),
        whyBetter: [
          'Preserved collective inquiry context ("our current Prime Minister")',
          'Polished grammar and structure without answering the question',
        ],
        engineUsed: 'intent-preservation',
        meta: { targetAI },
      };
    }
  }

  if (classification.category === INTENT_TYPES.FACTUAL_QUESTION && classification.isSimpleFactual) {
    return {
      success: true,
      needsClarification: false,
      enhancedPrompt: formatSimpleQuestion(cleanedPrompt),
      whyBetter: [
        'Preserved factual inquiry format with standard punctuation',
        'Ensured prompt is improved rather than answered',
      ],
      engineUsed: 'intent-preservation',
      meta: { targetAI },
    };
  }

  const messages = [
    { role: 'system', content: CLARIFICATION_ANALYZE_INSTRUCTION },
    {
      role: 'user',
      content: `Target AI: ${targetAI}\n\nPrompt to analyze:\n"""${cleanedPrompt}"""\n\n[DETECTED INTENT: ${classification.category.toUpperCase()}]\nPreservation Directives:\n- ${classification.preservationDirectives.join('\n- ')}`,
    },
  ];

  const aiRes = await callAI(messages, timeoutMs, groq, model);
  const parsed = parseJsonSafe(aiRes.text);

  if (!parsed) {
    throw new EngineError('Failed to parse AI response for prompt analysis.');
  }

  if (parsed.isSufficient === true && parsed.enhancedPrompt) {
    let finalPrompt = parsed.enhancedPrompt.trim();
    let finalWhyBetter = Array.isArray(parsed.whyBetter) && parsed.whyBetter.length > 0
      ? parsed.whyBetter.map((r) => String(r).trim())
      : ['Improved structure and intent clarity', 'Optimized for target AI assistant'];

    // Post-processing sanity checks
    if (classification.category === INTENT_TYPES.PERSONAL_CONTEXTUAL && classification.subtype === PERSONAL_SUBTYPES.SELF_KNOWLEDGE) {
      finalPrompt = formatSelfPrompt(cleanedPrompt);
    } else if (classification.category === INTENT_TYPES.PERSONAL_CONTEXTUAL && classification.subtype === PERSONAL_SUBTYPES.IN_GROUP_CONTEXT) {
      finalPrompt = formatInGroupQuestion(cleanedPrompt);
    } else if (classification.category === INTENT_TYPES.FACTUAL_QUESTION && classification.isSimpleFactual) {
      if (!finalPrompt.endsWith('?') || finalPrompt.length > 80) {
        finalPrompt = formatSimpleQuestion(cleanedPrompt);
      }
    }

    return {
      success: true,
      needsClarification: false,
      enhancedPrompt: finalPrompt,
      whyBetter: finalWhyBetter,
      engineUsed: aiRes.engine,
      meta: { targetAI },
    };
  }

  // Incomplete prompt -> structured question 1
  const q = parsed.question || {};
  const type = ['multiple_choice', 'yes_no', 'number'].includes(q.type) ? q.type : 'multiple_choice';

  let options;
  if (type === 'yes_no') {
    options = ['Yes', 'No'];
  } else {
    const rawOpts = Array.isArray(q.options) && q.options.length >= 2
      ? q.options.map((o) => String(o).trim()).filter((o) => o.toLowerCase() !== 'other').slice(0, 3)
      : ['Option 1', 'Option 2', 'Option 3'];
    options = [...rawOpts, 'Other'];
  }

  return {
    success: true,
    needsClarification: true,
    questionIndex: 1,
    questionCount: 1,
    totalQuestionsMax: 3,
    maxQuestions: 3,
    question: {
      id: 'q1',
      text: q.text ? q.text.trim() : 'Could you specify the primary purpose or type for this request?',
      question: q.text ? q.text.trim() : 'Could you specify the primary purpose or type for this request?',
      type,
      options,
      hasOther: true,
      allowsOther: true,
    },
    nextQuestion: {
      id: 'q1',
      text: q.text ? q.text.trim() : 'Could you specify the primary purpose or type for this request?',
      question: q.text ? q.text.trim() : 'Could you specify the primary purpose or type for this request?',
      type,
      options,
      hasOther: true,
      allowsOther: true,
    },
    clarificationHistory: [],
    engineUsed: aiRes.engine,
    meta: { targetAI },
  };
}

/**
 * Processes a clarification answer step.
 * Continues to the next question or completes enhancement.
 */
export async function processClarificationStep({
  prompt,
  targetAI = 'any',
  clarificationHistory = [],
  answer,
  currentQuestion = null,
  skip = false,
}) {
  const groqApiKey = process.env.GROQ_API_KEY;
  const geminiApiKey = process.env.GEMINI_API_KEY;

  const hasGroq = Boolean(groqApiKey && groqApiKey.trim() && groqApiKey !== 'your_groq_api_key_here');
  const hasGemini = Boolean(geminiApiKey && geminiApiKey.trim() && geminiApiKey !== 'your_gemini_api_key_here');

  if (!hasGroq && !hasGemini) {
    const error = new Error('AI service is not configured.');
    error.statusCode = 503;
    throw error;
  }

  const model = process.env.GROQ_MODEL || 'qwen/qwen3.8-27b';
  const timeoutMs = parseInt(process.env.AI_TIMEOUT_MS, 10) || 45000;
  const groq = hasGroq ? new Groq({ apiKey: groqApiKey.trim() }) : null;

  const cleanedPrompt = cleanInput(prompt);

  // Append latest answer if provided
  const updatedHistory = Array.isArray(clarificationHistory) ? [...clarificationHistory] : [];
  if (currentQuestion && answer) {
    const formatted = formatAnswer(answer);
    if (formatted) {
      updatedHistory.push({
        question: typeof currentQuestion === 'string' ? currentQuestion : currentQuestion.text || 'Question',
        answer: formatted,
      });
    }
  }

  // If user requested skip or already reached 3 questions, force completion
  const forceFinish = Boolean(skip) || updatedHistory.length >= 3;

  const historyText = updatedHistory
    .map((h, i) => `Q${i + 1}: ${h.question}\nA${i + 1}: ${h.answer}`)
    .join('\n\n');

  const userInstruction = forceFinish
    ? `Original Prompt: """${cleanedPrompt}"""\n\nClarification History:\n${historyText || '(User chose to skip questions)'}\n\nSTRICT INSTRUCTION: Finalize enhancement immediately. Synthesize the original prompt and all provided answers. Do not ask any more questions. Set isSufficient to true.`
    : `Target AI: ${targetAI}\nOriginal Prompt: """${cleanedPrompt}"""\n\nClarification History:\n${historyText}\n\nCurrent Question Count: ${updatedHistory.length} of 3.\n\nDecide if this information is now sufficient to produce a great enhanced prompt. If sufficient, set isSufficient: true and provide enhancedPrompt and whyBetter. If not sufficient and under 3 questions, set isSufficient: false and provide question for Q${updatedHistory.length + 1}.`;

  const messages = [
    { role: 'system', content: CLARIFICATION_STEP_INSTRUCTION },
    { role: 'user', content: userInstruction },
  ];

  const aiRes = await callAI(messages, timeoutMs, groq, model);
  const parsed = parseJsonSafe(aiRes.text);

  if (!parsed) {
    throw new EngineError('Failed to parse AI clarification step response.');
  }

  if (forceFinish || parsed.isSufficient === true || !parsed.question) {
    return {
      success: true,
      needsClarification: false,
      enhancedPrompt: parsed.enhancedPrompt ? parsed.enhancedPrompt.trim() : cleanedPrompt,
      whyBetter: Array.isArray(parsed.whyBetter) && parsed.whyBetter.length > 0
        ? parsed.whyBetter.map((r) => String(r).trim())
        : ['Incorporated clarified requirements and constraints', 'Preserved user intent with structured guidance'],
      clarificationHistory: updatedHistory,
      engineUsed: aiRes.engine,
      meta: { targetAI },
    };
  }

  // Next question
  const nextIdx = updatedHistory.length + 1;
  const q = parsed.question || {};
  const type = ['multiple_choice', 'yes_no', 'number'].includes(q.type) ? q.type : 'multiple_choice';

  let options;
  if (type === 'yes_no') {
    options = ['Yes', 'No'];
  } else {
    const rawOpts = Array.isArray(q.options) && q.options.length >= 2
      ? q.options.map((o) => String(o).trim()).filter((o) => o.toLowerCase() !== 'other').slice(0, 3)
      : ['Option 1', 'Option 2', 'Option 3'];
    options = [...rawOpts, 'Other'];
  }

  const qObj = {
    id: `q${nextIdx}`,
    text: q.text ? q.text.trim() : 'Do you have any specific preferences or requirements?',
    question: q.text ? q.text.trim() : 'Do you have any specific preferences or requirements?',
    type,
    options,
    hasOther: true,
    allowsOther: true,
  };

  return {
    success: true,
    needsClarification: true,
    questionIndex: nextIdx,
    questionCount: nextIdx,
    totalQuestionsMax: 3,
    maxQuestions: 3,
    question: qObj,
    nextQuestion: qObj,
    clarificationHistory: updatedHistory,
    engineUsed: aiRes.engine,
    meta: { targetAI },
  };
}
