import React, { useState, useEffect, useMemo } from 'react';
import { coloredPencilSetsAPI, coloredPencilsAPI } from '../services/api';
import ShoppingListModal from './ShoppingListModal';

const ShoppingListGeneratorModal = ({ isOpen, onClose }) => {
  const [sets, setSets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedSets, setExpandedSets] = useState(new Set());
  const [pencilsBySet, setPencilsBySet] = useState({});
  const [loadingPencils, setLoadingPencils] = useState(new Set());
  const [selectedPencils, setSelectedPencils] = useState(new Set());
  const [editingInventory, setEditingInventory] = useState({});
  const [inventoryValues, setInventoryValues] = useState({});
  const [showShoppingList, setShowShoppingList] = useState(false);
  const [shoppingListPencils, setShoppingListPencils] = useState([]);

  // Fetch all sets on mount
  useEffect(() => {
    if (isOpen) {
      fetchAllSets();
    }
  }, [isOpen]);

  const fetchAllSets = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await coloredPencilSetsAPI.getAllSets(1, 1000);
      const setsData = Array.isArray(response) ? response : (response.data || []);
      setSets(setsData);
    } catch (err) {
      console.error('Error fetching sets:', err);
      setError('Failed to load pencil sets. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Group sets by brand
  const groupedByBrand = useMemo(() => {
    const grouped = {};
    sets.forEach(set => {
      const brandName = set.brand?.name || set.brand || 'Unknown';
      if (!grouped[brandName]) {
        grouped[brandName] = [];
      }
      grouped[brandName].push(set);
    });

    // Sort sets within each brand
    Object.keys(grouped).forEach(brandName => {
      grouped[brandName].sort((a, b) => {
        const nameA = a.name || '';
        const nameB = b.name || '';
        return nameA.localeCompare(nameB);
      });
    });

    return grouped;
  }, [sets]);

  const sortedBrandNames = useMemo(() => {
    return Object.keys(groupedByBrand).sort((a, b) => a.localeCompare(b));
  }, [groupedByBrand]);

  // Handle accordion toggle
  const handleToggleSet = async (setId) => {
    const newExpanded = new Set(expandedSets);
    if (newExpanded.has(setId)) {
      newExpanded.delete(setId);
    } else {
      newExpanded.add(setId);
      // Load pencils if not already loaded
      if (!pencilsBySet[setId]) {
        await loadPencilsForSet(setId);
      }
    }
    setExpandedSets(newExpanded);
  };

  // Load pencils for a set
  const loadPencilsForSet = async (setId) => {
    try {
      setLoadingPencils(prev => new Set(prev).add(setId));
      
      // Request a large number of pencils to get all of them
      const response = await fetch(`${process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000/api'}/colored-pencil-sets/${setId}/pencils?per_page=1000&page=1`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          'Accept': 'application/json',
        },
      });
      
      const data = await response.json();
      const pencilsData = Array.isArray(data) ? data : (data.data || []);
      
      setPencilsBySet(prev => ({
        ...prev,
        [setId]: pencilsData
      }));

      // Initialize inventory values and auto-select pencils with inventory 0
      const newInventoryValues = { ...inventoryValues };
      const newSelected = new Set(selectedPencils);
      
      pencilsData.forEach(pencil => {
        const inventory = pencil.inventory || 0;
        newInventoryValues[pencil.id] = inventory;
        if (inventory === 0) {
          newSelected.add(pencil.id);
        }
      });

      setInventoryValues(newInventoryValues);
      setSelectedPencils(newSelected);
    } catch (err) {
      console.error('Error loading pencils:', err);
    } finally {
      setLoadingPencils(prev => {
        const newSet = new Set(prev);
        newSet.delete(setId);
        return newSet;
      });
    }
  };

  // Handle checkbox toggle
  const handlePencilToggle = (pencilId) => {
    const newSelected = new Set(selectedPencils);
    if (newSelected.has(pencilId)) {
      newSelected.delete(pencilId);
    } else {
      newSelected.add(pencilId);
    }
    setSelectedPencils(newSelected);
  };

  // Handle inventory update
  const handleInventoryChange = (pencilId, value) => {
    setInventoryValues(prev => ({
      ...prev,
      [pencilId]: value
    }));
  };

  // Save inventory update
  const handleSaveInventory = async (pencilId) => {
    const newValue = parseInt(inventoryValues[pencilId]) || 0;
    
    // Find the pencil before updating to get old inventory
    const allPencils = Object.values(pencilsBySet).flat();
    const pencil = allPencils.find(p => p.id === pencilId);
    const oldInventory = pencil ? (pencil.inventory || 0) : 0;
    
    try {
      await coloredPencilsAPI.updateInventory(pencilId, newValue);
      
      // Update the pencil in pencilsBySet
      setPencilsBySet(prev => {
        const updated = { ...prev };
        Object.keys(updated).forEach(setId => {
          updated[setId] = updated[setId].map(p => 
            p.id === pencilId 
              ? { ...p, inventory: newValue }
              : p
          );
        });
        return updated;
      });
      
      setEditingInventory(prev => {
        const newState = { ...prev };
        delete newState[pencilId];
        return newState;
      });
      
      // Update selection if inventory changed to/from 0
      if (oldInventory === 0 && newValue !== 0) {
        setSelectedPencils(prev => {
          const newSet = new Set(prev);
          newSet.delete(pencilId);
          return newSet;
        });
      } else if (oldInventory !== 0 && newValue === 0) {
        setSelectedPencils(prev => new Set(prev).add(pencilId));
      }
    } catch (err) {
      console.error('Error updating inventory:', err);
      alert('Failed to update inventory. Please try again.');
    }
  };

  // Generate shopping list
  const handleGenerateShoppingList = () => {
    const selectedPencilIds = Array.from(selectedPencils);
    const allPencils = Object.values(pencilsBySet).flat();
    const selectedPencilObjects = allPencils.filter(pencil => selectedPencilIds.includes(pencil.id));
    
    if (selectedPencilObjects.length === 0) {
      alert('Please select at least one pencil for your shopping list.');
      return;
    }

    setShoppingListPencils(selectedPencilObjects);
    setShowShoppingList(true);
  };

  if (!isOpen) return null;

  if (showShoppingList) {
    return (
      <ShoppingListModal
        isOpen={true}
        onClose={() => {
          setShowShoppingList(false);
          onClose();
        }}
        pencils={shoppingListPencils}
        pencilSets={sets}
      />
    );
  }

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-xl shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between flex-shrink-0">
          <div>
            <h2 className="text-2xl font-semibold text-slate-800 font-venti">
              Generate Shopping List
            </h2>
            <p className="text-sm text-slate-600 mt-1">
              Select pencils to add to your shopping list. Pencils with zero inventory are automatically selected.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleGenerateShoppingList}
              disabled={selectedPencils.size === 0}
              className="px-4 py-2 text-white rounded-lg font-medium transition-colors flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                backgroundColor: selectedPencils.size > 0 ? '#10b981' : '#cbd5e1'
              }}
              onMouseEnter={(e) => {
                if (selectedPencils.size > 0) {
                  e.target.style.backgroundColor = '#059669';
                }
              }}
              onMouseLeave={(e) => {
                if (selectedPencils.size > 0) {
                  e.target.style.backgroundColor = '#10b981';
                }
              }}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
              </svg>
              <span>Generate List ({selectedPencils.size})</span>
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg font-medium transition-colors hover:bg-slate-300"
            >
              Close
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-4 overflow-y-auto flex-1">
          {loading ? (
            <div className="text-center py-12 text-slate-500">
              Loading pencil sets...
            </div>
          ) : error ? (
            <div className="text-center py-12 text-red-600">
              {error}
            </div>
          ) : sortedBrandNames.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              No pencil sets found.
            </div>
          ) : (
            <div className="space-y-4">
              {sortedBrandNames.map(brandName => {
                const brandSets = groupedByBrand[brandName];
                return (
                  <div key={brandName} className="border border-slate-200 rounded-lg overflow-hidden">
                    <div className="bg-slate-50 px-4 py-3 border-b border-slate-200">
                      <h3 className="text-lg font-semibold text-slate-800 font-venti">
                        {brandName}
                      </h3>
                    </div>
                    <div className="divide-y divide-slate-200">
                      {brandSets.map(set => {
                        const isExpanded = expandedSets.has(set.id);
                        const isLoading = loadingPencils.has(set.id);
                        const pencils = pencilsBySet[set.id] || [];
                        
                        return (
                          <div key={set.id} className="bg-white">
                            <button
                              onClick={() => handleToggleSet(set.id)}
                              className="w-full px-4 py-3 text-left hover:bg-slate-50 transition-colors flex items-center justify-between"
                            >
                              <span className="font-medium text-slate-800">{set.name || 'Unnamed Set'}</span>
                              <svg 
                                className={`w-5 h-5 text-slate-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                                fill="none" 
                                stroke="currentColor" 
                                viewBox="0 0 24 24"
                              >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                              </svg>
                            </button>
                            
                            {isExpanded && (
                              <div className="px-4 py-3 bg-slate-50 border-t border-slate-200">
                                {isLoading ? (
                                  <div className="text-center py-4 text-slate-500 text-sm">
                                    Loading pencils...
                                  </div>
                                ) : pencils.length === 0 ? (
                                  <div className="text-center py-4 text-slate-500 text-sm">
                                    No pencils found in this set.
                                  </div>
                                ) : (
                                  <div className="space-y-2">
                                    {pencils.map(pencil => {
                                      const isSelected = selectedPencils.has(pencil.id);
                                      const isEditing = editingInventory[pencil.id];
                                      const inventory = inventoryValues[pencil.id] !== undefined 
                                        ? inventoryValues[pencil.id] 
                                        : (pencil.inventory || 0);
                                      const hexColor = pencil.color?.hex || '#ffffff';
                                      
                                      return (
                                        <div
                                          key={pencil.id}
                                          className="flex items-center gap-3 p-3 bg-white rounded-lg border border-slate-200 hover:border-slate-300 transition-colors"
                                        >
                                          {/* Checkbox */}
                                          <input
                                            type="checkbox"
                                            checked={isSelected}
                                            onChange={() => handlePencilToggle(pencil.id)}
                                            className="w-5 h-5 text-pink-600 rounded focus:ring-pink-500"
                                          />
                                          
                                          {/* Color Swatch */}
                                          <div
                                            className="w-12 h-12 rounded-lg flex-shrink-0 border border-slate-200"
                                            style={{ backgroundColor: hexColor }}
                                          />
                                          
                                          {/* Pencil Info */}
                                          <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                              <span className="font-medium text-slate-800">
                                                {pencil.color_name || 'N/A'}
                                              </span>
                                              {pencil.color_number && (
                                                <span className="text-sm text-slate-500">
                                                  ({pencil.color_number})
                                                </span>
                                              )}
                                            </div>
                                            <div className="text-xs text-slate-500 font-mono">
                                              {hexColor}
                                            </div>
                                          </div>
                                          
                                          {/* Inventory */}
                                          <div className="flex items-center gap-2 flex-shrink-0">
                                            {isEditing ? (
                                              <>
                                                <input
                                                  type="number"
                                                  min="0"
                                                  value={inventory}
                                                  onChange={(e) => handleInventoryChange(pencil.id, e.target.value)}
                                                  className="w-20 px-2 py-1 border border-slate-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-pink-500"
                                                  autoFocus
                                                />
                                                <button
                                                  onClick={() => handleSaveInventory(pencil.id)}
                                                  className="px-3 py-1 text-xs font-medium text-white rounded bg-green-600 hover:bg-green-700 transition-colors"
                                                >
                                                  Save
                                                </button>
                                                <button
                                                  onClick={() => {
                                                    setEditingInventory(prev => {
                                                      const newState = { ...prev };
                                                      delete newState[pencil.id];
                                                      return newState;
                                                    });
                                                    setInventoryValues(prev => ({
                                                      ...prev,
                                                      [pencil.id]: pencil.inventory || 0
                                                    }));
                                                  }}
                                                  className="px-3 py-1 text-xs font-medium text-slate-700 bg-slate-200 rounded hover:bg-slate-300 transition-colors"
                                                >
                                                  Cancel
                                                </button>
                                              </>
                                            ) : (
                                              <>
                                                <span className="text-sm text-slate-600 min-w-[3rem] text-right">
                                                  Qty: {inventory}
                                                </span>
                                                <button
                                                  onClick={() => setEditingInventory(prev => ({ ...prev, [pencil.id]: true }))}
                                                  className="px-3 py-1 text-xs font-medium text-slate-700 bg-slate-100 rounded hover:bg-slate-200 transition-colors"
                                                >
                                                  Edit
                                                </button>
                                              </>
                                            )}
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ShoppingListGeneratorModal;

