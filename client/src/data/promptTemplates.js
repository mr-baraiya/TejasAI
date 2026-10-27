/**
 * TejasAI - Dynamic Prompt Builder Templates
 * Categories: Research (Default & First), Coding, Education, Writing, Marketing, Image Generation.
 * All text and textarea fields default to empty strings with clear descriptive placeholders.
 */

export const PROMPT_TEMPLATES = [
  {
    id: 'research',
    name: 'Research',
    icon: 'Search',
    tagline: 'Deep analytical briefs, literature synthesis & tradeoffs',
    description: 'Investigate complex questions, compare methodologies, uncover counter-arguments, and summarize findings.',
    fields: [
      {
        id: 'topic',
        label: 'Research Topic / Domain',
        type: 'text',
        placeholder: 'Specify the research domain, technology, or academic topic to investigate...',
        defaultValue: '',
        required: true,
      },
      {
        id: 'question',
        label: 'Specific Research Question / Hypothesis',
        type: 'textarea',
        placeholder: 'What specific research question, hypothesis, or tradeoff analysis must this brief answer?...',
        defaultValue: '',
        required: true,
      },
      {
        id: 'methodology',
        label: 'Analytical Scope & Depth',
        type: 'select',
        options: [
          'Executive Decision Brief (Synthesis & Tradeoffs)',
          'Comprehensive Literature Review & Empirical Analysis',
          'Comparative Benchmark Matrix with Pros & Cons',
          'Risk Assessment, Red Teaming & Counter-Arguments',
        ],
        defaultValue: 'Comparative Benchmark Matrix with Pros & Cons',
        required: true,
      },
      {
        id: 'constraints',
        label: 'Required Dimensions & Perspective',
        type: 'textarea',
        placeholder: 'List specific dimensions to analyze (e.g. commercial viability, supply chain risks, regulatory hurdles, cost metrics)...',
        defaultValue: '',
        required: false,
      },
    ],
    examples: [
      {
        name: 'Battery Tech Comparative Analysis',
        values: {
          topic: 'State of Solid-State Lithium Batteries vs Sodium-Ion for Grid Storage',
          question: 'Compare commercialization timelines, Levelized Cost of Storage (LCOS), raw material supply risks, and cycle longevity between solid-state and sodium-ion technologies through 2030.',
          methodology: 'Comparative Benchmark Matrix with Pros & Cons',
          constraints: 'Include supply chain dependency on rare earth metals, thermal stability metrics, manufacturing capex hurdles, and major commercial players.',
        },
      },
    ],
    buildPrompt: (v) => {
      const topicStr = v.topic && v.topic.trim() ? v.topic.trim() : '[Enter research domain in the form]';
      const qStr = v.question && v.question.trim() ? v.question.trim() : '[Specify research inquiry in the form]';
      let prompt = `Act as a senior research analyst and subject-matter expert in ${topicStr}.\n\n`;
      prompt += `### Core Research Inquiry:\n${qStr}\n\n`;
      prompt += `### Scope & Methodology:\n${v.methodology || 'Executive Briefing'}\n\n`;
      if (v.constraints && v.constraints.trim()) {
        prompt += `### Key Dimensions to Analyze:\n${v.constraints.trim()}\n\n`;
      }
      prompt += `### Analytical Standards:\n`;
      prompt += `- Provide rigorous, objective analysis supported by verifiable domain mechanisms and key quantitative metrics.\n`;
      prompt += `- Address counter-arguments, technological bottlenecks, and critical uncertainties.\n`;
      prompt += `- Conclude with an executive summary and a structured comparison table.`;
      return prompt;
    },
  },

  {
    id: 'coding',
    name: 'Coding',
    icon: 'Code2',
    tagline: 'Production-ready code, bug fixes & refactoring',
    description: 'Generate high-performance, cleanly architected code with context, tests, and best practices.',
    fields: [
      {
        id: 'taskType',
        label: 'Task Type',
        type: 'select',
        options: [
          'Feature Implementation',
          'Bug Fix & Debugging',
          'Refactoring & Performance Optimization',
          'Code Review & Best Practices',
          'API & Schema Design',
          'Unit & Integration Testing',
        ],
        defaultValue: 'Feature Implementation',
        required: true,
      },
      {
        id: 'language',
        label: 'Language / Framework',
        type: 'text',
        placeholder: 'Specify language, framework, or runtime (e.g. React 19, Python 3.12, Node.js, Go, TypeScript, SQL)...',
        defaultValue: '',
        required: true,
      },
      {
        id: 'task',
        label: 'Task Description / Goal',
        type: 'textarea',
        placeholder: 'Describe your goal in detail: what should the code accomplish, expected inputs, outputs, and key logic...',
        defaultValue: '',
        required: true,
      },
      {
        id: 'context',
        label: 'Existing Code / Environment Context (Optional)',
        type: 'textarea',
        placeholder: 'Paste relevant existing code, schemas, error logs, library constraints, or architecture notes (optional)...',
        defaultValue: '',
        required: false,
      },
      {
        id: 'requirements',
        label: 'Constraints & Quality Standards',
        type: 'text',
        placeholder: 'Specify performance targets, type safety, error handling, or test requirements (e.g. Type-safe, zero external deps)...',
        defaultValue: '',
        required: false,
      },
      {
        id: 'outputFormat',
        label: 'Expected Deliverable Format',
        type: 'select',
        options: [
          'Production code with concise explanatory comments',
          'Code only (minimal explanation)',
          'Step-by-step breakdown with code and unit tests',
          'Architecture review with alternative approaches',
        ],
        defaultValue: 'Production code with concise explanatory comments',
        required: true,
      },
    ],
    examples: [
      {
        name: 'Debounced React Search',
        values: {
          taskType: 'Feature Implementation',
          language: 'React & TypeScript',
          task: 'Build a debounced search input component with cancelable async fetch and keyboard navigation.',
          context: 'Using Tailwind CSS for styling and native AbortController for fetch cancellation.',
          requirements: 'Type-safe with TypeScript, handle loading/error/empty states, accessible ARIA attributes.',
          outputFormat: 'Production code with concise explanatory comments',
        },
      },
      {
        name: 'Python Memory Leak Debug',
        values: {
          taskType: 'Bug Fix & Debugging',
          language: 'Python & FastAPI',
          task: 'Identify why background task queue memory usage grows monotonically over time.',
          context: 'Tasks process large JSON payloads and upload to S3 using a global session pool.',
          requirements: 'Analyze potential closure or connection leaks, profile garbage collection, provide fixed code.',
          outputFormat: 'Step-by-step breakdown with code and unit tests',
        },
      },
    ],
    buildPrompt: (v) => {
      const lang = v.language && v.language.trim() ? v.language.trim() : 'software engineering';
      const taskDesc = v.task && v.task.trim() ? v.task.trim() : '[Describe your coding objective in the form to see your prompt update live]';
      let prompt = `You are a principal software engineer and expert in ${lang}. Please execute the following ${v.taskType || 'coding'} task:\n\n`;
      prompt += `### Objective:\n${taskDesc}\n\n`;
      if (v.context && v.context.trim()) {
        prompt += `### Context & Tech Stack:\n${v.context.trim()}\n\n`;
      }
      if (v.requirements && v.requirements.trim()) {
        prompt += `### Requirements & Constraints:\n- ${v.requirements.trim()}\n- Follow clean architecture, idiomatic patterns, and proper error handling.\n\n`;
      }
      prompt += `### Deliverable:\n${v.outputFormat || 'Production-ready code with concise explanations.'}`;
      return prompt;
    },
  },

  {
    id: 'education',
    name: 'Education',
    icon: 'GraduationCap',
    tagline: 'Master concepts, lesson plans & intuitive explanations',
    description: 'Transform complex academic or technical topics into clear, engaging learning experiences.',
    fields: [
      {
        id: 'topic',
        label: 'Topic / Subject Matter',
        type: 'text',
        placeholder: 'Enter the concept, theory, or topic you want explained (e.g. Transformer Self-Attention, Bayesian Inference, Photosynthesis)...',
        defaultValue: '',
        required: true,
      },
      {
        id: 'audience',
        label: 'Target Learner / Background',
        type: 'select',
        options: [
          'Curious Beginner / Explain Like I am 5 (ELI5)',
          'High School Student',
          'Undergraduate University Student',
          'Working Professional / Transitioning Career',
          'Domain Expert / Advanced Practitioner',
        ],
        defaultValue: 'Undergraduate University Student',
        required: true,
      },
      {
        id: 'goal',
        label: 'Core Learning Goal',
        type: 'textarea',
        placeholder: 'What core intuition, mental model, or practical takeaway should the learner master?...',
        defaultValue: '',
        required: true,
      },
      {
        id: 'format',
        label: 'Teaching Style & Format',
        type: 'select',
        options: [
          'Intuitive analogy followed by structured breakdown',
          'Socratic dialogue with guided questions',
          'Step-by-step hands-on tutorial with visual ASCII diagrams',
          'Comprehensive lesson outline with practice quiz & answers',
        ],
        defaultValue: 'Intuitive analogy followed by structured breakdown',
        required: true,
      },
      {
        id: 'tone',
        label: 'Tone & Atmosphere',
        type: 'select',
        options: [
          'Engaging, warm, and highly encouraging',
          'Rigorous, academic, and mathematically precise',
          'Practical, real-world, and industry-oriented',
          'Brisk, concise, and straight to the point',
        ],
        defaultValue: 'Engaging, warm, and highly encouraging',
        required: false,
      },
    ],
    examples: [
      {
        name: 'Transformers & Self-Attention',
        values: {
          topic: 'How Transformer Models and Self-Attention Work',
          audience: 'Undergraduate University Student',
          goal: 'Understand why attention vectors allow words to dynamically contextualize each other unlike RNNs.',
          format: 'Intuitive analogy followed by structured breakdown',
          tone: 'Engaging, warm, and highly encouraging',
        },
      },
      {
        name: 'Quantum Computing ELI5',
        values: {
          topic: 'Quantum Superposition and Entanglement',
          audience: 'Curious Beginner / Explain Like I am 5 (ELI5)',
          goal: 'Understand how qubits can explore multiple combinations simultaneously using a spinning coin analogy.',
          format: 'Intuitive analogy followed by structured breakdown',
          tone: 'Engaging, warm, and highly encouraging',
        },
      },
    ],
    buildPrompt: (v) => {
      const topicStr = v.topic && v.topic.trim() ? v.topic.trim() : '[Enter your subject topic in the form to see your prompt update live]';
      const goalStr = v.goal && v.goal.trim() ? v.goal.trim() : '[Specify the core learning objective in the form]';
      let prompt = `Act as a world-class educator and subject-matter expert in ${topicStr}.\n\n`;
      prompt += `### Target Learner:\n${v.audience || 'Student'}\n\n`;
      prompt += `### Core Learning Objective:\n${goalStr}\n\n`;
      prompt += `### Teaching Strategy & Format:\n`;
      prompt += `- Method: ${v.format || 'Intuitive explanation'}\n`;
      prompt += `- Tone: ${v.tone || 'Engaging and encouraging'}\n`;
      prompt += `- Ground all theoretical abstractions in tangible, memorable real-world examples.\n`;
      prompt += `- Conclude with a quick comprehension checkpoint (3 interactive questions with answers).`;
      return prompt;
    },
  },

  {
    id: 'writing',
    name: 'Writing',
    icon: 'PenTool',
    tagline: 'High-impact articles, outreach, essays & copy',
    description: 'Craft captivating narratives, persuasive cold emails, thought leadership, and clear technical prose.',
    fields: [
      {
        id: 'contentType',
        label: 'Content Format',
        type: 'select',
        options: [
          'Thought Leadership Article / Blog Post',
          'High-Converting Cold Outreach Email',
          'Executive Memo / Briefing',
          'Newsletter Issue',
          'Persuasive Essay / Editorial',
          'Video / Podcast Script',
        ],
        defaultValue: 'High-Converting Cold Outreach Email',
        required: true,
      },
      {
        id: 'topic',
        label: 'Topic & Core Angle',
        type: 'textarea',
        placeholder: 'Enter the main thesis, angle, or core message of your writing piece...',
        defaultValue: '',
        required: true,
      },
      {
        id: 'targetAudience',
        label: 'Target Reader Persona',
        type: 'text',
        placeholder: 'Describe your target reader persona (e.g. Busy CTOs, engineering managers, SaaS founders, marketing leaders)...',
        defaultValue: '',
        required: true,
      },
      {
        id: 'tone',
        label: 'Voice & Tone',
        type: 'select',
        options: [
          'Sharp, punchy, and conversational',
          'Authoritative, analytical, and professional',
          'Warm, empathetic, and story-driven',
          'Provocative, contrarian, and bold',
        ],
        defaultValue: 'Sharp, punchy, and conversational',
        required: true,
      },
      {
        id: 'keyPoints',
        label: 'Key Points / Structure',
        type: 'textarea',
        placeholder: 'List essential arguments, proof points, narrative beats, or outline steps (one per line)...',
        defaultValue: '',
        required: false,
      },
      {
        id: 'constraints',
        label: 'Length & Style Constraints',
        type: 'text',
        placeholder: 'Specify constraints (e.g. Under 150 words, punchy opening hook, no corporate jargon, single clear CTA)...',
        defaultValue: '',
        required: false,
      },
    ],
    examples: [
      {
        name: 'B2B Cold Outreach',
        values: {
          contentType: 'High-Converting Cold Outreach Email',
          topic: 'Introduce TejasAI prompt enhancer to engineering team leads to cut AI hallucination and rework.',
          targetAudience: 'VP of Engineering / CTO at seed-to-series-B startups',
          tone: 'Sharp, punchy, and conversational',
          keyPoints: '1. Developers waste 20m/day fighting vague AI answers\n2. TejasAI structures prompts automatically\n3. Zero retention, fast browser extension\n4. Low-friction ask: 5-minute loom or chrome extension link',
          constraints: 'Under 130 words, 3rd-grade reading level, zero buzzwords, single clear low-friction call to action.',
        },
      },
      {
        name: 'Tech Thought Leadership',
        values: {
          contentType: 'Thought Leadership Article / Blog Post',
          topic: 'Why prompt engineering will evolve into context engineering and evaluation harnesses in 2026.',
          targetAudience: 'Senior AI practitioners and software architects',
          tone: 'Authoritative, analytical, and professional',
          keyPoints: 'Prompt hacks fade; reliable system architectures, structured schemas, and evals dominate.',
          constraints: '800 words, compelling narrative hook, clear actionable takeaways.',
        },
      },
    ],
    buildPrompt: (v) => {
      const topicStr = v.topic && v.topic.trim() ? v.topic.trim() : '[Enter your topic & angle in the form to see your prompt update live]';
      const audienceStr = v.targetAudience && v.targetAudience.trim() ? v.targetAudience.trim() : 'General audience';
      let prompt = `You are an elite copywriter and content strategist. Write a high-impact ${v.contentType || 'piece'}.\n\n`;
      prompt += `### Core Topic & Angle:\n${topicStr}\n\n`;
      prompt += `### Target Reader:\n${audienceStr}\n\n`;
      prompt += `### Voice & Tone:\n${v.tone || 'Professional and engaging'}\n\n`;
      if (v.keyPoints && v.keyPoints.trim()) {
        prompt += `### Key Points to Cover:\n${v.keyPoints.trim()}\n\n`;
      }
      prompt += `### Editorial Guidelines & Constraints:\n`;
      if (v.constraints && v.constraints.trim()) {
        prompt += `- ${v.constraints.trim()}\n`;
      }
      prompt += `- Hook the reader in the very first sentence.\n`;
      prompt += `- Eliminate fluff, generic clichés, and empty passive voice.\n`;
      prompt += `- Maintain high rhythm and readability.`;
      return prompt;
    },
  },

  {
    id: 'marketing',
    name: 'Marketing',
    icon: 'TrendingUp',
    tagline: 'High-converting campaigns, ad copy & value props',
    description: 'Develop persuasive value propositions, targeted social campaigns, landing page hooks, and launch copy.',
    fields: [
      {
        id: 'product',
        label: 'Product / Service Name & Offering',
        type: 'text',
        placeholder: 'Enter your product or service name and a brief summary of what it does...',
        defaultValue: '',
        required: true,
      },
      {
        id: 'goal',
        label: 'Campaign Objective',
        type: 'select',
        options: [
          'Drive Free Signups / Chrome Extension Installs',
          'Product Hunt / Launch Day Announcement',
          'Cold Lead Acquisition & Demo Bookings',
          'Social Viral Engagement & Thought Leadership',
          'Customer Retention & Feature Adoption',
        ],
        defaultValue: 'Drive Free Signups / Chrome Extension Installs',
        required: true,
      },
      {
        id: 'targetAudience',
        label: 'Target Customer Persona (ICP)',
        type: 'textarea',
        placeholder: 'Describe your ideal customer persona (ICP) and their most frustrating pain point right now...',
        defaultValue: '',
        required: true,
      },
      {
        id: 'valueProp',
        label: 'Core Value Proposition (USP)',
        type: 'textarea',
        placeholder: 'What makes your offering unique and 10x better than existing alternatives (USP)?...',
        defaultValue: '',
        required: true,
      },
      {
        id: 'channel',
        label: 'Distribution Channel',
        type: 'select',
        options: [
          'LinkedIn Post (Story + Key Takeaways)',
          'Landing Page Hero Section & Value Bullets',
          'X / Twitter Thread',
          'Paid Social / Search Ad Copy (Headline + Body)',
          'Email Announcement to Existing Users',
        ],
        defaultValue: 'LinkedIn Post (Story + Key Takeaways)',
        required: true,
      },
      {
        id: 'cta',
        label: 'Call to Action (CTA)',
        type: 'text',
        placeholder: 'Enter your call to action (e.g. Install the free extension, book a demo, start free trial)...',
        defaultValue: '',
        required: true,
      },
    ],
    examples: [
      {
        name: 'LinkedIn Extension Launch',
        values: {
          product: 'TejasAI Browser Extension & Web App',
          goal: 'Drive Free Signups / Chrome Extension Installs',
          targetAudience: 'Software developers, content creators, and founders who use ChatGPT, Gemini, and Claude daily but get frustratingly vague answers.',
          valueProp: 'One-click AI prompt enhancement right inside your AI tool composer. Turns 5-word vague queries into production-grade prompts without leaving the tab.',
          channel: 'LinkedIn Post (Story + Key Takeaways)',
          cta: 'Add TejasAI to Chrome for free — link in comments.',
        },
      },
      {
        name: 'Landing Page Hero Copy',
        values: {
          product: 'AI Customer Feedback Platform',
          goal: 'Drive Free Signups / Chrome Extension Installs',
          targetAudience: 'Product managers at scaling B2B SaaS companies overwhelmed by user feedback.',
          valueProp: 'Synthesize thousands of customer reviews and support tickets into actionable sprint priorities in minutes.',
          channel: 'Landing Page Hero Section & Value Bullets',
          cta: 'Start 14-day free trial — no credit card required.',
        },
      },
    ],
    buildPrompt: (v) => {
      const prodStr = v.product && v.product.trim() ? v.product.trim() : '[Enter your product/offering in the form]';
      const audStr = v.targetAudience && v.targetAudience.trim() ? v.targetAudience.trim() : '[Describe target customer in the form]';
      const uspStr = v.valueProp && v.valueProp.trim() ? v.valueProp.trim() : '[Specify value proposition in the form]';
      const ctaStr = v.cta && v.cta.trim() ? v.cta.trim() : '[Enter call to action in the form]';
      let prompt = `Act as an elite growth marketer and direct-response copywriter. Craft compelling ${v.channel || 'marketing copy'}:\n\n`;
      prompt += `### Product / Service:\n${prodStr}\n\n`;
      prompt += `### Campaign Goal:\n${v.goal || ''}\n\n`;
      prompt += `### Target Customer & Pain Points:\n${audStr}\n\n`;
      prompt += `### Value Proposition (USP):\n${uspStr}\n\n`;
      prompt += `### Call to Action:\n${ctaStr}\n\n`;
      prompt += `### Copywriting Strategy:\n`;
      prompt += `- Emphasize transformation and time saved over generic feature lists.\n`;
      prompt += `- Agitate the primary friction point before revealing the effortless solution.\n`;
      prompt += `- Keep paragraphs short, punchy, and highly scannable.\n`;
      prompt += `- Provide 2 alternative headline variants alongside the full copy.`;
      return prompt;
    },
  },

  {
    id: 'image',
    name: 'Image Generation',
    icon: 'Image',
    tagline: 'Photorealistic, 3D, anime & vector artistic prompts',
    description: 'Construct vivid, richly detailed prompts for Midjourney, DALL-E, Flux, and Stable Diffusion.',
    fields: [
      {
        id: 'subject',
        label: 'Main Subject & Action',
        type: 'textarea',
        placeholder: 'Describe the main subject, characters, foreground/background action, and focal details in vivid detail...',
        defaultValue: '',
        required: true,
      },
      {
        id: 'style',
        label: 'Artistic Medium & Visual Style',
        type: 'select',
        options: [
          'Cinematic 35mm Photography (Hyperrealistic)',
          'Studio Ghibli Inspired Hand-Drawn Anime',
          '3D Isometric Digital Render (Octane / Blender)',
          'Moody Oil Painting with Impasto Texture',
          'Cyberpunk Futuristic Sci-Fi Neon Aesthetic',
          'Minimalist Flat Vector Illustration',
        ],
        defaultValue: 'Cinematic 35mm Photography (Hyperrealistic)',
        required: true,
      },
      {
        id: 'lighting',
        label: 'Lighting & Atmosphere',
        type: 'text',
        placeholder: 'Specify lighting style & mood (e.g. Golden hour rim lighting, volumetric sunbeams, warm ambient glow)...',
        defaultValue: '',
        required: false,
      },
      {
        id: 'composition',
        label: 'Composition & Camera Angle',
        type: 'text',
        placeholder: 'Specify camera lens & angle (e.g. 50mm f/1.8 lens, shallow depth of field, low-angle dynamic shot, rule of thirds)...',
        defaultValue: '',
        required: false,
      },
      {
        id: 'aspectRatio',
        label: 'Aspect Ratio',
        type: 'select',
        options: [
          '16:9 (Cinematic Landscape)',
          '9:16 (Vertical Mobile / Story)',
          '1:1 (Square)',
          '4:3 (Editorial Photography)',
          '21:9 (Ultrawide Banner)',
        ],
        defaultValue: '16:9 (Cinematic Landscape)',
        required: true,
      },
      {
        id: 'negativePrompt',
        label: 'Negative Prompt (What to Avoid)',
        type: 'text',
        placeholder: 'Specify elements to exclude (e.g. blurry, oversaturated, deformed hands, artificial plastic skin, text, watermark)...',
        defaultValue: '',
        required: false,
      },
    ],
    examples: [
      {
        name: 'Sunlit Ceramicist Workshop',
        values: {
          subject: 'A solitary artisan ceramicist shaping a delicate clay teapot on a spinning wheel in an old sunlit studio.',
          style: 'Cinematic 35mm Photography (Hyperrealistic)',
          lighting: 'Golden afternoon sunlight streaming through tall factory windows, illuminated dust motes, soft shadow falloff.',
          composition: 'Medium close-up shot, 50mm f/1.8 lens, shallow depth of field, intimate eye-level angle, focused hands.',
          aspectRatio: '16:9 (Cinematic Landscape)',
          negativePrompt: 'blurry, oversaturated, deformed hands, artificial plastic skin, text, watermark',
        },
      },
      {
        name: 'Cyberpunk Ramen Stall',
        values: {
          subject: 'A futuristic cybernetic chef cooking steaming ramen noodles under neon signs in a rainy Tokyo alley.',
          style: 'Cyberpunk Futuristic Sci-Fi Neon Aesthetic',
          lighting: 'Vibrant magenta and cyan neon glow, wet asphalt reflections, atmospheric steam and rain drizzle.',
          composition: 'Wide angle cinematic shot, low angle, rich background environmental detail.',
          aspectRatio: '16:9 (Cinematic Landscape)',
          negativePrompt: 'blurry, muddy colors, bad hands, low resolution',
        },
      },
    ],
    buildPrompt: (v) => {
      const arCode = (v.aspectRatio || '16:9').split(' ')[0];
      const subjectStr = v.subject && v.subject.trim() ? v.subject.trim() : '[Describe image subject in the form to see your prompt update live]';
      let prompt = `Create an image: ${v.style || 'A photographic image'} of ${subjectStr}.\n\n`;
      if (v.lighting && v.lighting.trim()) {
        prompt += `Lighting & Mood: ${v.lighting.trim()}.\n`;
      }
      if (v.composition && v.composition.trim()) {
        prompt += `Composition & Details: ${v.composition.trim()}, sharp focus on texture, high dynamic range.\n`;
      }
      prompt += `Parameters: --ar ${arCode}`;
      if (v.negativePrompt && v.negativePrompt.trim()) {
        prompt += ` --no ${v.negativePrompt.trim()}`;
      }
      return prompt;
    },
  },
];
