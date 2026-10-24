/**
 * TejasAI Browser Extension - Popup Script
 *
 * Coordinates:
 * 1. Global Extension Settings & Provider Toggles
 * 2. Compact Dynamic Prompt Builder (6 Templates)
 * 3. Local Favorites Manager (chrome.storage.local)
 * 4. Active Tab Insertion & Backend Health Checks
 */

import { EXTENSION_TEMPLATES } from './promptTemplates.js';
import { enhancePromptApi, DEFAULT_API_BASE_URL } from './api.js';

document.addEventListener('DOMContentLoaded', async () => {
  // DOM Elements - Tabs
  const tabButtons = document.querySelectorAll('.tab-btn');
  const tabPanes = document.querySelectorAll('.tab-pane');
  const favCountBadge = document.getElementById('fav-count-badge');
  const popupToast = document.getElementById('popup-toast');

  // DOM Elements - Settings (Tab 1)
  const masterToggle = document.getElementById('master-toggle');
  const autoReplaceToggle = document.getElementById('auto-replace-toggle');
  const siteToggles = document.querySelectorAll('.site-toggle');
  const statusBar = document.getElementById('status-bar');
  const statusText = document.getElementById('status-text');

  // DOM Elements - Builder (Tab 2)
  const builderCategorySelect = document.getElementById('builder-category');
  const builderLoadPresetBtn = document.getElementById('builder-load-preset');
  const builderFieldsContainer = document.getElementById('builder-fields-container');
  const builderOutputPrompt = document.getElementById('builder-output-prompt');
  const builderStats = document.getElementById('builder-stats');
  const builderWhyBetter = document.getElementById('builder-why-better');
  const builderEnhanceBtn = document.getElementById('builder-enhance-btn');
  const builderInsertBtn = document.getElementById('builder-insert-btn');
  const builderCopyBtn = document.getElementById('builder-copy-btn');
  const builderFavBtn = document.getElementById('builder-fav-btn');

  // DOM Elements - Favorites (Tab 3)
  const favSearchInput = document.getElementById('fav-search-input');
  const favClearSearch = document.getElementById('fav-clear-search');
  const favCategoryChips = document.getElementById('fav-category-chips');
  const favListContainer = document.getElementById('fav-list-container');

  let toastTimer = null;
  function showToast(message) {
    if (!popupToast) return;
    if (toastTimer) clearTimeout(toastTimer);
    popupToast.textContent = message;
    popupToast.style.display = 'block';
    toastTimer = setTimeout(() => {
      popupToast.style.display = 'none';
    }, 2200);
  }

  // ---------------------------------------------------------------------------
  // 1. Tab Navigation System
  // ---------------------------------------------------------------------------
  tabButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const targetId = btn.getAttribute('data-tab');
      tabButtons.forEach((b) => b.classList.remove('active'));
      tabPanes.forEach((p) => p.classList.remove('active'));

      btn.classList.add('active');
      const activePane = document.getElementById(targetId);
      if (activePane) activePane.classList.add('active');

      if (targetId === 'tab-favorites') {
        renderFavorites();
      }
    });
  });

  // ---------------------------------------------------------------------------
  // 2. Settings System (Sync Storage)
  // ---------------------------------------------------------------------------
  let currentSettings = {
    enabled: true,
    autoReplace: false,
    sites: {
      chatgpt: true,
      gemini: true,
      perplexity: true,
      deepseek: true,
      claude: true,
      grok: true,
    },
  };

  chrome.runtime.sendMessage({ action: 'GET_SETTINGS' }, (settings) => {
    if (settings) {
      currentSettings = settings;
      if (masterToggle) masterToggle.checked = Boolean(settings.enabled);
      if (autoReplaceToggle) autoReplaceToggle.checked = Boolean(settings.autoReplace);

      siteToggles.forEach((checkbox) => {
        const siteKey = checkbox.getAttribute('data-site');
        checkbox.checked = settings.sites?.[siteKey] !== false;
      });
    }
  });

  chrome.runtime.sendMessage({ action: 'CHECK_HEALTH' }, (health) => {
    if (!statusBar || !statusText) return;
    statusBar.classList.remove('status-checking');

    if (health && health.status === 'online') {
      statusBar.classList.add('status-online');
      const model = health.groqModel ? ` (${health.groqModel.split('/')[1] || health.groqModel})` : '';
      statusText.textContent = `Connected to TejasAI${model}`;
    } else {
      statusBar.classList.add('status-offline');
      statusText.textContent = 'Backend offline or unreachable';
    }
  });

  function persistSettings() {
    chrome.runtime.sendMessage({
      action: 'SAVE_SETTINGS',
      payload: currentSettings,
    });
    try {
      chrome.storage.local.set({ tejasai_settings: currentSettings });
      chrome.storage.sync.set({ tejasai_settings: currentSettings });
    } catch {
      // ignore
    }
  }

  if (masterToggle) {
    masterToggle.addEventListener('change', (e) => {
      currentSettings.enabled = e.target.checked;
      persistSettings();
    });
  }

  if (autoReplaceToggle) {
    autoReplaceToggle.addEventListener('change', (e) => {
      currentSettings.autoReplace = e.target.checked;
      persistSettings();
    });
  }

  siteToggles.forEach((checkbox) => {
    checkbox.addEventListener('change', (e) => {
      const siteKey = e.target.getAttribute('data-site');
      if (!currentSettings.sites) currentSettings.sites = {};
      currentSettings.sites[siteKey] = e.target.checked;
      persistSettings();
    });
  });

  // ---------------------------------------------------------------------------
  // 3. Compact Dynamic Prompt Builder (Tab 2)
  // ---------------------------------------------------------------------------
  let activeTemplateId = 'coding';
  const builderValues = {};

  // Initialize defaults
  EXTENSION_TEMPLATES.forEach((tpl) => {
    builderValues[tpl.id] = {};
    tpl.fields.forEach((f) => {
      builderValues[tpl.id][f.id] = f.defaultValue || '';
    });
  });

  function getActiveTemplate() {
    return EXTENSION_TEMPLATES.find((t) => t.id === activeTemplateId) || EXTENSION_TEMPLATES[0];
  }

  function renderBuilderFields() {
    if (!builderFieldsContainer) return;
    const tpl = getActiveTemplate();
    const vals = builderValues[tpl.id] || {};

    builderFieldsContainer.innerHTML = '';

    tpl.fields.forEach((field) => {
      const group = document.createElement('div');
      group.className = 'form-group';

      const label = document.createElement('label');
      label.className = 'field-label';
      label.textContent = field.label;
      group.appendChild(label);

      if (field.type === 'select') {
        const select = document.createElement('select');
        select.className = 'compact-select';
        field.options.forEach((opt) => {
          const option = document.createElement('option');
          option.value = opt;
          option.textContent = opt;
          if (opt === vals[field.id]) option.selected = true;
          select.appendChild(option);
        });
        select.addEventListener('change', (e) => {
          vals[field.id] = e.target.value;
          updateBuilderPrompt();
        });
        group.appendChild(select);
      } else if (field.type === 'textarea') {
        const textarea = document.createElement('textarea');
        textarea.className = 'compact-textarea';
        textarea.rows = 2;
        textarea.placeholder = field.placeholder || '';
        textarea.value = vals[field.id] || '';
        textarea.addEventListener('input', (e) => {
          vals[field.id] = e.target.value;
          updateBuilderPrompt();
        });
        group.appendChild(textarea);
      } else {
        const input = document.createElement('input');
        input.type = 'text';
        input.className = 'compact-input';
        input.placeholder = field.placeholder || '';
        input.value = vals[field.id] || '';
        input.addEventListener('input', (e) => {
          vals[field.id] = e.target.value;
          updateBuilderPrompt();
        });
        group.appendChild(input);
      }

      builderFieldsContainer.appendChild(group);
    });

    updateBuilderPrompt();
  }

  function updateBuilderPrompt() {
    if (!builderOutputPrompt) return;
    const tpl = getActiveTemplate();
    const vals = builderValues[tpl.id] || {};
    const generated = tpl.buildPrompt(vals);
    builderOutputPrompt.value = generated;

    if (builderWhyBetter) builderWhyBetter.style.display = 'none';

    updatePromptStats(generated);
  }

  function updatePromptStats(text) {
    if (!builderStats) return;
    const words = text.trim() ? text.trim().split(/\s+/).length : 0;
    builderStats.textContent = `${words} words`;
  }

  if (builderCategorySelect) {
    builderCategorySelect.addEventListener('change', (e) => {
      activeTemplateId = e.target.value;
      renderBuilderFields();
    });
  }

  if (builderLoadPresetBtn) {
    builderLoadPresetBtn.addEventListener('click', () => {
      const tpl = getActiveTemplate();
      if (tpl.examples && tpl.examples[0]) {
        builderValues[tpl.id] = { ...tpl.examples[0].values };
        renderBuilderFields();
        showToast(`Loaded sample: ${tpl.examples[0].name}`);
      }
    });
  }

  if (builderOutputPrompt) {
    builderOutputPrompt.addEventListener('input', (e) => {
      updatePromptStats(e.target.value);
    });
  }

  // Builder Action: Copy
  if (builderCopyBtn) {
    builderCopyBtn.addEventListener('click', async () => {
      const text = builderOutputPrompt?.value || '';
      if (!text.trim()) return;
      try {
        await navigator.clipboard.writeText(text);
        showToast('Prompt copied to clipboard!');
      } catch {
        showToast('Failed to copy.');
      }
    });
  }

  // Builder Action: Save to Favorites
  if (builderFavBtn) {
    builderFavBtn.addEventListener('click', async () => {
      const text = builderOutputPrompt?.value || '';
      if (!text.trim()) return;
      const tpl = getActiveTemplate();
      await addFavorite({
        title: `${tpl.name} Prompt`,
        prompt: text.trim(),
        category: tpl.id,
        source: 'builder',
      });
      showToast('Saved to Favorites');
    });
  }

  // Builder Action: Enhance with AI
  if (builderEnhanceBtn) {
    builderEnhanceBtn.addEventListener('click', async () => {
      const text = builderOutputPrompt?.value || '';
      if (!text.trim()) return;

      builderEnhanceBtn.disabled = true;
      builderEnhanceBtn.innerHTML = '<span>Enhancing...</span>';

      try {
        const response = await enhancePromptApi({
          prompt: text.trim(),
          targetAI: 'any',
        });

        if (response && response.success && response.enhancedPrompt) {
          builderOutputPrompt.value = response.enhancedPrompt;
          updatePromptStats(response.enhancedPrompt);

          if (builderWhyBetter && response.whyBetter && response.whyBetter.length > 0) {
            builderWhyBetter.innerHTML = `<strong>Why Better:</strong> ${response.whyBetter.join(' • ')}`;
            builderWhyBetter.style.display = 'block';
          }
          showToast('Enhanced with TejasAI!');
        } else {
          showToast(response?.error || 'Enhancement failed.');
        }
      } catch (err) {
        showToast(err.message || 'Error calling AI service.');
      } finally {
        builderEnhanceBtn.disabled = false;
        builderEnhanceBtn.innerHTML = '<span>Enhance</span>';
      }
    });
  }

  // Builder Action: Insert into Active Tab Chat
  if (builderInsertBtn) {
    builderInsertBtn.addEventListener('click', () => {
      const text = builderOutputPrompt?.value || '';
      if (!text.trim()) return;
      insertPromptIntoActiveTab(text);
    });
  }

  // Initial render of builder
  renderBuilderFields();

  // ---------------------------------------------------------------------------
  // 4. Favorites System (Local Storage: chrome.storage.local)
  // ---------------------------------------------------------------------------
  let activeFavCategory = 'all';
  let favFilterQuery = '';

  async function getStoredFavorites() {
    try {
      const data = await chrome.storage.local.get('tejasai_favorites');
      return Array.isArray(data.tejasai_favorites) ? data.tejasai_favorites : [];
    } catch {
      return [];
    }
  }

  async function setStoredFavorites(favs) {
    try {
      await chrome.storage.local.set({ tejasai_favorites: favs });
      updateFavBadge(favs.length);
    } catch (err) {
      console.error('[Favorites] Save failed:', err);
    }
  }

  async function addFavorite({ title, prompt, category = 'general', source = 'manual' }) {
    const list = await getStoredFavorites();
    const existingIdx = list.findIndex((f) => f.prompt.trim() === prompt.trim());

    const item = {
      id: `fav_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      title: title || prompt.split('\n')[0].slice(0, 35) || 'Untitled Prompt',
      prompt: prompt.trim(),
      category: category || 'general',
      source,
      createdAt: new Date().toISOString(),
    };

    if (existingIdx >= 0) {
      list[existingIdx] = { ...list[existingIdx], ...item, updatedAt: new Date().toISOString() };
    } else {
      list.unshift(item);
    }

    await setStoredFavorites(list);
    renderFavorites();
    return item;
  }

  async function deleteFavoriteItem(id) {
    const list = await getStoredFavorites();
    const filtered = list.filter((f) => f.id !== id);
    await setStoredFavorites(filtered);
    renderFavorites();
    showToast('Removed from favorites.');
  }

  function updateFavBadge(count) {
    if (!favCountBadge) return;
    if (count > 0) {
      favCountBadge.textContent = String(count);
      favCountBadge.style.display = 'inline-block';
    } else {
      favCountBadge.style.display = 'none';
    }
  }

  // Search input handler
  if (favSearchInput) {
    favSearchInput.addEventListener('input', (e) => {
      favFilterQuery = e.target.value.toLowerCase().trim();
      if (favClearSearch) {
        favClearSearch.style.display = favFilterQuery ? 'block' : 'none';
      }
      renderFavorites();
    });
  }

  if (favClearSearch) {
    favClearSearch.addEventListener('click', () => {
      favSearchInput.value = '';
      favFilterQuery = '';
      favClearSearch.style.display = 'none';
      renderFavorites();
    });
  }

  // Category filter chips
  if (favCategoryChips) {
    favCategoryChips.querySelectorAll('.chip').forEach((chip) => {
      chip.addEventListener('click', () => {
        favCategoryChips.querySelectorAll('.chip').forEach((c) => c.classList.remove('active'));
        chip.classList.add('active');
        activeFavCategory = chip.getAttribute('data-cat');
        renderFavorites();
      });
    });
  }

  async function renderFavorites() {
    if (!favListContainer) return;
    const all = await getStoredFavorites();
    updateFavBadge(all.length);

    const filtered = all.filter((item) => {
      const matchCat = activeFavCategory === 'all' || (item.category || 'general').toLowerCase() === activeFavCategory;
      if (!matchCat) return false;

      if (!favFilterQuery) return true;
      const inTitle = (item.title || '').toLowerCase().includes(favFilterQuery);
      const inPrompt = (item.prompt || '').toLowerCase().includes(favFilterQuery);
      return inTitle || inPrompt;
    });

    if (filtered.length === 0) {
      favListContainer.innerHTML = `
        <div class="empty-fav-message">
          ${all.length === 0
            ? 'No saved favorites yet.<br>Save prompts in the Builder or Enhance dialog to access them here.'
            : 'No favorites match your search or filter.'}
        </div>
      `;
      return;
    }

    favListContainer.innerHTML = '';

    filtered.forEach((item) => {
      const card = document.createElement('div');
      card.className = 'fav-card';

      card.innerHTML = `
        <div class="fav-header-row">
          <span class="fav-title" title="${escapeHtml(item.title)}">${escapeHtml(item.title)}</span>
          <span class="fav-category-tag">${escapeHtml(item.category || 'general')}</span>
        </div>
        <div class="fav-prompt-snippet" title="Click to expand/collapse">${escapeHtml(item.prompt)}</div>
        <div class="fav-actions-row">
          <button type="button" class="fav-btn fav-btn-copy" title="Copy to clipboard" aria-label="Copy prompt">
            <svg class="fav-icon" viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
            </svg>
          </button>
          <button type="button" class="fav-btn fav-btn-insert" title="Insert into active AI chat" aria-label="Insert prompt into chat">
            <svg class="fav-icon" viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="15 14 20 9 15 4"></polyline>
              <path d="M4 20v-7a4 4 0 0 1 4-4h12"></path>
            </svg>
          </button>
          <button type="button" class="fav-btn fav-btn-danger" title="Delete favorite" aria-label="Delete favorite">
            <svg class="fav-icon" viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="3 6 5 6 21 6"></polyline>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
              <line x1="10" y1="11" x2="10" y2="17"></line>
              <line x1="14" y1="11" x2="14" y2="17"></line>
            </svg>
          </button>
        </div>
      `;

      // Expand / Collapse snippet
      const snippet = card.querySelector('.fav-prompt-snippet');
      snippet.addEventListener('click', () => {
        snippet.classList.toggle('expanded');
      });

      // Copy Action
      const copyBtn = card.querySelector('.fav-btn-copy');
      copyBtn.addEventListener('click', async () => {
        try {
          await navigator.clipboard.writeText(item.prompt);
          copyBtn.innerHTML = `
            <svg class="fav-icon" viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="#16A34A" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
          `;
          showToast('Copied to clipboard!');
          setTimeout(() => {
            if (copyBtn) {
              copyBtn.innerHTML = `
                <svg class="fav-icon" viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                </svg>
              `;
            }
          }, 1500);
        } catch {
          showToast('Failed to copy.');
        }
      });

      // Insert Action
      card.querySelector('.fav-btn-insert').addEventListener('click', () => {
        insertPromptIntoActiveTab(item.prompt);
      });

      // Delete Action
      card.querySelector('.fav-btn-danger').addEventListener('click', () => {
        deleteFavoriteItem(item.id);
      });

      favListContainer.appendChild(card);
    });
  }

  // ---------------------------------------------------------------------------
  // 5. Helper: Insert Prompt into Active AI Composer
  // ---------------------------------------------------------------------------
  function insertPromptIntoActiveTab(promptText) {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (!tabs || !tabs[0] || !tabs[0].id) {
        showToast('No active tab found.');
        return;
      }

      chrome.tabs.sendMessage(
        tabs[0].id,
        { action: 'INSERT_PROMPT', payload: { prompt: promptText } },
        (res) => {
          if (chrome.runtime.lastError || !res?.success) {
            showToast('Open ChatGPT, Gemini, or Claude to insert.');
          } else {
            showToast('Inserted into AI chat! 🚀');
          }
        }
      );
    });
  }

  function escapeHtml(str) {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // Initial favorites count badge
  getStoredFavorites().then((favs) => updateFavBadge(favs.length));
});
