import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const Library = () => {
  const navigate = useNavigate();
  const [filter, setFilter] = useState('all'); // all, videos, images, pdfs

  const inspirations = [
    { id: 1, type: 'video', title: 'Watercolor Pencil Techniques', thumbnail: 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=400&h=300&fit=crop', duration: '12:34', videoId: 'dQw4w9WgXcQ' },
    { id: 2, type: 'image', title: 'Nature Color Palette', thumbnail: 'https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=400&h=300&fit=crop' },
    { id: 3, type: 'pdf', title: 'Advanced Coloring Guide', thumbnail: 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=400&h=300&fit=crop' },
    { id: 4, type: 'video', title: 'Blending Techniques', thumbnail: 'https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?w=400&h=300&fit=crop', duration: '8:21', videoId: 'jNQXAC9IVRw' },
    { id: 5, type: 'image', title: 'Sunset Inspiration', thumbnail: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=300&fit=crop' },
    { id: 6, type: 'pdf', title: 'Color Theory Basics', thumbnail: 'https://images.unsplash.com/photo-1557683316-973673baf926?w=400&h=300&fit=crop' },
  ];

  const filteredInspirations = filter === 'all' 
    ? inspirations 
    : inspirations.filter(item => item.type === filter);

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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredInspirations.map((item) => (
          <div
            key={item.id}
            className="bg-slate-50 rounded-xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-all cursor-pointer group"
            onMouseEnter={(e) => e.currentTarget.style.borderColor = '#ea3663'}
            onMouseLeave={(e) => e.currentTarget.style.borderColor = '#e2e8f0'}
            onClick={() => {
              if (item.type === 'video' && item.videoId) {
                navigate('/dashboard/color-along', { 
                  state: { 
                    video: { id: item.videoId, title: item.title }
                  } 
                });
              }
            }}
          >
            <div className="relative aspect-video bg-slate-100 overflow-hidden">
              <img
                src={item.thumbnail}
                alt={item.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
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
              {item.duration && (
                <div className="absolute bottom-2 right-2 bg-black bg-opacity-70 text-white px-2 py-1 rounded text-xs">
                  {item.duration}
                </div>
              )}
            </div>
            <div className="p-4">
              <h3 className="font-medium text-slate-800 mb-1 line-clamp-2">{item.title}</h3>
              <p className="text-xs text-slate-500 capitalize">{item.type}</p>
            </div>
          </div>
        ))}
        </div>

        {filteredInspirations.length === 0 && (
          <div className="text-center py-12">
            <p className="text-slate-500">No items found in this category.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Library;

