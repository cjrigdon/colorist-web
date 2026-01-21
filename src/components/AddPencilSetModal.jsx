import React, { useState, useEffect } from 'react';
import { coloredPencilSetsAPI, colorsAPI } from '../services/api';
import ColorSelector from './ColorSelector';
import DropdownMenu from './DropdownMenu';

const AddPencilSetModal = ({ isOpen, onClose, onSuccess }) => {
  const [activeTab, setActiveTab] = useState('existing'); // 'existing', 'new', 'custom'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Existing sets data
  const [availableSets, setAvailableSets] = useState([]);
  const [loadingAvailable, setLoadingAvailable] = useState(false);
  const [selectedSetSizeIds, setSelectedSetSizeIds] = useState([]);

  // New set form data
  const [newSetData, setNewSetData] = useState({
    brand: '',
    name: '',
    origin_country: '',
    type: '',
    shopping_link: '',
    water_soluable: false,
    open_stock: false,
    count: '',
    setName: ''
  });
  const [availableColorsForNewSet, setAvailableColorsForNewSet] = useState([]);
  const [selectedColorIdsForNewSet, setSelectedColorIdsForNewSet] = useState([]);
  const [loadingColorsForNewSet, setLoadingColorsForNewSet] = useState(false);
  const [colorSearchTerm, setColorSearchTerm] = useState('');
  const [showAddColorForm, setShowAddColorForm] = useState(false);
  const [newColorHex, setNewColorHex] = useState('');
  const [addingColor, setAddingColor] = useState(false);

  // Custom set data
  const [customSetData, setCustomSetData] = useState({
    brand: '',
    name: '',
    count: '',
    setName: ''
  });
  const [selectedColorIdsForCustomSet, setSelectedColorIdsForCustomSet] = useState([]);
  const [allPencilsForCustomSet, setAllPencilsForCustomSet] = useState([]);
  const [availablePencilsForCustomSet, setAvailablePencilsForCustomSet] = useState([]);
  const [loadingPencilsForCustomSet, setLoadingPencilsForCustomSet] = useState(false);
  const [pencilSetsForCustom, setPencilSetsForCustom] = useState([]);
  const [selectedSetFilterForCustom, setSelectedSetFilterForCustom] = useState('');

  useEffect(() => {
    if (isOpen && activeTab === 'existing') {
      fetchAvailableSets();
      setSelectedSetSizeIds([]);
    } else if (isOpen && activeTab === 'custom') {
      fetchPencilsForCustomSet();
      setSelectedColorIdsForCustomSet([]);
      setSelectedSetFilterForCustom('');
    } else if (isOpen && activeTab === 'new') {
      fetchColorsForNewSet();
      setSelectedColorIdsForNewSet([]);
      setColorSearchTerm('');
      setShowAddColorForm(false);
      setNewColorHex('');
    }
  }, [isOpen, activeTab]);

  useEffect(() => {
    if (activeTab === 'custom') {
      filterPencilsForCustomSet();
    }
  }, [selectedSetFilterForCustom, allPencilsForCustomSet, activeTab]);

  // Reset color selections if count changes and current selection exceeds new count
  useEffect(() => {
    if (activeTab === 'new' && newSetData.count) {
      const count = parseInt(newSetData.count);
      if (selectedColorIdsForNewSet.length > count) {
        setSelectedColorIdsForNewSet(selectedColorIdsForNewSet.slice(0, count));
      }
    }
  }, [newSetData.count, activeTab]);


  const fetchAvailableSets = async () => {
    try {
      setLoadingAvailable(true);
      const response = await coloredPencilSetsAPI.getAvailableSetSizes(1, 100);
      let setsData = [];
      if (Array.isArray(response)) {
        setsData = response;
      } else if (response.data && Array.isArray(response.data)) {
        setsData = response.data;
      }
      setAvailableSets(setsData);
    } catch (err) {
      console.error('Error fetching available sets:', err);
      setError('Failed to load available sets');
    } finally {
      setLoadingAvailable(false);
    }
  };


  const fetchColorsForNewSet = async () => {
    try {
      setLoadingColorsForNewSet(true);
      const response = await colorsAPI.getAll();
      let colorsData = [];
      if (Array.isArray(response)) {
        colorsData = response;
      } else if (response.data && Array.isArray(response.data)) {
        colorsData = response.data;
      }
      setAvailableColorsForNewSet(colorsData);
    } catch (err) {
      console.error('Error fetching colors:', err);
      setError('Failed to load colors');
    } finally {
      setLoadingColorsForNewSet(false);
    }
  };

  const handleAddNewColor = async () => {
    if (!newColorHex || !/^#?[0-9A-Fa-f]{6}$/.test(newColorHex.replace('#', ''))) {
      setError('Please enter a valid hex color (e.g., #FF5733)');
      return;
    }

    try {
      setAddingColor(true);
      setError(null);
      const newColor = await colorsAPI.createFromHex(newColorHex);
      
      // Add to available colors list
      setAvailableColorsForNewSet([...availableColorsForNewSet, newColor]);
      
      // Auto-select the new color if there's room
      const count = parseInt(newSetData.count || 0);
      if (count && selectedColorIdsForNewSet.length < count) {
        setSelectedColorIdsForNewSet([...selectedColorIdsForNewSet, newColor.id.toString()]);
      }
      
      // Reset form
      setNewColorHex('');
      setShowAddColorForm(false);
    } catch (err) {
      console.error('Error creating color:', err);
      setError(err.data?.message || 'Failed to create color');
    } finally {
      setAddingColor(false);
    }
  };

  const fetchPencilsForCustomSet = async () => {
    try {
      setLoadingPencilsForCustomSet(true);
      
      // Get user's pencil sets
      const setsResponse = await coloredPencilSetsAPI.getAll(1, 100);
      
      // Handle paginated response structure
      let sets = [];
      if (Array.isArray(setsResponse)) {
        sets = setsResponse;
      } else if (setsResponse.data && Array.isArray(setsResponse.data)) {
        sets = setsResponse.data;
      }
      
      setPencilSetsForCustom(sets);
      
      // Collect all pencils from user's sets
      const allPencilsList = [];
      
      for (const set of sets) {
        if (set.pencils && Array.isArray(set.pencils) && set.pencils.length > 0) {
          set.pencils.forEach(pencil => {
            if (pencil && pencil.color) {
              // Include the pencil with its set information for filtering
              allPencilsList.push({
                ...pencil,
                setSizeId: set.id,
                setData: set.set || set.colored_pencil_set
              });
            }
          });
        }
      }
      
      setAllPencilsForCustomSet(allPencilsList);
      setAvailablePencilsForCustomSet(allPencilsList);
    } catch (err) {
      console.error('Error fetching pencils for custom set:', err);
      setError('Failed to load pencils');
    } finally {
      setLoadingPencilsForCustomSet(false);
    }
  };

  const filterPencilsForCustomSet = () => {
    if (!selectedSetFilterForCustom) {
      // No filter selected, show all pencils
      setAvailablePencilsForCustomSet(allPencilsForCustomSet);
      return;
    }

    // Filter pencils to only those in the selected set
    const filtered = allPencilsForCustomSet.filter(pencil => 
      pencil.setSizeId.toString() === selectedSetFilterForCustom
    );

    setAvailablePencilsForCustomSet(filtered);
  };


  const handleAttachExistingSet = async () => {
    if (selectedSetSizeIds.length === 0) {
      setError('Please select at least one set');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      // Attach each selected set size
      for (const setSizeId of selectedSetSizeIds) {
        await coloredPencilSetsAPI.attachSetSize(parseInt(setSizeId));
      }
      
      onSuccess();
      onClose();
    } catch (err) {
      console.error('Error attaching sets:', err);
      setError(err.data?.message || 'Failed to add sets to your collection');
    } finally {
      setLoading(false);
    }
  };

  const toggleSetSizeSelection = (setSizeId) => {
    const idStr = setSizeId.toString();
    if (selectedSetSizeIds.includes(idStr)) {
      setSelectedSetSizeIds(selectedSetSizeIds.filter(id => id !== idStr));
    } else {
      setSelectedSetSizeIds([...selectedSetSizeIds, idStr]);
    }
  };

  const handleCreateNewSet = async () => {
    if (!newSetData.brand || !newSetData.name || !newSetData.count) {
      setError('Please fill in all required fields');
      return;
    }

    const count = parseInt(newSetData.count);
    if (selectedColorIdsForNewSet.length !== count) {
      setError(`Please select exactly ${count} color${count !== 1 ? 's' : ''} to match the set size`);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await coloredPencilSetsAPI.createUserSet({
        set: {
          brand: newSetData.brand,
          name: newSetData.name,
          origin_country: newSetData.origin_country || null,
          type: newSetData.type || null,
          shopping_link: newSetData.shopping_link || null,
          water_soluable: newSetData.water_soluable ? 1 : 0,
          open_stock: newSetData.open_stock ? 1 : 0,
        },
        setSize: {
          count: count,
          name: newSetData.setName || null,
        },
        colorIds: selectedColorIdsForNewSet.map(id => parseInt(id))
      });
      onSuccess();
      onClose();
    } catch (err) {
      console.error('Error creating new set:', err);
      setError(err.data?.message || 'Failed to create set');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCustomSet = async () => {
    if (!customSetData.brand || !customSetData.name || selectedColorIdsForCustomSet.length === 0) {
      setError('Please fill in all required fields and select at least one color');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await coloredPencilSetsAPI.createCustomSet({
        set: {
          brand: customSetData.brand,
          name: customSetData.name,
        },
        setSize: {
          count: selectedColorIdsForCustomSet.length,
          name: customSetData.setName || null,
        },
        pencilIds: selectedColorIdsForCustomSet.map(id => parseInt(id))
      });
      onSuccess();
      onClose();
    } catch (err) {
      console.error('Error creating custom set:', err);
      setError(err.data?.message || 'Failed to create custom set');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed top-0 left-0 right-0 bottom-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999]">
      <div className="bg-slate-50 rounded-2xl shadow-xl max-w-4xl w-full h-[85vh] m-4 flex flex-col">
        <div className="p-4 border-b border-slate-200 flex-shrink-0">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold text-slate-800 font-venti">Add Pencil Set</h3>
            <button
              onClick={onClose}
              className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="p-3 border-b border-slate-200 flex-shrink-0">
          <div className="flex space-x-2">
            <button
              onClick={() => setActiveTab('existing')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === 'existing'
                  ? 'text-white'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
              style={activeTab === 'existing' ? { backgroundColor: '#ea3663' } : {}}
            >
              Add Existing Set
            </button>
            <button
              onClick={() => setActiveTab('new')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === 'new'
                  ? 'text-white'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
              style={activeTab === 'new' ? { backgroundColor: '#ea3663' } : {}}
            >
              Create New Set
            </button>
            <button
              onClick={() => setActiveTab('custom')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === 'custom'
                  ? 'text-white'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
              style={activeTab === 'custom' ? { backgroundColor: '#ea3663' } : {}}
            >
              Create Custom Set
            </button>
          </div>
        </div>

        <div className="p-4 flex-1 overflow-hidden flex flex-col">
          {error && (
            <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm flex-shrink-0">
              {error}
            </div>
          )}

          {/* Existing Set Tab */}
          {activeTab === 'existing' && (
            <div className="space-y-3 flex-1 overflow-hidden flex flex-col">
              <div className="flex-shrink-0">
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Select Sets ({selectedSetSizeIds.length} selected)
                </label>
              </div>
              {loadingAvailable ? (
                <div className="text-center py-4 text-slate-500 flex-shrink-0">Loading available sets...</div>
              ) : availableSets.length === 0 ? (
                <div className="text-center py-4 text-slate-500 flex-shrink-0">No available sets to add</div>
              ) : (
                <div className="flex-1 overflow-y-auto border border-slate-200 rounded-lg p-2 min-h-0">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                    {availableSets.map((setSize) => (
                      <label
                        key={setSize.id}
                        className={`flex items-center space-x-3 p-3 rounded-lg cursor-pointer transition-colors ${
                          selectedSetSizeIds.includes(setSize.id.toString())
                            ? 'bg-slate-100 border-2 border-slate-300'
                            : 'hover:bg-slate-50 border-2 border-transparent'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={selectedSetSizeIds.includes(setSize.id.toString())}
                          onChange={() => toggleSetSizeSelection(setSize.id)}
                          className="w-4 h-4 text-pink-600 border-slate-300 rounded focus:ring-pink-500 flex-shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-slate-800 truncate">
                            {setSize.set?.name || 'Unknown'}
                          </div>
                          <div className="text-xs text-slate-600 truncate">
                            {setSize.set?.brand || 'Unknown'} - {setSize.count} pencils
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              )}
              <div className="text-sm text-slate-600 flex-shrink-0">
                Select one or more sets from the system pencil sets to add to your collection.
              </div>
            </div>
          )}

          {/* New Set Tab */}
          {activeTab === 'new' && (
            <div className="space-y-3 flex-1 overflow-hidden flex flex-col">
              <div className="grid grid-cols-2 gap-3 flex-shrink-0">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Brand *</label>
                    <input
                    type="text"
                    value={newSetData.brand}
                    onChange={(e) => setNewSetData({ ...newSetData, brand: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg text-slate-800"
                    placeholder="e.g. Prismacolor"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Name *</label>
                  <input
                    type="text"
                    value={newSetData.name}
                    onChange={(e) => setNewSetData({ ...newSetData, name: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg text-slate-800"
                    placeholder="e.g. Premier"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Count *</label>
                  <input
                    type="number"
                    value={newSetData.count}
                    onChange={(e) => setNewSetData({ ...newSetData, count: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg text-slate-800"
                    placeholder="e.g. 72"
                    min="1"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Set Size Name (optional)</label>
                  <input
                    type="text"
                    value={newSetData.setName}
                    onChange={(e) => setNewSetData({ ...newSetData, setName: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg text-slate-800"
                    placeholder="e.g. 72 Count"
                  />
                </div>
              </div>
              <div className="flex-1 overflow-hidden flex flex-col min-h-0">
                <div className="flex items-center justify-between mb-2 flex-shrink-0">
                  <label className="block text-sm font-medium text-slate-700">
                    Select Colors ({selectedColorIdsForNewSet.length} / {newSetData.count || 0} selected)
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowAddColorForm(!showAddColorForm)}
                    className="px-3 py-1.5 text-sm text-white rounded-lg font-medium transition-colors flex items-center space-x-1"
                    style={{ backgroundColor: '#ea3663' }}
                    onMouseEnter={(e) => e.target.style.backgroundColor = '#d12a4f'}
                    onMouseLeave={(e) => e.target.style.backgroundColor = '#ea3663'}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    <span>Add Color</span>
                  </button>
                </div>
                
                {showAddColorForm && (
                  <div className="mb-3 p-3 bg-slate-50 rounded-lg border border-slate-200 flex-shrink-0">
                    <div className="flex items-center space-x-2">
                      <input
                        type="text"
                        value={newColorHex}
                        onChange={(e) => setNewColorHex(e.target.value)}
                        placeholder="#FF5733"
                        className="flex-1 px-4 py-2 border border-slate-300 rounded-lg text-slate-800"
                        maxLength={7}
                      />
                      <div
                        className="w-12 h-12 rounded border border-slate-300"
                        style={{ backgroundColor: newColorHex || '#ccc' }}
                      />
                      <button
                        type="button"
                        onClick={handleAddNewColor}
                        disabled={addingColor || !newColorHex}
                        className="px-4 py-2 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
                        style={{ backgroundColor: '#ea3663' }}
                      >
                        {addingColor ? 'Adding...' : 'Add'}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowAddColorForm(false);
                          setNewColorHex('');
                        }}
                        className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                {/* Search Input */}
                <div className="mb-2 flex-shrink-0">
                  <div className="relative">
                    <input
                      type="text"
                      value={colorSearchTerm}
                      onChange={(e) => setColorSearchTerm(e.target.value)}
                      placeholder="Search by name or hex (e.g., red or #FF5733)..."
                      className="w-full px-4 py-2 pl-10 border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-offset-0 focus:border-transparent"
                      style={{ focusRingColor: '#ea3663' }}
                    />
                    <svg
                      className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    {colorSearchTerm && (
                      <button
                        type="button"
                        onClick={() => setColorSearchTerm('')}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>

                {loadingColorsForNewSet ? (
                  <div className="text-center py-4 text-slate-500">Loading colors...</div>
                ) : (() => {
                  // Filter colors based on search term
                  const filteredColors = availableColorsForNewSet.filter((color) => {
                    if (!colorSearchTerm) return true;
                    const searchLower = colorSearchTerm.toLowerCase();
                    const nameMatch = color.name?.toLowerCase().includes(searchLower);
                    const hexMatch = color.hex?.toLowerCase().includes(searchLower);
                    return nameMatch || hexMatch;
                  });

                  if (filteredColors.length === 0) {
                    return (
                      <div className="text-center py-4 text-slate-500">
                        {colorSearchTerm ? `No colors found matching "${colorSearchTerm}"` : 'No colors available.'}
                      </div>
                    );
                  }

                  return (
                    <div className="flex-1 overflow-y-auto border border-slate-200 rounded-lg p-2 min-h-0">
                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                        {filteredColors.map((color) => (
                          <label
                            key={color.id}
                            className={`flex items-center space-x-2 p-2 rounded cursor-pointer transition-colors ${
                              selectedColorIdsForNewSet.includes(color.id.toString())
                                ? 'bg-slate-200 border-2 border-slate-300'
                                : 'hover:bg-slate-50 border-2 border-transparent'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={selectedColorIdsForNewSet.includes(color.id.toString())}
                              onChange={() => {
                                const idStr = color.id.toString();
                                if (selectedColorIdsForNewSet.includes(idStr)) {
                                  setSelectedColorIdsForNewSet(selectedColorIdsForNewSet.filter(id => id !== idStr));
                                } else {
                                  const count = parseInt(newSetData.count || 0);
                                  if (count && selectedColorIdsForNewSet.length >= count) {
                                    return; // Don't allow selection if max is reached
                                  }
                                  setSelectedColorIdsForNewSet([...selectedColorIdsForNewSet, idStr]);
                                }
                              }}
                              className="w-4 h-4 text-pink-600 border-slate-300 rounded focus:ring-pink-500 flex-shrink-0"
                              disabled={!selectedColorIdsForNewSet.includes(color.id.toString()) && selectedColorIdsForNewSet.length >= parseInt(newSetData.count || 0)}
                            />
                            <div className="flex items-center space-x-2 flex-1 min-w-0">
                              <div
                                className="w-6 h-6 rounded border border-slate-300 flex-shrink-0"
                                style={{ backgroundColor: color.hex ? `#${color.hex.replace('#', '')}` : '#ccc' }}
                              />
                              <div className="flex-1 min-w-0">
                                {color.name ? (
                                  <>
                                    <div className="text-xs text-slate-700 truncate font-medium">
                                      {color.name}
                                    </div>
                                    <div className="text-xs text-slate-500 truncate">
                                      {color.hex ? `#${color.hex.replace('#', '')}` : `Color ${color.id}`}
                                    </div>
                                  </>
                                ) : (
                                  <div className="text-xs text-slate-700 truncate">
                                    {color.hex ? `#${color.hex.replace('#', '')}` : `Color ${color.id}`}
                                  </div>
                                )}
                              </div>
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>
                  );
                })()}
              </div>
              {newSetData.count && selectedColorIdsForNewSet.length !== parseInt(newSetData.count) && (
                <div className="mt-2 text-sm text-amber-600 flex-shrink-0">
                  Please select exactly {newSetData.count} color{parseInt(newSetData.count) !== 1 ? 's' : ''} to match the set size.
                </div>
              )}
              <div className="text-sm text-slate-600 flex-shrink-0">
                Create a new set that is not currently in the system. Select {newSetData.count || 'the number of'} color{newSetData.count && parseInt(newSetData.count) !== 1 ? 's' : ''} that match the set size from existing colors. This will only be visible to you until an admin approves it.
              </div>
            </div>
          )}

          {/* Custom Set Tab */}
          {activeTab === 'custom' && (
            <div className="space-y-3 flex-1 overflow-hidden flex flex-col">
              <div className="grid grid-cols-2 gap-3 flex-shrink-0">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Brand *</label>
                  <input
                    type="text"
                    value={customSetData.brand}
                    onChange={(e) => setCustomSetData({ ...customSetData, brand: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg text-slate-800"
                    placeholder="e.g. My Custom Set"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Name *</label>
                  <input
                    type="text"
                    value={customSetData.name}
                    onChange={(e) => setCustomSetData({ ...customSetData, name: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg text-slate-800"
                    placeholder="e.g. Favorite Colors"
                  />
                </div>
              </div>
              <ColorSelector
                items={availablePencilsForCustomSet}
                selectedIds={selectedColorIdsForCustomSet}
                loading={loadingPencilsForCustomSet}
                mode="pencils"
                allowAddColor={false}
                maxSelection={null}
                selectionLabel="Select Colors"
                filterComponent={
                  <DropdownMenu
                    label="Filter by Pencil Set (optional)"
                    options={[
                      { value: '', label: 'All Colors' },
                      ...pencilSetsForCustom.map((set) => {
                        const setData = set.set || set.colored_pencil_set || {};
                        const brand = setData.brand || '';
                        const name = setData.name || '';
                        const count = set.count || (set.pencils ? set.pencils.length : 0);
                        const label = brand && name 
                          ? `${brand} ${name} (${count} colors)`
                          : name 
                            ? `${name} (${count} colors)`
                            : `Set ${set.id} (${count} colors)`;
                        return {
                          value: set.id.toString(),
                          label: label
                        };
                      })
                    ]}
                    value={selectedSetFilterForCustom}
                    onChange={(value) => setSelectedSetFilterForCustom(value)}
                    placeholder="All Colors"
                  />
                }
                onSelectionChange={setSelectedColorIdsForCustomSet}
                onColorAdded={(newColor) => {
                  setError('Color added successfully! Note: You\'ll need to add this color to a pencil set before it can be used in a custom set.');
                }}
                emptyMessage={selectedSetFilterForCustom ? 'No colors found in the selected pencil set.' : 'No colors available.'}
              />
              {selectedColorIdsForCustomSet.length === 0 && (
                <div className="mt-2 text-sm text-amber-600 flex-shrink-0">
                  Please select at least one color for your custom set.
                </div>
              )}
              <div className="text-sm text-slate-600 flex-shrink-0">
                Create a custom set by selecting colors. You can add new colors by entering a hex code. This will only be visible to you until an admin approves it.
              </div>
            </div>
          )}

          <div className="flex justify-end space-x-3 pt-4 mt-4 border-t border-slate-200 flex-shrink-0">
            <button
              onClick={onClose}
              className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              onClick={() => {
                if (activeTab === 'existing') handleAttachExistingSet();
                else if (activeTab === 'new') handleCreateNewSet();
                else if (activeTab === 'custom') handleCreateCustomSet();
              }}
              className="px-4 py-2 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
              style={{ backgroundColor: '#ea3663' }}
              disabled={loading}
            >
              {loading ? 'Processing...' : activeTab === 'existing' 
                ? `Add ${selectedSetSizeIds.length > 0 ? `${selectedSetSizeIds.length} ` : ''}Set${selectedSetSizeIds.length !== 1 ? 's' : ''}` 
                : 'Create Set'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddPencilSetModal;






