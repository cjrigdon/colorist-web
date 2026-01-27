import React, { useState, useRef, useEffect } from 'react';
import { inspirationAPI } from '../services/api';

const InspirationDropdown = ({ 
  value, 
  onChange, 
  placeholder = 'Select inspiration...',
  label,
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [inspirations, setInspirations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef(null);
  const searchInputRef = useRef(null);

  // Load inspirations when dropdown opens
  useEffect(() => {
    if (isOpen && inspirations.length === 0 && !loading) {
      loadInspirations();
    }
  }, [isOpen]);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  const loadInspirations = async () => {
    try {
      setLoading(true);
      const response = await inspirationAPI.getAll(1, 1000);
      
      let inspirationsData = [];
      if (Array.isArray(response)) {
        inspirationsData = response;
      } else if (response.data && Array.isArray(response.data)) {
        inspirationsData = response.data;
      }
      
      // Transform inspirations to match the format we need
      const transformedInspirations = inspirationsData.map(item => {
        if (item.type === 'video') {
          return {
            id: item.id,
            type: 'video',
            title: item.title || 'Untitled Video',
            thumbnail: item.thumb || `https://img.youtube.com/vi/${item.embed_id}/hqdefault.jpg`,
            embedId: item.embed_id,
          };
        } else if (item.type === 'file') {
          const isPdf = item.mime_type?.includes('pdf');
          const isImage = item.mime_type?.startsWith('image/');
          
          return {
            id: item.id,
            type: isPdf ? 'pdf' : (isImage ? 'image' : 'file'),
            title: item.title || 'Untitled File',
            thumbnail: getFileImageUrl(item.thumbnail_path || item.path),
            path: item.path,
          };
        }
        return null;
      }).filter(Boolean);
      
      setInspirations(transformedInspirations);
    } catch (error) {
      console.error('Error loading inspirations:', error);
      setInspirations([]);
    } finally {
      setLoading(false);
    }
  };

  const getFileImageUrl = (path) => {
    if (!path) {
      return 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=400&h=300&fit=crop';
    }
    
    // If it's a full URL, use it as-is
    if (path.startsWith('http://') || path.startsWith('https://')) {
      return path;
    }
    
    // If it's a local storage path, construct the full URL
    if (path.startsWith('app/public/')) {
      const filePath = path.replace('app/public/', '');
      const apiBaseUrl = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000/api';
      const baseUrl = apiBaseUrl.replace('/api', '');
      return `${baseUrl}/storage/${filePath}`;
    }
    
    // Try using it as-is (might be a relative path that works)
    return path;
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
        setSearchQuery('');
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const selectedInspiration = inspirations.find(insp => insp.id.toString() === value);

  const handleSelect = (inspiration) => {
    onChange(inspiration.id.toString());
    setIsOpen(false);
    setSearchQuery('');
  };

  // Filter inspirations based on search query
  const filteredInspirations = inspirations.filter(inspiration => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    const title = (inspiration.title || '').toLowerCase();
    return title.includes(query);
  });

  const getTypeIcon = (type) => {
    if (type === 'video') {
      return (
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
        </svg>
      );
    } else if (type === 'image') {
      return (
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
        </svg>
      );
    } else if (type === 'pdf') {
      return (
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
        </svg>
      );
    }
    return null;
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {label && (
        <label className="block text-sm font-medium text-slate-700 mb-2">{label}</label>
      )}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-800 text-sm font-medium cursor-pointer transition-all duration-200 hover:bg-slate-100 hover:border-slate-300 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-offset-0 focus:border-transparent flex items-center justify-between group"
        style={{ 
          focusRingColor: '#ea3663'
        }}
      >
        <span className={selectedInspiration ? 'text-slate-800 font-medium' : 'text-slate-500'}>
          {selectedInspiration 
            ? `${selectedInspiration.type === 'video' ? '📺' : selectedInspiration.type === 'image' ? '🖼️' : '📄'} ${selectedInspiration.title || `Inspiration ${selectedInspiration.id}`}`
            : placeholder}
        </span>
        <svg 
          className={`w-4 h-4 text-slate-500 group-hover:text-slate-700 transition-all duration-200 ${isOpen ? 'rotate-180' : ''}`}
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute z-50 w-full mt-2 bg-slate-50 rounded-xl shadow-xl border border-slate-200 overflow-hidden">
          {/* Search Input */}
          <div className="p-3 border-b border-slate-200">
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search inspirations..."
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-offset-0"
              style={{ focusRingColor: '#ea3663' }}
            />
          </div>

          {/* Inspirations List */}
          <div className="max-h-80 overflow-y-auto">
            {loading ? (
              <div className="px-4 py-8 text-center">
                <p className="text-sm text-slate-500">Loading inspirations...</p>
              </div>
            ) : filteredInspirations.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <p className="text-sm text-slate-500">
                  {searchQuery ? 'No inspirations found matching your search' : 'No inspirations available'}
                </p>
              </div>
            ) : (
              filteredInspirations.map((inspiration) => (
                <button
                  key={inspiration.id}
                  type="button"
                  onClick={() => handleSelect(inspiration)}
                  className={`w-full text-left px-4 py-3 transition-colors flex items-center space-x-3 ${
                    value === inspiration.id.toString()
                      ? 'bg-slate-100 text-slate-900 font-medium'
                      : 'text-slate-700 hover:bg-white hover:text-slate-900'
                  }`}
                >
                  {/* Thumbnail */}
                  <div className="relative w-16 h-12 flex-shrink-0 rounded border border-slate-200 overflow-hidden bg-slate-100">
                    <img
                      src={inspiration.thumbnail}
                      alt={inspiration.title || 'Inspiration thumbnail'}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.src = 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=400&h=300&fit=crop';
                      }}
                    />
                    {/* Type indicator overlay */}
                    <div className="absolute top-1 right-1 bg-black bg-opacity-60 rounded p-0.5 text-white">
                      {getTypeIcon(inspiration.type)}
                    </div>
                  </div>
                  {/* Inspiration Info */}
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate flex items-center space-x-2">
                      <span>
                        {inspiration.type === 'video' ? '📺' : inspiration.type === 'image' ? '🖼️' : '📄'}
                      </span>
                      <span className="truncate">
                        {inspiration.title || `Inspiration ${inspiration.id}`}
                      </span>
                    </div>
                    <div className="text-xs text-slate-500 capitalize">
                      {inspiration.type}
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default InspirationDropdown;

