import React, { useState } from 'react';
import { colorsAPI } from '../services/api';

const ColorSelector = ({
  // Data
  items = [], // Can be colors or pencils
  selectedIds = [],
  loading = false,
  
  // Configuration
  mode = 'colors', // 'colors' or 'pencils'
  allowAddColor = true,
  maxSelection = null, // null for unlimited
  showSelectionCount = true,
  selectionLabel = 'Select Colors',
  
  // Optional filter
  filterComponent = null, // Optional filter component to render above search
  
  // Callbacks
  onSelectionChange = () => {},
  onColorAdded = () => {},
  
  // Display customization
  emptyMessage = 'No colors available.',
  searchPlaceholder = 'Search by name or hex (e.g., red or #FF5733)...',
  
  // Disabled state
  disabled = false,
}) => {
  const [showAddColorForm, setShowAddColorForm] = useState(false);
  const [newColorHex, setNewColorHex] = useState('');
  const [addingColor, setAddingColor] = useState(false);
  const [colorSearchTerm, setColorSearchTerm] = useState('');
  const [error, setError] = useState(null);

  // Get color from item (works for both colors and pencils)
  const getColorFromItem = (item) => {
    if (mode === 'colors') {
      return item;
    } else {
      return item.color;
    }
  };

  // Get display name from item
  const getDisplayName = (item) => {
    if (mode === 'colors') {
      return item.name;
    } else {
      return item.color_name || 'Unnamed';
    }
  };

  // Get hex from item
  const getHex = (item) => {
    const color = getColorFromItem(item);
    return color?.hex || '';
  };

  // Get item ID
  const getItemId = (item) => {
    return item.id.toString();
  };

  const handleAddNewColor = async () => {
    if (!newColorHex || !/^#?[0-9A-Fa-f]{6}$/.test(newColorHex.replace('#', ''))) {
      setError('Please enter a valid hex color (e.g., #FF5733)');
      return;
    }

    try {
      setAddingColor(true);
      setError(null);
      const newColor = await colorsAPI.createFromHex(newColorHex);
      
      // Add to available items list
      if (mode === 'colors') {
        // For colors mode, we can directly add the color
        onColorAdded(newColor);
      } else {
        // For pencils mode, we need to notify parent that a color was added
        // The parent will need to handle adding it to a pencil set
        onColorAdded(newColor);
      }
      
      // Auto-select the new color if there's room
      if (maxSelection === null || selectedIds.length < maxSelection) {
        onSelectionChange([...selectedIds, newColor.id.toString()]);
      }
      
      // Reset form
      setNewColorHex('');
      setShowAddColorForm(false);
    } catch (err) {
      console.error('Error creating color:', err);
      setError(err.data?.message || 'Failed to create color');
    } finally {
      setAddingColor(false);
    }
  };

  const toggleSelection = (itemId) => {
    const idStr = itemId.toString();
    if (selectedIds.includes(idStr)) {
      onSelectionChange(selectedIds.filter(id => id !== idStr));
    } else {
      if (maxSelection !== null && selectedIds.length >= maxSelection) {
        return; // Don't allow selection if max is reached
      }
      onSelectionChange([...selectedIds, idStr]);
    }
  };

  // Filter items based on search term
  const filteredItems = items.filter((item) => {
    if (!colorSearchTerm) return true;
    const searchLower = colorSearchTerm.toLowerCase();
    const color = getColorFromItem(item);
    const nameMatch = getDisplayName(item)?.toLowerCase().includes(searchLower);
    const hexMatch = getHex(item)?.toLowerCase().includes(searchLower);
    
    if (mode === 'pencils') {
      const colorNumberMatch = item.color_number?.toLowerCase().includes(searchLower);
      return nameMatch || hexMatch || colorNumberMatch;
    }
    
    return nameMatch || hexMatch;
  });

  const formatHex = (hex) => {
    if (!hex) return '';
    return hex.startsWith('#') ? hex : `#${hex}`;
  };

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <div className="flex items-center justify-between mb-2 flex-shrink-0">
        <label className="block text-sm font-medium text-slate-700">
          {selectionLabel}
          {showSelectionCount && (
            <span className="ml-1">
              ({selectedIds.length}{maxSelection ? ` / ${maxSelection}` : ''} selected)
            </span>
          )}
        </label>
        {allowAddColor && (
          <button
            type="button"
            onClick={() => setShowAddColorForm(!showAddColorForm)}
            className="px-3 py-1.5 text-sm text-white rounded-lg font-medium transition-colors flex items-center space-x-1"
            style={{ backgroundColor: '#ea3663' }}
            onMouseEnter={(e) => e.target.style.backgroundColor = '#d12a4f'}
            onMouseLeave={(e) => e.target.style.backgroundColor = '#ea3663'}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span>Add Color</span>
          </button>
        )}
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
          {error}
        </div>
      )}

      {showAddColorForm && allowAddColor && (
        <div className="mb-3 p-3 bg-slate-50 rounded-lg border border-slate-200 flex-shrink-0">
          <div className="flex items-center space-x-2">
            <input
              type="text"
              value={newColorHex}
              onChange={(e) => setNewColorHex(e.target.value)}
              placeholder="#FF5733"
              className="flex-1 px-4 py-2 border border-slate-300 rounded-lg text-slate-800"
              maxLength={7}
            />
            <div
              className="w-12 h-12 rounded border border-slate-300"
              style={{ backgroundColor: newColorHex || '#ccc' }}
            />
            <button
              type="button"
              onClick={handleAddNewColor}
              disabled={addingColor || !newColorHex}
              className="px-4 py-2 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
              style={{ backgroundColor: '#ea3663' }}
            >
              {addingColor ? 'Adding...' : 'Add'}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowAddColorForm(false);
                setNewColorHex('');
                setError(null);
              }}
              className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {filterComponent && (
        <div className="mb-2 flex-shrink-0">
          {filterComponent}
        </div>
      )}

      {/* Search Input */}
      <div className="mb-2 flex-shrink-0">
        <div className="relative">
          <input
            type="text"
            value={colorSearchTerm}
            onChange={(e) => setColorSearchTerm(e.target.value)}
            placeholder={searchPlaceholder}
            className="w-full px-4 py-2 pl-10 border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-offset-0 focus:border-transparent"
            style={{ focusRingColor: '#ea3663' }}
            disabled={disabled}
          />
          <svg
            className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          {colorSearchTerm && (
            <button
              type="button"
              onClick={() => setColorSearchTerm('')}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="text-center py-4 text-slate-500 flex-shrink-0">Loading colors...</div>
      ) : filteredItems.length === 0 ? (
        <div className="text-center py-4 text-slate-500 flex-shrink-0">
          {colorSearchTerm ? `No colors found matching "${colorSearchTerm}"` : emptyMessage}
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto border border-slate-200 rounded-lg p-2 min-h-0 max-h-full">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
            {filteredItems.map((item) => {
              const itemId = getItemId(item);
              const color = getColorFromItem(item);
              const displayName = getDisplayName(item);
              const hex = getHex(item);
              const isSelected = selectedIds.includes(itemId);
              const isDisabled = disabled || (maxSelection !== null && !isSelected && selectedIds.length >= maxSelection);

              return (
                <label
                  key={item.id}
                  className={`flex items-center space-x-2 p-2 rounded cursor-pointer transition-colors ${
                    isSelected
                      ? 'bg-slate-200 border-2 border-slate-300'
                      : 'hover:bg-slate-50 border-2 border-transparent'
                  } ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleSelection(item.id)}
                    disabled={isDisabled}
                    className="w-4 h-4 text-pink-600 border-slate-300 rounded focus:ring-pink-500 flex-shrink-0"
                  />
                  <div className="flex items-center space-x-2 flex-1 min-w-0">
                    <div
                      className="w-6 h-6 rounded border border-slate-300 flex-shrink-0"
                      style={{ backgroundColor: formatHex(hex) || '#ccc' }}
                    />
                    <div className="flex-1 min-w-0">
                      {displayName ? (
                        <>
                          <div className="text-xs text-slate-700 truncate font-medium">
                            {displayName}
                          </div>
                          <div className="text-xs text-slate-500 truncate">
                            {hex ? formatHex(hex) : `Color ${item.id}`}
                          </div>
                        </>
                      ) : (
                        <div className="text-xs text-slate-700 truncate">
                          {hex ? formatHex(hex) : `Color ${item.id}`}
                        </div>
                      )}
                    </div>
                  </div>
                </label>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default ColorSelector;

