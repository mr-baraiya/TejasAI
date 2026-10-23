/**
 * TejasAI Browser Extension - Background Service Worker
 *
 * Manifest V3 service worker that:
 * 1. Safely mediates API requests to the TejasAI backend (avoiding CORS issues in content scripts).
 * 2. Manages persistent user preferences via chrome.storage.sync.
 * 3. Never logs or retains user prompt contents.
 */

import { enhancePromptApi, checkServerHealth, DEFAULT_API_BASE_URL } from './api.js';

export const DEFAULT_SETTINGS = {
  enabled: true,
  sites: {
    chatgpt: true,
    gemini: true,
    perplexity: true,
    deepseek: true,
    claude: true,
    grok: true,
  },
  apiBaseUrl: DEFAULT_API_BASE_URL,
};

// Initialize settings on installation if not present
chrome.runtime.onInstalled.addListener(async (details) => {
  try {
    const existing = await chrome.storage.sync.get('tejasai_settings');
    if (!existing || !existing.tejasai_settings) {
      await chrome.storage.sync.set({ tejasai_settings: DEFAULT_SETTINGS });
    }
  } catch (err) {
    console.warn('[TejasAI Background] Storage init error:', err);
  }
});

// Central message listener for Content Scripts & Popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (!message || !message.action) return false;

  if (message.action === 'ENHANCE_PROMPT') {
    handleEnhanceRequest(message.payload)
      .then((res) => {
        if (typeof console !== 'undefined' && console.debug && !res?.success) {
          console.debug('[TejasAI Worker] Request failed:', res?.error);
        }
        sendResponse(res);
      })
      .catch((err) => {
        if (typeof console !== 'undefined' && console.debug) {
          console.debug('[TejasAI Worker] Uncaught error:', err.message);
        }
        sendResponse({
          success: false,
          error: err.message || 'Internal background service worker error.',
          recoverable: true,
        });
      });
    return true; // Keep message port open for async response
  }

  if (message.action === 'CHECK_HEALTH') {
    handleCheckHealth()
      .then(sendResponse)
      .catch(() => sendResponse(null));
    return true;
  }

  if (message.action === 'GET_SETTINGS') {
    getMergedSettings()
      .then(sendResponse)
      .catch(() => sendResponse(DEFAULT_SETTINGS));
    return true;
  }

  if (message.action === 'SAVE_SETTINGS') {
    chrome.storage.sync
      .set({ tejasai_settings: message.payload })
      .then(() => sendResponse({ success: true }))
      .catch((err) => sendResponse({ success: false, error: err.message }));
    return true;
  }

  return false;
});

async function getMergedSettings() {
  try {
    const stored = await chrome.storage.sync.get('tejasai_settings');
    if (!stored || !stored.tejasai_settings) return { ...DEFAULT_SETTINGS };
    return {
      ...DEFAULT_SETTINGS,
      ...stored.tejasai_settings,
      sites: {
        ...DEFAULT_SETTINGS.sites,
        ...(stored.tejasai_settings.sites || {}),
      },
    };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

async function handleEnhanceRequest(payload) {
  const settings = await getMergedSettings();

  // Validate master toggle
  if (!settings.enabled) {
    return {
      success: false,
      error: 'TejasAI extension is currently disabled.',
    };
  }

  const result = await enhancePromptApi({
    prompt: payload?.prompt || '',
    targetAI: payload?.targetAI || 'any',
    tweak: payload?.tweak || '',
    previousResult: payload?.previousResult || '',
    apiBaseUrl: settings.apiBaseUrl || DEFAULT_API_BASE_URL,
  });

  return result;
}

async function handleCheckHealth() {
  const settings = await getMergedSettings();
  return await checkServerHealth(settings.apiBaseUrl || DEFAULT_API_BASE_URL);
}
