/**
 * TejasAI Site Adapter - Google Gemini (gemini.google.com)
 *
 * Supports Gemini's Quill/Angular rich-textarea contenteditable editor.
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
      'div[contenteditable="true"][aria-label*="Enter a prompt"]',
      'div[contenteditable="true"][role="textbox"]',
    ];

    for (const sel of selectors) {
      const el = document.querySelector(sel);
      if (el && el.offsetParent !== null) return el;
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
    } catch {
      // Fallback
    }

    // Quill / Paragraph structure
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

    const sendBtn = this.findSubmitButton();
    if (sendBtn && sendBtn.parentElement) {
      return sendBtn.parentElement;
    }

    const host = inputEl.closest('rich-textarea') || inputEl.parentElement;
    return host?.parentElement || inputEl.parentElement;
  },

  findSubmitButton() {
    const selectors = [
      'button[aria-label*="Send message"]',
      'button[aria-label*="Send prompt"]',
      'button[aria-label*="Submit"]',
      'button.send-button',
      'div[role="button"][aria-label*="Send"]',
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
