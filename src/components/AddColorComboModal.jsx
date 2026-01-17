import React, { useState, useEffect } from 'react';
import { colorCombosAPI, coloredPencilSetsAPI, colorsAPI } from '../services/api';
import DropdownMenu from './DropdownMenu';
import ColorSelector from './ColorSelector';

const AddColorComboModal = ({ isOpen, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [comboData, setComboData] = useState({
    title: ''
  });
  const [allPencils, setAllPencils] = useState([]);
  const [availablePencils, setAvailablePencils] = useState([]);
  const [loadingColors, setLoadingColors] = useState(false);
  const [selectedPencilIds, setSelectedPencilIds] = useState([]);
  const [pencilSets, setPencilSets] = useState([]);
  const [selectedSetFilter, setSelectedSetFilter] = useState('');
  const [loadingSets, setLoadingSets] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchAllData();
      setComboData({ title: '' });
      setSelectedPencilIds([]);
      setSelectedSetFilter('');
    }
  }, [isOpen]);

  useEffect(() => {
    filterPencils();
  }, [selectedSetFilter, allPencils]);

  const fetchAllData = async () => {
    try {
      setLoadingColors(true);
      setLoadingSets(true);
      
      // Get user's pencil sets
      const setsResponse = await coloredPencilSetsAPI.getAll(1, 100);
      
      // Handle paginated response structure
      let sets = [];
      if (Array.isArray(setsResponse)) {
        sets = setsResponse;
      } else if (setsResponse.data && Array.isArray(setsResponse.data)) {
        sets = setsResponse.data;
      }
      
      // The API returns ColoredPencilSetSize objects with a 'set' property containing the ColoredPencilSet
      // Include all sets - even if they don't have the relationship loaded, we can still use them
      // The relationship should be loaded via ->with(['colored_pencil_set', 'pencils']) in the controller
      setPencilSets(sets);
      
      // Collect all pencils from user's sets (not just unique colors)
      // We want to show the pencil's color_name, not the color table's name
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
      
      setAllPencils(allPencilsList);
      
      // Initially show all pencils from user's sets
      setAvailablePencils(allPencilsList);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to load data.');
    } finally {
      setLoadingColors(false);
      setLoadingSets(false);
    }
  };

  const filterPencils = () => {
    if (!selectedSetFilter) {
      // No filter selected, show all pencils
      setAvailablePencils(allPencils);
      return;
    }

    // Filter pencils to only those in the selected set
    const filtered = allPencils.filter(pencil => 
      pencil.setSizeId.toString() === selectedSetFilter
    );

    setAvailablePencils(filtered);
  };


  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!comboData.title) {
      setError('Please enter a title');
      return;
    }
    if (selectedPencilIds.length === 0) {
      setError('Please select at least one color');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await colorCombosAPI.create({
        title: comboData.title,
        pencils: selectedPencilIds.map(id => parseInt(id))
      });
      onSuccess();
      onClose();
    } catch (err) {
      console.error('Error creating color combo:', err);
      setError(err.data?.message || 'Failed to create color combo');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] m-0 p-0">
      <div className="bg-slate-50 rounded-2xl shadow-xl max-w-4xl w-full h-[90vh] m-4 flex flex-col">
        <div className="p-6 border-b border-slate-200 flex-shrink-0">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold text-slate-800 font-venti">Create Color Combo</h3>
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

        <div className="p-6 flex flex-col flex-1 min-h-0 overflow-hidden">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm flex-shrink-0">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0 space-y-4">
            <div className="flex-shrink-0">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Title *
              </label>
              <input
                type="text"
                value={comboData.title}
                onChange={(e) => setComboData({ ...comboData, title: e.target.value })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg text-slate-800"
                placeholder="e.g. Sunset Colors"
                required
              />
            </div>

            <div className="flex-1 min-h-0 flex flex-col">
              <ColorSelector
                items={availablePencils}
                selectedIds={selectedPencilIds}
                loading={loadingColors}
                mode="pencils"
                allowAddColor={true}
                maxSelection={null}
                selectionLabel="Select Colors"
                filterComponent={
                  <DropdownMenu
                    label="Filter by Pencil Set (optional)"
                    options={[
                      { value: '', label: 'All Colors' },
                      ...pencilSets.map((set) => {
                        // Handle different response structures - the set relationship might be 'set' or 'colored_pencil_set'
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
                    value={selectedSetFilter}
                    onChange={(value) => setSelectedSetFilter(value)}
                    placeholder="All Colors"
                  />
                }
                onSelectionChange={setSelectedPencilIds}
                onColorAdded={(newColor) => {
                  // Note: New colors won't appear in the list until they're added to a pencil set
                  setError('Color added successfully! Note: You\'ll need to add this color to a pencil set before it can be used in a combo.');
                }}
                emptyMessage={selectedSetFilter ? 'No colors found in the selected pencil set.' : 'No colors available.'}
              />
              {selectedPencilIds.length === 0 && (
                <div className="mt-2 text-sm text-amber-600 flex-shrink-0">
                  Please select at least one color for your color combo.
                </div>
              )}
            </div>

            <div className="flex justify-end space-x-3 pt-6 mt-6 border-t border-slate-200 flex-shrink-0">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
                style={{ backgroundColor: '#ea3663' }}
                disabled={loading}
              >
                {loading ? 'Creating...' : 'Create Combo'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddColorComboModal;

