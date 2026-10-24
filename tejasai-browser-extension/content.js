/**
 * TejasAI Browser Extension - Content Script Coordinator
 *
 * Coordinates site adapters, injects the TejasAI Enhance button,
 * manages the floating preview panel with explicit Replace/Copy actions,
 * and handles error states, timeouts, and recoverable retries.
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
    autoReplace: false,
    sites: {},
  };

  let currentInputEl = null;
  let enhanceBtn = null;
  let previewPanel = null;
  let isEnhancing = false;
  let originalPromptCache = '';
  let lastEnhancedResult = '';
  let toastTimeoutId = null;

  // TejasAI official brand logo across all AI tool composers
  function getLogoHtml() {
    try {
      const logoUrl = chrome.runtime.getURL('icons/icon48.png');
      return `<img src="${logoUrl}" class="tejasai-btn-logo" alt="TejasAI" />`;
    } catch {
      try {
        const fallbackUrl = chrome.runtime.getURL('icons/icon32.png');
        return `<img src="${fallbackUrl}" class="tejasai-btn-logo" alt="TejasAI" />`;
      } catch {
        return `<span style="font-weight:700;font-size:13px;color:#C2410C;">T</span>`;
      }
    }
  }

  // Fetch initial settings from background service worker
  function loadSettings() {
    chrome.runtime.sendMessage({ action: 'GET_SETTINGS' }, (res) => {
      if (chrome.runtime.lastError) {
        // Fallback default
        checkAndInject();
        return;
      }
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

  // Toast notification helper with dismissibility, non-stacking, and custom action button (Retry/Undo)
  function showToast(message, type = 'normal', onAction = null, actionLabel = 'Retry') {
    if (toastTimeoutId) {
      clearTimeout(toastTimeoutId);
      toastTimeoutId = null;
    }

    const existing = document.querySelector('.tejasai-toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.className = `tejasai-toast ${
      type === 'error'
        ? 'tejasai-toast-error'
        : type === 'warning'
        ? 'tejasai-toast-warning'
        : type === 'success'
        ? 'tejasai-toast-success'
        : ''
    }`;
    toast.setAttribute('role', 'alert');

    const msgSpan = document.createElement('span');
    msgSpan.className = 'tejasai-toast-message';
    msgSpan.textContent = message;
    toast.appendChild(msgSpan);

    if (typeof onAction === 'function') {
      const actionBtn = document.createElement('button');
      actionBtn.type = 'button';
      actionBtn.className = 'tejasai-toast-btn';
      actionBtn.textContent = actionLabel;
      actionBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        toast.remove();
        onAction();
      });
      toast.appendChild(actionBtn);
    }

    const closeBtn = document.createElement('button');
    closeBtn.type = 'button';
    closeBtn.className = 'tejasai-toast-dismiss';
    closeBtn.setAttribute('aria-label', 'Dismiss');
    closeBtn.textContent = '✕';
    closeBtn.addEventListener('click', () => {
      toast.remove();
    });
    toast.appendChild(closeBtn);

    document.body.appendChild(toast);

    const autoDismissMs = type === 'error' ? 7000 : 4000;
    toastTimeoutId = setTimeout(() => {
      if (toast.parentElement) toast.remove();
    }, autoDismissMs);
  }

  // Main prompt enhancement trigger
  async function performEnhance() {
    if (isEnhancing) return;

    const inputEl = adapter.findInput();
    if (!inputEl) {
      showToast('Could not find active prompt input in composer.', 'error');
      return;
    }

    const promptText = adapter.getText(inputEl);
    if (!promptText || promptText.trim().length === 0) {
      showToast('Please enter a prompt first.', 'normal');
      return;
    }

    if (promptText.length > 1500) {
      showToast('Prompt exceeds maximum length of 1,500 characters.', 'error');
      return;
    }

    // Cache original prompt
    originalPromptCache = promptText;
    setButtonLoading(true);

    try {
      const response = await new Promise((resolve) => {
        try {
          chrome.runtime.sendMessage(
            {
              action: 'ENHANCE_PROMPT',
              payload: {
                prompt: promptText.trim(),
                targetAI: adapter.targetAI || 'any',
              },
            },
            (res) => {
              if (chrome.runtime.lastError) {
                resolve({
                  success: false,
                  error: chrome.runtime.lastError.message || 'Could not reach extension service worker. Please refresh the page.',
                  recoverable: true,
                });
              } else {
                resolve(res);
              }
            }
          );
        } catch (dispatchErr) {
          resolve({
            success: false,
            error: dispatchErr.message || 'Failed to dispatch enhancement request.',
            recoverable: true,
          });
        }
      });

      if (!response || !response.success || !response.enhancedPrompt) {
        const errorMsg = response?.error || 'Enhancement failed. Please try again.';
        const retryHandler = response?.recoverable ? () => performEnhance() : null;
        const toastType = response?.isPolicyViolation ? 'warning' : 'error';
        showToast(errorMsg, toastType, retryHandler);
        return;
      }

      lastEnhancedResult = response.enhancedPrompt;

      // Auto-Replace mode: If user enabled "Auto-Replace Input", directly replace text without asking permission
      if (settings.autoReplace) {
        adapter.setText(inputEl, response.enhancedPrompt);
        showToast('Prompt enhanced & replaced!', 'success', () => {
          adapter.setText(inputEl, originalPromptCache);
          showToast('Restored original prompt.', 'normal');
        }, 'Undo');
      } else {
        // Permission mode: Present floating preview card with explicit Replace & Copy actions
        showPreviewPanel(response, inputEl);
      }
    } catch (err) {
      if (typeof console !== 'undefined' && console.debug) {
        console.debug('[TejasAI] Enhancement error caught:', err);
      }
      showToast(err.message || 'An unexpected error occurred during enhancement.', 'error', () => performEnhance());
    } finally {
      setButtonLoading(false);
    }
  }

  function setButtonLoading(loading) {
    isEnhancing = loading;
    if (!enhanceBtn) return;

    if (loading) {
      enhanceBtn.disabled = true;
      enhanceBtn.classList.add('tejasai-btn-loading');
      enhanceBtn.innerHTML = `
        <span class="tejasai-spinner"></span>
      `;
    } else {
      enhanceBtn.disabled = false;
      enhanceBtn.classList.remove('tejasai-btn-loading');
      enhanceBtn.innerHTML = getLogoHtml();
    }
  }

  // Floating preview and replace panel (appended to document.body to avoid host site overflow:hidden clipping)
  function showPreviewPanel(result, targetInputEl) {
    dismissPreview();

    const inputElement = targetInputEl || currentInputEl;
    if (!inputElement) return;

    const card = document.createElement('div');
    card.className = `tejasai-preview-card tejasai-preview-${adapter.id}`;
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

    let previewLogoUrl = '';
    try {
      previewLogoUrl = chrome.runtime.getURL('icons/icon48.png');
    } catch {
      previewLogoUrl = '';
    }

    card.innerHTML = `
      <div class="tejasai-preview-header">
        <div class="tejasai-preview-title">
          ${previewLogoUrl ? `<img src="${previewLogoUrl}" class="tejasai-preview-logo" alt="TejasAI" />` : ''}
          <span>Enhanced with TejasAI</span>
        </div>
        <button type="button" class="tejasai-preview-close" aria-label="Dismiss preview">✕</button>
      </div>
      <div class="tejasai-preview-body">
        ${whyBetterHtml}
        <div class="tejasai-preview-text">${escapeHtml(result.enhancedPrompt)}</div>
      </div>
      <div class="tejasai-preview-footer">
        <label class="tejasai-preview-autoreplace" title="Automatically replace input in future enhancements">
          <input type="checkbox" class="tejasai-autoreplace-cb">
          <span>Always replace</span>
        </label>
        <div style="display: flex; gap: 6px; align-items: center;">
          <button type="button" class="tejasai-action-btn tejasai-btn-secondary tejasai-btn-dismiss" title="Keep original draft untouched">
            Keep Original
          </button>
          <button type="button" class="tejasai-action-btn tejasai-btn-secondary tejasai-btn-copy" title="Copy enhanced prompt to clipboard">
            Copy
          </button>
          <button type="button" class="tejasai-action-btn tejasai-btn-primary tejasai-btn-replace" title="Replace composer text with enhanced prompt">
            Replace Input
          </button>
        </div>
      </div>
    `;

    // Event listeners inside preview
    card.querySelector('.tejasai-preview-close').addEventListener('click', dismissPreview);
    card.querySelector('.tejasai-btn-dismiss').addEventListener('click', dismissPreview);

    const replaceBtn = card.querySelector('.tejasai-btn-replace');
    replaceBtn.addEventListener('click', () => {
      const autoReplaceCb = card.querySelector('.tejasai-autoreplace-cb');
      if (autoReplaceCb && autoReplaceCb.checked) {
        settings.autoReplace = true;
        chrome.runtime.sendMessage({
          action: 'SAVE_SETTINGS',
          payload: { ...settings, autoReplace: true },
        });
      }
      if (inputElement && result.enhancedPrompt) {
        adapter.setText(inputElement, result.enhancedPrompt);
        showToast('Prompt updated in composer!', 'success');
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

    document.body.appendChild(card);
    previewPanel = card;

    updatePreviewPosition();

    window.addEventListener('scroll', updatePreviewPosition, { passive: true });
    window.addEventListener('resize', updatePreviewPosition, { passive: true });
  }

  function updatePreviewPosition() {
    if (!previewPanel) return;

    const anchor = (enhanceBtn && document.contains(enhanceBtn))
      ? enhanceBtn
      : (currentInputEl ? (adapter.getComposerBox(currentInputEl) || currentInputEl) : null);
    if (!anchor) return;

    const rect = anchor.getBoundingClientRect();
    const cardWidth = Math.min(460, window.innerWidth - 24);

    let rightOffset = window.innerWidth - rect.right;
    if (rightOffset < 14) rightOffset = 14;
    if (rightOffset + cardWidth > window.innerWidth - 14) {
      rightOffset = Math.max(14, window.innerWidth - cardWidth - 14);
    }

    previewPanel.style.position = 'fixed';
    previewPanel.style.width = `${cardWidth}px`;
    previewPanel.style.right = `${rightOffset}px`;
    previewPanel.style.left = 'auto';
    previewPanel.style.zIndex = '99999999';

    const spaceAbove = rect.top;
    const spaceBelow = window.innerHeight - rect.bottom;

    if (spaceAbove >= 240 || spaceAbove > spaceBelow) {
      previewPanel.style.bottom = `${Math.max(12, window.innerHeight - rect.top + 10)}px`;
      previewPanel.style.top = 'auto';
    } else {
      previewPanel.style.top = `${Math.min(window.innerHeight - 100, rect.bottom + 10)}px`;
      previewPanel.style.bottom = 'auto';
    }
  }

  function dismissPreview() {
    window.removeEventListener('scroll', updatePreviewPosition);
    window.removeEventListener('resize', updatePreviewPosition);
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

  // Click outside to dismiss preview
  document.addEventListener('pointerdown', (e) => {
    if (!previewPanel) return;
    if (previewPanel.contains(e.target)) return;
    if (enhanceBtn && enhanceBtn.contains(e.target)) return;
    dismissPreview();
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

    const container = adapter.findAttachContainer(inputEl);
    if (!container) return;

    const submitBtn = typeof adapter.findSubmitButton === 'function' ? adapter.findSubmitButton(inputEl) : null;

    // Helper to calculate target sibling before which the button should sit
    function getInsertBeforeTarget() {
      if (!submitBtn) return null;
      if (submitBtn.parentElement === container) return submitBtn;
      if (container.contains(submitBtn)) {
        let child = submitBtn;
        while (child.parentElement && child.parentElement !== container) {
          child = child.parentElement;
        }
        return child;
      }
      return null;
    }

    // Check if enhance button already attached to the valid container
    if (!enhanceBtn || !document.contains(enhanceBtn) || !container.contains(enhanceBtn)) {
      if (enhanceBtn && enhanceBtn.parentElement) {
        enhanceBtn.remove();
      }

      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = `tejasai-enhance-button tejasai-enhance-btn-${adapter.id}`;
      btn.title = 'TejasAI';
      btn.setAttribute('aria-label', 'TejasAI');
      btn.innerHTML = getLogoHtml();

      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        performEnhance({ isAuto: false });
      });

      const target = getInsertBeforeTarget();
      if (target) {
        container.insertBefore(btn, target);
      } else {
        container.appendChild(btn);
      }

      enhanceBtn = btn;
    } else {
      // If already in container, ensure correct order relative to submit button
      const target = getInsertBeforeTarget();
      if (target && enhanceBtn.nextElementSibling !== target && target !== enhanceBtn) {
        container.insertBefore(enhanceBtn, target);
      }
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
