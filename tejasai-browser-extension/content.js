/**
 * TejasAI Browser Extension - Content Script Coordinator
 *
 * Coordinates site adapters, injects the TejasAI Enhance button,
 * manages the floating preview panel, and handles auto-enhancement safely.
 */

(function () {
  'use strict';

  // 1. Identify active site adapter
  const adapters = Object.values(window.TejasAIAdapters || {});
  const adapter = adapters.find((a) => typeof a.matches === 'function' && a.matches(window.location.hostname));

  if (!adapter) {
    return; // Not on a supported AI website
  }

  // State
  let settings = {
    enabled: true,
    autoEnhance: false,
    sites: {},
  };

  let currentInputEl = null;
  let enhanceBtn = null;
  let previewPanel = null;
  let isEnhancing = false;
  let originalPromptCache = '';
  let lastEnhancedResult = '';
  let isAutoSubmitting = false;

  // Clean Sparkle SVG (TejasAI branded, never third-party logos)
  const SPARKLE_SVG = `
    <svg class="tejasai-sparkle-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 2L14.2 8.8L21 11L14.2 13.2L12 20L9.8 13.2L3 11L9.8 8.8L12 2Z" fill="currentColor"/>
    </svg>
  `;

  // Fetch initial settings from background service worker
  function loadSettings() {
    chrome.runtime.sendMessage({ action: 'GET_SETTINGS' }, (res) => {
      if (res) {
        settings = res;
        checkAndInject();
      }
    });
  }

  // React to storage updates from popup
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'sync' && changes.tejasai_settings) {
      settings = changes.tejasai_settings.newValue || {};
      checkAndInject();
    }
  });

  function isSiteEnabled() {
    if (!settings.enabled) return false;
    if (settings.sites && settings.sites[adapter.id] === false) return false;
    return true;
  }

  // Toast notification helper
  function showToast(message, type = 'normal') {
    const existing = document.querySelector('.tejasai-toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.className = `tejasai-toast ${type === 'error' ? 'tejasai-toast-error' : type === 'success' ? 'tejasai-toast-success' : ''}`;
    toast.setAttribute('role', 'alert');
    toast.textContent = message;

    document.body.appendChild(toast);
    setTimeout(() => {
      if (toast.parentElement) toast.remove();
    }, 4000);
  }

  // Main prompt enhancement trigger
  async function performEnhance({ isAuto = false } = {}) {
    if (isEnhancing) return;

    const inputEl = adapter.findInput();
    if (!inputEl) {
      showToast('Could not find active prompt input.', 'error');
      return;
    }

    const promptText = adapter.getText(inputEl);
    if (!promptText || promptText.length < 3) {
      if (!isAuto) {
        showToast('Please enter a prompt with at least 3 characters first.', 'error');
      }
      return;
    }

    if (promptText.length > 1500) {
      showToast('Prompt exceeds maximum length of 1,500 characters.', 'error');
      return;
    }

    // Cache original prompt for undo/restore
    originalPromptCache = promptText;
    setButtonLoading(true);

    try {
      const response = await new Promise((resolve) => {
        chrome.runtime.sendMessage(
          {
            action: 'ENHANCE_PROMPT',
            payload: {
              prompt: promptText,
              targetAI: adapter.targetAI || 'any',
            },
          },
          (res) => resolve(res)
        );
      });

      if (!response || !response.success || !response.enhancedPrompt) {
        const errorMsg = response?.error || 'Enhancement failed. Please try again.';
        showToast(errorMsg, 'error');
        setButtonLoading(false);
        return;
      }

      // Success: Apply enhanced prompt to input
      lastEnhancedResult = response.enhancedPrompt;
      adapter.setText(inputEl, response.enhancedPrompt);

      if (isAuto) {
        // Auto-enhance submission flow
        showToast('Prompt enhanced by TejasAI!', 'success');
        isAutoSubmitting = true;
        setTimeout(() => {
          const submitBtn = adapter.findSubmitButton();
          adapter.submitPrompt(inputEl, submitBtn);
          setTimeout(() => {
            isAutoSubmitting = false;
          }, 600);
        }, 150);
      } else {
        // Manual enhancement: open review card
        showPreviewPanel(response);
      }
    } catch (err) {
      showToast('Connection to TejasAI failed. Check your network.', 'error');
    } finally {
      setButtonLoading(false);
    }
  }

  function setButtonLoading(loading) {
    isEnhancing = loading;
    if (!enhanceBtn) return;

    if (loading) {
      enhanceBtn.disabled = true;
      enhanceBtn.innerHTML = `
        <span class="tejasai-spinner"></span>
        <span>Enhancing...</span>
      `;
    } else {
      enhanceBtn.disabled = false;
      enhanceBtn.innerHTML = `
        ${SPARKLE_SVG}
        <span>Enhance</span>
      `;
    }
  }

  // Floating preview and restore panel
  function showPreviewPanel(result) {
    dismissPreview();

    const container = adapter.findAttachContainer(currentInputEl) || currentInputEl.parentElement;
    if (!container) return;

    // Ensure relative positioning context
    const computedPos = window.getComputedStyle(container).position;
    if (computedPos === 'static') {
      container.style.position = 'relative';
    }

    const card = document.createElement('div');
    card.className = 'tejasai-preview-card';
    card.setAttribute('role', 'dialog');
    card.setAttribute('aria-label', 'TejasAI Prompt Enhancement Preview');

    let whyBetterHtml = '';
    if (Array.isArray(result.whyBetter) && result.whyBetter.length > 0) {
      const items = result.whyBetter.map((w) => `<li>${escapeHtml(w)}</li>`).join('');
      whyBetterHtml = `
        <div style="font-size: 11px; font-weight: 600; text-transform: uppercase; color: #C2410C; margin-bottom: 4px;">
          Why This Is Better:
        </div>
        <ul class="tejasai-why-better-list">${items}</ul>
      `;
    }

    card.innerHTML = `
      <div class="tejasai-preview-header">
        <div class="tejasai-preview-title">
          ${SPARKLE_SVG}
          <span>Enhanced with TejasAI</span>
        </div>
        <button type="button" class="tejasai-preview-close" aria-label="Dismiss preview">✕</button>
      </div>
      <div class="tejasai-preview-body">
        ${whyBetterHtml}
        <div class="tejasai-preview-text">${escapeHtml(result.enhancedPrompt)}</div>
      </div>
      <div class="tejasai-preview-footer">
        <button type="button" class="tejasai-action-btn tejasai-btn-secondary tejasai-btn-restore" title="Revert to your original typed prompt">
          Restore Original
        </button>
        <div style="display: flex; gap: 6px;">
          <button type="button" class="tejasai-action-btn tejasai-btn-secondary tejasai-btn-copy" title="Copy to clipboard">
            Copy
          </button>
          <button type="button" class="tejasai-action-btn tejasai-btn-primary tejasai-btn-keep">
            Keep &amp; Use
          </button>
        </div>
      </div>
    `;

    // Event listeners inside preview
    card.querySelector('.tejasai-preview-close').addEventListener('click', dismissPreview);
    card.querySelector('.tejasai-btn-keep').addEventListener('click', dismissPreview);

    card.querySelector('.tejasai-btn-restore').addEventListener('click', () => {
      if (originalPromptCache && currentInputEl) {
        adapter.setText(currentInputEl, originalPromptCache);
        showToast('Restored original prompt.', 'normal');
      }
      dismissPreview();
    });

    const copyBtn = card.querySelector('.tejasai-btn-copy');
    copyBtn.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(result.enhancedPrompt);
        copyBtn.textContent = 'Copied!';
        setTimeout(() => {
          if (copyBtn) copyBtn.textContent = 'Copy';
        }, 2000);
      } catch {
        showToast('Failed to copy to clipboard.', 'error');
      }
    });

    container.appendChild(card);
    previewPanel = card;
  }

  function dismissPreview() {
    if (previewPanel && previewPanel.parentElement) {
      previewPanel.remove();
    }
    previewPanel = null;
  }

  // Keyboard shortcut support (Escape to close preview)
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && previewPanel) {
      dismissPreview();
    }
  });

  // Attach button and listeners to DOM
  function checkAndInject() {
    if (!isSiteEnabled()) {
      if (enhanceBtn && enhanceBtn.parentElement) enhanceBtn.remove();
      dismissPreview();
      return;
    }

    const inputEl = adapter.findInput();
    if (!inputEl) return;

    currentInputEl = inputEl;

    // Check if enhance button already attached to DOM
    if (!document.contains(enhanceBtn)) {
      const container = adapter.findAttachContainer(inputEl);
      if (!container) return;

      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'tejasai-enhance-button';
      btn.title = `Enhance prompt with TejasAI (${adapter.name})`;
      btn.setAttribute('aria-label', 'Enhance prompt with TejasAI');
      btn.innerHTML = `
        ${SPARKLE_SVG}
        <span>Enhance</span>
      `;

      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        performEnhance({ isAuto: false });
      });

      container.appendChild(btn);
      enhanceBtn = btn;
    }

    // Setup auto-enhancement submission listener if enabled
    setupAutoEnhancementListeners(inputEl);
  }

  // Automatic submission interception (when explicitly enabled)
  function setupAutoEnhancementListeners(inputEl) {
    if (inputEl._tejasai_auto_attached) return;
    inputEl._tejasai_auto_attached = true;

    // 1. Enter key listener on input
    inputEl.addEventListener(
      'keydown',
      (e) => {
        if (!settings.enabled || !settings.autoEnhance || !settings.sites?.[adapter.id]) return;
        if (isAutoSubmitting || isEnhancing) return;

        // Enter without shift triggers submission on modern AI sites
        if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) {
          const currentText = adapter.getText(inputEl);
          // If already enhanced or too short, let natural submission proceed
          if (!currentText || currentText === lastEnhancedResult || currentText.length < 3) {
            return;
          }

          e.preventDefault();
          e.stopPropagation();
          performEnhance({ isAuto: true });
        }
      },
      true // Capture phase to intercept before site handler
    );

    // 2. Submit button click listener
    const submitBtn = adapter.findSubmitButton();
    if (submitBtn && !submitBtn._tejasai_auto_attached) {
      submitBtn._tejasai_auto_attached = true;
      submitBtn.addEventListener(
        'click',
        (e) => {
          if (!settings.enabled || !settings.autoEnhance || !settings.sites?.[adapter.id]) return;
          if (isAutoSubmitting || isEnhancing) return;

          const currentText = adapter.getText(inputEl);
          if (!currentText || currentText === lastEnhancedResult || currentText.length < 3) {
            return;
          }

          e.preventDefault();
          e.stopPropagation();
          performEnhance({ isAuto: true });
        },
        true
      );
    }
  }

  function escapeHtml(str) {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // DOM MutationObserver for SPAs (debounced to avoid performance hits)
  let debounceTimeout = null;
  const observer = new MutationObserver(() => {
    if (debounceTimeout) clearTimeout(debounceTimeout);
    debounceTimeout = setTimeout(() => {
      checkAndInject();
    }, 250);
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });

  // Initial load
  loadSettings();
})();
