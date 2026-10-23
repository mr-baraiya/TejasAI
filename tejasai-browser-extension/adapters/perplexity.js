/**
 * TejasAI Site Adapter - Perplexity AI (perplexity.ai & www.perplexity.ai)
 *
 * Supports Perplexity's React search composers, follow-up inputs,
 * voice/mic action clusters, and standard/contenteditable textareas.
 */

window.TejasAIAdapters = window.TejasAIAdapters || {};

window.TejasAIAdapters['perplexity'] = {
  id: 'perplexity',
  name: 'Perplexity',
  targetAI: 'perplexity',

  matches(hostname) {
    return hostname.includes('perplexity.ai');
  },

  findInput() {
    const selectors = [
      'textarea[placeholder*="connectors" i]',
      'textarea[placeholder*="Type @" i]',
      'textarea[placeholder*="Ask" i]',
      'textarea[placeholder*="Search" i]',
      'textarea[placeholder*="anything" i]',
      'textarea[placeholder*="question" i]',
      'textarea[placeholder*="follow-up" i]',
      'div[data-testid="search-input"] textarea',
      'textarea[data-testid*="search" i]',
      'textarea[data-testid*="input" i]',
      '[data-testid="search-input"]',
      'main textarea',
      'form textarea',
      'textarea.overflow-auto',
      'textarea',
      'div[contenteditable="true"][role="textbox"]',
      'div[contenteditable="true"]',
    ];

    for (const sel of selectors) {
      try {
        const candidates = document.querySelectorAll(sel);
        for (const el of candidates) {
          if (!el) continue;
          if (el.closest('header, nav, aside, [role="navigation"]')) continue;

          // Check visibility
          const rect = el.getBoundingClientRect();
          if (rect.width > 0 && rect.height > 0) {
            return el;
          }
          if (el.offsetParent !== null) {
            return el;
          }
        }
      } catch {
        // Continue
      }
    }
    return null;
  },

  getText(el) {
    if (!el) return '';
    if (el.tagName === 'TEXTAREA' || el.tagName === 'INPUT') {
      return (el.value || '').trim();
    }
    return (el.innerText || el.textContent || '').trim();
  },

  setText(el, text) {
    if (!el) return false;
    el.focus();

    if (el.tagName === 'TEXTAREA' || el.tagName === 'INPUT') {
      const descriptor = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value');
      if (descriptor && descriptor.set) {
        descriptor.set.call(el, text);
      } else {
        el.value = text;
      }
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
      return true;
    }

    // Contenteditable fallback
    try {
      el.innerText = text;
      el.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'insertText', data: text }));
      return true;
    } catch {
      el.textContent = text;
      el.dispatchEvent(new Event('input', { bubbles: true }));
      return true;
    }
  },

  getComposerBox(inputEl) {
    if (!inputEl) return null;

    // 1. Direct form or search wrapper
    const form = inputEl.closest('form, [role="search"], [data-testid*="search" i]');
    if (form) return form;

    // 2. Ascend parents looking for the card container holding buttons
    let current = inputEl.parentElement;
    let best = null;
    while (current && current !== document.body && current !== document.documentElement) {
      const buttons = current.querySelectorAll('button:not(.tejasai-enhance-button), [role="button"]:not(.tejasai-enhance-button)');
      if (buttons.length >= 2) {
        const className = typeof current.className === 'string' ? current.className : '';
        const hasCardTraits =
          className.includes('rounded') ||
          className.includes('border') ||
          className.includes('bg-') ||
          className.includes('shadow') ||
          className.includes('relative') ||
          className.includes('flex-col') ||
          current.getAttribute('data-testid')?.includes('search');

        if (hasCardTraits) {
          return current;
        }
        if (!best) best = current;
      }
      current = current.parentElement;
    }

    return best || inputEl.closest('main') || inputEl.parentElement;
  },

  findSubmitButton(inputEl) {
    const el = inputEl || this.findInput();
    const box = el ? this.getComposerBox(el) : null;
    const scope = box || document.querySelector('main') || document;

    // 1. When user has entered text, submit/send button is present
    const submitSelectors = [
      'button[aria-label*="Submit" i]',
      'button[aria-label*="Send" i]',
      'button[aria-label*="Search" i]',
      'button[aria-label*="Ask" i]',
      'button[data-testid*="submit" i]',
      'button[data-testid*="send" i]',
      'button[data-testid*="search" i]',
      'button[type="submit"]',
      'button.bg-super',
    ];

    for (const sel of submitSelectors) {
      try {
        const btn = scope.querySelector(sel);
        if (btn && !btn.closest('header, nav, aside') && !btn.classList.contains('tejasai-enhance-button')) {
          return btn;
        }
      } catch {
        // Continue
      }
    }

    // 2. Empty-state circular voice/speech/waveform button on the far right
    const voiceSelectors = [
      'button[aria-label*="Voice" i]',
      'button[aria-label*="Audio" i]',
      'button[aria-label*="Dictat" i]',
      'button[aria-label*="Speech" i]',
      'button[data-testid*="voice" i]',
      'button[data-testid*="audio" i]',
    ];

    for (const sel of voiceSelectors) {
      try {
        const btn = scope.querySelector(sel);
        if (btn && !btn.closest('header, nav, aside') && !btn.classList.contains('tejasai-enhance-button')) {
          return btn;
        }
      } catch {
        // Continue
      }
    }

    // 3. Fallback: the last interactive button inside composer box
    if (box) {
      try {
        const allButtons = Array.from(
          box.querySelectorAll('button:not(.tejasai-enhance-button), [role="button"]:not(.tejasai-enhance-button)')
        ).filter((b) => {
          if (b.closest('header, nav, aside')) return false;
          if (b.contains(el)) return false;
          const rect = b.getBoundingClientRect();
          return rect.width > 0 && rect.height > 0;
        });

        if (allButtons.length >= 1) {
          return allButtons[allButtons.length - 1];
        }
      } catch {
        // Continue
      }
    }

    return null;
  },

  findAttachContainer(inputEl) {
    if (!inputEl) return null;
    const box = this.getComposerBox(inputEl);
    const submitBtn = this.findSubmitButton(inputEl);

    if (submitBtn && box) {
      // Ascend from submitBtn to find the horizontal row holding the action buttons (Model, Mic, Voice/Send)
      let current = submitBtn.parentElement;
      while (current && current !== box && current !== document.body) {
        const style = window.getComputedStyle(current);
        const isColumn = style.flexDirection.includes('column');
        if (isColumn) {
          current = current.parentElement;
          continue;
        }

        const rect = current.getBoundingClientRect();
        // If horizontal and wide enough for buttons
        if (rect.width > 45) {
          const btns = current.querySelectorAll('button:not(.tejasai-enhance-button), [role="button"]:not(.tejasai-enhance-button)');
          if (btns.length >= 1) {
            return current;
          }
        }
        current = current.parentElement;
      }

      if (submitBtn.parentElement) {
        return submitBtn.parentElement;
      }
    }

    // Fallback: search for bottom toolbar inside composer box
    if (box) {
      try {
        const flexRows = Array.from(box.querySelectorAll('div.flex:has(button)')).filter((d) => {
          const style = window.getComputedStyle(d);
          return !style.flexDirection.includes('column');
        });

        if (flexRows.length > 0) {
          const toolbar = flexRows[flexRows.length - 1];
          if (toolbar.children.length >= 2) {
            const rightCluster = toolbar.lastElementChild;
            if (rightCluster && rightCluster.querySelector('button')) {
              return rightCluster;
            }
          }
          return toolbar;
        }
      } catch {
        // Continue
      }
    }

    return box || inputEl.parentElement;
  },

  canAutoEnhance() {
    return true;
  },

  submitPrompt(inputEl, submitBtn) {
    if (submitBtn && !submitBtn.disabled && !submitBtn.getAttribute('aria-disabled')) {
      submitBtn.click();
      return true;
    }

    if (inputEl) {
      inputEl.focus();
      inputEl.dispatchEvent(new KeyboardEvent('keydown', {
        key: 'Enter',
        code: 'Enter',
        keyCode: 13,
        which: 13,
        bubbles: true,
      }));
      return true;
    }
    return false;
  },
};
