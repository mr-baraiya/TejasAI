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

    // 1. If send button exists, attach beside it
    const sendBtn = this.findSubmitButton();
    if (sendBtn && sendBtn.parentElement) {
      return sendBtn.parentElement;
    }

    const root = inputEl.closest('div.input-area, div[class*="input-area"], .chat-window, main, form') || document.body;

    // 2. Look for bottom action toolbar / footer in Gemini
    const toolbarSelectors = [
      '.input-area-footer',
      'div[class*="bottom-bar"]',
      'div[class*="trailing-actions"]',
      'div[class*="bottom-row"]',
      'div[class*="actions-container"]',
      'div[class*="buttons-container"]',
      'div.action-buttons',
      'div[class*="leading-actions"]',
    ];

    for (const sel of toolbarSelectors) {
      const el = root.querySelector(sel);
      if (el && el.offsetParent !== null) return el;
    }

    // 3. Find parent of the microphone or Flash / tool buttons
    const micOrToolBtn = root.querySelector('button[aria-label*="mic" i], button[aria-label*="Microphone" i], button[aria-label*="Add files" i], button[aria-label*="Tools" i], button:has(mat-icon)');
    if (micOrToolBtn && micOrToolBtn.parentElement) {
      return micOrToolBtn.parentElement;
    }

    // 4. Safe fallback: find sibling toolbar of rich-textarea, not inside text line
    const host = inputEl.closest('rich-textarea') || inputEl.parentElement;
    const parentContainer = host?.parentElement;
    if (parentContainer) {
      const bottomToolbar = Array.from(parentContainer.children).find(
        (child) => child !== host && !child.contains(inputEl) && child.querySelector('button, [role="button"]')
      );
      if (bottomToolbar) return bottomToolbar;
    }

    return host?.parentElement || inputEl.parentElement;
  },

  findSubmitButton() {
    const selectors = [
      'button[aria-label*="Send message" i]',
      'button[aria-label*="Send prompt" i]',
      'button[aria-label*="Submit" i]',
      'button.send-button',
      'div[role="button"][aria-label*="Send" i]',
      'button:has(mat-icon[data-mat-icon-name="send"])',
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
