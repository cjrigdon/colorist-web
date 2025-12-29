import React, { useState } from 'react';

const ColorPalettes = () => {
  const [palettes] = useState([
    {
      id: 1,
      name: 'Spring Pastels',
      description: 'Soft, light colors perfect for spring themes',
      colors: ['#FFB6C1', '#FFE4E1', '#E0E6FF', '#F0E68C', '#DDA0DD'],
      usageCount: 12,
    },
    {
      id: 2,
      name: 'Autumn Warmth',
      description: 'Rich, warm tones for fall coloring',
      colors: ['#8B4513', '#CD853F', '#FF6347', '#FFD700', '#FF8C00'],
      usageCount: 8,
    },
    {
      id: 3,
      name: 'Ocean Depths',
      description: 'Cool blues and teals',
      colors: ['#000080', '#4169E1', '#00CED1', '#20B2AA', '#87CEEB'],
      usageCount: 15,
    },
    {
      id: 4,
      name: 'Sunset Vibes',
      description: 'Vibrant oranges and pinks',
      colors: ['#FF4500', '#FF6347', '#FF69B4', '#FF1493', '#FFB6C1'],
      usageCount: 6,
    },
    {
      id: 5,
      name: 'Forest Greens',
      description: 'Natural earth tones',
      colors: ['#228B22', '#32CD32', '#6B8E23', '#8B7355', '#A0522D'],
      usageCount: 10,
    },
    {
      id: 6,
      name: 'Royal Purple',
      description: 'Rich purples and lavenders',
      colors: ['#4B0082', '#8B00FF', '#9370DB', '#BA55D3', '#DDA0DD'],
      usageCount: 4,
    },
  ]);

  return (
    <div className="space-y-6">
      <div className="bg-slate-50 rounded-2xl p-6">
        <div className="flex items-center justify-end">
          <button 
          className="px-4 py-2 text-white rounded-lg font-medium transition-colors flex items-center space-x-2"
          style={{
            backgroundColor: '#ea3663'
          }}
          onMouseEnter={(e) => e.target.style.backgroundColor = '#d12a4f'}
          onMouseLeave={(e) => e.target.style.backgroundColor = '#ea3663'}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          <span>New Palette</span>
        </button>
        </div>
      </div>

      {/* Palettes Grid Section */}
      <div className="bg-slate-50 rounded-2xl p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {palettes.map((palette) => (
          <div
            key={palette.id}
            className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-all cursor-pointer"
            onMouseEnter={(e) => e.currentTarget.style.borderColor = '#ea3663'}
            onMouseLeave={(e) => e.currentTarget.style.borderColor = '#e2e8f0'}
          >
            {/* Color Strip */}
            <div className="flex h-24">
              {palette.colors.map((color, index) => (
                <div
                  key={index}
                  className="flex-1"
                  style={{ backgroundColor: color }}
                ></div>
              ))}
            </div>

            {/* Content */}
            <div className="p-5">
              <div className="flex items-start justify-between mb-2">
                <h3 className="text-lg font-semibold text-slate-800 font-venti">{palette.name}</h3>
                <button className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors">
                  <svg className="w-4 h-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                  </svg>
                </button>
              </div>
              <p className="text-sm text-slate-600 mb-4">{palette.description}</p>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-1 text-sm text-slate-500">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  <span>Used {palette.usageCount} times</span>
                </div>
                <button 
                  className="px-3 py-1.5 text-sm font-medium rounded-lg transition-colors"
                  style={{
                    color: '#49817b'
                  }}
                  onMouseEnter={(e) => e.target.style.backgroundColor = '#c1fcf6'}
                  onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                >
                  Use
                </button>
              </div>
            </div>
          </div>
        ))}
        </div>

        {palettes.length === 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
          <div className="text-6xl mb-4">🌈</div>
          <h3 className="text-xl font-semibold text-slate-800 mb-2 font-venti">No Palettes Yet</h3>
          <p className="text-slate-600 mb-4">Create your first color palette to get started</p>
          <button 
            className="px-6 py-3 text-white rounded-lg font-medium transition-colors"
            style={{
              backgroundColor: '#ea3663'
            }}
            onMouseEnter={(e) => e.target.style.backgroundColor = '#d12a4f'}
            onMouseLeave={(e) => e.target.style.backgroundColor = '#ea3663'}
          >
            Create Palette
          </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ColorPalettes;

