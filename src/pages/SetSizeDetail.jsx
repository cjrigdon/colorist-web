import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { coloredPencilSetsAPI, coloredPencilsAPI } from '../services/api';
import LoadingState from '../components/LoadingState';
import ErrorState from '../components/ErrorState';

const SetSizeDetail = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Extract setSizeId from pathname since we're using custom routing
  const pathname = location.pathname;
  const setSizeIdMatch = pathname.match(/\/studio\/media\/set-size\/(\d+)/);
  const setSizeId = setSizeIdMatch ? setSizeIdMatch[1] : null;
  const [setSize, setSetSize] = useState(null);
  const [pencils, setPencils] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingInventory, setEditingInventory] = useState(null);
  const [inventoryValue, setInventoryValue] = useState('');
  const [updatingInventory, setUpdatingInventory] = useState(false);
  const [inventoryUpdates, setInventoryUpdates] = useState({});

  useEffect(() => {
    const fetchSetSizeAndPencils = async () => {
      try {
        setLoading(true);
        setError(null);

        if (!setSizeId) {
          setError('Invalid set size ID');
          setLoading(false);
          return;
        }

        // First, get the set size details from the user's set sizes
        // We'll fetch with a large per_page to ensure we get all sets
        // Include pencils this time since we need them for the detail page
        const response = await coloredPencilSetsAPI.getAll(1, 1000, false); // excludePencils = false
        const setSizes = Array.isArray(response) ? response : (response.data || []);
        const foundSetSize = setSizes.find(s => s.id === parseInt(setSizeId));

        if (!foundSetSize) {
          setError('Set size not found');
          setLoading(false);
          return;
        }

        setSetSize(foundSetSize);

        // Get pencils for this set size
        // If the set size already has pencils loaded, use those
        // Otherwise, get pencils from the underlying set
        if (foundSetSize.pencils && Array.isArray(foundSetSize.pencils) && foundSetSize.pencils.length > 0) {
          // Use the pencils from the set size if available
          setPencils(foundSetSize.pencils);
        } else if (foundSetSize.set?.id) {
          // Otherwise, get pencils from the set
          const pencilsResponse = await coloredPencilSetsAPI.getPencils(foundSetSize.set.id);
          const pencilsData = Array.isArray(pencilsResponse) 
            ? pencilsResponse 
            : (pencilsResponse.data || []);
          
          setPencils(pencilsData);
        } else {
          setPencils([]);
        }
      } catch (err) {
        console.error('Error fetching set size:', err);
        setError(err.message || 'Failed to load set size');
      } finally {
        setLoading(false);
      }
    };

    if (setSizeId) {
      fetchSetSizeAndPencils();
    }
  }, [setSizeId]);

  // Merge inventory updates with pencil data
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

  const handleInventoryClick = (pencil) => {
    setEditingInventory(pencil.id);
    setInventoryValue(pencil.inventory > 0 ? pencil.inventory : '');
  };

  const handleInventoryChange = (e) => {
    const value = e.target.value;
    if (value === '' || /^-?\d*$/.test(value)) {
      setInventoryValue(value);
    }
  };

  const handleInventorySubmit = async (e, pencilId) => {
    if (e && e.preventDefault) {
      e.preventDefault();
    }
    if (e && e.stopPropagation) {
      e.stopPropagation();
    }
    
    const inventory = parseInt(inventoryValue) || 0;
    setUpdatingInventory(true);
    try {
      await coloredPencilsAPI.updateInventory(pencilId, inventory);
      
      setInventoryUpdates(prev => ({
        ...prev,
        [pencilId]: inventory
      }));
      
      setEditingInventory(null);
      setInventoryValue('');
    } catch (error) {
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

  if (loading) {
    return <LoadingState message="Loading set details..." />;
  }

  if (error) {
    return <ErrorState message={error} />;
  }

  if (!setSize) {
    return <ErrorState message="Set size not found" />;
  }

  const displayName = setSize.name || `${setSize.count}-piece set`;
  const setName = setSize.set?.name || 'Unknown';
  const brandName = setSize.set?.brand?.name || setSize.set?.brand || 'Unknown';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/studio/media')}
            className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
            title="Back to sets"
          >
            <svg className="w-6 h-6 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div>
            <h2 className="text-2xl font-bold text-slate-800 font-venti">{setName}</h2>
            <p className="text-sm text-slate-600">{brandName} • {displayName}</p>
          </div>
        </div>
      </div>

      {/* Pencils Grid */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-slate-800 font-venti">Pencil Colors</h3>
          <p className="text-sm text-slate-600 mt-1">Click on inventory to edit</p>
        </div>
        
        {pencils.length === 0 ? (
          <div className="text-center py-12 text-slate-500">
            <p>No pencils found in this set</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4" style={{ isolation: 'isolate' }}>
            {pencils.map((pencil) => {
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
                  <div
                    className="w-full h-16 rounded-lg mb-3 shadow-sm"
                    style={{ backgroundColor: pencil.color?.hex || '#cccccc' }}
                  ></div>
                  <h4 className="font-medium text-sm text-slate-800 mb-1">
                    {pencil.color_name} ({pencil.color_number})
                  </h4>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-slate-500 font-mono">
                      {pencil.color?.hex || '#000000'}
                    </span>
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
                          if (e.relatedTarget && e.relatedTarget.closest('.inventory-edit-controls')) {
                            return;
                          }
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
                    <div className="flex items-center justify-between group">
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
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default SetSizeDetail;

