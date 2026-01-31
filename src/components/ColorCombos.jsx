import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { colorCombosAPI, userAPI } from '../services/api';
import { useInfiniteScroll } from '../hooks/useInfiniteScroll';
import InfiniteScrollLoader from './InfiniteScrollLoader';
import AddColorComboModal from './AddColorComboModal';
import UpgradeBanner from './UpgradeBanner';
import DeleteConfirmationModal from './DeleteConfirmationModal';

const ColorCombos = ({ user }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [comboToDelete, setComboToDelete] = useState(null);
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

  // Transform function for color combos
  const transformCombos = (data) => {
    return data.map(combo => {
      // Ensure colors is always an array
      let colors = [];
      if (combo.colors && Array.isArray(combo.colors)) {
        colors = combo.colors.map((color, index) => {
          if (typeof color === 'string') {
            // It's a hex string, create a color object
            return {
              name: `Color ${index + 1}`,
              hex: color
            };
          }
          // It's already an object with name and hex
          return color;
        });
      }
      
      // Ensure tags is always an array
      const tags = Array.isArray(combo.tags) ? combo.tags : [];
      
      return { ...combo, colors, tags };
    });
  };

  // Check if user has free plan
  const isFreePlan = user?.subscription_plan === 'free' || !user?.subscription_plan;
  const FREE_PLAN_LIMIT = 5;

  // Use infinite scroll hook
  const { items: allCombos, loading, error, loadingMore, observerTarget, refetch } = useInfiniteScroll(
    colorCombosAPI.getAll,
    transformCombos,
    { perPage: 40 }
  );

  const hasReachedLimit = isFreePlan && allCombos.length >= FREE_PLAN_LIMIT;

  // Fetch user favorites
  const fetchFavorites = useCallback(async () => {
    try {
      const userId = user?.id;
      if (!userId) return;
      
      const response = await userAPI.getFavorites(userId);
      
      // Handle different response structures
      let favoritesData = [];
      if (Array.isArray(response)) {
        favoritesData = response;
      } else if (response?.data && Array.isArray(response.data)) {
        favoritesData = response.data;
      }
      
      if (favoritesData.length > 0) {
        const favoriteIds = new Set();
        favoritesData.forEach(fav => {
          // Check for both possible type formats and use flexible matching
          const isColorCombo = fav.favoritable_type === 'App\\Models\\ColorCombo' || 
                              fav.favoritable_type === 'App\Models\ColorCombo' ||
                              fav.favoritable_type?.includes('ColorCombo');
          
          if (isColorCombo && fav.favoritable_id !== undefined && fav.favoritable_id !== null) {
            // Convert to number to ensure type consistency
            const id = Number(fav.favoritable_id);
            if (!isNaN(id)) {
              favoriteIds.add(id);
            }
          }
        });
        setFavorites(favoriteIds);
      } else {
        setFavorites(new Set());
      }
    } catch (err) {
      console.error('Error fetching favorites:', err);
      setFavorites(new Set());
    }
  }, [user]);

  useEffect(() => {
    fetchFavorites();
  }, [fetchFavorites]);

  // Sort combos alphabetically by title
  const sortedCombos = useMemo(() => {
    return [...allCombos].sort((a, b) => {
      const aTitle = (a.title || '').toLowerCase();
      const bTitle = (b.title || '').toLowerCase();
      return aTitle.localeCompare(bTitle);
    });
  }, [allCombos]);

  // Limit items for free plan users
  const combos = useMemo(() => {
    if (isFreePlan) {
      return sortedCombos.slice(0, FREE_PLAN_LIMIT);
    }
    return sortedCombos;
  }, [sortedCombos, isFreePlan]);

  const handleToggleFavorite = async (comboId, e) => {
    e.stopPropagation();
    if (togglingFavorite === comboId) return;
    
    setTogglingFavorite(comboId);
    try {
      const result = await colorCombosAPI.toggleFavorite(comboId);
      
      // Update favorites state
      // Convert comboId to number to ensure type consistency
      const numericId = Number(comboId);
      setFavorites(prev => {
        const newFavorites = new Set(prev);
        if (result.is_favorited) {
          newFavorites.add(numericId);
        } else {
          newFavorites.delete(numericId);
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
    if (!comboToDelete) return;
    
    setDeleting(true);
    
    try {
      await colorCombosAPI.delete(comboToDelete.id);
      await refetch();
      setShowDeleteModal(false);
      setComboToDelete(null);
    } catch (err) {
      console.error('Error deleting combo:', err);
      alert(err.data?.message || err.message || 'Failed to delete color combo');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <div className="space-y-6">
        {hasReachedLimit && (
          <div className="px-4">
            <UpgradeBanner itemType="color combos" />
          </div>
        )}
        <div className="px-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold text-slate-800 font-venti">Color Combos</h3>
            <button 
            onClick={() => {
              if (hasReachedLimit) {
                alert('You\'ve reached the limit of 5 color combos on the free plan. Please upgrade to Premium to add more.');
                return;
              }
              setIsAddModalOpen(true);
            }}
            disabled={hasReachedLimit}
            className="px-4 py-2 text-white rounded-lg font-medium transition-colors flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              backgroundColor: hasReachedLimit ? '#cbd5e1' : '#ea3663'
            }}
            onMouseEnter={(e) => {
              if (!hasReachedLimit) {
                e.target.style.backgroundColor = '#d12a4f';
              }
            }}
            onMouseLeave={(e) => {
              if (!hasReachedLimit) {
                e.target.style.backgroundColor = '#ea3663';
              }
            }}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span>New Combo</span>
          </button>
          </div>
        </div>

        {/* Combos Grid Section */}
        <div className="bg-white p-6">
          {loading ? (
            <div className="bg-white p-12 text-center">
              <div className="modern-loader mb-4">
                <div className="loader-ring">
                  <div className="loader-ring-segment"></div>
                  <div className="loader-ring-segment"></div>
                  <div className="loader-ring-segment"></div>
                  <div className="loader-ring-segment"></div>
                </div>
              </div>
              <h3 className="text-xl font-semibold text-slate-800 mb-2 font-venti">Loading Combos...</h3>
              <p className="text-slate-600">Fetching your color combinations</p>
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          ) : null}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {combos.map((combo) => (
            <div
              key={combo.id}
              className="bg-slate-50 rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-all cursor-pointer relative"
              onMouseEnter={(e) => e.currentTarget.style.borderColor = '#ea3663'}
              onMouseLeave={(e) => e.currentTarget.style.borderColor = '#e2e8f0'}
              onClick={() => navigate(`/edit/color-combo/${combo.id}`)}
            >
              {/* Favorite and Delete Buttons - Top Right */}
              <div className="absolute top-4 right-4 flex items-center gap-2 z-10">
                <button
                  onClick={(e) => handleToggleFavorite(combo.id, e)}
                  className={`p-2 rounded-full transition-colors ${
                    favorites.has(Number(combo.id)) ? 'text-red-500' : 'text-slate-400 hover:text-red-500'
                  }`}
                  title={favorites.has(Number(combo.id)) ? 'Remove from favorites' : 'Add to favorites'}
                  disabled={togglingFavorite === combo.id}
                >
                  <svg className="w-5 h-5" fill={favorites.has(Number(combo.id)) ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setComboToDelete({ id: combo.id, title: combo.title });
                    setShowDeleteModal(true);
                  }}
                  className="p-2 text-slate-400 hover:text-red-600 transition-colors"
                  title="Delete color combo"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="mb-4 pr-8">
                <h3 className="text-xl font-semibold text-slate-800 font-venti">{combo.title}</h3>
              </div>

              {/* Color Swatches */}
              {combo.pencils && combo.pencils.length > 0 && (
                <div className="flex flex-wrap gap-3 mb-4">
                  {combo.pencils.map((pencil, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <div
                        className="w-12 h-12 rounded-lg shadow-sm border border-slate-200"
                        style={{ backgroundColor: pencil.color.hex }}
                      ></div>
                      <div>
                        <p className="text-sm font-medium text-slate-800">{pencil.set.brand} {pencil.set.name}</p>
                        <p className="text-xs text-slate-500 font-mono">{pencil.color_name} ({pencil.color_number})</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Tags */}
              {combo.tags && combo.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {combo.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-xs font-medium"
                    >
                      {tag.tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
          </div>

          {/* Infinite scroll trigger */}
          {combos.length > 0 && (
            <InfiniteScrollLoader loadingMore={loadingMore} observerTarget={observerTarget} />
          )}

          {combos.length === 0 && !loading && (
            <div className="bg-slate-50 rounded-xl shadow-sm border border-slate-200 p-12 text-center">
            <div className="text-6xl mb-4">🎨</div>
            <h3 className="text-xl font-semibold text-slate-800 mb-2 font-venti">No Color Combos Yet</h3>
            <p className="text-slate-600 mb-4">Create your first color combination to get started</p>
            <button 
              onClick={() => setIsAddModalOpen(true)}
              className="px-6 py-3 text-white rounded-lg font-medium transition-colors"
              style={{
                backgroundColor: '#ea3663'
              }}
              onMouseEnter={(e) => e.target.style.backgroundColor = '#d12a4f'}
              onMouseLeave={(e) => e.target.style.backgroundColor = '#ea3663'}
            >
              Create Combo
            </button>
            </div>
          )}
        </div>
      </div>
      <AddColorComboModal
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
          setComboToDelete(null);
        }}
        onConfirm={handleDelete}
        itemName={comboToDelete?.title || 'Color Combo'}
        itemType="color combo"
      />
    </>
  );
};

export default ColorCombos;

