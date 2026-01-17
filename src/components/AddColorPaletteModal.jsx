import React, { useState, useEffect } from 'react';
import { colorPalettesAPI, colorsAPI } from '../services/api';

const AddColorPaletteModal = ({ isOpen, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [paletteData, setPaletteData] = useState({
    title: '',
    base_color: ''
  });
  const [availableColors, setAvailableColors] = useState([]);
  const [loadingColors, setLoadingColors] = useState(false);
  const [selectedColorIds, setSelectedColorIds] = useState([]);
  const [colorSearchTerm, setColorSearchTerm] = useState('');
  const [showAddColorForm, setShowAddColorForm] = useState(false);
  const [newColorHex, setNewColorHex] = useState('');
  const [addingColor, setAddingColor] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchAvailableColors();
      setPaletteData({ title: '', base_color: '' });
      setSelectedColorIds([]);
      setColorSearchTerm('');
    }
  }, [isOpen]);

  const fetchAvailableColors = async () => {
    try {
      setLoadingColors(true);
      const response = await colorsAPI.getAll();
      let colorsData = [];
      if (Array.isArray(response)) {
        colorsData = response;
      } else if (response.data && Array.isArray(response.data)) {
        colorsData = response.data;
      }
      setAvailableColors(colorsData);
    } catch (err) {
      console.error('Error fetching colors:', err);
      setError('Failed to load colors');
    } finally {
      setLoadingColors(false);
    }
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
      
      // Add to available colors list
      setAvailableColors([...availableColors, newColor]);
      
      // Auto-select the new color
      setSelectedColorIds([...selectedColorIds, newColor.id.toString()]);
      
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

  const toggleColorSelection = (colorId) => {
    const idStr = colorId.toString();
    if (selectedColorIds.includes(idStr)) {
      setSelectedColorIds(selectedColorIds.filter(id => id !== idStr));
    } else {
      setSelectedColorIds([...selectedColorIds, idStr]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!paletteData.title) {
      setError('Please enter a title');
      return;
    }
    if (selectedColorIds.length === 0) {
      setError('Please select at least one color');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      // Get color objects for the selected IDs
      const selectedColors = availableColors.filter(c => 
        selectedColorIds.includes(c.id.toString())
      );

      await colorPalettesAPI.create({
        title: paletteData.title,
        base_color: paletteData.base_color || null,
        color_ids: selectedColorIds.map(id => parseInt(id))
      });
      onSuccess();
      onClose();
    } catch (err) {
      console.error('Error creating color palette:', err);
      setError(err.data?.message || 'Failed to create color palette');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  // Filter colors based on search term
  const filteredColors = availableColors.filter((color) => {
    if (!colorSearchTerm) return true;
    const searchLower = colorSearchTerm.toLowerCase();
    const nameMatch = color.name?.toLowerCase().includes(searchLower);
    const hexMatch = color.hex?.toLowerCase().includes(searchLower);
    return nameMatch || hexMatch;
  });

  return (
    <div className="fixed top-0 left-0 right-0 bottom-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999]">
      <div className="bg-slate-50 rounded-2xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto m-4">
        <div className="p-6 border-b border-slate-200">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold text-slate-800 font-venti">Create Color Palette</h3>
            <button
              onClick={onClose}
              className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Title *
                </label>
                <input
                  type="text"
                  value={paletteData.title}
                  onChange={(e) => setPaletteData({ ...paletteData, title: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg text-slate-800"
                  placeholder="e.g. Ocean Blues"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Base Color (optional)
                </label>
                <input
                  type="text"
                  value={paletteData.base_color}
                  onChange={(e) => setPaletteData({ ...paletteData, base_color: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg text-slate-800"
                  placeholder="e.g. Blue"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-slate-700">
                  Select Colors ({selectedColorIds.length} selected)
                </label>
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
              </div>
              
              {showAddColorForm && (
                <div className="mb-4 p-4 bg-slate-50 rounded-lg border border-slate-200">
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
                      }}
                      className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {/* Search Input */}
              <div className="mb-3">
                <div className="relative">
                  <input
                    type="text"
                    value={colorSearchTerm}
                    onChange={(e) => setColorSearchTerm(e.target.value)}
                    placeholder="Search by name or hex (e.g., red or #FF5733)..."
                    className="w-full px-4 py-2 pl-10 border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-offset-0 focus:border-transparent"
                    style={{ focusRingColor: '#ea3663' }}
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

              {loadingColors ? (
                <div className="text-center py-4 text-slate-500">Loading colors...</div>
              ) : filteredColors.length === 0 ? (
                <div className="text-center py-4 text-slate-500">
                  {colorSearchTerm ? `No colors found matching "${colorSearchTerm}"` : 'No colors available. Add a color to get started.'}
                </div>
              ) : (
                <div className="max-h-60 overflow-y-auto border border-slate-200 rounded-lg p-2">
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                    {filteredColors.map((color) => (
                      <label
                        key={color.id}
                        className={`flex items-center space-x-2 p-2 rounded cursor-pointer transition-colors ${
                          selectedColorIds.includes(color.id.toString())
                            ? 'bg-slate-200 border-2 border-slate-300'
                            : 'hover:bg-slate-50 border-2 border-transparent'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={selectedColorIds.includes(color.id.toString())}
                          onChange={() => toggleColorSelection(color.id)}
                          className="w-4 h-4 text-pink-600 border-slate-300 rounded focus:ring-pink-500 flex-shrink-0"
                        />
                        <div className="flex items-center space-x-2 flex-1 min-w-0">
                          <div
                            className="w-6 h-6 rounded border border-slate-300 flex-shrink-0"
                            style={{ backgroundColor: color.hex || '#ccc' }}
                          />
                          <span className="text-xs text-slate-700 truncate">
                            {color.name 
                              ? `${color.name} ${color.hex ? `(${color.hex})` : ''}` 
                              : (color.hex || `Color ${color.id}`)}
                          </span>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              )}
              {selectedColorIds.length === 0 && (
                <div className="mt-2 text-sm text-amber-600">
                  Please select at least one color for your palette.
                </div>
              )}
            </div>

            <div className="flex justify-end space-x-3 pt-6 mt-6 border-t border-slate-200">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
                style={{ backgroundColor: '#ea3663' }}
                disabled={loading}
              >
                {loading ? 'Creating...' : 'Create Palette'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddColorPaletteModal;

