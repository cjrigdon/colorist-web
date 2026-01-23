import React, { useState, useEffect } from 'react';
import DropdownMenu from './DropdownMenu';
import { coloredPencilSetsAPI, brandsAPI, apiGet } from '../services/api';
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
  const [error, setError] = useState(null);
  const [matches, setMatches] = useState([]);
  const [loadingMatches, setLoadingMatches] = useState(false);
  const [includeTwoColorMix, setIncludeTwoColorMix] = useState(false);

  // Source set selection state
  const [sourceStep, setSourceStep] = useState('brand'); // 'brand', 'set', 'size'
  const [brands, setBrands] = useState([]);
  const [loadingBrands, setLoadingBrands] = useState(false);
  const [sourceSelectedBrand, setSourceSelectedBrand] = useState(null);
  const [sourceSetsForBrand, setSourceSetsForBrand] = useState([]);
  const [loadingSourceSets, setLoadingSourceSets] = useState(false);
  const [sourceSelectedSet, setSourceSelectedSet] = useState(null);
  const [sourceSizesForSet, setSourceSizesForSet] = useState([]);
  const [loadingSourceSizes, setLoadingSourceSizes] = useState(false);

  // Target set selection state
  const [targetStep, setTargetStep] = useState('brand'); // 'brand', 'set', 'size'
  const [targetSelectedBrand, setTargetSelectedBrand] = useState(null);
  const [targetSetsForBrand, setTargetSetsForBrand] = useState([]);
  const [loadingTargetSets, setLoadingTargetSets] = useState(false);
  const [targetSelectedSet, setTargetSelectedSet] = useState(null);
  const [targetSizesForSet, setTargetSizesForSet] = useState([]);
  const [loadingTargetSizes, setLoadingTargetSizes] = useState(false);

  // Fetch brands on mount
  useEffect(() => {
    const fetchBrands = async () => {
      try {
        setLoadingBrands(true);
        const response = await brandsAPI.getAll(1, 100);
        let brandsData = [];
        if (Array.isArray(response)) {
          brandsData = response;
        } else if (response.data && Array.isArray(response.data)) {
          brandsData = response.data;
        }
        setBrands(brandsData);
      } catch (err) {
        console.error('Error fetching brands:', err);
        setError('Failed to load brands. Please try again.');
      } finally {
        setLoadingBrands(false);
      }
    };

    fetchBrands();
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

  // Source set handlers
  const fetchSourceSetsForBrand = async (brandId) => {
    try {
      setLoadingSourceSets(true);
      setError(null);
      const params = new URLSearchParams({ 
        page: '1', 
        per_page: '100',
        'filter[brand_id]': brandId.toString(),
        exclude_pencils: 'true'
      });
      const data = await apiGet(`/colored-pencil-sets?${params.toString()}`, true);
      
      let setsData = [];
      if (Array.isArray(data)) {
        setsData = data;
      } else if (data.data && Array.isArray(data.data)) {
        setsData = data.data;
      }
      
      const setsWithSizeCounts = setsData.map(set => ({
        ...set,
        sizeCount: set.sizes_count || 0
      }));
      
      setSourceSetsForBrand(setsWithSizeCounts);
    } catch (err) {
      console.error('Error fetching sets for brand:', err);
      setError('Failed to load sets for this brand');
    } finally {
      setLoadingSourceSets(false);
    }
  };

  const fetchSourceSizesForSet = async (setId) => {
    try {
      setLoadingSourceSizes(true);
      setError(null);
      const response = await coloredPencilSetsAPI.getAvailableSetSizes(1, 100, false, {
        setId: setId,
        excludePencils: true
      });
      let sizesForThisSet = [];
      if (Array.isArray(response)) {
        sizesForThisSet = response;
      } else if (response.data && Array.isArray(response.data)) {
        sizesForThisSet = response.data;
      }
      
      setSourceSizesForSet(sizesForThisSet);
    } catch (err) {
      console.error('Error fetching sizes for set:', err);
      setError('Failed to load sizes for this set');
    } finally {
      setLoadingSourceSizes(false);
    }
  };

  const handleSourceBrandSelect = (brand) => {
    setSourceSelectedBrand(brand);
    setSourceSelectedSet(null);
    setSourceSet(null);
    setSourceSizesForSet([]);
    setError(null);
    fetchSourceSetsForBrand(brand.id);
    setSourceStep('set');
  };

  const handleSourceSetSelect = (set) => {
    setSourceSelectedSet(set);
    setSourceSet(null);
    setError(null);
    fetchSourceSizesForSet(set.id);
    setSourceStep('size');
  };

  const handleSourceSizeSelect = (setSize) => {
    setSourceSet(setSize);
    setError(null);
    // Remove source set from target sets if it was selected
    if (setSize) {
      const sourceSetId = setSize.set?.id || setSize.id;
      setTargetSets(targetSets.filter(ts => {
        const targetSetId = ts.set?.id || ts.id;
        return targetSetId !== sourceSetId;
      }));
    }
    // Reset source selection to allow changing
    setSourceStep('brand');
    setSourceSelectedBrand(null);
    setSourceSelectedSet(null);
    setSourceSetsForBrand([]);
    setSourceSizesForSet([]);
  };

  const handleSourceBack = () => {
    setError(null);
    if (sourceStep === 'size') {
      setSourceStep('set');
      setSourceSelectedSet(null);
      setSourceSizesForSet([]);
    } else if (sourceStep === 'set') {
      setSourceStep('brand');
      setSourceSelectedBrand(null);
      setSourceSelectedSet(null);
      setSourceSetsForBrand([]);
      setSourceSizesForSet([]);
    }
  };

  // Target set handlers
  const fetchTargetSetsForBrand = async (brandId) => {
    try {
      setLoadingTargetSets(true);
      setError(null);
      const params = new URLSearchParams({ 
        page: '1', 
        per_page: '100',
        'filter[brand_id]': brandId.toString(),
        exclude_pencils: 'true'
      });
      const data = await apiGet(`/colored-pencil-sets?${params.toString()}`, true);
      
      let setsData = [];
      if (Array.isArray(data)) {
        setsData = data;
      } else if (data.data && Array.isArray(data.data)) {
        setsData = data.data;
      }
      
      const setsWithSizeCounts = setsData.map(set => ({
        ...set,
        sizeCount: set.sizes_count || 0
      }));
      
      setTargetSetsForBrand(setsWithSizeCounts);
    } catch (err) {
      console.error('Error fetching sets for brand:', err);
      setError('Failed to load sets for this brand');
    } finally {
      setLoadingTargetSets(false);
    }
  };

  const fetchTargetSizesForSet = async (setId) => {
    try {
      setLoadingTargetSizes(true);
      setError(null);
      const response = await coloredPencilSetsAPI.getAvailableSetSizes(1, 100, false, {
        setId: setId,
        excludePencils: true
      });
      let sizesForThisSet = [];
      if (Array.isArray(response)) {
        sizesForThisSet = response;
      } else if (response.data && Array.isArray(response.data)) {
        sizesForThisSet = response.data;
      }
      
      setTargetSizesForSet(sizesForThisSet);
    } catch (err) {
      console.error('Error fetching sizes for set:', err);
      setError('Failed to load sizes for this set');
    } finally {
      setLoadingTargetSizes(false);
    }
  };

  const handleTargetBrandSelect = (brand) => {
    setTargetSelectedBrand(brand);
    setTargetSelectedSet(null);
    setError(null);
    fetchTargetSetsForBrand(brand.id);
    setTargetStep('set');
  };

  const handleTargetSetSelect = (set) => {
    setTargetSelectedSet(set);
    setError(null);
    fetchTargetSizesForSet(set.id);
    setTargetStep('size');
  };

  const handleTargetSizeSelect = (setSize) => {
    if (targetSets.length < 5) {
      // Check if this set size is already selected
      const isAlreadySelected = targetSets.some(ts => ts.id === setSize.id);
      if (!isAlreadySelected) {
        // Check if source set is selected and prevent selecting the same set
        const sourceSetId = sourceSet?.set?.id || sourceSet?.id;
        const targetSetId = setSize.set?.id || setSize.id;
        if (sourceSetId && targetSetId === sourceSetId) {
          setError('Cannot select the same set as source and target');
          return;
        }
        setTargetSets([...targetSets, setSize]);
        setError(null);
      }
    }
    // Reset target selection to allow adding more
    setTargetStep('brand');
    setTargetSelectedBrand(null);
    setTargetSelectedSet(null);
    setTargetSetsForBrand([]);
    setTargetSizesForSet([]);
  };

  const handleTargetBack = () => {
    setError(null);
    if (targetStep === 'size') {
      setTargetStep('set');
      setTargetSelectedSet(null);
      setTargetSizesForSet([]);
    } else if (targetStep === 'set') {
      setTargetStep('brand');
      setTargetSelectedBrand(null);
      setTargetSelectedSet(null);
      setTargetSetsForBrand([]);
      setTargetSizesForSet([]);
    }
  };

  const handleRemoveTargetSet = (setSizeId) => {
    setTargetSets(targetSets.filter(setSize => setSize.id !== parseInt(setSizeId)));
  };

  const getPencilCount = (setSize) => {
    return setSize.pencils?.length || setSize.count || 0;
  };

  return (
    <div className="space-y-6">
      {/* Selection Section */}
      <div className="bg-white p-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Source Set Selection */}
          <div className="bg-slate-50 rounded-xl shadow-sm border border-slate-200 p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold text-slate-800 font-venti">Source Set</h3>
              {sourceSet && (
                <button
                  onClick={() => {
                    setSourceSet(null);
                    setSourceStep('brand');
                    setSourceSelectedBrand(null);
                    setSourceSelectedSet(null);
                    setSourceSetsForBrand([]);
                    setSourceSizesForSet([]);
                    setError(null);
                  }}
                  className="text-xs text-slate-500 hover:text-slate-700 underline"
                >
                  Change
                </button>
              )}
            </div>
            
            {sourceSet ? (
              <div className="p-3 bg-white rounded-lg">
                <p className="text-sm font-medium text-slate-800">{sourceSet.set?.name || sourceSet.name}</p>
                <p className="text-xs text-slate-500">{sourceSet.set?.brand || sourceSet.brand} - {getPencilCount(sourceSet)} colors</p>
              </div>
            ) : (
              <div className="space-y-3">
                {sourceStep !== 'brand' && (
                  <button
                    onClick={handleSourceBack}
                    className="flex items-center space-x-1 text-sm text-slate-600 hover:text-slate-800 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    <span>Back</span>
                  </button>
                )}
                
                <div className="text-sm font-medium text-slate-700 mb-2">
                  {sourceStep === 'brand' && 'Select a Brand'}
                  {sourceStep === 'set' && `Select a Set for ${sourceSelectedBrand?.name || ''}`}
                  {sourceStep === 'size' && `Select a Size for ${sourceSelectedSet?.name || ''}`}
                </div>

                {/* Step 1: Brand Selection */}
                {sourceStep === 'brand' && (
                  <div className="border border-slate-200 rounded-lg p-3 max-h-60 overflow-y-auto">
                    {loadingBrands ? (
                      <div className="text-center py-4 text-slate-500 text-sm">Loading brands...</div>
                    ) : brands.length === 0 ? (
                      <div className="text-center py-4 text-slate-500 text-sm">No brands available</div>
                    ) : (
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {brands.map((brand) => {
                          const thumbnailUrl = brand.thumbnail 
                            ? (brand.thumbnail.startsWith('http') 
                                ? brand.thumbnail 
                                : `${process.env.REACT_APP_API_BASE_URL?.replace('/api', '') || 'http://localhost:8000'}/storage/${brand.thumbnail}`)
                            : null;
                          
                          return (
                            <button
                              key={brand.id}
                              onClick={() => handleSourceBrandSelect(brand)}
                              className="flex flex-col items-center p-3 rounded-lg border-2 border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-colors"
                            >
                              {thumbnailUrl ? (
                                <img 
                                  src={thumbnailUrl} 
                                  alt={brand.name}
                                  className="w-12 h-12 object-cover rounded-lg mb-1"
                                  onError={(e) => {
                                    e.target.style.display = 'none';
                                    if (e.target.nextSibling) {
                                      e.target.nextSibling.style.display = 'flex';
                                    }
                                  }}
                                />
                              ) : null}
                              <div 
                                className={`w-12 h-12 rounded-lg flex items-center justify-center mb-1 ${thumbnailUrl ? 'hidden' : ''}`}
                                style={{ backgroundColor: '#f1f5f9' }}
                              >
                                <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                </svg>
                              </div>
                              <span className="text-xs font-medium text-slate-800 text-center">{brand.name}</span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {/* Step 2: Set Selection */}
                {sourceStep === 'set' && sourceSelectedBrand && (
                  <div className="border border-slate-200 rounded-lg p-3 max-h-60 overflow-y-auto">
                    {loadingSourceSets ? (
                      <div className="text-center py-4 text-slate-500 text-sm">Loading sets...</div>
                    ) : sourceSetsForBrand.length === 0 ? (
                      <div className="text-center py-4 text-slate-500 text-sm">No sets available for this brand</div>
                    ) : (
                      <div className="space-y-2">
                        {sourceSetsForBrand.map((set) => (
                          <button
                            key={set.id}
                            onClick={() => handleSourceSetSelect(set)}
                            className="w-full flex items-center justify-between p-3 rounded-lg border-2 border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-colors text-left"
                          >
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-medium text-slate-800 truncate">
                                {set.name || 'Unknown'}
                              </div>
                              <div className="text-xs text-slate-600 mt-1">
                                {set.sizeCount} size{set.sizeCount !== 1 ? 's' : ''} available
                              </div>
                            </div>
                            <svg className="w-5 h-5 text-slate-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Step 3: Size Selection */}
                {sourceStep === 'size' && sourceSelectedSet && (
                  <div className="border border-slate-200 rounded-lg p-2 max-h-60 overflow-y-auto">
                    {loadingSourceSizes ? (
                      <div className="text-center py-4 text-slate-500 text-sm">Loading sizes...</div>
                    ) : sourceSizesForSet.length === 0 ? (
                      <div className="text-center py-4 text-slate-500 text-sm">No sizes available for this set</div>
                    ) : (
                      <div className="space-y-2">
                        {sourceSizesForSet.map((setSize) => {
                          const thumbnail = setSize.thumb || setSize.set?.thumb || null;
                          const thumbnailUrl = thumbnail 
                            ? (thumbnail.startsWith('http') ? thumbnail : `${process.env.REACT_APP_API_BASE_URL?.replace('/api', '') || 'http://localhost:8000'}/storage/${thumbnail}`)
                            : null;
                          
                          return (
                            <button
                              key={setSize.id}
                              onClick={() => handleSourceSizeSelect(setSize)}
                              className="w-full flex items-center space-x-3 p-3 rounded-lg border-2 border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-colors text-left"
                            >
                              {thumbnailUrl ? (
                                <img 
                                  src={thumbnailUrl} 
                                  alt={setSize.name || `${setSize.count} pencils`}
                                  className="w-10 h-10 object-cover rounded-lg flex-shrink-0"
                                  onError={(e) => {
                                    e.target.style.display = 'none';
                                    if (e.target.nextSibling) {
                                      e.target.nextSibling.style.display = 'flex';
                                    }
                                  }}
                                />
                              ) : null}
                              <div 
                                className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${thumbnailUrl ? 'hidden' : ''}`}
                                style={{ backgroundColor: '#f1f5f9' }}
                              >
                                <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                </svg>
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="text-sm font-medium text-slate-800 truncate">
                                  {setSize.name || `${setSize.count} pencils`}
                                </div>
                                <div className="text-xs text-slate-600 truncate">
                                  {setSize.count} pencils
                                </div>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
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

            {targetSets.length < 5 && (
              <div className="space-y-3">
                {targetStep !== 'brand' && (
                  <button
                    onClick={handleTargetBack}
                    className="flex items-center space-x-1 text-sm text-slate-600 hover:text-slate-800 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    <span>Back</span>
                  </button>
                )}
                
                <div className="text-sm font-medium text-slate-700 mb-2">
                  {targetStep === 'brand' && 'Select a Brand'}
                  {targetStep === 'set' && `Select a Set for ${targetSelectedBrand?.name || ''}`}
                  {targetStep === 'size' && `Select a Size for ${targetSelectedSet?.name || ''}`}
                </div>

                {/* Step 1: Brand Selection */}
                {targetStep === 'brand' && (
                  <div className="border border-slate-200 rounded-lg p-3 max-h-60 overflow-y-auto">
                    {loadingBrands ? (
                      <div className="text-center py-4 text-slate-500 text-sm">Loading brands...</div>
                    ) : brands.length === 0 ? (
                      <div className="text-center py-4 text-slate-500 text-sm">No brands available</div>
                    ) : (
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {brands.map((brand) => {
                          const thumbnailUrl = brand.thumbnail 
                            ? (brand.thumbnail.startsWith('http') 
                                ? brand.thumbnail 
                                : `${process.env.REACT_APP_API_BASE_URL?.replace('/api', '') || 'http://localhost:8000'}/storage/${brand.thumbnail}`)
                            : null;
                          
                          return (
                            <button
                              key={brand.id}
                              onClick={() => handleTargetBrandSelect(brand)}
                              className="flex flex-col items-center p-3 rounded-lg border-2 border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-colors"
                            >
                              {thumbnailUrl ? (
                                <img 
                                  src={thumbnailUrl} 
                                  alt={brand.name}
                                  className="w-12 h-12 object-cover rounded-lg mb-1"
                                  onError={(e) => {
                                    e.target.style.display = 'none';
                                    if (e.target.nextSibling) {
                                      e.target.nextSibling.style.display = 'flex';
                                    }
                                  }}
                                />
                              ) : null}
                              <div 
                                className={`w-12 h-12 rounded-lg flex items-center justify-center mb-1 ${thumbnailUrl ? 'hidden' : ''}`}
                                style={{ backgroundColor: '#f1f5f9' }}
                              >
                                <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                </svg>
                              </div>
                              <span className="text-xs font-medium text-slate-800 text-center">{brand.name}</span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {/* Step 2: Set Selection */}
                {targetStep === 'set' && targetSelectedBrand && (
                  <div className="border border-slate-200 rounded-lg p-3 max-h-60 overflow-y-auto">
                    {loadingTargetSets ? (
                      <div className="text-center py-4 text-slate-500 text-sm">Loading sets...</div>
                    ) : targetSetsForBrand.length === 0 ? (
                      <div className="text-center py-4 text-slate-500 text-sm">No sets available for this brand</div>
                    ) : (
                      <div className="space-y-2">
                        {targetSetsForBrand.map((set) => (
                          <button
                            key={set.id}
                            onClick={() => handleTargetSetSelect(set)}
                            className="w-full flex items-center justify-between p-3 rounded-lg border-2 border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-colors text-left"
                          >
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-medium text-slate-800 truncate">
                                {set.name || 'Unknown'}
                              </div>
                              <div className="text-xs text-slate-600 mt-1">
                                {set.sizeCount} size{set.sizeCount !== 1 ? 's' : ''} available
                              </div>
                            </div>
                            <svg className="w-5 h-5 text-slate-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Step 3: Size Selection */}
                {targetStep === 'size' && targetSelectedSet && (
                  <div className="border border-slate-200 rounded-lg p-2 max-h-60 overflow-y-auto">
                    {loadingTargetSizes ? (
                      <div className="text-center py-4 text-slate-500 text-sm">Loading sizes...</div>
                    ) : targetSizesForSet.length === 0 ? (
                      <div className="text-center py-4 text-slate-500 text-sm">No sizes available for this set</div>
                    ) : (
                      <div className="space-y-2">
                        {targetSizesForSet.map((setSize) => {
                          // Filter out sizes that are already selected or match the source set
                          const sourceSetId = sourceSet?.set?.id || sourceSet?.id;
                          const targetSetId = setSize.set?.id || setSize.id;
                          const isSourceSet = sourceSetId && targetSetId === sourceSetId;
                          const isAlreadySelected = targetSets.some(ts => ts.id === setSize.id);
                          
                          if (isSourceSet || isAlreadySelected) {
                            return null;
                          }

                          const thumbnail = setSize.thumb || setSize.set?.thumb || null;
                          const thumbnailUrl = thumbnail 
                            ? (thumbnail.startsWith('http') ? thumbnail : `${process.env.REACT_APP_API_BASE_URL?.replace('/api', '') || 'http://localhost:8000'}/storage/${thumbnail}`)
                            : null;
                          
                          return (
                            <button
                              key={setSize.id}
                              onClick={() => handleTargetSizeSelect(setSize)}
                              className="w-full flex items-center space-x-3 p-3 rounded-lg border-2 border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-colors text-left"
                            >
                              {thumbnailUrl ? (
                                <img 
                                  src={thumbnailUrl} 
                                  alt={setSize.name || `${setSize.count} pencils`}
                                  className="w-10 h-10 object-cover rounded-lg flex-shrink-0"
                                  onError={(e) => {
                                    e.target.style.display = 'none';
                                    if (e.target.nextSibling) {
                                      e.target.nextSibling.style.display = 'flex';
                                    }
                                  }}
                                />
                              ) : null}
                              <div 
                                className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${thumbnailUrl ? 'hidden' : ''}`}
                                style={{ backgroundColor: '#f1f5f9' }}
                              >
                                <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                </svg>
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="text-sm font-medium text-slate-800 truncate">
                                  {setSize.name || `${setSize.count} pencils`}
                                </div>
                                <div className="text-xs text-slate-600 truncate">
                                  {setSize.count} pencils
                                </div>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
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

