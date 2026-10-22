/**
 * Category metadata and presets for TejasAI
 */
export const CATEGORIES = [
  {
    id: 'general',
    label: 'General Task',
    shortDesc: 'Eliminate ambiguity & add actionable structure',
    icon: 'Sparkles',
    color: 'indigo',
    samplePrompts: [
      'Help me plan a 3-day trip to Tokyo on a budget.',
      'Organize my daily routine to improve deep work and productivity.',
      'Give me a strategy to learn a new language in 6 months.',
    ],
  },
  {
    id: 'coding',
    label: 'Coding & Dev',
    shortDesc: 'Clean architecture, error handling, typing & security',
    icon: 'Code2',
    color: 'emerald',
    samplePrompts: [
      'Build a modern portfolio website using React.',
      'Write a Node.js REST API with rate limiting and JWT auth.',
      'Create an optimized SQL query and schema for a real-time analytics dashboard.',
    ],
  },
  {
    id: 'writing',
    label: 'Creative & Copy',
    shortDesc: 'Narrative voice, compelling hooks & stylistic polish',
    icon: 'PenTool',
    color: 'pink',
    samplePrompts: [
      'Write a compelling product launch email for an AI developer tool.',
      'Write a sci-fi short story about an AI discovering forgotten human memories.',
      'Draft a high-converting landing page headline and hero section.',
    ],
  },
  {
    id: 'research',
    label: 'Academic & Research',
    shortDesc: 'Scholarly depth, methodology, citations & counter-views',
    icon: 'BookOpen',
    color: 'amber',
    samplePrompts: [
      'Compare transformer architectures with recurrent neural networks.',
      'Analyze the economic impacts of renewable energy transition in emerging markets.',
      'Synthesize current research on circadian rhythm and cognitive longevity.',
    ],
  },
  {
    id: 'education',
    label: 'Learning & Teaching',
    shortDesc: 'Pedagogical scaffolding, intuitive analogies & checks',
    icon: 'GraduationCap',
    color: 'cyan',
    samplePrompts: [
      'Explain quantum computing and qubit superposition to a high school student.',
      'Teach me how recursion works with visual diagrams and relatable everyday analogies.',
      'Create a complete curriculum for learning system design from scratch.',
    ],
  },
  {
    id: 'business',
    label: 'Business & Pitch',
    shortDesc: 'Executive tone, ROI framing, KPIs & actionable roadmaps',
    icon: 'Briefcase',
    color: 'blue',
    samplePrompts: [
      'Draft a pitch deck executive summary for seed-stage enterprise B2B SaaS.',
      'Create a quarterly go-to-market plan for expanding into European markets.',
      'Write a comprehensive vendor evaluation framework for cloud migration.',
    ],
  },
  {
    id: 'image',
    label: 'Image Generation',
    shortDesc: 'Cinematic lighting, camera parameters, composition & mood',
    icon: 'Image',
    color: 'purple',
    samplePrompts: [
      'A cybernetic peregrine falcon flying through neon rain in Tokyo.',
      'Minimalist Bauhaus architecture interior bathed in warm golden-hour sunlight.',
      'Macro photograph of an iridescent crystal beetle on a bioluminescent moss flower.',
    ],
  },
];

export const TONES = [
  { id: 'balanced', label: 'Balanced', desc: 'Optimal blend of detail, context, and structure' },
  { id: 'detailed', label: 'In-Depth & Comprehensive', desc: 'Exhaustive context, multiple edge cases, and rigorous specifications' },
  { id: 'concise', label: 'Concise & Punchy', desc: 'Direct, focused instructions without excess fluff' },
  { id: 'step-by-step', label: 'Step-by-Step Execution', desc: 'Sequential phased methodology with validation checkpoints' },
  { id: 'authoritative', label: 'Domain Expert', desc: 'Senior specialist persona with uncompromising industry standards' },
  { id: 'creative', label: 'Exploratory & Vivid', desc: 'Rich vocabulary, unconventional perspectives, and evocative framing' },
];
