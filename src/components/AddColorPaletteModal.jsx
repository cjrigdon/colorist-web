import React, { useState, useEffect } from 'react';
import { colorPalettesAPI, colorsAPI } from '../services/api';
import PaletteColorPicker from './PaletteColorPicker';
import HexPaletteGenerator from './HexPaletteGenerator';
import { MAX_PALETTE_COLORS, mergeHexesIntoPalette } from '../utils/colorUtils';

const AddColorPaletteModal = ({ isOpen, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [paletteData, setPaletteData] = useState({
    title: '',
    base_color: ''
  });
  const [availableColors, setAvailableColors] = useState([]);
  const [loadingColors, setLoadingColors] = useState(false);
  const [selectedColors, setSelectedColors] = useState([]);
  const [customColors, setCustomColors] = useState([]);
  const [hasGeneratedPalette, setHasGeneratedPalette] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchAvailableColors();
      setPaletteData({ title: '', base_color: '' });
      setSelectedColors([]);
      setCustomColors([]);
      setHasGeneratedPalette(false);
      setError(null);
    }
  }, [isOpen]);

  const totalColorCount = selectedColors.length + customColors.length;

  const handleGeneratedPalette = (option, baseHex) => {
    const merged = mergeHexesIntoPalette(option.colors, availableColors, selectedColors, customColors, MAX_PALETTE_COLORS);
    setSelectedColors(merged.selectedColors);
    setCustomColors(merged.customColors);
    setPaletteData((prev) => ({
      ...prev,
      base_color: baseHex,
      title: prev.title || `${option.title} ${baseHex}`,
    }));
    setHasGeneratedPalette(true);
  };

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!paletteData.title) {
      setError('Please enter a title');
      return;
    }
    if (totalColorCount === 0) {
      setError('Please add at least one color');
      return;
    }
    if (totalColorCount > MAX_PALETTE_COLORS) {
      setError(`Palettes can have up to ${MAX_PALETTE_COLORS} colors`);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      await colorPalettesAPI.create({
        title: paletteData.title,
        base_color: paletteData.base_color || null,
        color_ids: selectedColors.map(color => color.id),
        custom_colors: customColors
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

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] m-0 p-0" style={{ top: 0, left: 0, right: 0, bottom: 0, margin: 0, padding: 0 }}>
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

            {!hasGeneratedPalette && <HexPaletteGenerator onChoose={handleGeneratedPalette} />}

            <PaletteColorPicker
              availableColors={availableColors}
              loadingColors={loadingColors}
              selectedColors={selectedColors}
              onSelectedColorsChange={setSelectedColors}
              customColors={customColors}
              onCustomColorsChange={setCustomColors}
            />

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

