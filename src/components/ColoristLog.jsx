import React, { useState, useEffect, useMemo, useCallback } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import DropdownMenu from './DropdownMenu';
import BookDropdown from './BookDropdown';
import InspirationDropdown from './InspirationDropdown';
import AddPencilSetModal from './AddPencilSetModal';
import PencilSelector from './PencilSelector';
import { journalEntriesAPI, inspirationAPI, booksAPI, coloredPencilSetsAPI, colorPalettesAPI, colorCombosAPI, brandsAPI } from '../services/api';
import { apiGet } from '../services/api';

// Filtered Combo Checkbox List Component
const FilteredComboCheckboxList = ({ combos, selectedCombos, onSelectionChange, pencilSetIds }) => {
  const filteredCombos = useMemo(() => {
    if (!pencilSetIds || pencilSetIds.length === 0) {
      return combos;
    }

    const selectedSetIds = pencilSetIds.map(id => parseInt(id));
    const matchingCombos = new Set();

    combos.forEach(combo => {
      if (!combo.pencils || !Array.isArray(combo.pencils)) {
        return;
      }

      const hasPencilFromSet = combo.pencils.some(pencil => {
        const pencilSetId = pencil.colored_pencil_set_id || pencil.set?.id || pencil.colored_pencil_set?.id;
        return pencilSetId && selectedSetIds.includes(pencilSetId);
      });

      if (hasPencilFromSet) {
        matchingCombos.add(combo.id);
      }
    });

    return combos.filter(combo => matchingCombos.has(combo.id));
  }, [combos, pencilSetIds]);

  const toggleCombo = (comboId) => {
    const comboIdStr = comboId.toString();
    const isSelected = selectedCombos.some(id => id.toString() === comboIdStr);
    
    if (isSelected) {
      onSelectionChange(selectedCombos.filter(id => id.toString() !== comboIdStr));
    } else {
      onSelectionChange([...selectedCombos, comboId]);
    }
  };

  if (filteredCombos.length === 0) {
    return (
      <p className="text-sm text-slate-500">
        {pencilSetIds.length > 0 
          ? 'No combos found for the selected pencil sets. Select pencil sets first or clear the filter.'
          : 'No combos available. Select pencil sets to filter combos.'}
      </p>
    );
  }

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 max-h-60 overflow-y-auto border border-slate-200 rounded-lg p-4">
        {filteredCombos.map(combo => {
          const isSelected = selectedCombos.some(id => id.toString() === combo.id.toString());
          return (
            <label
              key={combo.id}
              className="flex items-center space-x-2 p-2 border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer"
            >
              <input
                type="checkbox"
                checked={isSelected}
                onChange={() => toggleCombo(combo.id)}
                className="w-4 h-4 text-slate-800 border-slate-300 rounded focus:ring-slate-500"
              />
              <span className="text-sm text-slate-700 flex-1 truncate">
                {combo.title || combo.name || `Combo ${combo.id}`}
              </span>
            </label>
          );
        })}
      </div>
      {selectedCombos.length > 0 && (
        <p className="text-xs text-slate-600 mt-2">
          Selected: {selectedCombos.length} combo{selectedCombos.length !== 1 ? 's' : ''}
        </p>
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
    palettes: [],
    combos: [],
    notes: ''
  });
  const [showPaletteList, setShowPaletteList] = useState(false);
  const [showPencilSelector, setShowPencilSelector] = useState(false);
  const [showColorSelector, setShowColorSelector] = useState(false);
  const [pencilSelection, setPencilSelection] = useState({
    setIds: [],
    sizeIds: []
  });
  const [selectedPalettes, setSelectedPalettes] = useState([]);
  const [selectedCombos, setSelectedCombos] = useState([]);
  const [loadingPalettes, setLoadingPalettes] = useState(false);
  const [loadingCombos, setLoadingCombos] = useState(false);

  // API data states
  const [inspirations, setInspirations] = useState([]);
  // Books are now loaded lazily in BookDropdown component, but we still need books state for displaying entries
  const [books, setBooks] = useState([]);
  const [pencilSets, setPencilSets] = useState([]);
  const [palettes, setPalettes] = useState([]);
  const [combos, setCombos] = useState([]);
  const [loadingFormData, setLoadingFormData] = useState(false);
  const [showAddSetModal, setShowAddSetModal] = useState(false);

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

  // Fetch palettes and combos when color selector is shown
  useEffect(() => {
    if (showColorSelector) {
      const fetchColors = async () => {
        try {
          setLoadingPalettes(true);
          setLoadingCombos(true);
          
          const palettesResponse = await colorPalettesAPI.getAll(1, 1000);
          let palettesData = [];
          if (Array.isArray(palettesResponse)) {
            palettesData = palettesResponse;
          } else if (palettesResponse.data && Array.isArray(palettesResponse.data)) {
            palettesData = palettesResponse.data;
          }
          setPalettes(palettesData);

          const combosResponse = await colorCombosAPI.getAll(1, 1000);
          let combosData = [];
          if (Array.isArray(combosResponse)) {
            combosData = combosResponse;
          } else if (combosResponse.data && Array.isArray(combosResponse.data)) {
            combosData = combosResponse.data;
          }
          setCombos(combosData);
        } catch (err) {
          console.error('Error loading colors:', err);
        } finally {
          setLoadingPalettes(false);
          setLoadingCombos(false);
        }
      };

      fetchColors();
    }
  }, [showColorSelector]);

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
      palettes: [],
      combos: [],
      notes: ''
    });
    setShowPaletteList(false);
    setShowPencilSelector(false);
    setShowColorSelector(false);
    setSelectedPalettes([]);
    setSelectedCombos([]);
    setPencilSelection({
      setIds: [],
      sizeIds: []
    });
    setShowEntryForm(true);
  };

  const handleEditEntry = async (entry) => {
    setEditingEntry(entry);
    setFormData({
      date: entry.date,
      inspiration: entry.inspiration_id ? entry.inspiration_id.toString() : '',
      book: entry.book_id ? entry.book_id.toString() : '',
      palettes: entry.palettes ? entry.palettes.map(id => id.toString()) : (entry.palette_id ? [entry.palette_id.toString()] : []),
      combos: entry.combos ? entry.combos.map(id => id.toString()) : [],
      notes: entry.notes || ''
    });
    setShowPaletteList(false);
    
    // Convert entry data to pencilSelection format
    // Note: We need to get the set ID from the entry's colored_pencil_set_id
    const setIds = entry.pencilSet_id ? [entry.pencilSet_id.toString()] : [];
    
    // Fetch size IDs for the selected set(s) to populate PencilSelector correctly
    const existingSizeIds = [];
    if (setIds.length > 0) {
      for (const setId of setIds) {
        try {
          const sizesResponse = await coloredPencilSetsAPI.getAvailableSetSizes(1, 100, true, {
            setId: parseInt(setId),
            excludePencils: false
          });
          let sizesData = [];
          if (Array.isArray(sizesResponse)) {
            sizesData = sizesResponse;
          } else if (sizesResponse.data && Array.isArray(sizesResponse.data)) {
            sizesData = sizesResponse.data;
          }
          // Add all size IDs for this set
          sizesData.forEach(size => {
            existingSizeIds.push(size.id);
          });
        } catch (sizeError) {
          console.error(`Error fetching sizes for set ${setId}:`, sizeError);
        }
      }
    }
    
    // Ensure all IDs are strings for consistent comparison
    const sizeIdsAsStrings = existingSizeIds.map(id => String(id));
    const setIdsAsStrings = setIds.map(id => String(id));
    
    setPencilSelection({
      setIds: setIdsAsStrings,
      sizeIds: sizeIdsAsStrings
    });
    
    // Show pencil selector if there are existing sizes
    setShowPencilSelector(sizeIdsAsStrings.length > 0);
    
    // Load existing palette and combos
    if (formData.palettes && formData.palettes.length > 0) {
      setSelectedPalettes(formData.palettes.map(id => parseInt(id)));
      setShowColorSelector(true);
    }
    if (formData.combos && formData.combos.length > 0) {
      setSelectedCombos(formData.combos.map(id => parseInt(id)));
      setShowColorSelector(true);
    }
    
    setShowEntryForm(true);
  };


  const handleSaveEntry = async () => {
    try {
      // Journal entries only support set selection (not individual pencils or size IDs)
      // Get the set ID from the first selected set
      // PencilSelector populates setIds when sizes are selected
      let coloredPencilSetId = null;
      if (pencilSelection.setIds && pencilSelection.setIds.length > 0) {
        coloredPencilSetId = parseInt(pencilSelection.setIds[0]);
      }
      
      // Prepare data for API
      // Note: Journal entries store set IDs, not size IDs
      const entryData = {
        date: formData.date,
        inspiration: formData.inspiration || null,
        colored_pencil_set_id: coloredPencilSetId,
        book: formData.book || null,
        palettes: selectedPalettes.map(id => parseInt(id)),
        combos: selectedCombos.map(id => parseInt(id)),
        notes: formData.notes || null
      };

      // Remove null/empty string values (but keep empty arrays for combos and palettes)
      Object.keys(entryData).forEach(key => {
        if (key !== 'combos' && key !== 'palettes' && (entryData[key] === null || entryData[key] === '')) {
          delete entryData[key];
        }
      });

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

  // Filter combos to only show those that use pencils from the selected pencil sets
  const filteredCombos = useMemo(() => {
    const matchingCombos = new Set();
    
    // Check if sets are selected - filter by set IDs
    if (pencilSelection.setIds && pencilSelection.setIds.length > 0) {
      const selectedSetIds = pencilSelection.setIds.map(id => parseInt(id));
      combos.forEach(combo => {
        // Check if combo has pencils and if any pencil belongs to any of the selected sets
        if (!combo.pencils || !Array.isArray(combo.pencils)) {
          return;
        }
        
        const hasPencilFromSet = combo.pencils.some(pencil => {
          // Check if pencil has colored_pencil_set_id matching any selected set
          const pencilSetId = pencil.colored_pencil_set_id || pencil.set?.id || pencil.colored_pencil_set?.id;
          return pencilSetId && selectedSetIds.includes(pencilSetId);
        });
        
        if (hasPencilFromSet) {
          matchingCombos.add(combo.id);
        }
      });
    }
    
    // Return combos that match
    return combos.filter(combo => matchingCombos.has(combo.id));
  }, [combos, pencilSelection]);

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

                  {/* Add Pencils Section */}
                  <div>
                    {!showPencilSelector ? (
                      <button
                        type="button"
                        onClick={() => setShowPencilSelector(true)}
                        className="flex items-center space-x-2 px-4 py-2.5 text-slate-700 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium hover:bg-white transition-colors"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        <span>Add Pencils</span>
                      </button>
                    ) : (
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <label className="block text-sm font-medium text-slate-700">Pencil Sets</label>
                          <div className="flex items-center space-x-2">
                            <button
                              type="button"
                              onClick={() => setShowAddSetModal(true)}
                              className="text-xs text-slate-600 hover:text-slate-800 underline"
                            >
                              Add New Set
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setShowPencilSelector(false);
                              }}
                              className="text-xs text-slate-600 hover:text-slate-800"
                            >
                              Hide
                            </button>
                          </div>
                        </div>
                        <PencilSelector
                          value={pencilSelection}
                          onChange={setPencilSelection}
                          label=""
                          multiple={true}
                        />
                      </div>
                    )}
                  </div>

                  {/* Add Colors Section */}
                  <div>
                    {!showColorSelector ? (
                      <button
                        type="button"
                        onClick={() => setShowColorSelector(true)}
                        className="flex items-center space-x-2 px-4 py-2.5 text-slate-700 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium hover:bg-white transition-colors"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        <span>Add Colors</span>
                      </button>
                    ) : (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between mb-2">
                          <label className="block text-sm font-medium text-slate-700"></label>
                          <button
                            type="button"
                            onClick={() => {
                              setShowColorSelector(false);
                            }}
                            className="text-xs text-slate-600 hover:text-slate-800"
                          >
                            Hide
                          </button>
                        </div>

                        {/* Palette Selection */}
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-2">
                            Color Palettes
                          </label>
                          {loadingPalettes ? (
                            <p className="text-sm text-slate-500">Loading palettes...</p>
                          ) : palettes.length === 0 ? (
                            <p className="text-sm text-slate-500">No palettes available</p>
                          ) : (
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 max-h-60 overflow-y-auto border border-slate-200 rounded-lg p-4">
                              {palettes.map(palette => {
                                const isSelected = selectedPalettes.includes(palette.id);
                                return (
                                  <label
                                    key={palette.id}
                                    className="flex items-center space-x-2 p-2 border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer"
                                  >
                                    <input
                                      type="checkbox"
                                      checked={isSelected}
                                      onChange={(e) => {
                                        if (e.target.checked) {
                                          setSelectedPalettes([...selectedPalettes, palette.id]);
                                        } else {
                                          setSelectedPalettes(selectedPalettes.filter(id => id !== palette.id));
                                        }
                                      }}
                                      className="w-4 h-4 text-slate-800 border-slate-300 rounded focus:ring-slate-500"
                                    />
                                    <span className="text-sm text-slate-700 flex-1 truncate">
                                      {palette.title || palette.name || `Palette ${palette.id}`}
                                    </span>
                                  </label>
                                );
                              })}
                            </div>
                          )}
                          {selectedPalettes.length > 0 && (
                            <p className="text-xs text-slate-600 mt-2">
                              Selected: {selectedPalettes.length} palette{selectedPalettes.length !== 1 ? 's' : ''}
                            </p>
                          )}
                        </div>

                        {/* Combo Selection */}
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-2">
                            Color Combos {pencilSelection.setIds.length > 0 && <span className="text-xs text-slate-500">(filtered by selected pencil sets)</span>}
                          </label>
                          {loadingCombos ? (
                            <p className="text-sm text-slate-500">Loading combos...</p>
                          ) : (
                            <FilteredComboCheckboxList
                              combos={combos}
                              selectedCombos={selectedCombos}
                              onSelectionChange={setSelectedCombos}
                              pencilSetIds={pencilSelection.setIds}
                            />
                          )}
                        </div>
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

