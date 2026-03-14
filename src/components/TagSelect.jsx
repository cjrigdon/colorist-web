import React, { useState, useEffect, useRef } from 'react';
import { tagsAPI } from '../services/api';

/**
 * TagSelect - multi-select for inspiration tags.
 * value: array of { id?: number, tag: string }
 * onChange: (tags: { id?: number, tag: string }[]) => void
 */
const TagSelect = ({ value = [], onChange, placeholder = 'Add tags...', disabled }) => {
  const [knownTags, setKnownTags] = useState([]);
  const [loadingTags, setLoadingTags] = useState(true);
  const [inputValue, setInputValue] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    const fetchTags = async () => {
      try {
        setLoadingTags(true);
        const response = await tagsAPI.getAll();
        const list = Array.isArray(response) ? response : (response?.data ?? []);
        if (!cancelled) setKnownTags(list);
      } catch (err) {
        if (!cancelled) setKnownTags([]);
      } finally {
        if (!cancelled) setLoadingTags(false);
      }
    };
    fetchTags();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedTags = Array.isArray(value) ? value : [];
  const addTag = (tagObj) => {
    const tag = typeof tagObj === 'string' ? tagObj.trim().toLowerCase() : (tagObj?.tag ?? '').trim().toLowerCase();
    if (!tag) return;
    const already = selectedTags.some(t => (t.tag || '').toLowerCase() === tag);
    if (already) return;
    const known = knownTags.find(t => (t.tag || '').toLowerCase() === tag);
    const newTag = known ? { id: known.id, tag: known.tag } : { tag };
    onChange([...selectedTags, newTag]);
    setInputValue('');
    setShowSuggestions(false);
  };

  const removeTag = (index) => {
    const next = selectedTags.filter((_, i) => i !== index);
    onChange(next);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const v = inputValue.trim();
      if (v) addTag(v);
    }
    if (e.key === 'Backspace' && !inputValue && selectedTags.length > 0) {
      removeTag(selectedTags.length - 1);
    }
  };

  const suggestions = inputValue.trim()
    ? knownTags.filter(t => (t.tag || '').toLowerCase().includes(inputValue.trim().toLowerCase())
        && !selectedTags.some(s => (s.tag || '').toLowerCase() === (t.tag || '').toLowerCase()))
    : knownTags.filter(t => !selectedTags.some(s => s.id === t.id));

  return (
    <div ref={containerRef} className="relative">
      <label className="block text-sm font-medium text-slate-700 mb-2">Tags</label>
      <div
        className={`min-h-[42px] w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800 bg-white flex flex-wrap items-center gap-2 ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`}
        onClick={() => !disabled && inputRef.current?.focus()}
      >
        {selectedTags.map((t, i) => (
          <span
            key={t.id ? `id-${t.id}` : `name-${i}-${t.tag}`}
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-sm bg-slate-200 text-slate-700"
          >
            {t.tag}
            {!disabled && (
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); removeTag(i); }}
                className="hover:text-slate-900 leading-none"
                aria-label="Remove tag"
              >
                ×
              </button>
            )}
          </span>
        ))}
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={(e) => { setInputValue(e.target.value); setShowSuggestions(true); }}
          onFocus={() => setShowSuggestions(true)}
          onKeyDown={handleKeyDown}
          placeholder={selectedTags.length === 0 ? placeholder : ''}
          disabled={disabled}
          className="flex-1 min-w-[120px] outline-none border-0 bg-transparent py-1 text-sm"
        />
      </div>
      {showSuggestions && (suggestions.length > 0 || inputValue.trim()) && (
        <ul className="absolute z-10 mt-1 w-full max-h-48 overflow-auto rounded-lg border border-slate-200 bg-white shadow-lg py-1">
          {inputValue.trim() && (
            <li>
              <button
                type="button"
                className="w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-slate-100"
                onClick={() => addTag(inputValue.trim())}
              >
                Add &quot;{inputValue.trim()}&quot;
              </button>
            </li>
          )}
          {suggestions.slice(0, 15).map((t) => (
            <li key={t.id}>
              <button
                type="button"
                className="w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-slate-100"
                onClick={() => addTag({ id: t.id, tag: t.tag })}
              >
                {t.tag}
              </button>
            </li>
          ))}
        </ul>
      )}
      <p className="mt-1 text-xs text-slate-500">Select from the list or type a new tag and press Enter.</p>
    </div>
  );
};

export default TagSelect;
