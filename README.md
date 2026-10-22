# TejasAI - AI Prompt Enhancer

> **Live Application:** [https://tejasai-eta.vercel.app/](https://tejasai-eta.vercel.app/)  
> **Production API Endpoint:** [`POST https://tejasai-eta.vercel.app/api/enhance`](https://tejasai-eta.vercel.app/api/enhance)  
> **Health Check Endpoint:** [`GET https://tejasai-eta.vercel.app/api/health`](https://tejasai-eta.vercel.app/api/health)

TejasAI is a full-stack, single-page application that transforms brief, unstructured, or ambiguous prompts into high-precision, production-grade instructions. Leveraging Groq ultra-low latency LPU inference, TejasAI helps creators, engineers, researchers, and students obtain significantly higher-quality outputs from large language models.


## Table of Contents

- [Overview](#overview)
- [Key Capabilities](#key-capabilities)
- [System Architecture](#system-architecture)
- [Technology Stack](#technology-stack)
- [Project Directory Structure](#project-directory-structure)
- [Prerequisites](#prerequisites)
- [Environment Configuration](#environment-configuration)
- [Installation and Setup](#installation-and-setup)
- [Running the Application](#running-the-application)
- [Browser Extension (Chrome / Brave / Edge)](#browser-extension-chrome--brave--edge)
- [API Reference](#api-reference)
  - [GET /api/health](#get-apihealth)
  - [POST /api/enhance](#post-apienhance)
- [Testing and Verification](#testing-and-verification)
- [Production Deployment](#production-deployment)
  - [Single-Project Vercel Deployment (Recommended)](#single-project-vercel-deployment-recommended)
  - [Decoupled Architecture](#decoupled-architecture)
  - [Unified Node.js Service](#unified-nodejs-service-vps--docker)
- [Security and Privacy](#security-and-privacy)
- [License](#license)

---

## Overview

Prompt quality is often the primary bottleneck when working with modern AI systems. TejasAI addresses this challenge by applying domain-informed prompt engineering principles, structured framing, role delineation, constraint enforcement, and contextual scaffolding.

The platform provides a responsive web interface paired with a secure Node.js backend gateway that interfaces directly with Groq models (specifically `qwen/qwen3.8-27b`), delivering near-instant prompt upgrades without exposing API credentials to client browsers.

---

## Key Capabilities

- Domain-Tailored Refinement:
  - Coding and Development: Modern architectures, type safety, error boundaries, edge cases, and modularity.
  - Creative and Copywriting: Pacing, narrative voice, emotional resonance, and stylistic distinction.
  - Academic and Research: Methodology rigor, balanced synthesis, structured citations, and objective inquiry.
  - Learning and Teaching: Pedagogical progression, analogies, and comprehension verification.
  - Business and Strategy: Executive clarity, KPI orientation, actionable roadmaps, and stakeholder context.
  - Image Generation: Subject detailing, lighting schemas, lens parameters, and composition styles.
  - General Tasks: Eliminating ambiguity, establishing clear outputs, and enforcing formatting rules.
- Target Model Tailoring: Optimize instructions for general foundation models or tailor them specifically for ChatGPT, Claude, or Gemini.
- Iterative Tweak Controls: Re-run enhancements with one-click directives for shorter responses, simpler language, or deeper practical detail.
- Dual Comparison Modes: View enhanced prompts in a full-width reading view or side-by-side against the original input.
- Improvement Explanations: Each generation returns concise bullet points explaining why the new prompt will yield superior results.
- Productivity Actions: One-click clipboard copy with visual feedback, formatted Markdown download (`.md`), and prompt reset.
- Local History: Automatically saves recent prompts and their enhancements to browser local storage for instant recall.
- Theme Support: Dark and light modes with ambient styling, high-contrast typography, and smooth transitions.

---

## System Architecture

```text
[ Browser / Client ]
  |
  |  (1) HTTP / JSON Request
  v
[ Express Backend Gateway (Port 5000) ]
  |  - Rate Limiter (60 req / 15 min)
  |  - Input Validation & Length Bounds
  |  - CORS & Error Handling
  |  - System Instruction Composition
  |
  |  (2) Authenticated API Call (GROQ_API_KEY)
  v
[ Groq Cloud LPU Inference Engine ]
  |
  |  (3) JSON Structured Response
  v
[ Express Backend Gateway ]
  |  - Format Validation & Bracket Stripping
  |  - Heuristic Retries (if malformed)
  |  - Clean Sanitized Payload
  |
  |  (4) Response Payload
  v
[ Browser / Client ]
  |  - Dual-View Render
  |  - Local Storage Cache
```

---

## Technology Stack

### Frontend (`client/`)
- Framework: React 19 (`react`, `react-dom`)
- Build System: Vite 8
- Styling: Tailwind CSS v4 (`@tailwindcss/vite`)
- Icons: Lucide React
- Linter: Oxlint
- Language: JavaScript (ES Modules, JSX)

### Backend (`server/`)
- Runtime: Node.js (v18.0.0 or higher, ES Modules)
- Framework: Express.js (v4)
- AI SDK: Official `groq-sdk`
- Rate Limiting: `express-rate-limit`
- Environment Management: `dotenv`
- CORS: `cors`

### Root Workspace
- Process Runner: Custom concurrent runner (`dev.js`)
- Package Management: npm workspaces scripts

---

## Project Directory Structure

```text
TejasAI/
├── client/
│   ├── public/
│   │   ├── favicon/
│   │   ├── favicon.ico
│   │   └── logo.png
│   ├── src/
│   │   ├── assets/
│   │   ├── components/
│   │   │   ├── CategorySelector.jsx
│   │   │   ├── ErrorAlert.jsx
│   │   │   ├── ExamplesGallery.jsx
│   │   │   ├── FaqSection.jsx
│   │   │   ├── Footer.jsx
│   │   │   ├── Header.jsx
│   │   │   ├── HowItWorks.jsx
│   │   │   ├── OutputDisplay.jsx
│   │   │   ├── PromptInput.jsx
│   │   │   └── RecentPrompts.jsx
│   │   ├── data/
│   │   │   └── categories.js
│   │   ├── services/
│   │   │   └── api.js
│   │   ├── App.css
│   │   ├── App.jsx
│   │   ├── index.css
│   │   └── main.jsx
│   ├── .env.example
│   ├── .gitignore
│   ├── .oxlintrc.json
│   ├── index.html
│   ├── package.json
│   ├── README.md
│   └── vite.config.js
│
├── server/
│   ├── middleware/
│   │   └── errorHandler.js
│   ├── routes/
│   │   └── enhance.js
│   ├── services/
│   │   ├── aiService.js
│   │   └── systemInstruction.js
│   ├── tests/
│   │   ├── capture_screens.js
│   │   └── enhance.test.js
│   ├── utils/
│   │   └── validatePrompt.js
│   ├── .env.example
│   ├── .gitignore
│   ├── package.json
│   ├── README.md
│   └── server.js
│
├── .gitignore
├── dev.js
├── LICENSE
├── package.json
└── README.md
```

---

## Prerequisites

- Node.js 18.0.0 or higher (v20+ recommended)
- npm 9.0.0 or higher
- A Groq API key (available from the Groq Cloud Console at https://console.groq.com/keys)

---

## Environment Configuration

### Backend Configuration

In the `server/` directory, create a `.env` file based on `.env.example`:

```bash
cp server/.env.example server/.env
```

On Windows PowerShell:

```powershell
Copy-Item server/.env.example server/.env
```

Open `server/.env` and configure your settings:

```env
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173

# Replace with your actual Groq API key
GROQ_API_KEY=gsk_your_groq_api_key_here

# Model identifier (e.g. qwen/qwen3.8-27b)
GROQ_MODEL=qwen/qwen3.8-27b

MAX_PROMPT_LENGTH=10000
AI_TIMEOUT_MS=60000
```

### Frontend Configuration (Optional)

The client connects to `/api` by default, which is forwarded to `http://localhost:5000` via the Vite proxy during local development. If deploying the frontend to a separate host in production, create `client/.env`:

```env
VITE_API_BASE_URL=https://your-backend-api-domain.com/api
```

---

## Installation and Setup

Install dependencies across both workspace packages from the root directory:

```bash
npm run install:all
```

Alternatively, install dependencies in each directory individually:

```bash
cd server && npm install
cd ../client && npm install
```

---

## Running the Application

### Option 1: Unified Runner (Recommended)

From the project root:

```bash
npm run dev
```

Or:

```bash
node dev.js
```

This concurrently launches:
- Express Backend on `http://localhost:5000`
- Vite Frontend on `http://localhost:5173`

Both processes pipe standard output to your terminal, and terminating the runner cleanly stops both servers.

### Option 2: Separate Terminals

#### Terminal 1 (Backend):
```bash
cd server
npm run dev
```

#### Terminal 2 (Frontend):
```bash
cd client
npm run dev
```

Open `http://localhost:5173` in your browser.

---

## Browser Extension (Chrome / Brave / Edge)

TejasAI includes an official Chrome Manifest V3 browser extension located in [`tejasai-browser-extension/`](tejasai-browser-extension/) that brings prompt enhancement directly into ChatGPT, Google Gemini, Claude, Perplexity, and DeepSeek.

### 1. Download from Website
Users can download the extension directly from your live website:
- Click the **"Extension"** button in the header of [https://tejasai-eta.vercel.app/](https://tejasai-eta.vercel.app/)
- Or download the ZIP package directly at: `https://tejasai-eta.vercel.app/tejasai-extension.zip`

### 2. Install in Browser (30 seconds)
1. Extract `tejasai-extension.zip`.
2. Open `chrome://extensions` in Chrome, Brave, or Edge.
3. Turn **ON** **Developer mode** in the top-right corner.
4. Click **Load unpacked** (top-left) and select the extracted folder: `tejasai-browser-extension`.

---

## API Reference

- **Production Base URL:** `https://tejasai-eta.vercel.app/api`
- **Local Dev Base URL:** `http://localhost:5000/api`

### GET /api/health

`GET https://tejasai-eta.vercel.app/api/health`

Returns backend connectivity status, Groq key configuration state, and the active model identifier.


#### Response Example (200 OK)

```json
{
  "status": "online",
  "app": "TejasAI Server",
  "groqConfigured": true,
  "groqModel": "qwen/qwen3.8-27b",
  "timestamp": "2026-10-22T02:20:00.000Z"
}
```

---

### POST /api/enhance

`POST https://tejasai-eta.vercel.app/api/enhance`

Accepts an input prompt along with optional target platform and iterative refinement options.


#### Request Headers

`Content-Type: application/json`

#### Request Body

| Parameter | Type | Required | Description |
|---|---|---|---|
| prompt | String | Yes | Input text to enhance (3 to 1,500 characters). |
| targetAI | String | No | Target engine. Values: `any`, `chatgpt`, `gemini`, `claude`. Default: `any`. |
| tweak | String | No | Refinement directive. Values: `shorter`, `simpler`, `moreDetail`. |
| previousResult | String | No | Prior enhanced output to be tweaked. |

#### Request Example

```json
{
  "prompt": "Explain database indexing for junior software developers.",
  "targetAI": "chatgpt",
  "tweak": "",
  "previousResult": ""
}
```

#### Success Response Example (200 OK)

```json
{
  "success": true,
  "enhancedPrompt": "Explain relational database indexing to an entry-level software engineer. Begin with an intuitive analogy comparing an index to a book's index. Contrast full-table scans with B-Tree index lookups using visual step-by-step descriptions. Discuss the operational tradeoffs between faster SELECT query reads versus slower INSERT, UPDATE, and DELETE writes. Conclude with three practical best practices for choosing which columns to index.",
  "whyBetter": [
    "Grounds abstract database theory in a familiar analogy and visual traversal steps",
    "Highlights critical write-overhead tradeoffs that entry-level engineers frequently overlook",
    "Provides actionable criteria for selecting appropriate columns for production indexing"
  ],
  "meta": {
    "targetAI": "chatgpt",
    "tweak": null
  }
}
```

#### Error Response Example (400 Bad Request)

```json
{
  "success": false,
  "error": "Please enter a prompt with at least 3 characters."
}
```

---

## Testing and Verification

### 1. Test Backend Health

```bash
# Test Live Vercel Production Deployment:
curl -s https://tejasai-eta.vercel.app/api/health

# Test Local Dev Server:
curl -s http://localhost:5000/api/health

# Using PowerShell (Live):
Invoke-RestMethod -Uri https://tejasai-eta.vercel.app/api/health -Method GET
```


### 2. Automated Test Suite

A standalone integration test suite is located in `server/tests/enhance.test.js`. It validates 8 scenarios including standard prompts, boundary lengths, adversarial inputs, output formatting, and response bullet count constraints:

```bash
cd server
node tests/enhance.test.js
```

### 3. Frontend Linting

```bash
cd client
npm run lint
```

---

## Production Deployment

### Single-Project Vercel Deployment (Recommended)

TejasAI is live in production at **[https://tejasai-eta.vercel.app/](https://tejasai-eta.vercel.app/)** and pre-configured to deploy frontend (Vite React) and backend (Express API as a serverless function) together as a **single project on Vercel**!

#### Prerequisites:
- A GitHub repository containing this project
- A free account on [vercel.com](https://vercel.com)
- Your Groq API key from [console.groq.com](https://console.groq.com)

#### Option A: Deploy via Vercel Web Dashboard (Easiest)

1. **Push your code to GitHub**:
   ```bash
   git add .
   git commit -m "feat: setup for vercel single project deployment"
   git push origin main
   ```
2. **Import into Vercel**:
   - Go to [vercel.com/new](https://vercel.com/new).
   - Select your `TejasAI` repository and click **Import**.
3. **Configure Project Settings**:
   - **Framework Preset**: Select **Vite** (or leave as Other).
   - **Root Directory**: `./` (leave default, do NOT select `client` or `server`).
   - **Build & Development Settings**: Keep defaults (Vercel automatically detects `vercel.json` with `outputDirectory: client/dist` and `npm run build`).
4. **Add Environment Variables**:
   Under **Environment Variables**, add:
   - `GROQ_API_KEY`: `gsk_...` (your Groq API key)
   - (Optional) `GROQ_MODEL`: `qwen/qwen3.8-27b`
   - (Optional) `NODE_ENV`: `production`
5. **Click Deploy**:
   Vercel will install dependencies, build the React frontend, and deploy the Express API function. Once finished, your full-stack app will be live at:
   - **Web App:** [https://tejasai-eta.vercel.app/](https://tejasai-eta.vercel.app/)
   - **API Endpoint:** [https://tejasai-eta.vercel.app/api/enhance](https://tejasai-eta.vercel.app/api/enhance)
   - **Health Check:** [https://tejasai-eta.vercel.app/api/health](https://tejasai-eta.vercel.app/api/health)


#### Option B: Deploy via Vercel CLI

```bash
# 1. Install Vercel CLI (if not installed)
npm install -g vercel

# 2. Login to your Vercel account
vercel login

# 3. Deploy from the repository root
vercel

# 4. Add your Groq API key to Vercel
vercel env add GROQ_API_KEY production

# 5. Deploy to Production
vercel --prod
```

### Decoupled Architecture

#### Frontend:
Deploy `client/` to static hosts like Vercel, Netlify, or Cloudflare Pages.
- Build command: `npm run build`
- Output directory: `dist`
- Environment variable: `VITE_API_BASE_URL=https://your-backend-api.onrender.com/api`

#### Backend:
Deploy `server/` to platforms like Render, Railway, Fly.io, or any containerized VPS.
- Start command: `node server.js`
- Set environment variables: `GROQ_API_KEY`, `GROQ_MODEL`, `PORT`, and `FRONTEND_URL` (to match your frontend domain).

### Unified Node.js Service (VPS / Docker)

To serve the frontend static files directly from the Express backend on a long-running Node.js server:

1. Build the client bundle:
   ```bash
   npm run build
   ```
2. Run `npm start` from root or server to serve both frontend and backend on a single port.


---

## Security and Privacy

- Zero Client-Side Secrets: The Groq API key is strictly maintained within the backend runtime. It is never bundled into client JavaScript.
- Rate Limiting: The Express server enforces a limit of 60 requests per 15 minutes per IP address to safeguard resources.
- Input Bounds: Client prompts are bounded between 3 and 1,500 characters, mitigating payload abuse.
- Safe Error Interception: Server errors are scrubbed by `errorHandler.js` so internal exception stacks and credentials are never exposed in responses.
- Content Privacy: Prompts are not stored in any external database or logged to disk by the backend service.

---

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for complete details.
