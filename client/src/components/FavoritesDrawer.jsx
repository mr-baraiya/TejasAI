import React, { useState, useEffect } from 'react';
import { X, Download, Upload, Edit3, Trash2, Copy, Check } from 'lucide-react';
import {
  getFavorites,
  deleteFavorite,
  updateFavorite,
  saveFavorite,
  FAVORITES_UPDATED_EVENT,
} from '../services/favoritesService';

const CATEGORIES = [
  { id: 'all', label: 'All' },
  { id: 'coding', label: 'Coding' },
  { id: 'education', label: 'Education' },
  { id: 'writing', label: 'Writing' },
  { id: 'marketing', label: 'Marketing' },
  { id: 'research', label: 'Research' },
  { id: 'image', label: 'Image' },
  { id: 'general', label: 'General' },
];

export function FavoritesDrawer({ isOpen, onClose, onSelectPrompt, onShowToast }) {
  const [favorites, setFavorites] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [copiedId, setCopiedId] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [editPrompt, setEditPrompt] = useState('');
  const [expandedId, setExpandedId] = useState(null);

  // Sync favorites on open and whenever storage updates
  useEffect(() => {
    const load = () => {
      setFavorites(getFavorites());
    };
    load();

    window.addEventListener(FAVORITES_UPDATED_EVENT, load);
    window.addEventListener('storage', load);

    return () => {
      window.removeEventListener(FAVORITES_UPDATED_EVENT, load);
      window.removeEventListener('storage', load);
    };
  }, [isOpen]);

  // Handle escape key to close
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Filtered list
  const filteredFavorites = favorites.filter((item) => {
    const matchesCategory =
      activeCategory === 'all' || (item.category || 'general').toLowerCase() === activeCategory;
    if (!matchesCategory) return false;

    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    const inTitle = (item.title || '').toLowerCase().includes(q);
    const inPrompt = (item.prompt || '').toLowerCase().includes(q);
    const inCategory = (item.category || '').toLowerCase().includes(q);
    return inTitle || inPrompt || inCategory;
  });

  const handleCopy = async (item) => {
    try {
      await navigator.clipboard.writeText(item.prompt);
      setCopiedId(item.id);
      if (onShowToast) onShowToast('Prompt copied to clipboard!');
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      if (onShowToast) onShowToast('Failed to copy to clipboard.');
    }
  };

  const handleDelete = (id) => {
    const success = deleteFavorite(id);
    if (success && onShowToast) {
      onShowToast('Removed from favorites.');
    }
  };

  const handleStartEdit = (item) => {
    setEditingId(item.id);
    setEditTitle(item.title);
    setEditPrompt(item.prompt);
  };

  const handleSaveEdit = (id) => {
    if (!editPrompt.trim()) {
      if (onShowToast) onShowToast('Prompt content cannot be empty.');
      return;
    }
    const updated = updateFavorite(id, {
      title: editTitle.trim() || 'Untitled Prompt',
      prompt: editPrompt.trim(),
    });
    if (updated) {
      setEditingId(null);
      if (onShowToast) onShowToast('Favorite updated.');
    }
  };

  const handleUsePrompt = (item) => {
    if (onSelectPrompt) {
      onSelectPrompt(item.prompt);
    }
    onClose();
  };

  const handleExport = () => {
    try {
      const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(favorites, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', dataStr);
      downloadAnchor.setAttribute('download', `tejasai-favorites-${new Date().toISOString().slice(0, 10)}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      if (onShowToast) onShowToast('Exported favorites JSON file.');
    } catch {
      if (onShowToast) onShowToast('Export failed.');
    }
  };

  const handleImport = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const imported = JSON.parse(event.target?.result);
        if (Array.isArray(imported)) {
          let count = 0;
          imported.forEach((item) => {
            if (item && item.prompt) {
              saveFavorite({
                prompt: item.prompt,
                title: item.title || 'Imported Prompt',
                category: item.category || 'general',
                whyBetter: item.whyBetter || [],
                source: item.source || 'import',
              });
              count++;
            }
          });
          if (onShowToast) onShowToast(`Imported ${count} prompts successfully!`);
        } else {
          if (onShowToast) onShowToast('Invalid JSON file format.');
        }
      } catch {
        if (onShowToast) onShowToast('Failed to parse JSON file.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden" role="dialog" aria-modal="true">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/30 backdrop-blur-[1px] transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-0 sm:pl-10">
        <div className="w-full sm:w-screen sm:max-w-xl bg-[#FFFBF5] border-l border-[#EDE8E1] shadow-2xl flex flex-col h-full">
          {/* Drawer Header */}
          <div className="p-4 sm:p-6 border-b border-[#EDE8E1] bg-[#FFFFFF] flex items-center justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h2 className="font-serif text-base sm:text-lg font-semibold text-[#111827] truncate">
                  Favorite Prompts
                </h2>
                <span className="font-mono text-xs text-[#9CA3AF] shrink-0">
                  ({favorites.length})
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-[#6B7280] mt-0.5 truncate">
                Saved prompts in browser local storage
              </p>
            </div>

            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              <button
                type="button"
                onClick={handleExport}
                className="p-2 text-[#6B7280] hover:text-[#111827] transition-colors cursor-pointer"
                title="Export favorites to JSON file"
                aria-label="Export favorites"
              >
                <Download className="w-4 h-4" />
              </button>

              <label
                className="p-2 text-[#6B7280] hover:text-[#111827] transition-colors cursor-pointer"
                title="Import favorites from JSON file"
                aria-label="Import favorites"
              >
                <Upload className="w-4 h-4" />
                <input type="file" accept=".json" onChange={handleImport} className="hidden" />
              </label>

              <button
                type="button"
                onClick={onClose}
                className="p-2 text-[#6B7280] hover:text-[#111827] transition-colors cursor-pointer ml-0.5"
                aria-label="Close favorites drawer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Search & Category Filter Section */}
          <div className="p-4 sm:p-5 border-b border-[#EDE8E1] bg-[#FFFFFF] space-y-3 sm:space-y-4">
            {/* Search Input */}
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search saved prompts..."
                className="w-full text-xs sm:text-sm bg-[#FFFFFF] text-[#111827] border border-[#EDE8E1] px-3.5 py-2.5 rounded-none focus:outline-none focus:border-[#111827] transition-colors"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-2.5 text-xs text-[#9CA3AF] hover:text-[#111827] cursor-pointer"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Category Tab Bar (Clean editorial navigation, zero boxed buttons) */}
            <div className="flex items-center gap-4 sm:gap-5 overflow-x-auto no-scrollbar border-b border-[#EDE8E1] pb-px touch-pan-x">
              {CATEGORIES.map((cat) => {
                const isActive = activeCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setActiveCategory(cat.id)}
                    className={`pb-2 text-xs font-medium whitespace-nowrap transition-colors cursor-pointer border-b-2 -mb-px shrink-0 ${
                      isActive
                        ? 'border-[#111827] text-[#111827] font-semibold'
                        : 'border-transparent text-[#6B7280] hover:text-[#111827]'
                    }`}
                  >
                    {cat.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Favorites List */}
          <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">
            {filteredFavorites.length === 0 ? (
              <div className="py-20 text-center space-y-2">
                <h3 className="font-serif text-base font-semibold text-[#111827]">
                  {searchQuery || activeCategory !== 'all' ? 'No matching favorites found' : 'No favorite prompts yet'}
                </h3>
                <p className="text-xs text-[#6B7280] max-w-xs mx-auto leading-relaxed">
                  {searchQuery || activeCategory !== 'all'
                    ? 'Try clearing your search query or choosing a different category filter.'
                    : 'Click Favorite on any generated or enhanced prompt to save it here for instant access.'}
                </p>
              </div>
            ) : (
              filteredFavorites.map((item) => {
                const isEditing = editingId === item.id;
                const isExpanded = expandedId === item.id;
                const isCopied = copiedId === item.id;

                return (
                  <div
                    key={item.id}
                    className="bg-[#FFFFFF] border border-[#EDE8E1] p-4 sm:p-5 space-y-3 transition-colors"
                  >
                    {isEditing ? (
                      /* Inline Edit Mode */
                      <div className="space-y-3">
                        <input
                          type="text"
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          placeholder="Title"
                          className="w-full text-xs font-semibold bg-[#FFFFFF] text-[#111827] border border-[#111827] px-3 py-2 rounded-none focus:outline-none"
                        />
                        <textarea
                          rows={4}
                          value={editPrompt}
                          onChange={(e) => setEditPrompt(e.target.value)}
                          placeholder="Prompt text"
                          className="w-full text-xs bg-[#FFFFFF] text-[#111827] border border-[#EDE8E1] p-3 font-mono rounded-none focus:outline-none focus:border-[#111827]"
                        />
                        <div className="flex justify-end gap-3 pt-1">
                          <button
                            type="button"
                            onClick={() => setEditingId(null)}
                            className="text-xs text-[#6B7280] hover:text-[#111827] cursor-pointer"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSaveEdit(item.id)}
                            className="text-xs px-3 py-1.5 bg-[#111827] text-white font-medium cursor-pointer"
                          >
                            Save Changes
                          </button>
                        </div>
                      </div>
                    ) : (
                      /* Clean Editorial Display Mode (Zero nested box-in-box) */
                      <>
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="flex items-baseline gap-2 flex-wrap">
                              <h4 className="font-serif text-sm sm:text-base font-semibold text-[#111827]">
                                {item.title || 'Untitled Prompt'}
                              </h4>
                              <span className="font-mono text-[10px] text-[#C2410C] uppercase tracking-wider">
                                {item.category || 'General'}
                              </span>
                            </div>
                            <div className="text-[11px] text-[#9CA3AF] mt-0.5">
                              {new Date(item.updatedAt || item.createdAt).toLocaleDateString(undefined, {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                              })}
                            </div>
                          </div>

                          {/* Quick Edit/Delete Icon Actions */}
                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              type="button"
                              onClick={() => handleStartEdit(item)}
                              className="p-1.5 text-[#9CA3AF] hover:text-[#111827] transition-colors cursor-pointer"
                              title="Edit favorite"
                              aria-label="Edit favorite"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(item.id)}
                              className="p-1.5 text-[#9CA3AF] hover:text-[#DC2626] transition-colors cursor-pointer"
                              title="Delete favorite"
                              aria-label="Delete favorite"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Prompt Content (Single surface, zero nested box) */}
                        <div
                          onClick={() => setExpandedId(isExpanded ? null : item.id)}
                          className={`text-xs text-[#374151] font-mono cursor-pointer whitespace-pre-wrap leading-relaxed ${
                            isExpanded ? '' : 'line-clamp-3'
                          }`}
                          title="Click to expand/collapse"
                        >
                          {item.prompt}
                        </div>

                        {/* Bottom Actions Bar */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-2 border-t border-[#F3F4F6]">
                          <button
                            type="button"
                            onClick={() => setExpandedId(isExpanded ? null : item.id)}
                            className="text-[11px] text-[#6B7280] hover:text-[#111827] cursor-pointer text-left"
                          >
                            {isExpanded ? 'Collapse' : 'Expand full prompt'}
                          </button>

                          <div className="flex items-center gap-2 w-full sm:w-auto">
                            <button
                              type="button"
                              onClick={() => handleCopy(item)}
                              className="flex-1 sm:flex-none justify-center text-xs px-3 py-1.5 bg-[#FFFFFF] hover:bg-[#FAF8F5] text-[#374151] border border-[#EDE8E1] font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
                              title="Copy prompt"
                            >
                              {isCopied ? (
                                <>
                                  <Check className="w-3.5 h-3.5 text-[#16A34A]" />
                                  <span>Copied</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3.5 h-3.5 text-[#6B7280]" />
                                  <span>Copy</span>
                                </>
                              )}
                            </button>

                            <button
                              type="button"
                              onClick={() => handleUsePrompt(item)}
                              className="flex-1 sm:flex-none justify-center text-xs px-3.5 py-1.5 bg-[#111827] hover:bg-[#374151] text-white font-medium flex items-center gap-1 transition-colors cursor-pointer text-center"
                            >
                              <span>Use in Composer</span>
                              <span>&rarr;</span>
                            </button>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
