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
  let saveBtn = null;
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

  // SVG Star icon for the Save button (both outlined and filled states)
  function getStarSvg(isSaved = false) {
    if (isSaved) {
      return `<svg class="tejasai-save-icon is-saved" viewBox="0 0 24 24" width="15" height="15" fill="#F97316" stroke="#EA580C" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
      </svg>`;
    }
    return `<svg class="tejasai-save-icon" viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
    </svg>`;
  }

  function updateSaveButtonVisual(isSaved) {
    if (!saveBtn) return;
    if (isSaved) {
      saveBtn.classList.add('is-saved');
      saveBtn.title = 'Saved in TejasAI favorites (click to remove)';
      saveBtn.setAttribute('aria-label', 'Saved in TejasAI favorites');
      saveBtn.innerHTML = getStarSvg(true);
    } else {
      saveBtn.classList.remove('is-saved');
      saveBtn.title = 'Save prompt to TejasAI favorites';
      saveBtn.setAttribute('aria-label', 'Save prompt to TejasAI favorites');
      saveBtn.innerHTML = getStarSvg(false);
    }
  }

  function syncSaveButtonState() {
    if (!saveBtn) return;
    const inputEl = (currentInputEl && currentInputEl.isConnected) ? currentInputEl : adapter.findInput();
    const text = inputEl ? adapter.getText(inputEl) : '';
    const targetText = (text && text.trim()) || (lastEnhancedResult && lastEnhancedResult.trim()) || '';
    if (!targetText) {
      updateSaveButtonVisual(false);
      return;
    }

    try {
      chrome.storage.local.get(['tejasai_favorites'], (data) => {
        if (chrome.runtime.lastError) return;
        const list = Array.isArray(data?.tejasai_favorites) ? data.tejasai_favorites : [];
        const isFound = list.some((f) => (f.prompt || '').trim().toLowerCase() === targetText.toLowerCase());
        updateSaveButtonVisual(isFound);
      });
    } catch {
      // storage unavailable
    }
  }

  function handleSavePrompt() {
    const inputEl = (currentInputEl && currentInputEl.isConnected) ? currentInputEl : adapter.findInput();
    const composerText = inputEl ? adapter.getText(inputEl) : '';
    const promptToSave = (composerText && composerText.trim()) || (lastEnhancedResult && lastEnhancedResult.trim()) || '';

    if (!promptToSave) {
      showToast('Please enter or enhance a prompt first.', 'normal');
      return;
    }

    // Trigger visual pop animation
    if (saveBtn) {
      saveBtn.classList.remove('tejasai-pop');
      void saveBtn.offsetWidth; // trigger reflow
      saveBtn.classList.add('tejasai-pop');
    }

    try {
      chrome.storage.local.get(['tejasai_favorites'], (data) => {
        const list = Array.isArray(data?.tejasai_favorites) ? data.tejasai_favorites : [];
        const normalized = promptToSave.toLowerCase();
        const existingIdx = list.findIndex((f) => (f.prompt || '').trim().toLowerCase() === normalized);

        if (existingIdx >= 0) {
          list.splice(existingIdx, 1);
          chrome.storage.local.set({ tejasai_favorites: list }, () => {
            updateSaveButtonVisual(false);
            showToast('Removed from TejasAI favorites.', 'normal');
          });
        } else {
          let title = '';
          if (originalPromptCache && originalPromptCache.trim() && originalPromptCache.trim() !== promptToSave) {
            title = originalPromptCache.split('\n')[0].slice(0, 45);
          } else {
            title = promptToSave.split('\n')[0].slice(0, 45);
          }

          const newItem = {
            id: `fav_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
            title: title || 'Saved Prompt',
            prompt: promptToSave,
            category: adapter.targetAI || 'general',
            source: 'composer',
            createdAt: new Date().toISOString(),
          };

          list.unshift(newItem);
          chrome.storage.local.set({ tejasai_favorites: list }, () => {
            updateSaveButtonVisual(true);
            showToast('Saved to TejasAI favorites!', 'success');
          });
        }
      });
    } catch (err) {
      showToast('Failed to access extension storage.', 'error');
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
        settings = { ...settings, ...res };
        checkAndInject();
      }
    });
  }

  // React to storage updates from popup (both sync and local)
  chrome.storage.onChanged.addListener((changes) => {
    if (changes && changes.tejasai_settings && changes.tejasai_settings.newValue) {
      settings = { ...settings, ...changes.tejasai_settings.newValue };
      checkAndInject();
    }
    if (changes && changes.tejasai_favorites) {
      syncSaveButtonState();
    }
  });

  // Listen for broadcast message from background when popup saves settings
  chrome.runtime.onMessage.addListener((message) => {
    if (message && message.action === 'SETTINGS_UPDATED' && message.payload) {
      settings = { ...settings, ...message.payload };
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

      // Ensure we have fresh settings from background in case toggle changed in popup
      try {
        const fresh = await new Promise((resolve) => {
          chrome.runtime.sendMessage({ action: 'GET_SETTINGS' }, (res) => {
            if (chrome.runtime.lastError || !res) resolve(null);
            else resolve(res);
          });
        });
        if (fresh) {
          settings = { ...settings, ...fresh };
        }
      } catch {
        // fallback to current in-memory settings
      }

      const isAutoReplace = settings.autoReplace === true || settings.autoReplace === 'true';

      // Auto-Replace mode: If user enabled "Auto-Replace Input", directly replace text without asking permission
      if (isAutoReplace) {
        const elToUpdate = (inputEl && inputEl.isConnected) ? inputEl : (adapter.findInput() || inputEl);
        if (elToUpdate) {
          adapter.setText(elToUpdate, response.enhancedPrompt);
          syncSaveButtonState();
          showToast('Prompt enhanced & replaced!', 'success', () => {
            const undoEl = (elToUpdate && elToUpdate.isConnected) ? elToUpdate : (adapter.findInput() || elToUpdate);
            if (undoEl) {
              adapter.setText(undoEl, originalPromptCache);
              syncSaveButtonState();
            }
            showToast('Restored original prompt.', 'normal');
          }, 'Undo');
          return;
        }
      }

      // Permission mode: Present floating preview card with explicit Replace & Copy actions
      showPreviewPanel(response, inputEl);
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
        <div style="display: flex; align-items: center; gap: 4px;">
          <button type="button" class="tejasai-preview-star" title="Save to TejasAI favorites">★</button>
          <button type="button" class="tejasai-preview-close" aria-label="Dismiss preview">✕</button>
        </div>
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

    const starBtn = card.querySelector('.tejasai-preview-star');
    if (starBtn) {
      chrome.storage.local.get(['tejasai_favorites'], (data) => {
        const list = Array.isArray(data?.tejasai_favorites) ? data.tejasai_favorites : [];
        if (list.some((f) => f.prompt.trim() === result.enhancedPrompt.trim())) {
          starBtn.style.opacity = '1';
        } else {
          starBtn.style.opacity = '0.55';
        }
      });

      starBtn.addEventListener('click', () => {
        chrome.storage.local.get(['tejasai_favorites'], (data) => {
          const list = Array.isArray(data?.tejasai_favorites) ? data.tejasai_favorites : [];
          const idx = list.findIndex((f) => f.prompt.trim() === result.enhancedPrompt.trim());
          if (idx >= 0) {
            list.splice(idx, 1);
            chrome.storage.local.set({ tejasai_favorites: list });
            starBtn.style.opacity = '0.55';
            showToast('Removed from extension favorites.', 'normal');
          } else {
            list.unshift({
              id: `fav_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
              title: originalPromptCache.slice(0, 35) || 'Enhanced Prompt',
              prompt: result.enhancedPrompt,
              category: adapter.targetAI || 'general',
              whyBetter: result.whyBetter || [],
              source: 'enhancer',
              createdAt: new Date().toISOString(),
            });
            chrome.storage.local.set({ tejasai_favorites: list });
            starBtn.style.opacity = '1';
            showToast('Saved to extension favorites', 'success');
          }
        });
      });
    }

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
      // Resolve live DOM input in case element was re-mounted or detached during preview
      const elToUpdate = (inputElement && inputElement.isConnected)
        ? inputElement
        : (adapter.findInput() || inputElement);

      if (elToUpdate && result.enhancedPrompt) {
        adapter.setText(elToUpdate, result.enhancedPrompt);
        syncSaveButtonState();
        showToast('Prompt updated in composer!', 'success');
      } else {
        showToast('Could not find active composer.', 'error');
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
    if (saveBtn && saveBtn.contains(e.target)) return;
    dismissPreview();
  });

  // Attach button and listeners to DOM
  function checkAndInject() {
    if (!isSiteEnabled()) {
      if (enhanceBtn && enhanceBtn.parentElement) enhanceBtn.remove();
      if (saveBtn && saveBtn.parentElement) saveBtn.remove();
      dismissPreview();
      return;
    }

    const inputEl = adapter.findInput();
    if (!inputEl) return;

    currentInputEl = inputEl;

    // Attach input change watcher to update save star in real time
    if (!inputEl.dataset.tejasaiWatched) {
      inputEl.dataset.tejasaiWatched = 'true';
      const onInput = () => syncSaveButtonState();
      inputEl.addEventListener('input', onInput);
      inputEl.addEventListener('change', onInput);
      inputEl.addEventListener('keyup', onInput);
    }

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

    // 1. Check if enhance button already attached to the valid container
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

    // 2. Check and attach save button directly to the left of enhanceBtn
    if (enhanceBtn && document.contains(enhanceBtn) && container.contains(enhanceBtn)) {
      if (!saveBtn || !document.contains(saveBtn) || !container.contains(saveBtn)) {
        if (saveBtn && saveBtn.parentElement) {
          saveBtn.remove();
        }

        const sBtn = document.createElement('button');
        sBtn.type = 'button';
        sBtn.className = `tejasai-save-button tejasai-save-btn-${adapter.id}`;
        sBtn.title = 'Save prompt to TejasAI favorites';
        sBtn.setAttribute('aria-label', 'Save prompt to TejasAI favorites');
        sBtn.innerHTML = getStarSvg(false);

        sBtn.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          handleSavePrompt();
        });

        container.insertBefore(sBtn, enhanceBtn);
        saveBtn = sBtn;
        syncSaveButtonState();
      } else if (saveBtn.nextElementSibling !== enhanceBtn) {
        container.insertBefore(saveBtn, enhanceBtn);
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

  // Message listener from extension popup (e.g. "Insert into Chat" action)
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message && message.action === 'INSERT_PROMPT') {
      const inputEl = adapter.findInput();
      if (inputEl && message.payload?.prompt) {
        adapter.setText(inputEl, message.payload.prompt);
        showToast('Prompt inserted from TejasAI!', 'success');
        sendResponse({ success: true });
      } else {
        showToast('Could not find active input box.', 'error');
        sendResponse({ success: false, error: 'Input element not found' });
      }
      return true;
    }
  });

  // Initial load
  loadSettings();
})();
