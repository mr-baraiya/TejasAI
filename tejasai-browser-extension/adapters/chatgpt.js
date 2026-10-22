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
    const form = inputEl.closest('form');

    // 1. Target the button row beside the send button
    const sendBtn = this.findSubmitButton();
    if (sendBtn && sendBtn.parentElement) {
      return sendBtn.parentElement;
    }

    // 2. Trailing toolbar in the form
    if (form) {
      const toolbars = form.querySelectorAll('.flex.items-center.gap-1, .flex.items-center.gap-2, [class*="trailing"]');
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
      'form button[type="submit"]',
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
