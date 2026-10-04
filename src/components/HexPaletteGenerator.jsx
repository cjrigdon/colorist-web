import React, { useState } from 'react';
import { colorPalettesAPI } from '../services/api';
import { normalizeHex } from '../utils/colorUtils';

const HexPaletteGenerator = ({ onChoose }) => {
  const [hexInput, setHexInput] = useState('');
  const [options, setOptions] = useState([]);
  const [generatedHex, setGeneratedHex] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const previewHex = normalizeHex(hexInput);

  const handleGenerate = async () => {
    if (!previewHex) {
      setError('Enter a hex code, e.g. #3A7BD5');
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const response = await colorPalettesAPI.generateFromHex(previewHex);
      const palettes = Array.isArray(response) ? response : (response?.data || []);
      setOptions(palettes.filter((option) => Array.isArray(option.colors) && option.colors.length > 0));
      setGeneratedHex(previewHex);
    } catch (err) {
      console.error('Error generating palettes from hex:', err);
      setError(err.data?.message || 'Could not create palettes from that hex');
      setOptions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleChoose = (option) => {
    onChoose(option, generatedHex);
    setOptions([]);
    setGeneratedHex(null);
    setHexInput('');
  };

  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1">
        Start from a hex (optional)
      </label>
      <p className="text-xs text-slate-500 mb-2">Enter a hex code to see palettes built around it, or choose colors from the list below.</p>
      <div className="flex items-center gap-2">
        <div
          className="w-11 h-11 rounded-lg border border-slate-300 flex-shrink-0"
          style={{ backgroundColor: previewHex || '#f1f5f9' }}
        />
        <input
          type="text"
          value={hexInput}
          onChange={(e) => {
            setHexInput(e.target.value);
            setError(null);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              handleGenerate();
            }
          }}
          placeholder="#3A7BD5"
          maxLength={7}
          className="flex-1 px-4 py-2 border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#ea3663] focus:border-transparent"
        />
        <button
          type="button"
          onClick={handleGenerate}
          disabled={loading || !hexInput.trim()}
          className="px-4 py-2 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
          style={{ backgroundColor: '#ea3663' }}
        >
          {loading ? 'Creating...' : 'Show palettes'}
        </button>
      </div>
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}

      {options.length > 0 && (
        <div className="mt-3">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-slate-500">Palettes for {generatedHex}. Choose one to add its colors.</p>
            <button
              type="button"
              onClick={() => setOptions([])}
              className="text-xs text-slate-500 hover:text-slate-700"
            >
              Dismiss
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {options.map((option) => (
              <button
                key={option.title}
                type="button"
                onClick={() => handleChoose(option)}
                className="text-left bg-white border border-slate-200 rounded-lg overflow-hidden hover:border-[#ea3663] hover:shadow-md transition-all"
              >
                <div className="flex h-12">
                  {option.colors.map((hex, index) => (
                    <div key={index} className="flex-1" style={{ backgroundColor: normalizeHex(hex) || hex }} />
                  ))}
                </div>
                <div className="px-3 py-2 flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-800">{option.title}</span>
                  <span className="text-xs text-slate-500">{option.colors.length} colors · Add</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default HexPaletteGenerator;
