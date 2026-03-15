import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { inspirationAPI, playlistsAPI, videosAPI, filesAPI, userAPI, tagsAPI } from '../services/api';
import AddPlaylistModal from './AddPlaylistModal';
import EditPlaylistModal from './EditPlaylistModal';
import AddInspirationModal from './AddInspirationModal';
import PrimaryButton from './PrimaryButton';
import HoverableCard from './HoverableCard';
import LoadingState from './LoadingState';
import ErrorState from './ErrorState';
import VideoThumbnail from './VideoThumbnail';
import UpgradeBanner from './UpgradeBanner';
import DeleteConfirmationModal from './DeleteConfirmationModal';

const Library = ({ user }) => {
  const navigate = useNavigate();
  const location = useLocation();
  // Single section: playlists | videos | files (replaces old All/Videos/Files tabs + Playlists/All Videos sub-tabs)
  const [section, setSection] = useState('playlists');
  const [inspirations, setInspirations] = useState([]);
  const [playlists, setPlaylists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadingPlaylists, setLoadingPlaylists] = useState(false);
  const observerTarget = useRef(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isAddPlaylistModalOpen, setIsAddPlaylistModalOpen] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [editPlaylistModalOpen, setEditPlaylistModalOpen] = useState(false);
  const [playlistToEdit, setPlaylistToEdit] = useState(null);
  const [playlistToDelete, setPlaylistToDelete] = useState(null);
  const [showPlaylistDeleteModal, setShowPlaylistDeleteModal] = useState(false);
  const [favorites, setFavorites] = useState(new Set());
  const [togglingFavorite, setTogglingFavorite] = useState(null);
  const [tagFilterIds, setTagFilterIds] = useState([]);
  const [knownTags, setKnownTags] = useState([]);
  const [tagFilterDropdownOpen, setTagFilterDropdownOpen] = useState(false);
  const [tagFilterSearch, setTagFilterSearch] = useState('');
  const tagFilterDropdownRef = useRef(null);
  const [expandedPlaylistIds, setExpandedPlaylistIds] = useState(new Set());
  const [loadingFullPlaylistId, setLoadingFullPlaylistId] = useState(null);

  // Check if we should open the add modal from navigation state
  useEffect(() => {
    if (location.state?.openAddModal) {
      setIsAddModalOpen(true);
      // Clear the state to prevent reopening on re-render
      navigate(location.pathname, { replace: true, state: { ...location.state, openAddModal: false } });
    }
  }, [location.state, navigate, location.pathname]);

  // Transform API response to component format
  const transformItem = (item) => {
    // Ensure id is a number for consistent comparison with favorites
    const id = Number(item.id);
    const normalizedId = !isNaN(id) ? id : item.id;
    
    if (item.type === 'video') {
      return {
        id: normalizedId,
        type: 'video',
        title: item.title || 'Untitled Video',
        thumbnail: item.thumb || 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=400&h=300&fit=crop',
        videoId: item.embed_id,
        embedId: item.embed_id,
        tags: item.tags || [],
      };
    } else if (item.type === 'file' || item.type === 'image' || item.type === 'pdf') {
      // Determine file type from mime_type or use the type from API
      const isPdf = item.type === 'pdf' || item.mime_type?.includes('pdf');
      const isImage = item.type === 'image' || item.mime_type?.startsWith('image/');
      
      return {
        id: normalizedId,
        type: isPdf ? 'pdf' : (isImage ? 'image' : 'file'),
        title: item.title || 'Untitled File',
        thumbnail: item.thumbnail_path || item.path || 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=400&h=300&fit=crop',
        path: item.path,
        mime_type: item.mime_type,
        tags: item.tags || [],
      };
    }
    return null;
  };

  const getFirstFiveFromFull = useCallback((playlist) => {
    const videos = playlist.videos || [];
    const files = playlist.files || [];
    const combined = [];
    const maxLen = Math.max(videos.length, files.length);
    for (let i = 0; i < maxLen && combined.length < 5; i++) {
      if (videos[i]) combined.push({ ...videos[i], type: 'video' });
      if (combined.length < 5 && files[i]) combined.push({ ...files[i] });
    }
    return combined.slice(0, 5);
  }, []);

  const togglePlaylistExpanded = useCallback((playlistId) => {
    setExpandedPlaylistIds((prev) => {
      const next = new Set(prev);
      if (next.has(playlistId)) next.delete(playlistId);
      else next.add(playlistId);
      return next;
    });
  }, []);

  const transformPreviewItem = useCallback((item) => {
    const id = Number(item.id);
    const normalizedId = !isNaN(id) ? id : item.id;
    if (item.type === 'video') {
      return {
        id: normalizedId,
        type: 'video',
        title: item.title || 'Untitled Video',
        thumbnail: item.thumb || `https://img.youtube.com/vi/${item.embed_id}/hqdefault.jpg`,
        videoId: item.embed_id,
        embedId: item.embed_id,
      };
    }
    return {
      id: normalizedId,
      type: item.type || 'file',
      title: item.title || 'Untitled File',
      thumbnail: item.thumbnail_path || item.path || 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=400&h=300&fit=crop',
      path: item.path,
      mime_type: item.mime_type,
    };
  }, []);

  const fetchFullPlaylist = useCallback(async (playlistId) => {
    try {
      setLoadingFullPlaylistId(playlistId);
      const [videosResponse, filesResponse] = await Promise.all([
        playlistsAPI.getVideos(playlistId),
        playlistsAPI.getFiles(playlistId),
      ]);
      const videosData = Array.isArray(videosResponse) ? videosResponse : (videosResponse?.data ?? []);
      const filesData = Array.isArray(filesResponse) ? filesResponse : (filesResponse?.data ?? []);
      const isPdf = (f) => f.mime_type && f.mime_type.includes('pdf');
      const isImage = (f) => f.mime_type && f.mime_type.startsWith('image/');
      const videos = (videosData || []).map((video) => {
        const videoId = Number(video.id);
        return {
          id: !isNaN(videoId) ? videoId : video.id,
          type: 'video',
          title: video.title || 'Untitled Video',
          thumbnail: video.thumb || `https://img.youtube.com/vi/${video.embed_id}/hqdefault.jpg`,
          videoId: video.embed_id,
          embedId: video.embed_id,
        };
      });
      const files = (filesData || []).map((f) => {
        const fileId = Number(f.id);
        return {
          id: !isNaN(fileId) ? fileId : f.id,
          type: isPdf(f) ? 'pdf' : isImage(f) ? 'image' : 'file',
          title: f.title || 'Untitled File',
          thumbnail: f.thumbnail_path || f.path || 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=400&h=300&fit=crop',
          path: f.path,
          mime_type: f.mime_type,
        };
      });
      setPlaylists((prev) =>
        prev.map((p) =>
          Number(p.id) === Number(playlistId) ? { ...p, videos, files } : p
        )
      );
      setExpandedPlaylistIds((prev) => new Set(prev).add(playlistId));
    } catch (err) {
      setError(err.message || err.data?.message || 'Failed to load playlist');
      console.error('Error fetching full playlist:', err);
    } finally {
      setLoadingFullPlaylistId(null);
    }
  }, []);

  // Fetch playlists (preview: first 5 items per playlist from API)
  const fetchPlaylists = useCallback(async () => {
    try {
      setLoadingPlaylists(true);
      setError(null);

      const response = await playlistsAPI.getAll({ preview: true });
      const playlistsData = Array.isArray(response) ? response : (response?.data ?? []);

      const transformedPlaylists = playlistsData.map((playlist) => {
        const playlistId = Number(playlist.id);
        const base = {
          id: !isNaN(playlistId) ? playlistId : playlist.id,
          title: playlist.title || 'Untitled Playlist',
          thumbnail: playlist.thumb || 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=400&h=300&fit=crop',
          videos: [],
          files: [],
        };
        if (playlist.preview_items && playlist.preview_items.length > 0) {
          base.preview_items = playlist.preview_items.map(transformPreviewItem);
          base.preview_total = playlist.preview_total ?? playlist.preview_items.length;
        }
        if (playlist.videos && playlist.videos.length > 0) {
          base.videos = (playlist.videos || []).map((video) => ({
            id: Number(video.id) || video.id,
            type: 'video',
            title: video.title || 'Untitled Video',
            thumbnail: video.thumb || `https://img.youtube.com/vi/${video.embed_id}/hqdefault.jpg`,
            videoId: video.embed_id,
            embedId: video.embed_id,
          }));
        }
        if (playlist.files && playlist.files.length > 0) {
          const isPdf = (f) => f.mime_type && f.mime_type.includes('pdf');
          const isImage = (f) => f.mime_type && f.mime_type.startsWith('image/');
          base.files = (playlist.files || []).map((f) => ({
            id: Number(f.id) || f.id,
            type: isPdf(f) ? 'pdf' : (isImage(f) ? 'image' : 'file'),
            title: f.title || 'Untitled File',
            thumbnail: f.thumbnail_path || f.path || 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=400&h=300&fit=crop',
            path: f.path,
            mime_type: f.mime_type,
          }));
        }
        return base;
      });

      setPlaylists(transformedPlaylists);
    } catch (err) {
      setError(err.message || err.data?.message || 'Failed to load playlists');
      console.error('Error fetching playlists:', err);
      setPlaylists([]);
    } finally {
      setLoadingPlaylists(false);
    }
  }, [transformPreviewItem]);

  // Fetch inspirations from API
  const fetchInspirations = useCallback(async (page = 1, append = false) => {
    try {
      if (append) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }
      setError(null);

      // Determine type filter: playlists/videos → video, files → file
      const filters = {
        type: section === 'files' ? 'file' : 'video',
        sort: 'title',
        sort_direction: 'asc'
      };
      if (tagFilterIds.length > 0) {
        filters.tags = tagFilterIds;
      }
      const response = await inspirationAPI.getAll(page, 40, filters);
      
      // Handle response format
      const items = response.data || [];
      const transformedItems = items.map(transformItem).filter(Boolean);

      if (append) {
        setInspirations(prev => [...prev, ...transformedItems]);
      } else {
        setInspirations(transformedItems);
      }

      // Check if there are more pages
      setHasMore(response.current_page < response.last_page);
      setCurrentPage(response.current_page);
    } catch (err) {
      setError(err.message || err.data?.message || 'Failed to load inspirations');
      console.error('Error fetching inspirations:', err);
      if (!append) {
        setInspirations([]);
      }
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [section, tagFilterIds]);

  // Fetch user favorites
  const fetchFavorites = useCallback(async () => {
    try {
      const userId = user?.id;
      if (!userId) return;
      
      if (!userAPI.getFavorites) {
        setFavorites(new Set());
        return;
      }
      
      const response = await userAPI.getFavorites(userId);
      
      // Handle different response structures - be more flexible
      let favoritesData = [];
      
      // Check if response is directly an array
      if (Array.isArray(response)) {
        favoritesData = response;
      } 
      // Check if response has a data property that's an array
      else if (response?.data && Array.isArray(response.data)) {
        favoritesData = response.data;
      }
      // Check if response is array-like (has length property)
      else if (response && typeof response === 'object' && 'length' in response && typeof response.length === 'number') {
        // Convert array-like object to array
        favoritesData = Array.from(response);
      }
      // Last resort: try to use response directly if it exists
      else if (response) {
        favoritesData = response;
      }
      
      // Ensure favoritesData is actually an array
      if (!Array.isArray(favoritesData)) {
        favoritesData = Array.isArray(favoritesData) ? favoritesData : (favoritesData ? [favoritesData] : []);
      }
      
      if (favoritesData.length > 0) {
        const favoriteIds = new Set();
        favoritesData.forEach(fav => {
          // Check for both possible type formats and use flexible matching
          const isVideo = fav.favoritable_type === 'App\\Models\\Video' || 
                        fav.favoritable_type === 'App\Models\Video' ||
                        fav.favoritable_type?.includes('Video');
          const isFile = fav.favoritable_type === 'App\\Models\\File' || 
                        fav.favoritable_type === 'App\Models\File' ||
                        fav.favoritable_type?.includes('File');
          
          if (fav.favoritable_id !== undefined && fav.favoritable_id !== null) {
            // Convert to number to ensure type consistency
            const id = Number(fav.favoritable_id);
            if (!isNaN(id)) {
              if (isVideo) {
                favoriteIds.add(`video-${id}`);
              } else if (isFile) {
                favoriteIds.add(`file-${id}`);
              }
            }
          }
        });
        setFavorites(favoriteIds);
      } else {
        // If no favorites found, set empty Set
        setFavorites(new Set());
      }
    } catch (err) {
      console.error('Error fetching favorites:', err);
      setFavorites(new Set());
    }
  }, [user]);

  // Fetch known tags for filter dropdown
  useEffect(() => {
    let cancelled = false;
    tagsAPI.getAll().then((response) => {
      if (cancelled) return;
      const list = Array.isArray(response) ? response : (response?.data ?? []);
      setKnownTags(list);
    }).catch(() => { if (!cancelled) setKnownTags([]); });
    return () => { cancelled = true; };
  }, []);

  // Close tag filter dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (tagFilterDropdownRef.current && !tagFilterDropdownRef.current.contains(e.target)) {
        setTagFilterDropdownOpen(false);
      }
    };
    if (tagFilterDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [tagFilterDropdownOpen]);

  // Initial fetch and refetch when section changes
  useEffect(() => {
    fetchInspirations(1, false);
    fetchFavorites();
  }, [fetchInspirations, fetchFavorites]);

  // Fetch playlists on mount (for Playlists view and Add to playlist dropdown)
  useEffect(() => {
    fetchPlaylists();
  }, [fetchPlaylists]);

  // Infinite scroll observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore && !loading) {
          fetchInspirations(currentPage + 1, true);
        }
      },
      { threshold: 0.1 }
    );

    const currentTarget = observerTarget.current;
    if (currentTarget) {
      observer.observe(currentTarget);
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget);
      }
    };
  }, [hasMore, loadingMore, loading, currentPage, fetchInspirations]);

  // Check if user has free plan
  const isFreePlan = user?.subscription_plan === 'free' || !user?.subscription_plan;
  const FREE_PLAN_LIMIT = 5;

  // Inspirations are already filtered, sorted, and limited by the API
  const limitedInspirations = inspirations;
  
  // Check limit from API response meta if available
  const hasReachedLimit = isFreePlan && inspirations.length >= FREE_PLAN_LIMIT;

  const handleDelete = async () => {
    if (!itemToDelete) return;
    
    setDeleting(true);
    setError(null);
    
    try {
      if (itemToDelete.type === 'video') {
        await videosAPI.delete(itemToDelete.id);
      } else if (itemToDelete.type === 'file' || itemToDelete.type === 'image' || itemToDelete.type === 'pdf') {
        await filesAPI.delete(itemToDelete.id);
      }
      
      // Refresh the list
      await fetchInspirations(1, false);
      if (section === 'playlists' || section === 'videos') {
        await fetchPlaylists();
      }
      
      setShowDeleteModal(false);
      setItemToDelete(null);
    } catch (err) {
      setError(err.data?.message || err.message || 'Failed to delete item');
    } finally {
      setDeleting(false);
    }
  };

  const handleToggleFavorite = async (item, e) => {
    e.stopPropagation();
    if (togglingFavorite === item.id) return;
    
    setTogglingFavorite(item.id);
    try {
      const isVideo = item.type === 'video';
      const api = isVideo ? videosAPI : filesAPI;
      const result = await api.toggleFavorite(item.id);
      
      // Update favorites state
      // Convert item.id to number to ensure type consistency
      const numericId = Number(item.id);
      const favoriteKey = `${isVideo ? 'video' : 'file'}-${numericId}`;
      setFavorites(prev => {
        const newFavorites = new Set(prev);
        if (result.is_favorited) {
          newFavorites.add(favoriteKey);
        } else {
          newFavorites.delete(favoriteKey);
        }
        return newFavorites;
      });
    } catch (err) {
      console.error('Error toggling favorite:', err);
      alert(err.data?.message || err.message || 'Failed to update favorite');
    } finally {
      setTogglingFavorite(null);
    }
  };

  const handleDeletePlaylist = async () => {
    if (!playlistToDelete) return;
    setDeleting(true);
    setError(null);
    try {
      await playlistsAPI.delete(playlistToDelete.id);
      await fetchPlaylists();
      await fetchInspirations(1, false);
      setShowPlaylistDeleteModal(false);
      setPlaylistToDelete(null);
    } catch (err) {
      setError(err.data?.message || err.message || 'Failed to delete playlist');
    } finally {
      setDeleting(false);
    }
  };

  const handleRemoveVideoFromPlaylist = async (videoId, playlistId, e) => {
    e?.stopPropagation();
    try {
      await videosAPI.removeFromPlaylist(videoId, playlistId);
      await fetchPlaylists();
      await fetchInspirations(1, false);
    } catch (err) {
      setError(err.data?.message || err.message || 'Failed to remove video from playlist');
    }
  };

  const handleRemoveFileFromPlaylist = async (fileId, playlistId, e) => {
    e?.stopPropagation();
    try {
      await filesAPI.removeFromPlaylist(fileId, playlistId);
      await fetchPlaylists();
      await fetchInspirations(1, false);
    } catch (err) {
      setError(err.data?.message || err.message || 'Failed to remove file from playlist');
    }
  };

  // Get all videos from playlists for "all videos" view
  const allVideosFromPlaylists = playlists.flatMap(playlist => playlist.videos);

  // For "All Videos" section: merge standalone videos with playlist videos (deduped).
  // When a tag filter is active, show only API results (tag-filtered), not playlist videos.
  const getVideosToDisplay = () => {
    if (section !== 'videos') return limitedInspirations;
    const standaloneVideos = limitedInspirations.filter(item => item.type === 'video');
    if (tagFilterIds.length > 0) {
      return isFreePlan ? standaloneVideos.slice(0, FREE_PLAN_LIMIT) : standaloneVideos;
    }
    const allVideos = [...standaloneVideos, ...allVideosFromPlaylists];
    const uniqueVideos = Array.from(
      new Map(allVideos.map(video => [video.videoId || video.id, video])).values()
    );
    if (isFreePlan) return uniqueVideos.slice(0, FREE_PLAN_LIMIT);
    return uniqueVideos;
  };

  // Items to show in the grid: merged videos for "All Videos", otherwise inspirations (files or empty when playlists)
  const gridItems = section === 'videos' ? getVideosToDisplay() : limitedInspirations;

  const tabStyle = (active) => active
    ? { color: '#49817b', borderBottomColor: '#49817b' }
    : {};

  return (
    <div className="space-y-6">
      {/* Main row: type tabs + actions — stable layout, no jumping */}
      <div className="px-4">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-4 flex-wrap">
            <h3 className="text-xl font-semibold text-slate-800 font-venti">Inspo</h3>
            {knownTags.length > 0 && (section === 'videos' || section === 'files') && (
              <div ref={tagFilterDropdownRef} className="relative">
                <button
                  type="button"
                  onClick={() => setTagFilterDropdownOpen((o) => !o)}
                  className="inline-flex items-center gap-2 px-3 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-[#ea3663]"
                >
                  Tags
                  {tagFilterIds.length > 0 && (
                    <span className="inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1.5 rounded-full text-xs font-semibold text-white" style={{ backgroundColor: '#ea3663' }}>
                      {tagFilterIds.length}
                    </span>
                  )}
                  <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {tagFilterDropdownOpen && (
                  <div className="absolute left-0 top-full mt-1 z-50 w-72 rounded-xl border border-slate-200 bg-white shadow-lg overflow-hidden">
                    <div className="p-2 border-b border-slate-100">
                      <input
                        type="text"
                        value={tagFilterSearch}
                        onChange={(e) => setTagFilterSearch(e.target.value)}
                        placeholder="Search tags..."
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#ea3663] focus:border-transparent"
                      />
                    </div>
                    <div className="max-h-56 overflow-y-auto py-1">
                      {knownTags
                        .filter((t) => !tagFilterSearch.trim() || (t.tag || '').toLowerCase().includes(tagFilterSearch.trim().toLowerCase()))
                        .map((t) => {
                          const isSelected = tagFilterIds.includes(Number(t.id));
                          return (
                            <button
                              key={t.id}
                              type="button"
                              onClick={() => {
                                setTagFilterIds((prev) => {
                                  const id = Number(t.id);
                                  if (prev.includes(id)) return prev.filter((x) => x !== id);
                                  return [...prev, id];
                                });
                              }}
                              className={`w-full text-left px-3 py-2 text-sm flex items-center gap-2 hover:bg-slate-50 ${isSelected ? 'font-medium bg-slate-50' : 'text-slate-700'}`}
                              style={isSelected ? { color: '#ea3663' } : undefined}
                            >
                              <span className={`flex-shrink-0 w-4 h-4 rounded border flex items-center justify-center ${isSelected ? '' : 'border-slate-300'}`} style={isSelected ? { backgroundColor: '#ea3663', borderColor: '#ea3663' } : undefined}>
                                {isSelected && (
                                  <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                  </svg>
                                )}
                              </span>
                              {t.tag}
                            </button>
                          );
                        })}
                      {knownTags.filter((t) => !tagFilterSearch.trim() || (t.tag || '').toLowerCase().includes(tagFilterSearch.trim().toLowerCase())).length === 0 && (
                        <p className="px-3 py-4 text-sm text-slate-500 text-center">No tags match</p>
                      )}
                    </div>
                    {tagFilterIds.length > 0 && (
                      <div className="p-2 border-t border-slate-100">
                        <button
                          type="button"
                          onClick={() => setTagFilterIds([])}
                          className="w-full px-3 py-2 text-sm font-medium rounded-lg hover:bg-slate-50 transition-colors"
                          style={{ color: '#ea3663' }}
                        >
                          Clear all
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Section options: Playlists | All Videos | Other Files */}
            <div className="flex border-b border-slate-200 -mb-px">
              <button
                onClick={() => setSection('playlists')}
                className="px-4 py-2.5 text-sm font-medium border-b-2 border-transparent transition-colors hover:text-slate-800"
                style={tabStyle(section === 'playlists')}
              >
                Playlists
              </button>
              <button
                onClick={() => setSection('videos')}
                className="px-4 py-2.5 text-sm font-medium border-b-2 border-transparent transition-colors hover:text-slate-800"
                style={tabStyle(section === 'videos')}
              >
                All Videos
              </button>
              <button
                onClick={() => setSection('files')}
                className="px-4 py-2.5 text-sm font-medium border-b-2 border-transparent transition-colors hover:text-slate-800"
                style={tabStyle(section === 'files')}
              >
                Other Files
              </button>
            </div>
            <PrimaryButton
              onClick={() => {
                if (hasReachedLimit) {
                  alert('You\'ve reached the limit of 5 inspirations on the free plan. Please upgrade to Premium to add more.');
                  return;
                }
                setIsAddPlaylistModalOpen(true);
              }}
              disabled={hasReachedLimit}
              icon={
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              }
            >
              Add Playlist
            </PrimaryButton>
            <PrimaryButton
              onClick={() => {
                if (hasReachedLimit) {
                  alert('You\'ve reached the limit of 5 inspirations on the free plan. Please upgrade to Premium to add more.');
                  return;
                }
                setIsAddModalOpen(true);
              }}
              disabled={hasReachedLimit}
              icon={
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              }
            >
              Add File
            </PrimaryButton>
          </div>
        </div>
      </div>

      {/* Grid Section */}
      <div className="bg-white p-6">
        {hasReachedLimit && (
          <UpgradeBanner itemType="inspirations" />
        )}
        {loading && inspirations.length === 0 && !loadingPlaylists && section !== 'playlists' && (
          <div className="bg-white p-12 text-center">
            <div className="modern-loader mb-4">
              <div className="loader-ring">
                <div className="loader-ring-segment"></div>
                <div className="loader-ring-segment"></div>
                <div className="loader-ring-segment"></div>
                <div className="loader-ring-segment"></div>
              </div>
            </div>
            <h3 className="text-xl font-semibold text-slate-800 mb-2 font-venti">Loading Inspirations...</h3>
            <p className="text-slate-600">Fetching your inspiration library</p>
          </div>
        )}
        {error && inspirations.length === 0 && playlists.length === 0 && !loading && section !== 'playlists' && (
          <ErrorState error={error} />
        )}
        {section === 'playlists' && (
          <>
            {loadingPlaylists ? (
              <div className="bg-white p-12 text-center">
                <div className="modern-loader mb-4">
                  <div className="loader-ring">
                    <div className="loader-ring-segment"></div>
                    <div className="loader-ring-segment"></div>
                    <div className="loader-ring-segment"></div>
                    <div className="loader-ring-segment"></div>
                  </div>
                </div>
                <h3 className="text-xl font-semibold text-slate-800 mb-2 font-venti">Loading Playlists...</h3>
                <p className="text-slate-600">Fetching your playlists</p>
              </div>
            ) : playlists.length === 0 ? (
              error ? (
                <ErrorState error={error} />
              ) : (
                <div className="text-center py-12">
                  <p className="text-slate-500">No playlists found.</p>
                </div>
              )
            ) : (
              <div className="space-y-8">
                {playlists.map((playlist) => (
                  <div key={playlist.id} className="space-y-4">
                    {/* Playlist Header */}
                    <div className="flex items-center justify-between gap-4 pb-2 border-b border-slate-200">
                      <div className="flex items-center gap-4">
                        <img
                          src={playlist.thumbnail}
                          alt={playlist.title}
                          className="w-16 h-12 object-cover rounded"
                          onError={(e) => {
                            e.target.src = 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=400&h=300&fit=crop';
                          }}
                        />
                        <div>
                          <h2 className="text-xl font-semibold text-slate-800">{playlist.title}</h2>
                          <p className="text-sm text-slate-500">
                            {(playlist.videos?.length > 0 || (playlist.files?.length ?? 0) > 0)
                              ? (
                                  <>
                                    {playlist.videos?.length ?? 0} {(playlist.videos?.length ?? 0) === 1 ? 'video' : 'videos'}
                                    {(playlist.files?.length ?? 0) > 0 && (
                                      <>, {playlist.files?.length ?? 0} {(playlist.files?.length ?? 0) === 1 ? 'file' : 'files'}</>
                                    )}
                                  </>
                                )
                              : (playlist.preview_total != null ? `${playlist.preview_total} items` : '0 items')}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => { setPlaylistToEdit(playlist); setEditPlaylistModalOpen(true); }}
                          className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                          title="Edit playlist name"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          type="button"
                          onClick={() => { setPlaylistToDelete(playlist); setShowPlaylistDeleteModal(true); }}
                          className="p-2 text-slate-600 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors"
                          title="Delete playlist (videos are kept)"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                    {/* Playlist content: preview (first 5 from API) with View all, or full list when expanded */}
                    {!expandedPlaylistIds.has(playlist.id) ? (
                      <>
                        {loadingFullPlaylistId === playlist.id ? (
                          <div className="py-8 flex justify-center items-center gap-3">
                            <div className="modern-loader">
                              <div className="loader-ring">
                                <div className="loader-ring-segment"></div>
                                <div className="loader-ring-segment"></div>
                                <div className="loader-ring-segment"></div>
                                <div className="loader-ring-segment"></div>
                              </div>
                            </div>
                            <span className="text-slate-600">Loading full playlist...</span>
                          </div>
                        ) : (playlist.preview_items?.length > 0 || (playlist.videos?.length > 0 || (playlist.files?.length ?? 0) > 0)) ? (
                          (() => {
                            const displayItems = playlist.preview_items?.length
                              ? playlist.preview_items
                              : getFirstFiveFromFull(playlist);
                            const totalCount = ((playlist.videos?.length ?? 0) + (playlist.files?.length ?? 0)) || (playlist.preview_total ?? 0);
                            return (
                          <>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
                              {displayItems.map((item) => (
                                <HoverableCard
                                  key={item.type === 'video' ? `video-${item.id}` : `file-${item.id}`}
                                  className="group relative"
                                >
                                  <div className="w-full">
                                    {item.type === 'video' ? (
                                      <VideoThumbnail
                                        thumbnail={item.thumbnail}
                                        alt={item.title}
                                        className="group-hover:scale-105 transition-transform duration-300"
                                      />
                                    ) : (
                                      <div className="relative aspect-video bg-slate-100 overflow-hidden">
                                        <img
                                          src={item.thumbnail}
                                          alt={item.title}
                                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                          onError={(e) => {
                                            e.target.src = 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=400&h=300&fit=crop';
                                          }}
                                        />
                                        {item.type === 'pdf' && (
                                          <div className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded text-xs font-medium">
                                            PDF
                                          </div>
                                        )}
                                      </div>
                                    )}
                                    <div className="p-4">
                                      <div className="flex items-start justify-between mb-1">
                                        <div className="flex-1 min-w-0">
                                          <h3 className="font-medium text-slate-800 mb-1 line-clamp-2">{item.title}</h3>
                                          <p className="text-xs text-slate-500 capitalize">{item.type}</p>
                                          {item.tags?.length > 0 && (
                                            <div className="flex flex-wrap gap-1 mt-2">
                                              {item.tags.slice(0, 3).map((t) => (
                                                <span key={t.id || t.tag} className="px-1.5 py-0.5 rounded text-xs bg-slate-100 text-slate-600">
                                                  {t.tag || t}
                                                </span>
                                              ))}
                                              {item.tags.length > 3 && (
                                                <span className="text-xs text-slate-400">+{item.tags.length - 3}</span>
                                              )}
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                  <div
                                    className="absolute inset-0 z-10 bg-black bg-opacity-70 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-center gap-3 rounded-xl"
                                  >
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          navigate(item.type === 'video' ? `/edit/inspiration/video/${item.id}` : `/edit/inspiration/file/${item.id}`);
                                        }}
                                        className="w-40 min-h-10 text-xs px-3 py-2 bg-white text-slate-800 rounded-lg font-medium hover:bg-slate-100 transition-colors flex items-center justify-center gap-1.5"
                                        title="Edit"
                                      >
                                        <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                        </svg>
                                        Edit
                                      </button>
                                      {item.type === 'video' && (
                                        <PrimaryButton
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            if (item.videoId) navigate(`/color-along?video=${item.videoId}`);
                                          }}
                                          className="w-40 min-h-10 justify-center"
                                          icon={<svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>}
                                        >
                                          Color Along
                                        </PrimaryButton>
                                      )}
                                      {item.type === 'image' && (
                                        <PrimaryButton
                                          onClick={(e) => { e.stopPropagation(); navigate(`/color-along?image=${item.id}`); }}
                                          className="w-40 min-h-10 justify-center"
                                          icon={<svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>}
                                        >
                                          Color Along
                                        </PrimaryButton>
                                      )}
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          if (item.type === 'video') handleRemoveVideoFromPlaylist(item.id, playlist.id, e);
                                          else handleRemoveFileFromPlaylist(item.id, playlist.id, e);
                                        }}
                                        className="w-40 min-h-10 text-xs px-3 py-2 bg-white text-slate-800 rounded-lg font-medium hover:bg-slate-100 transition-colors flex items-center justify-center gap-1.5 whitespace-nowrap"
                                        title="Remove from playlist"
                                      >
                                        <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                        Remove from playlist
                                      </button>
                                  </div>
                                  <div className="absolute top-2 right-2 z-20 flex items-center gap-2">
                                    <button
                                      onClick={(e) => handleToggleFavorite({ id: item.id, type: item.type === 'video' ? 'video' : 'file' }, e)}
                                      className={`p-2 bg-white bg-opacity-80 hover:bg-opacity-100 rounded-full transition-all shadow-sm ${
                                        favorites.has(`${item.type === 'video' ? 'video' : 'file'}-${Number(item.id)}`) ? 'text-red-500' : 'text-slate-600 hover:text-red-500'
                                      }`}
                                      title={favorites.has(`${item.type === 'video' ? 'video' : 'file'}-${Number(item.id)}`) ? 'Remove from favorites' : 'Add to favorites'}
                                      disabled={togglingFavorite === item.id}
                                    >
                                      <svg className="w-4 h-4" fill={favorites.has(`${item.type === 'video' ? 'video' : 'file'}-${Number(item.id)}`) ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                      </svg>
                                    </button>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setItemToDelete({ id: item.id, type: item.type === 'video' ? 'video' : 'file', title: item.title });
                                        setShowDeleteModal(true);
                                      }}
                                      className="p-2 bg-white bg-opacity-80 hover:bg-opacity-100 rounded-full text-slate-600 hover:text-red-600 transition-all shadow-sm"
                                      title={`Delete ${item.type}`}
                                    >
                                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                      </svg>
                                    </button>
                                  </div>
                                </HoverableCard>
                              ))}
                            </div>
                            {totalCount > 5 && (
                              <div className="mt-4">
                                <button
                                  type="button"
                                  onClick={() => {
                                    const hasFull = (playlist.videos?.length ?? 0) > 0 || (playlist.files?.length ?? 0) > 0;
                                    if (hasFull) togglePlaylistExpanded(playlist.id);
                                    else fetchFullPlaylist(playlist.id);
                                  }}
                                  className="text-sm font-medium text-slate-600 hover:text-slate-800 underline"
                                >
                                  View all ({totalCount} items)
                                </button>
                              </div>
                            )}
                          </>
                            );
                          })()
                        ) : null}
                        {!playlist.preview_items?.length && !(playlist.videos?.length > 0) && !(playlist.files?.length > 0) && (
                          <p className="text-sm text-slate-500 italic">No videos or files in this playlist.</p>
                        )}
                      </>
                    ) : (
                      <>
                        {/* Playlist Videos - full list */}
                        {playlist.videos.length > 0 && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
                            {playlist.videos.map((video) => (
                              <HoverableCard
                                key={`playlist-${playlist.id}-video-${video.id}`}
                                className="group relative"
                              >
                                <div className="w-full">
                                  <VideoThumbnail
                                    thumbnail={video.thumbnail}
                                    alt={video.title}
                                    className="group-hover:scale-105 transition-transform duration-300"
                                  />
                                  <div className="p-4">
                                    <div className="flex items-start justify-between mb-1">
                                      <div className="flex-1 min-w-0">
                                        <h3 className="font-medium text-slate-800 mb-1 line-clamp-2">{video.title}</h3>
                                        <p className="text-xs text-slate-500 capitalize">{video.type}</p>
                                        {video.tags?.length > 0 && (
                                          <div className="flex flex-wrap gap-1 mt-2">
                                            {video.tags.slice(0, 3).map((t) => (
                                              <span key={t.id || t.tag} className="px-1.5 py-0.5 rounded text-xs bg-slate-100 text-slate-600">
                                                {t.tag || t}
                                              </span>
                                            ))}
                                            {video.tags.length > 3 && (
                                              <span className="text-xs text-slate-400">+{video.tags.length - 3}</span>
                                            )}
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                                <div
                                  className="absolute inset-0 z-10 bg-black bg-opacity-70 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-center gap-3 rounded-xl"
                                >
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        navigate(`/edit/inspiration/video/${video.id}`);
                                      }}
                                      className="w-40 min-h-10 text-xs px-3 py-2 bg-white text-slate-800 rounded-lg font-medium hover:bg-slate-100 transition-colors flex items-center justify-center gap-1.5"
                                      title="Edit"
                                    >
                                      <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                      </svg>
                                      Edit
                                    </button>
                                    <PrimaryButton
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        if (video.videoId) navigate(`/color-along?video=${video.videoId}`);
                                      }}
                                      className="w-40 min-h-10 justify-center"
                                      icon={<svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>}
                                    >
                                      Color Along
                                    </PrimaryButton>
                                    <button
                                      onClick={(e) => { e.stopPropagation(); handleRemoveVideoFromPlaylist(video.id, playlist.id, e); }}
                                      className="w-40 min-h-10 text-xs px-3 py-2 bg-white text-slate-800 rounded-lg font-medium hover:bg-slate-100 transition-colors flex items-center justify-center gap-1.5 whitespace-nowrap"
                                      title="Remove from playlist"
                                    >
                                      <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                      </svg>
                                    Remove from playlist
                                  </button>
                                </div>
                                <div className="absolute top-2 right-2 z-20 flex items-center gap-2">
                                  <button
                                    onClick={(e) => handleToggleFavorite({ id: video.id, type: 'video' }, e)}
                                    className={`p-2 bg-white bg-opacity-80 hover:bg-opacity-100 rounded-full transition-all shadow-sm ${
                                      favorites.has(`video-${Number(video.id)}`) ? 'text-red-500' : 'text-slate-600 hover:text-red-500'
                                    }`}
                                    title={favorites.has(`video-${Number(video.id)}`) ? 'Remove from favorites' : 'Add to favorites'}
                                    disabled={togglingFavorite === video.id}
                                  >
                                    <svg className="w-4 h-4" fill={favorites.has(`video-${Number(video.id)}`) ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                    </svg>
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setItemToDelete({ id: video.id, type: 'video', title: video.title });
                                      setShowDeleteModal(true);
                                    }}
                                    className="p-2 bg-white bg-opacity-80 hover:bg-opacity-100 rounded-full text-slate-600 hover:text-red-600 transition-all shadow-sm"
                                    title="Delete video"
                                  >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                  </button>
                                </div>
                              </HoverableCard>
                            ))}
                          </div>
                        )}
                        {/* Playlist Files - full list */}
                        {(playlist.files?.length ?? 0) > 0 && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 mt-6">
                            {playlist.files.map((file) => (
                              <HoverableCard
                                key={`playlist-${playlist.id}-file-${file.id}`}
                                className="group relative"
                              >
                                <div className="w-full">
                                  <div className="relative aspect-video bg-slate-100 overflow-hidden">
                                    <img
                                      src={file.thumbnail}
                                      alt={file.title}
                                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                      onError={(e) => {
                                        e.target.src = 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=400&h=300&fit=crop';
                                      }}
                                    />
                                    {file.type === 'pdf' && (
                                      <div className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded text-xs font-medium">
                                        PDF
                                      </div>
                                    )}
                                  </div>
                                  <div className="p-4">
                                    <div className="flex items-start justify-between mb-1">
                                      <div className="flex-1 min-w-0">
                                        <h3 className="font-medium text-slate-800 mb-1 line-clamp-2">{file.title}</h3>
                                        <p className="text-xs text-slate-500 capitalize">{file.type}</p>
                                        {file.tags?.length > 0 && (
                                          <div className="flex flex-wrap gap-1 mt-2">
                                            {file.tags.slice(0, 3).map((t) => (
                                              <span key={t.id || t.tag} className="px-1.5 py-0.5 rounded text-xs bg-slate-100 text-slate-600">
                                                {t.tag || t}
                                              </span>
                                            ))}
                                            {file.tags.length > 3 && (
                                              <span className="text-xs text-slate-400">+{file.tags.length - 3}</span>
                                            )}
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                                <div
                                  className="absolute inset-0 z-10 bg-black bg-opacity-70 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-center gap-3 rounded-xl"
                                >
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        navigate(`/edit/inspiration/file/${file.id}`);
                                      }}
                                      className="w-40 min-h-10 text-xs px-3 py-2 bg-white text-slate-800 rounded-lg font-medium hover:bg-slate-100 transition-colors flex items-center justify-center gap-1.5"
                                      title="Edit"
                                    >
                                      <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                      </svg>
                                      Edit
                                    </button>
                                    {file.type === 'image' && (
                                      <PrimaryButton
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          navigate(`/color-along?image=${file.id}`);
                                        }}
                                        className="w-40 min-h-10 justify-center"
                                        icon={<svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>}
                                      >
                                        Color Along
                                      </PrimaryButton>
                                    )}
                                    <button
                                      onClick={(e) => { e.stopPropagation(); handleRemoveFileFromPlaylist(file.id, playlist.id, e); }}
                                      className="w-40 min-h-10 text-xs px-3 py-2 bg-white text-slate-800 rounded-lg font-medium hover:bg-slate-100 transition-colors flex items-center justify-center gap-1.5 whitespace-nowrap"
                                      title="Remove from playlist"
                                    >
                                      <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                      </svg>
                                    Remove from playlist
                                  </button>
                                </div>
                                <div className="absolute top-2 right-2 z-20 flex items-center gap-2">
                                  <button
                                    onClick={(e) => handleToggleFavorite({ id: file.id, type: 'file' }, e)}
                                    className={`p-2 bg-white bg-opacity-80 hover:bg-opacity-100 rounded-full transition-all shadow-sm ${
                                      favorites.has(`file-${Number(file.id)}`) ? 'text-red-500' : 'text-slate-600 hover:text-red-500'
                                    }`}
                                    title={favorites.has(`file-${Number(file.id)}`) ? 'Remove from favorites' : 'Add to favorites'}
                                    disabled={togglingFavorite === file.id}
                                  >
                                    <svg className="w-4 h-4" fill={favorites.has(`file-${Number(file.id)}`) ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                    </svg>
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setItemToDelete({ id: file.id, type: 'file', title: file.title });
                                      setShowDeleteModal(true);
                                    }}
                                    className="p-2 bg-white bg-opacity-80 hover:bg-opacity-100 rounded-full text-slate-600 hover:text-red-600 transition-all shadow-sm"
                                    title="Delete file"
                                  >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                  </button>
                                </div>
                              </HoverableCard>
                            ))}
                          </div>
                        )}
                        {(playlist.videos?.length > 0 || (playlist.files?.length ?? 0) > 0) && (
                          <div className="mt-4">
                            <button
                              type="button"
                              onClick={() => togglePlaylistExpanded(playlist.id)}
                              className="text-sm font-medium text-slate-600 hover:text-slate-800 underline"
                            >
                              Show less
                            </button>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        )}
        {section !== 'playlists' && !loading && !error && (
          <>
            {gridItems.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-slate-500">No items found in this category.</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
                  {gridItems.map((item, index) => (
                    <HoverableCard
                      key={`inspiration-${item.type}-${item.id}-${index}`}
                      className="group relative"
                    >
                      <div className="w-full">
                        {item.type === 'video' ? (
                          <VideoThumbnail
                            thumbnail={item.thumbnail}
                            alt={item.title}
                            className="group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="relative aspect-video bg-slate-100 overflow-hidden">
                            <img
                              src={item.thumbnail}
                              alt={item.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              onError={(e) => {
                                e.target.src = 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=400&h=300&fit=crop';
                              }}
                            />
                            {item.type === 'pdf' && (
                              <div className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded text-xs font-medium">
                                PDF
                              </div>
                            )}
                          </div>
                        )}
                        <div className="p-4">
                          <div className="flex items-start justify-between mb-1">
                            <div className="flex-1 min-w-0">
                              <h3 className="font-medium text-slate-800 mb-1 line-clamp-2">{item.title}</h3>
                              <p className="text-xs text-slate-500 capitalize">{item.type}</p>
                              {item.tags?.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-2">
                                  {item.tags.slice(0, 3).map((t) => (
                                    <span key={t.id || t.tag} className="px-1.5 py-0.5 rounded text-xs bg-slate-100 text-slate-600">
                                      {t.tag || t}
                                    </span>
                                  ))}
                                  {item.tags.length > 3 && (
                                    <span className="text-xs text-slate-400">+{item.tags.length - 3}</span>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                      {/* Overlay: direct child of card so inset-0 covers full card (image + text) */}
                      <div
                        className="absolute inset-0 z-10 bg-black bg-opacity-70 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-center gap-3 rounded-xl"
                      >
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              const type = item.type === 'video' ? 'video' : 'file';
                              navigate(`/edit/inspiration/${type}/${item.id}`);
                            }}
                            className="w-40 min-h-10 text-xs px-3 py-2 bg-white text-slate-800 rounded-lg font-medium hover:bg-slate-100 transition-colors flex items-center justify-center gap-1.5"
                            title="Edit"
                          >
                            <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                            Edit
                          </button>
                          {(item.type === 'video' || item.type === 'image') && (
                            <PrimaryButton
                              onClick={(e) => {
                                e.stopPropagation();
                                if (item.type === 'video' && item.videoId) {
                                  navigate(`/color-along?video=${item.videoId}`);
                                } else if (item.type === 'image') {
                                  navigate(`/color-along?image=${item.id}`);
                                }
                              }}
                              className="w-40 min-h-10 justify-center"
                              icon={
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                  <path d="M8 5v14l11-7z" />
                                </svg>
                              }
                            >
                              Color Along
                            </PrimaryButton>
                          )}
                      </div>
                      <div className="absolute top-2 right-2 z-20 flex items-center gap-2">
                        <button
                          onClick={(e) => handleToggleFavorite(item, e)}
                          className={`p-2 bg-white bg-opacity-80 hover:bg-opacity-100 rounded-full transition-all shadow-sm ${
                            favorites.has(`${item.type === 'video' ? 'video' : 'file'}-${Number(item.id)}`) ? 'text-red-500' : 'text-slate-600 hover:text-red-500'
                          }`}
                          title={favorites.has(`${item.type === 'video' ? 'video' : 'file'}-${Number(item.id)}`) ? 'Remove from favorites' : 'Add to favorites'}
                          disabled={togglingFavorite === item.id}
                        >
                          <svg className="w-4 h-4" fill={favorites.has(`${item.type === 'video' ? 'video' : 'file'}-${Number(item.id)}`) ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                          </svg>
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setItemToDelete({ id: item.id, type: item.type === 'video' ? 'video' : 'file', title: item.title });
                            setShowDeleteModal(true);
                          }}
                          className="p-2 bg-white bg-opacity-80 hover:bg-opacity-100 rounded-full text-slate-600 hover:text-red-600 transition-all shadow-sm"
                          title={`Delete ${item.type}`}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    </HoverableCard>
                  ))}
                </div>
                {/* Infinite scroll trigger */}
                {section !== 'playlists' && (
                  <div ref={observerTarget} className="h-10 flex items-center justify-center">
                    {loadingMore && (
                      <div className="text-slate-500 py-4">Loading more...</div>
                    )}
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>
      <AddInspirationModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={() => {
          fetchInspirations(1, false);
          setIsAddModalOpen(false);
        }}
        defaultTab="video"
      />
      <AddPlaylistModal
        isOpen={isAddPlaylistModalOpen}
        onClose={() => setIsAddPlaylistModalOpen(false)}
        onSuccess={() => {
          fetchPlaylists();
          fetchInspirations(1, false);
          setIsAddPlaylistModalOpen(false);
        }}
      />
      <EditPlaylistModal
        isOpen={editPlaylistModalOpen}
        onClose={() => { setEditPlaylistModalOpen(false); setPlaylistToEdit(null); }}
        onSuccess={() => { fetchPlaylists(); setEditPlaylistModalOpen(false); setPlaylistToEdit(null); }}
        playlist={playlistToEdit}
      />
      <DeleteConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setItemToDelete(null);
        }}
        onConfirm={handleDelete}
        itemName={itemToDelete?.title || 'item'}
        itemType={itemToDelete?.type || 'item'}
      />
      <DeleteConfirmationModal
        isOpen={showPlaylistDeleteModal}
        onClose={() => { setShowPlaylistDeleteModal(false); setPlaylistToDelete(null); }}
        onConfirm={handleDeletePlaylist}
        itemName={playlistToDelete?.title || 'Playlist'}
        itemType="playlist"
        description="Videos in this playlist will not be deleted."
      />
    </div>
  );
};

export default Library;
