/**
 * TejasAI Browser Extension - Prompt Builder Templates
 * Categories: Coding, Education, Writing, Marketing, Research, Image Generation.
 */

export const EXTENSION_TEMPLATES = [
  {
    id: 'coding',
    name: 'Coding',
    fields: [
      { id: 'taskType', label: 'Task Type', type: 'select', options: ['Feature Implementation', 'Bug Fix & Debugging', 'Refactoring & Optimization', 'Code Review', 'Unit Testing'], defaultValue: 'Feature Implementation' },
      { id: 'language', label: 'Language / Framework', type: 'text', placeholder: 'e.g. React, Python, TypeScript, Go', defaultValue: 'React & TypeScript' },
      { id: 'task', label: 'Task Description', type: 'textarea', placeholder: 'Describe what to build or fix...', defaultValue: 'Build an accessible debounced search input component with async fetch cancellation.' },
      { id: 'requirements', label: 'Constraints & Quality Standards', type: 'text', placeholder: 'e.g. Type-safe, error handling, clean architecture', defaultValue: 'Full TypeScript types, loading & error states, no external dependencies.' },
    ],
    examples: [
      {
        name: 'Debounced React Search',
        values: { taskType: 'Feature Implementation', language: 'React & TypeScript', task: 'Build an accessible debounced search input component with async fetch cancellation.', requirements: 'Full TypeScript types, loading & error states, no external dependencies.' }
      }
    ],
    buildPrompt: (v) => {
      let p = `You are an expert ${v.language || 'software'} engineer. Please execute the following ${v.taskType || 'coding'} task:\n\n`;
      p += `Objective: ${v.task || ''}\n`;
      if (v.requirements) p += `Constraints: ${v.requirements}\n`;
      p += `Deliverable: Production-ready code with clean explanations.`;
      return p;
    }
  },
  {
    id: 'education',
    name: 'Education',
    fields: [
      { id: 'topic', label: 'Topic / Subject', type: 'text', placeholder: 'e.g. Quantum Computing, Photosynthesis', defaultValue: 'How Transformer Models and Self-Attention Work' },
      { id: 'audience', label: 'Target Audience', type: 'select', options: ['Beginner / ELI5', 'High School Student', 'Undergraduate Student', 'Working Professional'], defaultValue: 'Undergraduate Student' },
      { id: 'goal', label: 'Learning Goal', type: 'textarea', placeholder: 'What should the learner understand?', defaultValue: 'Understand why attention vectors allow words to dynamically contextualize each other.' },
      { id: 'format', label: 'Explanation Style', type: 'select', options: ['Intuitive analogy + breakdown', 'Socratic dialogue', 'Step-by-step tutorial', 'Lesson outline + quiz'], defaultValue: 'Intuitive analogy + breakdown' },
    ],
    examples: [
      {
        name: 'Transformers & Attention',
        values: { topic: 'How Transformer Models and Self-Attention Work', audience: 'Undergraduate Student', goal: 'Understand why attention vectors allow words to dynamically contextualize each other.', format: 'Intuitive analogy + breakdown' }
      }
    ],
    buildPrompt: (v) => {
      let p = `Act as an expert educator in ${v.topic || 'the subject'}.\n\n`;
      p += `Target Learner: ${v.audience || 'Student'}\n`;
      p += `Objective: ${v.goal || ''}\n`;
      p += `Format: ${v.format || 'Intuitive explanation'}\n`;
      p += `Ground theoretical concepts in memorable real-world analogies, and end with a quick comprehension checkpoint.`;
      return p;
    }
  },
  {
    id: 'writing',
    name: 'Writing',
    fields: [
      { id: 'contentType', label: 'Format', type: 'select', options: ['Cold Outreach Email', 'Blog Post / Article', 'Executive Briefing', 'Newsletter', 'Story / Narrative'], defaultValue: 'Cold Outreach Email' },
      { id: 'topic', label: 'Topic & Core Angle', type: 'textarea', placeholder: 'What is this piece about?', defaultValue: 'Introduce TejasAI prompt enhancer to engineering leads to eliminate vague AI replies.' },
      { id: 'targetAudience', label: 'Target Reader', type: 'text', placeholder: 'e.g. Busy CTOs, SaaS founders', defaultValue: 'VP of Engineering / CTO at tech startups' },
      { id: 'tone', label: 'Tone', type: 'select', options: ['Punchy & conversational', 'Authoritative & professional', 'Warm & empathetic', 'Bold & contrarian'], defaultValue: 'Punchy & conversational' },
      { id: 'constraints', label: 'Constraints', type: 'text', placeholder: 'e.g. Under 120 words, single CTA', defaultValue: 'Under 130 words, 0 buzzwords, single clear low-friction call to action.' },
    ],
    examples: [
      {
        name: 'B2B Cold Outreach',
        values: { contentType: 'Cold Outreach Email', topic: 'Introduce TejasAI prompt enhancer to engineering leads to eliminate vague AI replies.', targetAudience: 'VP of Engineering / CTO at tech startups', tone: 'Punchy & conversational', constraints: 'Under 130 words, 0 buzzwords, single clear low-friction call to action.' }
      }
    ],
    buildPrompt: (v) => {
      let p = `You are an elite copywriter. Write a high-impact ${v.contentType || 'piece'}.\n\n`;
      p += `Topic: ${v.topic || ''}\n`;
      p += `Target Reader: ${v.targetAudience || 'General audience'}\n`;
      p += `Tone: ${v.tone || 'Conversational'}\n`;
      if (v.constraints) p += `Constraints: ${v.constraints}\n`;
      p += `Hook the reader in sentence one and eliminate all filler.`;
      return p;
    }
  },
  {
    id: 'marketing',
    name: 'Marketing',
    fields: [
      { id: 'product', label: 'Product / Offering', type: 'text', placeholder: 'e.g. TejasAI Browser Extension', defaultValue: 'TejasAI Browser Extension' },
      { id: 'goal', label: 'Campaign Goal', type: 'select', options: ['Drive Free Signups / Installs', 'Product Launch Announcement', 'Lead Generation / Book Demo', 'Social Engagement'], defaultValue: 'Drive Free Signups / Installs' },
      { id: 'targetAudience', label: 'Target Persona & Pain Point', type: 'textarea', placeholder: 'Who is the ideal customer and what hurts?', defaultValue: 'Developers and creators who use AI daily but get frustratingly vague answers.' },
      { id: 'valueProp', label: 'Unique Value Proposition', type: 'textarea', placeholder: 'Why choose your product?', defaultValue: 'One-click prompt enhancement right inside your AI tool composer. Production-grade output in 1 click.' },
      { id: 'channel', label: 'Channel', type: 'select', options: ['LinkedIn Post', 'Landing Page Hero & Bullets', 'X / Twitter Thread', 'Ad Copy (Headline + Body)'], defaultValue: 'LinkedIn Post' },
    ],
    examples: [
      {
        name: 'LinkedIn Extension Post',
        values: { product: 'TejasAI Browser Extension', goal: 'Drive Free Signups / Installs', targetAudience: 'Developers and creators who use AI daily but get frustratingly vague answers.', valueProp: 'One-click prompt enhancement right inside your AI tool composer.', channel: 'LinkedIn Post' }
      }
    ],
    buildPrompt: (v) => {
      let p = `Act as an expert growth marketer. Craft high-converting ${v.channel || 'marketing copy'} for:\n\n`;
      p += `Product: ${v.product || ''}\n`;
      p += `Goal: ${v.goal || ''}\n`;
      p += `Target Customer: ${v.targetAudience || ''}\n`;
      p += `Value Proposition: ${v.valueProp || ''}\n`;
      p += `Focus on transformation and time saved. Provide 2 headline variations alongside the main copy.`;
      return p;
    }
  },
  {
    id: 'research',
    name: 'Research',
    fields: [
      { id: 'topic', label: 'Research Topic / Domain', type: 'text', placeholder: 'e.g. Solid-State Batteries vs Sodium-Ion', defaultValue: 'Solid-State Lithium Batteries vs Sodium-Ion for Grid Storage' },
      { id: 'question', label: 'Core Inquiry / Hypothesis', type: 'textarea', placeholder: 'Specific question to investigate...', defaultValue: 'Compare Levelized Cost of Storage (LCOS), material supply risks, and commercial timelines through 2030.' },
      { id: 'methodology', label: 'Scope & Depth', type: 'select', options: ['Comparative Benchmark Matrix', 'Executive Synthesis Brief', 'Risk Assessment & Tradeoffs', 'Literature Review'], defaultValue: 'Comparative Benchmark Matrix' },
    ],
    examples: [
      {
        name: 'Battery Tech Benchmark',
        values: { topic: 'Solid-State Lithium Batteries vs Sodium-Ion for Grid Storage', question: 'Compare Levelized Cost of Storage (LCOS), material supply risks, and commercial timelines through 2030.', methodology: 'Comparative Benchmark Matrix' }
      }
    ],
    buildPrompt: (v) => {
      let p = `Act as a senior research analyst in ${v.topic || 'the domain'}.\n\n`;
      p += `Inquiry: ${v.question || ''}\n`;
      p += `Scope: ${v.methodology || 'Executive Briefing'}\n`;
      p += `Deliver rigorous, objective analysis with verifiable mechanisms, key quantitative metrics, and a comparison table.`;
      return p;
    }
  },
  {
    id: 'image',
    name: 'Image Generation',
    fields: [
      { id: 'subject', label: 'Subject & Scene', type: 'textarea', placeholder: 'Describe the main subject and action...', defaultValue: 'A solitary artisan ceramicist shaping a delicate clay teapot on a spinning wheel in an old sunlit studio.' },
      { id: 'style', label: 'Visual Style', type: 'select', options: ['Cinematic 35mm Photography (Hyperrealistic)', 'Studio Ghibli Anime Style', '3D Isometric Digital Render', 'Cyberpunk Neon Aesthetic', 'Minimalist Flat Vector'], defaultValue: 'Cinematic 35mm Photography (Hyperrealistic)' },
      { id: 'lighting', label: 'Lighting & Mood', type: 'text', placeholder: 'e.g. Golden hour sunbeams, atmospheric dust', defaultValue: 'Golden afternoon sunlight streaming through tall factory windows, illuminated dust motes.' },
      { id: 'aspectRatio', label: 'Aspect Ratio', type: 'select', options: ['16:9 (Landscape)', '9:16 (Story/Mobile)', '1:1 (Square)', '4:3 (Photo)'], defaultValue: '16:9 (Landscape)' },
      { id: 'negativePrompt', label: 'Negative Prompt (Avoid)', type: 'text', placeholder: 'e.g. blurry, deformed hands, text', defaultValue: 'blurry, oversaturated, deformed hands, text, watermark' },
    ],
    examples: [
      {
        name: 'Sunlit Ceramicist',
        values: { subject: 'A solitary artisan ceramicist shaping a delicate clay teapot on a spinning wheel in an old sunlit studio.', style: 'Cinematic 35mm Photography (Hyperrealistic)', lighting: 'Golden afternoon sunlight streaming through tall factory windows, illuminated dust motes.', aspectRatio: '16:9 (Landscape)', negativePrompt: 'blurry, oversaturated, deformed hands, text, watermark' }
      }
    ],
    buildPrompt: (v) => {
      const arCode = (v.aspectRatio || '16:9').split(' ')[0];
      let p = `Create an image: ${v.style || 'Photorealistic image'} of ${v.subject || ''}.\n`;
      if (v.lighting) p += `Lighting & Mood: ${v.lighting}.\n`;
      p += `Parameters: --ar ${arCode}`;
      if (v.negativePrompt) p += ` --no ${v.negativePrompt}`;
      return p;
    }
  }
];
