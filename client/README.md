# TejasAI Client

The frontend client for the TejasAI prompt enhancement platform. Built with React 19, Vite, and Tailwind CSS v4, the application provides an interactive workspace for transforming simple or unstructured thoughts into high-impact, production-ready prompts.

## Table of Contents

- [Overview](#overview)
- [Key Features](#key-features)
- [Technology Stack](#technology-stack)
- [Project Structure](#project-structure)
- [Component Architecture](#component-architecture)
- [API and Data Flow](#api-and-data-flow)
- [Prerequisites](#prerequisites)
- [Installation and Setup](#installation-and-setup)
- [Environment Configuration](#environment-configuration)
- [Available Scripts](#available-scripts)
- [Development Proxy](#development-proxy)
- [Production Build and Deployment](#production-build-and-deployment)
- [Code Quality and Linting](#code-quality-and-linting)
- [License](#license)

---

## Overview

The TejasAI frontend is a fast, responsive single-page application (SPA). It communicates with the TejasAI backend API to enhance prompts, display structured improvement reasons, offer prompt iteration tweaks (shorter, simpler, more detailed), and store recent generations in the user's browser.

---

## Key Features

- Dynamic Prompt Composer: Real-time character counters, word count tracking, keyboard shortcuts (Ctrl+Enter / Cmd+Enter to submit), paste, and clear utilities.
- Target AI Selection: Optimize prompts for general use or specifically tailored for ChatGPT, Claude, or Gemini.
- Iterative Tweak Controls: Quickly re-prompt the model to make existing results shorter, simpler, or more detailed.
- Domain Categories and Presets: Pre-configured templates across coding, writing, research, education, business, and image generation.
- Dual View Modes: Seamlessly toggle between a unified single view and a side-by-side comparison mode contrasting the original and enhanced prompts.
- Actions and Export: One-click copy with instant visual confirmation and direct download as formatted Markdown (`.md`).
- Local History: Automatically saves recent prompt sessions in `localStorage` for quick recall without requiring an account.
- Theme Support: Dark and light modes with ambient styling, high-contrast typography, and smooth transitions.
- Health Monitoring: Live indicator in the navigation header displaying backend connection status.
- Zero Secret Exposure: Operates entirely without client-side API keys. All inference calls route through the backend gateway.

---

## Technology Stack

- Core Framework: React 19 (`react`, `react-dom`)
- Build Tool: Vite 8
- Styling: Tailwind CSS v4 (`tailwindcss`, `@tailwindcss/vite`)
- Icon Library: Phosphor Icons (`@phosphor-icons/react`)
- Linter: Oxlint (`oxlint`)
- Language: JavaScript (ES Modules, JSX)

---

## Project Structure

```text
client/
├── public/
│   ├── favicon/               # Multi-resolution favicons and site manifest
│   ├── favicon.ico
│   └── logo.png
├── src/
│   ├── assets/                # Static image assets and graphics
│   ├── components/
│   │   ├── CategorySelector.jsx # Domain preset pills and target model selector
│   │   ├── ErrorAlert.jsx     # Graceful error notification boundary
│   │   ├── ExamplesGallery.jsx# Interactive sample prompt cards
│   │   ├── FaqSection.jsx     # Accordion of frequently asked questions
│   │   ├── Footer.jsx         # Footer links and attribution
│   │   ├── Header.jsx         # Header navbar, status pill, theme switcher
│   │   ├── HowItWorks.jsx     # Step-by-step workflow explanation
│   │   ├── OutputDisplay.jsx  # Dual-view output, metrics, copy and download
│   │   ├── PromptInput.jsx    # Textarea composer with metrics and shortcuts
│   │   └── RecentPrompts.jsx  # Local storage prompt history carousel
│   ├── data/
│   │   └── categories.js      # Metadata, colors, and sample prompt strings
│   ├── services/
│   │   └── api.js             # HTTP client for backend communication
│   ├── App.css                # Global animations and keyframe definitions
│   ├── App.jsx                # Main application orchestrator and state hub
│   ├── index.css              # Tailwind CSS directives and root styling
│   └── main.jsx               # React DOM root entry point
├── .env.example               # Template for client environment settings
├── .gitignore                 # Client-specific Git ignore rules
├── .oxlintrc.json             # Oxlint configuration
├── index.html                 # Main HTML document entry point
├── package.json               # Frontend dependencies and npm scripts
└── vite.config.js             # Vite configuration with Tailwind and /api proxy
```

---

## Component Architecture

The interface is organized hierarchically with centralized state management in `App.jsx`:

1. `Header.jsx`: Top navigation containing brand identity, live backend health badge (checking `/api/health`), and light/dark theme toggle.
2. `CategorySelector.jsx`: Domain selection badges and target AI radio controls (`any`, `chatgpt`, `gemini`, `claude`).
3. `PromptInput.jsx`: Controlled text input with character/word counting, quick actions (paste, clear, sample injection), and keyboard shortcut listeners.
4. `OutputDisplay.jsx`: Renders the enhanced output, improvement explanations (`whyBetter` cards), word count expansion ratios, view toggle (single vs. side-by-side), copy-to-clipboard, markdown download, and iterative refinement pills (shorter, simpler, more detail).
5. `RecentPrompts.jsx`: Reads and writes past sessions to browser `localStorage`, allowing single-click recall of past prompts.
6. `ExamplesGallery.jsx`: Categorized list of prompt ideas to help users explore capabilities across domains.
7. `HowItWorks.jsx` & `FaqSection.jsx`: Educational accordions clarifying the enhancement pipeline.
8. `ErrorAlert.jsx`: User-facing alert banner that renders actionable guidance when the backend is unreachable or returns validation errors.

---

## API and Data Flow

All network requests are encapsulated in `src/services/api.js`:

- `checkServerHealth()`: Issues a `GET /api/health` request to verify backend availability and whether Groq credentials are set.
- `enhancePromptApi({ prompt, targetAI, tweak, previousResult }, signal)`: Issues a `POST /api/enhance` request. Supports request cancellation through native `AbortController` signals.

During local development, API requests directed at `/api` are transparently proxied to the Express server running on port 5000 by Vite.

---

## Prerequisites

- Node.js 18.0.0 or higher
- npm 9.0.0 or higher
- The TejasAI backend running on port 5000 (for enhancement functionality)

---

## Installation and Setup

Navigate to the `client/` directory and install dependencies:

```bash
cd client
npm install
```

---

## Environment Configuration

The client operates out of the box with zero configuration during local development by leveraging the Vite development proxy.

If deploying the frontend independently on a different domain or port from the backend, create a `.env` file:

```bash
cp .env.example .env
```

Set `VITE_API_BASE_URL` to point to your backend API route:

```env
VITE_API_BASE_URL=https://your-backend-domain.com/api
```

Note: Never include API secrets or keys in client `.env` files. Variables with the `VITE_` prefix are compiled into client-side code and visible to anyone inspecting the site.

---

## Available Scripts

From within the `client/` directory:

| Script | Command | Description |
|---|---|---|
| npm run dev | vite | Starts the local Vite development server with Hot Module Replacement (HMR). Defaults to http://localhost:5173. |
| npm run build | vite build | Compiles and optimizes assets into the `dist/` folder for production. |
| npm run preview | vite preview | Locally previews the production build generated in `dist/`. |
| npm run lint | oxlint | Runs Oxlint to inspect code for syntax errors and common issues. |

---

## Development Proxy

The Vite configuration (`vite.config.js`) forwards all requests matching the `/api` prefix to the backend:

```javascript
server: {
  port: 5173,
  proxy: {
    '/api': {
      target: 'http://localhost:5000',
      changeOrigin: true,
    },
  },
}
```

This prevents cross-origin issues during local development and eliminates the need for hardcoded backend URLs.

---

## Production Build and Deployment

### 1. Build Static Assets

```bash
npm run build
```

This generates an optimized static bundle in `client/dist`.

### 2. Deployment Options

- Vercel: Set root directory to `client`, build command to `npm run build`, and output directory to `dist`. Set `VITE_API_BASE_URL` in project settings.
- Netlify: Deploy the `client/dist` directory and configure redirect rules for SPA routing.
- Combined Deployment: The static files in `client/dist` can also be served directly by the Express server using `express.static`.

---

## Code Quality and Linting

The project uses Oxlint for static analysis. Run the linter using:

```bash
npm run lint
```

---

## License

This frontend package is licensed under the MIT License. See the root [LICENSE](../LICENSE) file for terms.
