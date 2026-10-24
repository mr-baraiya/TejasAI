/**
 * TejasAI Site Adapter - ChatGPT (chatgpt.com)
 *
 * Supports both traditional textarea and newer ProseMirror/Lexical contenteditable composers.
 * Dispatches proper synthetic React events to update application state.
 */

window.TejasAIAdapters = window.TejasAIAdapters || {};

window.TejasAIAdapters['chatgpt'] = {
  id: 'chatgpt',
  name: 'ChatGPT',
  targetAI: 'chatgpt',

  matches(hostname) {
    return hostname.includes('chatgpt.com');
  },

  findInput() {
    // Primary ChatGPT selector (stable across versions)
    const primary = document.querySelector('#prompt-textarea');
    if (primary) return primary;

    // Fallbacks for experimental or alternate interfaces
    const candidates = [
      'textarea[data-id="root"]',
      'div[contenteditable="true"][data-placeholder]',
      'form textarea[tabindex="0"]',
      'form div[contenteditable="true"][tabindex="0"]',
    ];

    for (const sel of candidates) {
      const el = document.querySelector(sel);
      if (el && !el.closest('[role="dialog"]') && el.offsetParent !== null) {
        return el;
      }
    }
    return null;
  },

  getText(el) {
    if (!el) return '';
    if (el.tagName === 'TEXTAREA' || el.tagName === 'INPUT') {
      return el.value ? el.value.trim() : '';
    }
    // ContentEditable handling
    return el.innerText ? el.innerText.trim() : (el.textContent ? el.textContent.trim() : '');
  },

  setText(el, text) {
    if (!el) return false;
    el.focus();

    if (el.tagName === 'TEXTAREA') {
      // React synthetic event setter
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

    // ContentEditable / ProseMirror
    try {
      // Select all text and replace using execCommand to preserve editor history
      const selection = window.getSelection();
      const range = document.createRange();
      range.selectNodeContents(el);
      selection.removeAllRanges();
      selection.addRange(range);

      const success = document.execCommand('insertText', false, text);
      if (success) {
        el.dispatchEvent(new Event('input', { bubbles: true }));
        return true;
      }
    } catch {
      // Fallback below
    }

    // Manual DOM paragraph creation
    el.innerHTML = '';
    const lines = text.split('\n');
    lines.forEach((line) => {
      const p = document.createElement('p');
      if (line.trim().length === 0) {
        p.appendChild(document.createElement('br'));
      } else {
        p.textContent = line;
      }
      el.appendChild(p);
    });

    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'insertText', data: text }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
    return true;
  },

  findAttachContainer(inputEl) {
    if (!inputEl) return null;
    const form = inputEl.closest('form') || inputEl.closest('[data-testid*="composer"]') || document.querySelector('form');

    // 1. Target the button row beside the send button
    const sendBtn = this.findSubmitButton();
    if (sendBtn && sendBtn.parentElement) {
      let cur = sendBtn.parentElement;
      while (cur && cur !== form && cur !== document.body) {
        const style = window.getComputedStyle(cur);
        const isRow = (style.display === 'flex' || style.display === 'inline-flex') && !style.flexDirection.includes('column');
        const rect = cur.getBoundingClientRect ? cur.getBoundingClientRect() : null;
        if (isRow && rect && rect.width > 50) {
          return cur;
        }
        cur = cur.parentElement;
      }
      return sendBtn.parentElement;
    }

    // 2. Trailing toolbar in the form
    if (form) {
      const toolbars = form.querySelectorAll(
        '.flex.items-center.gap-1, .flex.items-center.gap-2, [class*="trailing"], [class*="bottom"], [data-testid*="composer"]'
      );
      if (toolbars.length > 0) {
        return toolbars[toolbars.length - 1];
      }
    }

    // 3. Fallback to input parent
    return inputEl.parentElement;
  },

  findSubmitButton() {
    const selectors = [
      'button[data-testid="send-button"]',
      'button[data-testid="fruitjuice-send-button"]',
      'button[aria-label="Send prompt"]',
      'button[aria-label="Send message"]',
      'button[aria-label="Send"]',
      'button[data-testid="composer-speech-button"]',
      'button[data-testid*="speech" i]',
      'button[data-testid*="voice" i]',
      'button[aria-label*="voice" i]',
      'button[aria-label*="dictat" i]',
      'form button[type="submit"]',
    ];

    for (const sel of selectors) {
      try {
        const candidates = document.querySelectorAll(sel);
        for (const btn of candidates) {
          if (
            btn &&
            btn.offsetParent !== null &&
            !btn.closest('header, nav, aside') &&
            !btn.classList.contains('tejasai-enhance-button') &&
            !btn.classList.contains('tejasai-save-button')
          ) {
            return btn;
          }
        }
      } catch {
        // Continue
      }
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

    // Fallback: Dispatch Enter key event
    if (inputEl) {
      inputEl.focus();
      const enterDown = new KeyboardEvent('keydown', {
        key: 'Enter',
        code: 'Enter',
        keyCode: 13,
        which: 13,
        bubbles: true,
        cancelable: true,
      });
      inputEl.dispatchEvent(enterDown);
      return true;
    }
    return false;
  },
};
