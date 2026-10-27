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

  // Phosphor Star icon for the Save button (both outlined and filled states)
  function getStarSvg(isSaved = false) {
    if (isSaved) {
      return `<svg class="tejasai-save-icon is-saved" viewBox="0 0 256 256" width="15" height="15" fill="#F97316">
        <path d="M234.29,114.85l-45,38.83L203,211.75a16.4,16.4,0,0,1-24.5,17.82L128,198.49,77.47,229.57A16.4,16.4,0,0,1,53,211.75l13.76-58.07-45-38.83A16.46,16.46,0,0,1,31.08,86l59-4.76,22.76-55.08a16.36,16.36,0,0,1,30.27,0l22.75,55.08,59,4.76a16.46,16.46,0,0,1,9.37,28.86Z"></path>
      </svg>`;
    }
    return `<svg class="tejasai-save-icon" viewBox="0 0 256 256" width="15" height="15" fill="currentColor">
      <path d="M239.18,97.26A16.38,16.38,0,0,0,224.92,86l-59-4.76L143.14,26.15a16.36,16.36,0,0,0-30.27,0L90.11,81.23,31.08,86a16.46,16.46,0,0,0-9.37,28.86l45,38.83L53,211.75a16.38,16.38,0,0,0,24.5,17.82L128,198.49l50.53,31.08A16.4,16.4,0,0,0,203,211.75l-13.76-58.07,45-38.83A16.43,16.43,0,0,0,239.18,97.26Zm-15.34,5.47-48.7,42a8,8,0,0,0-2.56,7.91l14.88,62.8a.37.37,0,0,1-.17.48c-.18.14-.23.11-.38,0l-54.72-33.65a8,8,0,0,0-8.38,0L69.09,215.94c-.15.09-.19.12-.38,0a.37.37,0,0,1-.17-.48l14.88-62.8a8,8,0,0,0-2.56-7.91l-48.7-42c-.12-.1-.23-.19-.13-.5s.18-.27.33-.29l63.92-5.16A8,8,0,0,0,103,91.86l24.62-59.61c.08-.17.11-.25.35-.25s.27.08.35.25L153,91.86a8,8,0,0,0,6.75,4.92l63.92,5.16c.15,0,.24,0,.33.29S224,102.63,223.84,102.73Z"></path>
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
              action: 'ANALYZE_PROMPT',
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

      if (!response || !response.success) {
        const errorMsg = response?.error || 'Enhancement failed. Please try again.';
        const retryHandler = response?.recoverable ? () => performEnhance() : null;
        const toastType = response?.isPolicyViolation ? 'warning' : 'error';
        showToast(errorMsg, toastType, retryHandler);
        return;
      }

      // If prompt is incomplete, display clarification panel
      if (response.needsClarification && response.question) {
        showClarificationPanel(response, inputEl, promptText.trim());
        return;
      }

      // If prompt was sufficient, apply enhanced result directly
      await applyEnhancedResult(response, inputEl);
    } catch (err) {
      if (typeof console !== 'undefined' && console.debug) {
        console.debug('[TejasAI] Enhancement error caught:', err);
      }
      showToast(err.message || 'An unexpected error occurred during enhancement.', 'error', () => performEnhance());
    } finally {
      setButtonLoading(false);
    }
  }

  async function applyEnhancedResult(response, inputEl) {
    if (!response || !response.enhancedPrompt) return;
    lastEnhancedResult = response.enhancedPrompt;

    // Refresh settings
    try {
      const fresh = await new Promise((resolve) => {
        chrome.runtime.sendMessage({ action: 'GET_SETTINGS' }, (res) => {
          if (chrome.runtime.lastError || !res) resolve(null);
          else resolve(res);
        });
      });
      if (fresh) settings = { ...settings, ...fresh };
    } catch {
      // fallback
    }

    const isAutoReplace = settings.autoReplace === true || settings.autoReplace === 'true';
    if (isAutoReplace) {
      const elToUpdate = adapter.findInput() || ((inputEl && inputEl.isConnected) ? inputEl : null);
      if (elToUpdate) {
        adapter.setText(elToUpdate, response.enhancedPrompt);
        syncSaveButtonState();
        showToast('Prompt enhanced & replaced!', 'success', () => {
          const undoEl = adapter.findInput() || ((elToUpdate && elToUpdate.isConnected) ? elToUpdate : null);
          if (undoEl) {
            adapter.setText(undoEl, originalPromptCache);
            syncSaveButtonState();
          }
          showToast('Restored original prompt.', 'normal');
        }, 'Undo');
        return;
      }
    }

    showPreviewPanel(response, inputEl);
  }

  function showClarificationPanel(data, targetInputEl, originalPrompt) {
    dismissPreview();
    const inputElement = targetInputEl || currentInputEl;
    if (!inputElement) return;

    const card = document.createElement('div');
    card.className = `tejasai-clarify-card tejasai-preview-${adapter.id}`;
    card.setAttribute('role', 'dialog');
    card.setAttribute('aria-label', 'TejasAI Prompt Clarification');

    const q = data.question || data.nextQuestion || {};
    const qIndex = data.questionCount || data.questionIndex || 1;
    const totalMax = data.maxQuestions || data.totalQuestionsMax || 3;
    const history = data.clarificationHistory || [];
    const questionText = q.question || q.text || 'Could you specify the primary purpose?';

    let optionsList = Array.isArray(q.options) && q.options.length > 0 ? q.options.slice(0, 3) : [];
    if (optionsList.length === 0) {
      if (q.type === 'yes_no') optionsList = ['Yes', 'No'];
      else if (q.type === 'number') optionsList = ['1', '3', '5'];
      else optionsList = ['Option 1', 'Option 2', 'Option 3'];
    }
    optionsList = optionsList.slice(0, 3);

    const optionsHtml = optionsList.map((opt) => `
      <button type="button" class="tejasai-clarify-btn" data-answer="${escapeHtml(String(opt))}">
        ${escapeHtml(String(opt))}
      </button>
    `).join('');

    const hasOther = q.allowsOther || optionsList.includes('Other');

    card.innerHTML = `
      <div class="tejasai-clarify-header">
        <span class="tejasai-clarify-badge">Clarification ${qIndex} of ${totalMax}</span>
        <button type="button" class="tejasai-preview-close" aria-label="Dismiss clarification">✕</button>
      </div>
      <div class="tejasai-clarify-question">${escapeHtml(questionText)}</div>
      <div class="tejasai-clarify-grid">
        ${optionsHtml}
      </div>
      ${hasOther ? `
        <div class="tejasai-clarify-other-row" style="margin-bottom: 10px; display: none;">
          <input type="text" class="tejasai-clarify-other-input" placeholder="Briefly describe (optional)..." maxlength="120" style="width: 100%; box-sizing: border-box; padding: 6px 10px; font-size: 12px; border: 1px solid #EDE8E1; border-radius: 6px; outline: none;" />
        </div>
      ` : ''}
      <div class="tejasai-clarify-footer">
        <button type="button" class="tejasai-clarify-skip">Skip &amp; enhance now</button>
        <span style="font-size: 11px; opacity: 0.6;">Smart Refinement</span>
      </div>
    `;

    card.querySelector('.tejasai-preview-close').addEventListener('click', dismissPreview);

    const otherRow = card.querySelector('.tejasai-clarify-other-row');
    const otherInput = card.querySelector('.tejasai-clarify-other-input');

    card.querySelectorAll('.tejasai-clarify-btn').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const answer = btn.getAttribute('data-answer');
        if (answer === 'Other' && otherRow && otherRow.style.display === 'none') {
          otherRow.style.display = 'block';
          otherInput?.focus();
          btn.style.borderColor = '#C2410C';
          btn.style.color = '#C2410C';
          return;
        }

        let finalAnswer = answer;
        if (answer === 'Other' && otherInput && otherInput.value.trim()) {
          finalAnswer = `Other: ${otherInput.value.trim()}`;
        }

        btn.textContent = '...';
        btn.disabled = true;
        await submitClarificationAnswer(originalPrompt, q, finalAnswer, history, inputElement, false);
      });
    });

    if (otherInput) {
      otherInput.addEventListener('keydown', async (e) => {
        if (e.key === 'Enter' && otherInput.value.trim()) {
          e.preventDefault();
          const val = `Other: ${otherInput.value.trim()}`;
          otherInput.disabled = true;
          await submitClarificationAnswer(originalPrompt, q, val, history, inputElement, false);
        }
      });
    }

    card.querySelector('.tejasai-clarify-skip').addEventListener('click', async () => {
      const skipBtn = card.querySelector('.tejasai-clarify-skip');
      skipBtn.textContent = 'Enhancing...';
      await submitClarificationAnswer(originalPrompt, q, null, history, inputElement, true);
    });

    document.body.appendChild(card);
    previewPanel = card;
    updatePreviewPosition();
  }

  async function submitClarificationAnswer(prompt, currentQuestion, answer, history, inputElement, skip = false) {
    setButtonLoading(true);
    try {
      const qText = currentQuestion ? (currentQuestion.question || currentQuestion.text || currentQuestion) : null;
      const response = await new Promise((resolve) => {
        chrome.runtime.sendMessage(
          {
            action: 'CLARIFY_PROMPT',
            payload: {
              prompt,
              targetAI: adapter.targetAI || 'any',
              clarificationHistory: history,
              currentQuestion: qText,
              answer: skip ? 'Skipped' : answer,
              skip,
            },
          },
          (res) => resolve(res)
        );
      });

      if (!response || !response.success) {
        showToast(response?.error || 'Clarification error.', 'error');
        dismissPreview();
        return;
      }

      if (response.needsClarification && (response.question || response.nextQuestion)) {
        showClarificationPanel(response, inputElement, prompt);
      } else if (response.enhancedPrompt) {
        dismissPreview();
        await applyEnhancedResult(response, inputElement);
      }
    } catch (err) {
      showToast(err.message || 'Clarification failed.', 'error');
      dismissPreview();
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
      const elToUpdate = adapter.findInput() || ((inputElement && inputElement.isConnected) ? inputElement : null);

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
