import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { brandsAPI, coloredPencilSetsAPI, apiGet } from '../services/api';

// Brand button component with thumbnail
const BrandButton = ({ brand, thumbnailUrl, onClick }) => {
  const [imageError, setImageError] = useState(false);
  
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex flex-col items-center p-3 border border-slate-200 rounded-lg hover:border-slate-300 hover:bg-slate-50 transition-all"
    >
      {thumbnailUrl && !imageError ? (
        <img 
          src={thumbnailUrl} 
          alt={brand.name}
          className="w-16 h-16 object-contain mb-2"
          onError={() => setImageError(true)}
        />
      ) : (
        <div 
          className="w-16 h-16 flex items-center justify-center mb-2 rounded"
          style={{ backgroundColor: '#f1f5f9' }}
        >
          <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
        </div>
      )}
      <span className="text-sm text-slate-700 text-center">{brand.name}</span>
    </button>
  );
};

// Size button component with thumbnail
const SizeButton = ({ size, onSelectSet, isSelected = false }) => {
  const [imageError, setImageError] = useState(false);
  const thumbnail = size.thumb || size.set?.thumb;
  const thumbnailUrl = thumbnail 
    ? (thumbnail.startsWith('http') ? thumbnail : `${process.env.REACT_APP_API_BASE_URL?.replace('/api', '') || 'http://localhost:8000'}/storage/${thumbnail}`)
    : null;
  
  return (
    <div className="relative flex flex-col items-center">
      <button
        type="button"
        className={`flex flex-col items-center p-3 border-2 rounded-lg transition-all w-full min-h-[235px] ${
          isSelected
            ? 'border-slate-800 bg-slate-100 shadow-md'
            : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
        }`}
        onClick={onSelectSet}
      >
        {thumbnailUrl && !imageError ? (
          <img 
            src={thumbnailUrl} 
            alt={`${size.set?.brand?.name || size.set?.brand || 'Unknown'} ${size.set?.name || size.name || 'Set'}`}
            className="w-full h-32 object-cover rounded-lg mb-2 flex-shrink-0"
            onError={() => setImageError(true)}
          />
        ) : (
          <div 
            className="flex items-center justify-center w-full h-32 rounded-lg mb-2 flex-shrink-0"
            style={{ backgroundColor: '#f1f5f9' }}
          >
            <svg className="w-12 h-12 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
          </div>
        )}
        <div className="flex-1 w-full flex flex-col">
          <h4 className="font-medium text-slate-800 mb-1 line-clamp-2 text-sm">{size.set?.name || size.name || 'Unknown'}</h4>
          <p className="text-xs text-slate-600 mb-2 line-clamp-1">
            {size.name || `${size.count || 0}-piece set`}
          </p>
          <span className="inline-block text-xs text-slate-500 bg-slate-200 px-2 py-0.5 rounded-full font-medium mt-auto">
            {size.count || 0} pencils
          </span>
        </div>
      </button>
      
      {/* Selected indicator overlay */}
      {isSelected && (
        <div className="absolute top-1 right-1 bg-slate-800 text-white rounded-full p-1 z-10">
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        </div>
      )}
    </div>
  );
};

const PencilSelector = ({ 
  value = { setIds: [], sizeIds: [] }, 
  onChange, 
  label = "Pencil Set",
  multiple = true
}) => {
  // Debug: Log the value prop to see what we're receiving
  useEffect(() => {
    console.log('PencilSelector value prop:', value);
    console.log('PencilSelector sizeIds:', value.sizeIds);
    console.log('PencilSelector setIds:', value.setIds);
  }, [value]);
  const [pencilSetStep, setPencilSetStep] = useState('brand'); // 'brand', 'set', 'size'
  const [userSetSizes, setUserSetSizes] = useState([]);
  const [loadingUserSets, setLoadingUserSets] = useState(false);
  const [brands, setBrands] = useState([]);
  const [loadingBrands, setLoadingBrands] = useState(false);
  const [selectedBrand, setSelectedBrand] = useState(null);
  const [setsForBrand, setSetsForBrand] = useState([]);
  const [loadingSets, setLoadingSets] = useState(false);
  const [selectedSet, setSelectedSet] = useState(null);
  const [sizesForSet, setSizesForSet] = useState([]);
  const [loadingSizes, setLoadingSizes] = useState(false);

  // Fetch user's set sizes on mount
  useEffect(() => {
    const fetchUserSetSizes = async () => {
      try {
        setLoadingUserSets(true);
        // Get all user's set sizes (this endpoint filters by user automatically)
        const response = await coloredPencilSetsAPI.getAll(1, 1000, true); // excludePencils = true
        
        console.log('PencilSelector - API response:', response);
        console.log('PencilSelector - Response type:', typeof response);
        console.log('PencilSelector - Is array:', Array.isArray(response));
        console.log('PencilSelector - Has data property:', response?.data);
        console.log('PencilSelector - Data is array:', Array.isArray(response?.data));
        
        let setSizesData = [];
        if (Array.isArray(response)) {
          setSizesData = response;
        } else if (response && response.data && Array.isArray(response.data)) {
          setSizesData = response.data;
        } else if (response && typeof response === 'object') {
          // Try to extract data from various possible structures
          if (Array.isArray(response.items)) {
            setSizesData = response.items;
          } else if (Array.isArray(response.results)) {
            setSizesData = response.results;
          }
        }
        
        console.log('PencilSelector - Extracted setSizesData:', setSizesData);
        console.log('PencilSelector - Set sizes count:', setSizesData.length);
        
        setUserSetSizes(setSizesData);
      } catch (error) {
        console.error('Error fetching user set sizes:', error);
        console.error('Error details:', error.data || error.message);
        setUserSetSizes([]);
      } finally {
        setLoadingUserSets(false);
      }
    };
    
    fetchUserSetSizes();
  }, []);

  // Extract unique brands from user's set sizes
  const userBrands = useMemo(() => {
    const brandMap = new Map();
    userSetSizes.forEach(setSize => {
      // Try brand_data first (object with id), then fall back to brand (string) or colored_pencil_set
      const brand = setSize.set?.brand_data || 
                    setSize.set?.brand || 
                    setSize.colored_pencil_set?.brand_data ||
                    setSize.colored_pencil_set?.brand;
      
      // Handle both object (with id) and string (brand name) formats
      if (brand) {
        let brandId, brandName, brandThumbnail;
        
        if (typeof brand === 'object' && brand.id) {
          // Brand is an object with id
          brandId = brand.id;
          brandName = brand.name;
          brandThumbnail = brand.thumbnail;
        } else if (typeof brand === 'string') {
          // Brand is a string (legacy format), use the string as both id and name
          // We need to find or create a brand entry
          brandId = brand;
          brandName = brand;
          brandThumbnail = null;
        }
        
        if (brandId && !brandMap.has(brandId)) {
          brandMap.set(brandId, {
            id: brandId,
            name: brandName || brandId,
            thumbnail: brandThumbnail || null
          });
        }
      }
    });
    return Array.from(brandMap.values());
  }, [userSetSizes]);

  // Extract unique sets from user's set sizes
  const userSets = useMemo(() => {
    const setMap = new Map();
    userSetSizes.forEach(setSize => {
      const set = setSize.set || setSize.colored_pencil_set;
      if (set && set.id) {
        if (!setMap.has(set.id)) {
          setMap.set(set.id, set);
        }
      }
    });
    const sets = Array.from(setMap.values());
    console.log('PencilSelector - Extracted userSets:', sets);
    console.log('PencilSelector - User sets count:', sets.length);
    return sets;
  }, [userSetSizes]);

  // Update brands when user brands are available
  useEffect(() => {
    if (userBrands.length > 0) {
      setBrands(userBrands);
      setLoadingBrands(false);
    }
  }, [userBrands]);

  // Auto-navigate to show selected sizes when value changes and has selections
  useEffect(() => {
    const autoNavigateToSelectedSizes = async () => {
      // Only auto-navigate if we have selections and we're at the brand step
      if (!value.sizeIds || value.sizeIds.length === 0 || pencilSetStep !== 'brand' || brands.length === 0) {
        return;
      }

      // If we already have a selected set or brand, don't auto-navigate
      if (selectedBrand || selectedSet) {
        return;
      }

      try {
        // Get the first set ID from the selections
        const firstSetId = value.setIds && value.setIds.length > 0 ? value.setIds[0] : null;
        if (!firstSetId) {
          return;
        }

        // Fetch the set to get its brand_id
        const setResponse = await coloredPencilSetsAPI.getById(firstSetId);
        const setData = setResponse.data || setResponse;
        
        if (!setData || !setData.brand_id) {
          return;
        }

        // Find the brand in our brands list
        const brand = brands.find(b => b.id === setData.brand_id || String(b.id) === String(setData.brand_id));
        if (!brand) {
          return;
        }

        // Navigate to the brand
        setSelectedBrand(brand);
        setPencilSetStep('set');
        
          // Fetch sets for this brand from user's sets
          try {
            setLoadingSets(true);
            const filteredSets = userSets.filter(set => {
              const setBrandId = set.brand?.id || set.brand_id;
              return setBrandId && String(setBrandId) === String(brand.id);
            });
            setSetsForBrand(filteredSets);
          
          // Find the set in the fetched sets
          const set = filteredSets.find(s => s.id === setData.id || String(s.id) === String(setData.id));
          if (set) {
            // Navigate to the set
            setSelectedSet(set);
            setPencilSetStep('size');
            
              // Fetch sizes for this set from user's set sizes
              try {
                setLoadingSizes(true);
                const filteredSizes = userSetSizes.filter(setSize => {
                  const sizeSetId = setSize.set?.id || setSize.colored_pencil_set?.id || setSize.colored_pencil_set_id;
                  return sizeSetId && String(sizeSetId) === String(set.id);
                });
                setSizesForSet(filteredSizes);
            } catch (sizeError) {
              console.error('Error fetching sizes for set:', sizeError);
            } finally {
              setLoadingSizes(false);
            }
          }
        } catch (setError) {
          console.error('Error fetching sets for brand:', setError);
        } finally {
          setLoadingSets(false);
        }
      } catch (error) {
        console.error('Error auto-navigating to selected sizes:', error);
      }
    };

        autoNavigateToSelectedSizes();
      }, [value.sizeIds, value.setIds, pencilSetStep, brands.length, selectedBrand, selectedSet, userSets, userSetSizes]);

  // Fetch sets for selected brand from user's set sizes
  const fetchSetsForBrand = useCallback(async (brandId) => {
    try {
      setLoadingSets(true);
      // Filter user sets by brand
      const filteredSets = userSets.filter(set => {
        const setBrandId = set.brand?.id || set.brand_id;
        return setBrandId && String(setBrandId) === String(brandId);
      });
      setSetsForBrand(filteredSets);
    } catch (error) {
      console.error('Error fetching sets for brand:', error);
    } finally {
      setLoadingSets(false);
    }
  }, [userSets]);

  // Fetch sizes for selected set from user's set sizes
  const fetchSizesForSet = useCallback(async (setId) => {
    try {
      setLoadingSizes(true);
      // Filter user set sizes by set ID
      const filteredSizes = userSetSizes.filter(setSize => {
        const sizeSetId = setSize.set?.id || setSize.colored_pencil_set?.id || setSize.colored_pencil_set_id;
        return sizeSetId && String(sizeSetId) === String(setId);
      });
      setSizesForSet(filteredSizes);
    } catch (error) {
      console.error('Error fetching sizes for set:', error);
    } finally {
      setLoadingSizes(false);
    }
  }, [userSetSizes]);


  const handleSetSelect = (size) => {
    const sizeId = size.id.toString();
    const setId = size.set?.id || size.colored_pencil_set_id || selectedSet?.id;
    
    // Ensure we have valid IDs
    if (!setId) {
      console.error('Cannot determine set ID for size:', size);
      return;
    }
    
    // Convert to string for consistent comparison
    const setIdStr = String(setId);
    const sizeIdStr = String(sizeId);
    
    if (multiple) {
      // For multiple mode, track both set IDs and size IDs
      // Size IDs are used for visual selection, set IDs are sent to backend
      const currentSetIds = (value.setIds || []).map(id => String(id));
      const currentSizeIds = (value.sizeIds || []).map(id => String(id));
      const isSizeSelected = currentSizeIds.includes(sizeIdStr);
      
      if (isSizeSelected) {
        // Remove this size and its set (if no other sizes from this set are selected)
        const newSizeIds = currentSizeIds.filter(id => id !== sizeIdStr);
        // Check if any other sizes from this set are still selected
        const otherSizesFromSet = sizesForSet.filter(s => {
          const otherSizeId = String(s.id);
          const otherSetId = String(s.set?.id || s.colored_pencil_set_id || selectedSet?.id);
          return otherSetId === setIdStr && otherSizeId !== sizeIdStr && newSizeIds.includes(otherSizeId);
        });
        
        let newSetIds = currentSetIds;
        if (otherSizesFromSet.length === 0) {
          // No other sizes from this set are selected, remove the set ID
          newSetIds = currentSetIds.filter(id => id !== setIdStr);
        }
        
        onChange({
          ...value,
          setIds: newSetIds,
          sizeIds: newSizeIds
        });
      } else {
        // Add this size and its set ID (if not already present)
        const newSizeIds = [...currentSizeIds, sizeIdStr];
        let newSetIds = currentSetIds;
        if (!currentSetIds.includes(setIdStr)) {
          newSetIds = [...currentSetIds, setIdStr];
        }
        
        onChange({
          ...value,
          setIds: newSetIds,
          sizeIds: newSizeIds
        });
      }
    } else {
      // Single mode - toggle the selection (deselect if already selected)
      const currentSetIds = (value.setIds || []).map(id => String(id));
      const currentSizeIds = (value.sizeIds || []).map(id => String(id));
      const isSizeSelected = currentSizeIds.includes(sizeIdStr);
      
      if (isSizeSelected) {
        // Deselect - clear the selection
        onChange({
          setIds: [],
          sizeIds: []
        });
      } else {
        // Select - replace the selection
        onChange({
          setIds: [setIdStr],
          sizeIds: [sizeIdStr]
        });
      }
    }
  };


  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-2">{label}</label>
      
      {/* Multi-step selection: Brand → Set → Size */}
          {pencilSetStep === 'brand' && (
            <div className="space-y-2 min-h-[235px]">
              {loadingUserSets || loadingBrands ? (
                <div className="w-full min-h-[235px] max-h-60 overflow-y-auto border border-slate-200 rounded-lg p-4 flex items-center justify-center">
                  <p className="text-sm text-slate-500">Loading brands...</p>
                </div>
              ) : brands.length === 0 ? (
                <div className="w-full min-h-[235px] max-h-60 overflow-y-auto border border-slate-200 rounded-lg p-4 flex items-center justify-center">
                  <p className="text-sm text-slate-500">No media found. Add media to your inventory first.</p>
                </div>
              ) : (
            <div className="w-full min-h-[235px] max-h-60 overflow-y-auto border border-slate-200 rounded-lg p-4">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {brands.map(brand => {
                  const thumbnail = brand.thumbnail;
                  const thumbnailUrl = thumbnail 
                    ? (thumbnail.startsWith('http') ? thumbnail : `${process.env.REACT_APP_API_BASE_URL?.replace('/api', '') || 'http://localhost:8000'}/storage/${thumbnail}`)
                    : null;
                  
                  return (
                    <BrandButton
                      key={brand.id}
                      brand={brand}
                      thumbnailUrl={thumbnailUrl}
                      onClick={() => {
                        setSelectedBrand(brand);
                        setPencilSetStep('set');
                        fetchSetsForBrand(brand.id);
                      }}
                    />
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
      
      {pencilSetStep === 'set' && selectedBrand && (
        <div className="space-y-2 min-h-[235px]">
          <div className="flex items-center space-x-2 mb-2">
            <button
              type="button"
              onClick={() => {
                setPencilSetStep('brand');
                setSelectedBrand(null);
                setSetsForBrand([]);
              }}
              className="text-xs text-slate-600 hover:text-slate-800"
            >
              ← Back
            </button>
            <span className="text-xs text-slate-500">Brand: {selectedBrand.name}</span>
          </div>
          {loadingSets ? (
            <div className="w-full min-h-[235px] max-h-60 overflow-y-auto border border-slate-200 rounded-lg p-4 flex items-center justify-center">
              <p className="text-sm text-slate-500">Loading sets...</p>
            </div>
          ) : (
            <div className="w-full min-h-[235px] max-h-60 overflow-y-auto border border-slate-200 rounded-lg p-4">
              <div className="space-y-2">
                {setsForBrand.map(set => (
                  <button
                    key={set.id}
                    type="button"
                    onClick={() => {
                      setSelectedSet(set);
                      setPencilSetStep('size');
                      fetchSizesForSet(set.id);
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 rounded transition-colors"
                  >
                    {set.name}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
      
      {pencilSetStep === 'size' && selectedSet && (
        <div className="space-y-2">
          <div className="flex items-center space-x-2 mb-2">
            <button
              type="button"
              onClick={() => {
                setPencilSetStep('set');
                setSelectedSet(null);
                setSizesForSet([]);
              }}
              className="text-xs text-slate-600 hover:text-slate-800"
            >
              ← Back
            </button>
            <span className="text-xs text-slate-500">Set: {selectedSet.name}</span>
          </div>
          <div className="w-full min-h-[235px] max-h-60 overflow-y-auto border border-slate-200 rounded-lg p-4">
            {loadingSizes ? (
              <div className="flex items-center justify-center min-h-[235px]">
                <p className="text-sm text-slate-500">Loading sizes...</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {sizesForSet.map(size => {
                  const sizeId = size.id.toString();
                  const setId = size.set?.id || size.colored_pencil_set_id || selectedSet?.id;
                  
                  // Check if this specific SIZE is selected (not just the set)
                  // This allows selecting individual sizes from the same set
                  const currentSizeIds = (value.sizeIds || []).map(id => String(id));
                  const sizeIdStr = String(sizeId);
                  const isSelected = currentSizeIds.includes(sizeIdStr);
                  
                  // Debug logging for selected sizes
                  if (isSelected) {
                    console.log('Found selected size:', {
                      sizeId: sizeId,
                      sizeIdStr: sizeIdStr,
                      currentSizeIds: currentSizeIds,
                      size: size
                    });
                  }
                  
                  return (
                    <SizeButton
                      key={size.id}
                      size={size}
                      isSelected={isSelected}
                      onSelectSet={() => handleSetSelect(size)}
                    />
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Selected summary */}
      {value.sizeIds && value.sizeIds.length > 0 && (
        <div className="mt-2 p-2 bg-slate-50 border border-slate-200 rounded-lg">
          <div className="text-xs font-medium text-slate-700 mb-1">
            Selected: {value.sizeIds.length} set size{value.sizeIds.length !== 1 ? 's' : ''}
          </div>
          <div className="text-xs text-slate-600">
            {pencilSetStep === 'brand' && 'Navigate to a set to see which sizes are selected.'}
            {pencilSetStep === 'set' && 'Select a set to see its available sizes.'}
            {pencilSetStep === 'size' && selectedSet && (
              <span>
                {sizesForSet.filter(size => {
                  const sizeIdStr = String(size.id);
                  return (value.sizeIds || []).map(id => String(id)).includes(sizeIdStr);
                }).length > 0 
                  ? `${sizesForSet.filter(size => {
                      const sizeIdStr = String(size.id);
                      return (value.sizeIds || []).map(id => String(id)).includes(sizeIdStr);
                    }).length} size(s) selected in this set`
                  : 'No sizes selected in this set. Selected sizes may be in other sets.'}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default PencilSelector;

