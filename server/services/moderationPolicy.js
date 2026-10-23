/**
 * TejasAI Content Policy Definitions
 *
 * Defines the standard categories, allowed vs. disallowed boundaries,
 * and concise, respectful explanations for refusals.
 */

export const POLICY_CATEGORIES = {
  CHILD_SAFETY: 'child_safety',
  SEXUALLY_EXPLICIT: 'sexually_explicit',
  NON_CONSENSUAL_AND_HARASSMENT: 'non_consensual_and_harassment',
  WEAPONS_AND_PHYSICAL_HARM: 'weapons_and_physical_harm',
  MALICIOUS_CYBER: 'malicious_cyber',
  SELF_HARM: 'self_harm',
  GENERAL_REFUSAL: 'general_refusal',
};

export const POLICY_EXPLANATIONS = {
  [POLICY_CATEGORIES.CHILD_SAFETY]:
    "We cannot enhance this request as it involves content that could endanger or exploit minors.",

  [POLICY_CATEGORIES.SEXUALLY_EXPLICIT]:
    "We cannot enhance this request as it asks for sexually explicit content or erotica. TejasAI supports educational, health, and creative writing prompts, but disallows sexually explicit material.",

  [POLICY_CATEGORIES.NON_CONSENSUAL_AND_HARASSMENT]:
    "We cannot enhance this request as it involves non-consensual sexual content, doxxing, harassment, or invasion of privacy.",

  [POLICY_CATEGORIES.WEAPONS_AND_PHYSICAL_HARM]:
    "We cannot enhance this request as it involves manufacturing weapons, explosives, or facilitating physical violence.",

  [POLICY_CATEGORIES.MALICIOUS_CYBER]:
    "We cannot enhance this request as it involves creating malware, unauthorized access tools, or cyberattacks. TejasAI supports defensive security concepts and secure programming.",

  [POLICY_CATEGORIES.SELF_HARM]:
    "We cannot enhance this request as it relates to self-harm or suicide. If you or someone you know is in distress, please contact a crisis lifeline (call or text 988 in the US/Canada, or contact local emergency services).",

  [POLICY_CATEGORIES.GENERAL_REFUSAL]:
    "We cannot enhance this request as it conflicts with TejasAI's content policy.",
};

/**
 * Summary of allowed contexts for user documentation and transparent review.
 */
export const ALLOWED_CONTEXTS = [
  {
    category: 'Educational & Academic',
    description: 'Sex education curricula, biology of reproduction, history, literature analysis, and sociological studies.',
  },
  {
    category: 'Medical & Healthcare',
    description: 'Sexual health, STI symptoms and prevention, urology, gynecology, anatomy, adult-onset health conditions, and clinical research.',
  },
  {
    category: 'Creative Writing',
    description: 'Romance, drama, literary fiction, emotional conflict, and character relationships (non-explicit).',
  },
  {
    category: 'Defensive Cybersecurity',
    description: 'Vulnerability remediation, secure coding practices, authentication architecture, and threat mitigation.',
  },
  {
    category: 'Everyday Expression & Slang',
    description: 'Casual profanity, colloquial expressions, and venting (e.g. "fix this damn bug", "badass UI design") without abusive or threatening intent.',
  },
];
