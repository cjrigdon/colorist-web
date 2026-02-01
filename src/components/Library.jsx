import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { inspirationAPI, playlistsAPI, videosAPI, filesAPI, userAPI } from '../services/api';
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
  const [filter, setFilter] = useState('all'); // all, videos, images, pdfs
  const [viewMode, setViewMode] = useState('all'); // 'all' for all videos, 'playlists' for grouped by playlist
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
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [favorites, setFavorites] = useState(new Set());
  const [togglingFavorite, setTogglingFavorite] = useState(null);

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
      };
    }
    return null;
  };

  // Fetch playlists with videos
  const fetchPlaylists = useCallback(async () => {
    try {
      setLoadingPlaylists(true);
      setError(null);

      const response = await playlistsAPI.getAll();
      
      // Handle response format - could be array or object with data
      const playlistsData = Array.isArray(response) ? response : (response.data || []);
      
      // Transform playlists and their videos
      const transformedPlaylists = playlistsData.map(playlist => {
        const playlistId = Number(playlist.id);
        return {
          id: !isNaN(playlistId) ? playlistId : playlist.id,
          title: playlist.title || 'Untitled Playlist',
          thumbnail: playlist.thumb || 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=400&h=300&fit=crop',
          videos: (playlist.videos || []).map(video => {
            const videoId = Number(video.id);
            return {
              id: !isNaN(videoId) ? videoId : video.id,
              type: 'video',
              title: video.title || 'Untitled Video',
              thumbnail: video.thumb || `https://img.youtube.com/vi/${video.embed_id}/hqdefault.jpg`,
              videoId: video.embed_id,
              embedId: video.embed_id,
            };
          })
        };
      });

      setPlaylists(transformedPlaylists);
    } catch (err) {
      setError(err.message || err.data?.message || 'Failed to load playlists');
      console.error('Error fetching playlists:', err);
      setPlaylists([]);
    } finally {
      setLoadingPlaylists(false);
    }
  }, []);

  // Fetch inspirations from API
  const fetchInspirations = useCallback(async (page = 1, append = false) => {
    try {
      if (append) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }
      setError(null);

      // Determine type filter based on current filter state
      const typeMap = {
        'videos': 'video',
        'images': 'image',
        'pdfs': 'pdf',
        'all': null
      };
      
      const response = await inspirationAPI.getAll(page, 40, {
        type: typeMap[filter],
        sort: 'title',
        sort_direction: 'asc'
      });
      
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
  }, [filter]);

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

  // Initial fetch and refetch when filter changes
  useEffect(() => {
    fetchInspirations(1, false);
    fetchFavorites();
  }, [fetchInspirations, fetchFavorites]);

  // Fetch playlists when filter is videos
  useEffect(() => {
    if (filter === 'videos') {
      fetchPlaylists();
    }
  }, [filter, fetchPlaylists]);

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
      if (filter === 'videos') {
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

  // Get all videos from playlists for "all videos" view
  const allVideosFromPlaylists = playlists.flatMap(playlist => playlist.videos);

  // Get videos to display based on view mode
  const getVideosToDisplay = () => {
    if (filter !== 'videos') {
      return limitedInspirations;
    }
    
    if (viewMode === 'all') {
      // Combine videos from playlists and standalone videos from inspirations
      const standaloneVideos = limitedInspirations.filter(item => item.type === 'video');
      const allVideos = [...standaloneVideos, ...allVideosFromPlaylists];
      // Remove duplicates based on video ID
      const uniqueVideos = Array.from(
        new Map(allVideos.map(video => [video.videoId || video.id, video])).values()
      );
      // Limit to 5 for free plan
      if (isFreePlan) {
        return uniqueVideos.slice(0, FREE_PLAN_LIMIT);
      }
      return uniqueVideos;
    } else {
      // Return empty array when in playlist view - we'll render playlists separately
      return [];
    }
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="px-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h3 className="text-xl font-semibold text-slate-800 font-venti">Inspo</h3>
            {/* View mode toggle for videos */}
            {filter === 'videos' && (
              <div className="flex items-center space-x-2">
                <span className="text-sm text-slate-600">View:</span>
                <button
                  onClick={() => setViewMode('playlists')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    viewMode === 'playlists'
                      ? ''
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                  style={viewMode === 'playlists' ? {
                    backgroundColor: '#c1fcf6',
                    color: '#49817b'
                  } : {}}
                >
                  By Playlists
                </button>
                <button
                  onClick={() => setViewMode('all')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    viewMode === 'all'
                      ? ''
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                  style={viewMode === 'all' ? {
                    backgroundColor: '#c1fcf6',
                    color: '#49817b'
                  } : {}}
                >
                  All Videos
                </button>
              </div>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === 'all'
                  ? ''
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
              style={filter === 'all' ? {
                backgroundColor: '#c1fcf6',
                color: '#49817b'
              } : {}}
            >
              All
            </button>
            <button
              onClick={() => {
                setFilter('videos');
                setViewMode('playlists'); // Default to playlist view when selecting videos
              }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === 'videos'
                  ? ''
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
              style={filter === 'videos' ? {
                backgroundColor: '#c1fcf6',
                color: '#49817b'
              } : {}}
            >
              Videos
            </button>
            <button
              onClick={() => setFilter('images')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === 'images'
                  ? ''
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
              style={filter === 'images' ? {
                backgroundColor: '#c1fcf6',
                color: '#49817b'
              } : {}}
            >
              Images
            </button>
            <button
              onClick={() => setFilter('pdfs')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === 'pdfs'
                  ? ''
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
              style={filter === 'pdfs' ? {
                backgroundColor: '#c1fcf6',
                color: '#49817b'
              } : {}}
            >
              PDFs
            </button>
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
              Add New
            </PrimaryButton>
          </div>
        </div>
      </div>

      {/* Grid Section */}
      <div className="bg-white p-6">
        {hasReachedLimit && (
          <UpgradeBanner itemType="inspirations" />
        )}
        {loading && inspirations.length === 0 && !loadingPlaylists && (
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
        {error && inspirations.length === 0 && playlists.length === 0 && !loading && (
          <ErrorState error={error} />
        )}
        {filter === 'videos' && viewMode === 'playlists' && !loading && !error && (
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
              <div className="text-center py-12">
                <p className="text-slate-500">No playlists found.</p>
              </div>
            ) : (
              <div className="space-y-8">
                {playlists.map((playlist) => (
                  <div key={playlist.id} className="space-y-4">
                    {/* Playlist Header */}
                    <div className="flex items-center gap-4 pb-2 border-b border-slate-200">
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
                        <p className="text-sm text-slate-500">{playlist.videos.length} {playlist.videos.length === 1 ? 'video' : 'videos'}</p>
                      </div>
                    </div>
                    {/* Playlist Videos */}
                    {playlist.videos.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {playlist.videos.map((video) => (
                          <HoverableCard
                            key={`playlist-${playlist.id}-video-${video.id}`}
                            className="group relative"
                          >
                            <VideoThumbnail
                              thumbnail={video.thumbnail}
                              alt={video.title}
                              className="group-hover:scale-105 transition-transform duration-300"
                            />
                      {/* Favorite and Delete Buttons - Top Right */}
                      <div className="absolute top-2 right-2 z-10 flex items-center gap-2">
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
                      {/* Hover Overlay with Buttons */}
                      <div className="absolute inset-0 bg-black bg-opacity-70 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-center gap-3">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/edit/inspiration/video/${video.id}`);
                          }}
                          className="w-40 px-4 py-2 bg-white text-slate-800 rounded-lg font-medium hover:bg-slate-100 transition-colors flex items-center justify-center gap-2"
                          title="Edit"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                          Edit
                        </button>
                              <PrimaryButton
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (video.videoId) {
                                    navigate(`/color-along?video=${video.videoId}`);
                                  }
                                }}
                                className="w-40"
                                icon={
                                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M8 5v14l11-7z" />
                                  </svg>
                                }
                              >
                                Color Along
                              </PrimaryButton>
                            </div>
                            <div className="p-4">
                              <div className="flex items-start justify-between mb-1">
                                <div className="flex-1 min-w-0">
                                  <h3 className="font-medium text-slate-800 mb-1 line-clamp-2">{video.title}</h3>
                                  <p className="text-xs text-slate-500 capitalize">{video.type}</p>
                                </div>
                              </div>
                            </div>
                          </HoverableCard>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-slate-500 italic">No videos in this playlist.</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        )}
        {!(filter === 'videos' && viewMode === 'playlists') && !loading && !error && (
          <>
            {limitedInspirations.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-slate-500">No items found in this category.</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {limitedInspirations.map((item, index) => (
                    <HoverableCard
                      key={`inspiration-${item.type}-${item.id}-${index}`}
                      className="group relative"
                    >
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
                      {/* Favorite and Delete Buttons - Top Right */}
                      <div className="absolute top-2 right-2 z-10 flex items-center gap-2">
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
                          <PrimaryButton
                            onClick={(e) => {
                              e.stopPropagation();
                              if (item.type === 'video' && item.videoId) {
                                navigate(`/color-along?video=${item.videoId}`);
                              } else if (item.type === 'image') {
                                navigate(`/color-along?image=${item.id}`);
                              }
                            }}
                            className="w-40"
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
                      <div className="p-4">
                        <div className="flex items-start justify-between mb-1">
                          <div className="flex-1 min-w-0">
                            <h3 className="font-medium text-slate-800 mb-1 line-clamp-2">{item.title}</h3>
                            <p className="text-xs text-slate-500 capitalize">{item.type}</p>
                          </div>
                        </div>
                      </div>
                    </HoverableCard>
                  ))}
                </div>
                {/* Infinite scroll trigger */}
                {!(filter === 'videos' && viewMode === 'playlists') && (
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
    </div>
  );
};

export default Library;
