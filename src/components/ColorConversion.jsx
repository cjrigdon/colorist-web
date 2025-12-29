import React, { useState } from 'react';

// Color distance calculation using Euclidean distance in RGB space
const colorDistance = (color1, color2) => {
  const r1 = parseInt(color1.slice(1, 3), 16);
  const g1 = parseInt(color1.slice(3, 5), 16);
  const b1 = parseInt(color1.slice(5, 7), 16);
  
  const r2 = parseInt(color2.slice(1, 3), 16);
  const g2 = parseInt(color2.slice(3, 5), 16);
  const b2 = parseInt(color2.slice(5, 7), 16);
  
  return Math.sqrt(
    Math.pow(r2 - r1, 2) + 
    Math.pow(g2 - g1, 2) + 
    Math.pow(b2 - b1, 2)
  );
};

// Find closest matching color
const findClosestColor = (sourceColor, targetSet) => {
  let closest = null;
  let minDistance = Infinity;
  
  targetSet.colors.forEach((targetColor) => {
    const distance = colorDistance(sourceColor.hex, targetColor.hex);
    if (distance < minDistance) {
      minDistance = distance;
      closest = { ...targetColor, distance };
    }
  });
  
  return closest;
};

const ColorConversion = () => {
  const [sourceSet, setSourceSet] = useState(null);
  const [targetSets, setTargetSets] = useState([]);

  const pencilSets = [
    {
      id: 1,
      name: 'Prismacolor Premier',
      brand: 'Prismacolor',
      count: 150,
      colors: [
        { id: 1, name: 'Crimson Red', hex: '#DC143C', inStock: true },
        { id: 2, name: 'True Blue', hex: '#0073CF', inStock: true },
        { id: 3, name: 'Lime Peel', hex: '#D0E429', inStock: false },
        { id: 4, name: 'Violet', hex: '#8B00FF', inStock: true },
        { id: 5, name: 'Canary Yellow', hex: '#FFEF00', inStock: true },
        { id: 6, name: 'Forest Green', hex: '#228B22', inStock: true },
        { id: 7, name: 'Orange', hex: '#FFA500', inStock: true },
      ]
    },
    {
      id: 2,
      name: 'Faber-Castell Polychromos',
      brand: 'Faber-Castell',
      count: 120,
      colors: [
        { id: 1, name: 'Scarlet Red', hex: '#FF2400', inStock: true },
        { id: 2, name: 'Cobalt Blue', hex: '#0047AB', inStock: true },
        { id: 3, name: 'Lemon Yellow', hex: '#FFF700', inStock: true },
        { id: 4, name: 'Purple Violet', hex: '#8A2BE2', inStock: false },
        { id: 5, name: 'Emerald Green', hex: '#50C878', inStock: true },
        { id: 6, name: 'Burnt Orange', hex: '#CC5500', inStock: true },
      ]
    },
    {
      id: 3,
      name: 'Derwent Coloursoft',
      brand: 'Derwent',
      count: 72,
      colors: [
        { id: 1, name: 'Rose', hex: '#FF007F', inStock: true },
        { id: 2, name: 'Sky Blue', hex: '#87CEEB', inStock: true },
        { id: 3, name: 'Forest Green', hex: '#228B22', inStock: true },
        { id: 4, name: 'Lavender', hex: '#E6E6FA', inStock: true },
        { id: 5, name: 'Sunset Yellow', hex: '#FFD700', inStock: true },
      ]
    },
    {
      id: 4,
      name: 'Caran d\'Ache Luminance',
      brand: 'Caran d\'Ache',
      count: 76,
      colors: [
        { id: 1, name: 'Scarlet', hex: '#FF1D15', inStock: true },
        { id: 2, name: 'Prussian Blue', hex: '#003153', inStock: true },
        { id: 3, name: 'Yellow', hex: '#FFFF00', inStock: true },
        { id: 4, name: 'Violet', hex: '#8F00FF', inStock: true },
        { id: 5, name: 'Green', hex: '#00FF00', inStock: true },
      ]
    },
    {
      id: 5,
      name: 'Staedtler Ergosoft',
      brand: 'Staedtler',
      count: 60,
      colors: [
        { id: 1, name: 'Red', hex: '#FF0000', inStock: true },
        { id: 2, name: 'Blue', hex: '#0000FF', inStock: true },
        { id: 3, name: 'Yellow', hex: '#FFFF00', inStock: true },
        { id: 4, name: 'Green', hex: '#008000', inStock: true },
      ]
    },
    {
      id: 6,
      name: 'Cretacolor Aqua Monolith',
      brand: 'Cretacolor',
      count: 72,
      colors: [
        { id: 1, name: 'Carmine', hex: '#960018', inStock: true },
        { id: 2, name: 'Ultramarine', hex: '#120A8F', inStock: true },
        { id: 3, name: 'Cadmium Yellow', hex: '#FFF600', inStock: true },
        { id: 4, name: 'Viridian', hex: '#40826D', inStock: true },
      ]
    },
  ];

  const availableTargetSets = pencilSets.filter(set => 
    set.id !== sourceSet?.id && !targetSets.find(ts => ts.id === set.id)
  );

  const handleAddTargetSet = (setId) => {
    if (targetSets.length < 5) {
      const set = pencilSets.find(s => s.id === setId);
      if (set) {
        setTargetSets([...targetSets, set]);
      }
    }
  };

  const handleRemoveTargetSet = (setId) => {
    setTargetSets(targetSets.filter(set => set.id !== setId));
  };

  const getMatches = () => {
    if (!sourceSet || targetSets.length === 0) return [];

    return sourceSet.colors.map(sourceColor => {
      const matches = targetSets.map(targetSet => ({
        set: targetSet,
        match: findClosestColor(sourceColor, targetSet)
      }));

      return {
        sourceColor,
        matches
      };
    });
  };

  const matches = getMatches();

  return (
    <div className="space-y-6">
      {/* Selection Section */}
      <div className="bg-slate-50 rounded-2xl p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Source Set Selection */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h3 className="text-lg font-semibold text-slate-800 mb-4 font-venti">Source Set</h3>
          <select
            value={sourceSet?.id || ''}
            onChange={(e) => {
              const setId = parseInt(e.target.value);
              const set = pencilSets.find(s => s.id === setId);
              setSourceSet(set || null);
              // Remove source set from target sets if it was selected
              setTargetSets(targetSets.filter(ts => ts.id !== setId));
            }}
            className="w-full px-4 py-3 border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-offset-2"
            style={{ focusRingColor: '#ea3663' }}
          >
            <option value="">Select a source set...</option>
            {pencilSets.map((set) => (
              <option key={set.id} value={set.id}>
                {set.name} ({set.brand}) - {set.count} colors
              </option>
            ))}
          </select>
        </div>

        {/* Target Sets Selection */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-slate-800 font-venti">Target Sets</h3>
            <span className="text-sm text-slate-500">{targetSets.length}/5 selected</span>
          </div>
          
          {targetSets.length > 0 && (
            <div className="space-y-2 mb-4">
              {targetSets.map((set) => (
                <div
                  key={set.id}
                  className="flex items-center justify-between p-3 bg-slate-50 rounded-lg"
                >
                  <div>
                    <p className="text-sm font-medium text-slate-800">{set.name}</p>
                    <p className="text-xs text-slate-500">{set.brand}</p>
                  </div>
                  <button
                    onClick={() => handleRemoveTargetSet(set.id)}
                    className="p-1.5 text-slate-400 hover:text-red-500 transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}

          {targetSets.length < 5 && (
            <select
              value=""
              onChange={(e) => {
                if (e.target.value) {
                  handleAddTargetSet(parseInt(e.target.value));
                  e.target.value = '';
                }
              }}
              className="w-full px-4 py-3 border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-offset-2"
              style={{ focusRingColor: '#ea3663' }}
            >
              <option value="">Add a target set...</option>
              {availableTargetSets.map((set) => (
                <option key={set.id} value={set.id}>
                  {set.name} ({set.brand}) - {set.count} colors
                </option>
              ))}
            </select>
          )}
        </div>
        </div>
      </div>

      {/* Results Section */}
      {matches.length > 0 && (
        <div className="bg-slate-50 rounded-2xl p-6">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-6 border-b border-slate-200">
              <h3 className="text-lg font-semibold text-slate-800 font-venti">Color Matches</h3>
              <p className="text-sm text-slate-600 mt-1">
                Showing closest matches for {sourceSet.name} colors
              </p>
            </div>

            <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-800 font-venti">Source Color</th>
                  {targetSets.map((set) => (
                    <th key={set.id} className="px-6 py-4 text-left text-sm font-semibold text-slate-800 font-venti">
                      {set.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {matches.map(({ sourceColor, matches: colorMatches }, index) => (
                  <tr key={sourceColor.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <div
                          className="w-12 h-12 rounded-lg shadow-sm border border-slate-200 flex-shrink-0"
                          style={{ backgroundColor: sourceColor.hex }}
                        ></div>
                        <div>
                          <p className="text-sm font-medium text-slate-800">{sourceColor.name}</p>
                          <p className="text-xs text-slate-500 font-mono">{sourceColor.hex}</p>
                        </div>
                      </div>
                    </td>
                    {colorMatches.map(({ set, match }) => (
                      <td key={set.id} className="px-6 py-4">
                        <div className="flex items-center space-x-3">
                          <div
                            className="w-12 h-12 rounded-lg shadow-sm border border-slate-200 flex-shrink-0"
                            style={{ backgroundColor: match.hex }}
                          ></div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-slate-800">{match.name}</p>
                            <p className="text-xs text-slate-500 font-mono">{match.hex}</p>
                            <p className="text-xs text-slate-400 mt-1">
                              Distance: {Math.round(match.distance)}
                            </p>
                          </div>
                        </div>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!sourceSet && (
        <div className="bg-slate-50 rounded-2xl p-12 text-center">
          <div className="text-6xl mb-4">🎨</div>
          <h3 className="text-xl font-semibold text-slate-800 mb-2 font-venti">No Source Set Selected</h3>
          <p className="text-slate-600">Select a source set to begin comparing colors</p>
        </div>
      )}

      {sourceSet && targetSets.length === 0 && (
        <div className="bg-slate-50 rounded-2xl p-12 text-center">
          <div className="text-6xl mb-4">🔍</div>
          <h3 className="text-xl font-semibold text-slate-800 mb-2 font-venti">No Target Sets Selected</h3>
          <p className="text-slate-600">Add up to 5 target sets to compare colors</p>
        </div>
      )}
    </div>
  );
};

export default ColorConversion;

