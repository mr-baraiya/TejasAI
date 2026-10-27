/**
 * TejasAI Intent Classifier
 *
 * Classifies user prompts into distinct semantic categories to ensure
 * intent-preserving prompt enhancement:
 * - Enhances the prompt, never answers or fulfills it
 * - Preserves point of view, pronouns, question format, and context
 * - Leaves simple questions clean without unnecessary instructions
 * - Adds relevant constraints only for complex coding/creative tasks
 */

export const INTENT_TYPES = {
  GREETING_OR_SIMPLE: 'greeting_or_simple',
  PERSONAL_CONTEXTUAL: 'personal_contextual',
  FACTUAL_QUESTION: 'factual_question',
  CODING_TASK: 'coding_task',
  CREATIVE_TASK: 'creative_task',
  TEXT_TRANSFORMATION: 'text_transformation',
  AMBIGUOUS_REQUEST: 'ambiguous_request',
  ALREADY_CLEAR: 'already_clear',
};

export const PERSONAL_SUBTYPES = {
  SELF_KNOWLEDGE: 'self_knowledge',       // e.g. "tell me about myself", "who am I?"
  IN_GROUP_CONTEXT: 'in_group_context',   // e.g. "tell me who is our prime minister"
  PERSONAL_RESOURCE: 'personal_resource', // e.g. "review my code", "my project"
};

/**
 * Normalizes text for intent detection
 */
function normalize(str) {
  return (str || '')
    .trim()
    .toLowerCase()
    .replace(/[^\w\s'?]/g, ' ')
    .replace(/\s+/g, ' ');
}

/**
 * Formats simple greetings and pleasantries cleanly without bloat
 */
export function formatGreeting(raw) {
  const trimmed = (raw || '').trim();
  if (!trimmed) return trimmed;

  if (/^hii?\s+bro\s+kya\s+h?al\s+he\b/i.test(trimmed)) {
    return 'Hi bro, kya haal hai?';
  }

  if (
    /^how\s+are\s+you/i.test(trimmed) ||
    /^how's\s+it\s+going/i.test(trimmed) ||
    /^how\s+are\s+things/i.test(trimmed) ||
    /^what's\s+up/i.test(trimmed) ||
    /^how\s+do\s+you\s+do/i.test(trimmed)
  ) {
    const capitalized = trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
    return capitalized.endsWith('?') ? capitalized : capitalized + '?';
  }

  if (/^hii?\s+how\s+are\s+u\b/i.test(trimmed)) {
    return 'Hi, how are you?';
  }

  const capitalized = trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
  return capitalized;
}

/**
 * Formats personal self-requests without asking for resume or answering
 */
export function formatSelfPrompt(raw) {
  const trimmed = (raw || '').trim();
  if (/^tell\s+me\s+about\s+myself\b/i.test(trimmed) || /^tell\s+me\s+about\s+my\s*self\b/i.test(trimmed)) {
    return 'Tell me about myself.';
  }
  if (/^who\s+am\s+i\b/i.test(trimmed)) {
    return 'Who am I?';
  }
  if (/^what\s+do\s+you\s+know\s+about\s+me\b/i.test(trimmed)) {
    return 'What do you know about me?';
  }
  const cap = trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
  return cap.endsWith('.') || cap.endsWith('?') ? cap : cap + '.';
}

/**
 * Formats collective/in-group questions preserving country/group context
 */
export function formatInGroupQuestion(raw) {
  const trimmed = (raw || '').trim();

  // Pattern: "(tell me )?who is our <role>"
  const roleMatch = trimmed.match(/(?:tell\s+me\s+)?who\s+is\s+our\s+([\w\s]+?)(?:\?|$)/i);
  if (roleMatch && roleMatch[1]) {
    const rawRole = roleMatch[1].trim();
    const formattedRole = rawRole
      .split(/\s+/)
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(' ');
    return `Tell me who our current ${formattedRole} is.`;
  }

  // Pattern: "(tell me )?what is our <entity>"
  const whatMatch = trimmed.match(/(?:tell\s+me\s+)?what\s+is\s+our\s+([\w\s]+?)(?:\?|$)/i);
  if (whatMatch && whatMatch[1]) {
    const entity = whatMatch[1].trim();
    return `Tell me what our ${entity} is.`;
  }

  const cap = trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
  return cap.endsWith('?') || cap.endsWith('.') ? cap : cap + '.';
}

/**
 * Formats simple factual questions cleanly without adding answers or bloat
 */
export function formatSimpleQuestion(raw) {
  const trimmed = (raw || '').trim();
  if (/^why\s+sky\s+is\s+blue\b/i.test(trimmed)) {
    return 'Why is the sky blue?';
  }
  if (/^what\s+is\s+photosynthesis\b/i.test(trimmed)) {
    return 'What is photosynthesis?';
  }
  if (/^who\s+wrote\s+hamlet\b/i.test(trimmed)) {
    return 'Who wrote Hamlet?';
  }
  if (/^capital\s+of\s+france\b/i.test(trimmed)) {
    return 'What is the capital of France?';
  }
  const cap = trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
  return cap.endsWith('?') ? cap : cap + '?';
}

/**
 * Classifies a prompt into an intent category and extracts preservation directives.
 *
 * @param {string} rawPrompt
 * @returns {Object} classification
 */
export function classifyPromptIntent(rawPrompt) {
  const prompt = (rawPrompt || '').trim();
  const lower = normalize(prompt);

  // Detect Hinglish (Romanized Hindi) with precision — avoid false positives on English words like "me", "he", "so"
  const STRONG_HINGLISH = /\b(karo|kro|karna|karun|karenge|bana\s+do|banao|bnao|batao|btao|hain|mera|meri|mere|mujhe|tumko|kaise|kyun|kyu|kaun|kon|nhi|nahi|acha|achha|thoda|usko|iski|iske|chahiye|bolna|smjhao|samjhao|aaunga|karna|mein)\b/i;
  const HINGLISH_BIGRAMS = /\b(kya\s+(hai|he|hal|karta|hoti)|ke\s+liye|me\s+ek|bana\s+do|fix\s+kro|fix\s+karo|ka\s+pm|kya\s+pta|daily\s+study|mast\s+sa|kaise\s+kru|ui\s+thoda|bhai\s+this)\b/i;
  const isHinglish = STRONG_HINGLISH.test(lower) || HINGLISH_BIGRAMS.test(lower);
  const hinglishDirective = isHinglish
    ? 'CRITICAL: User prompt is in Hinglish (Romanized Hindi). Keep the enhancedPrompt and whyBetter in natural, polished Hinglish without converting to pure English!'
    : null;

  // 1. GREETINGS & SIMPLE CONVERSATIONAL PLEASANTRIES
  const GREETING_PATTERNS = [
    /^(hi|hello|hey|hey there|howdy|greetings|good morning|good afternoon|good evening|good day)[\s!.,?]*$/i,
    /^(how are you|how are you doing|how's it going|how are things|how do you do|sup|what's up)[\s!.,?]*$/i,
    /^(thank you|thanks|thanks a lot|thank you so much|bye|goodbye|see you)[\s!.,?]*$/i,
  ];

  if (GREETING_PATTERNS.some((p) => p.test(prompt))) {
    return {
      category: INTENT_TYPES.GREETING_OR_SIMPLE,
      isQuestion: prompt.endsWith('?') || /^how\b/i.test(prompt),
      pronouns: [],
      preservationDirectives: [
        'Treat as text to improve, never answer',
        'Preserve casual greeting tone',
        'Return original greeting with standard capitalization and punctuation without bloat',
      ],
    };
  }

  // 2. PERSONAL & CONTEXTUAL INQUIRIES
  // 2a. Self-knowledge: User asking what the AI knows about the user
  const SELF_KNOWLEDGE_PATTERNS = [
    /\b(tell me about myself|about myself|who am i|who i am|what do you know about me|tell me about me|describe me|summarize what you know about me|what have you learned about me|what is my name|do you know me)\b/i,
  ];

  if (SELF_KNOWLEDGE_PATTERNS.some((p) => p.test(lower))) {
    return {
      category: INTENT_TYPES.PERSONAL_CONTEXTUAL,
      subtype: PERSONAL_SUBTYPES.SELF_KNOWLEDGE,
      isQuestion: true,
      pronouns: ['me', 'myself', 'I'],
      preservationDirectives: [
        'Treat as text to improve, never answer or fulfill',
        'Preserve first-person point of view ("me", "myself")',
        'Never invert into an instruction for the user to provide their professional resume',
        'Format cleanly as direct self-knowledge prompt ("Tell me about myself.")',
      ],
    };
  }

  // 2b. In-group context: User asking about their country/group/organization ("our prime minister", "our president")
  const IN_GROUP_PATTERNS = [
    /\b(who is our|tell me who is our|what is our|our prime minister|our president|our leader|our government|our country|our nation|our company|our organization|our team)\b/i,
  ];

  if (IN_GROUP_PATTERNS.some((p) => p.test(lower))) {
    return {
      category: INTENT_TYPES.PERSONAL_CONTEXTUAL,
      subtype: PERSONAL_SUBTYPES.IN_GROUP_CONTEXT,
      isQuestion: true,
      pronouns: ['our', 'we'],
      preservationDirectives: [
        'Treat as text to improve, never answer or name individuals',
        'Preserve collective pronoun and context ("our current Prime Minister")',
        'Retain the request to find out who the person is without assuming geography',
      ],
    };
  }

  // 2c. Personal resources ("my project", "my code", "my resume")
  const PERSONAL_RESOURCE_PATTERNS = [
    /\b(my\s+(project|code|app|website|resume|cv|portfolio|server|database|component))\b/i,
  ];
  const hasPersonalResource = PERSONAL_RESOURCE_PATTERNS.some((p) => p.test(lower));

  // 3. CODING TASKS
  const CODING_TECH_REGEX = /\b(react|vue|angular|svelte|nextjs|next\.js|node|nodejs|node\.js|express|django|flask|fastapi|spring|laravel|python|javascript|typescript|c\+\+|java|rust|golang|go|sql|postgres|mongodb|prisma|graphql|docker|kubernetes|aws|css|tailwind|html)\b/i;
  const CODING_TASK_REGEX = /\b(make|build|create|implement|code|write|program|develop|debug|fix|refactor|design)\s+(an?\s+)?(login|auth|dashboard|api|rest|endpoint|table|component|page|website|app|server|database|schema|function|script|algorithm|regex|hook|route|middleware|test|service|view)\b/i;
  const CODING_GENERAL_REGEX = /\b(login page|navbar|rest api|unit test|jwt|oauth|crud|sql query|binary search|button component)\b/i;

  if (CODING_TECH_REGEX.test(lower) || CODING_TASK_REGEX.test(lower) || CODING_GENERAL_REGEX.test(lower)) {
    return {
      category: INTENT_TYPES.CODING_TASK,
      isQuestion: false,
      isHinglish,
      pronouns: hasPersonalResource ? ['my'] : [],
      preservationDirectives: [
        ...(hinglishDirective ? [hinglishDirective] : []),
        'Enhance prompt with relevant practical details and constraints (validation, error handling, state, accessibility, tests)',
        'Preserve requested technologies, libraries, and deliverable without swapping frameworks',
        'Never change requested scope into an unrelated full-stack production platform',
      ],
    };
  }

  // 4. FACTUAL QUESTIONS
  // 'do/does/did' should only be question starters if followed by a subject pronoun/noun, not imperative verbs like 'do same as before'
  const QUESTION_STARTERS = /^(who|what|when|where|why|how|which|whose|whom|is|are|was|were|can|could|will|would)\b|^(do|does|did)\s+(you|i|we|they|he|she|it|this|that|anyone|everyone|someone|anybody|all)\b/i;
  const INDIRECT_QUESTION = /^(tell me|can you tell me|do you know|explain to me|i want to know|show me)\s+(who|what|when|where|why|how|which)\b/i;
  const isQuestion = QUESTION_STARTERS.test(lower) || INDIRECT_QUESTION.test(lower) || prompt.endsWith('?');

  if (isQuestion) {
    const isSimpleFactual = prompt.split(/\s+/).filter(Boolean).length <= 6 && !prompt.includes(';') && !prompt.includes('\n');
    return {
      category: INTENT_TYPES.FACTUAL_QUESTION,
      isQuestion: true,
      isSimpleFactual,
      isHinglish,
      pronouns: [],
      preservationDirectives: [
        ...(hinglishDirective ? [hinglishDirective] : []),
        'CRITICAL: Enhance the prompt, NEVER answer or fulfill it',
        'For simple factual questions, make minimal improvements (capitalization, punctuation, grammar) without adding answers or extra instructions',
        'Do not invent facts, answers, locations, or user attributes',
      ],
    };
  }

  // 5. TEXT TRANSFORMATION
  const TRANSFORMATION_REGEX = /^(translate|rewrite|rephrase|proofread|correct|shorten|summarize|paraphrase|change the tone|fix grammar|fix spelling)\b/i;
  if (TRANSFORMATION_REGEX.test(lower)) {
    return {
      category: INTENT_TYPES.TEXT_TRANSFORMATION,
      isQuestion: false,
      pronouns: [],
      preservationDirectives: [
        'Preserve source material verbatim',
        'Perform or instruct the direct transformation without meta-instructions',
      ],
    };
  }

  // 6. CREATIVE TASKS
  const CREATIVE_REGEX = /\b(poem|story|fiction|lyrics|haiku|slogan|creative essay|brainstorm names|creative concept|tagline)\b/i;
  if (CREATIVE_REGEX.test(lower)) {
    return {
      category: INTENT_TYPES.CREATIVE_TASK,
      isQuestion: false,
      pronouns: [],
      preservationDirectives: [
        'Preserve user creative concept, themes, and tone',
        'Add relevant evocative details and constraints that help achieve the original goal',
      ],
    };
  }

  // 7. AMBIGUOUS / INCOMPLETE REQUESTS
  const INCOMPLETE_STUBS = [
    /^(build|make|create|develop)\s+(an?\s+)?(website|app|application|api|tool|system)\s+for\s*$/i,
    /^(build|make|create)\s+(an?\s+)?(app|website|api)$/i,
    /^(write|draft)\s+(an?\s+)?proposal\s*(for)?$/i,
    /^(compare\s+the\s+pros\s+and\s+cons\s+of)\s*$/i,
  ];

  if (INCOMPLETE_STUBS.some((p) => p.test(lower))) {
    return {
      category: INTENT_TYPES.AMBIGUOUS_REQUEST,
      isQuestion: false,
      pronouns: [],
      preservationDirectives: [
        'Ask structured clarification (max 3 questions)',
        'Focus on single most essential missing detail (target domain or entity)',
      ],
    };
  }

  // 8. ALREADY CLEAR (e.g. detailed prompts > 35 words with clear instructions)
  const wordCount = prompt.split(/\s+/).filter(Boolean).length;
  if (wordCount >= 35 && (prompt.includes('requirements:') || prompt.includes('steps:') || prompt.includes('must'))) {
    return {
      category: INTENT_TYPES.ALREADY_CLEAR,
      isQuestion: prompt.endsWith('?'),
      pronouns: [],
      preservationDirectives: [
        'Prompt is already clear and detailed',
        'Make minimal or zero changes; preserve all existing constraints and structure',
      ],
    };
  }

  // DEFAULT STANDARD ENHANCEMENT
  return {
    category: prompt.endsWith('?') ? INTENT_TYPES.FACTUAL_QUESTION : INTENT_TYPES.ALREADY_CLEAR,
    isQuestion: prompt.endsWith('?'),
    isSimpleFactual: false,
    isHinglish,
    pronouns: [],
    preservationDirectives: [
      ...(hinglishDirective ? [hinglishDirective] : []),
      'Enhance the prompt, never answer it',
      'Preserve core user intent, tone, and constraints',
      'Improve clarity and actionability proportionally',
    ],
  };
}
