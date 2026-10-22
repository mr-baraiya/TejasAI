/**
 * TejasAI Site Adapter - DeepSeek (chat.deepseek.com)
 *
 * Supports DeepSeek's modern textarea chat interface.
 */

window.TejasAIAdapters = window.TejasAIAdapters || {};

window.TejasAIAdapters['deepseek'] = {
  id: 'deepseek',
  name: 'DeepSeek',
  targetAI: 'deepseek',

  matches(hostname) {
    return hostname.includes('deepseek.com');
  },

  findInput() {
    const selectors = [
      'textarea#chat-input',
      'textarea[placeholder*="Send a message"]',
      'textarea[placeholder*="Message DeepSeek"]',
      'textarea[placeholder*="Ask anything"]',
      'textarea.ds-textarea',
      'textarea[tabindex="0"]',
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

    const parent = inputEl.closest('[class*="input-box"], [class*="chat-input"]') || inputEl.parentElement;
    const actions = parent?.querySelector('[class*="actions"], [class*="footer"], .flex.items-center');
    if (actions) return actions;

    return inputEl.parentElement;
  },

  findSubmitButton() {
    const selectors = [
      'div[role="button"][aria-label*="Send"]',
      'button[aria-label*="Send"]',
      '.chat-input-send-button',
      'div[class*="send-button"]',
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
