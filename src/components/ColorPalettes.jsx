import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { colorPalettesAPI } from '../services/api';
import { useInfiniteScroll } from '../hooks/useInfiniteScroll';
import InfiniteScrollLoader from './InfiniteScrollLoader';
import AddColorPaletteModal from './AddColorPaletteModal';
import PrimaryButton from './PrimaryButton';
import HoverableCard from './HoverableCard';
import LoadingState from './LoadingState';
import ErrorState from './ErrorState';
import EmptyState from './EmptyState';

const ColorPalettes = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Check if we should open the add modal from navigation state
  useEffect(() => {
    if (location.state?.openAddModal) {
      setIsAddModalOpen(true);
      // Clear the state to prevent reopening on re-render
      navigate(location.pathname, { replace: true, state: { ...location.state, openAddModal: false } });
    }
  }, [location.state, navigate, location.pathname]);
  
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
          <PrimaryButton 
            onClick={() => setIsAddModalOpen(true)}
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            }
          >
            New Palette
          </PrimaryButton>
        </div>
      </div>

      {/* Palettes Grid Section */}
      <div className="bg-white p-6">
        {loading && <LoadingState message="Loading palettes..." />}
        {error && <ErrorState error={error} className="mb-6" />}
        {!loading && !error && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {palettes.map((palette) => (
              <HoverableCard
                key={palette.id}
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
          </HoverableCard>
        ))}
          </div>
        )}

        {/* Infinite scroll trigger */}
        {palettes.length > 0 && (
          <InfiniteScrollLoader loadingMore={loadingMore} observerTarget={observerTarget} />
        )}

        {palettes.length === 0 && !loading && !error && (
          <EmptyState
            icon="🌈"
            title="No Palettes Yet"
            message="Create your first color palette to get started"
            buttonText="Create Palette"
            onButtonClick={() => setIsAddModalOpen(true)}
          />
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

