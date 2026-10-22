# TejasAI Server

> **Live Production API:** [`POST https://tejasai-eta.vercel.app/api/enhance`](https://tejasai-eta.vercel.app/api/enhance)  
> **Live Health Check:** [`GET https://tejasai-eta.vercel.app/api/health`](https://tejasai-eta.vercel.app/api/health)

Backend API gateway and inference controller for the TejasAI prompt enhancement platform. Built with Node.js and Express, the server securely mediates client requests to the Groq LPU inference engine without exposing API keys to the browser.


## Table of Contents

- [Overview](#overview)
- [Key Responsibilities](#key-responsibilities)
- [Technology Stack](#technology-stack)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Environment Configuration](#environment-configuration)
- [Installation and Setup](#installation-and-setup)
- [Available Scripts](#available-scripts)
- [API Reference](#api-reference)
  - [GET /api/health](#get-apihealth)
  - [POST /api/enhance](#post-apienhance)
- [Validation and Sanitization Rules](#validation-and-sanitization-rules)
- [AI Engine and Heuristics](#ai-engine-and-heuristics)
- [Security Features](#security-features)
- [Testing](#testing)
- [License](#license)

---

## Overview

The TejasAI backend acts as an isolated middleware between the React single-page application and the Groq LLM inference service. It enforces rate limits, validates and sanitizes incoming user prompts, injects system instructions, formats model requests, validates model responses against strict formatting rules, and handles retries gracefully.

---

## Key Responsibilities

- Input Validation: Verifies prompt lengths, types, and supported option values before executing API calls.
- Security Gateway: Holds Groq API credentials securely on the server; credentials are never transmitted to or embedded within the frontend.
- Rate Limiting: Limits IP requests to mitigate abuse and protect inference quotas.
- Prompt Engineering: Applies system instructions and platform-specific formatting rules (for general, ChatGPT, Claude, and Gemini targets).
- Output Validation: Rejects hallucinated tags, bracket syntax, Markdown code fences, or malformed JSON from LLM outputs, executing automated retries when needed.
- Error Masking: Centralized error middleware ensures internal stack traces and provider credentials are never leaked in client responses.

---

## Technology Stack

- Runtime: Node.js (v18.0.0 or higher recommended, ES Modules)
- Framework: Express.js (v4)
- AI SDK: groq-sdk
- Rate Limiting: express-rate-limit
- Cross-Origin Resource Sharing: cors
- Environment Management: dotenv

---

## Project Structure

```text
server/
├── middleware/
│   └── errorHandler.js        # Centralized, safe error serialization
├── routes/
│   └── enhance.js             # Express router mounting POST /api/enhance
├── services/
│   ├── aiService.js           # Groq client wrapper, validation & retry logic
│   └── systemInstruction.js   # Prompt engineering rules and instructions
├── tests/
│   ├── capture_screens.js     # Verification script
│   └── enhance.test.js        # Automated test suite for enhancement endpoints
├── utils/
│   └── validatePrompt.js      # Input verification, sanitization, and bounding
├── .env.example               # Template for environment configuration
├── .gitignore                 # Server-specific Git ignore rules
├── package.json               # Backend dependencies and scripts
└── server.js                  # Application entry point, CORS, rate limiter
```

---

## Prerequisites

- Node.js 18.0.0 or higher (Node 20+ recommended)
- npm 9.0.0 or higher
- A valid Groq API key from the Groq Cloud Console

---

## Environment Configuration

Create a `.env` file in the `server/` directory by copying the example template:

```bash
cp .env.example .env
```

On Windows PowerShell:

```powershell
Copy-Item .env.example .env
```

### Environment Variables

| Variable | Type | Default | Description |
|---|---|---|---|
| PORT | Number | 5000 | The port on which the Express server listens. |
| NODE_ENV | String | development | Environment mode (development or production). |
| FRONTEND_URL | String | http://localhost:5173 | Allowed origin for CORS in production. |
| GROQ_API_KEY | String | Required | Secret API key obtained from Groq Console. |
| GROQ_MODEL | String | qwen/qwen3.8-27b | Target Groq model identifier. |
| MAX_PROMPT_LENGTH | Number | 10000 | Maximum permissible character count for requests. |
| AI_TIMEOUT_MS | Number | 60000 | Timeout threshold for inference calls in milliseconds. |

---

## Installation and Setup

Navigate to the `server/` directory and install the required dependencies:

```bash
cd server
npm install
```

Ensure that your `.env` file is populated with your `GROQ_API_KEY` before starting the service.

---

## Available Scripts

| Script | Command | Description |
|---|---|---|
| npm run dev | node --watch server.js | Starts the backend server with native Node file watcher for live reloading. |
| npm start | node server.js | Starts the production server process. |

---

## API Reference

### GET /api/health

Returns the operational status of the backend and whether Groq credentials are configured.

#### Request

- Method: GET
- Path: `/api/health`
- Headers: None required

#### Response (200 OK)

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

Enhances an input prompt into an actionable, structured prompt and generates supporting bullet points explaining the improvements.

#### Request

- Method: POST
- Path: `/api/enhance`
- Headers: `Content-Type: application/json`

#### Request Body Parameters

| Field | Type | Required | Description |
|---|---|---|---|
| prompt | String | Yes | The prompt text to enhance (minimum 3 characters, maximum 1,500 characters). |
| targetAI | String | No | Target platform. Allowed values: `any`, `chatgpt`, `gemini`, `claude`. Defaults to `any`. |
| tweak | String | No | Optional modification request. Allowed values: `shorter`, `simpler`, `moreDetail`. |
| previousResult | String | No | Prior enhanced output to be refined if a tweak is requested. |

#### Example Request Body

```json
{
  "prompt": "How to learn system design from scratch",
  "targetAI": "chatgpt",
  "tweak": "",
  "previousResult": ""
}
```

#### Successful Response (200 OK)

```json
{
  "success": true,
  "enhancedPrompt": "Create a comprehensive, 12-week structured roadmap to learn distributed system design from foundational concepts to advanced production patterns. Break the plan into sequential modules covering networking fundamentals, caching strategies, database sharding, consistency models, and message queues. For each module, include practical design problems, architectural diagrams, and recommended reading.",
  "whyBetter": [
    "Adds a defined 12-week chronological structure instead of open-ended advice",
    "Specifies core architectural topics like caching, sharding, and queues",
    "Demands actionable exercises and reading materials for applied learning"
  ],
  "meta": {
    "targetAI": "chatgpt",
    "tweak": null
  }
}
```

#### Error Responses

##### 400 Bad Request (Validation Failure)

Occurs when the prompt is absent, empty, less than 3 characters, or exceeds 1,500 characters.

```json
{
  "success": false,
  "error": "Please enter a prompt with at least 3 characters."
}
```

##### 422 Unprocessable Entity (Refusal)

Returned when a request attempts an adversarial bypass or cannot be safely processed.

```json
{
  "success": false,
  "error": "Sorry, we can't help with that request."
}
```

##### 429 Too Many Requests

Returned when the client IP exceeds 60 requests within a 15-minute window.

```json
{
  "success": false,
  "error": "Too many requests from this IP address. Please try again after 15 minutes."
}
```

##### 503 Service Unavailable

Returned when `GROQ_API_KEY` is missing or unconfigured.

```json
{
  "success": false,
  "error": "Groq API key is not configured. Please set a valid GROQ_API_KEY in server/.env"
}
```

---

## Validation and Sanitization Rules

The validation utility (`utils/validatePrompt.js`) enforces the following constraints:

1. Payload Verification: Body must be a valid JSON object.
2. String Enforcement: `prompt` must be a string.
3. Character Bounds: Trimming occurs automatically; input length must satisfy `3 <= length <= 1500`.
4. Target AI Sanitization: Must be one of `['any', 'chatgpt', 'gemini', 'claude']`. Other values default to `'any'`.
5. Tweak Sanitization: Allowed values are `['shorter', 'simpler', 'moreDetail']` (with aliases like `more_detail` mapped automatically).

---

## AI Engine and Heuristics

The AI service (`services/aiService.js`) implements several safety and quality control heuristics:

- Structured Format: The model is instructed to reply strictly with a JSON object containing `enhancedPrompt` and `whyBetter`.
- Bracket and Tag Stripping: Responses containing brackets (e.g. `[ROLE]`, `[CONTEXT]`) or Markdown headers are rejected and automatically re-prompted.
- Bullet Point Constraints: The `whyBetter` array must contain exactly 2 or 3 items, each 140 characters or fewer.
- Word Count Bounds: The enhanced output is constrained to concise, focused prompt guidance without verbose filler text like "Sure, here is your prompt".
- Automatic Retries: If the initial response violates formatting rules, a corrective follow-up prompt is sent to the model to repair the output before an error is returned.

---

## Security Features

- Secret Isolation: Backend environment variables are kept out of client bundles.
- Rate Limiting: Built-in `express-rate-limit` prevents brute-force scraping and denial of service.
- Error Sanitization: Stack traces and internal error payloads are intercepted by `middleware/errorHandler.js` and replaced with customer-safe explanations.
- Port Collision Handling: Detects `EADDRINUSE` at startup and outputs an explicit diagnostic message with resolution steps.

---

## Testing

An automated integration test script is provided in `tests/enhance.test.js`. It validates standard prompt improvements, adversarial prompts, input validation boundaries, bracket avoidance, and bullet count criteria against the running server.

To run the test suite:

```bash
# Ensure server is running on port 5000, then execute:
node tests/enhance.test.js
```

---

## License

This backend package is licensed under the MIT License. See the root [LICENSE](../LICENSE) file for terms.
