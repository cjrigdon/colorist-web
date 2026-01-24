import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import DropdownMenu from './DropdownMenu';
import { coloredPencilSetsAPI, coloredPencilsAPI, brandsAPI, inspirationAPI, booksAPI, colorPalettesAPI, colorCombosAPI, journalEntriesAPI, apiGet } from '../services/api';
import { deltaEToPercentage } from '../utils/colorUtils';

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

// Helper function to ensure hex values have # prefix
const normalizeHex = (hex) => {
  if (!hex) return '#000000';
  if (typeof hex !== 'string') return '#000000';
  return hex.startsWith('#') ? hex : `#${hex}`;
};

// Get the first character (number or letter) from a color name for indexing
const getIndexChar = (colorName) => {
  if (!colorName || typeof colorName !== 'string') return '#';
  const firstChar = colorName.trim().charAt(0).toUpperCase();
  // If it's a number, return it; if it's a letter, return it; otherwise return '#'
  if (/[0-9]/.test(firstChar)) return firstChar;
  if (/[A-Z]/.test(firstChar)) return firstChar;
  return '#';
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

const ColorAlong = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [videoId, setVideoId] = useState('');
  const [videoSetId, setVideoSetId] = useState(null);
  const [userSetId, setUserSetId] = useState(null);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  
  // API data states
  const [allPencilSets, setAllPencilSets] = useState([]);
  const [userPencilSetSizes, setUserPencilSetSizes] = useState([]); // Store full set size data
  const [userPencilSets, setUserPencilSets] = useState([]); // Transformed for dropdown
  const [videoSet, setVideoSet] = useState(null);
  const [userSet, setUserSet] = useState(null);
  const [loadingSets, setLoadingSets] = useState(true);
  const [loadingColors, setLoadingColors] = useState(false);
  const [includeTwoColorMix, setIncludeTwoColorMix] = useState(false);
  const [matches, setMatches] = useState([]);
  const [loadingMatches, setLoadingMatches] = useState(false);
  const [showMatchesMenu, setShowMatchesMenu] = useState(false);
  const [groupedMatches, setGroupedMatches] = useState({});
  const [rowMixMatches, setRowMixMatches] = useState({}); // Store per-row two-color mix matches: { videoColorId: match }
  const [loadingRowMix, setLoadingRowMix] = useState({}); // Track loading state per row: { videoColorId: boolean }
  const [markingOut, setMarkingOut] = useState({}); // Track which pencils are being marked as out: { pencilId: boolean }

  // Video Set Selection State (3-step: brand -> set -> size)
  const [videoStep, setVideoStep] = useState('brand'); // 'brand', 'set', 'size'
  const [brands, setBrands] = useState([]);
  const [loadingBrands, setLoadingBrands] = useState(false);
  const [videoSelectedBrand, setVideoSelectedBrand] = useState(null);
  const [videoSetsForBrand, setVideoSetsForBrand] = useState([]);
  const [loadingVideoSets, setLoadingVideoSets] = useState(false);
  const [videoSelectedSet, setVideoSelectedSet] = useState(null);
  const [videoSizesForSet, setVideoSizesForSet] = useState([]);
  const [loadingVideoSizes, setLoadingVideoSizes] = useState(false);
  const [videoSelectedSetSize, setVideoSelectedSetSize] = useState(null); // Store selected set size for display

  // User Set Selection State (3-step: brand -> set -> size)
  const [userStep, setUserStep] = useState('brand'); // 'brand', 'set', 'size'
  const [userSelectedBrand, setUserSelectedBrand] = useState(null);
  const [userSetsForBrand, setUserSetsForBrand] = useState([]);
  const [loadingUserSets, setLoadingUserSets] = useState(false);
  const [userSelectedSet, setUserSelectedSet] = useState(null);
  const [userSizesForSet, setUserSizesForSet] = useState([]);
  const [loadingUserSizes, setLoadingUserSizes] = useState(false);
  const [userSelectedSetSize, setUserSelectedSetSize] = useState(null); // Store selected set size for display

  // Scroll to a section by index character
  const scrollToSection = (char) => {
    const element = document.getElementById(`color-section-${char}`);
    if (element) {
      // Get the scrollable container (the matches content div)
      const scrollContainer = element.closest('.overflow-y-auto');
      if (scrollContainer) {
        const containerTop = scrollContainer.getBoundingClientRect().top;
        const elementTop = element.getBoundingClientRect().top;
        const offset = elementTop - containerTop - 8; // 8px padding
        scrollContainer.scrollBy({ top: offset, behavior: 'smooth' });
      } else {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  };

  // Inspiration data state
  const [inspirations, setInspirations] = useState([]);
  const [loadingInspirations, setLoadingInspirations] = useState(true);

  // Journal entry modal states
  const [showJournalModal, setShowJournalModal] = useState(false);
  const [books, setBooks] = useState([]);
  const [palettes, setPalettes] = useState([]);
  const [combos, setCombos] = useState([]);
  const [journalFormData, setJournalFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    inspiration: '',
    pencilSet: '',
    book: '',
    palette: '',
    combos: [],
    notes: ''
  });
  const [loadingJournalData, setLoadingJournalData] = useState(false);
  const [savingJournal, setSavingJournal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Get video from location state if navigating from Library
  useEffect(() => {
    if (location.state?.video) {
      setSelectedVideo(location.state.video);
      setVideoId(location.state.video.id || '');
    }
  }, [location.state]);

  // Get video/image from query string parameters
  useEffect(() => {
    const videoParam = searchParams.get('video');
    const imageParam = searchParams.get('image');
    
    if (videoParam) {
      // Load video from query parameter
      // Try to find it in loaded inspirations first
      const videoInspiration = inspirations.find(insp => 
        insp.type === 'video' && (insp.embed_id === videoParam || insp.id === parseInt(videoParam))
      );
      
      if (videoInspiration) {
        setSelectedVideo({
          id: videoInspiration.embed_id,
          embed_id: videoInspiration.embed_id,
          title: videoInspiration.title || 'Video'
        });
        setVideoId(videoInspiration.embed_id);
      } else {
        setVideoId(videoParam);
        setSelectedVideo({ id: videoParam, title: 'Video' });
      }
    } else if (imageParam) {
      // Load image from query parameter
      // Try to find it in loaded inspirations first
      const imageInspiration = inspirations.find(insp => 
        insp.type === 'file' && insp.id === parseInt(imageParam)
      );
      
      if (imageInspiration) {
        setSelectedImage({
          id: imageInspiration.id,
          title: imageInspiration.title || 'Image',
          thumbnail: imageInspiration.thumbnail_path || imageInspiration.path,
          path: imageInspiration.path
        });
      } else {
        setSelectedImage({ id: imageParam });
      }
    }
  }, [searchParams, inspirations]);

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
      } finally {
        setLoadingBrands(false);
      }
    };

    fetchBrands();
  }, []);

  // Fetch user's pencil sets for Your Set dropdown (keep for journal entry)
  useEffect(() => {
    const fetchUserPencilSets = async () => {
      try {
        const response = await coloredPencilSetsAPI.getAll(1, 1000);
        
        // Handle paginated response
        let setsData = [];
        if (Array.isArray(response)) {
          setsData = response;
        } else if (response.data && Array.isArray(response.data)) {
          setsData = response.data;
        }
        
        // Store full set size data
        setUserPencilSetSizes(setsData);
        
        // Transform ColoredPencilSetSizeResource to match expected format for dropdown
        const transformedSets = setsData.map(setSize => ({
          id: setSize.set?.id || setSize.id, // Use set ID for selection
          name: setSize.set?.name || 'Unknown',
          brand: setSize.set?.brand || 'Unknown',
          count: setSize.count || 0,
          setSizeId: setSize.id, // Keep the set size ID
          setSizeData: setSize // Keep full data for color fetching
        }));
        
        setUserPencilSets(transformedSets);
      } catch (error) {
        console.error('Error fetching user pencil sets:', error);
      }
    };

    fetchUserPencilSets();
  }, []);

  // Video Set Selection Handlers
  const fetchVideoSetsForBrand = async (brandId) => {
    try {
      setLoadingVideoSets(true);
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
      
      setVideoSetsForBrand(setsWithSizeCounts);
    } catch (err) {
      console.error('Error fetching sets for brand:', err);
    } finally {
      setLoadingVideoSets(false);
    }
  };

  const fetchVideoSizesForSet = async (setId) => {
    try {
      setLoadingVideoSizes(true);
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
      
      setVideoSizesForSet(sizesForThisSet);
    } catch (err) {
      console.error('Error fetching sizes for set:', err);
    } finally {
      setLoadingVideoSizes(false);
    }
  };

  const handleVideoBrandSelect = (brand) => {
    setVideoSelectedBrand(brand);
    setVideoSelectedSet(null);
    setVideoSetId(null);
    setVideoSizesForSet([]);
    fetchVideoSetsForBrand(brand.id);
    setVideoStep('set');
  };

  const handleVideoSetSelect = (set) => {
    setVideoSelectedSet(set);
    setVideoSetId(null);
    fetchVideoSizesForSet(set.id);
    setVideoStep('size');
  };

  const handleVideoSizeSelect = (setSize) => {
    const setId = setSize.set?.id || setSize.id;
    setVideoSetId(setId);
    // Store selected set size for display
    setVideoSelectedSetSize(setSize);
    setVideoStep('brand');
    setVideoSelectedBrand(null);
    setVideoSelectedSet(null);
    setVideoSetsForBrand([]);
    setVideoSizesForSet([]);
  };

  const handleVideoBack = () => {
    if (videoStep === 'size') {
      setVideoStep('set');
      setVideoSelectedSet(null);
      setVideoSizesForSet([]);
    } else if (videoStep === 'set') {
      setVideoStep('brand');
      setVideoSelectedBrand(null);
      setVideoSelectedSet(null);
      setVideoSetsForBrand([]);
      setVideoSizesForSet([]);
    }
  };

  // User Set Selection Handlers
  const fetchUserSetsForBrand = async (brandId) => {
    try {
      setLoadingUserSets(true);
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
      
      setUserSetsForBrand(setsWithSizeCounts);
    } catch (err) {
      console.error('Error fetching sets for brand:', err);
    } finally {
      setLoadingUserSets(false);
    }
  };

  const fetchUserSizesForSet = async (setId) => {
    try {
      setLoadingUserSizes(true);
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
      
      setUserSizesForSet(sizesForThisSet);
    } catch (err) {
      console.error('Error fetching sizes for set:', err);
    } finally {
      setLoadingUserSizes(false);
    }
  };

  const handleUserBrandSelect = (brand) => {
    setUserSelectedBrand(brand);
    setUserSelectedSet(null);
    setUserSetId(null);
    setUserSizesForSet([]);
    fetchUserSetsForBrand(brand.id);
    setUserStep('set');
  };

  const handleUserSetSelect = (set) => {
    setUserSelectedSet(set);
    setUserSetId(null);
    fetchUserSizesForSet(set.id);
    setUserStep('size');
  };

  const handleUserSizeSelect = (setSize) => {
    const setId = setSize.set?.id || setSize.id;
    setUserSetId(setId);
    // Store selected set size for display
    setUserSelectedSetSize(setSize);
    setUserStep('brand');
    setUserSelectedBrand(null);
    setUserSelectedSet(null);
    setUserSetsForBrand([]);
    setUserSizesForSet([]);
  };

  const handleUserBack = () => {
    if (userStep === 'size') {
      setUserStep('set');
      setUserSelectedSet(null);
      setUserSizesForSet([]);
    } else if (userStep === 'set') {
      setUserStep('brand');
      setUserSelectedBrand(null);
      setUserSelectedSet(null);
      setUserSetsForBrand([]);
      setUserSizesForSet([]);
    }
  };

  // Fetch user's inspirations on component mount
  useEffect(() => {
    const fetchInspirations = async () => {
      try {
        setLoadingInspirations(true);
        const response = await inspirationAPI.getAll(1, 1000);
        
        // Handle paginated response
        let inspirationsData = [];
        if (Array.isArray(response)) {
          inspirationsData = response;
        } else if (response.data && Array.isArray(response.data)) {
          inspirationsData = response.data;
        }
        
        setInspirations(inspirationsData);
      } catch (error) {
        console.error('Error fetching inspirations:', error);
      } finally {
        setLoadingInspirations(false);
      }
    };

    fetchInspirations();
  }, []);

  // Fetch colors for video set when selected
  useEffect(() => {
    const fetchVideoSetColors = async () => {
      if (!videoSetId) {
        setVideoSet(null);
        return;
      }

      try {
        setLoadingColors(true);
        const pencilsResponse = await coloredPencilSetsAPI.getPencils(videoSetId);
        
        // Handle response format
        let pencilsData = [];
        if (Array.isArray(pencilsResponse)) {
          pencilsData = pencilsResponse;
        } else if (pencilsResponse.data && Array.isArray(pencilsResponse.data)) {
          pencilsData = pencilsResponse.data;
        }

        // Find the set info
        const setInfo = allPencilSets.find(set => set.id === videoSetId);
        
        // Transform pencils to colors format
        const colors = pencilsData
          .filter(pencil => pencil.color && pencil.color.hex)
          .map((pencil, index) => ({
            id: pencil.id || index,
            name: pencil.color_name || pencil.color?.name || 'Unknown',
            hex: pencil.color.hex || '#000000',
            inStock: true
          }));

        setVideoSet({
          id: videoSetId,
          name: setInfo?.name || 'Unknown',
          brand: setInfo?.brand || 'Unknown',
          count: colors.length,
          colors
        });
      } catch (error) {
        console.error('Error fetching video set colors:', error);
        setVideoSet(null);
      } finally {
        setLoadingColors(false);
      }
    };

    fetchVideoSetColors();
  }, [videoSetId, allPencilSets]);

  // Fetch colors for user set when selected
  useEffect(() => {
    const fetchUserSetColors = async () => {
      if (!userSetId) {
        setUserSet(null);
        return;
      }

      try {
        setLoadingColors(true);
        // Find the user set data
        const userSetData = userPencilSets.find(set => set.id === userSetId);
        
        if (!userSetData) {
          setUserSet(null);
          return;
        }

        // Try to get pencils from the stored set size data first
        const setSizeData = userPencilSetSizes.find(size => size.id === userSetData.setSizeId);
        
        let pencilsData = [];
        
        if (setSizeData && setSizeData.pencils && Array.isArray(setSizeData.pencils) && setSizeData.pencils.length > 0) {
          // Use pencils from set size if available
          pencilsData = setSizeData.pencils;
        } else {
          // Otherwise, fetch pencils using the set ID
          const pencilsResponse = await coloredPencilSetsAPI.getPencils(userSetId);
          
          // Handle response format
          if (Array.isArray(pencilsResponse)) {
            pencilsData = pencilsResponse;
          } else if (pencilsResponse.data && Array.isArray(pencilsResponse.data)) {
            pencilsData = pencilsResponse.data;
          }
        }

        // Transform pencils to colors format
        const colors = pencilsData
          .filter(pencil => pencil.color && pencil.color.hex)
          .map((pencil, index) => ({
            id: pencil.id || index,
            name: pencil.color_name || pencil.color?.name || 'Unknown',
            hex: pencil.color.hex || '#000000',
            inStock: true
          }));

        setUserSet({
          id: userSetId,
          name: userSetData.name,
          brand: userSetData.brand,
          count: colors.length,
          colors
        });
      } catch (error) {
        console.error('Error fetching user set colors:', error);
        setUserSet(null);
      } finally {
        setLoadingColors(false);
      }
    };

    fetchUserSetColors();
  }, [userSetId, userPencilSets, userPencilSetSizes]);

  // Fetch journal entry data when modal opens
  useEffect(() => {
    const fetchJournalData = async () => {
      if (!showJournalModal) return;

      try {
        setLoadingJournalData(true);
        
        // Fetch books
        const booksResponse = await booksAPI.getAll(1, 1000);
        let booksData = [];
        if (Array.isArray(booksResponse)) {
          booksData = booksResponse;
        } else if (booksResponse.data && Array.isArray(booksResponse.data)) {
          booksData = booksResponse.data;
        }
        setBooks(booksData);

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
        console.error('Error fetching journal data:', error);
      } finally {
        setLoadingJournalData(false);
      }
    };

    fetchJournalData();
  }, [showJournalModal]);

  // Pre-populate journal form when modal opens
  useEffect(() => {
    if (showJournalModal) {
      // Initialize form with defaults
      let currentInspirationId = '';
      
      // Find current inspiration (video or image) if inspirations are loaded
      if (inspirations.length > 0) {
        if (selectedVideo) {
          // Find video in inspirations by embed_id or id
          const videoInspiration = inspirations.find(insp => {
            if (insp.type === 'video') {
              return insp.embed_id === selectedVideo.id || insp.embed_id === selectedVideo.embed_id || insp.id === selectedVideo.id;
            }
            return false;
          });
          if (videoInspiration) {
            currentInspirationId = videoInspiration.id.toString();
          }
        } else if (selectedImage) {
          // Find image in inspirations by id
          const imageInspiration = inspirations.find(insp => {
            if (insp.type === 'file') {
              return insp.id === selectedImage.id;
            }
            return false;
          });
          if (imageInspiration) {
            currentInspirationId = imageInspiration.id.toString();
          }
        }
      }

      setJournalFormData({
        date: new Date().toISOString().split('T')[0],
        inspiration: currentInspirationId,
        pencilSet: userSetId ? userSetId.toString() : '',
        book: '',
        palette: '',
        combos: [],
        notes: ''
      });
    }
  }, [showJournalModal, selectedVideo, selectedImage, userSetId, inspirations]);

  // Update inspiration when inspirations load and we have a selected video/image
  useEffect(() => {
    if (showJournalModal && inspirations.length > 0 && journalFormData.inspiration === '') {
      let currentInspirationId = '';
      if (selectedVideo) {
        const videoInspiration = inspirations.find(insp => 
          insp.type === 'video' && (insp.embed_id === selectedVideo.id || insp.embed_id === selectedVideo.embed_id || insp.id === selectedVideo.id)
        );
        if (videoInspiration) {
          currentInspirationId = videoInspiration.id.toString();
        }
      } else if (selectedImage) {
        const imageInspiration = inspirations.find(insp => 
          insp.type === 'file' && insp.id === selectedImage.id
        );
        if (imageInspiration) {
          currentInspirationId = imageInspiration.id.toString();
        }
      }
      
      if (currentInspirationId) {
        setJournalFormData(prev => ({
          ...prev,
          inspiration: currentInspirationId
        }));
      }
    }
  }, [inspirations, showJournalModal, selectedVideo, selectedImage]);

  // Fetch matches using backend API when both sets are selected
  useEffect(() => {
    const fetchMatches = async () => {
      if (!videoSet || !userSet || !videoSetId || !userSetId) {
        setMatches([]);
        return;
      }

      try {
        setLoadingMatches(true);
        const result = await coloredPencilSetsAPI.compare(videoSetId, userSetId, includeTwoColorMix);
        
        // Handle response structure - check if matches exists and is an array
        const matchesArray = result?.matches || result?.data?.matches || [];
        
        if (!Array.isArray(matchesArray)) {
          console.error('Invalid matches format from API:', result);
          setMatches([]);
          setLoadingMatches(false);
          return;
        }
        
        // Transform API response to match expected format
        const transformedMatches = matchesArray.map(match => {
          const videoColor = {
            id: match.source_pencil.id,
            name: match.source_pencil.color_name || match.source_pencil.color?.name || 'Unknown',
            hex: normalizeHex(match.source_pencil.color?.hex),
            color_number: match.source_pencil.color_number,
          };

          if (match.is_mix && match.target_pencil_mix) {
            // Two-color mix match
            return {
              videoColor,
              match: {
                is_mix: true,
                color1: {
                  id: match.target_pencil_mix.color1.id,
                  name: match.target_pencil_mix.color1.color_name || match.target_pencil_mix.color1.color?.name || 'Unknown',
                  hex: normalizeHex(match.target_pencil_mix.color1.color?.hex),
                  color_number: match.target_pencil_mix.color1.color_number,
                  inventory: match.target_pencil_mix.color1.inventory ?? 0,
                },
                color2: {
                  id: match.target_pencil_mix.color2.id,
                  name: match.target_pencil_mix.color2.color_name || match.target_pencil_mix.color2.color?.name || 'Unknown',
                  hex: normalizeHex(match.target_pencil_mix.color2.color?.hex),
                  color_number: match.target_pencil_mix.color2.color_number,
                  inventory: match.target_pencil_mix.color2.inventory ?? 0,
                },
                mixed_hex: normalizeHex(match.target_pencil_mix.mixed_hex),
                ratio: match.target_pencil_mix.ratio,
                delta_e: match.delta_e,
                match_quality: match.match_quality,
              },
            };
          } else if (match.target_pencil) {
            // Single color match
            return {
              videoColor,
              match: {
                is_mix: false,
                id: match.target_pencil.id,
                name: match.target_pencil.color_name || match.target_pencil.color?.name || 'Unknown',
                hex: normalizeHex(match.target_pencil.color?.hex),
                color_number: match.target_pencil.color_number,
                inventory: match.target_pencil.inventory ?? 0,
                delta_e: match.delta_e,
                match_quality: match.match_quality,
                distance: match.delta_e, // For backwards compatibility
              },
            };
          } else {
            // No match found (shouldn't happen, but handle gracefully)
            return null;
          }
        }).filter(match => match !== null); // Filter out any null matches

        setMatches(transformedMatches);
        
        // Group matches by index character for navigation
        const groupedMatches = {};
        transformedMatches.forEach((match) => {
          const char = getIndexChar(match.videoColor.name);
          if (!groupedMatches[char]) {
            groupedMatches[char] = [];
          }
          groupedMatches[char].push(match);
        });
        
        // Store grouped matches for index navigation
        setGroupedMatches(groupedMatches);
      } catch (error) {
        console.error('Error fetching matches:', error);
        // Fallback to client-side matching
        const fallbackMatches = videoSet.colors.map(videoColor => ({
          videoColor,
          match: findClosestColor(videoColor, userSet)
        }));
        setMatches(fallbackMatches);
      } finally {
        setLoadingMatches(false);
      }
    };

    fetchMatches();
  }, [videoSet, userSet, videoSetId, userSetId, includeTwoColorMix]);

  // Fetch two-color mix for a specific row
  const fetchRowMix = async (videoColorId) => {
    if (!videoSetId || !userSetId || !videoSet || !userSet) return;

    try {
      setLoadingRowMix(prev => ({ ...prev, [videoColorId]: true }));
      
      // Find the video color
      const videoColor = videoSet.colors.find(c => c.id === videoColorId);
      if (!videoColor) return;
      
      // Call compare API with two-color mix enabled
      const result = await coloredPencilSetsAPI.compare(videoSetId, userSetId, true);
      
      // Find the match for this specific video color by matching hex
      const matchesArray = result?.matches || result?.data?.matches || [];
      const exactMatch = matchesArray.find(m => {
        const sourceHex = normalizeHex(m.source_pencil?.color?.hex);
        const targetHex = normalizeHex(videoColor.hex);
        return sourceHex === targetHex;
      });
      
      if (exactMatch && exactMatch.is_mix && exactMatch.target_pencil_mix) {
        // Transform to match expected format
        const mixMatch = {
          is_mix: true,
          color1: {
            id: exactMatch.target_pencil_mix.color1.id,
            name: exactMatch.target_pencil_mix.color1.color_name || exactMatch.target_pencil_mix.color1.color?.name || 'Unknown',
            hex: normalizeHex(exactMatch.target_pencil_mix.color1.color?.hex),
            color_number: exactMatch.target_pencil_mix.color1.color_number,
            inventory: exactMatch.target_pencil_mix.color1.inventory ?? 0,
          },
          color2: {
            id: exactMatch.target_pencil_mix.color2.id,
            name: exactMatch.target_pencil_mix.color2.color_name || exactMatch.target_pencil_mix.color2.color?.name || 'Unknown',
            hex: normalizeHex(exactMatch.target_pencil_mix.color2.color?.hex),
            color_number: exactMatch.target_pencil_mix.color2.color_number,
            inventory: exactMatch.target_pencil_mix.color2.inventory ?? 0,
          },
          mixed_hex: normalizeHex(exactMatch.target_pencil_mix.mixed_hex),
          ratio: exactMatch.target_pencil_mix.ratio,
          delta_e: exactMatch.delta_e,
          match_quality: exactMatch.match_quality,
        };
        
        setRowMixMatches(prev => ({ ...prev, [videoColorId]: mixMatch }));
      }
    } catch (error) {
      console.error('Error fetching row mix:', error);
    } finally {
      setLoadingRowMix(prev => ({ ...prev, [videoColorId]: false }));
    }
  };

  // Toggle two-color mix for a specific row
  const toggleRowMix = (videoColorId) => {
    if (rowMixMatches[videoColorId]) {
      // Remove mix match
      setRowMixMatches(prev => {
        const updated = { ...prev };
        delete updated[videoColorId];
        return updated;
      });
    } else {
      // Fetch mix match
      fetchRowMix(videoColorId);
    }
  };

  // Mark pencil(s) as out (set inventory to 0)
  const handleMarkAsOut = async (pencilIds) => {
    // Ensure pencilIds is an array
    const ids = Array.isArray(pencilIds) ? pencilIds : [pencilIds];
    
    // Set loading state for all pencils being marked
    setMarkingOut(prev => {
      const updated = { ...prev };
      ids.forEach(id => {
        updated[id] = true;
      });
      return updated;
    });

    try {
      // Update inventory to 0 for all pencils
      await Promise.all(ids.map(id => coloredPencilsAPI.updateInventory(id, 0)));
      
      // Show success message
      alert('Pencil(s) marked as out. They will be added to your shopping list.');
    } catch (error) {
      console.error('Error marking pencil as out:', error);
      alert('Failed to mark pencil(s) as out. Please try again.');
    } finally {
      // Clear loading state
      setMarkingOut(prev => {
        const updated = { ...prev };
        ids.forEach(id => {
          delete updated[id];
        });
        return updated;
      });
    }
  };

  const handleInspirationSelect = (inspiration) => {
    if (inspiration.type === 'video') {
      setSelectedVideo({
        id: inspiration.embed_id,
        embed_id: inspiration.embed_id,
        title: inspiration.title || 'Video'
      });
      setVideoId(inspiration.embed_id);
      setSelectedImage(null);
    } else if (inspiration.type === 'file') {
      setSelectedImage({
        id: inspiration.id,
        title: inspiration.title || 'Image',
        thumbnail: inspiration.thumbnail_path || inspiration.path,
        path: inspiration.path
      });
      setSelectedVideo(null);
      setVideoId('');
    }
  };

  const handleLoadVideo = () => {
    if (videoId) {
      setSelectedVideo({ id: videoId, title: 'Custom Video' });
    }
  };

  return (
    <div 
      className="w-full h-full"
      style={{ 
        height: '100%',
        minHeight: '600px',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      {/* Pencil Set Selection and Video Selection Section */}
      <div
        className="grid grid-cols-1 lg:grid-cols-4 gap-2"
        style={{
          height: 'calc(100vh - 72px)',
          minHeight: '600px'
        }}
      >
        {/* Left Column: Pencil Sets and Color Matches */}
        <div className="lg:col-span-1 flex flex-col" style={{ minHeight: '600px', height: '100%', maxHeight: '100%' }}>
          <div className="h-full flex flex-col overflow-hidden">
            {/* Pencil Set Selection Section */}
            {(!videoSetId || !userSetId) && (
              <div className="bg-white p-2 flex-shrink-0 border-b border-slate-200 overflow-y-auto max-h-[calc(100vh-200px)]">
                <h3 className="text-xs font-semibold text-slate-800 mb-1.5 font-venti">Pencil Sets</h3>
                <div className="space-y-1.5">
                  {/* Video Set Selection */}
                  <div className="bg-slate-50 shadow-sm border border-slate-200 p-1.5">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="text-xs font-semibold text-slate-800 font-venti">Video Set</h4>
                      {videoSetId && (
                        <button
                          onClick={() => {
                            setVideoSetId(null);
                            setVideoSelectedSetSize(null);
                            setVideoStep('brand');
                            setVideoSelectedBrand(null);
                            setVideoSelectedSet(null);
                            setVideoSetsForBrand([]);
                            setVideoSizesForSet([]);
                          }}
                          className="text-xs text-slate-500 hover:text-slate-700 underline"
                        >
                          Change
                        </button>
                      )}
                    </div>
                    
                    {videoSetId && videoSelectedSetSize ? (
                      <div className="p-2 bg-white rounded text-xs">
                        <p className="font-medium text-slate-800">{videoSelectedSetSize.set?.name || videoSelectedSetSize.name}</p>
                        <p className="text-slate-600 mt-0.5">{videoSelectedSetSize.set?.brand || videoSelectedSetSize.brand} - {videoSelectedSetSize.count || 0} pencils</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {videoStep !== 'brand' && (
                          <button
                            onClick={handleVideoBack}
                            className="flex items-center space-x-1 text-xs text-slate-600 hover:text-slate-800 transition-colors"
                          >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                            <span>Back</span>
                          </button>
                        )}
                        
                        <div className="text-xs font-medium text-slate-700 mb-1">
                          {videoStep === 'brand' && 'Select a Brand'}
                          {videoStep === 'set' && `Select a Set for ${videoSelectedBrand?.name || ''}`}
                          {videoStep === 'size' && `Select a Size for ${videoSelectedSet?.name || ''}`}
                        </div>

                        {/* Step 1: Brand Selection */}
                        {videoStep === 'brand' && (
                          <div className="border border-slate-200 rounded p-1.5 max-h-40 overflow-y-auto">
                            {loadingBrands ? (
                              <div className="text-center py-2 text-xs text-slate-500">Loading brands...</div>
                            ) : brands.length === 0 ? (
                              <div className="text-center py-2 text-xs text-slate-500">No brands available</div>
                            ) : (
                              <div className="space-y-1">
                                {brands.map((brand) => (
                                  <button
                                    key={brand.id}
                                    onClick={() => handleVideoBrandSelect(brand)}
                                    className="w-full flex items-center justify-between p-1.5 rounded border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-colors text-left"
                                  >
                                    <span className="text-xs font-medium text-slate-800 truncate">{brand.name}</span>
                                    <svg className="w-3 h-3 text-slate-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                    </svg>
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        )}

                        {/* Step 2: Set Selection */}
                        {videoStep === 'set' && videoSelectedBrand && (
                          <div className="border border-slate-200 rounded p-1.5 max-h-40 overflow-y-auto">
                            {loadingVideoSets ? (
                              <div className="text-center py-2 text-xs text-slate-500">Loading sets...</div>
                            ) : videoSetsForBrand.length === 0 ? (
                              <div className="text-center py-2 text-xs text-slate-500">No sets available for this brand</div>
                            ) : (
                              <div className="space-y-1">
                                {videoSetsForBrand.map((set) => (
                                  <button
                                    key={set.id}
                                    onClick={() => handleVideoSetSelect(set)}
                                    className="w-full flex items-center justify-between p-1.5 rounded border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-colors text-left"
                                  >
                                    <div className="flex-1 min-w-0">
                                      <div className="text-xs font-medium text-slate-800 truncate">
                                        {set.name || 'Unknown'}
                                      </div>
                                      <div className="text-xs text-slate-600 mt-0.5">
                                        {set.sizeCount} size{set.sizeCount !== 1 ? 's' : ''} available
                                      </div>
                                    </div>
                                    <svg className="w-3 h-3 text-slate-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                    </svg>
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        )}

                        {/* Step 3: Size Selection */}
                        {videoStep === 'size' && videoSelectedSet && (
                          <div className="border border-slate-200 rounded p-1.5 max-h-40 overflow-y-auto">
                            {loadingVideoSizes ? (
                              <div className="text-center py-2 text-xs text-slate-500">Loading sizes...</div>
                            ) : videoSizesForSet.length === 0 ? (
                              <div className="text-center py-2 text-xs text-slate-500">No sizes available for this set</div>
                            ) : (
                              <div className="space-y-1">
                                {videoSizesForSet.map((setSize) => {
                                  const thumbnail = setSize.thumb || setSize.set?.thumb || null;
                                  const thumbnailUrl = thumbnail 
                                    ? (thumbnail.startsWith('http') ? thumbnail : `${process.env.REACT_APP_API_BASE_URL?.replace('/api', '') || 'http://localhost:8000'}/storage/${thumbnail}`)
                                    : null;
                                  
                                  return (
                                    <button
                                      key={setSize.id}
                                      onClick={() => handleVideoSizeSelect(setSize)}
                                      className="w-full flex items-center space-x-2 p-1.5 rounded border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-colors text-left"
                                    >
                                      {thumbnailUrl ? (
                                        <img 
                                          src={thumbnailUrl} 
                                          alt={setSize.name || `${setSize.count} pencils`}
                                          className="w-6 h-6 object-cover rounded flex-shrink-0"
                                          onError={(e) => {
                                            e.target.style.display = 'none';
                                            if (e.target.nextSibling) {
                                              e.target.nextSibling.style.display = 'flex';
                                            }
                                          }}
                                        />
                                      ) : null}
                                      <div 
                                        className={`w-6 h-6 rounded flex items-center justify-center flex-shrink-0 ${thumbnailUrl ? 'hidden' : ''}`}
                                        style={{ backgroundColor: '#f1f5f9' }}
                                      >
                                        <svg className="w-3 h-3 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                        </svg>
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <div className="text-xs font-medium text-slate-800 truncate">
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

                  {/* User Set Selection */}
                  <div className="bg-slate-50 shadow-sm border border-slate-200 p-1.5">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="text-xs font-semibold text-slate-800 font-venti">Your Set</h4>
                      {userSetId && (
                        <button
                          onClick={() => {
                            setUserSetId(null);
                            setUserSelectedSetSize(null);
                            setUserStep('brand');
                            setUserSelectedBrand(null);
                            setUserSelectedSet(null);
                            setUserSetsForBrand([]);
                            setUserSizesForSet([]);
                          }}
                          className="text-xs text-slate-500 hover:text-slate-700 underline"
                        >
                          Change
                        </button>
                      )}
                    </div>
                    
                    {userSetId && userSelectedSetSize ? (
                      <div className="p-2 bg-white rounded text-xs">
                        <p className="font-medium text-slate-800">{userSelectedSetSize.set?.name || userSelectedSetSize.name}</p>
                        <p className="text-slate-600 mt-0.5">{userSelectedSetSize.set?.brand || userSelectedSetSize.brand} - {userSelectedSetSize.count || 0} pencils</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {userStep !== 'brand' && (
                          <button
                            onClick={handleUserBack}
                            className="flex items-center space-x-1 text-xs text-slate-600 hover:text-slate-800 transition-colors"
                          >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                            <span>Back</span>
                          </button>
                        )}
                        
                        <div className="text-xs font-medium text-slate-700 mb-1">
                          {userStep === 'brand' && 'Select a Brand'}
                          {userStep === 'set' && `Select a Set for ${userSelectedBrand?.name || ''}`}
                          {userStep === 'size' && `Select a Size for ${userSelectedSet?.name || ''}`}
                        </div>

                        {/* Step 1: Brand Selection */}
                        {userStep === 'brand' && (
                          <div className="border border-slate-200 rounded p-1.5 max-h-40 overflow-y-auto">
                            {loadingBrands ? (
                              <div className="text-center py-2 text-xs text-slate-500">Loading brands...</div>
                            ) : brands.length === 0 ? (
                              <div className="text-center py-2 text-xs text-slate-500">No brands available</div>
                            ) : (
                              <div className="space-y-1">
                                {brands.map((brand) => (
                                  <button
                                    key={brand.id}
                                    onClick={() => handleUserBrandSelect(brand)}
                                    className="w-full flex items-center justify-between p-1.5 rounded border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-colors text-left"
                                  >
                                    <span className="text-xs font-medium text-slate-800 truncate">{brand.name}</span>
                                    <svg className="w-3 h-3 text-slate-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                    </svg>
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        )}

                        {/* Step 2: Set Selection */}
                        {userStep === 'set' && userSelectedBrand && (
                          <div className="border border-slate-200 rounded p-1.5 max-h-40 overflow-y-auto">
                            {loadingUserSets ? (
                              <div className="text-center py-2 text-xs text-slate-500">Loading sets...</div>
                            ) : userSetsForBrand.length === 0 ? (
                              <div className="text-center py-2 text-xs text-slate-500">No sets available for this brand</div>
                            ) : (
                              <div className="space-y-1">
                                {userSetsForBrand.map((set) => (
                                  <button
                                    key={set.id}
                                    onClick={() => handleUserSetSelect(set)}
                                    className="w-full flex items-center justify-between p-1.5 rounded border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-colors text-left"
                                  >
                                    <div className="flex-1 min-w-0">
                                      <div className="text-xs font-medium text-slate-800 truncate">
                                        {set.name || 'Unknown'}
                                      </div>
                                      <div className="text-xs text-slate-600 mt-0.5">
                                        {set.sizeCount} size{set.sizeCount !== 1 ? 's' : ''} available
                                      </div>
                                    </div>
                                    <svg className="w-3 h-3 text-slate-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                    </svg>
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        )}

                        {/* Step 3: Size Selection */}
                        {userStep === 'size' && userSelectedSet && (
                          <div className="border border-slate-200 rounded p-1.5 max-h-40 overflow-y-auto">
                            {loadingUserSizes ? (
                              <div className="text-center py-2 text-xs text-slate-500">Loading sizes...</div>
                            ) : userSizesForSet.length === 0 ? (
                              <div className="text-center py-2 text-xs text-slate-500">No sizes available for this set</div>
                            ) : (
                              <div className="space-y-1">
                                {userSizesForSet.map((setSize) => {
                                  const thumbnail = setSize.thumb || setSize.set?.thumb || null;
                                  const thumbnailUrl = thumbnail 
                                    ? (thumbnail.startsWith('http') ? thumbnail : `${process.env.REACT_APP_API_BASE_URL?.replace('/api', '') || 'http://localhost:8000'}/storage/${thumbnail}`)
                                    : null;
                                  
                                  return (
                                    <button
                                      key={setSize.id}
                                      onClick={() => handleUserSizeSelect(setSize)}
                                      className="w-full flex items-center space-x-2 p-1.5 rounded border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-colors text-left"
                                    >
                                      {thumbnailUrl ? (
                                        <img 
                                          src={thumbnailUrl} 
                                          alt={setSize.name || `${setSize.count} pencils`}
                                          className="w-6 h-6 object-cover rounded flex-shrink-0"
                                          onError={(e) => {
                                            e.target.style.display = 'none';
                                            if (e.target.nextSibling) {
                                              e.target.nextSibling.style.display = 'flex';
                                            }
                                          }}
                                        />
                                      ) : null}
                                      <div 
                                        className={`w-6 h-6 rounded flex items-center justify-center flex-shrink-0 ${thumbnailUrl ? 'hidden' : ''}`}
                                        style={{ backgroundColor: '#f1f5f9' }}
                                      >
                                        <svg className="w-3 h-3 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                        </svg>
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <div className="text-xs font-medium text-slate-800 truncate">
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
              </div>
            )}

          {/* Color Matches Section - Only show when both sets are selected */}
          {videoSet && userSet && (
            <div className="bg-white flex-1 flex flex-col min-h-0 overflow-hidden" style={{ minHeight: 0 }}>
              <div className="bg-slate-50 shadow-sm border border-slate-200 overflow-hidden flex flex-col h-full">
                <div className="p-1.5 border-b border-slate-200 flex-shrink-0 relative">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xs font-semibold text-slate-800 font-venti">Color Matches</h3>
                      {matches.length > 0 && userSet && (
                        <p className="text-xs text-slate-600 mt-0.5">
                          Matches from {userSet.name}
                        </p>
                      )}
                    </div>
                    <div className="relative">
                      <button
                        onClick={() => setShowMatchesMenu(!showMatchesMenu)}
                        className="p-1 text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded transition-colors"
                        aria-label="Menu"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                        </svg>
                      </button>
                      
                      {showMatchesMenu && (
                        <>
                          {/* Backdrop to close menu */}
                          <div 
                            className="fixed inset-0 z-10" 
                            onClick={() => setShowMatchesMenu(false)}
                          ></div>
                          
                          {/* Dropdown menu */}
                          <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-lg border border-slate-200 z-20 py-1">
                            <label className="flex items-center px-3 py-2 hover:bg-slate-50 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={includeTwoColorMix}
                                onChange={(e) => {
                                  setIncludeTwoColorMix(e.target.checked);
                                  setShowMatchesMenu(false);
                                }}
                                className="theme-checkbox theme-checkbox-small"
                              />
                              <span className="ml-2 text-xs text-slate-700">
                                Include two-color mixes
                              </span>
                            </label>
                            {matches.length > 0 && (
                              <button
                                onClick={() => {
                                  setVideoSetId(null);
                                  setUserSetId(null);
                                  setShowMatchesMenu(false);
                                }}
                                className="w-full text-left px-3 py-2 text-xs text-slate-600 hover:bg-slate-50 transition-colors"
                              >
                                Change Sets
                              </button>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex flex-1 overflow-hidden min-h-0">
                  {/* Vertical Index Navigation */}
                  {matches.length > 0 && Object.keys(groupedMatches).length > 0 && (
                    <div className="flex-shrink-0 border-r border-slate-200 bg-slate-50 overflow-y-auto" style={{ width: '32px', maxHeight: '100%' }}>
                      <div className="py-2 flex flex-col items-center space-y-0.5">
                        {Object.keys(groupedMatches)
                          .sort((a, b) => {
                            // Sort: numbers first, then letters, then '#'
                            if (a === '#') return 1;
                            if (b === '#') return -1;
                            if (/[0-9]/.test(a) && /[A-Z]/.test(b)) return -1;
                            if (/[A-Z]/.test(a) && /[0-9]/.test(b)) return 1;
                            return a.localeCompare(b);
                          })
                          .map((char) => (
                            <button
                              key={char}
                              onClick={() => scrollToSection(char)}
                              className="w-6 h-6 flex items-center justify-center text-xs font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-200 rounded transition-colors"
                              title={`Scroll to ${char}`}
                            >
                              {char}
                            </button>
                          ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Matches Content */}
                  <div className="p-3 flex-1 overflow-y-auto min-h-0" style={{ backgroundColor: '#ffffff' }}>
                    {loadingColors || loadingMatches ? (
                      <div className="flex items-center justify-center h-full text-center p-4">
                        <div>
                          <p className="text-sm text-slate-400 mb-1">Loading colors...</p>
                        </div>
                      </div>
                    ) : matches.length > 0 ? (
                      <div className="space-y-1.5">
                        {Object.keys(groupedMatches)
                          .sort((a, b) => {
                            // Sort: numbers first, then letters, then '#'
                            if (a === '#') return 1;
                            if (b === '#') return -1;
                            if (/[0-9]/.test(a) && /[A-Z]/.test(b)) return -1;
                            if (/[A-Z]/.test(a) && /[0-9]/.test(b)) return 1;
                            return a.localeCompare(b);
                          })
                          .map((char) => (
                            <div key={char} id={`color-section-${char}`} className="scroll-mt-2">
                              {groupedMatches[char].map(({ videoColor, match }) => {
                                // Use per-row mix match if available, otherwise use regular match
                                const displayMatch = rowMixMatches[videoColor.id] || match;
                                const isRowMixActive = !!rowMixMatches[videoColor.id];
                                const isLoadingRowMix = loadingRowMix[videoColor.id];
                                
                                // Calculate match percentage for the original match (not the mix)
                                const matchPercentage = match.delta_e !== undefined 
                                  ? deltaEToPercentage(match.delta_e) 
                                  : null;
                                const showTwoColorMixButton = !match.is_mix && (matchPercentage === null || matchPercentage < 95);
                                
                                return (
                        <div
                          key={videoColor.id}
                          className="bg-white p-1.5 border border-slate-200 hover:shadow-md hover:scale-105 transition-all"
                          onMouseEnter={(e) => e.currentTarget.style.borderColor = '#ea3663'}
                          onMouseLeave={(e) => e.currentTarget.style.borderColor = '#e2e8f0'}
                        >
                          <div className="flex items-start gap-3">
                            {/* Video Color */}
                            <div className="flex-1">
                              <p className="text-xs font-medium text-slate-600 mb-1">Video</p>
                              <div className="flex items-center gap-1.5">
                                <div
                                  className="w-7 h-7 rounded-lg shadow-sm border border-slate-200 flex-shrink-0"
                                  style={{ backgroundColor: videoColor.hex }}
                                ></div>
                                <div className="flex-1 min-w-0" style={{ maxWidth: '100px' }}>
                                  <p className="text-xs font-medium text-slate-800 truncate">{videoColor.name}</p>
                                  {videoColor.color_number && (
                                    <p className="text-xs text-slate-500 font-mono truncate">{videoColor.color_number}</p>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Match Color - Handle both single and two-color mix */}
                            <div className="flex-1">
                              <div className="flex items-center justify-between mb-1">
                                <p className="text-xs font-medium text-slate-600">Your Match</p>
                                <div className="flex items-center gap-1">
                                  {showTwoColorMixButton && (
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        toggleRowMix(videoColor.id);
                                      }}
                                      disabled={isLoadingRowMix}
                                      className="p-0.5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                      title={isRowMixActive ? "Hide two-color mix" : "Show two-color mix"}
                                    >
                                      {isLoadingRowMix ? (
                                        <svg className="w-3.5 h-3.5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                        </svg>
                                      ) : (
                                        <svg 
                                          className="w-3.5 h-3.5" 
                                          fill="currentColor" 
                                          viewBox="0 0 24 24"
                                          style={{ color: isRowMixActive ? '#ea3663' : '#94a3b8' }}
                                        >
                                          <path d="M20.71 4.63l-1.34-1.34c-.37-.39-1.02-.39-1.41 0L9 12.25 11.75 15l8.96-8.96c.39-.39.39-1.04 0-1.41zM7 14a3 3 0 00-3 3c0 1.31-1.16 2-2 2 .92 1.22 2.49 2 4 2a4 4 0 004-4c0-1.66-1.34-3-3-3z" />
                                        </svg>
                                      )}
                                    </button>
                                  )}
                                  {!displayMatch.is_mix && displayMatch.id && (displayMatch.inventory ?? 0) > 0 && (
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleMarkAsOut(displayMatch.id);
                                      }}
                                      disabled={markingOut[displayMatch.id]}
                                      className="p-0.5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-red-600 hover:text-red-700"
                                      title="Mark as out (set inventory to 0)"
                                    >
                                      {markingOut[displayMatch.id] ? (
                                        <svg className="w-3.5 h-3.5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                        </svg>
                                      ) : (
                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                        </svg>
                                      )}
                                    </button>
                                  )}
                                  {displayMatch.is_mix && displayMatch.color1?.id && displayMatch.color2?.id && 
                                   ((displayMatch.color1.inventory ?? 0) > 0 || (displayMatch.color2.inventory ?? 0) > 0) && (
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleMarkAsOut([displayMatch.color1.id, displayMatch.color2.id]);
                                      }}
                                      disabled={markingOut[displayMatch.color1.id] || markingOut[displayMatch.color2.id]}
                                      className="p-0.5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-red-600 hover:text-red-700"
                                      title="Mark both colors as out (set inventory to 0)"
                                    >
                                      {(markingOut[displayMatch.color1.id] || markingOut[displayMatch.color2.id]) ? (
                                        <svg className="w-3.5 h-3.5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                        </svg>
                                      ) : (
                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                        </svg>
                                      )}
                                    </button>
                                  )}
                                </div>
                              </div>
                              {displayMatch.is_mix ? (
                                // Two-color mix display
                                <div className="space-y-1">
                                  <div className="flex items-center gap-1.5">
                                    <div
                                      className="w-7 h-7 rounded-lg shadow-sm border border-slate-200 flex-shrink-0"
                                      style={{ backgroundColor: displayMatch.mixed_hex }}
                                      title={`Mixed: ${displayMatch.mixed_hex}`}
                                    ></div>
                                    <div className="flex-1 min-w-0">
                                      <p className="text-xs font-medium text-slate-800 truncate">Two-color mix</p>
                                      {displayMatch.color1.color_number && displayMatch.color2.color_number && (
                                        <p className="text-xs text-slate-500 font-mono truncate">{displayMatch.color1.color_number} + {displayMatch.color2.color_number}</p>
                                      )}
                                    </div>
                                  </div>
                                  <div className="pl-4 space-y-0.5">
                                    <div className="flex items-center gap-1">
                                      <div
                                        className="w-5 h-5 rounded shadow-sm border border-slate-200 flex-shrink-0"
                                        style={{ backgroundColor: displayMatch.color1.hex }}
                                      ></div>
                                      <p className="text-xs text-slate-700 truncate" style={{ maxWidth: '100px' }}>
                                        {displayMatch.color1.name}
                                        {displayMatch.color1.color_number && <span className="text-slate-500 ml-1">{displayMatch.color1.color_number}</span>}
                                      </p>
                                      <span className="text-xs text-slate-500 ml-auto">{Math.round((1 - displayMatch.ratio) * 100)}%</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <div
                                        className="w-5 h-5 rounded shadow-sm border border-slate-200 flex-shrink-0"
                                        style={{ backgroundColor: displayMatch.color2.hex }}
                                      ></div>
                                      <p className="text-xs text-slate-700 truncate" style={{ maxWidth: '100px' }}>
                                        {displayMatch.color2.name}
                                        {displayMatch.color2.color_number && <span className="text-slate-500 ml-1">{displayMatch.color2.color_number}</span>}
                                      </p>
                                      <span className="text-xs text-slate-500 ml-auto">{Math.round(displayMatch.ratio * 100)}%</span>
                                    </div>
                                  </div>
                                </div>
                              ) : (
                                // Single color match display
                                <div className="flex items-center gap-1.5">
                                  <div
                                    className="w-7 h-7 rounded-lg shadow-sm border border-slate-200 flex-shrink-0"
                                    style={{ backgroundColor: displayMatch.hex }}
                                  ></div>
                                  <div className="flex-1 min-w-0" style={{ maxWidth: '100px' }}>
                                    <p className="text-xs font-medium text-slate-800 truncate">{displayMatch.name}</p>
                                    {displayMatch.color_number && (
                                      <p className="text-xs text-slate-500 font-mono truncate">{displayMatch.color_number}</p>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="text-xs text-slate-400 text-center mt-1.5 pt-1.5 border-t border-slate-100">
                            {displayMatch.delta_e !== undefined ? (
                              <>{deltaEToPercentage(displayMatch.delta_e)}% match</>
                            ) : (
                              <>Distance: {Math.round(displayMatch.distance || 0)}</>
                            )}
                          </div>
                        </div>
                              );
                              })}
                            </div>
                          ))}
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-full text-center p-4">
                      <div>
                        <p className="text-sm text-slate-400 mb-1">
                          No matches found
                        </p>
                      </div>
                    </div>
                  )}
                  </div>
                </div>
              </div>
            </div>
          )}
          </div>
        </div>

        {/* Right Column: Video Selection */}
        <div className="lg:col-span-3 bg-white flex flex-col relative" style={{ minHeight: '600px', height: '100%', maxHeight: '100%' }}>
          
          {!selectedVideo && !selectedImage ? (
            <div className="p-3 space-y-3 h-full flex flex-col">
              {/* Video ID Input */}
              <div className="flex-shrink-0">
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Enter YouTube Video ID
                </label>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={videoId}
                    onChange={(e) => setVideoId(e.target.value)}
                    placeholder="e.g., dQw4w9WgXcQ"
                    className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-offset-2"
                    style={{ focusRingColor: '#ea3663' }}
                  />
                  <button
                    onClick={handleLoadVideo}
                    disabled={!videoId}
                    className="px-4 py-2 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{
                      backgroundColor: '#ea3663'
                    }}
                    onMouseEnter={(e) => !e.target.disabled && (e.target.style.backgroundColor = '#d12a4f')}
                    onMouseLeave={(e) => !e.target.disabled && (e.target.style.backgroundColor = '#ea3663')}
                  >
                    Load Video
                  </button>
                </div>
              </div>

              {/* Inspiration Videos and Images */}
              <div className="flex-1 overflow-y-auto">
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Or choose from your inspiration
                </label>
                {loadingInspirations ? (
                  <div className="flex items-center justify-center py-8">
                    <p className="text-slate-500">Loading inspirations...</p>
                  </div>
                ) : inspirations.length === 0 ? (
                  <div className="flex items-center justify-center py-8">
                    <p className="text-slate-500">No inspirations found. Add videos or images to get started.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                    {inspirations.map((inspiration) => (
                      <button
                        key={`${inspiration.type}-${inspiration.id}`}
                        onClick={() => handleInspirationSelect(inspiration)}
                        className="bg-slate-50 rounded-xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-all text-left"
                        onMouseEnter={(e) => e.currentTarget.style.borderColor = '#ea3663'}
                        onMouseLeave={(e) => e.currentTarget.style.borderColor = '#e2e8f0'}
                      >
                        <div className="relative aspect-video bg-slate-100">
                          {inspiration.type === 'video' ? (
                            <>
                              <img
                                src={inspiration.thumb || `https://img.youtube.com/vi/${inspiration.embed_id}/hqdefault.jpg`}
                                alt={inspiration.title || 'Video'}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  e.target.src = 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=400&h=300&fit=crop';
                                }}
                              />
                              <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30">
                                <div className="w-10 h-10 rounded-full bg-white bg-opacity-90 flex items-center justify-center">
                                  <svg className="w-5 h-5 ml-0.5" fill="currentColor" viewBox="0 0 24 24" style={{ color: '#49817b' }}>
                                    <path d="M8 5v14l11-7z" />
                                  </svg>
                                </div>
                              </div>
                            </>
                          ) : (
                            <img
                              src={inspiration.thumbnail_path || inspiration.path || 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=400&h=300&fit=crop'}
                              alt={inspiration.title || 'Image'}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.target.src = 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=400&h=300&fit=crop';
                              }}
                            />
                          )}
                        </div>
                        <div className="p-2">
                          <div className="flex items-center gap-1 mb-1">
                            <span className="text-xs">{inspiration.type === 'video' ? '📺' : '🖼️'}</span>
                            <span className="text-xs text-slate-500 uppercase">{inspiration.type}</span>
                          </div>
                          <p className="text-sm font-medium text-slate-800 line-clamp-2">{inspiration.title || `${inspiration.type === 'video' ? 'Video' : 'Image'} ${inspiration.id}`}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : selectedImage ? (
            <div className="h-full flex flex-col">
              <div className="flex-1 bg-slate-900 overflow-hidden flex items-center justify-center" style={{ minHeight: '600px' }}>
                <img
                  src={selectedImage.thumbnail || selectedImage.path || 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=800&h=600&fit=crop'}
                  alt={selectedImage.title || 'Image'}
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    e.target.src = 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=800&h=600&fit=crop';
                  }}
                />
              </div>
              <div className="flex items-center justify-between p-2 flex-shrink-0 bg-white border-t border-slate-200">
                <div>
                  <h4 className="text-sm font-semibold text-slate-800">{selectedImage.title || 'Image'}</h4>
                  <p className="text-xs text-slate-600">Image ID: {selectedImage.id}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowJournalModal(true)}
                    className="px-3 py-1.5 text-sm text-white rounded-lg font-medium transition-colors"
                    style={{
                      backgroundColor: '#ea3663'
                    }}
                    onMouseEnter={(e) => e.target.style.backgroundColor = '#d12a4f'}
                    onMouseLeave={(e) => e.target.style.backgroundColor = '#ea3663'}
                  >
                    Add Journal Entry
                  </button>
                  <button
                    onClick={() => {
                      setSelectedImage(null);
                      // Clear query parameter
                      navigate('/color-along', { replace: true });
                    }}
                    className="px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                  >
                    Change Image
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col">
              <div className="flex-1 bg-slate-900 overflow-hidden" style={{ minHeight: '600px' }}>
                <iframe
                  width="100%"
                  height="100%"
                  src={`https://www.youtube.com/embed/${selectedVideo.id}`}
                  title={selectedVideo.title}
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="w-full h-full"
                  style={{ display: 'block' }}
                ></iframe>
              </div>
              <div className="flex items-center justify-between p-2 flex-shrink-0 bg-white border-t border-slate-200">
                <div>
                  <h4 className="text-sm font-semibold text-slate-800">{selectedVideo.title}</h4>
                  <p className="text-xs text-slate-600">Video ID: {selectedVideo.id}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowJournalModal(true)}
                    className="px-3 py-1.5 text-sm text-white rounded-lg font-medium transition-colors"
                    style={{
                      backgroundColor: '#ea3663'
                    }}
                    onMouseEnter={(e) => e.target.style.backgroundColor = '#d12a4f'}
                    onMouseLeave={(e) => e.target.style.backgroundColor = '#ea3663'}
                  >
                    Add Journal Entry
                  </button>
                  <button
                    onClick={() => {
                      setSelectedVideo(null);
                      setVideoId('');
                      // Clear query parameter
                      navigate('/color-along', { replace: true });
                    }}
                    className="px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                  >
                    Change Video
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Success Message */}
      {successMessage && (
        <div 
          className="fixed top-4 right-4 z-50 bg-green-500 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 animate-fade-in"
          style={{
            animation: 'fadeIn 0.3s ease-out'
          }}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <span>{successMessage}</span>
        </div>
      )}

      {/* Journal Entry Modal - Anchored to bottom right of video area */}
      {showJournalModal && (
        <>
          <style>{`
            @keyframes slideUpRight {
              from {
                transform: translateY(100%);
                opacity: 0;
              }
              to {
                transform: translateY(0);
                opacity: 1;
              }
            }
            @keyframes fadeIn {
              from {
                opacity: 0;
                transform: translateY(-10px);
              }
              to {
                opacity: 1;
                transform: translateY(0);
              }
            }
            @media (min-width: 1024px) {
              .journal-modal-container {
                width: calc(75% - 0.5rem);
                max-width: 600px;
                right: 0;
              }
            }
            @media (max-width: 1023px) {
              .journal-modal-container {
                width: 100%;
                max-width: 100%;
                right: 0;
              }
            }
          `}</style>
          <div 
            className="fixed bottom-0 z-50 journal-modal-container"
            style={{
              animation: 'slideUpRight 0.3s ease-out'
            }}
          >
            <div 
              className="bg-white rounded-t-2xl shadow-2xl w-full max-h-[85vh] overflow-y-auto border-t border-l border-r border-slate-200"
            >
            
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b border-slate-200 p-3 flex items-center justify-between z-10">
              <h2 className="text-base font-semibold text-slate-800 font-venti">Add Journal Entry</h2>
              <button
                onClick={() => setShowJournalModal(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-3 space-y-3">
              {loadingJournalData ? (
                <div className="flex items-center justify-center py-8">
                  <p className="text-slate-500">Loading form data...</p>
                </div>
              ) : (
                <>
                  {/* Date */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">
                      Date
                    </label>
                    <input
                      type="date"
                      value={journalFormData.date}
                      onChange={(e) => setJournalFormData({ ...journalFormData, date: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-offset-2"
                      style={{ focusRingColor: '#ea3663' }}
                    />
                  </div>

                  {/* Inspiration */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">
                      Inspiration
                    </label>
                    <DropdownMenu
                      options={inspirations.map(insp => {
                        const id = insp.id;
                        const title = insp.title || insp.name || `Inspiration ${id}`;
                        const type = insp.type;
                        return {
                          value: id.toString(),
                          label: `${type === 'video' ? '📺' : '🖼️'} ${title}`
                        };
                      })}
                      value={journalFormData.inspiration}
                      onChange={(value) => setJournalFormData({ ...journalFormData, inspiration: value })}
                      placeholder="Select inspiration..."
                    />
                  </div>

                  {/* Pencil Set */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">
                      Pencil Set
                    </label>
                    <DropdownMenu
                      options={userPencilSets.map(set => ({
                        value: set.id.toString(),
                        label: `${set.name} (${set.brand}) - ${set.count} colors`
                      }))}
                      value={journalFormData.pencilSet}
                      onChange={(value) => setJournalFormData({ ...journalFormData, pencilSet: value })}
                      placeholder="Select pencil set..."
                    />
                  </div>

                  {/* Book */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">
                      Book
                    </label>
                    <DropdownMenu
                      options={books.map(book => ({
                        value: book.id.toString(),
                        label: book.title || book.name || `Book ${book.id}`
                      }))}
                      value={journalFormData.book}
                      onChange={(value) => setJournalFormData({ ...journalFormData, book: value })}
                      placeholder="Select a book (optional)..."
                    />
                  </div>

                  {/* Color Palette */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">
                      Color Palette
                    </label>
                    <DropdownMenu
                      options={palettes.map(palette => ({
                        value: palette.id.toString(),
                        label: palette.name || palette.title || `Palette ${palette.id}`
                      }))}
                      value={journalFormData.palette}
                      onChange={(value) => setJournalFormData({ ...journalFormData, palette: value })}
                      placeholder="Select a color palette (optional)..."
                    />
                  </div>

                  {/* Color Combos (Multi-select) */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">
                      Color Combos
                    </label>
                    <div className="space-y-2 max-h-40 overflow-y-auto border border-slate-200 rounded-lg p-2">
                      {combos.length === 0 ? (
                        <p className="text-sm text-slate-400 text-center py-2">No color combos available</p>
                      ) : (
                        combos.map(combo => (
                          <label key={combo.id} className="flex items-center space-x-2 p-2 hover:bg-slate-50 rounded cursor-pointer">
                            <input
                              type="checkbox"
                              checked={journalFormData.combos.includes(combo.id.toString())}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setJournalFormData({
                                    ...journalFormData,
                                    combos: [...journalFormData.combos, combo.id.toString()]
                                  });
                                } else {
                                  setJournalFormData({
                                    ...journalFormData,
                                    combos: journalFormData.combos.filter(id => id !== combo.id.toString())
                                  });
                                }
                              }}
                              className="w-4 h-4 text-pink-600 border-slate-300 rounded focus:ring-pink-500"
                            />
                            <span className="text-sm text-slate-700">
                              {combo.name || combo.title || `Combo ${combo.id}`}
                            </span>
                          </label>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Notes */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">
                      Notes
                    </label>
                    <textarea
                      value={journalFormData.notes}
                      onChange={(e) => setJournalFormData({ ...journalFormData, notes: e.target.value })}
                      rows={4}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-offset-2"
                      style={{ focusRingColor: '#ea3663' }}
                      placeholder="Add your notes about this session..."
                    />
                  </div>
                </>
              )}
            </div>

            {/* Modal Footer */}
            <div className="sticky bottom-0 bg-white border-t border-slate-200 p-3 flex items-center justify-end gap-2">
              <button
                onClick={() => setShowJournalModal(false)}
                className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  try {
                    setSavingJournal(true);
                    
                    // Prepare data for API
                    const entryData = {
                      date: journalFormData.date,
                      inspiration: journalFormData.inspiration || null,
                      pencilSet: journalFormData.pencilSet || null,
                      book: journalFormData.book || null,
                      palette: journalFormData.palette || null,
                      combos: journalFormData.combos.map(id => parseInt(id)),
                      notes: journalFormData.notes || null
                    };

                    // Remove null/empty string values (but keep empty arrays for combos)
                    Object.keys(entryData).forEach(key => {
                      if (key !== 'combos' && (entryData[key] === null || entryData[key] === '')) {
                        delete entryData[key];
                      }
                    });

                    await journalEntriesAPI.create(entryData);
                    
                    // Close modal
                    setShowJournalModal(false);
                    
                    // Show success message
                    setSuccessMessage('Journal entry saved successfully!');
                    
                    // Auto-dismiss success message after 3 seconds
                    setTimeout(() => {
                      setSuccessMessage('');
                    }, 3000);
                    
                    // Reset form
                    setJournalFormData({
                      date: new Date().toISOString().split('T')[0],
                      inspiration: '',
                      pencilSet: '',
                      book: '',
                      palette: '',
                      combos: [],
                      notes: ''
                    });
                  } catch (error) {
                    console.error('Error saving journal entry:', error);
                    alert('Failed to save journal entry. Please try again.');
                  } finally {
                    setSavingJournal(false);
                  }
                }}
                disabled={loadingJournalData || savingJournal}
                className="px-4 py-2 text-sm text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  backgroundColor: '#ea3663'
                }}
                onMouseEnter={(e) => !e.target.disabled && (e.target.style.backgroundColor = '#d12a4f')}
                onMouseLeave={(e) => !e.target.disabled && (e.target.style.backgroundColor = '#ea3663')}
              >
                {savingJournal ? 'Saving...' : 'Save Entry'}
              </button>
            </div>
          </div>
        </div>
        </>
      )}
    </div>
  );
};

export default ColorAlong;

