import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { coloredPencilSetsAPI } from '../services/api';

const EditPencilSet = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [isSystemSet, setIsSystemSet] = useState(false);
  const [formData, setFormData] = useState({
    brand: '',
    name: '',
    origin_country: '',
    type: '',
    shopping_link: '',
    water_soluable: false,
    open_stock: false
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await coloredPencilSetsAPI.getById(id);
        const data = response.data || response;
        
        // Check if this is a system set (user_id is null)
        const systemSet = data.user_id === null || data.user_id === undefined;
        setIsSystemSet(systemSet);
        
        if (systemSet) {
          setError('This is a system pencil set and cannot be edited. You can add system sets to your collection, but only administrators can modify them.');
        }
        
        setFormData({
          brand: data.brand || '',
          name: data.name || '',
          origin_country: data.origin_country || '',
          type: data.type || '',
          shopping_link: data.shopping_link || '',
          water_soluable: data.water_soluable || false,
          open_stock: data.open_stock || false
        });
      } catch (err) {
        setError(err.message || 'Failed to load pencil set');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchData();
    }
  }, [id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Prevent submission if it's a system set
    if (isSystemSet) {
      setError('Cannot edit system pencil sets. Only administrators can modify system sets.');
      return;
    }
    
    setSaving(true);
    setError(null);

    try {
      // Include id in the request body in case backend needs it
      await coloredPencilSetsAPI.update(id, { ...formData, id: parseInt(id) });
      navigate(-1);
    } catch (err) {
      setError(err.message || 'Failed to update pencil set');
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
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
        <div className="text-slate-500 mb-2">Loading...</div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white shadow-sm p-6">
        <div className="mb-6">
          <h2 className="text-2xl font-semibold text-slate-800 font-venti mb-2">
            Edit Pencil Set
          </h2>
          <p className="text-sm text-slate-600">
            Update the details for this colored pencil set
          </p>
        </div>

        {error && (
          <div className={`border rounded-lg p-4 mb-6 ${
            isSystemSet 
              ? 'bg-amber-50 border-amber-200' 
              : 'bg-red-50 border-red-200'
          }`}>
            <p className={`text-sm ${
              isSystemSet 
                ? 'text-amber-800' 
                : 'text-red-600'
            }`}>{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Brand
            </label>
            <input
              type="text"
              name="brand"
              value={formData.brand}
              onChange={handleChange}
              disabled={isSystemSet}
              className={`w-full px-4 py-2.5 border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-offset-0 focus:border-transparent transition-all duration-200 ${
                isSystemSet ? 'bg-slate-100 cursor-not-allowed' : 'bg-white'
              }`}
              style={{ focusRingColor: '#ea3663' }}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Name
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              disabled={isSystemSet}
              className={`w-full px-4 py-2.5 border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-offset-0 focus:border-transparent transition-all duration-200 ${
                isSystemSet ? 'bg-slate-100 cursor-not-allowed' : 'bg-white'
              }`}
              style={{ focusRingColor: '#ea3663' }}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Origin Country
            </label>
            <input
              type="text"
              name="origin_country"
              value={formData.origin_country}
              onChange={handleChange}
              disabled={isSystemSet}
              className={`w-full px-4 py-2.5 border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-offset-0 focus:border-transparent transition-all duration-200 ${
                isSystemSet ? 'bg-slate-100 cursor-not-allowed' : 'bg-white'
              }`}
              style={{ focusRingColor: '#ea3663' }}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Type
            </label>
            <input
              type="text"
              name="type"
              value={formData.type}
              onChange={handleChange}
              disabled={isSystemSet}
              className={`w-full px-4 py-2.5 border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-offset-0 focus:border-transparent transition-all duration-200 ${
                isSystemSet ? 'bg-slate-100 cursor-not-allowed' : 'bg-white'
              }`}
              style={{ focusRingColor: '#ea3663' }}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Shopping Link
            </label>
            <input
              type="url"
              name="shopping_link"
              value={formData.shopping_link}
              onChange={handleChange}
              disabled={isSystemSet}
              className={`w-full px-4 py-2.5 border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-offset-0 focus:border-transparent transition-all duration-200 ${
                isSystemSet ? 'bg-slate-100 cursor-not-allowed' : 'bg-white'
              }`}
              style={{ focusRingColor: '#ea3663' }}
            />
          </div>

          <div className="flex items-center space-x-6">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                name="water_soluable"
                checked={formData.water_soluable}
                onChange={handleChange}
                disabled={isSystemSet}
                className="w-4 h-4 text-pink-600 border-slate-300 rounded focus:ring-2 focus:ring-pink-500 disabled:opacity-50 disabled:cursor-not-allowed"
              />
              <span className="text-sm font-medium text-slate-700">Water Soluble</span>
            </label>

            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                name="open_stock"
                checked={formData.open_stock}
                onChange={handleChange}
                disabled={isSystemSet}
                className="w-4 h-4 text-pink-600 border-slate-300 rounded focus:ring-2 focus:ring-pink-500 disabled:opacity-50 disabled:cursor-not-allowed"
              />
              <span className="text-sm font-medium text-slate-700">Open Stock</span>
            </label>
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
              disabled={saving || isSystemSet}
              className="px-6 py-2.5 text-white rounded-xl text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ backgroundColor: '#ea3663' }}
              onMouseEnter={(e) => !saving && !isSystemSet && (e.target.style.backgroundColor = '#d12a4f')}
              onMouseLeave={(e) => !saving && !isSystemSet && (e.target.style.backgroundColor = '#ea3663')}
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditPencilSet;

