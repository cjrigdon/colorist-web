import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { colorPalettesAPI } from '../services/api';
import { useInfiniteScroll } from '../hooks/useInfiniteScroll';
import InfiniteScrollLoader from './InfiniteScrollLoader';
import AddColorPaletteModal from './AddColorPaletteModal';

const ColorPalettes = () => {
  const navigate = useNavigate();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  
  // Use infinite scroll hook (no transformation needed for palettes)
  const { items: palettes, loading, error, loadingMore, observerTarget, refetch } = useInfiniteScroll(
    colorPalettesAPI.getAll,
    null,
    { perPage: 40 }
  );

  return (
    <div className="space-y-6">
      <div className="px-4">
        <div className="flex items-center justify-end">
          <button 
          onClick={() => setIsAddModalOpen(true)}
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
      <div className="bg-white p-6">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-slate-500">Loading palettes...</div>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        ) : null}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {palettes.map((palette) => (
          <div
            key={palette.id}
            className="bg-slate-50 rounded-xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-all cursor-pointer"
            onMouseEnter={(e) => e.currentTarget.style.borderColor = '#ea3663'}
            onMouseLeave={(e) => e.currentTarget.style.borderColor = '#e2e8f0'}
            onClick={() => palette.id && navigate(`/edit/color-palette/${palette.id}`)}
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
                <h3 className="text-lg font-semibold text-slate-800 font-venti">{palette.title}</h3>
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
          </div>
        ))}
        </div>

        {/* Infinite scroll trigger */}
        {palettes.length > 0 && (
          <InfiniteScrollLoader loadingMore={loadingMore} observerTarget={observerTarget} />
        )}

        {palettes.length === 0 && !loading && (
          <div className="bg-slate-50 rounded-xl shadow-sm border border-slate-200 p-12 text-center">
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
      <AddColorPaletteModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={() => {
          refetch();
          setIsAddModalOpen(false);
        }}
      />
    </div>
  );
};

export default ColorPalettes;

