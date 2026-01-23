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
    thumb: '',
    thumbFile: null
  });
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState('all'); // 'all', 'pending', 'approved', 'rejected'
  const [hideCustom, setHideCustom] = useState(true);
  const [setSizes, setSetSizes] = useState([]);
  const [loadingSizes, setLoadingSizes] = useState(false);
  const [editingSize, setEditingSize] = useState(null);
  const [sizeFormData, setSizeFormData] = useState({
    count: '',
    name: '',
    thumb: '',
    thumbFile: null
  });
  const [showSizeModal, setShowSizeModal] = useState(false);

  useEffect(() => {
    fetchSets();
  }, [page, filter, hideCustom]);

  const fetchSets = async () => {
    try {
      setLoading(true);
      setError(null);
      let params = {};
      if (filter === 'pending') {
        params.is_approved = '0';
      } else if (filter === 'approved') {
        params.is_approved = '1';
      } else if (filter === 'system') {
        params.is_system = 'true';
      }
      const response = await adminAPI.pencilSets.getAll(page, perPage, params);
      // Handle Laravel pagination response structure
      let setsData = [];
      if (response.data && Array.isArray(response.data)) {
        setsData = response.data;
        if (response.meta) {
          setTotalPages(response.meta.last_page || 1);
        } else if (response.last_page) {
          setTotalPages(response.last_page);
        }
      } else if (Array.isArray(response)) {
        setsData = response;
      }
      
      // Filter out custom sets if hideCustom is true
      if (hideCustom) {
        setsData = setsData.filter(set => !set.is_custom);
      }
      
      setSets(setsData);
    } catch (err) {
      setError(err.message || 'Failed to load pencil sets');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = async (set) => {
    setEditingSet(set);
    setFormData({
      brand: set.brand || '',
      name: set.name || '',
      origin_country: set.origin_country || '',
      type: set.type || '',
      shopping_link: set.shopping_link || '',
      water_soluable: set.water_soluable || false,
      open_stock: set.open_stock || false,
      thumb: set.thumb || '',
      thumbFile: null
    });
    setShowModal(true);
    // Fetch set sizes
    await fetchSetSizes(set.id);
  };

  const fetchSetSizes = async (setId) => {
    try {
      setLoadingSizes(true);
      const response = await adminAPI.pencilSets.getSetSizes(setId);
      setSetSizes(Array.isArray(response) ? response : (response.data || []));
    } catch (err) {
      console.error('Error fetching set sizes:', err);
      setSetSizes([]);
    } finally {
      setLoadingSizes(false);
    }
  };

  const handleEditSize = (size) => {
    setEditingSize(size);
    setSizeFormData({
      count: size.count || '',
      name: size.name || '',
      thumb: size.thumb || '',
      thumbFile: null
    });
    setShowSizeModal(true);
  };

  const handleDeleteSize = async (sizeId) => {
    if (!window.confirm('Are you sure you want to delete this set size?')) {
      return;
    }

    try {
      await adminAPI.pencilSets.deleteSetSize(sizeId);
      if (editingSet) {
        await fetchSetSizes(editingSet.id);
      }
    } catch (err) {
      setError(err.message || 'Failed to delete set size');
    }
  };

  const handleSizeSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      // Prepare data - ensure count is a number if provided
      const submitData = {
        ...sizeFormData,
        count: sizeFormData.count ? parseInt(sizeFormData.count, 10) : sizeFormData.count
      };
      
      await adminAPI.pencilSets.updateSetSize(editingSize.id, submitData);
      setShowSizeModal(false);
      setEditingSize(null);
      setSizeFormData({
        count: '',
        name: '',
        thumb: '',
        thumbFile: null
      });
      if (editingSet) {
        await fetchSetSizes(editingSet.id);
      }
    } catch (err) {
      console.error('Error saving set size:', err);
      setError(err.message || err.data?.message || 'Failed to save set size');
    } finally {
      setSaving(false);
    }
  };

  const handleSizeChange = (e) => {
    const { name, value, files } = e.target;
    if (name === 'thumbFile' && files && files.length > 0) {
      setSizeFormData(prev => ({
        ...prev,
        thumbFile: files[0]
      }));
    } else {
      setSizeFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
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
        thumb: '',
        thumbFile: null
      });
      fetchSets();
    } catch (err) {
      setError(err.message || 'Failed to save pencil set');
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked, files } = e.target;
    if (name === 'thumbFile' && files && files.length > 0) {
      setFormData(prev => ({
        ...prev,
        thumbFile: files[0]
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    }
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

  const handleConvertToSystem = async (id) => {
    if (!window.confirm('Are you sure you want to convert this pencil set to a system set? It will become available to all users.')) {
      return;
    }

    try {
      setError(null);
      await adminAPI.pencilSets.convertToSystem(id);
      // Refresh the list after conversion
      await fetchSets();
    } catch (err) {
      console.error('Error converting set to system:', err);
      setError(err.data?.message || err.message || 'Failed to convert pencil set to system');
    }
  };

  return (
    <>
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-800">Manage Colored Pencil Sets</h1>
        <button
          onClick={handleNew}
          className="px-4 py-2 text-white rounded-lg font-medium transition-colors"
          style={{ backgroundColor: '#ea3663' }}
        >
          + Add New Set
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
          {error}
        </div>
      )}

      {/* Filters */}
      <div className="mb-4 flex items-center space-x-3">
        <div className="flex space-x-2">
          <button
            onClick={() => { setFilter('all'); setPage(1); }}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === 'all' ? 'text-white' : 'text-slate-600 hover:bg-slate-100'
            }`}
            style={filter === 'all' ? { backgroundColor: '#ea3663' } : {}}
          >
            All
          </button>
          <button
            onClick={() => { setFilter('system'); setPage(1); }}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === 'system' ? 'text-white' : 'text-slate-600 hover:bg-slate-100'
            }`}
            style={filter === 'system' ? { backgroundColor: '#ea3663' } : {}}
          >
            System Sets
          </button>
          <button
            onClick={() => { setFilter('pending'); setPage(1); }}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === 'pending' ? 'text-white' : 'text-slate-600 hover:bg-slate-100'
            }`}
            style={filter === 'pending' ? { backgroundColor: '#ea3663' } : {}}
          >
            Pending
          </button>
          <button
            onClick={() => { setFilter('approved'); setPage(1); }}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === 'approved' ? 'text-white' : 'text-slate-600 hover:bg-slate-100'
            }`}
            style={filter === 'approved' ? { backgroundColor: '#ea3663' } : {}}
          >
            Approved
          </button>
        </div>
        <label className="flex items-center space-x-2 px-3 py-1.5 bg-white border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50 transition-colors ml-auto">
          <input
            type="checkbox"
            checked={hideCustom}
            onChange={(e) => { setHideCustom(e.target.checked); setPage(1); }}
            className="w-4 h-4 text-pink-600 border-slate-300 rounded focus:ring-pink-500"
          />
          <span className="text-sm font-medium text-slate-700">Hide Custom</span>
        </label>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">

        {loading ? (
          <div className="text-center py-12 text-slate-500">Loading pencil sets...</div>
        ) : sets.length === 0 ? (
          <div className="text-center py-12 text-slate-500">No pencil sets found</div>
        ) : (
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
                    {set.is_custom === true || set.is_custom === 1 ? (
                      <span className="ml-2 px-2 py-0.5 text-xs font-medium text-purple-700 bg-purple-50 rounded">
                        Custom
                      </span>
                    ) : null}
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
                      {set.user_id !== null && set.user_id !== undefined && !set.is_approved && !set.is_custom && (
                        <button
                          onClick={() => handleApprove(set.id)}
                          className="px-3 py-1 text-xs font-medium text-green-700 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
                          title="Approve Set - Make visible to all users"
                        >
                          ✓ Approve
                        </button>
                      )}
                      {set.user_id !== null && set.user_id !== undefined && set.is_approved ? (
                        <button
                          onClick={() => handleReject(set.id)}
                          className="px-3 py-1 text-xs font-medium text-white bg-orange-600 rounded-lg hover:bg-orange-700 transition-colors shadow-sm"
                          title="Reject Set - Make visible only to creator"
                        >
                          ✗ Reject
                        </button>
                      ) : null}
                      {set.user_id !== null && set.user_id !== undefined ? (
                        <button
                          onClick={() => handleConvertToSystem(set.id)}
                          className="px-3 py-1 text-xs font-medium text-purple-700 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors"
                          title="Convert to System Set - Make available to all users"
                        >
                          Make System
                        </button>
                      ) : null}
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
        )}

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
                  {formData.thumb && !formData.thumbFile && (
                    <div className="mb-2">
                      <img 
                        src={formData.thumb.startsWith('http') ? formData.thumb : `${process.env.REACT_APP_API_BASE_URL?.replace('/api', '') || 'http://localhost:8000'}/storage/${formData.thumb}`}
                        alt="Current thumbnail"
                        className="w-24 h-24 object-cover rounded-lg mb-2"
                      />
                    </div>
                  )}
                  <input
                    type="file"
                    name="thumbFile"
                    accept="image/jpeg,image/png,image/jpg"
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-offset-0 focus:border-transparent transition-all duration-200"
                  />
                  {formData.thumbFile && (
                    <p className="mt-1 text-xs text-green-600 font-medium">
                      ✓ File selected: {formData.thumbFile.name}
                    </p>
                  )}
                  <p className="mt-1 text-xs text-slate-500">Upload a thumbnail image (JPG, PNG, max 2MB)</p>
                  {!formData.thumbFile && (
                    <div className="mt-2">
                      <input
                        type="text"
                        name="thumb"
                        value={formData.thumb}
                        onChange={handleChange}
                        placeholder="Or enter thumbnail URL"
                        className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-offset-0 focus:border-transparent transition-all duration-200"
                      />
                    </div>
                  )}
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

                {/* Set Sizes Section */}
                {editingSet && (
                  <div className="pt-4 border-t border-slate-200">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-lg font-semibold text-slate-800 font-venti">Set Sizes</h4>
                    </div>
                    <div className="h-64 overflow-y-auto">
                      {loadingSizes ? (
                        <div className="text-center py-4 text-slate-500 text-sm">Loading sizes...</div>
                      ) : setSizes.length === 0 ? (
                        <div className="text-center py-4 text-slate-500 text-sm">No set sizes found</div>
                      ) : (
                        <div className="space-y-2">
                          {setSizes.map((size) => {
                            const thumbnailUrl = size.thumb 
                              ? (size.thumb.startsWith('http') ? size.thumb : `${process.env.REACT_APP_API_BASE_URL?.replace('/api', '') || 'http://localhost:8000'}/storage/${size.thumb}`)
                              : null;
                            return (
                              <div key={size.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200">
                                <div className="flex items-center gap-3 flex-1">
                                  {thumbnailUrl ? (
                                    <img 
                                      src={thumbnailUrl} 
                                      alt={`${size.count}-count set`}
                                      className="w-12 h-12 object-cover rounded-lg"
                                    />
                                  ) : (
                                    <div className="w-12 h-12 bg-slate-200 rounded-lg flex items-center justify-center">
                                      <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                      </svg>
                                    </div>
                                  )}
                                  <div className="flex-1">
                                    <div className="font-medium text-slate-800">
                                      {size.count}-count {size.name ? `(${size.name})` : ''}
                                    </div>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <button
                                    type="button"
                                    onClick={() => handleEditSize(size)}
                                    className="px-3 py-1 text-xs font-medium text-blue-700 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                                  >
                                    Edit
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteSize(size.id)}
                                    className="px-3 py-1 text-xs font-medium text-red-700 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
                                  >
                                    Delete
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      setEditingSet(null);
                      setSetSizes([]);
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

    {/* Modal for Edit Set Size */}
    {showSizeModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-lg max-w-lg w-full mx-4">
              <div className="p-6">
                <h3 className="text-xl font-semibold text-slate-800 font-venti mb-4">
                  Edit Set Size
                </h3>
                <form onSubmit={handleSizeSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Count *
                    </label>
                    <input
                      type="number"
                      name="count"
                      value={sizeFormData.count}
                      onChange={handleSizeChange}
                      className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-offset-0 focus:border-transparent transition-all duration-200"
                      required
                      min="1"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Name
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={sizeFormData.name}
                      onChange={handleSizeChange}
                      className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-offset-0 focus:border-transparent transition-all duration-200"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Thumbnail
                    </label>
                    {sizeFormData.thumb && !sizeFormData.thumbFile && (
                      <div className="mb-2">
                        <img 
                          src={sizeFormData.thumb.startsWith('http') ? sizeFormData.thumb : `${process.env.REACT_APP_API_BASE_URL?.replace('/api', '') || 'http://localhost:8000'}/storage/${sizeFormData.thumb}`}
                          alt="Current thumbnail"
                          className="w-24 h-24 object-cover rounded-lg mb-2"
                        />
                      </div>
                    )}
                    <input
                      type="file"
                      name="thumbFile"
                      accept="image/jpeg,image/png,image/jpg"
                      onChange={handleSizeChange}
                      className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-offset-0 focus:border-transparent transition-all duration-200"
                    />
                    {sizeFormData.thumbFile && (
                      <p className="mt-1 text-xs text-green-600 font-medium">
                        ✓ File selected: {sizeFormData.thumbFile.name}
                      </p>
                    )}
                    <p className="mt-1 text-xs text-slate-500">Upload a new thumbnail image (JPG, PNG, max 2MB)</p>
                  </div>
                  <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-200">
                    <button
                      type="button"
                      onClick={() => {
                        setShowSizeModal(false);
                        setEditingSize(null);
                        setSizeFormData({
                          count: '',
                          name: '',
                          thumb: '',
                          thumbFile: null
                        });
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
    </>
  );
};

export default AdminPencilSets;

