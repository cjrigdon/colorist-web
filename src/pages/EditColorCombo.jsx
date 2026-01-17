import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { colorCombosAPI } from '../services/api';

const EditColorCombo = () => {
  const location = useLocation();
  const params = useParams();
  const navigate = useNavigate();
  
  // Extract ID from pathname since route uses pathname matching
  const pathname = location.pathname;
  const idFromPath = pathname.split('/edit/color-combo/')[1];
  const id = params.id || idFromPath;
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    image: ''
  });

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
        const response = await colorCombosAPI.getById(id);
        
        // API returns the JSON object directly from handleResponse
        // But check if it's wrapped in a data property
        let data = response;
        if (response && typeof response === 'object' && 'data' in response && !('id' in response)) {
          data = response.data;
        } else {
          data = response;
        }
        
        if (!data || typeof data !== 'object') {
          throw new Error('Invalid data received from server');
        }
        
        // Handle null/undefined values properly
        setFormData(prev => ({
          title: (data.title !== null && data.title !== undefined) ? String(data.title) : '',
          image: (data.image !== null && data.image !== undefined) ? String(data.image) : ''
        }));
      } catch (err) {
        setError(err.message || err.data?.message || 'Failed to load color combo');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      await colorCombosAPI.update(id, formData);
      navigate(-1);
    } catch (err) {
      setError(err.message || 'Failed to update color combo');
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

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="text-slate-500 mb-2">Loading color combo...</div>
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 max-w-md">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="mb-6">
          <h2 className="text-2xl font-semibold text-slate-800 font-venti mb-2">
            Edit Color Combo
          </h2>
          <p className="text-sm text-slate-600">
            Update the details for this color combination
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Title
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
              Image URL
            </label>
            <input
              type="url"
              name="image"
              value={formData.image}
              onChange={handleChange}
              className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-offset-0 focus:border-transparent transition-all duration-200"
              style={{ focusRingColor: '#ea3663' }}
            />
            {formData.image && (
              <div className="mt-3">
                <img
                  src={formData.image}
                  alt="Preview"
                  className="max-w-full h-48 object-cover rounded-lg border border-slate-200"
                  onError={(e) => {
                    e.target.style.display = 'none';
                  }}
                />
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

export default EditColorCombo;

