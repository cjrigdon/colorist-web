import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { colorPalettesAPI, userAPI } from '../services/api';
import { useInfiniteScroll } from '../hooks/useInfiniteScroll';
import InfiniteScrollLoader from './InfiniteScrollLoader';
import AddColorPaletteModal from './AddColorPaletteModal';
import PrimaryButton from './PrimaryButton';
import HoverableCard from './HoverableCard';
import ErrorState from './ErrorState';
import EmptyState from './EmptyState';
import UpgradeBanner from './UpgradeBanner';
import DeleteConfirmationModal from './DeleteConfirmationModal';

const ColorPalettes = ({ user }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [paletteToDelete, setPaletteToDelete] = useState(null);
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
  
  // Check if user has free plan
  const isFreePlan = user?.subscription_plan === 'free' || !user?.subscription_plan;
  const FREE_PLAN_LIMIT = 5;

  // Wrapper function to add sorting to API call
  const fetchPalettes = useCallback((page, perPage) => {
    return colorPalettesAPI.getAll(page, perPage, {
      sort: 'title',
      sort_direction: 'asc',
      archived: false
    });
  }, []);

  // Use infinite scroll hook (no transformation needed for palettes)
  const { items: allPalettes, loading, error, loadingMore, observerTarget, refetch } = useInfiniteScroll(
    fetchPalettes,
    null,
    { perPage: 40 }
  );

  // Palettes are already sorted and limited by API
  const palettes = allPalettes;
  const hasReachedLimit = isFreePlan && allPalettes.length >= FREE_PLAN_LIMIT;
  // Fetch user favorites
  const fetchFavorites = useCallback(async () => {
    try {
      const userId = user?.id;
      if (!userId) return;
      
      const response = await userAPI.getFavorites(userId);
      if (response && Array.isArray(response)) {
        const favoriteIds = new Set();
        response.forEach(fav => {
          if (fav.favoritable_type === 'App\\Models\\ColorPalette') {
            favoriteIds.add(fav.favoritable_id);
          }
        });
        setFavorites(favoriteIds);
      }
    } catch (err) {
      console.error('Error fetching favorites:', err);
    }
  }, [user]);

  useEffect(() => {
    fetchFavorites();
  }, [fetchFavorites]);

  const handleToggleFavorite = async (paletteId, e) => {
    e.stopPropagation();
    if (togglingFavorite === paletteId) return;
    
    setTogglingFavorite(paletteId);
    try {
      const result = await colorPalettesAPI.toggleFavorite(paletteId);
      
      // Update favorites state
      setFavorites(prev => {
        const newFavorites = new Set(prev);
        if (result.is_favorited) {
          newFavorites.add(paletteId);
        } else {
          newFavorites.delete(paletteId);
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

  const handleDelete = async () => {
    if (!paletteToDelete) return;
    
    setDeleting(true);
    
    try {
      await colorPalettesAPI.delete(paletteToDelete.id);
      await refetch();
      setShowDeleteModal(false);
      setPaletteToDelete(null);
    } catch (err) {
      console.error('Error deleting palette:', err);
      alert(err.data?.message || err.message || 'Failed to delete color palette');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="px-4">
      <div className="flex items-center justify-between">
      <h3 className="text-xl font-semibold text-slate-800 font-venti">Color Palettes</h3>
          <PrimaryButton 
            onClick={() => {
              if (hasReachedLimit) {
                alert('You\'ve reached the limit of 5 color palettes on the free plan. Please upgrade to Premium to add more.');
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
            New Palette
          </PrimaryButton>
        </div>
      </div>

      {/* Palettes Grid Section */}
      <div className="bg-white p-6">
        {hasReachedLimit && (
          <UpgradeBanner itemType="color palettes" />
        )}
        {loading && (
          <div className="bg-white p-12 text-center">
            <div className="modern-loader mb-4">
              <div className="loader-ring">
                <div className="loader-ring-segment"></div>
                <div className="loader-ring-segment"></div>
                <div className="loader-ring-segment"></div>
                <div className="loader-ring-segment"></div>
              </div>
            </div>
            <h3 className="text-xl font-semibold text-slate-800 mb-2 font-venti">Loading Palettes...</h3>
            <p className="text-slate-600">Fetching your color palettes</p>
          </div>
        )}
        {error && <ErrorState error={error} className="mb-6" />}
        {!loading && !error && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {palettes.map((palette) => (
              <HoverableCard
                key={palette.id}
                onClick={() => palette.id && navigate(`/edit/color-palette/${palette.id}`)}
                className="relative"
              >
            {/* Delete Button - Top Right */}
            {/* Favorite and Delete Buttons - Top Right */}
            <div className="absolute top-2 right-2 z-10 flex items-center gap-2">
              <button
                onClick={(e) => handleToggleFavorite(palette.id, e)}
                className={`p-2 bg-white bg-opacity-80 hover:bg-opacity-100 rounded-full transition-all shadow-sm ${
                  favorites.has(palette.id) ? 'text-red-500' : 'text-slate-600 hover:text-red-500'
                }`}
                title={favorites.has(palette.id) ? 'Remove from favorites' : 'Add to favorites'}
                disabled={togglingFavorite === palette.id}
              >
                <svg className="w-4 h-4" fill={favorites.has(palette.id) ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setPaletteToDelete({ id: palette.id, title: palette.title });
                  setShowDeleteModal(true);
                }}
                className="p-2 bg-white bg-opacity-80 hover:bg-opacity-100 rounded-full text-slate-600 hover:text-red-600 transition-all shadow-sm"
                title="Delete color palette"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
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
            onButtonClick={() => {
              if (hasReachedLimit) {
                alert('You\'ve reached the limit of 5 color palettes on the free plan. Please upgrade to Premium to add more.');
                return;
              }
              setIsAddModalOpen(true);
            }}
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
      <DeleteConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setPaletteToDelete(null);
        }}
        onConfirm={handleDelete}
        itemName={paletteToDelete?.title || 'Color Palette'}
        itemType="color palette"
      />
    </div>
  );
};

export default ColorPalettes;

