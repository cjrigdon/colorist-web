import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DropdownMenu from './DropdownMenu';
import { coloredPencilSetsAPI, brandsAPI, apiGet } from '../services/api';
import { deltaEToPercentage, prefersDarkText } from '../utils/colorUtils';
import AdSpace from './AdSpace';

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

const ColorCard = ({ hex, title, colorNumber, match, badge, compact = false }) => {
  const dark = prefersDarkText(hex);
  const textClass = dark ? 'text-slate-900' : 'text-white';
  const subTextClass = dark ? 'text-slate-800/80' : 'text-white/85';
  const sizeClass = compact ? 'min-w-[6rem] min-h-[5.5rem] p-2.5 gap-2' : 'min-w-[13rem] min-h-[8rem] p-4 gap-3';

  return (
    <div
      className={`w-full rounded-xl shadow-sm border border-black/10 flex flex-col justify-between ${sizeClass} ${textClass}`}
      style={{ backgroundColor: hex }}
      title={hex}
    >
      <div className="min-w-0">
        <p className={`${compact ? 'text-xs' : 'text-base'} font-semibold leading-tight break-words`}>{title}</p>
        {colorNumber && <p className={`text-xs mt-1 ${subTextClass}`}>#{colorNumber}</p>}
        <p className={`text-xs font-mono mt-0.5 ${subTextClass}`}>{hex}</p>
      </div>
      {(match || badge) && (
        <div className="flex flex-wrap items-center gap-2">
          {match && (
            <>
              <span className={`text-xs font-medium px-2 py-0.5 rounded shadow-sm ${getMatchQualityColor(match.match_quality)}`}>
                {match.match_quality.replace(/_/g, ' ')}
              </span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-white/85 text-slate-800 shadow-sm">
                {deltaEToPercentage(match.delta_e)}% match
              </span>
            </>
          )}
          {badge && (
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-white/85 text-slate-800 shadow-sm">
              {badge}
            </span>
          )}
        </div>
      )}
    </div>
  );
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

const API_ORIGIN = process.env.REACT_APP_API_BASE_URL?.replace('/api', '') || 'http://localhost:8000';

const storageUrl = (path) => {
  if (!path) return null;
  return path.startsWith('http') ? path : `${API_ORIGIN}/storage/${path}`;
};

const THUMB_ICONS = {
  pencil: 'M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z',
  brand: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4',
};

const Thumb = ({ src, alt, className = 'w-10 h-10', icon = 'pencil' }) => {
  const [failed, setFailed] = useState(false);
  const url = storageUrl(src);

  useEffect(() => {
    setFailed(false);
  }, [src]);

  if (url && !failed) {
    return (
      <img
        src={url}
        alt={alt}
        className={`${className} object-cover rounded-lg flex-shrink-0 bg-white`}
        onError={() => setFailed(true)}
      />
    );
  }
  return (
    <div className={`${className} rounded-lg flex items-center justify-center flex-shrink-0 bg-slate-100`}>
      <svg className="w-1/2 h-1/2 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={THUMB_ICONS[icon]} />
      </svg>
    </div>
  );
};

const getPencilCount = (setSize) => setSize.pencils?.length || setSize.count || 0;
const setSizeThumb = (setSize) => setSize.thumb || setSize.set?.thumb || null;
const setSizeName = (setSize) => setSize.set?.name || setSize.name;
const setSizeMeta = (setSize) =>
  [setSize.set?.brand || setSize.brand, `${getPencilCount(setSize)} colors`].filter(Boolean).join(' · ');

const ChevronIcon = ({ direction, className = 'w-4 h-4' }) => {
  const paths = { left: 'M15 19l-7-7 7-7', right: 'M9 5l7 7-7 7', up: 'M5 15l7-7 7 7', down: 'M19 9l-7 7-7-7' };
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={paths[direction]} />
    </svg>
  );
};

const PickerStatus = ({ children }) => (
  <div className="text-center py-4 text-slate-500 text-sm">{children}</div>
);

const SetPicker = ({
  step,
  brands,
  loadingBrands,
  brand,
  sets,
  loadingSets,
  set,
  sizes,
  loadingSizes,
  emptySizesText,
  onBack,
  onBrandSelect,
  onSetSelect,
  onSizeSelect,
}) => {
  const title = {
    brand: 'Select a brand',
    set: `Select a set for ${brand?.name || ''}`,
    size: `Select a size for ${set?.name || ''}`,
  }[step];
  const rowClass = 'w-full flex items-center gap-2.5 rounded-lg border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-colors text-left';

  return (
    <div>
      <div className="flex items-center gap-1 mb-1.5 min-h-[1.5rem]">
        {step !== 'brand' && (
          <button
            type="button"
            onClick={onBack}
            aria-label="Back"
            className="p-0.5 -ml-1 rounded text-slate-500 hover:text-slate-800 hover:bg-slate-200 transition-colors"
          >
            <ChevronIcon direction="left" />
          </button>
        )}
        <p className="text-sm font-medium text-slate-700 truncate">{title}</p>
      </div>

      <div className="bg-white border border-slate-200 rounded-lg p-1.5 max-h-56 overflow-y-auto">
        {step === 'brand' && (
          loadingBrands ? <PickerStatus>Loading brands...</PickerStatus>
          : brands.length === 0 ? <PickerStatus>No brands available</PickerStatus>
          : (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5">
              {brands.map((b) => (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => onBrandSelect(b)}
                  className="flex flex-col items-center gap-1 p-2 rounded-lg border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-colors"
                >
                  <Thumb src={b.thumbnail} alt={b.name} className="w-9 h-9" icon="brand" />
                  <span className="text-[11px] font-medium text-slate-800 text-center leading-tight">{b.name}</span>
                </button>
              ))}
            </div>
          )
        )}

        {step === 'set' && (
          loadingSets ? <PickerStatus>Loading sets...</PickerStatus>
          : sets.length === 0 ? <PickerStatus>No sets available for this brand</PickerStatus>
          : (
            <div className="space-y-1">
              {sets.map((s) => (
                <button key={s.id} type="button" onClick={() => onSetSelect(s)} className={`${rowClass} px-2.5 py-2`}>
                  <span className="flex-1 min-w-0 text-sm font-medium text-slate-800 truncate">{s.name || 'Unknown'}</span>
                  <span className="text-xs text-slate-500 whitespace-nowrap">
                    {s.sizeCount} size{s.sizeCount !== 1 ? 's' : ''}
                  </span>
                  <ChevronIcon direction="right" className="w-4 h-4 text-slate-400 flex-shrink-0" />
                </button>
              ))}
            </div>
          )
        )}

        {step === 'size' && (
          loadingSizes ? <PickerStatus>Loading sizes...</PickerStatus>
          : sizes.length === 0 ? <PickerStatus>{emptySizesText}</PickerStatus>
          : (
            <div className="space-y-1">
              {sizes.map((setSize) => (
                <button key={setSize.id} type="button" onClick={() => onSizeSelect(setSize)} className={`${rowClass} px-2 py-1.5`}>
                  <Thumb src={setSizeThumb(setSize)} alt={setSize.name || `${setSize.count} pencils`} className="w-9 h-9" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-slate-800 truncate">{setSize.name || `${setSize.count} pencils`}</div>
                    <div className="text-xs text-slate-500">{setSize.count} pencils</div>
                  </div>
                </button>
              ))}
            </div>
          )
        )}
      </div>
    </div>
  );
};

const SelectedSet = ({ setSize, action }) => (
  <div className="flex items-center gap-2.5 p-2 bg-white rounded-lg border border-slate-200">
    <Thumb src={setSizeThumb(setSize)} alt={setSizeName(setSize)} className="w-11 h-11" />
    <div className="flex-1 min-w-0">
      <p className="text-sm font-medium text-slate-800 truncate">{setSizeName(setSize)}</p>
      <p className="text-xs text-slate-500 truncate">{setSizeMeta(setSize)}</p>
    </div>
    {action}
  </div>
);

const SetChip = ({ setSize }) => (
  <span className="inline-flex items-center gap-2 pl-1 pr-2.5 py-1 bg-white border border-slate-200 rounded-lg max-w-[16rem]">
    <Thumb src={setSizeThumb(setSize)} alt={setSizeName(setSize)} className="w-7 h-7" />
    <span className="min-w-0">
      <span className="block text-xs font-medium text-slate-800 truncate">{setSizeName(setSize)}</span>
      <span className="block text-[11px] text-slate-500 truncate">{getPencilCount(setSize)} colors</span>
    </span>
  </span>
);

const SetColumnHeader = ({ setSize, caption }) => (
  <div className="flex items-center gap-3 min-w-[13rem]">
    <Thumb src={setSizeThumb(setSize)} alt={setSizeName(setSize)} className="w-12 h-12" />
    <div className="min-w-0">
      <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">{caption}</p>
      <p className="text-sm font-semibold text-slate-800 font-venti leading-tight">{setSizeName(setSize)}</p>
      <p className="text-xs font-normal text-slate-500">{setSizeMeta(setSize)}</p>
    </div>
  </div>
);

const ColorConversion = ({ user }) => {
  const navigate = useNavigate();
  const isFreePlan = user?.subscription_plan === 'free' || !user?.subscription_plan;
  const [sourceSet, setSourceSet] = useState(null);
  const [targetSets, setTargetSets] = useState([]);
  const [error, setError] = useState(null);
  const [matches, setMatches] = useState([]);
  const [loadingMatches, setLoadingMatches] = useState(false);
  const [includeTwoColorMix, setIncludeTwoColorMix] = useState(false);
  const [setsCollapsed, setSetsCollapsed] = useState(false);

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

  // Reset two-color mix option when target sets change or if free plan
  useEffect(() => {
    if (targetSets.length !== 1 || isFreePlan) {
      setIncludeTwoColorMix(false);
    }
  }, [targetSets.length, isFreePlan]);

  // Handle print events to manage allow-print class
  useEffect(() => {
    const handleAfterPrint = () => {
      document.body.classList.remove('allow-print');
    };

    window.addEventListener('afterprint', handleAfterPrint);

    return () => {
      window.removeEventListener('afterprint', handleAfterPrint);
      // Cleanup: remove class on unmount
      document.body.classList.remove('allow-print');
    };
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
        'filter[is_system]': '1',
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
      const response = await coloredPencilSetsAPI.getAvailableSetSizes(1, 100, true, {
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
        'filter[is_system]': '1',
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
      // Build URL manually to verify the parameter format
      const params = new URLSearchParams({ 
        page: '1', 
        per_page: '100',
        all: 'true',
        exclude_pencils: 'true',
        'filter[colored_pencil_set_id]': setId.toString()
      });
      const response = await coloredPencilSetsAPI.getAvailableSetSizes(1, 100, true, {
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
    const maxTargetSets = isFreePlan ? 1 : 5;
    if (targetSets.length < maxTargetSets) {
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
    } else if (isFreePlan && targetSets.length >= 1) {
      // Free plan users trying to add more than 1 target set
      setError('Free plans are limited to 1 target set. Upgrade to compare up to 5 target sets.');
      // Reset target selection
      setTargetStep('brand');
      setTargetSelectedBrand(null);
      setTargetSelectedSet(null);
      setTargetSetsForBrand([]);
      setTargetSizesForSet([]);
      return;
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

  const resetSourceSelection = () => {
    setSourceSet(null);
    setSourceStep('brand');
    setSourceSelectedBrand(null);
    setSourceSelectedSet(null);
    setSourceSetsForBrand([]);
    setSourceSizesForSet([]);
    setError(null);
  };

  const sourceSetId = sourceSet?.set?.id;
  const availableTargetSizes = targetSizesForSet.filter((setSize) => {
    const isSourceSet = sourceSetId && setSize.set?.id === sourceSetId;
    const isAlreadySelected = targetSets.some((ts) => ts.id === setSize.id);
    return !isSourceSet && !isAlreadySelected;
  });
  const maxTargetSets = isFreePlan ? 1 : 5;
  const collapsed = setsCollapsed && !!sourceSet;

  return (
    <div className="space-y-6">
      {/* Selection Section */}
      <div className="bg-white p-4">
        {isFreePlan && (
          <div className="mb-4 p-4 bg-gradient-to-r from-pink-50 to-rose-50 border border-pink-200 rounded-xl flex flex-col sm:flex-row sm:items-center gap-3">
            <svg className="w-5 h-5 text-pink-600 flex-shrink-0 hidden sm:block" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-pink-900">
                Free plans can compare against 1 target set.
              </p>
              <p className="text-xs text-pink-700 mt-0.5">
                Upgrade to compare up to 5 target sets, include two-color mixes, and print your results.
              </p>
            </div>
            <button
              onClick={() => navigate('/subscription')}
              className="px-4 py-2 text-white rounded-lg text-sm font-medium transition-colors whitespace-nowrap self-start sm:self-auto"
              style={{ backgroundColor: '#ea3663' }}
              onMouseEnter={(e) => (e.target.style.backgroundColor = '#d12a4f')}
              onMouseLeave={(e) => (e.target.style.backgroundColor = '#ea3663')}
            >
              Upgrade Now
            </button>
          </div>
        )}
        <div className={`grid gap-4 ${isFreePlan ? 'grid-cols-1 lg:grid-cols-[minmax(0,1fr)_auto]' : 'grid-cols-1'}`}>
          <div className="min-w-0">
          {/* Set Selection */}
          {collapsed ? (
            <button
              type="button"
              onClick={() => setSetsCollapsed(false)}
              className="w-full flex items-center gap-3 p-2 bg-slate-50 border border-slate-200 rounded-xl text-left hover:bg-slate-100 transition-colors"
            >
              <div className="flex-1 min-w-0 flex flex-wrap items-center gap-2">
                <SetChip setSize={sourceSet} />
                <svg className="w-4 h-4 text-slate-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
                {targetSets.length > 0 ? (
                  targetSets.map((setSize) => <SetChip key={setSize.id} setSize={setSize} />)
                ) : (
                  <span className="text-xs text-slate-500">No target sets yet</span>
                )}
              </div>
              <span className="flex items-center gap-1 px-2 text-xs font-medium text-slate-600 whitespace-nowrap">
                Edit sets
                <ChevronIcon direction="down" />
              </span>
            </button>
          ) : (
          <div>
          {sourceSet && (
            <div className="flex justify-end -mt-1 mb-1.5">
              <button
                type="button"
                onClick={() => setSetsCollapsed(true)}
                className="flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-slate-800 transition-colors"
              >
                Collapse set selection
                <ChevronIcon direction="up" />
              </button>
            </div>
          )}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {/* Source Set Selection */}
          <div className="bg-slate-50 rounded-xl border border-slate-200 p-3">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-base font-semibold text-slate-800 font-venti">Source Set</h3>
              {sourceSet && (
                <button
                  type="button"
                  onClick={resetSourceSelection}
                  className="text-xs text-slate-500 hover:text-slate-700 underline"
                >
                  Change
                </button>
              )}
            </div>

            {sourceSet ? (
              <SelectedSet setSize={sourceSet} />
            ) : (
              <SetPicker
                step={sourceStep}
                brands={brands}
                loadingBrands={loadingBrands}
                brand={sourceSelectedBrand}
                sets={sourceSetsForBrand}
                loadingSets={loadingSourceSets}
                set={sourceSelectedSet}
                sizes={sourceSizesForSet}
                loadingSizes={loadingSourceSizes}
                emptySizesText="No sizes available for this set"
                onBack={handleSourceBack}
                onBrandSelect={handleSourceBrandSelect}
                onSetSelect={handleSourceSetSelect}
                onSizeSelect={handleSourceSizeSelect}
              />
            )}
          </div>

          {/* Target Sets Selection */}
          <div className="bg-slate-50 rounded-xl border border-slate-200 p-3">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-base font-semibold text-slate-800 font-venti">Target Sets</h3>
              <span className="text-xs text-slate-500">{targetSets.length}/{maxTargetSets} selected</span>
            </div>

            {targetSets.length > 0 && (
              <div className={`space-y-1.5 ${targetSets.length < maxTargetSets ? 'mb-3' : ''}`}>
                {targetSets.map((setSize) => (
                  <SelectedSet
                    key={setSize.id}
                    setSize={setSize}
                    action={
                      <button
                        type="button"
                        onClick={() => handleRemoveTargetSet(setSize.id)}
                        aria-label={`Remove ${setSizeName(setSize)}`}
                        className="p-1.5 text-slate-400 hover:text-red-500 transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    }
                  />
                ))}
              </div>
            )}

            {targetSets.length < maxTargetSets && (
              <SetPicker
                step={targetStep}
                brands={brands}
                loadingBrands={loadingBrands}
                brand={targetSelectedBrand}
                sets={targetSetsForBrand}
                loadingSets={loadingTargetSets}
                set={targetSelectedSet}
                sizes={availableTargetSizes}
                loadingSizes={loadingTargetSizes}
                emptySizesText={
                  targetSizesForSet.length > 0
                    ? 'All available sizes are already selected or match the source set'
                    : 'No sizes available for this set'
                }
                onBack={handleTargetBack}
                onBrandSelect={handleTargetBrandSelect}
                onSetSelect={handleTargetSetSelect}
                onSizeSelect={handleTargetSizeSelect}
              />
            )}
          </div>
          </div>
          </div>
          )}
        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mt-4">
            <div className="flex items-start justify-between">
              <p className="text-sm text-red-600 flex-1">{error}</p>
              {isFreePlan && error.includes('Free plans are limited') && (
                <button
                  onClick={() => navigate('/subscription')}
                  className="ml-4 text-sm font-semibold text-pink-600 hover:text-pink-700 underline whitespace-nowrap"
                >
                  Upgrade Now →
                </button>
              )}
            </div>
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
            <p className="text-slate-600">Finding the closest matches</p>
          </div>
        )}

        {/* Results Section */}
        {!loadingMatches && matches.length > 0 && (
            <div className="print-section mt-4 bg-slate-50 rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="p-6 border-b border-slate-200 flex items-center justify-between no-print">
                <div>
                  <h3 className="text-lg font-semibold text-slate-800 font-venti">Color Matches</h3>
                  <p className="text-sm text-slate-500 mt-1">{matches.length} source colors matched</p>
                </div>
                {targetSets.length === 1 && !isFreePlan && (
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
                )}
                {!isFreePlan && (
                  <div className="flex items-center">
                    <button
                      onClick={() => {
                        // Add allow-print class to body to enable printing
                        document.body.classList.add('allow-print');
                        // Trigger print dialog
                        window.print();
                        // The afterprint event will remove the class
                      }}
                      className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 text-sm font-medium hover:bg-slate-100 hover:shadow-md transition-all duration-200 flex items-center space-x-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                      </svg>
                      <span>Print</span>
                    </button>
                  </div>
                )}
              </div>

              <div className="p-6 print-only hidden print:block">
                <h3 className="text-xl font-semibold text-slate-800 font-venti mb-2">Color Matches</h3>
              </div>

              <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-white">
                  <tr>
                    <th className="px-6 py-4 text-left align-bottom border-r-4 border-slate-300">
                      <SetColumnHeader setSize={sourceSet} caption="Source" />
                    </th>
                    {targetSets.map((setSize) => (
                      <th key={setSize.id} className="px-6 py-4 text-left align-bottom">
                        <SetColumnHeader setSize={setSize} caption="Target" />
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {matches.map(({ sourceColor, matches: colorMatches }) => (
                    <tr key={sourceColor.id} className="hover:bg-white transition-colors">
                      <td className="px-6 py-4 align-top bg-white border-r-4 border-slate-300">
                        <ColorCard
                          hex={sourceColor.hex}
                          title={sourceColor.name}
                          colorNumber={sourceColor.color_number}
                        />
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
                            <td key={setSize.id} className="px-6 py-4 align-top">
                              <div className="text-xs text-slate-400">No match</div>
                            </td>
                          );
                        }
                        const { match, error: matchError } = matchData;
                        if (matchError) {
                          return (
                            <td key={setSize.id} className="px-6 py-4 align-top">
                              <div className="text-xs text-red-500">Error</div>
                            </td>
                          );
                        }
                        
                        // Display two-color mix
                        if (match.is_mix) {
                          const ratio1 = (1 - match.ratio) * 100;
                          const ratio2 = match.ratio * 100;
                          return (
                            <td key={setSize.id} className="px-6 py-4 align-top">
                              <div className="space-y-2">
                                <ColorCard hex={match.mixed_hex} title="Two-color mix" match={match} />
                                <div className="grid grid-cols-2 gap-2">
                                  <ColorCard
                                    compact
                                    hex={match.color1.hex}
                                    title={match.color1.name}
                                    colorNumber={match.color1.color_number}
                                    badge={`${Math.round(ratio1)}%`}
                                  />
                                  <ColorCard
                                    compact
                                    hex={match.color2.hex}
                                    title={match.color2.name}
                                    colorNumber={match.color2.color_number}
                                    badge={`${Math.round(ratio2)}%`}
                                  />
                                </div>
                              </div>
                            </td>
                          );
                        }
                        
                        // Display single color match
                        return (
                          <td key={setSize.id} className="px-6 py-4 align-top">
                            <ColorCard
                              hex={match.hex}
                              title={match.name}
                              colorNumber={match.color_number}
                              match={match}
                            />
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
            <p className="text-slate-600">Add {isFreePlan ? '1' : 'up to 5'} target set{isFreePlan ? '' : 's'} to compare colors</p>
          </div>
        )}
          </div>
          {/* Ad Space on Right Side for Free Plan */}
          {isFreePlan && (
            <div className="hidden lg:flex lg:flex-col lg:items-center lg:justify-start lg:sticky lg:top-24 lg:self-start">
              <AdSpace width={160} height={600} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ColorConversion;

