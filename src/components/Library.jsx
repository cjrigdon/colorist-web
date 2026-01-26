import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { inspirationAPI, playlistsAPI } from '../services/api';
import AddInspirationModal from './AddInspirationModal';
import PrimaryButton from './PrimaryButton';
import HoverableCard from './HoverableCard';
import LoadingState from './LoadingState';
import ErrorState from './ErrorState';
import VideoThumbnail from './VideoThumbnail';
import UpgradeBanner from './UpgradeBanner';

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
    if (item.type === 'video') {
      return {
        id: item.id,
        type: 'video',
        title: item.title || 'Untitled Video',
        thumbnail: item.thumb || 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=400&h=300&fit=crop',
        videoId: item.embed_id,
        embedId: item.embed_id,
      };
    } else if (item.type === 'file') {
      // Determine file type from mime_type
      const isPdf = item.mime_type?.includes('pdf');
      const isImage = item.mime_type?.startsWith('image/');
      
      return {
        id: item.id,
        type: isPdf ? 'pdf' : (isImage ? 'image' : 'file'),
        title: item.title || 'Untitled File',
        thumbnail: item.thumbnail_path || item.path || 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=400&h=300&fit=crop',
        path: item.path,
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
      const transformedPlaylists = playlistsData.map(playlist => ({
        id: playlist.id,
        title: playlist.title || 'Untitled Playlist',
        thumbnail: playlist.thumb || 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=400&h=300&fit=crop',
        videos: (playlist.videos || []).map(video => ({
          id: video.id,
          type: 'video',
          title: video.title || 'Untitled Video',
          thumbnail: video.thumb || `https://img.youtube.com/vi/${video.embed_id}/hqdefault.jpg`,
          videoId: video.embed_id,
          embedId: video.embed_id,
        }))
      }));

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

      const response = await inspirationAPI.getAll(page, 40);
      
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
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchInspirations(1, false);
  }, [fetchInspirations]);

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

  // Filter inspirations based on selected filter
  const filteredInspirations = filter === 'all' 
    ? inspirations 
    : inspirations.filter(item => {
        if (filter === 'videos') return item.type === 'video';
        if (filter === 'images') return item.type === 'image';
        if (filter === 'pdfs') return item.type === 'pdf';
        return true;
      });

  // Limit items for free plan users
  const limitedInspirations = useMemo(() => {
    if (isFreePlan) {
      return filteredInspirations.slice(0, FREE_PLAN_LIMIT);
    }
    return filteredInspirations;
  }, [filteredInspirations, isFreePlan]);

  const hasReachedLimit = isFreePlan && inspirations.length >= FREE_PLAN_LIMIT;

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
                            key={video.id}
                            className="group relative"
                          >
                            <VideoThumbnail
                              thumbnail={video.thumbnail}
                              alt={video.title}
                              className="group-hover:scale-105 transition-transform duration-300"
                            />
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
                  {limitedInspirations.map((item) => (
                    <HoverableCard
                      key={item.id}
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
    </div>
  );
};

export default Library;
