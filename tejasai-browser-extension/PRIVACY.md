# TejasAI Browser Extension — Privacy Policy & Disclosure

Last Updated: October 2026

At TejasAI, privacy and user trust are core design principles. This document outlines exactly what information the **TejasAI – AI Prompt Enhancer** browser extension accesses, transmits, and stores.

---

## 1. When is Data Transmitted?

- **Manual Enhancement (Default):** Prompt text is transmitted **only** when you explicitly click the **"Enhance"** button near the AI composer.
- **Auto-Enhance (Optional, Disabled by Default):** If you intentionally enable "Auto-Enhance on Submit" in the extension popup, prompt text is transmitted only when you trigger a submission (by clicking Send or pressing Enter) on an enabled AI platform.
- **Typing Monitoring:** The extension **never** records, tracks, or transmits text while you are typing.

---

## 2. What Data is Collected & Transmitted?

When an enhancement is requested, the extension transmits only:
1. The text content of the active AI prompt input box (between 3 and 1,500 characters).
2. The target AI platform identifier (e.g., `chatgpt`, `gemini`, `claude`, `perplexity`, or `deepseek`).

### What is NEVER collected or accessed:
- ❌ Account credentials, passwords, or usernames
- ❌ Browser history or tabs other than the 5 supported AI tools
- ❌ Form inputs, credit cards, or personal documents
- ❌ Chat history or prior conversations on AI platforms
- ❌ Device identifiers, location data, or analytics tracking IDs

---

## 3. Where is Data Sent?

Data is transmitted strictly over secure, encrypted HTTPS directly to the official TejasAI backend:
`https://tejasai-eta.vercel.app/api/enhance`

The extension **never** contacts any third-party analytics trackers, advertising networks, or unauthorized external endpoints.

---

## 4. Server-Side Data Retention

- **Zero Data Logging:** The TejasAI backend processes incoming prompts in volatile server memory solely to generate the enhanced prompt via Groq LPU inference.
- **Zero Disk Retention:** Prompts and responses are discarded immediately after the HTTP response completes. They are never written to disk, stored in a database, or used to train models.

---

## 5. Local Storage Permissions

The extension uses Chrome's `storage.sync` permission exclusively to save your local user preferences:
- Master extension enabled/disabled state
- Auto-enhance toggle preference
- Per-site enablement toggles (ChatGPT, Gemini, Claude, Perplexity, DeepSeek)

---

## 6. Contact & Support

If you have questions or feedback regarding this privacy disclosure, please contact:
- **Email:** baraiyavishalbhai32@gmail.com
- **Web App:** [https://tejasai-eta.vercel.app/](https://tejasai-eta.vercel.app/)
