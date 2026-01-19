import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { coloredPencilSetsAPI } from '../services/api';
import { useInfiniteScroll } from '../hooks/useInfiniteScroll';
import InfiniteScrollLoader from './InfiniteScrollLoader';
import AddPencilSetModal from './AddPencilSetModal';

// Component for individual set item button with thumbnail support
const SetItemButton = ({ set, thumbnailUrl, isSelected, onSelect }) => {
  const [imageError, setImageError] = useState(false);

  return (
    <button
      onClick={onSelect}
      className={`w-full text-left p-4 rounded-lg border transition-colors ${
        isSelected
          ? ''
          : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
      }`}
      style={isSelected ? {
        borderColor: '#49817b',
        backgroundColor: '#c1fcf6'
      } : {}}
    >
      <div className="flex items-center gap-3">
        {thumbnailUrl && !imageError ? (
          <img 
            src={thumbnailUrl} 
            alt={`${set.set?.brand || 'Unknown'} ${set.set?.name || 'Unknown'}`}
            className="w-12 h-12 object-cover rounded-lg flex-shrink-0"
            onError={() => setImageError(true)}
          />
        ) : (
          <div 
            className="flex items-center justify-center w-12 h-12 rounded-lg flex-shrink-0"
            style={{ backgroundColor: '#f1f5f9' }}
          >
            <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <h4 className="font-medium text-slate-800 truncate">{set.set?.brand || 'Unknown'}</h4>
            <span className="text-xs text-slate-500 flex-shrink-0 ml-2 bg-slate-200 px-2 py-0.5 rounded-full font-medium">
              {set.count || 0} pencils
            </span>
          </div>
          <p className="text-sm text-slate-600 truncate">
            {set.set?.name || 'Unknown'}
            {set.name && set.name !== set.set?.name && (
              <span className="text-xs text-slate-500 ml-2">({set.name})</span>
            )}
          </p>
        </div>
      </div>
    </button>
  );
};

const PencilInventory = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [selectedSet, setSelectedSet] = useState(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Transform function for pencil sets
  const transformPencilSets = (data) => {
    return data.map(set => {
      return {
        ...set,
        colors: Array.isArray(set.colors) ? set.colors : [],
        // Use the count field directly from colored_pencil_set_sizes database table
        count: set.count,
        // Use the thumb field from colored_pencil_set_sizes database table - preserve it explicitly
        thumb: set.thumb
      };
    });
  };

  // Use infinite scroll hook
  const { items: pencilSets, loading, error, loadingMore, observerTarget, refetch } = useInfiniteScroll(
    coloredPencilSetsAPI.getAll,
    transformPencilSets,
    { perPage: 40 }
  );

  // Set selected set from location state or default to first set when sets are loaded
  useEffect(() => {
    if (pencilSets.length > 0 && selectedSet === null) {
      const stateSetId = location.state?.selectedSetId;
      if (stateSetId && pencilSets.find(set => set.id === stateSetId)) {
        // If a set ID was passed from navigation, select it
        setSelectedSet(stateSetId);
      } else {
        // Otherwise, default to the first set
        setSelectedSet(pencilSets[0].id);
      }
    }
  }, [pencilSets, selectedSet, location.state]);

  // Check if we should open the add modal from navigation state
  useEffect(() => {
    if (location.state?.openAddModal) {
      setIsAddModalOpen(true);
      // Clear the state to prevent reopening on re-render
      navigate(location.pathname, { replace: true, state: { ...location.state, openAddModal: false } });
    }
  }, [location.state, navigate, location.pathname]);

  const selectedSetData = pencilSets.find(set => set.id === selectedSet);

  return (
    <>
      <div className="space-y-6">
        {/* Main Content Section */}
        <div className="bg-white p-6">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-slate-500">Loading pencil sets...</div>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        ) : null}
        <div className="grid grid-cols-1 md:grid-cols-[320px_1fr] gap-6">
          {/* Sets List */}
          <div className="min-w-0">
            <div className="bg-slate-50 rounded-xl shadow-sm border border-slate-200 p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-slate-800 font-venti">Your Sets</h3>
              <button 
                onClick={() => setIsAddModalOpen(true)}
                className="px-3 py-1.5 text-white rounded-lg text-sm font-medium transition-colors flex items-center space-x-1"
                style={{
                  backgroundColor: '#ea3663'
                }}
                onMouseEnter={(e) => e.target.style.backgroundColor = '#d12a4f'}
                onMouseLeave={(e) => e.target.style.backgroundColor = '#ea3663'}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span>Add Set</span>
              </button>
            </div>
            <div className="space-y-2">
              {pencilSets.length === 0 && !loading && (
                <div className="text-center py-8 text-slate-500 text-sm">
                  No pencil sets found
                </div>
              )}
              {pencilSets.map((set) => {
                // Prioritize thumbnail from set size (colored_pencil_set_sizes.thumb), fallback to set thumb
                // Use set size thumb if it exists (even if it's a full URL), otherwise use set thumb
                const thumbnail = set.thumb ? set.thumb : (set.set?.thumb || null);
                const thumbnailUrl = thumbnail 
                  ? (thumbnail.startsWith('http') ? thumbnail : `${process.env.REACT_APP_API_BASE_URL?.replace('/api', '') || 'http://localhost:8000'}/storage/${thumbnail}`)
                  : null;
                
                return (
                  <SetItemButton
                    key={set.id}
                    set={set}
                    thumbnailUrl={thumbnailUrl}
                    isSelected={selectedSet === set.id}
                    onSelect={() => setSelectedSet(set.id)}
                  />
                );
              })}
              {/* Infinite scroll trigger */}
              <InfiniteScrollLoader loadingMore={loadingMore} observerTarget={observerTarget} />
            </div>
            </div>
          </div>

          {/* Colors Grid */}
          <div className="min-w-0">
          {selectedSetData ? (
            <div className="bg-slate-50 rounded-xl shadow-sm border border-slate-200 p-4">
              <div className="flex items-center justify-between mb-4 min-h-[60px]">
                <div className="flex-1 min-w-0 pr-4">
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="text-xl font-semibold text-slate-800 font-venti truncate">
                      {selectedSetData.set?.name || selectedSetData.name}
                      {selectedSetData.name && selectedSetData.name !== selectedSetData.set?.name && (
                        <span className="text-base text-slate-600 ml-2 font-normal">({selectedSetData.name})</span>
                      )}
                    </h3>
                    {selectedSetData.count && (
                      <span className="text-sm text-slate-600 bg-slate-200 px-3 py-1 rounded-full font-medium flex-shrink-0">
                        {selectedSetData.count} pencils
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-slate-600 truncate">{selectedSetData.set?.brand || selectedSetData.brand}</p>
                </div>
                {/* Only show Edit button for custom sets */}
                <div className="flex-shrink-0">
                  {selectedSetData.set?.is_custom === 1 && (
                    <button 
                      onClick={() => navigate(`/edit/pencil-set/${selectedSetData.set?.id || selectedSetData.id}`)}
                      className="px-3 py-1.5 text-white rounded-lg text-sm font-medium transition-colors flex items-center space-x-1"
                      style={{
                        backgroundColor: '#ea3663'
                      }}
                      onMouseEnter={(e) => e.target.style.backgroundColor = '#d12a4f'}
                      onMouseLeave={(e) => e.target.style.backgroundColor = '#ea3663'}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      <span>Edit Set</span>
                    </button>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {selectedSetData.pencils && selectedSetData.pencils.length > 0 ? (
                  selectedSetData.pencils.map((pencil) => (
                  <div
                    key={pencil.id}
                    className={`p-4 rounded-lg border-2 transition-all cursor-pointer hover:shadow-md ${
                      pencil.inStock
                        ? 'border-slate-200 bg-slate-50'
                        : 'border-red-200 bg-red-50 opacity-60'
                    }`}
                    onMouseEnter={(e) => {
                      if (pencil.inStock) {
                        e.currentTarget.style.borderColor = '#ea3663';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (pencil.inStock) {
                        e.currentTarget.style.borderColor = '#e2e8f0';
                      }
                    }}
                  >
                    <div
                      className="w-full h-16 rounded-lg mb-3 shadow-sm"
                      style={{ backgroundColor: pencil.color.hex }}
                    ></div>
                    <h4 className="font-medium text-sm text-slate-800 mb-1">{pencil.color_name} ({pencil.color_number})</h4>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-500 font-mono">{pencil.color.hex}</span>
                      {!pencil.inStock && (
                        <span className="text-xs text-red-600 font-medium">Out</span>
                      )}
                    </div>
                  </div>
                  ))
                ) : (
                  <div className="col-span-full text-center py-8 text-slate-500 text-sm">
                    No colors in this set
                  </div>
                )}
              </div>
              {/* Only show Add Color button for custom sets */}
              {selectedSetData.set?.is_custom === 1 && (
                <button 
                  className="mt-6 w-full py-3 border-2 border-dashed border-slate-300 rounded-lg text-slate-600 transition-colors flex items-center justify-center space-x-2"
                  onMouseEnter={(e) => {
                    e.target.style.borderColor = '#49817b';
                    e.target.style.color = '#49817b';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.borderColor = '#cbd5e1';
                    e.target.style.color = '#475569';
                  }}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  <span>Add Color</span>
                </button>
              )}
            </div>
          ) : (
            <div className="bg-slate-50 rounded-xl shadow-sm border border-slate-200 p-12 text-center">
              <div className="text-6xl mb-4">✏️</div>
              <h3 className="text-xl font-semibold text-slate-800 mb-2 font-venti">Select a Pencil Set</h3>
              <p className="text-slate-600">Choose a set from the left to view its colors</p>
            </div>
          )}
          </div>
        </div>
      </div>
      </div>
      <AddPencilSetModal
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

export default PencilInventory;

