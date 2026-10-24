# TejasAI – AI Prompt Enhancer (Chrome Browser Extension)

Production-grade Chrome Extension (Manifest V3) that brings the power of **TejasAI** directly into your favorite AI websites. Instantly upgrade vague, brief, or messy prompts into high-precision, production-grade instructions without copying and pasting between tabs.

---

## Supported AI Platforms

| AI Platform | Supported Hostnames | Input Architecture |
| :--- | :--- | :--- |
| **ChatGPT** | `chatgpt.com`, `*.chatgpt.com` | React Textarea & ContentEditable |
| **Google Gemini** | `gemini.google.com` | Quill / Angular Rich Textarea |
| **Anthropic Claude** | `claude.ai`, `*.claude.ai` | ProseMirror ContentEditable |
| **Perplexity AI** | `perplexity.ai`, `www.perplexity.ai` | React Search & Textarea |
| **DeepSeek** | `chat.deepseek.com` | Modern Chat Textarea |
| **Grok (xAI)** | `grok.com`, `x.com/i/grok` | Textarea & ContentEditable |

---

## Key Features

1. **Seamless In-Composer Enhance Button**:
   - Injects a compact, branded **"Enhance"** button directly next to the AI tool's input box.
   - Shows live loading spinner during inference (`qwen/qwen3.8-27b` via Groq LPUs).

2. **Explicit Review & Preview Panel**:
   - After enhancement, a clean floating preview panel appears with:
     - **Why This Is Better**: Bulleted list of concrete engineering upgrades made to your prompt.
     - **Full Preview**: Scrollable view of the precision prompt text.
     - **Replace Input**: One-click explicit replacement of composer text.
     - **Copy**: Quick clipboard copy with confirmation.
     - **Keep Original**: Keep your original draft untouched.
     - **Keyboard Accessible**: Press `Escape` to close the review panel at any time.

3. **Explicit User Actions (Zero Auto-Submission)**:
   - All prompt enhancements and replacements require explicit user action.
   - Prompts are never automatically submitted to AI providers.

4. **Polished Settings Popup**:
   - Live backend health indicator (`Connected` / `Offline`).
   - Master on/off toggle.
   - **Auto-Replace Input Toggle**: Option to automatically replace composer text without asking for confirmation, complete with an instant "Undo" toast.
   - Individual toggles for each of the 6 supported AI platforms.
   - Direct link to open the TejasAI Web Application.

5. **100% Secure & Privacy-Conscious**:
   - Zero credentials stored in the extension.
   - Never logs prompts to disk or database.
   - No keystroke recording or typing monitoring — prompts are only transmitted upon explicit click of "Enhance".

6. **Context-Aware Content Moderation**:
   - Distinguishes legitimate educational, medical, and defensive inquiries from harmful requests based on context rather than isolated keywords.
   - Respectfully refuses disallowed requests with clear explanations and zero sensitive prompt logging.

---

## Project Structure

```text
tejasai-browser-extension/
├── manifest.json       # Chrome Manifest V3 configuration
├── background.js       # Background service worker (mediates API & storage)
├── api.js              # Client adapter connecting to TejasAI backend
├── content.js          # In-page coordinator (UI injection & state)
├── content.css         # Scoped styling for button, preview panel & toasts
├── popup.html          # Extension popup UI
├── popup.css           # Styling for popup settings interface
├── popup.js            # Settings controller & health monitor
├── adapters/           # Site-specific DOM adapters
│   ├── chatgpt.js      # ChatGPT input detection & synthetic events
│   ├── gemini.js       # Google Gemini Quill editor integration
│   ├── perplexity.js   # Perplexity search input integration
│   ├── deepseek.js     # DeepSeek textarea integration
│   ├── claude.js       # Claude ProseMirror integration
│   └── grok.js         # Grok (grok.com & x.com) integration
├── icons/              # Official TejasAI extension icons
│   ├── icon16.png
│   ├── icon32.png
│   ├── icon48.png
│   ├── icon128.png
│   └── logo.png
├── PRIVACY.md          # Complete privacy disclosure
└── README.md           # Documentation and setup guide
```

---

## Installation Instructions (Chrome / Edge / Brave)

Follow these simple steps to install the extension in developer mode:

1. Open your browser and navigate to the extensions page:
   - **Chrome:** `chrome://extensions`
   - **Brave:** `brave://extensions`
   - **Edge:** `edge://extensions`

2. Enable **Developer mode** using the toggle in the top-right corner.

3. Click the **Load unpacked** button in the top-left corner.

4. Browse to and select the `tejasai-browser-extension` folder:
   ```text
   d:\VS_CODES\Projects\TejasAI\tejasai-browser-extension
   ```

5. The **TejasAI – AI Prompt Enhancer** icon will now appear in your browser's extension toolbar! Pin it for easy access.

---

## Testing & Verification Checklist

1. **Verify Extension Popup**:
   - Click the TejasAI extension icon in your browser toolbar.
   - Confirm the status bar shows **"Connected to TejasAI (qwen3.8-27b)"** with a green indicator.
   - Verify all 5 platform toggles are enabled.

2. **Test on ChatGPT (`chatgpt.com`)**:
   - Open [chatgpt.com](https://chatgpt.com).
   - Notice the orange **Enhance** button beside the prompt composer.
   - Type a brief prompt: `explain quantum computing to a high schooler`.
   - Click **Enhance**.
   - Notice the loading state (`Enhancing...`), followed by the upgraded prompt automatically placed in the input.
   - The floating preview card will appear showing why the prompt is better.
   - Test **Restore Original** to verify undo behavior.

3. **Test on Claude (`claude.ai`)**:
   - Open [claude.ai](https://claude.ai).
   - Enter a prompt in the composer, click **Enhance**, and verify the ProseMirror editor updates cleanly.

4. **Test on Google Gemini (`gemini.google.com`)**:
   - Open [gemini.google.com](https://gemini.google.com).
   - Verify the Quill editor receives the enhanced prompt and the Send button activates.

5. **Test on Perplexity (`perplexity.ai`)**:
   - Open [perplexity.ai](https://perplexity.ai).
   - Enter a query, click **Enhance**, and check the updated input.

6. **Test on DeepSeek (`chat.deepseek.com`)**:
   - Open [chat.deepseek.com](https://chat.deepseek.com).
   - Verify the chat input receives the updated prompt.

7. **Test Error Handling**:
   - Try clicking **Enhance** with an empty prompt (or fewer than 3 characters). A non-intrusive alert will remind you to type a prompt first.

---

## Backend Endpoint Used

The extension communicates directly with your deployed production endpoint:
- **API URL:** `https://tejasai-eta.vercel.app/api/enhance`
- **Health Check:** `https://tejasai-eta.vercel.app/api/health`

No API keys or inference secrets are stored in the extension. The backend securely manages Groq inference server-side.

---

## Independent Product Disclaimer

TejasAI is an independent tool and is not affiliated with, sponsored by, or endorsed by OpenAI, Google, Anthropic, Perplexity AI, DeepSeek, or xAI. All product names, logos, and brands (ChatGPT, Gemini, Claude, Perplexity, DeepSeek, Grok) are property of their respective trademark holders.

