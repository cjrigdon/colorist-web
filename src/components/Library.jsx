import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { inspirationAPI } from '../services/api';
import AddInspirationModal from './AddInspirationModal';

const Library = () => {
  const navigate = useNavigate();
  const [filter, setFilter] = useState('all'); // all, videos, images, pdfs
  const [inspirations, setInspirations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const observerTarget = useRef(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

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

  // Filter inspirations based on selected filter
  const filteredInspirations = filter === 'all' 
    ? inspirations 
    : inspirations.filter(item => {
        if (filter === 'videos') return item.type === 'video';
        if (filter === 'images') return item.type === 'image';
        if (filter === 'pdfs') return item.type === 'pdf';
        return true;
      });

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="px-4">
        <div className="flex items-center justify-end space-x-2">
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
              onClick={() => setFilter('videos')}
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
            <button 
              onClick={() => setIsAddModalOpen(true)}
              className="px-4 py-2 text-white rounded-lg text-sm font-medium transition-colors flex items-center space-x-2"
              style={{
                backgroundColor: '#ea3663'
              }}
              onMouseEnter={(e) => e.target.style.backgroundColor = '#d12a4f'}
              onMouseLeave={(e) => e.target.style.backgroundColor = '#ea3663'}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span>Add New</span>
            </button>
        </div>
      </div>

      {/* Grid Section */}
      <div className="bg-white p-6">
        {loading && inspirations.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-slate-500">Loading inspirations...</div>
          </div>
        ) : error && inspirations.length === 0 ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        ) : filteredInspirations.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-slate-500">No items found in this category.</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredInspirations.map((item) => (
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
                      onError={(e) => {
                        e.target.src = 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=400&h=300&fit=crop';
                      }}
                    />
                    {item.type === 'video' && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30">
                        <div className="w-12 h-12 rounded-full bg-white bg-opacity-90 flex items-center justify-center">
                          <svg className="w-6 h-6 ml-1" fill="currentColor" viewBox="0 0 24 24" style={{ color: '#49817b' }}>
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
                  <div className="p-4">
                    <div className="flex items-start justify-between mb-1">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-slate-800 mb-1 line-clamp-2">{item.title}</h3>
                        <p className="text-xs text-slate-500 capitalize">{item.type}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Infinite scroll trigger */}
            <div ref={observerTarget} className="h-10 flex items-center justify-center">
              {loadingMore && (
                <div className="text-slate-500 py-4">Loading more...</div>
              )}
            </div>
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
