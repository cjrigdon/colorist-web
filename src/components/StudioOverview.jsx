import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const StudioOverview = () => {
  const navigate = useNavigate();
  const [inspirationIndex, setInspirationIndex] = useState(0);
  const [pencilSetIndex, setPencilSetIndex] = useState(0);
  const [comboIndex, setComboIndex] = useState(0);
  const [paletteIndex, setPaletteIndex] = useState(0);
  const [bookIndex, setBookIndex] = useState(0);

  // Mock data - first 5 items from each category
  const inspirations = [
    { id: 1, type: 'video', title: 'Watercolor Pencil Techniques', thumbnail: 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=400&h=300&fit=crop', duration: '12:34', videoId: 'dQw4w9WgXcQ' },
    { id: 2, type: 'image', title: 'Nature Color Palette', thumbnail: 'https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=400&h=300&fit=crop' },
    { id: 3, type: 'pdf', title: 'Advanced Coloring Guide', thumbnail: 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=400&h=300&fit=crop' },
    { id: 4, type: 'video', title: 'Blending Techniques', thumbnail: 'https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?w=400&h=300&fit=crop', duration: '8:21', videoId: 'jNQXAC9IVRw' },
    { id: 5, type: 'image', title: 'Sunset Inspiration', thumbnail: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=300&fit=crop' },
    { id: 6, type: 'pdf', title: 'Color Theory Basics', thumbnail: 'https://images.unsplash.com/photo-1557683316-973673baf926?w=400&h=300&fit=crop' },
    { id: 7, type: 'video', title: 'Shading Masterclass', thumbnail: 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=400&h=300&fit=crop', duration: '15:42', videoId: 'dQw4w9WgXcQ' },
  ];

  const pencilSets = [
    { id: 1, name: 'Prismacolor Premier', brand: 'Prismacolor', count: 150 },
    { id: 2, name: 'Faber-Castell Polychromos', brand: 'Faber-Castell', count: 120 },
    { id: 3, name: 'Derwent Coloursoft', brand: 'Derwent', count: 72 },
    { id: 4, name: 'Caran d\'Ache Luminance', brand: 'Caran d\'Ache', count: 76 },
    { id: 5, name: 'Staedtler Ergosoft', brand: 'Staedtler', count: 60 },
    { id: 6, name: 'Cretacolor Aqua Monolith', brand: 'Cretacolor', count: 72 },
    { id: 7, name: 'Holbein Artists', brand: 'Holbein', count: 150 },
  ];

  const combos = [
    { id: 1, name: 'Sunset Vibes', colors: ['#FF6B6B', '#FFE66D', '#FF8B94'], usageCount: 12 },
    { id: 2, name: 'Ocean Blues', colors: ['#4ECDC4', '#45B7D1', '#96CEB4'], usageCount: 8 },
    { id: 3, name: 'Forest Greens', colors: ['#95E1D3', '#AAE3E2', '#D9F7BE'], usageCount: 15 },
    { id: 4, name: 'Warm Earth', colors: ['#D4A574', '#C19A6B', '#8B7355'], usageCount: 6 },
    { id: 5, name: 'Purple Dreams', colors: ['#B19CD9', '#C8A2C8', '#DDA0DD'], usageCount: 9 },
    { id: 6, name: 'Coral Reef', colors: ['#FF7F50', '#FF6347', '#FFA07A'], usageCount: 11 },
    { id: 7, name: 'Mint Fresh', colors: ['#98FB98', '#90EE90', '#ADFF2F'], usageCount: 7 },
  ];

  const palettes = [
    { id: 1, name: 'Spring Garden', colors: ['#FFB6C1', '#98FB98', '#F0E68C', '#DDA0DD', '#FFA07A'], usageCount: 10 },
    { id: 2, name: 'Autumn Leaves', colors: ['#FF8C00', '#FF6347', '#CD853F', '#D2691E', '#B22222'], usageCount: 7 },
    { id: 3, name: 'Winter Frost', colors: ['#E0E0E0', '#B0C4DE', '#87CEEB', '#AFEEEE', '#F0F8FF'], usageCount: 5 },
    { id: 4, name: 'Tropical Paradise', colors: ['#FF1493', '#00CED1', '#32CD32', '#FFD700', '#FF4500'], usageCount: 11 },
    { id: 5, name: 'Pastel Dreams', colors: ['#FFB6C1', '#FFE4E1', '#E6E6FA', '#F0E68C', '#98FB98'], usageCount: 8 },
    { id: 6, name: 'Midnight Sky', colors: ['#191970', '#000080', '#4169E1', '#1E90FF', '#87CEEB'], usageCount: 9 },
    { id: 7, name: 'Cherry Blossom', colors: ['#FFB6C1', '#FFC0CB', '#FFE4E1', '#FFF0F5', '#FF69B4'], usageCount: 6 },
  ];

  const books = [
    { id: 1, title: 'Floral Dreams Coloring Book', author: 'Jane Smith', pages: 50, progress: 45, cover: 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=400&h=300&fit=crop' },
    { id: 2, title: 'Nature Scenes', author: 'John Doe', pages: 80, progress: 30, cover: 'https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=400&h=300&fit=crop' },
    { id: 3, title: 'Mandala Patterns', author: 'Sarah Johnson', pages: 60, progress: 75, cover: 'https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?w=400&h=300&fit=crop' },
    { id: 4, title: 'Animal Kingdom', author: 'Mike Wilson', pages: 100, progress: 20, cover: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=300&fit=crop' },
    { id: 5, title: 'Abstract Art', author: 'Emily Brown', pages: 40, progress: 90, cover: 'https://images.unsplash.com/photo-1557683316-973673baf926?w=400&h=300&fit=crop' },
    { id: 6, title: 'Zen Garden', author: 'Lisa Anderson', pages: 45, progress: 60, cover: 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=400&h=300&fit=crop' },
    { id: 7, title: 'City Skylines', author: 'Robert Taylor', pages: 70, progress: 25, cover: 'https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=400&h=300&fit=crop' },
  ];

  // Helper function to get visible items for carousel
  const getVisibleItems = (items, currentIndex) => {
    return items.slice(currentIndex, currentIndex + 5);
  };

  // Helper function to check if carousel is needed
  const needsCarousel = (items) => items.length > 5;

  // Helper function to navigate carousel
  const navigateCarousel = (direction, currentIndex, totalItems, setIndex) => {
    const maxIndex = Math.max(0, totalItems - 5);
    if (direction === 'next') {
      setIndex(Math.min(currentIndex + 1, maxIndex));
    } else {
      setIndex(Math.max(currentIndex - 1, 0));
    }
  };

  return (
    <div className="space-y-6">
      {/* Inspiration Section */}
      <div className="bg-slate-50 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold text-slate-800 font-venti">Inspiration</h3>
          <div className="flex items-center space-x-4">
            {needsCarousel(inspirations) && (
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => navigateCarousel('prev', inspirationIndex, inspirations.length, setInspirationIndex)}
                  disabled={inspirationIndex === 0}
                  className="p-1.5 rounded-lg hover:bg-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <svg className="w-4 h-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <button
                  onClick={() => navigateCarousel('next', inspirationIndex, inspirations.length, setInspirationIndex)}
                  disabled={inspirationIndex >= inspirations.length - 5}
                  className="p-1.5 rounded-lg hover:bg-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <svg className="w-4 h-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            )}
            <button
              onClick={() => navigate('/dashboard', { state: { activeTab: 'studio', activeSection: 'library' } })}
              className="text-sm text-slate-600 hover:text-slate-800 transition-colors"
            >
              View All →
            </button>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {getVisibleItems(inspirations, inspirationIndex).map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-all cursor-pointer group"
              onMouseEnter={(e) => e.currentTarget.style.borderColor = '#ea3663'}
              onMouseLeave={(e) => e.currentTarget.style.borderColor = '#e2e8f0'}
              onClick={() => {
                if (item.type === 'video' && item.videoId) {
                  navigate('/dashboard', { 
                    state: { 
                      video: { id: item.videoId, title: item.title },
                      activeTab: 'coloralong'
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
              </div>
              <div className="p-3">
                <h4 className="font-medium text-slate-800 mb-1 line-clamp-2 text-sm">{item.title}</h4>
                <p className="text-xs text-slate-500 capitalize">{item.type}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Pencil Sets Section */}
      <div className="bg-slate-50 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold text-slate-800 font-venti">Pencil Sets</h3>
          <div className="flex items-center space-x-4">
            {needsCarousel(pencilSets) && (
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => navigateCarousel('prev', pencilSetIndex, pencilSets.length, setPencilSetIndex)}
                  disabled={pencilSetIndex === 0}
                  className="p-1.5 rounded-lg hover:bg-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <svg className="w-4 h-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <button
                  onClick={() => navigateCarousel('next', pencilSetIndex, pencilSets.length, setPencilSetIndex)}
                  disabled={pencilSetIndex >= pencilSets.length - 5}
                  className="p-1.5 rounded-lg hover:bg-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <svg className="w-4 h-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            )}
            <button
              onClick={() => navigate('/dashboard', { state: { activeTab: 'studio', activeSection: 'pencils' } })}
              className="text-sm text-slate-600 hover:text-slate-800 transition-colors"
            >
              View All →
            </button>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {getVisibleItems(pencilSets, pencilSetIndex).map((set) => (
            <div
              key={set.id}
              className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 hover:shadow-md transition-all cursor-pointer"
              onMouseEnter={(e) => e.currentTarget.style.borderColor = '#ea3663'}
              onMouseLeave={(e) => e.currentTarget.style.borderColor = '#e2e8f0'}
              onClick={() => navigate('/dashboard', { state: { activeTab: 'studio', activeSection: 'pencils' } })}
            >
              <div className="text-3xl mb-2">✏️</div>
              <h4 className="font-semibold text-slate-800 mb-1 text-sm">{set.name}</h4>
              <p className="text-xs text-slate-500 mb-2">{set.brand}</p>
              <p className="text-xs text-slate-600">{set.count} colors</p>
            </div>
          ))}
        </div>
      </div>

      {/* Color Combos Section */}
      <div className="bg-slate-50 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold text-slate-800 font-venti">Color Combos</h3>
          <div className="flex items-center space-x-4">
            {needsCarousel(combos) && (
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => navigateCarousel('prev', comboIndex, combos.length, setComboIndex)}
                  disabled={comboIndex === 0}
                  className="p-1.5 rounded-lg hover:bg-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <svg className="w-4 h-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <button
                  onClick={() => navigateCarousel('next', comboIndex, combos.length, setComboIndex)}
                  disabled={comboIndex >= combos.length - 5}
                  className="p-1.5 rounded-lg hover:bg-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <svg className="w-4 h-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            )}
            <button
              onClick={() => navigate('/dashboard', { state: { activeTab: 'studio', activeSection: 'combos' } })}
              className="text-sm text-slate-600 hover:text-slate-800 transition-colors"
            >
              View All →
            </button>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {getVisibleItems(combos, comboIndex).map((combo) => (
            <div
              key={combo.id}
              className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 hover:shadow-md transition-all cursor-pointer"
              onMouseEnter={(e) => e.currentTarget.style.borderColor = '#ea3663'}
              onMouseLeave={(e) => e.currentTarget.style.borderColor = '#e2e8f0'}
              onClick={() => navigate('/dashboard', { state: { activeTab: 'studio', activeSection: 'combos' } })}
            >
              <div className="flex space-x-1 mb-3">
                {combo.colors.map((color, index) => (
                  <div
                    key={index}
                    className="flex-1 h-12 rounded-lg border border-slate-200"
                    style={{ backgroundColor: color }}
                  ></div>
                ))}
              </div>
              <h4 className="font-semibold text-slate-800 mb-1 text-sm">{combo.name}</h4>
              <p className="text-xs text-slate-500">Used {combo.usageCount} times</p>
            </div>
          ))}
        </div>
      </div>

      {/* Color Palettes Section */}
      <div className="bg-slate-50 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold text-slate-800 font-venti">Color Palettes</h3>
          <div className="flex items-center space-x-4">
            {needsCarousel(palettes) && (
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => navigateCarousel('prev', paletteIndex, palettes.length, setPaletteIndex)}
                  disabled={paletteIndex === 0}
                  className="p-1.5 rounded-lg hover:bg-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <svg className="w-4 h-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <button
                  onClick={() => navigateCarousel('next', paletteIndex, palettes.length, setPaletteIndex)}
                  disabled={paletteIndex >= palettes.length - 5}
                  className="p-1.5 rounded-lg hover:bg-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <svg className="w-4 h-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            )}
            <button
              onClick={() => navigate('/dashboard', { state: { activeTab: 'studio', activeSection: 'palettes' } })}
              className="text-sm text-slate-600 hover:text-slate-800 transition-colors"
            >
              View All →
            </button>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {getVisibleItems(palettes, paletteIndex).map((palette) => (
            <div
              key={palette.id}
              className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 hover:shadow-md transition-all cursor-pointer"
              onMouseEnter={(e) => e.currentTarget.style.borderColor = '#ea3663'}
              onMouseLeave={(e) => e.currentTarget.style.borderColor = '#e2e8f0'}
              onClick={() => navigate('/dashboard', { state: { activeTab: 'studio', activeSection: 'palettes' } })}
            >
              <div className="grid grid-cols-5 gap-1 mb-3">
                {palette.colors.map((color, index) => (
                  <div
                    key={index}
                    className="h-10 rounded border border-slate-200"
                    style={{ backgroundColor: color }}
                  ></div>
                ))}
              </div>
              <h4 className="font-semibold text-slate-800 mb-1 text-sm">{palette.name}</h4>
              <p className="text-xs text-slate-500">Used {palette.usageCount} times</p>
            </div>
          ))}
        </div>
      </div>

      {/* Coloring Books Section */}
      <div className="bg-slate-50 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold text-slate-800 font-venti">Coloring Books</h3>
          <div className="flex items-center space-x-4">
            {needsCarousel(books) && (
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => navigateCarousel('prev', bookIndex, books.length, setBookIndex)}
                  disabled={bookIndex === 0}
                  className="p-1.5 rounded-lg hover:bg-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <svg className="w-4 h-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <button
                  onClick={() => navigateCarousel('next', bookIndex, books.length, setBookIndex)}
                  disabled={bookIndex >= books.length - 5}
                  className="p-1.5 rounded-lg hover:bg-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <svg className="w-4 h-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            )}
            <button
              onClick={() => navigate('/dashboard', { state: { activeTab: 'studio', activeSection: 'books' } })}
              className="text-sm text-slate-600 hover:text-slate-800 transition-colors"
            >
              View All →
            </button>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {getVisibleItems(books, bookIndex).map((book) => (
            <div
              key={book.id}
              className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-all cursor-pointer group"
              onMouseEnter={(e) => e.currentTarget.style.borderColor = '#ea3663'}
              onMouseLeave={(e) => e.currentTarget.style.borderColor = '#e2e8f0'}
              onClick={() => navigate('/dashboard', { state: { activeTab: 'studio', activeSection: 'books' } })}
            >
              <div className="relative aspect-[3/4] bg-slate-100 overflow-hidden">
                <img
                  src={book.cover}
                  alt={book.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>
              <div className="p-3">
                <h4 className="font-semibold text-slate-800 mb-1 line-clamp-2 text-sm">{book.title}</h4>
                <p className="text-xs text-slate-500 mb-2">{book.author}</p>
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
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default StudioOverview;

