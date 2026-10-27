# TejasAI

### Open-Source AI Prompt Optimization Engine and Universal Browser Extension

Live Web Application: https://tejasai-eta.vercel.app/  
Chrome Extension Package: https://tejasai-eta.vercel.app/tejasai-extension.zip  
GitHub Repository: https://github.com/mr-baraiya/TejasAI  
Sponsor this Project: https://github.com/sponsors/mr-baraiya  

---

## Executive Summary

TejasAI is an open-source productivity platform that transforms rough, informal thoughts into high-precision, production-grade prompts in under 300 milliseconds. 

Most people receive generic or incomplete answers from artificial intelligence models not because the models are weak, but because informal human drafts lack role boundaries, concrete specifications, negative constraints, and output formatting. TejasAI bridges that gap automatically.

The project consists of two tightly integrated components:

1. Web Application: A responsive, editorial-grade workspace featuring real-time AI prompt enhancement, an interactive multi-framework Prompt Builder, side-by-side prompt diffing, prompt explanation metrics, and local favorites management.
2. Universal Browser Extension: A Chrome Manifest V3 extension that embeds a native "Enhance" button directly inside the composer boxes of ChatGPT, Claude, Google Gemini, Perplexity, DeepSeek, and Grok.

---

## Why Sponsor TejasAI?

TejasAI is developed and maintained as a public utility for the global developer, researcher, and creator community.

By sponsoring TejasAI through GitHub Sponsors, you directly fund:

- Free, Unrestricted Access: Keeping the hosted web application and browser extension 100% free for students, indie developers, and researchers without paywalls, subscriptions, or intrusive advertisements.
- High-Speed Cloud Inference: Covering the high-throughput Groq LPU inference capacity and multi-region server infrastructure required to deliver sub-300ms turnaround times.
- Cross-Browser Store Distribution: Supporting official publishing fees and automated builds for the Chrome Web Store, Firefox Add-ons, and Microsoft Edge Add-ons catalogs.
- Continuous Adapter Maintenance: Keeping site adapters robust against frequent layout changes on ChatGPT, Claude, Gemini, DeepSeek, Perplexity, and Grok.
- Feature Roadmap Acceleration: Delivering planned capabilities such as prompt versioning, offline heuristic fallbacks, team sharing libraries, and keyboard command palettes.

Support the project on GitHub: https://github.com/sponsors/mr-baraiya

---

## The Core Problem and Solution

When users type informal queries into modern language models, they typically face repetitive iteration cycles:

```text
[ Typical User Query ]
"Make this api call retry if it fails"

        |
        v  (Traditional Result: generic 10-line loop without timeout or status checking)
        |
        v  (TejasAI Automated Transformation: sub-300ms)

[ TejasAI Enhanced Prompt ]
"Write a production-grade TypeScript wrapper for this fetch call implementing
exponential backoff. Retry up to 3 times strictly on HTTP 429 and 5xx errors,
enforce an explicit 10-second timeout via AbortSignal, and fail fast without
retrying on 4xx client errors. Return typed responses and structured errors."
```

Every enhanced prompt is accompanied by transparent "Why this works better" bullet points, educating the user on effective prompt architecture with every generation.

---

## Key Features

### 1. Instant Sub-300ms Enhancement
Powered by open-weights models running on Groq LPUs with automated failover to Google Gemini, the platform delivers near-instantaneous rewrites without latency lag.

### 2. Multi-Framework Dynamic Prompt Builder
An interactive visual studio supporting six dedicated domain frameworks:
- Coding and Engineering: Architecture patterns, type safety, error boundaries, test requirements.
- Education and Study: Pedagogical progression, level adjustment, analogies, comprehension checks.
- Professional Writing: Audience adaptation, tone calibration, voice boundaries, length constraints.
- Product and Marketing: Persona definitions, value propositions, call-to-actions, conversion goals.
- Research and Analysis: Synthesis guidelines, methodology rigor, citation structures.
- Image Generation: Subject framing, camera/lens parameters, lighting schematics, composition.

### 3. Universal Browser Extension (Manifest V3)
Zero-configuration in-composer assistance injected directly into the active tabs of:
- ChatGPT (chatgpt.com)
- Claude (claude.ai)
- Google Gemini (gemini.google.com)
- Perplexity (perplexity.ai)
- DeepSeek (chat.deepseek.com)
- Grok (grok.com and x.com)

### 4. Zero Prompt Retention and Privacy Guarantee
User prompts are processed in-flight over encrypted HTTPS connections solely to compute the enhanced variant. Prompts are never stored, never sold, and never used to train machine learning models.

### 5. Local Favorites and Offline Library
A slide-over drawer on the web and a dedicated tab in the extension allow users to organize, search, edit, and export their favorite prompts directly to portable JSON backups.

---

## System Architecture

```text
+-------------------------------------------------------------------------+
|                              Client Layer                               |
|                                                                         |
|   +--------------------------+       +------------------------------+   |
|   |   Vite + React 19 App    |       |  Manifest V3 Chrome Ext      |   |
|   |  - Dynamic Prompt Studio |       |  - 6 AI Site Adapters        |   |
|   |  - Side-by-Side Diffing  |       |  - In-Composer DOM Injection |   |
|   |  - Local Favorites Sync  |       |  - Pop-up Builder & Storage  |   |
|   +--------------------------+       +------------------------------+   |
+-------------------------------------------------------------------------+
                                    |
                                    | HTTPS / JSON
                                    v
+-------------------------------------------------------------------------+
|                       Backend API Gateway (Express)                     |
|                                                                         |
|   - Rate Limiting (express-rate-limit)                                  |
|   - Strict Input Sanitization & Boundary Validation                     |
|   - Content Policy & Refusal Enforcement                                |
|   - Failover State Manager (Groq -> Gemini Cooldown Circuit)            |
+-------------------------------------------------------------------------+
                     |                                 |
       (Primary)     |                   (Fallback)    |
                     v                                 v
+---------------------------+             +---------------------------+
|    Groq LPU Cloud         |             |    Google Gemini Flash    |
|   (qwen/qwen3.8-27b)      |             |     (gemini-2.5-flash)    |
|  Low-latency inference    |             |  Automatic credit/rate-limit|
|   under 300 milliseconds  |             |  overflow protection      |
+---------------------------+             +---------------------------+
```

---

## Technology Stack

### Frontend
- Core Framework: React 19
- Build Tool: Vite 8
- Styling: Tailwind CSS v4
- Icon System: Phosphor Icons (`@phosphor-icons/react`)
- Quality Tooling: Oxlint

### Backend Service
- Runtime: Node.js (v18.0.0+ / v20+ recommended)
- Server Framework: Express 4
- AI Integration: Official `groq-sdk` and `@google/generative-ai`
- Database (Optional): PostgreSQL / Neon serverless driver
- Rate Limiting: `express-rate-limit`

### Browser Extension
- Architecture: Manifest V3 (Service Worker + Content Scripts)
- Design: Vanilla JavaScript and CSS with Phosphor SVGs (zero external CDN dependencies for strict security compliance)
- Compatibility: Google Chrome, Brave, Microsoft Edge, Opera, Arc

---

## Project Structure

```text
TejasAI/
├── client/                          # React Frontend Application
│   ├── public/                      # Static assets and extension zip package
│   │   ├── favicon/
│   │   ├── logo.png
│   │   └── tejasai-extension.zip    # Pre-packaged browser extension for direct download
│   ├── src/
│   │   ├── components/              # Modular UI components
│   │   │   ├── CategorySelector.jsx # Example chips and target AI selector
│   │   │   ├── ErrorAlert.jsx       # Error and policy rejection notifications
│   │   │   ├── ExamplesGallery.jsx  # Before/after editorial showcase
│   │   │   ├── ExtensionModal.jsx   # Download and 3-step setup modal
│   │   │   ├── FaqSection.jsx       # Accordion FAQ
│   │   │   ├── FavoritesDrawer.jsx  # Slide-over saved prompts manager
│   │   │   ├── Header.jsx           # Responsive editorial header
│   │   │   ├── OutputDisplay.jsx    # Dual comparison and platform launch bar
│   │   │   ├── PromptBuilder.jsx    # Dynamic template-driven studio
│   │   │   ├── PromptInput.jsx      # Speech dictation and input canvas
│   │   │   └── RecentPrompts.jsx    # Local session draft restore
│   │   ├── data/                    # Multi-category prompt templates
│   │   ├── services/                # API client and favorites persistence
│   │   ├── App.jsx                  # Application root coordinator
│   │   └── index.css                # Global stylesheet and Tailwind tokens
│   ├── package.json
│   └── vite.config.js               # Vite configuration and proxy setup
│
├── server/                          # Backend Gateway Service
│   ├── routes/                      # Route handlers (/api/enhance, /api/health)
│   ├── services/                    # Inference logic, failover, and system instructions
│   │   ├── aiService.js             # Dual Groq/Gemini resilient caller
│   │   ├── db.js                    # Optional PostgreSQL logging
│   │   └── systemInstruction.js     # Specialized prompt optimization rules
│   ├── tests/                       # Automated test suites
│   ├── .env.example                 # Environment configuration template
│   ├── package.json
│   └── server.js                    # Express application entrypoint
│
├── tejasai-browser-extension/       # Chrome Manifest V3 Browser Extension
│   ├── adapters/                    # Dedicated DOM injectors per platform
│   │   ├── chatgpt.js
│   │   ├── claude.js
│   │   ├── deepseek.js
│   │   ├── gemini.js
│   │   ├── grok.js
│   │   └── perplexity.js
│   ├── icons/                       # Official extension icons
│   ├── content.js                   # Extension coordinator and in-composer UI
│   ├── content.css                  # Isolated stylesheet for in-page overlays
│   ├── manifest.json                # Manifest V3 specification
│   ├── popup.html                   # Extension action popup
│   ├── popup.js                     # Extension popup logic (Enhance, Builder, Favorites)
│   └── popup.css                    # Popup styling
│
├── dev.js                           # Unified local development process runner
├── package.json                     # Workspace definition and root scripts
└── README.md
```

---

## Getting Started Locally

### Prerequisites
- Node.js 18.0.0 or higher (v20+ recommended)
- npm 9.0.0 or higher
- A Groq API key from https://console.groq.com/keys
- (Optional) A Google Gemini API key from https://aistudio.google.com/app/apikey for automatic fallback redundancy

### 1. Clone the Repository
```bash
git clone https://github.com/mr-baraiya/TejasAI.git
cd TejasAI
```

### 2. Install Dependencies
Install dependencies across both workspace packages:
```bash
npm run install:all
```

### 3. Configure Environment Variables
Copy the server environment template:

On macOS/Linux:
```bash
cp server/.env.example server/.env
```

On Windows PowerShell:
```powershell
Copy-Item server/.env.example server/.env
```

Open `server/.env` and add your API credentials:
```env
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173

# Required: Primary inference key
GROQ_API_KEY=your_actual_groq_api_key_here
GROQ_MODEL=qwen/qwen3.8-27b

# Optional: Automatic fallback redundancy
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_FALLBACK_MODEL=gemini-2.5-flash

# Optional: Prompt analytics database
DATABASE_URL=
```

### 4. Start Development Servers
Run both backend and frontend concurrently with a single command:
```bash
npm run dev
```

- Web Application: http://localhost:5173
- Backend API Health: http://localhost:5000/api/health

---

## Installing the Browser Extension

You can test or use the extension in Chrome, Brave, Edge, or Opera in under a minute:

1. Download or locate the extension:
   - Download the pre-built zip from the web app or find the `tejasai-browser-extension` folder in this repository.
2. In your Chromium browser, navigate to:
   ```text
   chrome://extensions
   ```
3. Enable Developer mode via the toggle switch in the upper-right corner.
4. Click Load unpacked in the upper-left corner.
5. Select the `tejasai-browser-extension` folder.
6. Navigate to ChatGPT, Claude, Gemini, Perplexity, DeepSeek, or Grok. The TejasAI Enhance button will automatically appear next to the prompt input box.

---

## API Reference

The backend provides a standardized, clean REST interface.

### 1. Health Check
```http
GET /api/health
```

#### Response Example (200 OK)
```json
{
  "status": "online",
  "app": "TejasAI Server",
  "groqConfigured": true,
  "groqModel": "qwen/qwen3.8-27b",
  "timestamp": "2026-10-24T22:00:00.000Z"
}
```

### 2. Prompt Enhancement
```http
POST /api/enhance
Content-Type: application/json
```

#### Request Payload
```json
{
  "prompt": "Write a python script to parse csv files and upload to s3",
  "targetAI": "any",
  "tweak": "",
  "previousResult": ""
}
```

| Field | Type | Required | Description |
|---|---|---|---|
| `prompt` | string | Yes | The draft prompt or objective (3 to 10,000 characters). |
| `targetAI` | string | No | Optional optimization target (`any`, `chatgpt`, `gemini`, `claude`, `perplexity`, `deepseek`, `grok`). |
| `tweak` | string | No | Optional iterative adjustment (`shorter`, `simpler`, `moreDetail`). |
| `previousResult`| string | No | The prior enhanced text when requesting a tweak. |

#### Response Example (200 OK)
```json
{
  "success": true,
  "enhancedPrompt": "Write an idiomatic Python script using boto3 and pandas to stream-parse large CSV files and upload the processed records to an AWS S3 bucket. Include robust error handling for missing files, invalid delimiter formats, and AWS credentials failures. Use environment variables for AWS keys and bucket names. Implement progress logging and memory-safe batch chunking for files exceeding 1GB.",
  "whyBetter": [
    "Specifies memory-safe stream parsing and batch chunking to prevent out-of-memory crashes on large files",
    "Establishes secure credential handling via environment variables rather than hardcoded credentials",
    "Defines explicit error handling paths for network partitions and malformed CSV rows"
  ],
  "meta": {
    "targetAI": "any",
    "tweak": null
  }
}
```

---

## Security, Privacy, and Responsible AI

- Zero Client-Side Secrets: Inference keys are strictly stored on the server runtime. Client applications and browser extensions communicate solely with backend proxies and never possess API keys.
- Input Boundaries and Sanitization: Requests are strictly validated and length-bounded to protect against denial-of-service and payload abuse.
- Sensitive Content Filtering: The system implements rigorous content policy boundaries, returning polite structured refusals when requests violate ethical or security boundaries.
- Rate Limiting Protection: The public API enforces sliding-window IP limits to preserve platform availability for everyone.

---

## Project Roadmap

- Chrome Web Store and Firefox Add-ons official store verification.
- Keyboard shortcut palette (Command/Ctrl + K) for quick prompt generation.
- Expanded platform adapters for GitHub Copilot Chat, Cursor, and v0.dev.
- Community prompt template contributions via verified pull requests.
- Optional client-side encrypted sync for prompt libraries across multiple devices.

---

## Sponsoring and Support

TejasAI is built and maintained as a free public utility. If TejasAI saves you time or enhances your workflow, consider supporting its continued open-source development:

- Sponsor on GitHub: https://github.com/sponsors/mr-baraiya
- Monthly and One-Time Tiers: Tier options start from as little as $1 to support ongoing server upkeep and API inference costs.
- Corporate Sponsorship: Organizations utilizing TejasAI across engineering or content teams can sponsor to guarantee prioritized issue triage and adapter maintenance.

---

## Contributing

Contributions are welcomed from developers of all skill levels:

1. Fork the repository.
2. Create your feature branch (`git checkout -b feature/new-framework`).
3. Commit your changes (`git commit -m "feat: add rust engineering prompt framework"`).
4. Push to the branch (`git push origin feature/new-framework`).
5. Open a Pull Request with a clear description of your improvements.

---

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for complete details.
