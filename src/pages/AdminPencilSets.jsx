import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminAPI } from '../services/api';

const AdminPencilSets = () => {
  const navigate = useNavigate();
  const [sets, setSets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [perPage] = useState(15);
  const [totalPages, setTotalPages] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [editingSet, setEditingSet] = useState(null);
  const [formData, setFormData] = useState({
    brand: '',
    name: '',
    origin_country: '',
    type: '',
    shopping_link: '',
    water_soluable: false,
    open_stock: false,
    thumb: ''
  });
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState('all'); // 'all', 'pending', 'approved', 'rejected'

  useEffect(() => {
    fetchSets();
  }, [page, filter]);

  const fetchSets = async () => {
    try {
      setLoading(true);
      setError(null);
      let params = {};
      if (filter === 'pending') {
        params.is_approved = '0';
      } else if (filter === 'approved') {
        params.is_approved = '1';
      }
      const response = await adminAPI.pencilSets.getAll(page, perPage, params);
      // Handle Laravel pagination response structure
      if (response.data && Array.isArray(response.data)) {
        setSets(response.data);
        if (response.meta) {
          setTotalPages(response.meta.last_page || 1);
        } else if (response.last_page) {
          setTotalPages(response.last_page);
        }
      } else if (Array.isArray(response)) {
        setSets(response);
      } else {
        setSets([]);
      }
    } catch (err) {
      setError(err.message || 'Failed to load pencil sets');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (set) => {
    setEditingSet(set);
    setFormData({
      brand: set.brand || '',
      name: set.name || '',
      origin_country: set.origin_country || '',
      type: set.type || '',
      shopping_link: set.shopping_link || '',
      water_soluable: set.water_soluable || false,
      open_stock: set.open_stock || false,
      thumb: set.thumb || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this pencil set?')) {
      return;
    }

    try {
      await adminAPI.pencilSets.delete(id);
      fetchSets();
    } catch (err) {
      setError(err.message || 'Failed to delete pencil set');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      if (editingSet) {
        await adminAPI.pencilSets.update(editingSet.id, formData);
      } else {
        await adminAPI.pencilSets.create(formData);
      }
      setShowModal(false);
      setEditingSet(null);
      setFormData({
        brand: '',
        name: '',
        origin_country: '',
        type: '',
        shopping_link: '',
        water_soluable: false,
        open_stock: false,
        thumb: ''
      });
      fetchSets();
    } catch (err) {
      setError(err.message || 'Failed to save pencil set');
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

  const handleNew = () => {
    setEditingSet(null);
    setFormData({
      brand: '',
      name: '',
      origin_country: '',
      type: '',
      shopping_link: '',
      water_soluable: false,
      open_stock: false,
      thumb: ''
    });
    setShowModal(true);
  };

  const handleManagePencils = (setId) => {
    navigate(`/admin/pencils?setId=${setId}`);
  };

  const handleApprove = async (id) => {
    if (!window.confirm('Are you sure you want to approve this pencil set? It will become visible to all users.')) {
      return;
    }

    try {
      setError(null);
      await adminAPI.pencilSets.approve(id);
      // Refresh the list after approval
      await fetchSets();
    } catch (err) {
      console.error('Error approving set:', err);
      setError(err.data?.message || err.message || 'Failed to approve pencil set');
    }
  };

  const handleReject = async (id) => {
    if (!window.confirm('Are you sure you want to reject this pencil set? It will only be visible to the user who created it.')) {
      return;
    }

    try {
      setError(null);
      await adminAPI.pencilSets.reject(id);
      // Refresh the list after rejection
      await fetchSets();
    } catch (err) {
      console.error('Error rejecting set:', err);
      setError(err.data?.message || err.message || 'Failed to reject pencil set');
    }
  };

  if (loading && sets.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-slate-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-slate-800 font-venti mb-2">
              Manage Colored Pencil Sets
            </h2>
            <p className="text-sm text-slate-600">
              Add, edit, delete, and approve colored pencil sets
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2 bg-slate-100 rounded-lg p-1">
              <button
                onClick={() => setFilter('all')}
                className={`px-3 py-1.5 text-sm font-medium rounded transition-colors ${
                  filter === 'all'
                    ? 'text-white'
                    : 'text-slate-600 hover:text-slate-800'
                }`}
                style={filter === 'all' ? { backgroundColor: '#ea3663' } : {}}
              >
                All
              </button>
              <button
                onClick={() => setFilter('pending')}
                className={`px-3 py-1.5 text-sm font-medium rounded transition-colors ${
                  filter === 'pending'
                    ? 'text-white'
                    : 'text-slate-600 hover:text-slate-800'
                }`}
                style={filter === 'pending' ? { backgroundColor: '#ea3663' } : {}}
              >
                Pending
              </button>
              <button
                onClick={() => setFilter('approved')}
                className={`px-3 py-1.5 text-sm font-medium rounded transition-colors ${
                  filter === 'approved'
                    ? 'text-white'
                    : 'text-slate-600 hover:text-slate-800'
                }`}
                style={filter === 'approved' ? { backgroundColor: '#ea3663' } : {}}
              >
                Approved
              </button>
            </div>
            <button
              onClick={handleNew}
              className="px-4 py-2 text-white rounded-xl text-sm font-medium transition-colors"
              style={{ backgroundColor: '#ea3663' }}
              onMouseEnter={(e) => (e.target.style.backgroundColor = '#d12a4f')}
              onMouseLeave={(e) => (e.target.style.backgroundColor = '#ea3663')}
            >
              + Add New Set
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Brand</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Name</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Type</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Origin</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Status</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">User</th>
                <th className="text-center py-3 px-4 text-sm font-semibold text-slate-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {sets.map((set) => (
                <tr key={set.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="py-3 px-4 text-sm text-slate-800">{set.brand}</td>
                  <td className="py-3 px-4 text-sm text-slate-800">
                    {set.name}
                    {set.is_custom && (
                      <span className="ml-2 px-2 py-0.5 text-xs font-medium text-purple-700 bg-purple-50 rounded">
                        Custom
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-sm text-slate-600">{set.type}</td>
                  <td className="py-3 px-4 text-sm text-slate-600">{set.origin_country}</td>
                  <td className="py-3 px-4">
                    {set.user_id ? (
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded ${
                          set.is_approved
                            ? 'text-green-700 bg-green-50'
                            : 'text-orange-700 bg-orange-50'
                        }`}
                      >
                        {set.is_approved ? 'Approved' : 'Pending'}
                      </span>
                    ) : (
                      <span className="px-2 py-1 text-xs font-medium text-blue-700 bg-blue-50 rounded">
                        System
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-sm text-slate-600">
                    {set.user_id ? `User #${set.user_id}` : '-'}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center justify-center space-x-2 flex-wrap">
                      {set.user_id !== null && set.user_id !== undefined && !set.is_approved && (
                        <button
                          onClick={() => handleApprove(set.id)}
                          className="px-3 py-1 text-xs font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors shadow-sm"
                          title="Approve Set - Make visible to all users"
                        >
                          ✓ Approve
                        </button>
                      )}
                      {set.user_id !== null && set.user_id !== undefined && set.is_approved && (
                        <button
                          onClick={() => handleReject(set.id)}
                          className="px-3 py-1 text-xs font-medium text-white bg-orange-600 rounded-lg hover:bg-orange-700 transition-colors shadow-sm"
                          title="Reject Set - Make visible only to creator"
                        >
                          ✗ Reject
                        </button>
                      )}
                      <button
                        onClick={() => handleManagePencils(set.id)}
                        className="px-3 py-1 text-xs font-medium text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
                        title="Manage Pencils"
                      >
                        Pencils
                      </button>
                      <button
                        onClick={() => handleEdit(set)}
                        className="px-3 py-1 text-xs font-medium text-blue-700 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(set.id)}
                        className="px-3 py-1 text-xs font-medium text-red-700 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="mt-6 flex items-center justify-center space-x-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <span className="px-4 py-2 text-sm text-slate-600">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        )}
      </div>

      {/* Modal for Add/Edit */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h3 className="text-xl font-semibold text-slate-800 font-venti mb-4">
                {editingSet ? 'Edit Pencil Set' : 'Add New Pencil Set'}
              </h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Brand *
                  </label>
                  <input
                    type="text"
                    name="brand"
                    value={formData.brand}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-offset-0 focus:border-transparent transition-all duration-200"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-offset-0 focus:border-transparent transition-all duration-200"
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
                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-offset-0 focus:border-transparent transition-all duration-200"
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
                    Thumbnail
                  </label>
                  <input
                    type="text"
                    name="thumb"
                    value={formData.thumb}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-offset-0 focus:border-transparent transition-all duration-200"
                  />
                </div>
                <div className="flex items-center space-x-6">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      name="water_soluable"
                      checked={formData.water_soluable}
                      onChange={handleChange}
                      className="w-4 h-4 text-pink-600 border-slate-300 rounded focus:ring-2 focus:ring-pink-500"
                    />
                    <span className="text-sm font-medium text-slate-700">Water Soluble</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      name="open_stock"
                      checked={formData.open_stock}
                      onChange={handleChange}
                      className="w-4 h-4 text-pink-600 border-slate-300 rounded focus:ring-2 focus:ring-pink-500"
                    />
                    <span className="text-sm font-medium text-slate-700">Open Stock</span>
                  </label>
                </div>
                <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      setEditingSet(null);
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

export default AdminPencilSets;

