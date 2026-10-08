import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import DropdownMenu from './DropdownMenu';
import BookDropdown from './BookDropdown';
import BookPageFields, { EMPTY_BOOK_PAGE, bookPageFromEntry, bookPagePayload, formatBookPage } from './BookPageFields';
import InspirationDropdown, { parseInspirationValue } from './InspirationDropdown';
import RichTextEditor, { isRichTextEmpty, sanitizeRichTextHtml } from './RichTextEditor';
import PrimaryButton from './PrimaryButton';
import TagIcon from './TagIcon';
import TagSelect from './TagSelect';
import MultiSelectDropdown from './MultiSelectDropdown';
import { shrinkImageForUpload } from '../utils/imageUtils';
import { buildColorAlongVideoPath } from '../utils/colorAlongUtils';
import { journalEntriesAPI, inspirationAPI, booksAPI, coloredPencilSetsAPI, colorPalettesAPI, colorCombosAPI } from '../services/api';

const ENTRY_PREVIEW_WORD_LIMIT = 50;

// Same icons as the Studio sections in the main menu
const ENTRY_TAG_ICONS = {
  inspiration: 'https://colorist.sfo3.cdn.digitaloceanspaces.com/icons/inspiration.png',
  book: 'https://colorist.sfo3.cdn.digitaloceanspaces.com/icons/books.png',
  pencils: 'https://colorist.sfo3.cdn.digitaloceanspaces.com/icons/media.png',
  palette: 'https://colorist.sfo3.cdn.digitaloceanspaces.com/icons/palettes.png',
  combo: 'https://colorist.sfo3.cdn.digitaloceanspaces.com/icons/combos.png',
};

const EntryTag = ({ icon, children }) => (
  <span className="inline-flex items-center gap-1.5 px-2 py-1 bg-slate-100 text-slate-700 rounded text-xs">
    <img src={ENTRY_TAG_ICONS[icon]} alt="" aria-hidden="true" className="w-8 h-8 object-contain flex-shrink-0" />
    <span>{children}</span>
  </span>
);

const htmlToPlainText = (html) => {
  const withBreaks = html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|li|h[1-6]|blockquote)>/gi, '\n')
    .replace(/<li[^>]*>/gi, '• ');
  const doc = new DOMParser().parseFromString(withBreaks, 'text/html');
  return (doc.body.textContent || '').replace(/\n{3,}/g, '\n\n').trim();
};

// Returns the text cut after `limit` words with an ellipsis, or null when it's already short enough
const truncateWords = (text, limit) => {
  const wordPattern = /\S+/g;
  let count = 0;
  while (wordPattern.exec(text) !== null) {
    count += 1;
    if (count === limit) {
      const cutAt = wordPattern.lastIndex;
      return /\S/.test(text.slice(cutAt)) ? `${text.slice(0, cutAt)}…` : null;
    }
  }
  return null;
};

// Entry dates are stored as YYYY-MM-DD; parse the parts directly so time zones can't shift the day
const getEntryDateParts = (dateValue) => {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(dateValue || ''));
  if (!match) return null;
  const year = Number(match[1]);
  const monthIndex = Number(match[2]) - 1;
  const day = Number(match[3]);
  return {
    month: new Date(year, monthIndex, day).toLocaleString(undefined, { month: 'short' }),
    day,
    year,
  };
};

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

const getThumbnailUrl = (thumb) => {
  if (!thumb) return null;
  if (thumb.startsWith('http')) return thumb;
  const apiBase = process.env.REACT_APP_API_BASE_URL?.replace('/api', '') || 'http://localhost:8000';
  return `${apiBase}/storage/${thumb}`;
};

const buildSetDropdownOptions = (setSizes = []) => {
  const grouped = new Map();

  setSizes.forEach((setSize) => {
    const setId = setSize.set?.id || setSize.id;
    if (!setId) return;

    const existing = grouped.get(setId) || {
      setId,
      name: setSize.set?.name || setSize.name || 'Unknown',
      brand: typeof setSize.set?.brand === 'object'
        ? setSize.set?.brand?.name
        : (setSize.set?.brand || setSize.brand || 'Unknown'),
      totalColors: 0,
      thumbs: []
    };

    existing.totalColors += (setSize.count || 0);
    const thumbUrl = getThumbnailUrl(setSize.thumb || setSize.set?.thumb);
    if (thumbUrl && !existing.thumbs.includes(thumbUrl)) {
      existing.thumbs.push(thumbUrl);
    }
    grouped.set(setId, existing);
  });

  return Array.from(grouped.values())
    .sort((a, b) => `${a.brand} ${a.name}`.localeCompare(`${b.brand} ${b.name}`))
    .map((option) => ({
      value: option.setId.toString(),
      label: `${option.name} (${option.brand})`,
      selectedLabel: `${option.name} (${option.brand})`,
      displayLabel: (
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 min-w-[2.75rem]">
            {option.thumbs.slice(0, 3).map((thumb) => (
              <img
                key={`${option.setId}-${thumb}`}
                src={thumb}
                alt={`${option.name} size`}
                className="w-7 h-7 rounded object-cover border border-slate-200"
              />
            ))}
            {option.thumbs.length === 0 && (
              <div className="w-7 h-7 rounded bg-slate-100 border border-slate-200" />
            )}
          </div>
          <div className="min-w-0">
            <div className="text-sm text-slate-900 font-medium truncate">{option.name}</div>
            <div className="text-xs text-slate-500 truncate">
              {option.brand} - {option.totalColors} colors
            </div>
          </div>
        </div>
      )
    }));
};

const formatDate = (date) => {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
};

const getEntryColorAlongPath = (inspiration, bookId) => {
  if (inspiration?.type === 'video' && inspiration.embed_id) {
    return buildColorAlongVideoPath({
      embedId: inspiration.embed_id,
      pencilSetSizeId: inspiration.colored_pencil_set_size_id,
      bookId: bookId || inspiration.book_id,
    });
  }
  if (inspiration && (inspiration.type === 'image' || inspiration.mime_type?.startsWith('image/'))) {
    return `/color-along?image=${inspiration.id}`;
  }
  return bookId ? `/color-along?book=${bookId}` : '/color-along';
};

const ColoristLog = () => {
  const navigate = useNavigate();
  const [dateRange, setDateRange] = useState({ start: null, end: null });
  const [hoverDate, setHoverDate] = useState(null);
  const [calendarMonthOffset, setCalendarMonthOffset] = useState(0);
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
  // file: newly chosen photo to upload on save; previewUrl: what the form shows; removed: clear the saved photo on save
  const [entryImage, setEntryImage] = useState({ file: null, previewUrl: null, removed: false });
  const [savingEntry, setSavingEntry] = useState(false);
  const [showPaletteList, setShowPaletteList] = useState(false);
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
  const [videoFilter, setVideoFilter] = useState('');
  const [bookFilter, setBookFilter] = useState('');
  const [tagFilter, setTagFilter] = useState([]);
  // Books are now loaded lazily in BookDropdown component, but we still need books state for displaying entries
  const [books, setBooks] = useState([]);
  const [pencilSets, setPencilSets] = useState([]);
  const [palettes, setPalettes] = useState([]);
  const [combos, setCombos] = useState([]);
  const [loadingFormData, setLoadingFormData] = useState(false);
  const userSetJournalOptions = useMemo(
    () => buildSetDropdownOptions(pencilSets),
    [pencilSets]
  );

  // Release the object URL for a locally chosen photo once it's replaced or the form closes
  useEffect(() => {
    const { file, previewUrl } = entryImage;
    return () => {
      if (file && previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [entryImage]);

  const handleEntryImageSelected = (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      alert('Please choose an image file.');
      return;
    }
    setEntryImage({ file, previewUrl: URL.createObjectURL(file), removed: false });
  };

  const handleRemoveEntryImage = () => {
    setEntryImage({ file: null, previewUrl: null, removed: true });
  };

  // Fetch related data for displaying entries (loads on mount)
  useEffect(() => {
    const fetchRelatedData = async () => {
      try {
        const [videosResponse, filesResponse] = await Promise.all([
          inspirationAPI.getAll(1, 100, { type: 'video', archived: false }),
          inspirationAPI.getAll(1, 100, { type: 'file', archived: false }),
        ]);
        const extractItems = (response) => {
          if (Array.isArray(response)) return response;
          if (response?.data && Array.isArray(response.data)) return response.data;
          return [];
        };
        setInspirations([
          ...extractItems(videosResponse),
          ...extractItems(filesResponse),
        ]);

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

        // Fetch user's pencil set sizes for dropdown
        const pencilSetsResponse = await coloredPencilSetsAPI.getAll(1, 1000);
        let pencilSetsData = [];
        if (Array.isArray(pencilSetsResponse)) {
          pencilSetsData = pencilSetsResponse;
        } else if (pencilSetsResponse.data && Array.isArray(pencilSetsResponse.data)) {
          pencilSetsData = pencilSetsResponse.data;
        }
        setPencilSets(pencilSetsData);

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


  useEffect(() => {
    const fetchEntries = async () => {
      try {
        setLoadingEntries(true);
        const response = await journalEntriesAPI.getAll();
        
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
          book_page_id: entry.book_page_id || null,
          book_page: entry.book_page || null,
          pencilSet_id: entry.colored_pencil_set_id,
          pencils: entry.pencils || [],
          palette_id: entry.color_palette_id, // Keep for backward compatibility
          palettes: entry.palettes || (entry.color_palette_id ? [entry.color_palette_id] : []),
          combos: entry.combos || [],
          notes: entry.notes || '',
          image_url: entry.image_url || null,
          tags: entry.tags || [],
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
  }, []);

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

  const formatRangeLabel = ({ start, end }) => {
    if (!start) return 'Most Recent Entries';
    const full = { month: 'short', day: 'numeric', year: 'numeric' };
    if (!end || isSameDate(start, end)) {
      return start.toLocaleDateString('en-US', { weekday: 'long', ...full });
    }
    const startOptions = start.getFullYear() === end.getFullYear() ? { month: 'short', day: 'numeric' } : full;
    return `${start.toLocaleDateString('en-US', startOptions)} – ${end.toLocaleDateString('en-US', full)}`;
  };

  const handleRangeDayClick = (date) => {
    const { start, end } = dateRange;
    if (!start || end) {
      setDateRange({ start: date, end: null });
      return;
    }
    setDateRange(date < start ? { start: date, end: start } : { start, end: date });
    setHoverDate(null);
    setShowCalendar(false);
  };

  const clearDateRange = () => {
    setDateRange({ start: null, end: null });
    setHoverDate(null);
  };

  const handleCreateEntry = () => {
    setEditingEntry(null);
    setFormData({
      date: formatDate(new Date()),
      inspiration: '',
      book: '',
      bookPage: EMPTY_BOOK_PAGE,
      palettes: [],
      combos: [],
      tags: [],
      notes: ''
    });
    setEntryImage({ file: null, previewUrl: null, removed: false });
    setShowPaletteList(false);
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
      bookPage: bookPageFromEntry(entry),
      palettes: entry.palettes ? entry.palettes.map(id => id.toString()) : (entry.palette_id ? [entry.palette_id.toString()] : []),
      combos: entry.combos ? entry.combos.map(id => id.toString()) : [],
      tags: (entry.tags || []).map(t => ({ id: t.id, tag: t.tag, icon: t.icon || null })),
      notes: entry.notes || ''
    });
    setEntryImage({ file: null, previewUrl: entry.image_url || null, removed: false });
    setShowPaletteList(false);
    
    // Convert entry data to pencilSelection format
    // Note: We need to get the set ID from the entry's colored_pencil_set_id
    const setIds = entry.pencilSet_id ? [entry.pencilSet_id.toString()] : [];
    
    // Keep size IDs empty for dropdown-based set selection.
    const sizeIdsAsStrings = [];
    const setIdsAsStrings = setIds.map(id => String(id));
    
    setPencilSelection({
      setIds: setIdsAsStrings,
      sizeIds: sizeIdsAsStrings
    });
    
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
    if (savingEntry) return;
    setSavingEntry(true);
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
      const notesValue = isRichTextEmpty(formData.notes) ? null : formData.notes;
      const entryData = {
        date: formData.date,
        inspiration: parseInspirationValue(formData.inspiration).id,
        colored_pencil_set_id: coloredPencilSetId,
        book: formData.book || null,
        palettes: selectedPalettes.map(id => parseInt(id)),
        combos: selectedCombos.map(id => parseInt(id)),
        tag_ids: (formData.tags || []).filter(t => t.id).map(t => t.id),
        tag_names: (formData.tags || []).filter(t => !t.id).map(t => (t.icon ? { tag: t.tag, icon: t.icon } : t.tag)),
        notes: notesValue
      };

      // Remove null/empty string values (but keep empty arrays for combos and palettes)
      Object.keys(entryData).forEach(key => {
        if (key !== 'combos' && key !== 'palettes' && (entryData[key] === null || entryData[key] === '')) {
          delete entryData[key];
        }
      });
      Object.assign(entryData, bookPagePayload(formData.book ? formData.bookPage : null));

      let savedEntry;
      if (editingEntry) {
        savedEntry = await journalEntriesAPI.update(editingEntry.id, entryData);
      } else {
        savedEntry = await journalEntriesAPI.create(entryData);
      }

      const savedEntryId = savedEntry?.id ?? savedEntry?.data?.id ?? editingEntry?.id;
      try {
        if (entryImage.file && savedEntryId) {
          const upload = await shrinkImageForUpload(entryImage.file);
          await journalEntriesAPI.uploadImage(savedEntryId, upload);
        } else if (entryImage.removed && editingEntry?.image_url) {
          await journalEntriesAPI.deleteImage(editingEntry.id);
        }
      } catch (imageError) {
        console.error('Error saving entry photo:', imageError);
        const detail = imageError.data?.errors?.image?.[0];
        alert(`Your entry was saved, but the photo couldn't be ${entryImage.file ? 'uploaded' : 'removed'}.${detail ? ` ${detail}` : ''}`);
      }

      const response = await journalEntriesAPI.getAll();
      
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
        book_page_id: entry.book_page_id || null,
        book_page: entry.book_page || null,
        pencilSet_id: entry.colored_pencil_set_id,
        pencils: entry.pencils || [],
        palette_id: entry.color_palette_id, // Keep for backward compatibility
        palettes: entry.palettes || (entry.color_palette_id ? [entry.color_palette_id] : []),
        combos: entry.combos || [],
        notes: entry.notes || '',
        image_url: entry.image_url || null,
          tags: entry.tags || [],
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
      const pageError = error.data?.errors?.book_page_id?.[0] || error.data?.errors?.book_page_number?.[0];
      alert(pageError || 'Failed to save entry. Please try again.');
    } finally {
      setSavingEntry(false);
    }
  };

  const handleDeleteEntry = async (entryId) => {
    if (!window.confirm('Are you sure you want to delete this entry?')) {
      return;
    }

    try {
      await journalEntriesAPI.delete(entryId);
      
      const response = await journalEntriesAPI.getAll();
      
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
        book_page_id: entry.book_page_id || null,
        book_page: entry.book_page || null,
        pencilSet_id: entry.colored_pencil_set_id,
        pencils: entry.pencils || [],
        palette_id: entry.color_palette_id, // Keep for backward compatibility
        palettes: entry.palettes || (entry.color_palette_id ? [entry.color_palette_id] : []),
        combos: entry.combos || [],
        notes: entry.notes || '',
        image_url: entry.image_url || null,
          tags: entry.tags || [],
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

  const getCalendarDays = (displayDate) => {
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

    while (days.length % 7 !== 0) {
      days.push(null);
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

  const videoFilterOptions = useMemo(() => {
    const usedIds = new Set(entries.map(entry => entry.inspiration_id).filter(Boolean));
    const options = inspirations
      .filter(item => item.type === 'video' && usedIds.has(item.id))
      .map(item => ({ value: String(item.id), label: item.title || `Video ${item.id}` }))
      .sort((a, b) => a.label.localeCompare(b.label));
    return options;
  }, [entries, inspirations]);

  const bookFilterOptions = useMemo(() => {
    const usedIds = new Set(entries.map(entry => entry.book_id).filter(Boolean));
    const options = [...usedIds]
      .map(id => {
        const book = books.find(b => b.id === id);
        return { value: String(id), label: book?.title || book?.name || `Book ${id}` };
      })
      .sort((a, b) => a.label.localeCompare(b.label));
    return options;
  }, [entries, books]);

  const entryTagIconByDate = useMemo(() => {
    const iconsByDate = new Map();
    entries.forEach(entry => {
      const dateKey = String(entry.date || '').slice(0, 10);
      const icon = (entry.tags || []).find(tag => tag.icon)?.icon;
      if (dateKey && icon && !iconsByDate.has(dateKey)) {
        iconsByDate.set(dateKey, icon);
      }
    });
    return iconsByDate;
  }, [entries]);

  const tagFilterOptions = useMemo(() => {
    const tagsById = new Map();
    entries.forEach(entry => (entry.tags || []).forEach(tag => tagsById.set(tag.id, tag)));
    return [...tagsById.values()]
      .sort((a, b) => a.tag.localeCompare(b.tag))
      .map(tag => ({ value: String(tag.id), label: tag.tag, icon: <TagIcon icon={tag.icon} size={16} /> }));
  }, [entries]);

  const filteredEntries = useMemo(() => {
    const rangeStart = dateRange.start ? formatDate(dateRange.start) : null;
    const rangeEnd = dateRange.start ? formatDate(dateRange.end || dateRange.start) : null;
    return entries.filter(entry => {
      const entryDate = String(entry.date || '').slice(0, 10);
      return (!rangeStart || (entryDate >= rangeStart && entryDate <= rangeEnd)) &&
        (!videoFilter || String(entry.inspiration_id) === videoFilter) &&
        (!bookFilter || String(entry.book_id) === bookFilter) &&
        (tagFilter.length === 0 || (entry.tags || []).some(tag => tagFilter.includes(String(tag.id))));
    });
  }, [entries, dateRange, videoFilter, bookFilter, tagFilter]);

  const calendarMonths = useMemo(() => {
    const today = new Date();
    return [-1, 0].map(delta => new Date(today.getFullYear(), today.getMonth() + calendarMonthOffset + delta, 1));
  }, [calendarMonthOffset]);

  const isInPreviewRange = (date) => {
    const { start, end } = dateRange;
    if (!start) return false;
    const rangeEnd = end || hoverDate;
    if (!rangeEnd) return false;
    const [low, high] = start <= rangeEnd ? [start, rangeEnd] : [rangeEnd, start];
    return date >= low && date <= high;
  };

  const hasActiveEntryFilters = Boolean(videoFilter || bookFilter || tagFilter.length > 0);

  return (
    <div className="space-y-6">
      {showCalendar && (
      <div className="px-4">
          <div className="bg-slate-50 rounded-xl shadow-sm border border-slate-200 p-4">
            <div className="flex items-center justify-between mb-3">
              <button
                type="button"
                onClick={() => setCalendarMonthOffset(offset => offset - 1)}
                className="p-1 rounded hover:bg-slate-100"
                aria-label="Previous month"
              >
                <svg className="w-4 h-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <p className="text-xs text-slate-500">
                {dateRange.start && !dateRange.end ? 'Now choose an end date' : 'Choose a start date'}
              </p>
              <button
                type="button"
                onClick={() => setCalendarMonthOffset(offset => offset + 1)}
                disabled={calendarMonthOffset >= 0}
                className="p-1 rounded hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-transparent disabled:cursor-default"
                aria-label="Next month"
              >
                <svg className="w-4 h-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6" onMouseLeave={() => setHoverDate(null)}>
              {calendarMonths.map(monthDate => (
                <div key={formatDate(monthDate)}>
                  <h4 className="text-sm font-semibold text-slate-800 font-venti text-center mb-2">
                    {monthDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                  </h4>
                  <div className="grid grid-cols-7">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                      <div key={day} className="text-xs font-medium text-slate-600 text-center py-1">
                        {day}
                      </div>
                    ))}
                  </div>
                  <div className="grid grid-cols-7 border-l border-t border-slate-300 bg-white">
                    {getCalendarDays(monthDate).map((date, index) => {
                      if (!date) {
                        return <div key={index} className="aspect-square border-r border-b border-slate-300 bg-slate-100" />;
                      }
                      const isEndpoint = isSameDate(date, dateRange.start) || isSameDate(date, dateRange.end);
                      const inRange = !isEndpoint && isInPreviewRange(date);
                      const today = isToday(date);
                      return (
                        <button
                          key={index}
                          type="button"
                          onClick={() => handleRangeDayClick(date)}
                          onMouseEnter={() => setHoverDate(date)}
                          className={`relative aspect-square border-r border-b border-slate-300 p-1 text-left align-top transition-colors ${
                            isEndpoint || inRange ? '' : 'hover:bg-slate-50'
                          }`}
                          style={isEndpoint ? { backgroundColor: '#ea3663' } : inRange ? { backgroundColor: '#fde3ea' } : undefined}
                        >
                          <span
                            className={`absolute top-1 left-1.5 text-xs leading-none ${
                              isEndpoint ? 'text-white font-semibold' : today ? 'font-bold' : 'text-slate-700'
                            }`}
                            style={today && !isEndpoint ? { color: '#ea3663' } : undefined}
                          >
                            {date.getDate()}
                          </span>
                          {hasEntry(date) && (
                            entryTagIconByDate.has(formatDate(date)) ? (
                              <span className="absolute bottom-1 right-1">
                                <TagIcon
                                  icon={entryTagIconByDate.get(formatDate(date))}
                                  size={18}
                                  color={isEndpoint ? '#ffffff' : '#ea3663'}
                                />
                              </span>
                            ) : (
                              <span
                                className="absolute bottom-1.5 right-1.5 w-1.5 h-1.5 rounded-full"
                                style={{ backgroundColor: isEndpoint ? '#ffffff' : '#ea3663' }}
                              ></span>
                            )
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
      </div>
      )}

      {/* Entries Section */}
      <div className="bg-white p-6">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold text-slate-800 font-venti">{formatRangeLabel(dateRange)}</h3>
            <button
              type="button"
              onClick={() => setShowCalendar(open => !open)}
              className={`p-2 rounded-lg transition-colors ${showCalendar ? 'bg-slate-100 text-slate-900' : 'text-slate-600 hover:bg-slate-50'}`}
              title={showCalendar ? 'Hide calendar' : 'Filter by date range'}
              aria-label={showCalendar ? 'Hide calendar' : 'Filter by date range'}
              aria-pressed={showCalendar}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </button>
            {dateRange.start && (
              <button
                type="button"
                onClick={clearDateRange}
                className="p-2 rounded-lg text-slate-600 hover:bg-slate-50 hover:text-red-600 transition-colors"
                title="Remove date filter"
                aria-label="Remove date filter"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
          <div className="flex flex-wrap items-center justify-end gap-3">
            {(entries.length > 0 || hasActiveEntryFilters) && (
              <>
                <DropdownMenu
                  className="w-full sm:w-56"
                  options={videoFilterOptions}
                  value={videoFilter}
                  onChange={setVideoFilter}
                  placeholder="Select video"
                  searchable
                  searchPlaceholder="Search videos..."
                  clearable
                  clearLabel="Clear video filter"
                />
                <DropdownMenu
                  className="w-full sm:w-56"
                  options={bookFilterOptions}
                  value={bookFilter}
                  onChange={setBookFilter}
                  placeholder="Select book"
                  searchable
                  searchPlaceholder="Search books..."
                  clearable
                  clearLabel="Clear book filter"
                />
                <MultiSelectDropdown
                  className="w-full sm:w-56"
                  options={tagFilterOptions}
                  value={tagFilter}
                  onChange={setTagFilter}
                  placeholder="All tags"
                  searchPlaceholder="Search tags..."
                  emptyMessage="No tagged entries yet"
                  clearable
                  clearLabel="Clear tag filter"
                />
              </>
            )}
            <button
              onClick={handleCreateEntry}
              className="px-4 py-3 text-sm font-medium text-white rounded-xl transition-colors flex items-center space-x-2"
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
        </div>

        {loadingEntries ? (
          <div className="bg-slate-50 rounded-xl shadow-sm border border-slate-200 p-12 text-center">
            <p className="text-slate-600">Loading entries...</p>
          </div>
        ) : entries.length === 0 ? (
          <div className="bg-slate-50 rounded-xl shadow-sm border border-slate-200 p-12 text-center">
            <div className="text-6xl mb-4">📔</div>
            <h3 className="text-xl font-semibold text-slate-800 mb-2 font-venti">No Entries Yet</h3>
            <p className="text-slate-600 mb-4">Create your first journal entry</p>
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
        ) : filteredEntries.length === 0 ? (
          <div className="bg-slate-50 rounded-xl shadow-sm border border-slate-200 p-12 text-center">
            <p className="text-slate-600">No entries match these filters.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredEntries.map((entry) => {
              // Look up related objects at render time (prevents re-fetching when related data loads)
              const inspiration = entry.inspiration_id ? inspirations.find(i => i.id === entry.inspiration_id) : null;
              const book = entry.book_id ? books.find(b => b.id === entry.book_id) : null;
              const pencilSet = entry.pencilSet_id ? pencilSets.find(p => p.id === entry.pencilSet_id) : null;
              // Support both old single palette_id and new palettes array
              const entryPalettes = entry.palettes || (entry.palette_id ? [entry.palette_id] : []);
              const dateParts = getEntryDateParts(entry.date);
              const notesAreHtml = Boolean(entry.notes) && /<\/?[a-z][\s\S]*>/i.test(entry.notes);
              const truncatedNotes = entry.notes
                ? truncateWords(notesAreHtml ? htmlToPlainText(entry.notes) : entry.notes, ENTRY_PREVIEW_WORD_LIMIT)
                : null;
              
              return (
              <div
                key={entry.id}
                className="group relative bg-slate-50 rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-all"
                onMouseEnter={(e) => e.currentTarget.style.borderColor = '#ea3663'}
                onMouseLeave={(e) => e.currentTarget.style.borderColor = '#e2e8f0'}
              >
                <div className="flex items-start justify-between gap-4">
                  {dateParts && (
                    <div
                      className="flex-shrink-0 w-16 rounded-lg overflow-hidden border border-slate-200 bg-white text-center shadow-sm"
                      aria-label={`${dateParts.month} ${dateParts.day}, ${dateParts.year}`}
                    >
                      <div className="py-1 text-xs font-semibold uppercase tracking-wide text-white" style={{ backgroundColor: '#ea3663' }}>
                        {dateParts.month}
                      </div>
                      <div className="pt-1 pb-1 text-2xl font-bold leading-none text-slate-800">
                        {dateParts.day}
                      </div>
                      {dateParts.year < new Date().getFullYear() && (
                        <div className="pb-1 text-[11px] leading-none text-slate-500">{dateParts.year}</div>
                      )}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-2 last:mb-0">
                      {inspiration && (
                        <EntryTag icon="inspiration">
                          {inspiration.title || inspiration.name || `Inspiration ${entry.inspiration_id}`}
                        </EntryTag>
                      )}
                      {book && (
                        <EntryTag icon="book">
                          {book.title || book.name || `Book ${entry.book_id}`}
                          {entry.book_page && ` · ${formatBookPage(entry.book_page)}`}
                        </EntryTag>
                      )}
                      {pencilSet && (
                        <EntryTag icon="pencils">
                          {pencilSet.name} {pencilSet.brand ? `(${pencilSet.brand})` : ''}
                        </EntryTag>
                      )}
                      {entry.pencils && entry.pencils.length > 0 && (
                        <EntryTag icon="pencils">
                          {entry.pencils.length} individual pencil{entry.pencils.length !== 1 ? 's' : ''}
                        </EntryTag>
                      )}
                      {entryPalettes && entryPalettes.length > 0 && (
                        <>
                          {entryPalettes.map((paletteId, idx) => {
                            const palette = palettes.find(p => p.id === paletteId);
                            return palette ? (
                              <EntryTag key={idx} icon="palette">
                                {palette.name || palette.title || `Palette ${paletteId}`}
                              </EntryTag>
                            ) : null;
                          })}
                        </>
                      )}
                      {entry.combos && entry.combos.length > 0 && (
                        <>
                          {entry.combos.map((comboId, idx) => {
                            const combo = combos.find(c => c.id === comboId);
                            return combo ? (
                              <EntryTag key={idx} icon="combo">
                                {combo.name || combo.title || `Combo ${comboId}`}
                              </EntryTag>
                            ) : null;
                          })}
                        </>
                      )}
                      {entry.tags.map(tag => (
                        <span key={tag.id} className="inline-flex items-center gap-1 px-2 py-1 bg-slate-100 text-slate-600 rounded-full text-xs">
                          <TagIcon icon={tag.icon} size={14} />
                          {tag.tag}
                        </span>
                      ))}
                    </div>
                    {entry.image_url && (
                      <a
                        href={entry.image_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block w-fit mb-3 last:mb-0"
                        title="Open full-size photo"
                      >
                        <img
                          src={entry.image_url}
                          alt="Journal entry"
                          loading="lazy"
                          className="max-h-64 max-w-full rounded-lg border border-slate-200 object-contain bg-white"
                        />
                      </a>
                    )}
                    {entry.notes && (
                      truncatedNotes ? (
                        <p className="text-[12px] text-slate-700 whitespace-pre-wrap">{truncatedNotes}</p>
                      ) : notesAreHtml ? (
                        <div
                          className="text-[12px] text-slate-700 whitespace-pre-wrap [&_ul]:list-disc [&_ul]:ml-6 [&_ul]:my-2 [&_ol]:list-decimal [&_ol]:ml-6 [&_ol]:my-2 [&_li]:my-1"
                          dangerouslySetInnerHTML={{ __html: sanitizeRichTextHtml(entry.notes) }}
                        />
                      ) : (
                        <p className="text-[12px] text-slate-700 whitespace-pre-wrap">{entry.notes}</p>
                      )
                    )}
                  </div>
                </div>
                <div className="absolute inset-0 z-10 bg-black bg-opacity-70 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-wrap items-center justify-center gap-3 p-4 rounded-xl">
                  <PrimaryButton
                    onClick={() => navigate(getEntryColorAlongPath(inspiration, entry.book_id))}
                    className="w-40 min-h-10 justify-center"
                    icon={
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    }
                  >
                    Continue
                  </PrimaryButton>
                  <button
                    onClick={() => handleEditEntry(entry)}
                    className="w-40 min-h-10 text-xs px-3 py-2 bg-white text-slate-800 rounded-lg font-medium hover:bg-slate-100 transition-colors flex items-center justify-center gap-1.5"
                  >
                    <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteEntry(entry.id)}
                    className="w-40 min-h-10 text-xs px-3 py-2 bg-white text-red-600 rounded-lg font-medium hover:bg-red-50 transition-colors flex items-center justify-center gap-1.5"
                  >
                    <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Delete
                  </button>
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
                        onChange={(value) => setFormData({ ...formData, book: value, bookPage: EMPTY_BOOK_PAGE })}
                        placeholder="Select book..."
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Your Pencil Set</label>
                      <DropdownMenu
                        options={userSetJournalOptions}
                        value={pencilSelection.setIds[0] || ''}
                        onChange={(value) => setPencilSelection({ setIds: value ? [value] : [], sizeIds: [] })}
                        placeholder="Select your pencil set..."
                      />
                    </div>

                    {formData.book && (
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Book Page <span className="font-normal text-slate-400">(optional)</span>
                        </label>
                        <BookPageFields
                          bookId={formData.book}
                          value={formData.bookPage}
                          onChange={(bookPage) => setFormData((prev) => ({ ...prev, bookPage }))}
                          disabled={savingEntry}
                          bare
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
                        <span>Select Combos/Palettes</span>
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
                <TagSelect
                  value={formData.tags || []}
                  onChange={(tags) => setFormData({ ...formData, tags })}
                  disabled={savingEntry}
                />
              )}

              {!loadingFormData && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Photo</label>
                  {entryImage.previewUrl ? (
                    <div className="flex items-start gap-4">
                      <img
                        src={entryImage.previewUrl}
                        alt="Journal entry"
                        className="max-h-48 max-w-[16rem] rounded-lg border border-slate-200 object-contain bg-white"
                      />
                      <div className="flex flex-col gap-2">
                        <label className="px-3 py-1.5 text-sm text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 cursor-pointer transition-colors text-center">
                          Replace
                          <input type="file" accept="image/*" className="hidden" onChange={handleEntryImageSelected} />
                        </label>
                        <button
                          type="button"
                          onClick={handleRemoveEntryImage}
                          className="px-3 py-1.5 text-sm text-red-600 bg-white border border-slate-200 rounded-lg hover:bg-red-50 transition-colors"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ) : (
                    <label className="flex items-center justify-center gap-2 w-full px-4 py-6 border-2 border-dashed border-slate-300 rounded-lg text-sm text-slate-600 hover:border-slate-400 hover:bg-white cursor-pointer transition-colors">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span>Add a photo of your work</span>
                      <input type="file" accept="image/*" className="hidden" onChange={handleEntryImageSelected} />
                    </label>
                  )}
                </div>
              )}

              {!loadingFormData && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Notes</label>
                  <RichTextEditor
                    value={formData.notes}
                    onChange={(value) => setFormData({ ...formData, notes: value })}
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
                  disabled={savingEntry}
                  className="px-4 py-2 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ backgroundColor: '#ea3663' }}
                  onMouseEnter={(e) => e.target.style.backgroundColor = '#d12a4f'}
                  onMouseLeave={(e) => e.target.style.backgroundColor = '#ea3663'}
                >
                  {savingEntry ? 'Saving...' : 'Save Entry'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default ColoristLog;

