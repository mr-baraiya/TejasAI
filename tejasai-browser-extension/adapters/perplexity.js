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
      'textarea[placeholder*="Ask" i]',
      'textarea[placeholder*="Search" i]',
      'textarea[placeholder*="What do you want to know" i]',
      'textarea[placeholder*="question" i]',
      'textarea[placeholder*="follow-up" i]',
      'textarea.overflow-auto',
      '[data-testid="search-input"]',
      'div[contenteditable="true"]',
      'form textarea',
      'textarea',
    ];

    for (const sel of selectors) {
      const el = document.querySelector(sel);
      if (el && el.offsetParent !== null) return el;
    }
    return null;
  },

  getText(el) {
    if (!el) return '';
    return el.value ? el.value.trim() : (el.innerText ? el.innerText.trim() : '');
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

    // 1. Next to submit button
    const submitBtn = this.findSubmitButton();
    if (submitBtn && submitBtn.parentElement) {
      return submitBtn.parentElement;
    }

    // 2. Beside right-side control buttons (e.g. Model, mic)
    const box = inputEl.closest('div.relative, div[class*="border"], div[class*="rounded"], div[class*="box"], form') || document;
    const rightControls = box.querySelector('div.flex.items-center:has(button[aria-label*="mic" i], button[aria-label*="voice" i], button:has(svg))');
    if (rightControls && rightControls.offsetParent !== null) {
      return rightControls;
    }

    // 3. Search for the bottom controls bar
    const toolbarSelectors = [
      'div.flex.items-center.justify-between',
      'div.flex.items-center:last-child',
      'div[class*="bottom"]',
      '.flex.items-center.gap-x-1',
      '.flex.items-center.gap-x-2',
      'div.flex.items-center',
    ];

    for (const sel of toolbarSelectors) {
      const bar = box.querySelector(sel);
      if (bar && bar !== inputEl && bar.offsetParent !== null) return bar;
    }

    const anyBtn = box.querySelector('button');
    if (anyBtn && anyBtn.parentElement) return anyBtn.parentElement;

    return inputEl.parentElement;
  },

  findSubmitButton() {
    const selectors = [
      'button[aria-label*="Submit" i]',
      'button[aria-label*="Submit query" i]',
      'button[aria-label*="Search" i]',
      'button[aria-label*="Ask" i]',
      'button[aria-label*="Send" i]',
      'button.bg-super',
      'button[type="submit"]',
      'button:has(svg path)',
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
