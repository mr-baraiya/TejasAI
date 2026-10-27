/**
 * TejasAI Antigravity UI Controller
 *
 * Implements interactive prompt enhancement, template generator,
 * favorites persistence, and live health status.
 */

import { DEVELOPER_TEMPLATES } from '../templates/devTemplates.js';

const LIVE_API_BASE_URL = 'https://tejasai-eta.vercel.app/api';

// State
let activeTab = 'tab-enhance';
let currentTweak = '';
let lastEnhancedPrompt = '';
let activeTemplateCategory = 'feature';
let activeTemplateId = 'feature-spec';

// DOM Elements
const statusPill = document.getElementById('connection-status');
const statusLabel = document.getElementById('status-label');
const rawPromptInput = document.getElementById('raw-prompt-input');
const charCount = document.getElementById('char-count');
const targetModelSelect = document.getElementById('target-model-select');
const tweakButtons = document.querySelectorAll('.ag-btn-pill');
const enhanceBtn = document.getElementById('enhance-btn');
const clearInputBtn = document.getElementById('clear-input-btn');
const enhancedOutputBox = document.getElementById('enhanced-output-box');
const whyBetterSection = document.getElementById('why-better-section');
const whyBetterList = document.getElementById('why-better-list');
const copyEnhancedBtn = document.getElementById('copy-enhanced-btn');
const copyAsAgentInstructionBtn = document.getElementById('copy-as-agent-instruction-btn');
const favCurrentBtn = document.getElementById('fav-current-btn');
const favBadge = document.getElementById('fav-badge');
const toastEl = document.getElementById('ag-toast');

// Templates Elements
const categoryChips = document.querySelectorAll('.ag-chip');
const templateSelect = document.getElementById('template-select');
const templateFieldsContainer = document.getElementById('template-fields-container');
const templateAssembleBtn = document.getElementById('template-assemble-btn');
const templateOutputArea = document.getElementById('template-output-area');
const copyTemplateOutputBtn = document.getElementById('copy-template-output-btn');
const sendToEnhancerBtn = document.getElementById('send-to-enhancer-btn');
const saveTemplateFavBtn = document.getElementById('save-template-fav-btn');

// Favorites Elements
const favoritesListContainer = document.getElementById('favorites-list-container');
const favSearchInput = document.getElementById('fav-search-input');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  setupTabs();
  setupEnhancer();
  setupTemplates();
  setupFavorites();
  checkApiHealth();
});

// Toast notification helper
let toastTimeout;
function showToast(message) {
  if (!toastEl) return;
  if (toastTimeout) clearTimeout(toastTimeout);
  toastEl.textContent = message;
  toastEl.style.display = 'block';
  toastTimeout = setTimeout(() => {
    toastEl.style.display = 'none';
  }, 2400);
}

// 1. Health Status
async function checkApiHealth() {
  try {
    const res = await fetch(`${LIVE_API_BASE_URL}/health`);
    const data = await res.json();
    if (res.ok && data.status === 'online') {
      statusPill.className = 'ag-status-pill online';
      const model = data.groqModel ? ` (${data.groqModel.split('/')[1] || data.groqModel})` : '';
      statusLabel.textContent = `Live API Online${model}`;
    } else {
      throw new Error('API Offline');
    }
  } catch (err) {
    statusPill.className = 'ag-status-pill offline';
    statusLabel.textContent = 'API Offline / Unreachable';
  }
}

// 2. Tab Navigation
function setupTabs() {
  const tabBtns = document.querySelectorAll('.ag-tab-btn');
  const tabPanels = document.querySelectorAll('.ag-tab-panel');

  tabBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      const target = btn.getAttribute('data-tab');
      tabBtns.forEach((b) => b.classList.remove('active'));
      tabPanels.forEach((p) => p.classList.remove('active'));

      btn.classList.add('active');
      document.getElementById(target)?.classList.add('active');
      activeTab = target;

      if (target === 'tab-favorites') {
        renderFavorites();
      }
    });
  });
}

// 3. Prompt Enhancer
function setupEnhancer() {
  rawPromptInput?.addEventListener('input', () => {
    const len = rawPromptInput.value.length;
    charCount.textContent = `${len} / 1500 chars`;
  });

  tweakButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const tweak = btn.getAttribute('data-tweak');
      if (currentTweak === tweak) {
        currentTweak = '';
        btn.classList.remove('active');
      } else {
        tweakButtons.forEach((b) => b.classList.remove('active'));
        currentTweak = tweak;
        btn.classList.add('active');
      }
    });
  });

  clearInputBtn?.addEventListener('click', () => {
    rawPromptInput.value = '';
    charCount.textContent = '0 / 1500 chars';
    enhancedOutputBox.innerHTML = '<p class="ag-placeholder-text">Enter your draft prompt and click "Enhance for Antigravity" to generate a production-ready specification.</p>';
    enhancedOutputBox.classList.add('empty');
    whyBetterSection.style.display = 'none';
    copyEnhancedBtn.disabled = true;
    copyAsAgentInstructionBtn.disabled = true;
    favCurrentBtn.style.display = 'none';
  });

  enhanceBtn?.addEventListener('click', async () => {
    const prompt = rawPromptInput.value.trim();
    if (!prompt || prompt.length < 3) {
      showToast('Please enter at least 3 characters.');
      rawPromptInput.focus();
      return;
    }

    enhanceBtn.disabled = true;
    enhanceBtn.innerHTML = `<span>Enhancing with Live AI...</span>`;

    try {
      const res = await fetch(`${LIVE_API_BASE_URL}/enhance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          targetAI: targetModelSelect.value || 'any',
          tweak: currentTweak,
          previousResult: lastEnhancedPrompt,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Enhancement failed.');
      }

      lastEnhancedPrompt = data.enhancedPrompt;
      enhancedOutputBox.classList.remove('empty');
      enhancedOutputBox.textContent = data.enhancedPrompt;

      // Render why better
      if (Array.isArray(data.whyBetter) && data.whyBetter.length > 0) {
        whyBetterList.innerHTML = data.whyBetter.map((item) => `<li>${escapeHtml(item)}</li>`).join('');
        whyBetterSection.style.display = 'block';
      } else {
        whyBetterSection.style.display = 'none';
      }

      copyEnhancedBtn.disabled = false;
      copyAsAgentInstructionBtn.disabled = false;
      favCurrentBtn.style.display = 'flex';
      showToast('Prompt enhanced successfully!');
    } catch (err) {
      showToast(`Error: ${err.message}`);
    } finally {
      enhanceBtn.disabled = false;
      enhanceBtn.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
        </svg>
        <span>Enhance for Antigravity</span>
      `;
    }
  });

  copyEnhancedBtn?.addEventListener('click', () => {
    if (!lastEnhancedPrompt) return;
    navigator.clipboard.writeText(lastEnhancedPrompt);
    showToast('Enhanced prompt copied to clipboard!');
  });

  copyAsAgentInstructionBtn?.addEventListener('click', () => {
    if (!lastEnhancedPrompt) return;
    const agentInstruction = `Act as an expert software architect and pair programmer in Antigravity.\n\nTask:\n${lastEnhancedPrompt}\n\nExecute this task with full type safety, minimal regressions, and comprehensive test coverage.`;
    navigator.clipboard.writeText(agentInstruction);
    showToast('Copied ready-to-run Vibe-Coding Prompt!');
  });

  favCurrentBtn?.addEventListener('click', () => {
    if (!lastEnhancedPrompt) return;
    saveToFavorites({
      title: rawPromptInput.value.slice(0, 40) + '...',
      prompt: lastEnhancedPrompt,
      category: 'enhanced',
    });
    showToast('Saved to Favorites!');
  });
}

// 4. Developer Templates
function setupTemplates() {
  categoryChips.forEach((chip) => {
    chip.addEventListener('click', () => {
      categoryChips.forEach((c) => c.classList.remove('active'));
      chip.classList.add('active');
      activeTemplateCategory = chip.getAttribute('data-cat');
      populateTemplateSelect();
    });
  });

  templateSelect?.addEventListener('change', () => {
    activeTemplateId = templateSelect.value;
    renderTemplateFields();
  });

  templateAssembleBtn?.addEventListener('click', async () => {
    const list = DEVELOPER_TEMPLATES[activeTemplateCategory] || [];
    const template = list.find((t) => t.id === activeTemplateId) || list[0];
    if (!template) return;

    const values = {};
    template.fields.forEach((f) => {
      const input = document.getElementById(`field-${f.id}`);
      values[f.id] = input?.value || '';
    });

    const assembledPrompt = template.buildPrompt(values);
    templateOutputArea.value = 'Enhancing developer prompt with Live AI...';
    templateAssembleBtn.disabled = true;

    try {
      const res = await fetch(`${LIVE_API_BASE_URL}/enhance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: assembledPrompt,
          targetAI: 'any',
        }),
      });

      const data = await res.json();
      if (res.ok && data.success && data.enhancedPrompt) {
        templateOutputArea.value = data.enhancedPrompt;
        showToast('Developer prompt assembled and enhanced!');
      } else {
        templateOutputArea.value = assembledPrompt;
        showToast('Assembled prompt (API fallback used).');
      }
    } catch {
      templateOutputArea.value = assembledPrompt;
      showToast('Assembled structured prompt.');
    } finally {
      templateAssembleBtn.disabled = false;
      copyTemplateOutputBtn.disabled = false;
    }
  });

  copyTemplateOutputBtn?.addEventListener('click', () => {
    const text = templateOutputArea.value;
    if (!text) return;
    navigator.clipboard.writeText(text);
    showToast('Developer prompt copied to clipboard!');
  });

  sendToEnhancerBtn?.addEventListener('click', () => {
    const text = templateOutputArea.value;
    if (!text) return;
    rawPromptInput.value = text;
    charCount.textContent = `${text.length} / 1500 chars`;
    document.querySelector('.ag-tab-btn[data-tab="tab-enhance"]')?.click();
    showToast('Loaded into Main Enhancer!');
  });

  saveTemplateFavBtn?.addEventListener('click', () => {
    const text = templateOutputArea.value;
    if (!text) return;
    saveToFavorites({
      title: `Template: ${activeTemplateId}`,
      prompt: text,
      category: activeTemplateCategory,
    });
    showToast('Saved template to Favorites!');
  });

  populateTemplateSelect();
}

function populateTemplateSelect() {
  const list = DEVELOPER_TEMPLATES[activeTemplateCategory] || [];
  templateSelect.innerHTML = list.map((t) => `<option value="${t.id}">${t.title}</option>`).join('');
  if (list.length > 0) {
    activeTemplateId = list[0].id;
    renderTemplateFields();
  }
}

function renderTemplateFields() {
  const list = DEVELOPER_TEMPLATES[activeTemplateCategory] || [];
  const template = list.find((t) => t.id === activeTemplateId) || list[0];
  if (!template) {
    templateFieldsContainer.innerHTML = '';
    return;
  }

  templateFieldsContainer.innerHTML = template.fields
    .map(
      (f) => `
    <div class="ag-field-group">
      <label class="ag-field-label" for="field-${f.id}">${f.label}</label>
      <input type="text" id="field-${f.id}" class="ag-input" placeholder="${f.placeholder || ''}" />
    </div>
  `
    )
    .join('');
}

// 5. Favorites System
function getLocalFavorites() {
  try {
    const raw = localStorage.getItem('tejasai_ag_favorites');
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function saveToFavorites({ title, prompt, category }) {
  const list = getLocalFavorites();
  list.unshift({
    id: `fav-${Date.now()}`,
    title,
    prompt,
    category,
    createdAt: new Date().toLocaleDateString(),
  });
  localStorage.setItem('tejasai_ag_favorites', JSON.stringify(list));
  updateFavBadge();
}

function updateFavBadge() {
  const list = getLocalFavorites();
  if (favBadge) favBadge.textContent = list.length;
}

function renderFavorites() {
  updateFavBadge();
  const list = getLocalFavorites();
  const query = favSearchInput?.value.toLowerCase() || '';

  const filtered = list.filter(
    (item) => item.title.toLowerCase().includes(query) || item.prompt.toLowerCase().includes(query)
  );

  if (filtered.length === 0) {
    favoritesListContainer.innerHTML = `
      <div style="text-align: center; padding: 40px; color: var(--ag-text-muted);">
        No saved favorite prompts found. Click "Save to Favorites" on any enhanced prompt to pin it here.
      </div>
    `;
    return;
  }

  favoritesListContainer.innerHTML = filtered
    .map(
      (item) => `
    <div class="ag-fav-item">
      <div>
        <div class="ag-fav-title">${escapeHtml(item.title)}</div>
        <div class="ag-fav-preview">${escapeHtml(item.prompt)}</div>
      </div>
      <div class="ag-fav-actions">
        <button type="button" class="ag-btn ag-btn-secondary ag-btn-sm" onclick="window.__loadFav('${item.id}')">
          Load
        </button>
        <button type="button" class="ag-btn ag-btn-secondary ag-btn-sm" onclick="window.__copyFav('${item.id}')">
          Copy
        </button>
        <button type="button" class="ag-btn-icon" title="Delete" onclick="window.__deleteFav('${item.id}')">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="3 6 5 6 21 6"/>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
          </svg>
        </button>
      </div>
    </div>
  `
    )
    .join('');
}

favSearchInput?.addEventListener('input', () => {
  renderFavorites();
});

// Window helper callbacks for favorite cards
window.__loadFav = (id) => {
  const list = getLocalFavorites();
  const item = list.find((i) => i.id === id);
  if (!item) return;
  rawPromptInput.value = item.prompt;
  charCount.textContent = `${item.prompt.length} / 1500 chars`;
  document.querySelector('.ag-tab-btn[data-tab="tab-enhance"]')?.click();
  showToast('Loaded favorite into Enhancer!');
};

window.__copyFav = (id) => {
  const list = getLocalFavorites();
  const item = list.find((i) => i.id === id);
  if (!item) return;
  navigator.clipboard.writeText(item.prompt);
  showToast('Favorite copied to clipboard!');
};

window.__deleteFav = (id) => {
  let list = getLocalFavorites();
  list = list.filter((i) => i.id !== id);
  localStorage.setItem('tejasai_ag_favorites', JSON.stringify(list));
  renderFavorites();
  showToast('Removed from favorites.');
};

function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
