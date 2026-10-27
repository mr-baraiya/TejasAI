/**
 * TejasAI VS Code Extension - Favorites Manager
 *
 * Persists user favorites and custom templates via VS Code globalState.
 */

const STORAGE_KEY = 'tejasai.favoritePrompts';

const DEFAULT_FAVORITES = [
  {
    id: 'fav-1',
    title: 'Type-Safe Express Router Implementation',
    prompt: 'Implement a type-safe Express router handling RESTful CRUD operations with validation schemas, structured error middleware, and unit test assertions.',
    category: 'codegen',
    createdAt: new Date().toLocaleDateString(),
  },
  {
    id: 'fav-2',
    title: 'Root-Cause Async Bug Diagnosis',
    prompt: 'Diagnose this asynchronous workflow for unhandled rejections, race conditions, and uncancelled promises. Provide a surgical fix with an AbortController.',
    category: 'debug',
    createdAt: new Date().toLocaleDateString(),
  },
];

class FavoritesManager {
  constructor(context) {
    this.context = context;
  }

  getFavorites() {
    if (!this.context) return DEFAULT_FAVORITES;
    const list = this.context.globalState.get(STORAGE_KEY, null);
    if (!list || !Array.isArray(list)) {
      this.context.globalState.update(STORAGE_KEY, DEFAULT_FAVORITES);
      return DEFAULT_FAVORITES;
    }
    return list;
  }

  saveFavorite({ title, prompt, category = 'custom' }) {
    if (!prompt || !prompt.trim()) {
      throw new Error('Prompt content is required.');
    }
    const list = this.getFavorites();
    const newFav = {
      id: `fav-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      title: (title || prompt.slice(0, 35) + '...').trim(),
      prompt: prompt.trim(),
      category,
      createdAt: new Date().toLocaleDateString(),
    };
    list.unshift(newFav);
    if (this.context) {
      this.context.globalState.update(STORAGE_KEY, list);
    }
    return newFav;
  }

  addFavorite(fav) {
    return this.saveFavorite(fav);
  }

  updateFavorite(id, { title, prompt, category }) {
    const list = this.getFavorites();
    const item = list.find((f) => f.id === id);
    if (!item) {
      throw new Error(`Favorite with id ${id} not found.`);
    }
    if (title && title.trim()) item.title = title.trim();
    if (prompt && prompt.trim()) item.prompt = prompt.trim();
    if (category) item.category = category;
    item.updatedAt = new Date().toLocaleDateString();

    if (this.context) {
      this.context.globalState.update(STORAGE_KEY, list);
    }
    return item;
  }

  deleteFavorite(id) {
    let list = this.getFavorites();
    list = list.filter((item) => item.id !== id);
    if (this.context) {
      this.context.globalState.update(STORAGE_KEY, list);
    }
    return list;
  }
}

module.exports = {
  FavoritesManager,
};
