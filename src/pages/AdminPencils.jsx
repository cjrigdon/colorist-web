import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { adminAPI, coloredPencilSetsAPI } from '../services/api';
import DropdownMenu from '../components/DropdownMenu';

const AdminPencils = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const setId = searchParams.get('setId');
  const [pencils, setPencils] = useState([]);
  const [sets, setSets] = useState([]);
  const [selectedSetId, setSelectedSetId] = useState(setId || '');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingPencil, setEditingPencil] = useState(null);
  const [formData, setFormData] = useState({
    colored_pencil_set_id: '',
    color_number: '',
    color_name: '',
    hex: '',
    lightfast_rating: '',
    shopping_link: '',
    barcode: ''
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSets();
  }, []);

  useEffect(() => {
    if (selectedSetId) {
      fetchPencils();
    } else {
      setPencils([]);
    }
  }, [selectedSetId]);

  const fetchSets = async () => {
    try {
      const response = await coloredPencilSetsAPI.getAllSets(1, 1000);
      // Handle response structure
      if (response.data && Array.isArray(response.data)) {
        setSets(response.data);
      } else if (Array.isArray(response)) {
        setSets(response);
      } else {
        setSets([]);
      }
      if (setId && !selectedSetId) {
        setSelectedSetId(setId);
      }
    } catch (err) {
      setError(err.message || 'Failed to load pencil sets');
    }
  };

  const fetchPencils = async () => {
    if (!selectedSetId) return;
    
    try {
      setLoading(true);
      setError(null);
      const response = await adminAPI.pencilSets.getPencils(selectedSetId);
      // Handle response structure
      if (response.data && Array.isArray(response.data)) {
        setPencils(response.data);
      } else if (Array.isArray(response)) {
        setPencils(response);
      } else {
        setPencils([]);
      }
    } catch (err) {
      setError(err.message || 'Failed to load pencils');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (pencil) => {
    setEditingPencil(pencil);
    setFormData({
      colored_pencil_set_id: pencil.colored_pencil_set_id || selectedSetId,
      color_number: pencil.color_number || '',
      color_name: pencil.color_name || '',
      hex: pencil.color?.hex || '',
      lightfast_rating: pencil.lightfast_rating || '',
      shopping_link: pencil.shopping_link || '',
      barcode: pencil.barcode || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this pencil?')) {
      return;
    }

    try {
      await adminAPI.pencils.delete(id);
      fetchPencils();
    } catch (err) {
      setError(err.message || 'Failed to delete pencil');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      // Prepare data - convert empty color_number to null
      const submitData = {
        ...formData,
        color_number: formData.color_number === '' ? null : formData.color_number
      };

      if (editingPencil) {
        await adminAPI.pencils.update(editingPencil.id, submitData);
      } else {
        await adminAPI.pencils.create(submitData);
      }
      setShowModal(false);
      setEditingPencil(null);
      setFormData({
        colored_pencil_set_id: selectedSetId,
        color_number: '',
        color_name: '',
        hex: '',
        lightfast_rating: '',
        shopping_link: '',
        barcode: ''
      });
      fetchPencils();
    } catch (err) {
      setError(err.message || 'Failed to save pencil');
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseInt(value) || 0 : value
    }));
  };

  const handleNew = () => {
    setEditingPencil(null);
    setFormData({
      colored_pencil_set_id: selectedSetId,
      color_number: '',
      color_name: '',
      hex: '',
      lightfast_rating: '',
      shopping_link: ''
    });
    setShowModal(true);
  };

  const selectedSet = sets.find(s => s.id === parseInt(selectedSetId));

  return (
    <div className="max-w-7xl mx-auto">
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-slate-800 font-venti mb-2">
              Manage Colored Pencils
            </h2>
            <p className="text-sm text-slate-600">
              Add, edit, and delete colored pencils within sets
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="w-64">
              <DropdownMenu
                options={[
                  { value: '', label: 'Select a set...' },
                  ...sets.map((set) => ({
                    value: set.id.toString(),
                    label: `${set.brand} - ${set.name}`
                  }))
                ]}
                value={selectedSetId}
                onChange={(value) => {
                  setSelectedSetId(value);
                  navigate(`/admin/pencils?setId=${value}`);
                }}
                placeholder="Select a set..."
              />
            </div>
            {selectedSetId && (
              <button
                onClick={handleNew}
                className="px-4 py-2 text-white rounded-xl text-sm font-medium transition-colors"
                style={{ backgroundColor: '#ea3663' }}
                onMouseEnter={(e) => (e.target.style.backgroundColor = '#d12a4f')}
                onMouseLeave={(e) => (e.target.style.backgroundColor = '#ea3663')}
              >
                + Add New Pencil
              </button>
            )}
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {selectedSet && (
          <div className="mb-4 p-4 bg-slate-50 rounded-lg border border-slate-200">
            <p className="text-sm text-slate-700">
              <span className="font-semibold">Set:</span> {selectedSet.brand} - {selectedSet.name}
            </p>
          </div>
        )}

        {!selectedSetId ? (
          <div className="text-center py-12">
            <p className="text-slate-500">Please select a pencil set to manage pencils</p>
          </div>
        ) : loading ? (
          <div className="text-center py-12">
            <p className="text-slate-500">Loading...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Color #</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Color Name</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Hex</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Lightfast</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Barcode</th>
                  <th className="text-center py-3 px-4 text-sm font-semibold text-slate-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {pencils.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="py-8 text-center text-slate-500">
                      No pencils found for this set
                    </td>
                  </tr>
                ) : (
                  pencils.map((pencil) => (
                    <tr key={pencil.id} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="py-3 px-4 text-sm text-slate-800">{pencil.color_number || '-'}</td>
                      <td className="py-3 px-4 text-sm text-slate-800">{pencil.color_name}</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-2">
                          {pencil.color?.hex && (
                            <>
                              <div
                                className="w-6 h-6 rounded border border-slate-300"
                                style={{ backgroundColor: pencil.color.hex }}
                              />
                              <span className="text-sm text-slate-600">{pencil.color.hex}</span>
                            </>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-sm text-slate-600">{pencil.lightfast_rating}</td>
                      <td className="py-3 px-4 text-sm text-slate-600">{pencil.barcode || '-'}</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-center space-x-2">
                          <button
                            onClick={() => handleEdit(pencil)}
                            className="px-3 py-1 text-xs font-medium text-blue-700 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(pencil.id)}
                            className="px-3 py-1 text-xs font-medium text-red-700 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal for Add/Edit */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h3 className="text-xl font-semibold text-slate-800 font-venti mb-4">
                {editingPencil ? 'Edit Pencil' : 'Add New Pencil'}
              </h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <DropdownMenu
                    label="Pencil Set *"
                    options={[
                      { value: '', label: 'Select a set...' },
                      ...sets.map((set) => ({
                        value: set.id.toString(),
                        label: `${set.brand} - ${set.name}`
                      }))
                    ]}
                    value={formData.colored_pencil_set_id ? formData.colored_pencil_set_id.toString() : ''}
                    onChange={(value) => {
                      handleChange({
                        target: {
                          name: 'colored_pencil_set_id',
                          value: value === '' ? '' : parseInt(value)
                        }
                      });
                    }}
                    placeholder="Select a set..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Color Number
                  </label>
                  <input
                    type="text"
                    name="color_number"
                    value={formData.color_number}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-offset-0 focus:border-transparent transition-all duration-200"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Color Name *
                  </label>
                  <input
                    type="text"
                    name="color_name"
                    value={formData.color_name}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-offset-0 focus:border-transparent transition-all duration-200"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Hex Color *
                  </label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      name="hex"
                      value={formData.hex}
                      onChange={handleChange}
                      placeholder="#FF0000"
                      className="flex-1 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-offset-0 focus:border-transparent transition-all duration-200"
                      required
                    />
                    {formData.hex && (
                      <div
                        className="w-12 h-12 rounded border border-slate-300"
                        style={{ backgroundColor: formData.hex }}
                      />
                    )}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Lightfast Rating
                  </label>
                  <input
                    type="text"
                    name="lightfast_rating"
                    value={formData.lightfast_rating}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-offset-0 focus:border-transparent transition-all duration-200"
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
                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-offset-0 focus:border-transparent transition-all duration-200"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Barcode
                  </label>
                  <input
                    type="text"
                    name="barcode"
                    value={formData.barcode}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-offset-0 focus:border-transparent transition-all duration-200"
                  />
                </div>
                <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      setEditingPencil(null);
                    }}
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
                    {saving ? 'Saving...' : 'Save'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPencils;

