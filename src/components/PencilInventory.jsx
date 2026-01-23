import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { coloredPencilSetsAPI, coloredPencilsAPI } from '../services/api';
import { useInfiniteScroll } from '../hooks/useInfiniteScroll';
import InfiniteScrollLoader from './InfiniteScrollLoader';
import AddPencilSetModal from './AddPencilSetModal';
import ShoppingListModal from './ShoppingListModal';

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
  const [editingInventory, setEditingInventory] = useState(null);
  const [inventoryValue, setInventoryValue] = useState('');
  const [updatingInventory, setUpdatingInventory] = useState(false);
  const [inventoryUpdates, setInventoryUpdates] = useState({}); // Track local inventory updates
  const [shoppingListMode, setShoppingListMode] = useState(false);
  const [selectedPencils, setSelectedPencils] = useState(new Set());
  const [isShoppingListModalOpen, setIsShoppingListModalOpen] = useState(false);

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

  // Clear inventory updates when selected set changes
  useEffect(() => {
    setInventoryUpdates({});
  }, [selectedSet]);

  // Merge inventory updates with the selected set data
  const getPencilWithInventory = (pencil) => {
    if (inventoryUpdates[pencil.id] !== undefined) {
      return {
        ...pencil,
        inventory: inventoryUpdates[pencil.id],
        inStock: inventoryUpdates[pencil.id] > 0
      };
    }
    return pencil;
  };

  // Initialize selected pencils when entering shopping list mode - select from ALL sets
  useEffect(() => {
    if (shoppingListMode) {
      // Auto-select pencils with inventory = 0 from ALL sets
      const pencilsToSelect = [];
      pencilSets.forEach(set => {
        if (set.pencils && Array.isArray(set.pencils)) {
          set.pencils.forEach(pencil => {
            const pencilWithInventory = getPencilWithInventory(pencil);
            if (pencilWithInventory.inventory === 0) {
              pencilsToSelect.push(pencil.id);
            }
          });
        }
      });
      setSelectedPencils(new Set(pencilsToSelect));
    } else {
      // Clear selection when exiting shopping list mode
      setSelectedPencils(new Set());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shoppingListMode]);

  // Check if we should open the add modal from navigation state
  useEffect(() => {
    if (location.state?.openAddModal) {
      setIsAddModalOpen(true);
      // Clear the state to prevent reopening on re-render
      navigate(location.pathname, { replace: true, state: { ...location.state, openAddModal: false } });
    }
  }, [location.state, navigate, location.pathname]);

  const selectedSetData = pencilSets.find(set => set.id === selectedSet);

  const handleInventoryClick = (pencil) => {
    setEditingInventory(pencil.id);
    // If inventory is 0 or null, start with empty string so user can type
    setInventoryValue(pencil.inventory > 0 ? pencil.inventory : '');
  };

  const handleInventoryChange = (e) => {
    const value = e.target.value;
    // Allow empty string, negative numbers (for now), and positive numbers
    if (value === '' || /^-?\d*$/.test(value)) {
      setInventoryValue(value);
    }
  };

  const handleInventorySubmit = async (e, pencilId) => {
    // Prevent any form submission or page refresh
    if (e && e.preventDefault) {
      e.preventDefault();
    }
    if (e && e.stopPropagation) {
      e.stopPropagation();
    }
    
    const inventory = parseInt(inventoryValue) || 0;
    setUpdatingInventory(true);
    try {
      // Update via AJAX
      await coloredPencilsAPI.updateInventory(pencilId, inventory);
      
      // Update local state immediately without page refresh
      setInventoryUpdates(prev => ({
        ...prev,
        [pencilId]: inventory
      }));
      
      setEditingInventory(null);
      setInventoryValue('');
      
      // No refetch needed - local state update is sufficient
    } catch (error) {
      console.error('Failed to update inventory:', error);
      alert('Failed to update inventory. Please try again.');
    } finally {
      setUpdatingInventory(false);
    }
  };

  const handleInventoryCancel = () => {
    setEditingInventory(null);
    setInventoryValue('');
  };

  const handleKeyDown = (e, pencilId) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      e.stopPropagation();
      handleInventorySubmit(e, pencilId);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      e.stopPropagation();
      handleInventoryCancel();
    }
  };

  const handleToggleShoppingListMode = () => {
    setShoppingListMode(!shoppingListMode);
  };

  const handleTogglePencilSelection = (pencilId) => {
    setSelectedPencils(prev => {
      const newSet = new Set(prev);
      if (newSet.has(pencilId)) {
        newSet.delete(pencilId);
      } else {
        newSet.add(pencilId);
      }
      return newSet;
    });
  };

  const handleExportShoppingList = () => {
    if (selectedPencils.size === 0) {
      alert('Please select at least one pencil to export.');
      return;
    }
    setIsShoppingListModalOpen(true);
  };

  const getSelectedPencilsData = () => {
    // Get selected pencils from ALL sets, not just the current one
    const selectedPencilsList = [];
    pencilSets.forEach(set => {
      if (set.pencils && Array.isArray(set.pencils)) {
        set.pencils.forEach(pencil => {
          if (selectedPencils.has(pencil.id)) {
            selectedPencilsList.push(getPencilWithInventory(pencil));
          }
        });
      }
    });
    return selectedPencilsList;
  };

  return (
    <>
      <div className="space-y-6">
        <div className="px-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {shoppingListMode && (
                <>
                  <button 
                    onClick={handleExportShoppingList}
                    disabled={selectedPencils.size === 0}
                    className="px-4 py-2 text-white rounded-lg font-medium transition-colors flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{
                      backgroundColor: selectedPencils.size > 0 ? '#49817b' : '#94a3b8'
                    }}
                    onMouseEnter={(e) => {
                      if (selectedPencils.size > 0) {
                        e.target.style.backgroundColor = '#3d6b66';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (selectedPencils.size > 0) {
                        e.target.style.backgroundColor = '#49817b';
                      }
                    }}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <span>Export Shopping List ({selectedPencils.size})</span>
                  </button>
                  <button 
                    onClick={handleToggleShoppingListMode}
                    className="px-4 py-2 text-slate-700 bg-slate-200 rounded-lg font-medium transition-colors flex items-center space-x-2 hover:bg-slate-300"
                  >
                    <span>Cancel</span>
                  </button>
                </>
              )}
              {!shoppingListMode && (
                <button 
                  onClick={handleToggleShoppingListMode}
                  className="px-4 py-2 text-white rounded-lg font-medium transition-colors flex items-center space-x-2"
                  style={{
                    backgroundColor: '#49817b'
                  }}
                  onMouseEnter={(e) => e.target.style.backgroundColor = '#3d6b66'}
                  onMouseLeave={(e) => e.target.style.backgroundColor = '#49817b'}
                  title="Generate Shopping List"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </button>
              )}
            </div>
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
              <span>Add Set</span>
            </button>
          </div>
        </div>

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
        {!loading && (
        <div className="grid grid-cols-1 md:grid-cols-[320px_1fr] gap-6">
          {/* Sets List */}
          <div className="min-w-0">
            <div className="bg-slate-50 rounded-xl shadow-sm border border-slate-200 p-4">
            <div className="mb-4">
              <h3 className="font-semibold text-slate-800 font-venti">Your Sets</h3>
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
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4" style={{ isolation: 'isolate' }}>
                {selectedSetData.pencils && selectedSetData.pencils.length > 0 ? (
                  selectedSetData.pencils.map((pencil) => {
                    const pencilWithInventory = getPencilWithInventory(pencil);
                    return (
                  <div
                    key={pencil.id}
                    className={`p-4 rounded-lg border-2 transition-all cursor-pointer hover:shadow-md relative ${
                      editingInventory === pencil.id ? 'z-10' : 'z-0'
                    } ${
                      pencilWithInventory.inStock
                        ? 'border-slate-200 bg-slate-50'
                        : 'border-red-200 bg-red-50 opacity-60'
                    }`}
                    onMouseEnter={(e) => {
                      if (pencilWithInventory.inStock) {
                        e.currentTarget.style.borderColor = '#ea3663';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (pencilWithInventory.inStock) {
                        e.currentTarget.style.borderColor = '#e2e8f0';
                      }
                    }}
                  >
                    {/* Shopping List Checkbox */}
                    {shoppingListMode && (
                      <div className="absolute top-2 left-2 z-20">
                        <input
                          type="checkbox"
                          checked={selectedPencils.has(pencil.id)}
                          onChange={() => handleTogglePencilSelection(pencil.id)}
                          onClick={(e) => e.stopPropagation()}
                          className="w-5 h-5 rounded border-2 border-slate-400 text-teal-600 focus:ring-teal-500 focus:ring-2 cursor-pointer"
                          style={{ accentColor: '#49817b' }}
                        />
                      </div>
                    )}
                    <div
                      className="w-full h-16 rounded-lg mb-3 shadow-sm"
                      style={{ backgroundColor: pencil.color.hex }}
                    ></div>
                    <h4 className="font-medium text-sm text-slate-800 mb-1">{pencil.color_name} ({pencil.color_number})</h4>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-slate-500 font-mono">{pencil.color.hex}</span>
                    </div>
                    {editingInventory === pencil.id ? (
                      <div className="flex items-center gap-2 relative z-10 inventory-edit-controls">
                        <input
                          type="number"
                          min="0"
                          value={inventoryValue}
                          onChange={handleInventoryChange}
                          onKeyDown={(e) => handleKeyDown(e, pencil.id)}
                          onBlur={(e) => {
                            // Only submit on blur if focus is moving to something other than our buttons
                            // Check the relatedTarget to see where focus is going
                            if (e.relatedTarget && e.relatedTarget.closest('.inventory-edit-controls')) {
                              return; // Don't submit if clicking a button in the edit controls
                            }
                            // Small delay to ensure button clicks are processed first
                            setTimeout(() => {
                              if (editingInventory === pencil.id) {
                                handleInventorySubmit(e, pencil.id);
                              }
                            }, 150);
                          }}
                          className="flex-1 px-2 py-1.5 text-sm border-2 border-teal-500 rounded focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-1 bg-white"
                          autoFocus
                          disabled={updatingInventory}
                          placeholder="0"
                        />
                        <button
                          type="button"
                          onClick={(e) => handleInventorySubmit(e, pencil.id)}
                          disabled={updatingInventory}
                          className="px-2.5 py-1.5 text-xs bg-teal-500 text-white rounded hover:bg-teal-600 disabled:opacity-50 transition-colors flex items-center justify-center flex-shrink-0"
                          title="Save"
                        >
                          {updatingInventory ? (
                            <svg className="animate-spin h-3 w-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                          ) : (
                            '✓'
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleInventoryCancel();
                          }}
                          disabled={updatingInventory}
                          className="px-2.5 py-1.5 text-xs bg-slate-300 text-slate-700 rounded hover:bg-slate-400 disabled:opacity-50 transition-colors flex-shrink-0"
                          title="Cancel"
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <div 
                        className="flex items-center justify-between group"
                      >
                        <span className="text-xs text-slate-500 font-medium">Inventory:</span>
                        <button
                          onClick={() => handleInventoryClick(pencilWithInventory)}
                          className={`text-xs font-medium transition-colors cursor-pointer px-2 py-1 rounded hover:bg-teal-50 flex items-center gap-1 ${
                            pencilWithInventory.inventory > 0 
                              ? 'text-slate-500 hover:text-teal-600' 
                              : 'text-red-600 hover:text-red-700'
                          }`}
                          title="Click to edit inventory"
                        >
                          <span>{pencilWithInventory.inventory > 0 ? pencilWithInventory.inventory : 'Out'}</span>
                          <svg className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                      </div>
                    )}
                  </div>
                  );
                  })
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
        )}
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
      <ShoppingListModal
        isOpen={isShoppingListModalOpen}
        onClose={() => setIsShoppingListModalOpen(false)}
        pencils={getSelectedPencilsData()}
        pencilSets={pencilSets}
      />
    </>
  );
};

export default PencilInventory;

