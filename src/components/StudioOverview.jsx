import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { colorPalettesAPI, colorCombosAPI, coloredPencilSetsAPI, booksAPI, inspirationAPI, userAPI } from '../services/api';
import HoverableCard from './HoverableCard';
import UpgradeBanner from './UpgradeBanner';

// Component for pencil set card with thumbnail support
const PencilSetCard = ({ set, thumbnailUrl, onNavigate, isFavorite }) => {
  const [imageError, setImageError] = useState(false);

  return (
    <div
      className="bg-slate-50 rounded-xl shadow-sm border border-slate-200 p-4 hover:shadow-md transition-all cursor-pointer"
      onMouseEnter={(e) => e.currentTarget.style.borderColor = '#ea3663'}
      onMouseLeave={(e) => e.currentTarget.style.borderColor = '#e2e8f0'}
      onClick={onNavigate}
    >
      {thumbnailUrl && !imageError ? (
        <img 
          src={thumbnailUrl} 
          alt={`${set.set?.brand || set.brand} ${set.set?.name || set.name}`}
          className="w-full h-32 object-cover rounded-lg mb-2"
          onError={() => setImageError(true)}
        />
      ) : (
        <div 
          className="w-full h-32 rounded-lg mb-2 flex items-center justify-center"
          style={{ backgroundColor: '#f1f5f9' }}
        >
          <svg className="w-12 h-12 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
          </svg>
        </div>
      )}
      <div className="flex items-center gap-1 mb-1">
        <h4 className="font-semibold text-slate-800 text-sm">{set.set?.name || set.name}</h4>
        {isFavorite && (
          <svg className="w-4 h-4 text-red-500 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
            <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
        )}
      </div>
      <p className="text-xs text-slate-500 mb-2">{set.set?.brand || set.brand}</p>
      <p className="text-xs text-slate-600">{set.count || 0} pencils</p>
    </div>
  );
};

const StudioOverview = ({ user }) => {
  const navigate = useNavigate();
  const [inspirationIndex, setInspirationIndex] = useState(0);
  const [pencilSetIndex, setPencilSetIndex] = useState(0);
  const [comboIndex, setComboIndex] = useState(0);
  const [paletteIndex, setPaletteIndex] = useState(0);
  const [bookIndex, setBookIndex] = useState(0);

  // Check if user has free plan
  const isFreePlan = user?.subscription_plan === 'free' || !user?.subscription_plan;
  const FREE_PLAN_LIMIT = 5;
  
  // Pencil Sets state
  const [pencilSets, setPencilSets] = useState([]);
  const [pencilSetPage, setPencilSetPage] = useState(1);
  const [pencilSetHasMore, setPencilSetHasMore] = useState(true);
  const [pencilSetsLoading, setPencilSetsLoading] = useState(true);
  const [pencilSetsError, setPencilSetsError] = useState(null);
  
  // Color Combos state
  const [combos, setCombos] = useState([]);
  const [comboPage, setComboPage] = useState(1);
  const [comboHasMore, setComboHasMore] = useState(true);
  const [combosLoading, setCombosLoading] = useState(true);
  const [combosError, setCombosError] = useState(null);
  
  // Color Palettes state
  const [palettes, setPalettes] = useState([]);
  const [palettePage, setPalettePage] = useState(1);
  const [paletteHasMore, setPaletteHasMore] = useState(true);
  const [palettesLoading, setPalettesLoading] = useState(true);
  const [palettesError, setPalettesError] = useState(null);
  const [paletteFavorites, setPaletteFavorites] = useState(new Set());
  
  // Favorites state for all types
  const [inspirationFavorites, setInspirationFavorites] = useState(new Set());
  const [pencilSetFavorites, setPencilSetFavorites] = useState(new Set());
  const [comboFavorites, setComboFavorites] = useState(new Set());
  const [bookFavorites, setBookFavorites] = useState(new Set());
  
  // Books state
  const [books, setBooks] = useState([]);
  const [bookPage, setBookPage] = useState(1);
  const [bookHasMore, setBookHasMore] = useState(true);
  const [booksLoading, setBooksLoading] = useState(true);
  const [booksError, setBooksError] = useState(null);

  // Inspiration state
  const [inspirations, setInspirations] = useState([]);
  const [inspirationPage, setInspirationPage] = useState(1);
  const [inspirationHasMore, setInspirationHasMore] = useState(true);
  const [inspirationsLoading, setInspirationsLoading] = useState(true);
  const [inspirationsError, setInspirationsError] = useState(null);

  // Fetch colored pencil sets from API
  const fetchPencilSets = useCallback(async (page = 1, append = false) => {
    if (!append) {
      setPencilSetsLoading(true);
    }
    setPencilSetsError(null);
    
    try {
      const response = await coloredPencilSetsAPI.getAll(page, 5);
      
      // Handle paginated response
      let setsData = [];
      if (Array.isArray(response)) {
        setsData = response;
      } else if (response.data && Array.isArray(response.data)) {
        setsData = response.data;
      }

      // Transform to match overview format
      const transformedSets = setsData.map(set => ({
        id: set.id,
        name: set.name,
        brand: set.brand,
        // Use the thumb field from colored_pencil_set_sizes database table
        thumb: set.thumb,
        set: set.set || set.colored_pencil_set,
        // Use the count field directly from colored_pencil_set_sizes database table
        count: set.count
      }));

      if (append) {
        setPencilSets(prev => [...prev, ...transformedSets]);
      } else {
        setPencilSets(transformedSets);
      }

      // Update pagination state
      if (response.current_page !== undefined) {
        setPencilSetHasMore(response.current_page < response.last_page);
        setPencilSetPage(response.current_page);
      }
    } catch (err) {
      setPencilSetsError(err.message || err.data?.message || 'Failed to load pencil sets');
      console.error('Error fetching pencil sets:', err);
      if (!append) {
        setPencilSets([]);
      }
    } finally {
      setPencilSetsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPencilSets(1, false);
  }, [fetchPencilSets]);

  // Fetch color combos from API
  const fetchCombos = useCallback(async (page = 1, append = false) => {
    if (!append) {
      setCombosLoading(true);
    }
    setCombosError(null);
    
    try {
      const response = await colorCombosAPI.getAll(page, 5);
      
      // Handle paginated response
      let combosData = [];
      if (Array.isArray(response)) {
        combosData = response;
      } else if (response.data && Array.isArray(response.data)) {
        combosData = response.data;
      }

      // Transform colors to array of hex strings for StudioOverview display
      const transformedCombos = combosData.map(combo => {
        let colors = [];
        if (combo.pencils && Array.isArray(combo.pencils)) {
          colors = combo.pencils.map(pencil => {
            if (pencil.color && pencil.color.hex) {
              return pencil.color.hex;
            }
            return null;
          }).filter(Boolean);
        } else if (combo.colors && Array.isArray(combo.colors)) {
          colors = combo.colors.map(color => {
            if (typeof color === 'string') {
              return color;
            }
            if (color.hex) {
              return color.hex;
            }
            return null;
          }).filter(Boolean);
        }
        return {
          ...combo,
          colors: colors.length > 0 ? colors : []
        };
      });

      if (append) {
        setCombos(prev => [...prev, ...transformedCombos]);
      } else {
        setCombos(transformedCombos);
      }

      // Update pagination state
      if (response.current_page !== undefined) {
        setComboHasMore(response.current_page < response.last_page);
        setComboPage(response.current_page);
      }
    } catch (err) {
      setCombosError(err.message || err.data?.message || 'Failed to load color combos');
      console.error('Error fetching color combos:', err);
      if (!append) {
        setCombos([]);
      }
    } finally {
      setCombosLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCombos(1, false);
  }, [fetchCombos]);

  // Fetch color palettes from API
  const fetchPalettes = useCallback(async (page = 1, append = false) => {
    if (!append) {
      setPalettesLoading(true);
    }
    setPalettesError(null);
    
    try {
      const response = await colorPalettesAPI.getAll(page, 5);
      
      // Handle paginated response
      let palettesData = [];
      if (Array.isArray(response)) {
        palettesData = response;
      } else if (response.data && Array.isArray(response.data)) {
        palettesData = response.data;
      }

      if (append) {
        setPalettes(prev => [...prev, ...palettesData]);
      } else {
        setPalettes(palettesData);
      }

      // Update pagination state
      if (response.current_page !== undefined) {
        setPaletteHasMore(response.current_page < response.last_page);
        setPalettePage(response.current_page);
      }
    } catch (err) {
      setPalettesError(err.message || err.data?.message || 'Failed to load color palettes');
      console.error('Error fetching color palettes:', err);
      if (!append) {
        setPalettes([]);
      }
    } finally {
      setPalettesLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPalettes(1, false);
  }, [fetchPalettes]);


  // Fetch all favorites
  const fetchAllFavorites = useCallback(async () => {
    try {
      const userId = user?.id;
      if (!userId) return;
      
      const response = await userAPI.getFavorites(userId);
      
      // Handle different response structures
      let favoritesData = [];
      if (Array.isArray(response)) {
        favoritesData = response;
      } else if (response?.data && Array.isArray(response.data)) {
        favoritesData = response.data;
      }
      
      if (favoritesData.length > 0) {
        const inspirationFavs = new Set();
        const pencilSetFavs = new Set();
        const comboFavs = new Set();
        const bookFavs = new Set();
        const paletteFavs = new Set();
        
        favoritesData.forEach(fav => {
          const id = Number(fav.favoritable_id);
          if (isNaN(id)) return;
          
          const type = fav.favoritable_type || '';
          
          if (type.includes('Video') || type.includes('File')) {
            const key = type.includes('Video') ? `video-${id}` : `file-${id}`;
            inspirationFavs.add(key);
          } else if (type.includes('ColoredPencilSet')) {
            pencilSetFavs.add(id);
          } else if (type.includes('ColorCombo')) {
            comboFavs.add(id);
          } else if (type.includes('Book')) {
            bookFavs.add(id);
          } else if (type.includes('ColorPalette')) {
            paletteFavs.add(id);
          }
        });
        
        setInspirationFavorites(inspirationFavs);
        setPencilSetFavorites(pencilSetFavs);
        setComboFavorites(comboFavs);
        setBookFavorites(bookFavs);
        setPaletteFavorites(paletteFavs);
      } else {
        setInspirationFavorites(new Set());
        setPencilSetFavorites(new Set());
        setComboFavorites(new Set());
        setBookFavorites(new Set());
        setPaletteFavorites(new Set());
      }
    } catch (err) {
      console.error('Error fetching favorites:', err);
      setInspirationFavorites(new Set());
      setPencilSetFavorites(new Set());
      setComboFavorites(new Set());
      setBookFavorites(new Set());
      setPaletteFavorites(new Set());
    }
  }, [user]);

  useEffect(() => {
    fetchAllFavorites();
  }, [fetchAllFavorites]);

  // Sort palettes: favorites first, then alphabetically by title
  const sortedPalettes = useMemo(() => {
    return [...palettes].sort((a, b) => {
      // Convert to number to ensure type consistency
      const aId = Number(a.id);
      const bId = Number(b.id);
      const aIsFavorite = !isNaN(aId) && paletteFavorites.has(aId);
      const bIsFavorite = !isNaN(bId) && paletteFavorites.has(bId);
      
      // If one is favorite and the other isn't, favorite comes first
      if (aIsFavorite && !bIsFavorite) return -1;
      if (!aIsFavorite && bIsFavorite) return 1;
      
      // Both are favorites or both aren't - sort alphabetically by title
      const aTitle = (a.title || '').toLowerCase();
      const bTitle = (b.title || '').toLowerCase();
      return aTitle.localeCompare(bTitle);
    });
  }, [palettes, paletteFavorites]);

  // Sort inspirations: favorites first, then alphabetically by title
  const sortedInspirations = useMemo(() => {
    return [...inspirations].sort((a, b) => {
      const aKey = `${a.type === 'video' ? 'video' : 'file'}-${Number(a.id)}`;
      const bKey = `${b.type === 'video' ? 'video' : 'file'}-${Number(b.id)}`;
      const aIsFavorite = inspirationFavorites.has(aKey);
      const bIsFavorite = inspirationFavorites.has(bKey);
      
      // If one is favorite and the other isn't, favorite comes first
      if (aIsFavorite && !bIsFavorite) return -1;
      if (!aIsFavorite && bIsFavorite) return 1;
      
      // Both are favorites or both aren't - sort alphabetically by title
      const aTitle = (a.title || '').toLowerCase();
      const bTitle = (b.title || '').toLowerCase();
      return aTitle.localeCompare(bTitle);
    });
  }, [inspirations, inspirationFavorites]);

  // Sort pencil sets: favorites first, then alphabetically by name
  const sortedPencilSets = useMemo(() => {
    return [...pencilSets].sort((a, b) => {
      // Get the ColoredPencilSet ID (not the set size ID)
      const aSetId = Number(a.set?.id || a.colored_pencil_set?.id);
      const bSetId = Number(b.set?.id || b.colored_pencil_set?.id);
      const aIsFavorite = !isNaN(aSetId) && pencilSetFavorites.has(aSetId);
      const bIsFavorite = !isNaN(bSetId) && pencilSetFavorites.has(bSetId);
      
      // If one is favorite and the other isn't, favorite comes first
      if (aIsFavorite && !bIsFavorite) return -1;
      if (!aIsFavorite && bIsFavorite) return 1;
      
      // Both are favorites or both aren't - sort alphabetically by name
      const aName = ((a.set?.name || a.name) || '').toLowerCase();
      const bName = ((b.set?.name || b.name) || '').toLowerCase();
      return aName.localeCompare(bName);
    });
  }, [pencilSets, pencilSetFavorites]);

  // Sort combos: favorites first, then alphabetically by title
  const sortedCombos = useMemo(() => {
    return [...combos].sort((a, b) => {
      const aId = Number(a.id);
      const bId = Number(b.id);
      const aIsFavorite = !isNaN(aId) && comboFavorites.has(aId);
      const bIsFavorite = !isNaN(bId) && comboFavorites.has(bId);
      
      // If one is favorite and the other isn't, favorite comes first
      if (aIsFavorite && !bIsFavorite) return -1;
      if (!aIsFavorite && bIsFavorite) return 1;
      
      // Both are favorites or both aren't - sort alphabetically by title
      const aTitle = (a.title || '').toLowerCase();
      const bTitle = (b.title || '').toLowerCase();
      return aTitle.localeCompare(bTitle);
    });
  }, [combos, comboFavorites]);

  // Sort books: favorites first, then alphabetically by title
  const sortedBooks = useMemo(() => {
    return [...books].sort((a, b) => {
      const aId = Number(a.id);
      const bId = Number(b.id);
      const aIsFavorite = !isNaN(aId) && bookFavorites.has(aId);
      const bIsFavorite = !isNaN(bId) && bookFavorites.has(bId);
      
      // If one is favorite and the other isn't, favorite comes first
      if (aIsFavorite && !bIsFavorite) return -1;
      if (!aIsFavorite && bIsFavorite) return 1;
      
      // Both are favorites or both aren't - sort alphabetically by title
      const aTitle = (a.title || '').toLowerCase();
      const bTitle = (b.title || '').toLowerCase();
      return aTitle.localeCompare(bTitle);
    });
  }, [books, bookFavorites]);

  // Fetch books from API
  const fetchBooks = useCallback(async (page = 1, append = false) => {
    if (!append) {
      setBooksLoading(true);
    }
    setBooksError(null);
    
    try {
      const response = await booksAPI.getAll(page, 5);
      
      // Handle paginated response
      let booksData = [];
      if (Array.isArray(response)) {
        booksData = response;
      } else if (response.data && Array.isArray(response.data)) {
        booksData = response.data;
      }

      // Filter out archived books and map to component format
      const transformedBooks = booksData
        .filter(book => !book.archived)
        .map(book => ({
          id: book.id,
          title: book.title || 'Untitled',
          author: book.author || 'Unknown',
          cover: book.image || 'https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=400&h=300&fit=crop',
          progress: 0, // Not available in API
        }));

      if (append) {
        setBooks(prev => [...prev, ...transformedBooks]);
      } else {
        setBooks(transformedBooks);
      }

      // Update pagination state
      if (response.current_page !== undefined) {
        setBookHasMore(response.current_page < response.last_page);
        setBookPage(response.current_page);
      }
    } catch (err) {
      setBooksError(err.message || err.data?.message || 'Failed to load books');
      console.error('Error fetching books:', err);
      if (!append) {
        setBooks([]);
      }
    } finally {
      setBooksLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBooks(1, false);
  }, [fetchBooks]);

  // Fetch inspirations from API
  const fetchInspirations = useCallback(async (page = 1, append = false) => {
    if (!append) {
      setInspirationsLoading(true);
    }
    setInspirationsError(null);
    
    try {
      const response = await inspirationAPI.getAll(page, 5);
      
      // Handle paginated response
      let inspirationsData = [];
      if (Array.isArray(response)) {
        inspirationsData = response;
      } else if (response.data && Array.isArray(response.data)) {
        inspirationsData = response.data;
      }

      // Transform API data to match component format
      const transformedInspirations = inspirationsData.map(item => {
        const baseItem = {
          id: item.id,
          type: item.type,
          title: item.title || 'Untitled',
        };

        if (item.type === 'video') {
          return {
            ...baseItem,
            thumbnail: item.thumb || 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=400&h=300&fit=crop',
            videoId: item.embed_id,
            duration: null, // Duration not available in API response
          };
        } else if (item.type === 'file') {
          // Determine file type based on mime_type
          const isPdf = item.mime_type && item.mime_type.includes('pdf');
          const isImage = item.mime_type && item.mime_type.startsWith('image/');
          
          return {
            ...baseItem,
            type: isPdf ? 'pdf' : (isImage ? 'image' : 'file'),
            thumbnail: item.thumbnail_path || item.path || 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=400&h=300&fit=crop',
          };
        }
        
        return baseItem;
      });

      if (append) {
        setInspirations(prev => [...prev, ...transformedInspirations]);
      } else {
        setInspirations(transformedInspirations);
      }

      // Update pagination state
      if (response.current_page !== undefined) {
        setInspirationHasMore(response.current_page < response.last_page);
        setInspirationPage(response.current_page);
      }
    } catch (err) {
      setInspirationsError(err.message || err.data?.message || 'Failed to load inspiration');
      console.error('Error fetching inspiration:', err);
      if (!append) {
        setInspirations([]);
      }
    } finally {
      setInspirationsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInspirations(1, false);
  }, [fetchInspirations]);

  // Helper function to get visible items for carousel (shows 5 at a time)
  // For free plan users, limit to 5 total items
  const getVisibleItems = (items, currentIndex) => {
    const limitedItems = isFreePlan ? items.slice(0, FREE_PLAN_LIMIT) : items;
    return limitedItems.slice(currentIndex, currentIndex + 5);
  };

  // Helper function to get visible palettes (uses sorted palettes)
  const getVisiblePalettes = (currentIndex) => {
    return getVisibleItems(sortedPalettes, currentIndex);
  };

  // Helper function to check if carousel is needed
  const needsCarousel = (items, hasMore = false) => {
    return items.length > 5 || hasMore;
  };


  // Helper function to navigate carousel with pagination (moves one item at a time, shows 5)
  const navigateCarousel = async (direction, currentIndex, items, setIndex, hasMore, currentPage, fetchFn) => {
    if (direction === 'next') {
      // If we're near the end (within 5 items) and there's more data, fetch next page
      if (currentIndex >= items.length - 5 && hasMore) {
        await fetchFn(currentPage + 1, true);
      }
      // Move one item forward (but we'll show 5 items starting from this index)
      const maxIndex = Math.max(0, items.length - 5);
      setIndex(Math.min(currentIndex + 1, maxIndex));
    } else {
      // Move one item backward
      setIndex(Math.max(currentIndex - 1, 0));
    }
  };

  return (
    <div className="space-y-6">
      {/* Inspiration Section */}
      <div className="bg-white p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold text-slate-800 font-venti">Inspo</h3>
          <div className="flex items-center space-x-4">
            {needsCarousel(sortedInspirations, inspirationHasMore) && (
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => navigateCarousel('prev', inspirationIndex, sortedInspirations, setInspirationIndex, inspirationHasMore, inspirationPage, fetchInspirations)}
                  disabled={inspirationIndex === 0}
                  className="p-1.5 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <svg className="w-4 h-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <button
                  onClick={() => navigateCarousel('next', inspirationIndex, sortedInspirations, setInspirationIndex, inspirationHasMore, inspirationPage, fetchInspirations)}
                  disabled={inspirationIndex >= Math.max(0, sortedInspirations.length - 5) && !inspirationHasMore}
                  className="p-1.5 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <svg className="w-4 h-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            )}
            <div className="flex items-center space-x-3">
              <button
                onClick={() => navigate('/studio/inspiration', { state: { activeTab: 'studio', activeSection: 'library', openAddModal: true } })}
                className="text-sm text-white px-3 py-1.5 rounded-lg font-medium transition-colors inline-flex items-center space-x-1"
                style={{ backgroundColor: '#ea3663' }}
                onMouseEnter={(e) => e.target.style.backgroundColor = '#d12a4f'}
                onMouseLeave={(e) => e.target.style.backgroundColor = '#ea3663'}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span>Add</span>
              </button>
              <button
                onClick={() => navigate('/studio/inspiration', { state: { activeTab: 'studio', activeSection: 'library' } })}
                className="text-sm text-slate-600 hover:text-slate-800 transition-colors"
              >
                View All →
              </button>
            </div>
          </div>
        </div>
        {inspirationsLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-slate-500">Loading inspiration...</div>
          </div>
        ) : inspirationsError ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-sm text-red-600">{inspirationsError}</p>
          </div>
        ) : sortedInspirations.length === 0 ? (
          <div className="bg-slate-50 rounded-xl shadow-sm border border-slate-200 p-12 text-center">
            <div className="text-6xl mb-4">🎨</div>
            <h4 className="text-lg font-semibold text-slate-800 mb-2 font-venti">No Inspiration Yet</h4>
            <p className="text-sm text-slate-600 mb-4">Add your first video or file to get started</p>
            <button
              onClick={() => navigate('/studio/inspiration', { state: { activeTab: 'studio', activeSection: 'library', openAddModal: true } })}
              className="px-6 py-3 text-white rounded-lg font-medium transition-colors inline-flex items-center space-x-2"
              style={{ backgroundColor: '#ea3663' }}
              onMouseEnter={(e) => e.target.style.backgroundColor = '#d12a4f'}
              onMouseLeave={(e) => e.target.style.backgroundColor = '#ea3663'}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span>Add Inspiration</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {getVisibleItems(sortedInspirations, inspirationIndex).map((item) => (
            <div
              key={item.id}
              className="bg-slate-50 rounded-xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-all group relative"
              onMouseEnter={(e) => e.currentTarget.style.borderColor = '#ea3663'}
              onMouseLeave={(e) => e.currentTarget.style.borderColor = '#e2e8f0'}
            >
              <div className="relative aspect-video bg-slate-100 overflow-hidden">
                <img
                  src={item.thumbnail}
                  alt={item.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                {item.type === 'video' && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30">
                    <div className="w-10 h-10 rounded-full bg-white bg-opacity-90 flex items-center justify-center">
                      <svg className="w-5 h-5 ml-0.5" fill="currentColor" viewBox="0 0 24 24" style={{ color: '#49817b' }}>
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    </div>
                  </div>
                )}
                {item.type === 'pdf' && (
                  <div className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded text-xs font-medium">
                    PDF
                  </div>
                )}
                {item.duration && (
                  <div className="absolute bottom-2 right-2 bg-black bg-opacity-70 text-white px-2 py-1 rounded text-xs">
                    {item.duration}
                  </div>
                )}
                {/* Hover Overlay with Buttons */}
                <div className="absolute inset-0 bg-black bg-opacity-70 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-center gap-3">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      const type = item.type === 'video' ? 'video' : 'file';
                      navigate(`/edit/inspiration/${type}/${item.id}`);
                    }}
                    className="w-40 px-4 py-2 bg-white text-slate-800 rounded-lg font-medium hover:bg-slate-100 transition-colors flex items-center justify-center gap-2"
                    title="Edit"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    Edit
                  </button>
                  {(item.type === 'video' || item.type === 'image') && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (item.type === 'video' && item.videoId) {
                          navigate(`/color-along?video=${item.videoId}`);
                        } else if (item.type === 'image') {
                          navigate(`/color-along?image=${item.id}`);
                        }
                      }}
                      className="w-40 px-4 py-2 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                      style={{
                        backgroundColor: '#ea3663'
                      }}
                      onMouseEnter={(e) => e.target.style.backgroundColor = '#d12a4f'}
                      onMouseLeave={(e) => e.target.style.backgroundColor = '#ea3663'}
                      title="Color Along"
                    >
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                      Color Along
                    </button>
                  )}
                </div>
              </div>
              <div className="p-3">
                <div className="flex items-start justify-between mb-1">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1 mb-1">
                      <h4 className="font-medium text-slate-800 line-clamp-2 text-sm">{item.title}</h4>
                      {inspirationFavorites.has(`${item.type === 'video' ? 'video' : 'file'}-${Number(item.id)}`) && (
                        <svg className="w-4 h-4 text-red-500 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                        </svg>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 capitalize">{item.type}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
          </div>
        )}
      </div>

      {/* Pencil Sets Section */}
      <div className="bg-white p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold text-slate-800 font-venti">Media</h3>
          <div className="flex items-center space-x-4">
            {needsCarousel(sortedPencilSets, pencilSetHasMore) && (
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => navigateCarousel('prev', pencilSetIndex, sortedPencilSets, setPencilSetIndex, pencilSetHasMore, pencilSetPage, fetchPencilSets)}
                  disabled={pencilSetIndex === 0}
                  className="p-1.5 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <svg className="w-4 h-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <button
                  onClick={() => navigateCarousel('next', pencilSetIndex, sortedPencilSets, setPencilSetIndex, pencilSetHasMore, pencilSetPage, fetchPencilSets)}
                  disabled={pencilSetIndex >= Math.max(0, sortedPencilSets.length - 5) && !pencilSetHasMore}
                  className="p-1.5 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <svg className="w-4 h-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            )}
            <div className="flex items-center space-x-3">
              <button
                onClick={() => navigate('/studio/media', { state: { activeTab: 'studio', activeSection: 'pencils', openAddModal: true } })}
                className="text-sm text-white px-3 py-1.5 rounded-lg font-medium transition-colors inline-flex items-center space-x-1"
                style={{ backgroundColor: '#ea3663' }}
                onMouseEnter={(e) => e.target.style.backgroundColor = '#d12a4f'}
                onMouseLeave={(e) => e.target.style.backgroundColor = '#ea3663'}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span>Add</span>
              </button>
              <button
                onClick={() => navigate('/studio/media', { state: { activeTab: 'studio', activeSection: 'pencils' } })}
                className="text-sm text-slate-600 hover:text-slate-800 transition-colors"
              >
                View All →
              </button>
            </div>
          </div>
        </div>
        {pencilSetsLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-slate-500">Loading pencil sets...</div>
          </div>
        ) : pencilSetsError ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-sm text-red-600">{pencilSetsError}</p>
          </div>
        ) : sortedPencilSets.length === 0 ? (
          <div className="bg-slate-50 rounded-xl shadow-sm border border-slate-200 p-12 text-center">
            <div className="text-6xl mb-4">✏️</div>
            <h4 className="text-lg font-semibold text-slate-800 mb-2 font-venti">No Pencil Sets Yet</h4>
            <p className="text-sm text-slate-600 mb-4">Add your first colored pencil set to get started</p>
            <button
              onClick={() => navigate('/studio/media', { state: { activeTab: 'studio', activeSection: 'pencils', openAddModal: true } })}
              className="px-6 py-3 text-white rounded-lg font-medium transition-colors inline-flex items-center space-x-2"
              style={{ backgroundColor: '#ea3663' }}
              onMouseEnter={(e) => e.target.style.backgroundColor = '#d12a4f'}
              onMouseLeave={(e) => e.target.style.backgroundColor = '#ea3663'}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span>Add Pencil Set</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {getVisibleItems(sortedPencilSets, pencilSetIndex).map((set) => {
              // Prioritize thumbnail from set size (colored_pencil_set_sizes.thumb), fallback to set thumb
              // Use set size thumb if it exists (even if it's a full URL), otherwise use set thumb
              const thumbnail = set.thumb ? set.thumb : (set.set?.thumb || null);
              const thumbnailUrl = thumbnail 
                ? (thumbnail.startsWith('http') ? thumbnail : `${process.env.REACT_APP_API_BASE_URL?.replace('/api', '') || 'http://localhost:8000'}/storage/${thumbnail}`)
                : null;
              
              const setId = Number(set.set?.id || set.colored_pencil_set?.id);
              const isFavorite = !isNaN(setId) && pencilSetFavorites.has(setId);
              
              return (
                <PencilSetCard
                  key={set.id}
                  set={set}
                  thumbnailUrl={thumbnailUrl}
                  onNavigate={() => navigate('/studio/media', { state: { activeTab: 'studio', activeSection: 'pencils', selectedSetId: set.id } })}
                  isFavorite={isFavorite}
                />
              );
            })}
          </div>
        )}
      </div>

      {/* Color Combos Section */}
      <div className="bg-white p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold text-slate-800 font-venti">Color Combos</h3>
          <div className="flex items-center space-x-4">
            {needsCarousel(sortedCombos, comboHasMore) && (
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => navigateCarousel('prev', comboIndex, sortedCombos, setComboIndex, comboHasMore, comboPage, fetchCombos)}
                  disabled={comboIndex === 0}
                  className="p-1.5 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <svg className="w-4 h-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <button
                  onClick={() => navigateCarousel('next', comboIndex, sortedCombos, setComboIndex, comboHasMore, comboPage, fetchCombos)}
                  disabled={comboIndex >= Math.max(0, sortedCombos.length - 5) && !comboHasMore}
                  className="p-1.5 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <svg className="w-4 h-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            )}
            <div className="flex items-center space-x-3">
              <button
                onClick={() => navigate('/studio/combos', { state: { activeTab: 'studio', activeSection: 'combos', openAddModal: true } })}
                className="text-sm text-white px-3 py-1.5 rounded-lg font-medium transition-colors inline-flex items-center space-x-1"
                style={{ backgroundColor: '#ea3663' }}
                onMouseEnter={(e) => e.target.style.backgroundColor = '#d12a4f'}
                onMouseLeave={(e) => e.target.style.backgroundColor = '#ea3663'}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span>Add</span>
              </button>
              <button
                onClick={() => navigate('/studio/combos', { state: { activeTab: 'studio', activeSection: 'combos' } })}
                className="text-sm text-slate-600 hover:text-slate-800 transition-colors"
              >
                View All →
              </button>
            </div>
          </div>
        </div>
        {combosLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-slate-500">Loading combos...</div>
          </div>
        ) : combosError ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-sm text-red-600">{combosError}</p>
          </div>
        ) : sortedCombos.length === 0 ? (
          <div className="bg-slate-50 rounded-xl shadow-sm border border-slate-200 p-12 text-center">
            <div className="text-6xl mb-4">🎨</div>
            <h4 className="text-lg font-semibold text-slate-800 mb-2 font-venti">No Combos Yet</h4>
            <p className="text-sm text-slate-600 mb-4">Create your first color combo to get started</p>
            <button
              onClick={() => navigate('/studio/combos', { state: { activeTab: 'studio', activeSection: 'combos', openAddModal: true } })}
              className="px-6 py-3 text-white rounded-lg font-medium transition-colors inline-flex items-center space-x-2"
              style={{ backgroundColor: '#ea3663' }}
              onMouseEnter={(e) => e.target.style.backgroundColor = '#d12a4f'}
              onMouseLeave={(e) => e.target.style.backgroundColor = '#ea3663'}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span>Add Combo</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {getVisibleItems(sortedCombos, comboIndex).map((combo) => {
              const comboId = Number(combo.id);
              const isFavorite = !isNaN(comboId) && comboFavorites.has(comboId);
              
              return (
              <div
                key={combo.id}
                className="bg-slate-50 rounded-xl shadow-sm border border-slate-200 p-4 hover:shadow-md transition-all cursor-pointer"
                onMouseEnter={(e) => e.currentTarget.style.borderColor = '#ea3663'}
                onMouseLeave={(e) => e.currentTarget.style.borderColor = '#e2e8f0'}
                onClick={() => navigate(`/edit/color-combo/${combo.id}`)}
              >
                <div className="flex space-x-1 mb-3">
                  {combo.pencils && combo.pencils.map((pencil, index) => (
                    <div
                      key={index}
                      className="flex-1 h-12 rounded-lg border border-slate-200"
                      style={{ backgroundColor: pencil.color?.hex || '#ccc' }}
                    ></div>
                  ))}
                </div>
                <div className="flex items-center gap-1 mb-1">
                  <h4 className="font-semibold text-slate-800 text-sm">{combo.title}</h4>
                  {isFavorite && (
                    <svg className="w-4 h-4 text-red-500 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                  )}
                </div>
                <p className="text-xs text-slate-500"></p>
              </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Color Palettes Section */}
      <div className="bg-white p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold text-slate-800 font-venti">Color Palettes</h3>
          <div className="flex items-center space-x-4">
            {needsCarousel(sortedPalettes, paletteHasMore) && (
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => navigateCarousel('prev', paletteIndex, sortedPalettes, setPaletteIndex, paletteHasMore, palettePage, fetchPalettes)}
                  disabled={paletteIndex === 0}
                  className="p-1.5 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <svg className="w-4 h-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <button
                  onClick={() => navigateCarousel('next', paletteIndex, sortedPalettes, setPaletteIndex, paletteHasMore, palettePage, fetchPalettes)}
                  disabled={paletteIndex >= Math.max(0, sortedPalettes.length - 5) && !paletteHasMore}
                  className="p-1.5 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <svg className="w-4 h-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            )}
            <div className="flex items-center space-x-3">
              <button
                onClick={() => navigate('/studio/palettes', { state: { activeTab: 'studio', activeSection: 'palettes', openAddModal: true } })}
                className="text-sm text-white px-3 py-1.5 rounded-lg font-medium transition-colors inline-flex items-center space-x-1"
                style={{ backgroundColor: '#ea3663' }}
                onMouseEnter={(e) => e.target.style.backgroundColor = '#d12a4f'}
                onMouseLeave={(e) => e.target.style.backgroundColor = '#ea3663'}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span>Add</span>
              </button>
              <button
                onClick={() => navigate('/studio/palettes', { state: { activeTab: 'studio', activeSection: 'palettes' } })}
                className="text-sm text-slate-600 hover:text-slate-800 transition-colors"
              >
                View All →
              </button>
            </div>
          </div>
        </div>
        {palettesLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-slate-500">Loading palettes...</div>
          </div>
        ) : palettesError ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-sm text-red-600">{palettesError}</p>
          </div>
        ) : sortedPalettes.length === 0 ? (
          <div className="bg-slate-50 rounded-xl shadow-sm border border-slate-200 p-12 text-center">
            <div className="text-6xl mb-4">🌈</div>
            <h4 className="text-lg font-semibold text-slate-800 mb-2 font-venti">No Palettes Yet</h4>
            <p className="text-sm text-slate-600 mb-4">Create your first color palette to get started</p>
            <button
              onClick={() => navigate('/studio/palettes', { state: { activeTab: 'studio', activeSection: 'palettes', openAddModal: true } })}
              className="px-6 py-3 text-white rounded-lg font-medium transition-colors inline-flex items-center space-x-2"
              style={{ backgroundColor: '#ea3663' }}
              onMouseEnter={(e) => e.target.style.backgroundColor = '#d12a4f'}
              onMouseLeave={(e) => e.target.style.backgroundColor = '#ea3663'}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span>Add Palette</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {getVisiblePalettes(paletteIndex).map((palette) => {
              const paletteId = Number(palette.id);
              const isFavorite = !isNaN(paletteId) && paletteFavorites.has(paletteId);
              
              return (
              <HoverableCard
                key={palette.id}
                onClick={() => navigate(`/edit/color-palette/${palette.id}`)}
              >
                {/* Color Strip */}
                <div className="flex h-24">
                  {palette.colors && palette.colors.length > 0 ? (
                    palette.colors.map((color, index) => (
                      <div
                        key={index}
                        className="flex-1"
                        style={{ backgroundColor: color.hex }}
                      ></div>
                    ))
                  ) : (
                    <div className="flex-1 bg-slate-200"></div>
                  )}
                </div>

                {/* Content */}
                <div className="p-5">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-1">
                      <h3 className="text-lg font-semibold text-slate-800 font-venti">{palette.title}</h3>
                      {isFavorite && (
                        <svg className="w-4 h-4 text-red-500 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                        </svg>
                      )}
                    </div>
                  </div>
                  <p className="text-sm text-slate-600 mb-4"></p>
                  {palette.base_color && (
                    <div className="flex items-center space-x-1 text-sm text-slate-500">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                      <span>Based on {palette.base_color}</span>
                    </div>
                  )}
                </div>
              </HoverableCard>
              );
            })}
          </div>
        )}
      </div>

      {/* Coloring Books Section */}
      <div className="bg-white p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold text-slate-800 font-venti">Coloring Books</h3>
          <div className="flex items-center space-x-4">
            {needsCarousel(sortedBooks, bookHasMore) && (
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => navigateCarousel('prev', bookIndex, sortedBooks, setBookIndex, bookHasMore, bookPage, fetchBooks)}
                  disabled={bookIndex === 0}
                  className="p-1.5 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <svg className="w-4 h-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <button
                  onClick={() => navigateCarousel('next', bookIndex, sortedBooks, setBookIndex, bookHasMore, bookPage, fetchBooks)}
                  disabled={bookIndex >= Math.max(0, sortedBooks.length - 5) && !bookHasMore}
                  className="p-1.5 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <svg className="w-4 h-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            )}
            <div className="flex items-center space-x-3">
              <button
                onClick={() => navigate('/studio/books', { state: { activeTab: 'studio', activeSection: 'books', openAddModal: true } })}
                className="text-sm text-white px-3 py-1.5 rounded-lg font-medium transition-colors inline-flex items-center space-x-1"
                style={{ backgroundColor: '#ea3663' }}
                onMouseEnter={(e) => e.target.style.backgroundColor = '#d12a4f'}
                onMouseLeave={(e) => e.target.style.backgroundColor = '#ea3663'}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span>Add</span>
              </button>
              <button
                onClick={() => navigate('/studio/books', { state: { activeTab: 'studio', activeSection: 'books' } })}
                className="text-sm text-slate-600 hover:text-slate-800 transition-colors"
              >
                View All →
              </button>
            </div>
          </div>
        </div>
        {booksLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-slate-500">Loading books...</div>
          </div>
        ) : booksError ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-sm text-red-600">{booksError}</p>
          </div>
        ) : sortedBooks.length === 0 ? (
          <div className="bg-slate-50 rounded-xl shadow-sm border border-slate-200 p-12 text-center">
            <div className="text-6xl mb-4">📖</div>
            <h4 className="text-lg font-semibold text-slate-800 mb-2 font-venti">No Coloring Books Yet</h4>
            <p className="text-sm text-slate-600 mb-4">Add your first coloring book to get started</p>
            <button
              onClick={() => navigate('/studio/books', { state: { activeTab: 'studio', activeSection: 'books', openAddModal: true } })}
              className="px-6 py-3 text-white rounded-lg font-medium transition-colors inline-flex items-center space-x-2"
              style={{ backgroundColor: '#ea3663' }}
              onMouseEnter={(e) => e.target.style.backgroundColor = '#d12a4f'}
              onMouseLeave={(e) => e.target.style.backgroundColor = '#ea3663'}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span>Add Book</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {getVisibleItems(sortedBooks, bookIndex).map((book) => {
              const bookId = Number(book.id);
              const isFavorite = !isNaN(bookId) && bookFavorites.has(bookId);
              
              return (
              <div
                key={book.id}
                className="bg-slate-50 rounded-xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-all cursor-pointer group"
                onMouseEnter={(e) => e.currentTarget.style.borderColor = '#ea3663'}
                onMouseLeave={(e) => e.currentTarget.style.borderColor = '#e2e8f0'}
                onClick={() => navigate(`/edit/book/${book.id}`)}
              >
                <div className="relative aspect-[3/4] bg-slate-100 overflow-hidden">
                  <img
                    src={book.cover}
                    alt={book.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <div className="p-3">
                  <div className="flex items-center gap-1 mb-1">
                    <h4 className="font-semibold text-slate-800 line-clamp-2 text-sm">{book.title}</h4>
                    {isFavorite && (
                      <svg className="w-4 h-4 text-red-500 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                      </svg>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mb-2">{book.author}</p>
                  {book.progress > 0 && (
                    <>
                      <div className="w-full bg-slate-200 rounded-full h-1.5 mb-1">
                        <div
                          className="h-1.5 rounded-full transition-all"
                          style={{
                            backgroundColor: '#ea3663',
                            width: `${book.progress}%`
                          }}
                        ></div>
                      </div>
                      <p className="text-xs text-slate-600">{book.progress}% complete</p>
                    </>
                  )}
                </div>
              </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default StudioOverview;

