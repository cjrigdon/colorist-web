import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { colorCombosAPI } from '../services/api';
import { useInfiniteScroll } from '../hooks/useInfiniteScroll';
import InfiniteScrollLoader from './InfiniteScrollLoader';
import AddColorComboModal from './AddColorComboModal';

const ColorCombos = () => {
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

  // Use infinite scroll hook
  const { items: combos, loading, error, loadingMore, observerTarget, refetch } = useInfiniteScroll(
    colorCombosAPI.getAll,
    transformCombos,
    { perPage: 40 }
  );

  return (
    <>
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
            <span>New Combo</span>
          </button>
          </div>
        </div>

        {/* Combos Grid Section */}
        <div className="bg-white p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-slate-500">Loading combos...</div>
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
              className="bg-slate-50 rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-all cursor-pointer"
              onMouseEnter={(e) => e.currentTarget.style.borderColor = '#ea3663'}
              onMouseLeave={(e) => e.currentTarget.style.borderColor = '#e2e8f0'}
              onClick={() => navigate(`/edit/color-combo/${combo.id}`)}
            >
              <div className="mb-4">
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
    </>
  );
};

export default ColorCombos;

