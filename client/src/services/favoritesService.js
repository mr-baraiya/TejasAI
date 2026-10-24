/**
 * TejasAI - Favorite Prompts Service (Website)
 *
 * Persists user's starred and saved prompts in localStorage.
 * Prepared for future multi-device or backend cloud synchronization.
 */

const STORAGE_KEY = 'tejasai_favorites';
export const FAVORITES_UPDATED_EVENT = 'tejasai-favorites-updated';

function notifyChange() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(FAVORITES_UPDATED_EVENT));
  }
}

/**
 * Normalizes text to compare prompt equality irrespective of trailing whitespace.
 */
function normalizePrompt(text) {
  return (text || '').trim().toLowerCase();
}

/**
 * Returns all saved favorites from localStorage.
 * @returns {Array<Object>}
 */
export function getFavorites() {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.warn('[Favorites] Failed to read from localStorage:', err);
    return [];
  }
}

/**
 * Checks if a prompt is already saved in favorites.
 * @param {string} promptText
 * @returns {boolean}
 */
export function isFavorite(promptText) {
  if (!promptText || !promptText.trim()) return false;
  const list = getFavorites();
  const normalized = normalizePrompt(promptText);
  return list.some((item) => normalizePrompt(item.prompt) === normalized);
}

/**
 * Finds a favorite item by exact prompt content.
 * @param {string} promptText
 * @returns {Object|null}
 */
export function getFavoriteByPrompt(promptText) {
  if (!promptText || !promptText.trim()) return null;
  const list = getFavorites();
  const normalized = normalizePrompt(promptText);
  return list.find((item) => normalizePrompt(item.prompt) === normalized) || null;
}

/**
 * Adds or updates a favorite prompt.
 *
 * @param {Object} item
 * @param {string} item.prompt - Prompt content
 * @param {string} [item.title] - Human-friendly title (auto-generated if omitted)
 * @param {string} [item.category='general'] - Template category (coding, education, writing, etc.)
 * @param {string[]} [item.whyBetter=[]] - Improvement points if enhanced
 * @param {string} [item.targetAI='any'] - Target engine
 * @param {string} [item.source='manual'] - 'builder' | 'enhancer' | 'manual'
 * @returns {Object} The saved item
 */
export function saveFavorite({
  id = null,
  title = '',
  prompt,
  category = 'general',
  whyBetter = [],
  targetAI = 'any',
  source = 'manual',
}) {
  if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
    throw new Error('Prompt text cannot be empty.');
  }

  const list = getFavorites();
  const trimmedPrompt = prompt.trim();

  // Generate fallback title from the first 5-8 words if empty
  const cleanTitle = (title && title.trim()) || generateTitle(trimmedPrompt);

  const existingIndex = id
    ? list.findIndex((f) => f.id === id)
    : list.findIndex((f) => normalizePrompt(f.prompt) === normalizePrompt(trimmedPrompt));

  const now = new Date().toISOString();

  let savedItem;
  if (existingIndex >= 0) {
    // Update existing
    savedItem = {
      ...list[existingIndex],
      title: cleanTitle,
      prompt: trimmedPrompt,
      category: category || list[existingIndex].category || 'general',
      whyBetter: whyBetter && whyBetter.length ? whyBetter : list[existingIndex].whyBetter || [],
      targetAI: targetAI || list[existingIndex].targetAI || 'any',
      updatedAt: now,
    };
    list[existingIndex] = savedItem;
  } else {
    // Insert new at the top
    savedItem = {
      id: id || `fav_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      title: cleanTitle,
      prompt: trimmedPrompt,
      category: category || 'general',
      whyBetter: whyBetter || [],
      targetAI: targetAI || 'any',
      source,
      createdAt: now,
      updatedAt: now,
    };
    list.unshift(savedItem);
  }

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    notifyChange();
  } catch (err) {
    console.error('[Favorites] Failed to save to localStorage:', err);
    throw new Error('Could not save favorite prompt. Storage may be full.');
  }

  return savedItem;
}

/**
 * Toggles favorite state for a given prompt: saves if missing, deletes if present.
 * @returns {{ isStarred: boolean, item?: Object }}
 */
export function toggleFavorite(data) {
  const existing = getFavoriteByPrompt(data.prompt);
  if (existing) {
    deleteFavorite(existing.id);
    return { isStarred: false };
  } else {
    const saved = saveFavorite(data);
    return { isStarred: true, item: saved };
  }
}

/**
 * Deletes a favorite by its ID.
 * @param {string} id
 * @returns {boolean}
 */
export function deleteFavorite(id) {
  if (!id) return false;
  const list = getFavorites();
  const filtered = list.filter((f) => f.id !== id);
  if (filtered.length === list.length) return false;

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    notifyChange();
    return true;
  } catch (err) {
    console.error('[Favorites] Failed to delete from localStorage:', err);
    return false;
  }
}

/**
 * Updates a specific favorite's title, prompt, or category.
 */
export function updateFavorite(id, updates = {}) {
  const list = getFavorites();
  const index = list.findIndex((f) => f.id === id);
  if (index === -1) return null;

  list[index] = {
    ...list[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    notifyChange();
    return list[index];
  } catch (err) {
    console.error('[Favorites] Update failed:', err);
    return null;
  }
}

/**
 * Searches and filters favorites by text query and category.
 * @param {string} query
 * @param {string} category - 'all' or specific category
 * @returns {Array<Object>}
 */
export function searchFavorites(query = '', category = 'all') {
  const list = getFavorites();
  const q = (query || '').toLowerCase().trim();
  const cat = (category || 'all').toLowerCase().trim();

  return list.filter((item) => {
    const matchesCategory = cat === 'all' || (item.category || 'general').toLowerCase() === cat;
    if (!matchesCategory) return false;

    if (!q) return true;

    const inTitle = (item.title || '').toLowerCase().includes(q);
    const inPrompt = (item.prompt || '').toLowerCase().includes(q);
    const inCategory = (item.category || '').toLowerCase().includes(q);

    return inTitle || inPrompt || inCategory;
  });
}

/**
 * Helper to generate a clean title from a prompt if user didn't specify one.
 */
function generateTitle(prompt) {
  if (!prompt) return 'Untitled Prompt';
  const clean = prompt
    .replace(/^["'#\s]+/, '')
    .replace(/[#*`]+/g, '')
    .trim();
  const firstLine = clean.split('\n')[0].trim();
  if (firstLine.length <= 48) return firstLine;
  return firstLine.slice(0, 48) + '...';
}
