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
      'textarea[placeholder*="Ask anything" i]',
      'textarea[placeholder*="Message DeepSeek" i]',
      'textarea[placeholder*="Send a message" i]',
      'textarea.ds-textarea',
      'textarea[tabindex="0"]',
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

    const box = inputEl.closest('div[class*="input-box"], div[class*="chat-input"], div[class*="container"], form') || document;

    // 2. Parent of DeepThink / Search toggle buttons
    const featureBtn = Array.from(box.querySelectorAll('div[role="button"], button')).find((b) =>
      b.textContent?.includes('DeepThink') || b.textContent?.includes('Search')
    );
    if (featureBtn && featureBtn.parentElement) {
      return featureBtn.parentElement;
    }

    // 3. Bottom action bar / footer
    const toolbarSelectors = [
      'div[class*="bottom"]',
      'div[class*="footer"]',
      'div[class*="actions"]',
      'div[class*="toolbar"]',
      'div.flex.items-center:last-child',
      'div[class*="buttons"]',
    ];

    for (const sel of toolbarSelectors) {
      const bar = box.querySelector(sel);
      if (bar && bar !== inputEl && bar.offsetParent !== null) return bar;
    }

    return inputEl.parentElement;
  },

  findSubmitButton() {
    const selectors = [
      'div[role="button"][aria-label*="Send" i]',
      'button[aria-label*="Send" i]',
      '.chat-input-send-button',
      'div[class*="send-button"]',
      'button[type="submit"]',
      'div[role="button"]:has(svg)',
      'button:has(svg)',
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
