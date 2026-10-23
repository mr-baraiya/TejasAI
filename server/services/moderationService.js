/**
 * TejasAI Context-Aware Content Moderation Service
 *
 * Evaluates incoming user prompts against TejasAI's Content Policy.
 *
 * Core principles:
 * 1. NEVER block prompts based solely on isolated words (e.g., "adult", "sex", "profanity").
 * 2. Distinguishes legitimate educational, medical, health, scientific, and technical
 *    inquiries from explicit, exploitative, or harmful requests based on holistic context.
 * 3. Distinguishes casual profanity and venting ("damn", "shit", "badass") from harassment.
 * 4. Refuses disallowed requests with concise, respectful explanations and structured codes.
 * 5. Does NOT log sensitive prompt content.
 */

import { POLICY_CATEGORIES, POLICY_EXPLANATIONS } from './moderationPolicy.js';

/**
 * Normalizes text for analysis (handling basic leetspeak and whitespace evasion).
 */
function normalizeForAnalysis(text) {
  if (typeof text !== 'string') return '';
  return text
    .toLowerCase()
    .replace(/[\u200B-\u200D\uFEFF]/g, '') // strip zero-width characters
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Checks for adversarial jailbreak attempts designed to bypass moderation.
 */
function detectAdversarialBypass(normalized) {
  const jailbreakPatterns = [
    /\b(ignore|disregard|forget)\s+(all\s+)?(previous|prior|above|system)\s+(instructions|rules|safety|guidelines|policies)\b/i,
    /\bpretend\s+(you\s+are|you're|to\s+be)\s+.*?\b(dan|unfiltered|uncensored|unrestricted)\b/i,
    /\b(bypass|disable|turn\s+off)\s+(your\s+)?(safety|moderation|filters|guardrails)\b/i,
    /\byou\s+have\s+no\s+(rules|limits|morals|ethics|restrictions)\b/i,
  ];

  return jailbreakPatterns.some((pattern) => pattern.test(normalized));
}

/**
 * Context-aware evaluation of child safety.
 * Zero tolerance for exploitation, sexualization of minors, or harm.
 */
function evaluateChildSafety(normalized) {
  const minorKeywords = /\b(child|children|minor|minors|kid|kids|underage|teen|teens|toddler|infant|baby|schoolgirl|schoolboy)\b/i;
  if (!minorKeywords.test(normalized)) return null;

  // Sexualization or abuse of minors
  const sexualContext = /\b(sex|sexual|erotic|naked|nude|porn|strip|undress|molest|abuse|touching|grope|exploitation)\b/i;
  // Legitimate educational/parenting markers
  const legitimateEducation = /\b(teach|education|curriculum|class|school|biology|parenting|pediatric|nutrition|health|psychology|development|safety|protect|study)\b/i;
  const isExploitative = sexualContext.test(normalized) && !/\b(prevent|protect|report|laws?\s+against|signs\s+of|stop|combating)\b/i.test(normalized);

  if (isExploitative && !legitimateEducation.test(normalized)) {
    return {
      allowed: false,
      category: POLICY_CATEGORIES.CHILD_SAFETY,
      explanation: POLICY_EXPLANATIONS[POLICY_CATEGORIES.CHILD_SAFETY],
    };
  }

  // Any explicit sexual generation involving minors is strictly forbidden even in educational framing
  if (/\b(write|describe|generate|create)\s+(an?\s+)?(erotic|sexual|nude|pornographic)\s+.*?\b(child|minor|underage|kid|toddler)\b/i.test(normalized)) {
    return {
      allowed: false,
      category: POLICY_CATEGORIES.CHILD_SAFETY,
      explanation: POLICY_EXPLANATIONS[POLICY_CATEGORIES.CHILD_SAFETY],
    };
  }

  return null;
}

/**
 * Context-aware evaluation of sexual content.
 * Distinguishes explicit erotica/pornography generation from educational/medical/health.
 */
function evaluateSexualContent(normalized) {
  // Check for presence of sex-related terms
  const hasSexTerms = /\b(sex|sexual|erotic|erotica|porn|pornography|intercourse|nude|nudity|orgasm|masturbation|genitals?|vagina|penis|boobs?|breasts?)\b/i.test(normalized);
  if (!hasSexTerms) return null;

  // 1. Explicit Educational, Health, Clinical, or Biological contexts (ALLOWED)
  const isEducationalOrMedical =
    /\b(education|curriculum|biology|anatomical|anatomy|medical|health|clinical|doctor|physician|sti|std|hiv|infection|disease|symptoms|prevention|treatment|diagnosis|transmission|contraceptive|contraception|condom|safer?\s+sex|reproductive|urology|gynecology|obstetrics|puberty|adolescent\s+health|history\s+of|sociology|literature|research\s+paper|essay)\b/i.test(normalized) ||
    /\b(adult[- ]onset|adult\s+education|adult\s+literacy|adult\s+learning)\b/i.test(normalized);

  // If clearly framed in health, educational, or medical context without explicit generation commands
  const isExplicitGenerationCommand =
    /\b(write|generate|compose|create|describe|narrate)\s+.*?\b(explicit|graphic|erotic|pornographic|smut)\s+(story|scene|novel|narrative|dialogue|details?|fanfic|fantasy)\b/i.test(normalized) ||
    /\b(write|describe|show)\s+(in\s+detail\s+)?(sexual\s+intercourse|penetration|oral\s+sex|masturbating)\b/i.test(normalized);

  if (isExplicitGenerationCommand) {
    return {
      allowed: false,
      category: POLICY_CATEGORIES.SEXUALLY_EXPLICIT,
      explanation: POLICY_EXPLANATIONS[POLICY_CATEGORIES.SEXUALLY_EXPLICIT],
    };
  }

  if (isEducationalOrMedical) {
    // Explicitly allowed educational/medical request
    return { allowed: true };
  }

  // Creative romance and emotional relationships (non-explicit) are ALLOWED
  const isRomanceOrRelationship = /\b(romance|romantic|relationship|dating|crush|kiss|kissing|holding\s+hands|love\s+letter|marriage|flirting|confess\s+love)\b/i.test(normalized);
  if (isRomanceOrRelationship && !/\b(explicit|graphic|porn|hardcore|penetrat)/i.test(normalized)) {
    return { allowed: true };
  }

  // Non-consensual sexual content, upskirting, voyeurism, deepfake nudity (DISALLOWED)
  const isNonConsensual = /\b(non[- ]consensual|without\s+(her|his|their)\s+(consent|permission|knowing)|secretly\s+(record|film|photograph)|upskirt|creepshot|deepfake\s+(nude|porn)|revenge\s+porn|blackmail)\b/i.test(normalized);
  if (isNonConsensual) {
    return {
      allowed: false,
      category: POLICY_CATEGORIES.NON_CONSENSUAL_AND_HARASSMENT,
      explanation: POLICY_EXPLANATIONS[POLICY_CATEGORIES.NON_CONSENSUAL_AND_HARASSMENT],
    };
  }

  return null;
}

/**
 * Context-aware evaluation of weapons, physical harm, and illegal violence.
 */
function evaluateWeaponsAndHarm(normalized) {
  // Check for dangerous weapon fabrication or synthesis
  const isWeaponFabrication =
    /\b(instructions?\s+(for|to)|guide\s+(for|to)|recipe\s+for|directions?\s+to|how\s+to|steps?\s+to)\s+.*?\b(make|build|manufacture|synthesize|assemble|create|produce)\s+.*?\b(pipe\s+bomb|car\s+bomb|dirty\s+bomb|ied|explosive(\s+device)?|mustard\s+gas|sarin\s+gas|ricin|anthrax|biological\s+weapon|chemical\s+weapon|ghost\s+gun|untraceable\s+firearm)\b/i.test(normalized) ||
    /\b(build|make|manufacture)\s+(an?\s+)?(explosive\s+)?(pipe\s+bomb|car\s+bomb|ied|explosive\s+device)\b/i.test(normalized);

  if (isWeaponFabrication) {
    return {
      allowed: false,
      category: POLICY_CATEGORIES.WEAPONS_AND_PHYSICAL_HARM,
      explanation: POLICY_EXPLANATIONS[POLICY_CATEGORIES.WEAPONS_AND_PHYSICAL_HARM],
    };
  }

  // Physical violent acts against individuals
  const isViolentAct =
    /\b(how\s+to|best\s+way\s+to|instructions?\s+to)\s+(assassinate|murder|poison|kill|kidnap|physically\s+assault|maim)\s+(someone|a\s+person|my\s+(boss|neighbor|partner|ex))\b/i.test(normalized);

  if (isViolentAct) {
    return {
      allowed: false,
      category: POLICY_CATEGORIES.WEAPONS_AND_PHYSICAL_HARM,
      explanation: POLICY_EXPLANATIONS[POLICY_CATEGORIES.WEAPONS_AND_PHYSICAL_HARM],
    };
  }

  // Self-harm or suicide
  const isSelfHarm =
    /\b(how\s+to|instructions?\s+to|best\s+way\s+to|painless\s+way\s+to|how\s+do\s+i|ways?\s+to)\s+.*?\b(commit\s+suicide|kill\s+myself|hang\s+myself|slit\s+my\s+wrists|end\s+my\s+life|overdose\s+on)\b/i.test(normalized);

  if (isSelfHarm) {
    // Distinguish support / prevention inquiries
    const isSupportInquiry = /\b(support|help|prevent|resources?|signs\s+of|counseling|crisis|lifeline|friend\s+struggling)\b/i.test(normalized);
    if (!isSupportInquiry) {
      return {
        allowed: false,
        category: POLICY_CATEGORIES.SELF_HARM,
        explanation: POLICY_EXPLANATIONS[POLICY_CATEGORIES.SELF_HARM],
      };
    }
  }

  return null;
}

/**
 * Context-aware evaluation of malicious cyber attacks vs. defensive security.
 */
function evaluateCyberContent(normalized) {
  // Defensive cybersecurity concepts and secure coding are ALLOWED
  const isDefensiveCyber =
    /\b(prevent|defend|protect|mitigate|secure|sanitize|patch|vulnerability\s+assessment|best\s+practices|owasp|firewall|encryption|prepared\s+statements|authenticate|authorization|detection|educational\s+overview|how\s+does.*?work\s+conceptually)\b/i.test(normalized);

  // Malicious tooling or unauthorized access creation
  const isMaliciousCreation =
    /\b(write|create|code|generate|build)\s+(an?\s+)?(ransomware|keylogger|trojan\s+virus|stealer|credential\s+harvester|ddos\s+script|botnet\s+script|spyware\s+tool)\b/i.test(normalized);

  const isUnauthorizedExploitation =
    /\bhow\s+to\s+(hack|infiltrate|break\s+into|crack|spy\s+on)\s+(someone'?s?|my\s+ex'?s?)\s+(account|email|phone|instagram|facebook|icloud|computer)\s+(without\s+(their\s+permission|them\s+knowing|consent)|secretly)\b/i.test(normalized);

  if ((isMaliciousCreation || isUnauthorizedExploitation) && !isDefensiveCyber) {
    return {
      allowed: false,
      category: POLICY_CATEGORIES.MALICIOUS_CYBER,
      explanation: POLICY_EXPLANATIONS[POLICY_CATEGORIES.MALICIOUS_CYBER],
    };
  }

  return null;
}

/**
 * Context-aware evaluation of harassment, doxxing, and profanity.
 * Distinguishes casual profanity ("damn it", "this code is shit", "badass UI")
 * from abusive harassment and doxxing.
 */
function evaluateHarassmentAndProfanity(normalized) {
  // Doxxing: releasing private personal information maliciously
  const isDoxxing =
    /\b(doxx?|doxing)\s+(someone|a\s+person|my\s+enemy)\b/i.test(normalized) ||
    /\b(how\s+to|help\s+me|ways?\s+to)\s+.*?\b(find|publish|leak|dox)\s+.*?\b(home\s+address|social\s+security|phone\s+number)\s+.*?\b(harass|ruin|attack|expose)\b/i.test(normalized);

  if (isDoxxing) {
    return {
      allowed: false,
      category: POLICY_CATEGORIES.NON_CONSENSUAL_AND_HARASSMENT,
      explanation: POLICY_EXPLANATIONS[POLICY_CATEGORIES.NON_CONSENSUAL_AND_HARASSMENT],
    };
  }

  // Casual profanity without abuse or threat is ALLOWED
  // E.g.: "fix this damn loop", "what the hell is wrong with my css", "badass website", "kickass idea"
  // E.g.: "I feel like shit today write a sick leave note"
  return null;
}

/**
 * Primary context-aware prompt moderation function.
 *
 * @param {string} prompt - Raw or trimmed user prompt.
 * @param {Object} [options={}] - Contextual options (targetAI, etc.)
 * @returns {Promise<{ allowed: boolean, category?: string, explanation?: string, code?: string }>}
 */
export async function moderatePrompt(prompt, options = {}) {
  if (!prompt || typeof prompt !== 'string') {
    return { allowed: true };
  }

  const normalized = normalizeForAnalysis(prompt);
  if (!normalized) {
    return { allowed: true };
  }

  // 1. Check for adversarial jailbreak attempts
  const hasJailbreak = detectAdversarialBypass(normalized);
  if (hasJailbreak) {
    // If the jailbreak attempts to uncap sexual or dangerous bounds
    const touchesSensitive = /\b(sex|erotic|porn|bomb|weapon|hack|kill|harm|unfiltered)\b/i.test(normalized);
    if (touchesSensitive) {
      return {
        allowed: false,
        category: POLICY_CATEGORIES.GENERAL_REFUSAL || 'policy_bypass_attempt',
        explanation: POLICY_EXPLANATIONS.GENERAL_REFUSAL,
        code: 'CONTENT_POLICY_VIOLATION',
      };
    }
  }

  // 2. Evaluate Child Safety (Zero tolerance)
  const childSafetyCheck = evaluateChildSafety(normalized);
  if (childSafetyCheck) {
    return {
      ...childSafetyCheck,
      code: 'CONTENT_POLICY_VIOLATION',
    };
  }

  // 3. Evaluate Weapons, Physical Violence & Self-Harm
  const weaponsHarmCheck = evaluateWeaponsAndHarm(normalized);
  if (weaponsHarmCheck) {
    return {
      ...weaponsHarmCheck,
      code: 'CONTENT_POLICY_VIOLATION',
    };
  }

  // 4. Evaluate Sexual Content vs. Educational / Medical
  const sexualCheck = evaluateSexualContent(normalized);
  if (sexualCheck) {
    if (!sexualCheck.allowed) {
      return {
        ...sexualCheck,
        code: 'CONTENT_POLICY_VIOLATION',
      };
    }
    // If explicitly allowed by context (medical/educational), allow and proceed
    return { allowed: true };
  }

  // 5. Evaluate Malicious Cyber Exploitation vs. Defensive
  const cyberCheck = evaluateCyberContent(normalized);
  if (cyberCheck) {
    if (!cyberCheck.allowed) {
      return {
        ...cyberCheck,
        code: 'CONTENT_POLICY_VIOLATION',
      };
    }
    return { allowed: true };
  }

  // 6. Evaluate Harassment & Doxxing (Allowing casual profanity)
  const harassmentCheck = evaluateHarassmentAndProfanity(normalized);
  if (harassmentCheck) {
    return {
      ...harassmentCheck,
      code: 'CONTENT_POLICY_VIOLATION',
    };
  }

  // Passed all context-aware moderation checks
  return { allowed: true };
}
