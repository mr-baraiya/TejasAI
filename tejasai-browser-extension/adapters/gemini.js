/**
 * TejasAI Site Adapter - Google Gemini (gemini.google.com)
 *
 * Supports Gemini's Quill/Angular rich-textarea editor across all languages.
 * Positions the TejasAI button between the microphone and the upper arrow (send) button.
 */

window.TejasAIAdapters = window.TejasAIAdapters || {};

window.TejasAIAdapters['gemini'] = {
  id: 'gemini',
  name: 'Google Gemini',
  targetAI: 'gemini',

  matches(hostname) {
    return hostname.includes('gemini.google.com');
  },

  findInput() {
    const selectors = [
      'div.ql-editor[contenteditable="true"]',
      'rich-textarea div[contenteditable="true"]',
      'div[contenteditable="true"][aria-label*="Enter a prompt" i]',
      'div[contenteditable="true"][aria-label*="prompt" i]',
      'div[contenteditable="true"][role="textbox"]',
      'div[contenteditable="true"]',
    ];

    for (const sel of selectors) {
      try {
        const el = document.querySelector(sel);
        if (el && (el.offsetParent !== null || el.getBoundingClientRect().width > 0)) {
          return el;
        }
      } catch {}
    }
    return null;
  },

  getText(el) {
    if (!el) return '';
    if (el.tagName === 'TEXTAREA') return el.value.trim();
    return el.innerText ? el.innerText.trim() : (el.textContent ? el.textContent.trim() : '');
  },

  setText(el, text) {
    if (!el) return false;
    el.focus();

    try {
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
    } catch {}

    // Quill / Paragraph structure fallback
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
    const root = inputEl ? inputEl.closest('div.input-area, div[class*="input-area"], .chat-window, main, form') || document.body : document.body;

    const micBtn = root.querySelector('button[aria-label*="mic" i], button[aria-label*="માઇક્રોફોન" i], button:has(mat-icon[data-mat-icon-name*="mic" i])');
    const sendBtn = this.findSubmitButton(inputEl);

    // If both mic and send button share a common parent toolbar, return that container
    if (sendBtn && micBtn) {
      let current = sendBtn.parentElement;
      while (current && current !== document.body && current !== root) {
        if (current.contains(micBtn)) {
          return current;
        }
        current = current.parentElement;
      }
    }

    if (sendBtn && sendBtn.parentElement) {
      return sendBtn.parentElement;
    }

    if (micBtn && micBtn.parentElement) {
      return micBtn.parentElement;
    }

    const toolbarSelectors = [
      '.input-area-footer',
      'div[class*="trailing-actions"]',
      'div[class*="bottom-bar"]',
      'div[class*="right-actions"]',
      'div[class*="bottom-row"]',
      'div[class*="actions-container"]',
    ];

    for (const sel of toolbarSelectors) {
      const el = root.querySelector(sel);
      if (el && el.offsetParent !== null) return el;
    }

    return inputEl?.parentElement || document.body;
  },

  findSubmitButton(inputEl) {
    const root = inputEl ? inputEl.closest('div.input-area, div[class*="input-area"], .chat-window, main, form') || document.body : document.body;

    // 1. Language-independent: find microphone button first, then get the button immediately following it!
    const micBtn = root.querySelector('button[aria-label*="mic" i], button[aria-label*="માઇક્રોફોન" i], button:has(mat-icon[data-mat-icon-name*="mic" i])');
    if (micBtn && micBtn.parentElement) {
      const parent = micBtn.closest('div[class*="trailing"], div[class*="actions"], div.input-area-footer') || micBtn.parentElement;
      const buttons = Array.from(parent.querySelectorAll('button:not(.tejasai-enhance-button)'));
      const micIndex = buttons.indexOf(micBtn);
      if (micIndex !== -1 && buttons.length > micIndex + 1) {
        // Return the upper arrow / send button immediately following the microphone!
        return buttons[micIndex + 1];
      }
    }

    // 2. Class and attribute selectors across languages
    const selectors = [
      'button.send-button',
      'button[data-test-id*="send" i]',
      'button:has(mat-icon[data-mat-icon-name*="send" i])',
      'button:has(svg path[d*="M2.01 21L23 12"])',
      'button:has(svg path[d*="2.01 21"])',
      'button[aria-label*="Send message" i]',
      'button[aria-label*="Send prompt" i]',
      'button[aria-label*="Submit" i]',
      'button[aria-label*="સંદેશ" i]',
      'button[aria-label*="મોકલો" i]',
    ];

    for (const sel of selectors) {
      try {
        const btn = root.querySelector(sel);
        if (btn && !btn.classList.contains('tejasai-enhance-button')) {
          const rect = btn.getBoundingClientRect();
          if (rect.width > 0 && rect.height > 0) return btn;
          if (btn.offsetParent !== null) return btn;
        }
      } catch {}
    }

    // 3. Fallback: last button in trailing actions
    const trailing = root.querySelector('div.trailing-actions, div[class*="trailing-actions"], div[class*="bottom-bar"]');
    if (trailing) {
      const buttons = Array.from(trailing.querySelectorAll('button:not(.tejasai-enhance-button)'));
      if (buttons.length > 0) {
        return buttons[buttons.length - 1];
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
