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
    const root = inputEl
      ? inputEl.closest('div.input-area, div[class*="input-area"], .chat-window, main, form') || document.body
      : document.body;

    // Gemini's send button is the most reliable anchor — walk up to find
    // the *immediate* horizontal flex row that contains it (the bottom toolbar row).
    const sendBtn = this.findSubmitButton(inputEl);
    if (sendBtn) {
      // Walk up from send button to find first ancestor that is a flex/inline-flex row
      // with multiple button siblings (the actual bottom toolbar row).
      let cur = sendBtn.parentElement;
      while (cur && cur !== document.body && cur !== root) {
        const style = window.getComputedStyle(cur);
        const buttons = cur.querySelectorAll('button:not(.tejasai-enhance-button):not(.tejasai-save-button)');
        if (
          (style.display === 'flex' || style.display === 'inline-flex') &&
          style.flexDirection !== 'column' &&
          buttons.length >= 1
        ) {
          return cur;
        }
        cur = cur.parentElement;
      }
      // Fallback: direct parent of send button
      if (sendBtn.parentElement) return sendBtn.parentElement;
    }

    // Fallback: mic button parent
    const micBtn = root.querySelector(
      'button[aria-label*="mic" i], button[aria-label*="માઇક્રોફોન" i], button:has(mat-icon[data-mat-icon-name*="mic" i])'
    );
    if (micBtn && micBtn.parentElement) return micBtn.parentElement;

    // Static class selectors as last resort
    const toolbarSelectors = [
      'div[class*="bottom-row"]',
      'div[class*="trailing-actions"]',
      'div[class*="right-actions"]',
      '.input-area-footer',
      'div[class*="bottom-bar"]',
      'div[class*="actions-container"]',
    ];
    for (const sel of toolbarSelectors) {
      const el = root.querySelector(sel);
      if (el && el.offsetParent !== null) return el;
    }

    return inputEl?.parentElement || document.body;
  },

  findSubmitButton(inputEl) {
    const root = inputEl
      ? inputEl.closest('div.input-area, div[class*="input-area"], .chat-window, main, form') || document.body
      : document.body;

    // 1. Most reliable: button with upward arrow mat-icon (send/submit)
    const sendSelectors = [
      'button[aria-label*="Send message" i]',
      'button[aria-label*="Send prompt" i]',
      'button[aria-label*="Submit" i]',
      'button[aria-label*="સંદેશ" i]',
      'button[aria-label*="મોકલો" i]',
      'button[aria-label*="보내기" i]',
      'button[aria-label*="Envoyer" i]',
      'button.send-button',
      'button[data-test-id*="send" i]',
      'button:has(mat-icon[data-mat-icon-name*="send" i])',
      'button:has(mat-icon[fonticon*="send" i])',
      'button:has(svg path[d*="M2.01 21L23 12"])',
    ];

    for (const sel of sendSelectors) {
      try {
        const btn = root.querySelector(sel);
        if (btn && !btn.classList.contains('tejasai-enhance-button') && !btn.classList.contains('tejasai-save-button')) {
          const rect = btn.getBoundingClientRect();
          if (rect.width > 0 && rect.height > 0) return btn;
          if (btn.offsetParent !== null) return btn;
        }
      } catch {}
    }

    // 2. Find mic button, then find send as the next sibling button
    const micBtn = root.querySelector(
      'button[aria-label*="mic" i], button[aria-label*="માઇક્રોફોન" i], button:has(mat-icon[data-mat-icon-name*="mic" i])'
    );
    if (micBtn) {
      // Walk siblings after mic
      let sib = micBtn.nextElementSibling;
      while (sib) {
        if (sib.tagName === 'BUTTON' && !sib.classList.contains('tejasai-enhance-button') && !sib.classList.contains('tejasai-save-button')) return sib;
        const btn = sib.querySelector('button:not(.tejasai-enhance-button):not(.tejasai-save-button)');
        if (btn) return btn;
        sib = sib.nextElementSibling;
      }
    }

    // 3. Fallback: last visible button in trailing actions area
    const trailing = root.querySelector(
      'div.trailing-actions, div[class*="trailing-actions"], div[class*="bottom-bar"], div[class*="bottom-row"]'
    );
    if (trailing) {
      const buttons = Array.from(trailing.querySelectorAll('button:not(.tejasai-enhance-button):not(.tejasai-save-button)'));
      if (buttons.length > 0) return buttons[buttons.length - 1];
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
