/**
 * TejasAI Site Adapter - Perplexity AI (perplexity.ai)
 *
 * Supports Perplexity's React textarea search & follow-up inputs.
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
      'textarea[placeholder*="Ask anything"]',
      'textarea[placeholder*="Ask follow-up"]',
      'textarea[placeholder*="Ask a question"]',
      'textarea[placeholder*="Search or ask"]',
      'textarea.overflow-auto',
      '[data-testid="search-input"]',
      'form textarea',
    ];

    for (const sel of selectors) {
      const el = document.querySelector(sel);
      if (el && el.offsetParent !== null) return el;
    }
    return null;
  },

  getText(el) {
    if (!el) return '';
    return el.value ? el.value.trim() : '';
  },

  setText(el, text) {
    if (!el) return false;
    el.focus();

    // Standard React synthetic input setter
    const descriptor = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value');
    if (descriptor && descriptor.set) {
      descriptor.set.call(el, text);
    } else {
      el.value = text;
    }

    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
    return true;
  },

  findAttachContainer(inputEl) {
    if (!inputEl) return null;

    const submitBtn = this.findSubmitButton();
    if (submitBtn && submitBtn.parentElement) {
      return submitBtn.parentElement;
    }

    const form = inputEl.closest('form');
    if (form) {
      const actions = form.querySelector('.flex.items-center.gap-x-1, .flex.items-center.gap-x-2, .flex.items-center');
      if (actions) return actions;
    }

    return inputEl.parentElement;
  },

  findSubmitButton() {
    const selectors = [
      'button[aria-label="Submit"]',
      'button[aria-label="Submit query"]',
      'button[aria-label*="Search"]',
      'button[type="submit"]',
    ];

    for (const sel of selectors) {
      const btn = document.querySelector(sel);
      if (btn && btn.offsetParent !== null) return btn;
    }
    return null;
  },

  canAutoEnhance() {
    return true;
  },

  submitPrompt(inputEl, submitBtn) {
    if (submitBtn && !submitBtn.disabled) {
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
