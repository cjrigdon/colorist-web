import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { colorPalettesAPI, colorsAPI } from '../services/api';

const EditColorPalette = () => {
  const location = useLocation();
  const params = useParams();
  const navigate = useNavigate();
  
  // Extract ID from pathname since route uses pathname matching
  const pathname = location.pathname;
  const idFromPath = pathname.split('/edit/color-palette/')[1];
  const id = params.id || idFromPath;
  
  console.log('=== EDITCOLORPALETTE COMPONENT RENDERED ===');
  console.log('Pathname:', pathname);
  console.log('ID from useParams:', params.id);
  console.log('ID from pathname:', idFromPath);
  console.log('Final ID:', id);
  console.log('Full params object:', params);
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    image: '',
    base_color: ''
  });
  const [availableColors, setAvailableColors] = useState([]);
  const [loadingColors, setLoadingColors] = useState(false);
  const [selectedColorIds, setSelectedColorIds] = useState([]);
  const [colorSearchTerm, setColorSearchTerm] = useState('');
  const [showAddColorForm, setShowAddColorForm] = useState(false);
  const [newColorHex, setNewColorHex] = useState('');
  const [addingColor, setAddingColor] = useState(false);
  const [currentColors, setCurrentColors] = useState([]);

  const fetchAvailableColors = useCallback(async () => {
    try {
      setLoadingColors(true);
      const response = await colorsAPI.getAll();
      let colorsData = [];
      if (Array.isArray(response)) {
        colorsData = response;
      } else if (response?.data && Array.isArray(response.data)) {
        colorsData = response.data;
      }
      setAvailableColors(colorsData);
    } catch (err) {
      console.error('Error fetching colors:', err);
      setAvailableColors([]);
    } finally {
      setLoadingColors(false);
    }
  }, []);

  useEffect(() => {
    console.log('=== USEEFFECT TRIGGERED ===');
    console.log('ID from params:', id);
    console.log('ID type:', typeof id);
    console.log('ID truthy?', !!id);
    
    // Early return if no ID
    if (!id) {
      console.log('No ID provided, setting loading to false');
      setLoading(false);
      return;
    }

    console.log('ID exists, setting up fetch functions');

    const fetchData = async () => {
      console.log('=== FETCHDATA CALLED ===');
      console.log('ID in fetchData:', id);

      try {
        console.log('=== MAKING API CALL ===');
        console.log('Calling colorPalettesAPI.getById with id:', id);
        setLoading(true);
        setError(null);
        const response = await colorPalettesAPI.getById(id);
        console.log('=== API CALL COMPLETED ===');
        console.log('Response received:', response);
        console.log('=== PALETTE API RESPONSE ===');
        console.log('Full response:', response);
        console.log('Response type:', typeof response);
        console.log('Is array:', Array.isArray(response));
        console.log('Response keys:', response && typeof response === 'object' ? Object.keys(response) : 'N/A');
        console.log('Response stringified:', JSON.stringify(response, null, 2));
        
        // API returns the JSON object directly from handleResponse
        // But check if it's wrapped in a data property (some APIs do this)
        let data = response;
        if (response && typeof response === 'object' && 'data' in response && !('id' in response)) {
          // Response is wrapped in data property
          data = response.data;
          console.log('Response was wrapped, extracted data:', data);
        } else {
          // Response is the data directly
          data = response;
          console.log('Response is data directly');
        }
        
        if (!data || typeof data !== 'object') {
          console.error('Invalid data type:', typeof data, data);
          throw new Error('Invalid data received from server');
        }
        
        console.log('Data object:', data);
        console.log('Title:', data.title);
        console.log('Image:', data.image);
        console.log('Base Color:', data.base_color);
        console.log('Colors:', data.colors);
        
        // Extract form data - handle null/undefined values properly
        const title = (data.title !== null && data.title !== undefined) ? String(data.title) : '';
        const image = (data.image !== null && data.image !== undefined) ? String(data.image) : '';
        // If base_color is 'an image', we'll show it as is for editing
        const baseColor = (data.base_color !== null && data.base_color !== undefined) ? String(data.base_color) : '';
        
        const newFormData = {
          title: title,
          image: image,
          base_color: baseColor
        };
        
        console.log('=== SETTING FORMDATA ===');
        console.log('New formData object:', newFormData);
        console.log('Title value:', newFormData.title);
        console.log('Image value:', newFormData.image);
        console.log('Base color value:', newFormData.base_color);
        
        // Use functional update to ensure state is set correctly
        setFormData(prev => {
          console.log('Previous formData:', prev);
          console.log('New formData:', newFormData);
          return newFormData;
        });

        // Set current colors
        if (data.colors && Array.isArray(data.colors) && data.colors.length > 0) {
          console.log('Setting colors - count:', data.colors.length);
          const colorIds = data.colors.map(c => c.id?.toString()).filter(Boolean);
          setSelectedColorIds(colorIds);
          setCurrentColors(data.colors);
        } else {
          console.log('No colors in palette');
          setSelectedColorIds([]);
          setCurrentColors([]);
        }
      } catch (err) {
        console.error('=== ERROR FETCHING PALETTE ===');
        console.error('Error object:', err);
        console.error('Error message:', err.message);
        console.error('Error data:', err.data);
        setError(err.message || err.data?.message || 'Failed to load color palette');
      } finally {
        setLoading(false);
      }
    };

    console.log('About to call fetchData() and fetchAvailableColors()');
    
    // Call both functions - fetchAvailableColors is stable (useCallback with empty deps)
    fetchData();
    fetchAvailableColors();
    
    // Cleanup function
    return () => {
      console.log('useEffect cleanup');
    };
  }, [id, fetchAvailableColors]);


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
      setAvailableColors([...availableColors, newColor]);
      
      // Auto-select the new color
      setSelectedColorIds([...selectedColorIds, newColor.id.toString()]);
      
      // Update current colors display
      setCurrentColors([...currentColors, newColor]);
      
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

  const toggleColorSelection = (colorId) => {
    const idStr = colorId.toString();
    const color = availableColors.find(c => c.id.toString() === idStr);
    
    if (selectedColorIds.includes(idStr)) {
      setSelectedColorIds(selectedColorIds.filter(id => id !== idStr));
      setCurrentColors(currentColors.filter(c => c.id.toString() !== idStr));
    } else {
      setSelectedColorIds([...selectedColorIds, idStr]);
      if (color) {
        setCurrentColors([...currentColors, color]);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title) {
      setError('Please enter a title');
      return;
    }
    if (selectedColorIds.length === 0) {
      setError('Please select at least one color');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      await colorPalettesAPI.update(id, {
        title: formData.title,
        image: formData.image || null,
        base_color: formData.base_color || null,
        color_ids: selectedColorIds.map(id => parseInt(id))
      });
      navigate(-1);
    } catch (err) {
      setError(err.data?.message || err.message || 'Failed to update color palette');
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Filter colors based on search term
  const filteredColors = availableColors.filter((color) => {
    if (!colorSearchTerm) return true;
    const searchLower = colorSearchTerm.toLowerCase();
    const nameMatch = color.name?.toLowerCase().includes(searchLower);
    const hexMatch = color.hex?.toLowerCase().includes(searchLower);
    return nameMatch || hexMatch;
  });

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="text-slate-500 mb-2">Loading palette...</div>
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 max-w-md">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="mb-6">
          <h2 className="text-2xl font-semibold text-slate-800 font-venti mb-2">
            Edit Color Palette
          </h2>
          <p className="text-sm text-slate-600">
            Update the details and colors for this color palette
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Title *
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-offset-0 focus:border-transparent transition-all duration-200"
                style={{ focusRingColor: '#ea3663' }}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Base Color (optional)
              </label>
              <input
                type="text"
                name="base_color"
                value={formData.base_color}
                onChange={handleChange}
                className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-offset-0 focus:border-transparent transition-all duration-200"
                style={{ focusRingColor: '#ea3663' }}
                placeholder="e.g., Blue, an image, etc."
              />
            </div>
          </div>

          {/* Current Palette Preview */}
          {currentColors.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Current Palette ({currentColors.length} colors)
              </label>
              <div className="flex h-20 rounded-lg overflow-hidden border border-slate-200">
                {currentColors.map((color, index) => (
                  <div
                    key={color.id}
                    className="flex-1 relative group"
                    style={{ backgroundColor: color.hex || '#ccc' }}
                    title={color.name || color.hex}
                  >
                    <button
                      type="button"
                      onClick={() => toggleColorSelection(color.id)}
                      className="absolute inset-0 opacity-0 group-hover:opacity-100 bg-black bg-opacity-50 flex items-center justify-center transition-opacity"
                    >
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Color Selection */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-slate-700">
                Select Colors ({selectedColorIds.length} selected) *
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
              <div className="mb-4 p-4 bg-slate-50 rounded-lg border border-slate-200">
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
            <div className="mb-3">
              <div className="relative">
                <input
                  type="text"
                  value={colorSearchTerm}
                  onChange={(e) => setColorSearchTerm(e.target.value)}
                  placeholder="Search by name or hex (e.g., red or #FF5733)..."
                  className="w-full px-4 py-2 pl-10 border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-offset-0 focus:border-transparent transition-all duration-200"
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

            {loadingColors ? (
              <div className="text-center py-4 text-slate-500">Loading colors...</div>
            ) : filteredColors.length === 0 ? (
              <div className="text-center py-4 text-slate-500">
                {colorSearchTerm ? `No colors found matching "${colorSearchTerm}"` : 'No colors available. Add a color to get started.'}
              </div>
            ) : (
              <div className="max-h-60 overflow-y-auto border border-slate-200 rounded-lg p-2">
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                  {filteredColors.map((color) => (
                    <label
                      key={color.id}
                      className={`flex items-center space-x-2 p-2 rounded cursor-pointer transition-colors ${
                        selectedColorIds.includes(color.id.toString())
                          ? 'bg-slate-200 border-2 border-slate-300'
                          : 'hover:bg-slate-50 border-2 border-transparent'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedColorIds.includes(color.id.toString())}
                        onChange={() => toggleColorSelection(color.id)}
                        className="w-4 h-4 text-pink-600 border-slate-300 rounded focus:ring-pink-500 flex-shrink-0"
                      />
                      <div className="flex items-center space-x-2 flex-1 min-w-0">
                        <div
                          className="w-6 h-6 rounded border border-slate-300 flex-shrink-0"
                          style={{ backgroundColor: color.hex || '#ccc' }}
                        />
                        <span className="text-xs text-slate-700 truncate">
                          {color.name 
                            ? `${color.name} ${color.hex ? `(${color.hex})` : ''}` 
                            : (color.hex || `Color ${color.id}`)}
                        </span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            )}
            {selectedColorIds.length === 0 && (
              <div className="mt-2 text-sm text-amber-600">
                Please select at least one color for your palette.
              </div>
            )}
          </div>

          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="px-6 py-2.5 text-slate-700 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium hover:bg-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 text-white rounded-xl text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ backgroundColor: '#ea3663' }}
              onMouseEnter={(e) => !saving && (e.target.style.backgroundColor = '#d12a4f')}
              onMouseLeave={(e) => !saving && (e.target.style.backgroundColor = '#ea3663')}
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditColorPalette;
