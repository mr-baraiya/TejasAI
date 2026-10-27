/**
 * TejasAI Favorites Service
 *
 * Persists favorite prompts and customized developer templates
 * locally so they can be reused across vibe-coding sessions.
 */

import fs from 'fs';
import path from 'path';
import os from 'os';

const STORAGE_DIR = path.join(os.homedir(), '.tejasai');
const FAVORITES_FILE = path.join(STORAGE_DIR, 'antigravity_favorites.json');

function ensureStorage() {
  try {
    if (!fs.existsSync(STORAGE_DIR)) {
      fs.mkdirSync(STORAGE_DIR, { recursive: true });
    }
    if (!fs.existsSync(FAVORITES_FILE)) {
      fs.writeFileSync(FAVORITES_FILE, JSON.stringify(getDefaultFavorites(), null, 2), 'utf8');
    }
  } catch {
    // fallback gracefully
  }
}

function getDefaultFavorites() {
  return [
    {
      id: 'fav-1',
      title: 'Type-Safe Express Router Implementation',
      category: 'codegen',
      prompt: 'Implement a type-safe Express router handling RESTful CRUD operations with Joi or Zod validation schemas, structured error middleware, and unit test assertions.',
      createdAt: new Date().toISOString(),
      tags: ['express', 'typescript', 'api'],
    },
    {
      id: 'fav-2',
      title: 'Isolate & Fix Async Memory Leak',
      category: 'debug',
      prompt: 'Analyze this Node.js service for event listener memory leaks and unhandled promise rejections. Provide a leak-proof refactor with deterministic cleanup.',
      createdAt: new Date().toISOString(),
      tags: ['node', 'memory-leak', 'performance'],
    },
  ];
}

export function listFavorites(searchQuery = '', category = '') {
  ensureStorage();
  try {
    const raw = fs.readFileSync(FAVORITES_FILE, 'utf8');
    let list = JSON.parse(raw);
    if (!Array.isArray(list)) list = [];

    if (category) {
      list = list.filter((item) => item.category === category);
    }

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (item) =>
          item.title?.toLowerCase().includes(q) ||
          item.prompt?.toLowerCase().includes(q) ||
          (Array.isArray(item.tags) && item.tags.some((t) => t.toLowerCase().includes(q)))
      );
    }

    return list;
  } catch {
    return getDefaultFavorites();
  }
}

export function saveFavorite({ title, prompt, category = 'custom', tags = [] }) {
  if (!prompt || !prompt.trim()) {
    throw new Error('Prompt content is required to save favorite.');
  }

  ensureStorage();
  const list = listFavorites();
  const newFav = {
    id: `fav-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    title: (title || prompt.slice(0, 40) + '...').trim(),
    category,
    prompt: prompt.trim(),
    createdAt: new Date().toISOString(),
    tags: Array.isArray(tags) ? tags : [],
  };

  list.unshift(newFav);

  try {
    fs.writeFileSync(FAVORITES_FILE, JSON.stringify(list, null, 2), 'utf8');
  } catch (err) {
    throw new Error(`Failed to save favorite: ${err.message}`);
  }

  return newFav;
}

export function deleteFavorite(id) {
  ensureStorage();
  let list = listFavorites();
  list = list.filter((item) => item.id !== id);
  try {
    fs.writeFileSync(FAVORITES_FILE, JSON.stringify(list, null, 2), 'utf8');
    return true;
  } catch (err) {
    throw new Error(`Failed to delete favorite: ${err.message}`);
  }
}
