import React, { useState, useEffect } from 'react';
import DropdownMenu from './DropdownMenu';
import { coloredPencilSetsAPI } from '../services/api';
import { deltaEToPercentage } from '../utils/colorUtils';

const getMatchQualityColor = (quality) => {
  switch (quality) {
    case 'excellent':
      return 'text-green-600 bg-green-50';
    case 'very_good':
      return 'text-green-700 bg-green-100';
    case 'good':
      return 'text-blue-600 bg-blue-50';
    case 'fair':
      return 'text-yellow-600 bg-yellow-50';
    case 'poor':
      return 'text-red-600 bg-red-50';
    default:
      return 'text-slate-600 bg-slate-50';
  }
};

// Normalize hex color value - ensure it's a valid hex string
const normalizeHex = (hex) => {
  if (!hex || typeof hex !== 'string') {
    return '#000000';
  }
  // Remove any whitespace
  hex = hex.trim();
  // If it doesn't start with #, add it
  if (!hex.startsWith('#')) {
    hex = '#' + hex;
  }
  // Validate it's a valid hex color (3 or 6 digits after #)
  if (!/^#[0-9A-Fa-f]{3}$|^#[0-9A-Fa-f]{6}$/.test(hex)) {
    return '#000000';
  }
  return hex;
};

const ColorConversion = () => {
  const [sourceSet, setSourceSet] = useState(null);
  const [targetSets, setTargetSets] = useState([]);
  const [pencilSets, setPencilSets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [matches, setMatches] = useState([]);
  const [loadingMatches, setLoadingMatches] = useState(false);
  const [includeTwoColorMix, setIncludeTwoColorMix] = useState(false);

  // Fetch all system pencil set sizes on mount (to show all sets and sizes in the system)
  useEffect(() => {
    const fetchPencilSets = async () => {
      try {
        setLoading(true);
        setError(null);
        // Use getAvailableSetSizes with all=true to get all system sets and sizes
        const response = await coloredPencilSetsAPI.getAvailableSetSizes(1, 1000, true);
        console.log('ColorConversion - Full API Response:', response);
        // Handle paginated response (Laravel returns { data: [...], current_page, etc. })
        let setSizes = [];
        if (Array.isArray(response)) {
          setSizes = response;
        } else if (response.data && Array.isArray(response.data)) {
          setSizes = response.data;
        }
        console.log('ColorConversion - Extracted setSizes:', setSizes);
        console.log('ColorConversion - SetSizes count:', setSizes.length);
        if (setSizes.length > 0) {
          console.log('ColorConversion - First setSize:', setSizes[0]);
          console.log('ColorConversion - First setSize.set:', setSizes[0].set);
        }
        setPencilSets(setSizes);
      } catch (err) {
        console.error('Error fetching pencil sets:', err);
        setError('Failed to load pencil sets. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchPencilSets();
  }, []);

  // Fetch comparison results when source and target sets change
  useEffect(() => {
    const fetchMatches = async () => {
      if (!sourceSet || targetSets.length === 0) {
        setMatches([]);
        return;
      }

      try {
        setLoadingMatches(true);
        setError(null);

        // Compare source set with each target set
        // Use set.set.id for comparison (the actual set ID, not the set size ID)
        const sourceSetId = sourceSet.set?.id || sourceSet.id;
        const comparisonPromises = targetSets.map(async (targetSetSize) => {
          const targetSetId = targetSetSize.set?.id || targetSetSize.id;
          try {
            const result = await coloredPencilSetsAPI.compare(sourceSetId, targetSetId, includeTwoColorMix);
            return {
              targetSet: targetSetSize, // Keep the full set size object for display
              matches: result.matches || []
            };
          } catch (err) {
            console.error(`Error comparing sets ${sourceSetId} and ${targetSetId}:`, err);
            return {
              targetSet: targetSetSize,
              matches: [],
              error: err.message || 'Failed to compare sets'
            };
          }
        });

        const results = await Promise.all(comparisonPromises);

        // Debug: Log the first result to see the structure
        if (results.length > 0 && results[0].matches && results[0].matches.length > 0) {
          console.log('ColorConversion - First match structure:', results[0].matches[0]);
          console.log('ColorConversion - Source pencil color:', results[0].matches[0].source_pencil);
          if (results[0].matches[0].target_pencil) {
            console.log('ColorConversion - Target pencil color:', results[0].matches[0].target_pencil);
          }
          if (results[0].matches[0].target_pencil_mix) {
            console.log('ColorConversion - Target pencil mix:', results[0].matches[0].target_pencil_mix);
          }
        }

        // Transform results to match the expected format
        // Group matches by source pencil
        const sourcePencilsMap = new Map();

        results.forEach(({ targetSet, matches: targetMatches, error: targetError }) => {
          targetMatches.forEach((match) => {
            const sourcePencilId = match.source_pencil.id;
            
            // Extract source color hex with better fallback and normalization
            const sourceHex = normalizeHex(
              (match.source_pencil.color && match.source_pencil.color.hex) 
                ? match.source_pencil.color.hex 
                : '#000000'
            );
            
            if (!sourcePencilsMap.has(sourcePencilId)) {
              sourcePencilsMap.set(sourcePencilId, {
                sourceColor: {
                  id: match.source_pencil.id,
                  name: match.source_pencil.color_name || (match.source_pencil.color && match.source_pencil.color.name) || 'Unknown',
                  hex: sourceHex,
                  color_number: match.source_pencil.color_number,
                },
                matches: []
              });
            }

            const entry = sourcePencilsMap.get(sourcePencilId);
            
            // Handle both single matches and two-color mixes
            if (match.is_mix && match.target_pencil_mix) {
              // Two-color mix match
              const color1Hex = normalizeHex(
                (match.target_pencil_mix.color1.color && match.target_pencil_mix.color1.color.hex)
                  ? match.target_pencil_mix.color1.color.hex
                  : '#000000'
              );
              const color2Hex = normalizeHex(
                (match.target_pencil_mix.color2.color && match.target_pencil_mix.color2.color.hex)
                  ? match.target_pencil_mix.color2.color.hex
                  : '#000000'
              );
              const mixedHex = normalizeHex(match.target_pencil_mix.mixed_hex || '#000000');
              
              entry.matches.push({
                set: targetSet, // This is the targetSetSize object
                match: {
                  is_mix: true,
                  color1: {
                    id: match.target_pencil_mix.color1.id,
                    name: match.target_pencil_mix.color1.color_name || (match.target_pencil_mix.color1.color && match.target_pencil_mix.color1.color.name) || 'Unknown',
                    hex: color1Hex,
                    color_number: match.target_pencil_mix.color1.color_number,
                  },
                  color2: {
                    id: match.target_pencil_mix.color2.id,
                    name: match.target_pencil_mix.color2.color_name || (match.target_pencil_mix.color2.color && match.target_pencil_mix.color2.color.name) || 'Unknown',
                    hex: color2Hex,
                    color_number: match.target_pencil_mix.color2.color_number,
                  },
                  mixed_hex: mixedHex,
                  ratio: match.target_pencil_mix.ratio,
                  delta_e: match.delta_e,
                  match_quality: match.match_quality,
                },
                error: targetError
              });
            } else if (match.target_pencil) {
              // Single color match
              const targetHex = normalizeHex(
                (match.target_pencil.color && match.target_pencil.color.hex)
                  ? match.target_pencil.color.hex
                  : '#000000'
              );
              
              entry.matches.push({
                set: targetSet, // This is the targetSetSize object
                match: {
                  is_mix: false,
                  id: match.target_pencil.id,
                  name: match.target_pencil.color_name || (match.target_pencil.color && match.target_pencil.color.name) || 'Unknown',
                  hex: targetHex,
                  color_number: match.target_pencil.color_number,
                  delta_e: match.delta_e,
                  match_quality: match.match_quality,
                },
                error: targetError
              });
            }
          });
        });

        setMatches(Array.from(sourcePencilsMap.values()));
      } catch (err) {
        console.error('Error fetching matches:', err);
        setError('Failed to load color matches. Please try again.');
      } finally {
        setLoadingMatches(false);
      }
    };

    fetchMatches();
  }, [sourceSet, targetSets, includeTwoColorMix]);

  const availableTargetSets = pencilSets.filter(setSize => {
    const setId = setSize.set?.id || setSize.id;
    const sourceSetId = sourceSet?.set?.id || sourceSet?.id;
    return setId !== sourceSetId && !targetSets.find(ts => {
      const targetSetId = ts.set?.id || ts.id;
      return targetSetId === setId;
    });
  });

  const handleAddTargetSet = (setSizeId) => {
    if (targetSets.length < 5) {
      const setSize = pencilSets.find(s => s.id === parseInt(setSizeId));
      if (setSize) {
        setTargetSets([...targetSets, setSize]);
      }
    }
  };

  const handleRemoveTargetSet = (setSizeId) => {
    setTargetSets(targetSets.filter(setSize => setSize.id !== parseInt(setSizeId)));
  };

  const getPencilCount = (setSize) => {
    return setSize.pencils?.length || setSize.count || 0;
  };

  const getSetDisplayName = (setSize) => {
    const setName = setSize.set?.name || setSize.name || 'Unknown';
    const brand = setSize.set?.brand || setSize.brand || '';
    const count = setSize.count || getPencilCount(setSize);
    return brand ? `${setName} (${brand}) - ${count} colors` : `${setName} - ${count} colors`;
  };

  return (
    <div className="space-y-6">
      {/* Selection Section */}
      <div className="bg-white p-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Source Set Selection */}
          <div className="bg-slate-50 rounded-xl shadow-sm border border-slate-200 p-4">
          <h3 className="text-lg font-semibold text-slate-800 mb-3 font-venti">Source Set</h3>
          {loading ? (
            <div className="text-sm text-slate-500">Loading sets...</div>
          ) : error ? (
            <div className="text-sm text-red-600">{error}</div>
          ) : pencilSets.length === 0 ? (
            <div className="text-sm text-slate-500">No sets available</div>
          ) : (
            <DropdownMenu
              options={pencilSets.map(setSize => ({
                value: setSize.id,
                label: getSetDisplayName(setSize)
              }))}
              value={sourceSet?.id || ''}
              onChange={(value) => {
                const setSizeId = parseInt(value);
                const setSize = pencilSets.find(s => s.id === setSizeId);
                setSourceSet(setSize || null);
                // Remove source set from target sets if it was selected (compare by set ID, not set size ID)
                if (setSize) {
                  const sourceSetId = setSize.set?.id || setSize.id;
                  setTargetSets(targetSets.filter(ts => {
                    const targetSetId = ts.set?.id || ts.id;
                    return targetSetId !== sourceSetId;
                  }));
                }
              }}
              placeholder="Select a source set..."
            />
          )}
        </div>

        {/* Target Sets Selection */}
        <div className="bg-slate-50 rounded-xl shadow-sm border border-slate-200 p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold text-slate-800 font-venti">Target Sets</h3>
            <span className="text-sm text-slate-500">{targetSets.length}/5 selected</span>
          </div>
          
          {targetSets.length > 0 && (
            <div className="space-y-2 mb-3">
              {targetSets.map((set) => (
                <div
                  key={set.id}
                  className="flex items-center justify-between p-3 bg-white rounded-lg"
                >
                  <div>
                    <p className="text-sm font-medium text-slate-800">{set.set?.name || set.name}</p>
                    <p className="text-xs text-slate-500">{set.set?.brand || set.brand} - {getPencilCount(set)} colors</p>
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

          {targetSets.length < 5 && !loading && (
            <DropdownMenu
              options={availableTargetSets.map(setSize => ({
                value: setSize.id,
                label: getSetDisplayName(setSize)
              }))}
              value=""
              onChange={(value) => {
                if (value) {
                  handleAddTargetSet(value);
                }
              }}
              placeholder="Add a target set..."
            />
          )}
        </div>
        </div>
        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* Loading State */}
        {loadingMatches && (
          <div className="bg-white p-12 text-center">
            <div className="modern-loader mb-4">
              <div className="loader-ring">
                <div className="loader-ring-segment"></div>
                <div className="loader-ring-segment"></div>
                <div className="loader-ring-segment"></div>
                <div className="loader-ring-segment"></div>
              </div>
            </div>
            <h3 className="text-xl font-semibold text-slate-800 mb-2 font-venti">Comparing Colors...</h3>
            <p className="text-slate-600">Finding the closest matches using CIE Delta E 2000</p>
          </div>
        )}

        {/* Results Section */}
        {!loadingMatches && matches.length > 0 && (
            <div className="mt-6 bg-slate-50 rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="p-6 border-b border-slate-200 flex items-center justify-between no-print">
                <div>
                  <h3 className="text-lg font-semibold text-slate-800 font-venti">Color Matches</h3>
                  <p className="text-sm text-slate-500 mt-1">{matches.length} source colors matched</p>
                </div>
                <div className="flex-1 flex justify-center items-center">
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={includeTwoColorMix}
                      onChange={(e) => setIncludeTwoColorMix(e.target.checked)}
                      className="theme-checkbox theme-checkbox-small"
                    />
                    <span className="ml-2 text-sm text-slate-700">
                      Include two-color mixes
                    </span>
                  </label>
                </div>
                <div className="flex items-center">
                  <button
                    onClick={() => window.print()}
                    className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 text-sm font-medium hover:bg-slate-100 hover:shadow-md transition-all duration-200 flex items-center space-x-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                    </svg>
                    <span>Print</span>
                  </button>
                </div>
              </div>

              <div className="p-6 print-only hidden print:block">
                <h3 className="text-xl font-semibold text-slate-800 font-venti mb-2">Color Matches</h3>
              </div>

              <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-white">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-800 font-venti">Source Color</th>
                    {targetSets.map((setSize) => (
                      <th key={setSize.id} className="px-6 py-4 text-left text-sm font-semibold text-slate-800 font-venti">
                        {setSize.set?.name || setSize.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {matches.map(({ sourceColor, matches: colorMatches }) => (
                    <tr key={sourceColor.id} className="hover:bg-white transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3">
                          <div
                            className="w-12 h-12 rounded-lg shadow-sm border border-slate-200 flex-shrink-0"
                            style={{ backgroundColor: sourceColor.hex }}
                          ></div>
                          <div>
                            <p className="text-sm font-medium text-slate-800">{sourceColor.name}</p>
                            {sourceColor.color_number && (
                              <p className="text-xs text-slate-400">#{sourceColor.color_number}</p>
                            )}
                            <p className="text-xs text-slate-500 font-mono">{sourceColor.hex}</p>
                          </div>
                        </div>
                      </td>
                      {targetSets.map((setSize) => {
                        const targetSetId = setSize.set?.id || setSize.id;
                        const targetSetSizeId = setSize.id;
                        const matchData = colorMatches.find(m => {
                          // m.set is the targetSetSize object we stored
                          const matchSetSizeId = m.set.id;
                          return matchSetSizeId === targetSetSizeId;
                        });
                        if (!matchData) {
                          return (
                            <td key={setSize.id} className="px-6 py-4">
                              <div className="text-xs text-slate-400">No match</div>
                            </td>
                          );
                        }
                        const { match, error: matchError } = matchData;
                        if (matchError) {
                          return (
                            <td key={setSize.id} className="px-6 py-4">
                              <div className="text-xs text-red-500">Error</div>
                            </td>
                          );
                        }
                        
                        // Display two-color mix
                        if (match.is_mix) {
                          const ratio1 = (1 - match.ratio) * 100;
                          const ratio2 = match.ratio * 100;
                          return (
                            <td key={setSize.id} className="px-6 py-4">
                              <div className="space-y-2">
                                {/* Mixed color swatch */}
                                <div className="flex items-center space-x-3">
                                  <div
                                    className="w-12 h-12 rounded-lg shadow-sm border border-slate-200 flex-shrink-0"
                                    style={{ backgroundColor: match.mixed_hex }}
                                    title={`Mixed: ${match.mixed_hex}`}
                                  ></div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-xs font-medium text-slate-700 mb-1">Two-color mix</p>
                                    <div className="flex items-center space-x-2 mt-1">
                                      <span className={`text-xs px-2 py-0.5 rounded ${getMatchQualityColor(match.match_quality)}`}>
                                        {match.match_quality.replace(/_/g, ' ')}
                                      </span>
                                      <span className="text-xs text-slate-400">
                                        {deltaEToPercentage(match.delta_e)}% match
                                      </span>
                                    </div>
                                  </div>
                                </div>
                                {/* Color 1 */}
                                <div className="flex items-center space-x-2 pl-2 border-l-2 border-slate-200">
                                  <div
                                    className="w-8 h-8 rounded shadow-sm border border-slate-200 flex-shrink-0"
                                    style={{ backgroundColor: match.color1.hex }}
                                  ></div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-xs font-medium text-slate-800">{match.color1.name}</p>
                                    {match.color1.color_number && (
                                      <p className="text-xs text-slate-400">#{match.color1.color_number}</p>
                                    )}
                                    <p className="text-xs text-slate-500 font-mono">{match.color1.hex}</p>
                                  </div>
                                  <span className="text-xs font-semibold text-slate-600">{Math.round(ratio1)}%</span>
                                </div>
                                {/* Color 2 */}
                                <div className="flex items-center space-x-2 pl-2 border-l-2 border-slate-200">
                                  <div
                                    className="w-8 h-8 rounded shadow-sm border border-slate-200 flex-shrink-0"
                                    style={{ backgroundColor: match.color2.hex }}
                                  ></div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-xs font-medium text-slate-800">{match.color2.name}</p>
                                    {match.color2.color_number && (
                                      <p className="text-xs text-slate-400">#{match.color2.color_number}</p>
                                    )}
                                    <p className="text-xs text-slate-500 font-mono">{match.color2.hex}</p>
                                  </div>
                                  <span className="text-xs font-semibold text-slate-600">{Math.round(ratio2)}%</span>
                                </div>
                              </div>
                            </td>
                          );
                        }
                        
                        // Display single color match
                        return (
                          <td key={setSize.id} className="px-6 py-4">
                            <div className="flex items-center space-x-3">
                              <div
                                className="w-12 h-12 rounded-lg shadow-sm border border-slate-200 flex-shrink-0"
                                style={{ backgroundColor: match.hex }}
                              ></div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-slate-800">{match.name}</p>
                                {match.color_number && (
                                  <p className="text-xs text-slate-400">#{match.color_number}</p>
                                )}
                                <p className="text-xs text-slate-500 font-mono">{match.hex}</p>
                                <div className="flex items-center space-x-2 mt-1">
                                  <span className={`text-xs px-2 py-0.5 rounded ${getMatchQualityColor(match.match_quality)}`}>
                                    {match.match_quality.replace(/_/g, ' ')}
                                  </span>
                                  <span className="text-xs text-slate-400">
                                    {deltaEToPercentage(match.delta_e)}% match
                                  </span>
                                </div>
                              </div>
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            </div>
        )}

        {/* Empty State */}
        {!sourceSet && (
          <div className="bg-white p-12 text-center">
            <div className="text-6xl mb-4">🎨</div>
            <h3 className="text-xl font-semibold text-slate-800 mb-2 font-venti">No Source Set Selected</h3>
            <p className="text-slate-600">Select a source set to begin comparing colors</p>
          </div>
        )}

        {sourceSet && targetSets.length === 0 && (
          <div className="bg-white p-12 text-center">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-semibold text-slate-800 mb-2 font-venti">No Target Sets Selected</h3>
            <p className="text-slate-600">Add up to 5 target sets to compare colors</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ColorConversion;

