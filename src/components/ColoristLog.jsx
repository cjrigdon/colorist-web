import React, { useState, useEffect, useMemo, useCallback } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import DropdownMenu from './DropdownMenu';
import BookDropdown from './BookDropdown';
import InspirationDropdown from './InspirationDropdown';
import AddPencilSetModal from './AddPencilSetModal';
import { journalEntriesAPI, inspirationAPI, booksAPI, coloredPencilSetsAPI, colorPalettesAPI, colorCombosAPI, brandsAPI } from '../services/api';
import { apiGet } from '../services/api';

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

// Size button component with thumbnail and overlay
const SizeButton = ({ size, onSelectSet, onSelectPencils, isSelected = false }) => {
  const [imageError, setImageError] = useState(false);
  const [showOverlay, setShowOverlay] = useState(false);
  const thumbnail = size.thumb || size.set?.thumb;
  const thumbnailUrl = thumbnail 
    ? (thumbnail.startsWith('http') ? thumbnail : `${process.env.REACT_APP_API_BASE_URL?.replace('/api', '') || 'http://localhost:8000'}/storage/${thumbnail}`)
    : null;
  
  return (
    <div 
      className="relative flex flex-col items-center"
      onMouseEnter={() => !isSelected && setShowOverlay(true)}
      onMouseLeave={() => setShowOverlay(false)}
    >
      <button
        type="button"
        className={`flex flex-col items-center p-3 border-2 rounded-lg transition-all w-full ${
          isSelected
            ? 'border-slate-800 bg-slate-100 shadow-md'
            : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
        }`}
      >
        {thumbnailUrl && !imageError ? (
          <img 
            src={thumbnailUrl} 
            alt={size.name || `${size.count || 0}-piece set`}
            className="w-20 h-20 object-cover rounded mb-2"
            onError={() => setImageError(true)}
          />
        ) : (
          <div 
            className="w-20 h-20 flex items-center justify-center mb-2 rounded"
            style={{ backgroundColor: '#f1f5f9' }}
          >
            <svg className="w-10 h-10 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
          </div>
        )}
        <span className={`text-sm text-center ${isSelected ? 'text-slate-900 font-semibold' : 'text-slate-700'}`}>
          {size.name || `${size.count || 0}-piece set`}
        </span>
      </button>
      
      {/* Overlay with selection options - only show if not selected */}
      {showOverlay && !isSelected && (
        <div className="absolute inset-0 bg-black bg-opacity-60 rounded-lg flex items-center justify-center z-10">
          <div className="flex flex-col space-y-2 px-2">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setShowOverlay(false);
                onSelectSet();
              }}
              className="px-3 py-1.5 text-xs font-medium text-white rounded transition-colors"
              style={{ backgroundColor: '#ea3663' }}
              onMouseEnter={(e) => e.target.style.backgroundColor = '#d12a4f'}
              onMouseLeave={(e) => e.target.style.backgroundColor = '#ea3663'}
            >
              Select Set
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setShowOverlay(false);
                onSelectPencils();
              }}
              className="px-3 py-1.5 text-xs font-medium text-white rounded transition-colors"
              style={{ backgroundColor: '#ea3663' }}
              onMouseEnter={(e) => e.target.style.backgroundColor = '#d12a4f'}
              onMouseLeave={(e) => e.target.style.backgroundColor = '#ea3663'}
            >
              Select Pencils
            </button>
          </div>
        </div>
      )}
      
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

const ColoristLog = () => {
  const [selectedDate, setSelectedDate] = useState(null);
  const [showCalendar, setShowCalendar] = useState(false);
  const [entries, setEntries] = useState([]);
  const [showEntryForm, setShowEntryForm] = useState(false);
  const [editingEntry, setEditingEntry] = useState(null);
  const [loadingEntries, setLoadingEntries] = useState(true);
  const [loadingDates, setLoadingDates] = useState(false);
  const [datesWithEntries, setDatesWithEntries] = useState([]);
  const [formData, setFormData] = useState({
    date: '',
    inspiration: '',
    book: '',
    pencilSet: '',
    pencils: [], // Array of individual pencil IDs
    palettes: [],
    combos: [],
    notes: ''
  });
  const [showPaletteList, setShowPaletteList] = useState(false);
  const [pencilSelectionMode, setPencilSelectionMode] = useState('set'); // 'set' or 'individual'
  const [selectedSetForPencils, setSelectedSetForPencils] = useState(null);
  const [pencilsForSet, setPencilsForSet] = useState([]);
  const [loadingPencils, setLoadingPencils] = useState(false);

  // API data states
  const [inspirations, setInspirations] = useState([]);
  // Books are now loaded lazily in BookDropdown component, but we still need books state for displaying entries
  const [books, setBooks] = useState([]);
  const [pencilSets, setPencilSets] = useState([]);
  const [palettes, setPalettes] = useState([]);
  const [combos, setCombos] = useState([]);
  const [loadingFormData, setLoadingFormData] = useState(false);
  const [showAddSetModal, setShowAddSetModal] = useState(false);
  
  // Multi-step pencil set selection state
  const [pencilSetStep, setPencilSetStep] = useState('brand'); // 'brand', 'set', 'size'
  const [brands, setBrands] = useState([]);
  const [loadingBrands, setLoadingBrands] = useState(false);
  const [selectedBrand, setSelectedBrand] = useState(null);
  const [setsForBrand, setSetsForBrand] = useState([]);
  const [loadingSets, setLoadingSets] = useState(false);
  const [selectedSet, setSelectedSet] = useState(null);
  const [sizesForSet, setSizesForSet] = useState([]);
  const [loadingSizes, setLoadingSizes] = useState(false);

  const formatDate = (date) => {
    return date.toISOString().split('T')[0];
  };

  // Fetch related data for displaying entries (loads on mount)
  useEffect(() => {
    const fetchRelatedData = async () => {
      try {
        // Fetch inspirations
        const inspirationsResponse = await inspirationAPI.getAll(1, 1000);
        let inspirationsData = [];
        if (Array.isArray(inspirationsResponse)) {
          inspirationsData = inspirationsResponse;
        } else if (inspirationsResponse.data && Array.isArray(inspirationsResponse.data)) {
          inspirationsData = inspirationsResponse.data;
        }
        // Extract data property if present (inspiration API returns {type, data, created_at})
        // Note: Inspirations are now loaded lazily in InspirationDropdown component when the dropdown is opened
        // But we still need to load inspirations for displaying entries
        const extractedInspirations = inspirationsData.map(item => {
          if (item.data) {
            return { ...item.data, type: item.type };
          }
          return item;
        });
        setInspirations(extractedInspirations);

        // Books are now loaded lazily in BookDropdown component when the dropdown is opened
        // But we still need to load books for displaying entries
        const booksResponse = await booksAPI.getAll(1, 1000);
        let booksData = [];
        if (Array.isArray(booksResponse)) {
          booksData = booksResponse;
        } else if (booksResponse.data && Array.isArray(booksResponse.data)) {
          booksData = booksResponse.data;
        }
        setBooks(booksData);

        // Fetch pencil sets
        const pencilSetsResponse = await coloredPencilSetsAPI.getAll(1, 1000);
        let pencilSetsData = [];
        if (Array.isArray(pencilSetsResponse)) {
          pencilSetsData = pencilSetsResponse;
        } else if (pencilSetsResponse.data && Array.isArray(pencilSetsResponse.data)) {
          pencilSetsData = pencilSetsResponse.data;
        }
        // Transform for dropdown
        const transformedSets = pencilSetsData.map(setSize => ({
          id: setSize.set?.id || setSize.id,
          name: setSize.set?.name || 'Unknown',
          brand: setSize.set?.brand || 'Unknown'
        }));
        setPencilSets(transformedSets);

        // Fetch palettes
        const palettesResponse = await colorPalettesAPI.getAll(1, 1000);
        let palettesData = [];
        if (Array.isArray(palettesResponse)) {
          palettesData = palettesResponse;
        } else if (palettesResponse.data && Array.isArray(palettesResponse.data)) {
          palettesData = palettesResponse.data;
        }
        setPalettes(palettesData);

        // Fetch combos
        const combosResponse = await colorCombosAPI.getAll(1, 1000);
        let combosData = [];
        if (Array.isArray(combosResponse)) {
          combosData = combosResponse;
        } else if (combosResponse.data && Array.isArray(combosResponse.data)) {
          combosData = combosResponse.data;
        }
        setCombos(combosData);
      } catch (error) {
        console.error('Error fetching related data:', error);
      }
    };

    fetchRelatedData();
  }, []);

  // Fetch brands when form opens
  useEffect(() => {
    if (!showEntryForm || brands.length > 0) return;
    
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
      } catch (error) {
        console.error('Error fetching brands:', error);
      } finally {
        setLoadingBrands(false);
      }
    };
    
    fetchBrands();
  }, [showEntryForm, brands.length]);

  // Fetch sets for selected brand
  const fetchSetsForBrand = async (brandId) => {
    try {
      setLoadingSets(true);
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
      
      setSetsForBrand(setsData);
    } catch (error) {
      console.error('Error fetching sets for brand:', error);
    } finally {
      setLoadingSets(false);
    }
  };

  // Fetch sizes for selected set
  const fetchSizesForSet = async (setId) => {
    try {
      setLoadingSizes(true);
      const response = await coloredPencilSetsAPI.getAvailableSetSizes(1, 100, true, {
        setId: setId,
        excludePencils: false  // Include pencils so we can use them directly
      });
      
      let sizesData = [];
      if (Array.isArray(response)) {
        sizesData = response;
      } else if (response.data && Array.isArray(response.data)) {
        sizesData = response.data;
      }
      
      setSizesForSet(sizesData);
    } catch (error) {
      console.error('Error fetching sizes for set:', error);
    } finally {
      setLoadingSizes(false);
    }
  };

  // Fetch pencils for a set size
  const fetchPencilsForSet = useCallback(async (sizeId, size) => {
    if (!sizeId) {
      setPencilsForSet([]);
      return;
    }
    
    try {
      setLoadingPencils(true);
      
      // First, try to find the size in sizesForSet (most reliable source)
      const sizeFromList = sizesForSet.find(s => s.id.toString() === sizeId.toString());
      if (sizeFromList) {
        console.log(`Found size ${sizeId} in sizesForSet, checking for pencils...`);
        if (sizeFromList.pencils && Array.isArray(sizeFromList.pencils)) {
          console.log(`Found ${sizeFromList.pencils.length} pencils in sizesForSet for size ${sizeId}`);
          setPencilsForSet(sizeFromList.pencils);
          setLoadingPencils(false);
          return;
        } else {
          console.log(`Size ${sizeId} found but pencils array is missing or empty`);
        }
      }
      
      // Second, check if the size object passed directly has pencils
      if (size && size.pencils && Array.isArray(size.pencils)) {
        console.log(`Found ${size.pencils.length} pencils in size object for size ${sizeId}`);
        setPencilsForSet(size.pencils);
        setLoadingPencils(false);
        return;
      }
      
      // If pencils are not in cached data, they might not be loaded by the API
      // In this case, we should use the set ID to get all pencils for the set
      // (Note: This is a limitation - we can't get size-specific pencils without them being in the relationship)
      const setId = size?.set?.id || size?.colored_pencil_set_id || sizeFromList?.set?.id || sizeFromList?.colored_pencil_set_id;
      if (setId) {
        console.log(`Pencils not found for size ${sizeId}, fetching all pencils for set ${setId} as fallback`);
        const response = await coloredPencilSetsAPI.getPencils(setId);
        
        let pencilsData = [];
        if (Array.isArray(response)) {
          pencilsData = response;
        } else if (response.data && Array.isArray(response.data)) {
          pencilsData = response.data;
        }
        
        console.log(`Fallback returned ${pencilsData.length} pencils for set ${setId}`);
        setPencilsForSet(pencilsData);
      } else {
        console.warn(`No set ID found for size ${sizeId}, setting empty pencils`);
        setPencilsForSet([]);
      }
    } catch (error) {
      console.error('Error fetching pencils for set size:', error);
      setPencilsForSet([]);
    } finally {
      setLoadingPencils(false);
    }
  }, [sizesForSet]);

  // Automatically fetch pencils when selectedSetForPencils changes
  useEffect(() => {
    if (selectedSetForPencils && selectedSetForPencils.sizeId) {
      // Clear previous pencils first to show loading state
      setPencilsForSet([]);
      console.log('useEffect triggered: fetching pencils for size', selectedSetForPencils.sizeId);
      fetchPencilsForSet(selectedSetForPencils.sizeId, selectedSetForPencils.size);
    } else if (!selectedSetForPencils) {
      setPencilsForSet([]);
    }
  }, [selectedSetForPencils?.sizeId, selectedSetForPencils?.size, fetchPencilsForSet]);

  // Get entries for selected date (or all most recent if no date selected)
  useEffect(() => {
    const fetchEntries = async () => {
      try {
        setLoadingEntries(true);
        // If no date is selected, fetch all entries (most recent first)
        // If date is selected, filter by that date
        const filters = selectedDate ? { date: formatDate(selectedDate) } : {};
        const response = await journalEntriesAPI.getAll(filters);
        
        let entriesData = [];
        if (Array.isArray(response)) {
          entriesData = response;
        } else if (response.data && Array.isArray(response.data)) {
          entriesData = response.data;
        }
        
        // Transform API response to match component format
        // Note: Related data lookup is done at render time, not during fetch
        // This prevents multiple re-renders when related data loads
        const transformedEntries = entriesData.map(entry => ({
          id: entry.id,
          date: entry.date,
          inspiration_id: entry.inspiration_id,
          book_id: entry.book_id,
          pencilSet_id: entry.colored_pencil_set_id,
          pencils: entry.pencils || [],
          palette_id: entry.color_palette_id, // Keep for backward compatibility
          palettes: entry.palettes || (entry.color_palette_id ? [entry.color_palette_id] : []),
          combos: entry.combos || [],
          notes: entry.notes || '',
          // Related objects will be looked up at render time
          inspiration: null,
          book: null,
          pencilSet: null,
          palette: null,
        }));
        
        setEntries(transformedEntries);
      } catch (error) {
        console.error('Error fetching entries:', error);
        setEntries([]);
      } finally {
        setLoadingEntries(false);
      }
    };

    fetchEntries();
  }, [selectedDate]);

  // Get all dates with entries (for calendar indicators)
  useEffect(() => {
    const fetchDatesWithEntries = async () => {
      try {
        setLoadingDates(true);
        const response = await journalEntriesAPI.getDatesWithEntries();
        setDatesWithEntries(Array.isArray(response) ? response : []);
      } catch (error) {
        console.error('Error fetching dates with entries:', error);
        setDatesWithEntries([]);
      } finally {
        setLoadingDates(false);
      }
    };

    fetchDatesWithEntries();
  }, []);

  const formatDisplayDate = (date) => {
    if (!date) return 'All Entries';
    return date.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  };

  const navigateDate = (direction) => {
    if (!selectedDate) {
      // If no date selected, start from today
      setSelectedDate(new Date());
      return;
    }
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + direction);
    setSelectedDate(newDate);
  };

  const handleDateSelect = (date) => {
    setSelectedDate(date);
    setShowCalendar(false);
  };

  const handleCreateEntry = () => {
    setEditingEntry(null);
    setFormData({
      date: selectedDate ? formatDate(selectedDate) : formatDate(new Date()),
      inspiration: '',
      book: '',
      pencilSet: '',
      pencils: [],
      palettes: [],
      combos: [],
      notes: ''
    });
    setShowPaletteList(false);
    setPencilSetStep('brand');
    setSelectedBrand(null);
    setSelectedSet(null);
    setSetsForBrand([]);
    setSizesForSet([]);
    setPencilSelectionMode('set');
    setSelectedSetForPencils(null);
    setPencilsForSet([]);
    setShowEntryForm(true);
  };

  const handleEditEntry = async (entry) => {
    setEditingEntry(entry);
    setFormData({
      date: entry.date,
      inspiration: entry.inspiration_id ? entry.inspiration_id.toString() : '',
      book: entry.book_id ? entry.book_id.toString() : '',
      pencilSet: entry.pencilSet_id ? entry.pencilSet_id.toString() : '',
      pencils: entry.pencils ? entry.pencils.map(id => id.toString()) : [],
      palettes: entry.palettes ? entry.palettes.map(id => id.toString()) : (entry.palette_id ? [entry.palette_id.toString()] : []),
      combos: entry.combos ? entry.combos.map(id => id.toString()) : [],
      notes: entry.notes || ''
    });
    setShowPaletteList(false);
    setPencilSetStep('brand');
    setSelectedBrand(null);
    setSelectedSet(null);
    setSetsForBrand([]);
    setSizesForSet([]);
    setPencilSelectionMode(entry.pencils && entry.pencils.length > 0 ? 'individual' : 'set');
    setSelectedSetForPencils(null);
    setPencilsForSet([]);
    
    // If editing and has individual pencils, we'd need to load the set info
    // For now, just reset to brand selection
    
    setShowEntryForm(true);
  };


  const handleSaveEntry = async () => {
    try {
      // Get the set ID from the size ID if a set is selected
      let coloredPencilSetId = null;
      if (pencilSelectionMode === 'set' && formData.pencilSet) {
        // formData.pencilSet contains the size ID, we need to get the set ID
        const selectedSize = sizesForSet.find(s => s.id.toString() === formData.pencilSet.toString());
        if (selectedSize) {
          coloredPencilSetId = selectedSize.set?.id || selectedSize.colored_pencil_set_id;
        } else {
          // Fallback: try to find in pencilSets (though this might not have the right structure)
          const foundSet = pencilSets.find(ps => ps.id.toString() === formData.pencilSet.toString());
          if (foundSet) {
            coloredPencilSetId = foundSet.id;
          }
        }
      }
      
      // Prepare data for API
      const entryData = {
        date: formData.date,
        inspiration: formData.inspiration || null,
        colored_pencil_set_id: coloredPencilSetId,
        pencils: pencilSelectionMode === 'individual' ? formData.pencils.map(id => parseInt(id)) : [],
        book: formData.book || null,
        palettes: formData.palettes.map(id => parseInt(id)),
        combos: formData.combos.map(id => parseInt(id)),
        notes: formData.notes || null
      };

      // Remove null/empty string values (but keep empty arrays for combos, palettes, and pencils)
      Object.keys(entryData).forEach(key => {
        if (key !== 'combos' && key !== 'palettes' && key !== 'pencils' && (entryData[key] === null || entryData[key] === '')) {
          delete entryData[key];
        }
      });
      
      // Remove pencils if empty array and set is selected
      if (pencilSelectionMode === 'set' && entryData.pencils.length === 0) {
        delete entryData.pencils;
      }
      
      // Remove colored_pencil_set_id if pencils are selected individually
      if (pencilSelectionMode === 'individual' && entryData.pencils.length > 0) {
        delete entryData.colored_pencil_set_id;
      }

      let savedEntry;
      if (editingEntry) {
        savedEntry = await journalEntriesAPI.update(editingEntry.id, entryData);
      } else {
        savedEntry = await journalEntriesAPI.create(entryData);
      }

      // Refresh entries for the selected date (or all if no date selected)
      const filters = selectedDate ? { date: formatDate(selectedDate) } : {};
      const response = await journalEntriesAPI.getAll(filters);
      
      let entriesData = [];
      if (Array.isArray(response)) {
        entriesData = response;
      } else if (response.data && Array.isArray(response.data)) {
        entriesData = response.data;
      }
      
      // Transform API response
      // Related objects will be looked up at render time
      const transformedEntries = entriesData.map(entry => ({
        id: entry.id,
        date: entry.date,
        inspiration_id: entry.inspiration_id,
        book_id: entry.book_id,
        pencilSet_id: entry.colored_pencil_set_id,
        pencils: entry.pencils || [],
        palette_id: entry.color_palette_id, // Keep for backward compatibility
        palettes: entry.palettes || (entry.color_palette_id ? [entry.color_palette_id] : []),
        combos: entry.combos || [],
        notes: entry.notes || '',
        inspiration: null,
        book: null,
        pencilSet: null,
        palette: null,
      }));
      
      setEntries(transformedEntries);
      
      // Refresh dates with entries
      const datesResponse = await journalEntriesAPI.getDatesWithEntries();
      setDatesWithEntries(Array.isArray(datesResponse) ? datesResponse : []);

      setShowEntryForm(false);
      setEditingEntry(null);
      setShowPaletteList(false);
      setPencilSelectionMode('set');
      setSelectedSetForPencils(null);
      setPencilsForSet([]);
    } catch (error) {
      console.error('Error saving entry:', error);
      alert('Failed to save entry. Please try again.');
    }
  };

  const handleDeleteEntry = async (entryId) => {
    if (!window.confirm('Are you sure you want to delete this entry?')) {
      return;
    }

    try {
      await journalEntriesAPI.delete(entryId);
      
      // Refresh entries for the selected date (or all if no date selected)
      const filters = selectedDate ? { date: formatDate(selectedDate) } : {};
      const response = await journalEntriesAPI.getAll(filters);
      
      let entriesData = [];
      if (Array.isArray(response)) {
        entriesData = response;
      } else if (response.data && Array.isArray(response.data)) {
        entriesData = response.data;
      }
      
      // Related objects will be looked up at render time
      const transformedEntries = entriesData.map(entry => ({
        id: entry.id,
        date: entry.date,
        inspiration_id: entry.inspiration_id,
        book_id: entry.book_id,
        pencilSet_id: entry.colored_pencil_set_id,
        pencils: entry.pencils || [],
        palette_id: entry.color_palette_id, // Keep for backward compatibility
        palettes: entry.palettes || (entry.color_palette_id ? [entry.color_palette_id] : []),
        combos: entry.combos || [],
        notes: entry.notes || '',
        inspiration: null,
        book: null,
        pencilSet: null,
        palette: null,
      }));
      
      setEntries(transformedEntries);
      
      // Refresh dates with entries
      const datesResponse = await journalEntriesAPI.getDatesWithEntries();
      setDatesWithEntries(Array.isArray(datesResponse) ? datesResponse : []);
    } catch (error) {
      console.error('Error deleting entry:', error);
      alert('Failed to delete entry. Please try again.');
    }
  };

  const getCalendarDays = () => {
    const displayDate = selectedDate || new Date();
    const year = displayDate.getFullYear();
    const month = displayDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add all days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      days.push(date);
    }
    
    return days;
  };

  const isSameDate = (date1, date2) => {
    return date1 && date2 &&
      date1.getFullYear() === date2.getFullYear() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getDate() === date2.getDate();
  };

  const isToday = (date) => {
    const today = new Date();
    return isSameDate(date, today);
  };

  const hasEntry = (date) => {
    const dateStr = formatDate(date);
    return datesWithEntries.includes(dateStr);
  };

  // Filter combos to only show those that use pencils from the selected pencil set or individual pencils
  const filteredCombos = useMemo(() => {
    const matchingCombos = new Set();
    
    // Check if individual pencils are selected - filter combos that contain any of those pencils
    if (formData.pencils.length > 0) {
      const selectedPencilIds = formData.pencils.map(id => parseInt(id));
      combos.forEach(combo => {
        if (!combo.pencils || !Array.isArray(combo.pencils)) {
          return;
        }
        // Check if combo contains any of the selected pencils
        const hasSelectedPencil = combo.pencils.some(pencil => {
          const pencilId = pencil.id;
          return selectedPencilIds.includes(pencilId);
        });
        if (hasSelectedPencil) {
          matchingCombos.add(combo.id);
        }
      });
    }
    
    // Check if set is selected - filter by set ID
    if (formData.pencilSet) {
      let setId = null;
      
      // First try to find the size in sizesForSet (most reliable)
      const selectedSizeFromSizes = sizesForSet.find(size => size.id.toString() === formData.pencilSet);
      if (selectedSizeFromSizes) {
        setId = selectedSizeFromSizes.set?.id || selectedSizeFromSizes.colored_pencil_set_id || selectedSet?.id;
      } else {
        // Fallback: try to find in pencilSets
        const selectedSize = pencilSets.find(ps => ps.id.toString() === formData.pencilSet);
        if (selectedSize) {
          setId = selectedSize.set?.id || selectedSize.colored_pencil_set_id;
        } else if (selectedSet) {
          // Last resort: use selectedSet if available
          setId = selectedSet.id;
        }
      }
      
      if (setId) {
        combos.forEach(combo => {
          // Check if combo has pencils and if any pencil belongs to the selected set
          if (!combo.pencils || !Array.isArray(combo.pencils)) {
            return;
          }
          
          const hasPencilFromSet = combo.pencils.some(pencil => {
            // Check if pencil has colored_pencil_set_id matching selected set
            const pencilSetId = pencil.colored_pencil_set_id || pencil.set?.id || pencil.colored_pencil_set?.id;
            return pencilSetId === setId;
          });
          
          if (hasPencilFromSet) {
            matchingCombos.add(combo.id);
          }
        });
      }
    }
    
    // Return combos that match either condition
    return combos.filter(combo => matchingCombos.has(combo.id));
  }, [combos, formData.pencilSet, formData.pencils, pencilSelectionMode, pencilSets, sizesForSet, selectedSet]);

  return (
    <div className="space-y-6">
      {/* Date Navigation Section */}
      <div className="px-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-4">
            {selectedDate && (
              <>
                <button
                  onClick={() => navigateDate(-1)}
                  className="p-2 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <div>
                  <h3 className="text-lg font-semibold text-slate-800 font-venti">{formatDisplayDate(selectedDate)}</h3>
                </div>
                <button
                  onClick={() => navigateDate(1)}
                  className="p-2 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </>
            )}
            {!selectedDate && (
              <div>
                <h3 className="text-lg font-semibold text-slate-800 font-venti">Most Recent Entries</h3>
              </div>
            )}
          </div>
          <div className="flex items-center space-x-2">
            {selectedDate && (
              <>
                <button
                  onClick={() => setSelectedDate(new Date())}
                  className="px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50 rounded-lg transition-colors"
                >
                  Today
                </button>
                <button
                  onClick={() => setSelectedDate(null)}
                  className="px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50 rounded-lg transition-colors"
                >
                  Clear Date
                </button>
              </>
            )}
            {!selectedDate && (
              <button
                onClick={() => setSelectedDate(new Date())}
                className="px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50 rounded-lg transition-colors"
              >
                Today
              </button>
            )}
            <button
              onClick={() => setShowCalendar(!showCalendar)}
              className="px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors"
              style={{ backgroundColor: '#ea3663' }}
              onMouseEnter={(e) => e.target.style.backgroundColor = '#d12a4f'}
              onMouseLeave={(e) => e.target.style.backgroundColor = '#ea3663'}
            >
              {showCalendar ? 'Hide Calendar' : 'Show Calendar'}
            </button>
          </div>
        </div>

        {/* Calendar */}
        {showCalendar && (
          <div className="bg-slate-50 rounded-xl shadow-sm border border-slate-200 p-4 mt-4">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-sm font-semibold text-slate-800 font-venti">
                {(selectedDate || new Date()).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </h4>
              <div className="flex space-x-2">
                <button
                  onClick={() => {
                    const currentDate = selectedDate || new Date();
                    const newDate = new Date(currentDate);
                    newDate.setMonth(newDate.getMonth() - 1);
                    setSelectedDate(newDate);
                  }}
                  className="p-1 rounded hover:bg-slate-100"
                >
                  <svg className="w-4 h-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <button
                  onClick={() => {
                    const currentDate = selectedDate || new Date();
                    const newDate = new Date(currentDate);
                    newDate.setMonth(newDate.getMonth() + 1);
                    setSelectedDate(newDate);
                  }}
                  className="p-1 rounded hover:bg-slate-100"
                >
                  <svg className="w-4 h-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>
            <div className="grid grid-cols-7 gap-1">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="text-xs font-medium text-slate-600 text-center p-2">
                  {day}
                </div>
              ))}
              {getCalendarDays().map((date, index) => (
                <button
                  key={index}
                  onClick={() => date && handleDateSelect(date)}
                  className={`p-2 rounded text-sm transition-all ${
                    !date
                      ? 'cursor-default'
                      : selectedDate && isSameDate(date, selectedDate)
                      ? 'bg-slate-800 text-white font-semibold'
                      : isToday(date)
                      ? 'bg-slate-100 font-medium'
                      : hasEntry(date)
                      ? 'bg-white hover:bg-slate-100 border-2 border-slate-300'
                      : 'hover:bg-white'
                  }`}
                >
                  {date ? (
                    <div className="flex flex-col items-center">
                      <span>{date.getDate()}</span>
                      {hasEntry(date) && (
                        <span className="w-1 h-1 rounded-full mt-0.5" style={{ backgroundColor: '#ea3663' }}></span>
                      )}
                    </div>
                  ) : null}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Entries Section */}
      <div className="bg-white p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-slate-800 font-venti">Journal Entries</h3>
          <button
            onClick={handleCreateEntry}
            className="px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors flex items-center space-x-2"
            style={{ backgroundColor: '#ea3663' }}
            onMouseEnter={(e) => e.target.style.backgroundColor = '#d12a4f'}
            onMouseLeave={(e) => e.target.style.backgroundColor = '#ea3663'}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span>New Entry</span>
          </button>
        </div>

        {loadingEntries ? (
          <div className="bg-slate-50 rounded-xl shadow-sm border border-slate-200 p-12 text-center">
            <p className="text-slate-600">Loading entries...</p>
          </div>
        ) : entries.length === 0 ? (
          <div className="bg-slate-50 rounded-xl shadow-sm border border-slate-200 p-12 text-center">
            <div className="text-6xl mb-4">📔</div>
            <h3 className="text-xl font-semibold text-slate-800 mb-2 font-venti">No Entries Yet</h3>
            <p className="text-slate-600 mb-4">
              {selectedDate 
                ? `Create your first journal entry for ${formatDisplayDate(selectedDate)}`
                : 'Create your first journal entry'}
            </p>
            <button
              onClick={handleCreateEntry}
              className="px-6 py-3 text-white rounded-lg font-medium transition-colors"
              style={{ backgroundColor: '#ea3663' }}
              onMouseEnter={(e) => e.target.style.backgroundColor = '#d12a4f'}
              onMouseLeave={(e) => e.target.style.backgroundColor = '#ea3663'}
            >
              Create Entry
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {entries.map((entry) => {
              // Look up related objects at render time (prevents re-fetching when related data loads)
              const inspiration = entry.inspiration_id ? inspirations.find(i => i.id === entry.inspiration_id) : null;
              const book = entry.book_id ? books.find(b => b.id === entry.book_id) : null;
              const pencilSet = entry.pencilSet_id ? pencilSets.find(p => p.id === entry.pencilSet_id) : null;
              // Support both old single palette_id and new palettes array
              const entryPalettes = entry.palettes || (entry.palette_id ? [entry.palette_id] : []);
              
              return (
              <div
                key={entry.id}
                className="bg-slate-50 rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-all"
                onMouseEnter={(e) => e.currentTarget.style.borderColor = '#ea3663'}
                onMouseLeave={(e) => e.currentTarget.style.borderColor = '#e2e8f0'}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      {inspiration && (
                        <span className="px-2 py-1 bg-slate-100 text-slate-700 rounded text-xs">
                          📚 {inspiration.title || inspiration.name || `Inspiration ${entry.inspiration_id}`}
                        </span>
                      )}
                      {book && (
                        <span className="px-2 py-1 bg-slate-100 text-slate-700 rounded text-xs">
                          📖 {book.title || book.name || `Book ${entry.book_id}`}
                        </span>
                      )}
                      {pencilSet && (
                        <span className="px-2 py-1 bg-slate-100 text-slate-700 rounded text-xs">
                          ✏️ {pencilSet.name} {pencilSet.brand ? `(${pencilSet.brand})` : ''}
                        </span>
                      )}
                      {entry.pencils && entry.pencils.length > 0 && (
                        <span className="px-2 py-1 bg-slate-100 text-slate-700 rounded text-xs">
                          ✏️ {entry.pencils.length} individual pencil{entry.pencils.length !== 1 ? 's' : ''}
                        </span>
                      )}
                      {entryPalettes && entryPalettes.length > 0 && (
                        <>
                          {entryPalettes.map((paletteId, idx) => {
                            const palette = palettes.find(p => p.id === paletteId);
                            return palette ? (
                              <span key={idx} className="px-2 py-1 bg-slate-100 text-slate-700 rounded text-xs">
                                🌈 {palette.name || palette.title || `Palette ${paletteId}`}
                              </span>
                            ) : null;
                          })}
                        </>
                      )}
                      {entry.combos && entry.combos.length > 0 && (
                        <>
                          {entry.combos.map((comboId, idx) => {
                            const combo = combos.find(c => c.id === comboId);
                            return combo ? (
                              <span key={idx} className="px-2 py-1 bg-slate-100 text-slate-700 rounded text-xs">
                                🎨 {combo.name || combo.title || `Combo ${comboId}`}
                              </span>
                            ) : null;
                          })}
                        </>
                      )}
                    </div>
                    {entry.notes && (
                      <p className="text-slate-700 mb-3">{entry.notes}</p>
                    )}
                  </div>
                  <div className="flex space-x-2 ml-4">
                    <button
                      onClick={() => handleEditEntry(entry)}
                      className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleDeleteEntry(entry.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Entry Form Modal */}
      {showEntryForm && (
        <div className="fixed top-0 left-0 right-0 bottom-0 bg-black bg-opacity-50 flex items-center justify-center z-50" style={{ margin: 0, padding: 0 }}>
          <div className="bg-slate-50 rounded-2xl shadow-xl max-w-5xl w-full max-h-[90vh] overflow-y-auto m-4">
            <div className="p-6 border-b border-slate-200">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold text-slate-800 font-venti">
                  {editingEntry ? 'Edit Entry' : 'New Entry'}
                </h3>
                <button
                  onClick={() => {
                    setShowEntryForm(false);
                    setEditingEntry(null);
                  }}
                  className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            <div className="p-6 space-y-4">
              {loadingFormData ? (
                <div className="text-center py-8">
                  <p className="text-slate-500">Loading form data...</p>
                </div>
              ) : (
                <>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Date</label>
                    <input
                      type="date"
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-offset-2"
                      style={{ focusRingColor: '#ea3663' }}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Inspiration</label>
                      <InspirationDropdown
                        value={formData.inspiration}
                        onChange={(value) => setFormData({ ...formData, inspiration: value })}
                        placeholder="Select inspiration..."
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Book</label>
                      <BookDropdown
                        value={formData.book}
                        onChange={(value) => setFormData({ ...formData, book: value })}
                        placeholder="Select book..."
                      />
                    </div>
                  </div>

                  {/* Pencil Set Selection - Full Width */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-sm font-medium text-slate-700">Pencil Set</label>
                      <button
                        type="button"
                        onClick={() => setShowAddSetModal(true)}
                        className="text-xs text-slate-600 hover:text-slate-800 underline"
                      >
                        Add New Set
                      </button>
                    </div>
                    
                    {/* Multi-step selection: Brand → Set → Size */}
                    {pencilSetStep === 'brand' && (
                      <div className="space-y-2">
                        {loadingBrands ? (
                          <p className="text-sm text-slate-500">Loading brands...</p>
                        ) : (
                          <div className="w-full max-h-60 overflow-y-auto border border-slate-200 rounded-lg p-4">
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
                      <div className="space-y-2">
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
                          <p className="text-sm text-slate-500">Loading sets...</p>
                        ) : (
                          <div className="w-full max-h-60 overflow-y-auto border border-slate-200 rounded-lg p-4">
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
                              setPencilSelectionMode('set');
                              setSelectedSetForPencils(null);
                              setPencilsForSet([]);
                            }}
                            className="text-xs text-slate-600 hover:text-slate-800"
                          >
                            ← Back
                          </button>
                          <span className="text-xs text-slate-500">Set: {selectedSet.name}</span>
                        </div>
                        {loadingSizes ? (
                          <p className="text-sm text-slate-500">Loading sizes...</p>
                        ) : (
                          <div className="w-full max-h-60 overflow-y-auto border border-slate-200 rounded-lg p-4">
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                              {sizesForSet.map(size => {
                                const sizeId = size.id.toString();
                                const setId = size.set?.id || size.colored_pencil_set_id || selectedSet.id;
                                const isSelected = formData.pencilSet === sizeId && pencilSelectionMode === 'set';
                                
                                return (
                                  <SizeButton
                                    key={size.id}
                                    size={size}
                                    isSelected={isSelected}
                                    onSelectSet={() => {
                                      // Select entire set
                                      const validComboIds = combos
                                        .filter(combo => {
                                          if (!combo.pencils || !Array.isArray(combo.pencils)) return false;
                                          return combo.pencils.some(pencil => {
                                            const pencilSetId = pencil.colored_pencil_set_id || pencil.set?.id || pencil.colored_pencil_set?.id;
                                            return pencilSetId === setId;
                                          });
                                        })
                                        .map(combo => combo.id.toString());
                                      
                                      setFormData({ 
                                        ...formData, 
                                        pencilSet: sizeId,
                                        pencils: [],
                                        combos: formData.combos.filter(id => validComboIds.includes(id))
                                      });
                                      setPencilSelectionMode('set');
                                      setSelectedSetForPencils(null);
                                      setPencilsForSet([]);
                                    }}
                                    onSelectPencils={() => {
                                      // Show individual pencil selection
                                      // The useEffect will automatically fetch pencils when selectedSetForPencils changes
                                      setSelectedSetForPencils({ sizeId, setId, size });
                                      setPencilSelectionMode('individual');
                                    }}
                                  />
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                    
                    {/* Individual Pencil Selection */}
                    {selectedSetForPencils && pencilSelectionMode === 'individual' && (
                      <div className="space-y-2 mt-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-slate-700">Select Individual Pencils</span>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedSetForPencils(null);
                              setPencilsForSet([]);
                              setPencilSelectionMode('set');
                              setFormData({ ...formData, pencils: [] });
                            }}
                            className="text-xs text-slate-600 hover:text-slate-800"
                          >
                            Cancel
                          </button>
                        </div>
                        
                        <div className="w-full max-h-60 overflow-y-auto border border-slate-200 rounded-lg p-4">
                          {loadingPencils ? (
                            <p className="text-sm text-slate-500 text-center py-4">Loading pencils...</p>
                          ) : pencilsForSet.length === 0 ? (
                            <p className="text-sm text-slate-500 text-center py-4">No pencils available</p>
                          ) : (
                            <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
                              {pencilsForSet.map(pencil => {
                                const hexColor = pencil.color?.hex || pencil.hex_code || '#000000';
                                const colorName = pencil.color_name || pencil.color?.name || `Color ${pencil.color_number || ''}`;
                                const isSelected = formData.pencils.includes(pencil.id.toString());
                                
                                return (
                                  <button
                                    key={pencil.id}
                                    type="button"
                                    onClick={() => {
                                      const pencilId = pencil.id.toString();
                                      let updatedPencils;
                                      
                                      if (isSelected) {
                                        updatedPencils = formData.pencils.filter(id => id !== pencilId);
                                      } else {
                                        updatedPencils = [...formData.pencils, pencilId];
                                      }
                                      
                                      // Filter combos that contain any of the selected pencils
                                      const validComboIds = combos
                                        .filter(combo => {
                                          if (!combo.pencils || !Array.isArray(combo.pencils)) return false;
                                          return combo.pencils.some(comboPencil => {
                                            const comboPencilId = comboPencil.id;
                                            return updatedPencils.map(id => parseInt(id)).includes(comboPencilId);
                                          });
                                        })
                                        .map(combo => combo.id.toString());
                                      
                                      setFormData({
                                        ...formData,
                                        pencilSet: '', // Clear set selection when selecting individual pencils
                                        pencils: updatedPencils,
                                        combos: formData.combos.filter(id => validComboIds.includes(id))
                                      });
                                    }}
                                    className={`flex flex-col items-center p-2 border-2 rounded-lg transition-all ${
                                      isSelected
                                        ? 'border-slate-800 bg-slate-100'
                                        : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                                    }`}
                                    title={colorName}
                                  >
                                    <div
                                      className="w-12 h-12 rounded mb-1 border border-slate-300"
                                      style={{ backgroundColor: hexColor }}
                                    />
                                    <span className="text-xs text-slate-700 text-center truncate w-full">
                                      {pencil.color_number || ''}
                                    </span>
                                  </button>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                    
                    {formData.pencilSet && pencilSetStep === 'brand' && pencilSelectionMode === 'set' && (
                      <div className="mt-2 text-xs text-slate-600">
                        Selected: {(() => {
                          // Try to find the selected size in pencilSets for display
                          const selected = pencilSets.find(ps => ps.id.toString() === formData.pencilSet);
                          return selected ? `${selected.name} ${selected.brand ? `(${selected.brand})` : ''}` : 'Set selected';
                        })()}
                      </div>
                    )}
                    {formData.pencils.length > 0 && pencilSelectionMode === 'individual' && (
                      <div className="mt-2 text-xs text-slate-600">
                        Selected: {formData.pencils.length} individual pencil{formData.pencils.length !== 1 ? 's' : ''}
                      </div>
                    )}
                  </div>

                  {filteredCombos.length > 0 && (
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Color Combos</label>
                      <div className="space-y-2 max-h-40 overflow-y-auto border border-slate-200 rounded-lg p-2">
                        {filteredCombos.map(combo => (
                          <label key={combo.id} className="flex items-center space-x-2 p-2 hover:bg-slate-50 rounded cursor-pointer">
                            <input
                              type="checkbox"
                              checked={formData.combos.includes(combo.id.toString())}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setFormData({
                                    ...formData,
                                    combos: [...formData.combos, combo.id.toString()]
                                  });
                                } else {
                                  setFormData({
                                    ...formData,
                                    combos: formData.combos.filter(id => id !== combo.id.toString())
                                  });
                                }
                              }}
                              className="w-4 h-4 text-pink-600 border-slate-300 rounded focus:ring-pink-500"
                            />
                            <span className="text-sm text-slate-700">
                              {combo.name || combo.title || `Combo ${combo.id}`}
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-sm font-medium text-slate-700">Color Palettes</label>
                      <button
                        type="button"
                        onClick={() => setShowPaletteList(!showPaletteList)}
                        className="flex items-center justify-center w-8 h-8 rounded-lg border-2 border-slate-300 hover:border-slate-400 text-slate-600 hover:text-slate-800 transition-colors"
                        style={{ borderColor: showPaletteList ? '#ea3663' : undefined }}
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                      </button>
                    </div>
                    {showPaletteList && (
                      <div className="w-full max-h-60 overflow-y-auto border border-slate-200 rounded-lg p-4">
                        {palettes.length === 0 ? (
                          <p className="text-sm text-slate-400 text-center py-2">No color palettes available</p>
                        ) : (
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                            {palettes.map(palette => (
                              <label key={palette.id} className="flex items-center space-x-2 p-2 hover:bg-slate-50 rounded cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={formData.palettes.includes(palette.id.toString())}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setFormData({
                                        ...formData,
                                        palettes: [...formData.palettes, palette.id.toString()]
                                      });
                                    } else {
                                      setFormData({
                                        ...formData,
                                        palettes: formData.palettes.filter(id => id !== palette.id.toString())
                                      });
                                    }
                                  }}
                                  className="w-4 h-4 text-pink-600 border-slate-300 rounded focus:ring-pink-500"
                                />
                                <span className="text-sm text-slate-700">
                                  {palette.name || palette.title || `Palette ${palette.id}`}
                                </span>
                              </label>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </>
              )}

              {!loadingFormData && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Notes</label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    rows={4}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-offset-2"
                    style={{ focusRingColor: '#ea3663' }}
                    placeholder="Write your notes here..."
                  />
                </div>
              )}

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  onClick={() => {
                    setShowEntryForm(false);
                    setEditingEntry(null);
                  }}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveEntry}
                  className="px-4 py-2 text-white rounded-lg font-medium transition-colors"
                  style={{ backgroundColor: '#ea3663' }}
                  onMouseEnter={(e) => e.target.style.backgroundColor = '#d12a4f'}
                  onMouseLeave={(e) => e.target.style.backgroundColor = '#ea3663'}
                >
                  Save Entry
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Pencil Set Modal */}
      <AddPencilSetModal
        isOpen={showAddSetModal}
        onClose={() => setShowAddSetModal(false)}
        onSuccess={async () => {
          // Refresh pencil sets after adding
          try {
            const pencilSetsResponse = await coloredPencilSetsAPI.getAll(1, 1000);
            let pencilSetsData = [];
            if (Array.isArray(pencilSetsResponse)) {
              pencilSetsData = pencilSetsResponse;
            } else if (pencilSetsResponse.data && Array.isArray(pencilSetsResponse.data)) {
              pencilSetsData = pencilSetsResponse.data;
            }
            const transformedSets = pencilSetsData.map(setSize => ({
              id: setSize.set?.id || setSize.id,
              name: setSize.set?.name || 'Unknown',
              brand: setSize.set?.brand || 'Unknown'
            }));
            setPencilSets(transformedSets);
          } catch (error) {
            console.error('Error refreshing pencil sets:', error);
          }
        }}
      />
    </div>
  );
};

export default ColoristLog;

