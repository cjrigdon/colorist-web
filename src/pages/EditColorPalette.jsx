import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { colorPalettesAPI, colorsAPI } from '../services/api';
import DeleteConfirmationModal from '../components/DeleteConfirmationModal';
import PaletteColorPicker from '../components/PaletteColorPicker';

const EditColorPalette = () => {
  const location = useLocation();
  const params = useParams();
  const navigate = useNavigate();
  
  // Extract ID from pathname since route uses pathname matching
  const pathname = location.pathname;
  const idFromPath = pathname.split('/edit/color-palette/')[1];
  const id = params.id || idFromPath;
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    image: ''
  });
  const [availableColors, setAvailableColors] = useState([]);
  const [loadingColors, setLoadingColors] = useState(false);
  const [selectedColors, setSelectedColors] = useState([]);
  const [customColors, setCustomColors] = useState([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

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
    // Early return if no ID
    if (!id) {
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await colorPalettesAPI.getById(id);
        
        // API returns the JSON object directly from handleResponse
        // But check if it's wrapped in a data property (some APIs do this)
        let data = response;
        if (response && typeof response === 'object' && 'data' in response && !('id' in response)) {
          // Response is wrapped in data property
          data = response.data;
        } else {
          // Response is the data directly
          data = response;
        }
        
        if (!data || typeof data !== 'object') {
          console.error('Invalid data type:', typeof data, data);
          throw new Error('Invalid data received from server');
        }
        
        // Extract form data - handle null/undefined values properly
        const title = (data.title !== null && data.title !== undefined) ? String(data.title) : '';
        const image = (data.image !== null && data.image !== undefined) ? String(data.image) : '';
        
        const newFormData = {
          title: title,
          image: image
        };
        
        // Use functional update to ensure state is set correctly
        setFormData(prev => newFormData);

        setSelectedColors(Array.isArray(data.colors) ? data.colors.filter(c => c?.id) : []);
        setCustomColors(Array.isArray(data.custom_colors) ? data.custom_colors : []);
      } catch (err) {
        console.error('Error fetching palette:', err);
        setError(err.message || err.data?.message || 'Failed to load color palette');
      } finally {
        setLoading(false);
      }
    };
    
    // Call both functions - fetchAvailableColors is stable (useCallback with empty deps)
    fetchData();
    fetchAvailableColors();
  }, [id, fetchAvailableColors]);


  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title) {
      setError('Please enter a title');
      return;
    }
    if (selectedColors.length + customColors.length === 0) {
      setError('Please add at least one color');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      await colorPalettesAPI.update(id, {
        title: formData.title,
        image: formData.image || null,
        color_ids: selectedColors.map(color => color.id),
        custom_colors: customColors
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

  const handleDelete = async () => {
    if (!id) return;
    
    setDeleting(true);
    setError(null);
    
    try {
      await colorPalettesAPI.delete(id);
      navigate(-1);
    } catch (err) {
      setError(err.data?.message || err.message || 'Failed to delete color palette');
      setDeleting(false);
      setShowDeleteModal(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="modern-loader mb-4">
          <div className="loader-ring">
            <div className="loader-ring-segment"></div>
            <div className="loader-ring-segment"></div>
            <div className="loader-ring-segment"></div>
            <div className="loader-ring-segment"></div>
          </div>
        </div>
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
      {/* Header Section */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-slate-800 font-venti mb-2">
            Edit Color Palette
          </h2>
          <p className="text-sm text-slate-600">
            Update the details and colors for this color palette
          </p>
        </div>
        {/* Action Buttons Group */}
        <div className="flex items-center space-x-3">
          <button
            type="button"
            onClick={() => setShowDeleteModal(true)}
            disabled={deleting}
            className="px-6 py-2.5 text-red-700 bg-red-50 border border-red-200 rounded-xl text-sm font-medium hover:bg-red-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Delete
          </button>
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="px-6 py-2.5 text-slate-700 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium hover:bg-white transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              const form = document.getElementById('edit-color-palette-form');
              if (form) {
                form.requestSubmit();
              }
            }}
            disabled={saving}
            className="px-6 py-2.5 text-white rounded-xl text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ backgroundColor: '#ea3663' }}
            onMouseEnter={(e) => !saving && (e.target.style.backgroundColor = '#d12a4f')}
            onMouseLeave={(e) => !saving && (e.target.style.backgroundColor = '#ea3663')}
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>

      {/* White Container */}
      <div className="bg-white shadow-sm p-6">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        <form id="edit-color-palette-form" onSubmit={handleSubmit} className="space-y-6">
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
          <PaletteColorPicker
            availableColors={availableColors}
            loadingColors={loadingColors}
            selectedColors={selectedColors}
            onSelectedColorsChange={setSelectedColors}
            customColors={customColors}
            onCustomColorsChange={setCustomColors}
          />
        </form>
      </div>

      <DeleteConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
        itemName={formData.title || 'Color Palette'}
        itemType="color palette"
      />
    </div>
  );
};

export default EditColorPalette;
