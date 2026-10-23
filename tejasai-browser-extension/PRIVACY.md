# TejasAI Browser Extension — Privacy Policy & Disclosure

Last Updated: October 2026

At TejasAI, privacy and user trust are core design principles. This document outlines exactly what information the **TejasAI – AI Prompt Enhancer** browser extension accesses, transmits, and stores.

---

## 1. When is Data Transmitted?

- **Explicit User Action Only:** Prompt text is transmitted **only** when you explicitly click the **"Enhance"** button inside the supported AI composer.
- **Zero Background Keystroke Monitoring:** The extension **never** records, tracks, or transmits text while you are typing.
- **No Automatic Submission:** Prompts are never automatically submitted to AI providers. When you click Enhance, the improved prompt is presented in a floating preview panel with explicit **"Replace Input"**, **"Copy"**, or **"Keep Original"** actions, giving you full control.

---

## 2. What Data is Collected & Transmitted?

When an enhancement is explicitly requested, the extension transmits only:
1. The text content of the active AI prompt input box (non-empty, up to 1,500 characters).
2. The target AI platform identifier (`chatgpt`, `gemini`, `claude`, `perplexity`, `deepseek`, or `grok`).

### What is NEVER collected or accessed:
- ❌ Account credentials, passwords, or usernames
- ❌ Browser history or tabs other than the supported AI tools
- ❌ Form inputs, credit cards, or personal documents
- ❌ Chat history or prior conversations on AI platforms
- ❌ Device identifiers, location data, or analytics tracking IDs

---

## 3. Where is Data Sent?

Data is transmitted strictly over secure, encrypted HTTPS directly to the official TejasAI backend:
`https://tejasai-eta.vercel.app/api/enhance`

The extension **never** contacts any third-party analytics trackers, advertising networks, or unauthorized external endpoints. All API keys and inference secrets remain strictly on the server; no secrets or tokens are stored or exposed in the extension client.

---

## 4. Server-Side Data Retention

- **Zero Prompt Logging:** The TejasAI backend processes incoming prompts in volatile server RAM solely to generate the enhanced prompt via Groq LPU inference.
- **Zero Disk Retention:** Prompts and responses are discarded immediately after the HTTP response completes. They are never written to disk, stored in a database, or used to train models.

---

## 5. Local Storage Permissions

The extension requests only Chrome's `storage` permission exclusively to save your local user preferences:
- Master extension enabled/disabled state
- Per-site enablement toggles (ChatGPT, Gemini, Claude, Perplexity, DeepSeek, Grok)

---

## 6. Content Policy & Context-Aware Moderation

- **No Keyword Blocking:** TejasAI does not block requests simply because they contain sensitive words such as "adult", "sex", or casual profanity.
- **Supported Contexts:** Inquiries relating to legitimate education (sex education, human biology, history), healthcare (STI symptoms/prevention, adult-onset health conditions, reproductive anatomy), literature, defensive cybersecurity, and non-explicit creative writing are responsibly enhanced.
- **Disallowed Content:** Prompts requesting child exploitation (CSAM), sexually explicit erotica/pornography, weapon or explosive manufacturing, malware creation, self-harm, or doxxing are respectfully refused.
- **Zero Sensitive Logging:** Refused or sensitive prompts are never logged to disk or stored in any database.

---

## 7. Independent Product Disclaimer

TejasAI is an independent tool and is not affiliated with, sponsored by, or endorsed by OpenAI, Google, Anthropic, Perplexity AI, DeepSeek, or xAI. All product names, logos, and brands (ChatGPT, Gemini, Claude, Perplexity, DeepSeek, Grok) are property of their respective trademark holders.

---

## 8. Contact & Support

If you have questions or feedback regarding this privacy disclosure, please contact:
- **Email:** baraiyavishalbhai32@gmail.com
- **Web App:** [https://tejasai-eta.vercel.app/](https://tejasai-eta.vercel.app/)
