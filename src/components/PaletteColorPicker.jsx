import React, { useState } from 'react';
import { MAX_PALETTE_COLORS, normalizeHex } from '../utils/colorUtils';

const stripHex = (hex) => (hex || '').replace(/^#/, '').toUpperCase();

// 3-digit hex needs a leading # so names like "bed" or "fab" are searched as names
const parseHexQuery = (term) => {
  const value = term.trim();
  if (/^#?[0-9a-f]{6}$/i.test(value) || /^#[0-9a-f]{3}$/i.test(value)) {
    return normalizeHex(value);
  }
  return null;
};

const PaletteColorPicker = ({
  availableColors,
  loadingColors,
  selectedColors,
  onSelectedColorsChange,
  customColors,
  onCustomColorsChange,
  maxColors = MAX_PALETTE_COLORS,
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const selectedIds = new Set(selectedColors.map((color) => color.id));
  const totalCount = selectedColors.length + customColors.length;
  const atLimit = totalCount >= maxColors;
  const hexQuery = parseHexQuery(searchTerm);
  const searchLower = searchTerm.trim().toLowerCase();
  const searchHexFragment = stripHex(searchTerm.trim());

  const filteredColors = availableColors.filter((color) => {
    if (!searchLower) return true;
    if (hexQuery) return stripHex(color.hex) === stripHex(hexQuery);
    return (
      color.name?.toLowerCase().includes(searchLower) ||
      (searchHexFragment && stripHex(color.hex).includes(searchHexFragment))
    );
  });

  const showAddHex = hexQuery && filteredColors.length === 0;
  const hexAlreadyAdded = hexQuery && customColors.includes(hexQuery);

  const toggleColor = (color) => {
    if (selectedIds.has(color.id)) {
      onSelectedColorsChange(selectedColors.filter((c) => c.id !== color.id));
    } else if (!atLimit) {
      onSelectedColorsChange([...selectedColors, color]);
    }
  };

  const addHexColor = () => {
    if (!hexQuery || hexAlreadyAdded || atLimit) return;
    onCustomColorsChange([...customColors, hexQuery]);
    setSearchTerm('');
  };

  const removeIcon = (
    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  );

  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-2">
        Colors (up to {maxColors}) *
      </label>

      {totalCount > 0 ? (
        <div className="flex h-16 rounded-lg overflow-hidden border border-slate-200 mb-3">
          {selectedColors.map((color) => (
            <div
              key={`system-${color.id}`}
              className="flex-1 relative group"
              style={{ backgroundColor: color.hex || '#ccc' }}
              title={color.name ? `${color.name} (${color.hex})` : color.hex}
            >
              <button
                type="button"
                onClick={() => toggleColor(color)}
                className="absolute inset-0 opacity-0 group-hover:opacity-100 bg-black bg-opacity-50 flex items-center justify-center transition-opacity"
                aria-label={`Remove ${color.name || color.hex}`}
              >
                {removeIcon}
              </button>
            </div>
          ))}
          {customColors.map((hex) => (
            <div
              key={`custom-${hex}`}
              className="flex-1 relative group"
              style={{ backgroundColor: hex }}
              title={hex}
            >
              <button
                type="button"
                onClick={() => onCustomColorsChange(customColors.filter((c) => c !== hex))}
                className="absolute inset-0 opacity-0 group-hover:opacity-100 bg-black bg-opacity-50 flex items-center justify-center transition-opacity"
                aria-label={`Remove ${hex}`}
              >
                {removeIcon}
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex h-16 items-center justify-center rounded-lg border border-dashed border-slate-300 text-sm text-slate-500 mb-3">
          selected colors
        </div>
      )}

      {totalCount > maxColors ? (
        <p className="-mt-1 mb-3 text-sm text-red-600">
          Palettes can have up to {maxColors} colors. Remove {totalCount - maxColors} to save.
        </p>
      ) : atLimit ? (
        <p className="-mt-1 mb-3 text-sm text-slate-500">
          You've reached the maximum of {maxColors} colors. Remove one to add a different color.
        </p>
      ) : null}

      <div className="relative mb-3">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              if (showAddHex) addHexColor();
            }
          }}
          placeholder="Search by color name or hex (e.g. ocean or #FF5733)"
          className="w-full px-4 py-2 pl-10 border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#ea3663] focus:border-transparent"
        />
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        {searchTerm && (
          <button
            type="button"
            onClick={() => setSearchTerm('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            aria-label="Clear search"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {loadingColors ? (
        <div className="text-center py-4 text-slate-500">Loading colors...</div>
      ) : showAddHex ? (
        <div className="flex items-center gap-4 p-4 border border-slate-200 rounded-lg bg-white">
          <div className="w-14 h-14 rounded-lg border border-slate-300 flex-shrink-0" style={{ backgroundColor: hexQuery }} />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-slate-800">{hexQuery}</p>
            <p className="text-xs text-slate-500">Not a system color. Add it to this palette as a custom color.</p>
          </div>
          <button
            type="button"
            onClick={addHexColor}
            disabled={hexAlreadyAdded || atLimit}
            className="px-4 py-2 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ backgroundColor: '#ea3663' }}
          >
            {hexAlreadyAdded ? 'Added' : atLimit ? 'Palette full' : 'Add color'}
          </button>
        </div>
      ) : filteredColors.length === 0 ? (
        <div className="text-center py-4 text-sm text-slate-500">
          {searchTerm ? `No colors match "${searchTerm}". Enter a hex code like #FF5733 to add your own.` : 'No system colors available.'}
        </div>
      ) : (
        <div className="max-h-60 overflow-y-auto border border-slate-200 rounded-lg p-2">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
            {filteredColors.map((color) => {
              const isSelected = selectedIds.has(color.id);
              const isDisabled = !isSelected && atLimit;
              return (
                <label
                  key={color.id}
                  className={`flex items-center space-x-2 p-2 rounded transition-colors ${
                    isSelected ? 'bg-slate-200 border-2 border-slate-300' : 'hover:bg-slate-50 border-2 border-transparent'
                  } ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    disabled={isDisabled}
                    onChange={() => toggleColor(color)}
                    className="w-4 h-4 text-pink-600 border-slate-300 rounded focus:ring-pink-500 flex-shrink-0"
                  />
                  <div
                    className="w-6 h-6 rounded border border-slate-300 flex-shrink-0"
                    style={{ backgroundColor: color.hex || '#ccc' }}
                  />
                  <span className="text-xs text-slate-700 truncate">
                    {color.name ? `${color.name} (${color.hex})` : color.hex}
                  </span>
                </label>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default PaletteColorPicker;
