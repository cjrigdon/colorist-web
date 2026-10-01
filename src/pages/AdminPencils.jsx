import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { adminAPI } from '../services/api';
import DropdownMenu from '../components/DropdownMenu';

const AdminPencils = () => {
  const [searchParams] = useSearchParams();
  const setId = searchParams.get('setId');
  const [pencils, setPencils] = useState([]);
  const [setDetails, setSetDetails] = useState(null);
  const [setSizes, setSetSizes] = useState([]);
  const [selectedSizeId, setSelectedSizeId] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(15);
  const [sortField, setSortField] = useState('color_name');
  const [sortDirection, setSortDirection] = useState('asc');
  const [totalPages, setTotalPages] = useState(1);
  const [totalPencils, setTotalPencils] = useState(0);
  const [selectedPencilIds, setSelectedPencilIds] = useState(() => new Set());
  const [showSizeModal, setShowSizeModal] = useState(false);
  const [newSizeName, setNewSizeName] = useState('');
  const [newSizeCount, setNewSizeCount] = useState('');
  const [creatingSize, setCreatingSize] = useState(false);
  const [sizeError, setSizeError] = useState(null);
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
    if (setId) {
      fetchSetDetails();
      fetchSetSizes();
    } else {
      setLoading(false);
    }
  }, [setId]);

  useEffect(() => {
    if (setId && selectedSizeId) {
      fetchPencils();
    } else {
      setPencils([]);
      setTotalPages(1);
      setTotalPencils(0);
    }
  }, [setId, selectedSizeId, page, perPage, sortField, sortDirection]);

  useEffect(() => {
    setSelectedPencilIds(new Set());
  }, [selectedSizeId]);

  const fetchSetDetails = async () => {
    if (!setId) return;
    try {
      const response = await adminAPI.pencilSets.getById(setId);
      setSetDetails(response);
    } catch (err) {
      setError(err.message || 'Failed to load set');
      setLoading(false);
    }
  };

  const fetchSetSizes = async (sizeIdToSelect = null) => {
    if (!setId) return;
    try {
      const response = await adminAPI.pencilSets.getSetSizes(setId);
      const sizes = Array.isArray(response) ? response : response.data || [];
      setSetSizes(sizes);
      if (sizeIdToSelect) {
        setSelectedSizeId(sizeIdToSelect.toString());
        setPage(1);
      } else {
        setSelectedSizeId((prev) => (prev ? prev : sizes[0] ? sizes[0].id.toString() : ''));
      }
      if (sizes.length === 0) setLoading(false);
    } catch (err) {
      setError(err.message || 'Failed to load set sizes');
      setLoading(false);
    }
  };

  // A silent refresh keeps the current table rendered so the scroll position isn't lost
  const fetchPencils = async ({ silent = false } = {}) => {
    if (!selectedSizeId) return;
    try {
      if (!silent) setLoading(true);
      setError(null);
      const response = await adminAPI.pencilSets.getPencilsBySetSize(selectedSizeId, page, perPage, sortField, sortDirection);
      if (response.data && Array.isArray(response.data)) {
        setPencils(response.data);
        setTotalPages(response.last_page ?? 1);
        setTotalPencils(response.total ?? response.data.length);
      } else if (Array.isArray(response)) {
        setPencils(response);
        setTotalPages(1);
        setTotalPencils(response.length);
      } else {
        setPencils([]);
        setTotalPages(1);
        setTotalPencils(0);
      }
    } catch (err) {
      setError(err.message || 'Failed to load pencils');
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
    setPage(1);
  };

  const handleEdit = (pencil) => {
    setEditingPencil(pencil);
    setFormData({
      colored_pencil_set_id: pencil.colored_pencil_set_id || setId,
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
      setSelectedPencilIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      fetchPencils({ silent: true });
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
        const updateData = { ...submitData };
        if (editingPencil.sizes && Array.isArray(editingPencil.sizes)) {
          updateData.sizes = editingPencil.sizes;
        }
        await adminAPI.pencils.update(editingPencil.id, updateData);
      } else {
        const createData = {
          ...submitData,
          colored_pencil_set_id: parseInt(setId, 10),
          sizes: selectedSizeId ? [parseInt(selectedSizeId, 10)] : []
        };
        await adminAPI.pencils.create(createData);
      }
      setShowModal(false);
      setEditingPencil(null);
      setFormData({
        colored_pencil_set_id: setId,
        color_number: '',
        color_name: '',
        hex: '',
        lightfast_rating: '',
        shopping_link: '',
        barcode: ''
      });
      fetchPencils({ silent: true });
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
      colored_pencil_set_id: setId,
      color_number: '',
      color_name: '',
      hex: '',
      lightfast_rating: '',
      shopping_link: '',
      barcode: ''
    });
    setShowModal(true);
  };

  const togglePencilSelected = (pencilId) => {
    setSelectedPencilIds((prev) => {
      const next = new Set(prev);
      if (next.has(pencilId)) {
        next.delete(pencilId);
      } else {
        next.add(pencilId);
      }
      return next;
    });
  };

  const allVisibleSelected = pencils.length > 0 && pencils.every((p) => selectedPencilIds.has(p.id));

  const toggleAllVisible = () => {
    setSelectedPencilIds((prev) => {
      const next = new Set(prev);
      pencils.forEach((p) => {
        if (allVisibleSelected) {
          next.delete(p.id);
        } else {
          next.add(p.id);
        }
      });
      return next;
    });
  };

  const openCreateSizeModal = () => {
    setNewSizeName(`${selectedPencilIds.size}-count`);
    setNewSizeCount(String(selectedPencilIds.size));
    setSizeError(null);
    setShowSizeModal(true);
  };

  const handleCreateSize = async (e) => {
    e.preventDefault();
    setCreatingSize(true);
    setSizeError(null);

    try {
      const newSize = await adminAPI.pencilSets.createSetSizeFromPencils(setId, {
        name: newSizeName.trim(),
        count: newSizeCount === '' ? null : parseInt(newSizeCount, 10),
        pencilIds: Array.from(selectedPencilIds),
      });
      setShowSizeModal(false);
      setSelectedPencilIds(new Set());
      await fetchSetSizes(newSize.id);
    } catch (err) {
      const fieldErrors = err.data?.errors ? Object.values(err.data.errors).flat().join(' ') : null;
      setSizeError(fieldErrors || err.message || 'Failed to create set size');
    } finally {
      setCreatingSize(false);
    }
  };

  const selectedSize = setSizes.find((s) => s.id === parseInt(selectedSizeId, 10));

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
            {setId && setSizes.length > 0 && (
              <div className="w-64">
                <DropdownMenu
                  options={[
                    { value: '', label: 'Select a size...' },
                    ...setSizes.map((size) => ({
                      value: size.id.toString(),
                      label: size.name ? `${size.name} (${size.count || ''} ct)` : `${size.count || '?'} ct`
                    }))
                  ]}
                  value={selectedSizeId}
                  onChange={(value) => {
                    setSelectedSizeId(value);
                    setPage(1);
                  }}
                  placeholder="Select a size..."
                />
              </div>
            )}
            {selectedSizeId && (
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

        {setDetails && (
          <div className="mb-4 p-4 bg-slate-50 rounded-lg border border-slate-200">
            <p className="text-sm text-slate-700">
              <span className="font-semibold">Set:</span> {setDetails.brand} - {setDetails.name}
              {selectedSize && (
                <span className="ml-2">
                  · <span className="font-semibold">Size:</span> {selectedSize.name || `${selectedSize.count} ct`}
                </span>
              )}
            </p>
          </div>
        )}

        {!setId ? (
          <div className="text-center py-12">
            <p className="text-slate-500">Go to Pencil Sets and click &quot;Manage Pencils&quot; on a set to manage its pencils.</p>
          </div>
        ) : setSizes.length === 0 && !loading ? (
          <div className="text-center py-12">
            <p className="text-slate-500">No sizes defined for this set. Add set sizes in Pencil Sets first.</p>
          </div>
        ) : !selectedSizeId ? (
          <div className="text-center py-12">
            <p className="text-slate-500">Select a set size above to manage pencils</p>
          </div>
        ) : loading ? (
          <div className="text-center py-12">
            <p className="text-slate-500">Loading...</p>
          </div>
        ) : (
          <>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-h-[36px]">
              {selectedPencilIds.size > 0 ? (
                <>
                  <span className="text-sm text-slate-700">
                    <span className="font-semibold">{selectedPencilIds.size}</span> selected
                  </span>
                  <button
                    onClick={openCreateSizeModal}
                    className="px-3 py-1.5 text-white rounded-lg text-sm font-medium transition-colors"
                    style={{ backgroundColor: '#ea3663' }}
                    onMouseEnter={(e) => (e.target.style.backgroundColor = '#d12a4f')}
                    onMouseLeave={(e) => (e.target.style.backgroundColor = '#ea3663')}
                  >
                    + Create Set Size from Selected
                  </button>
                  <button
                    onClick={() => setSelectedPencilIds(new Set())}
                    className="px-3 py-1.5 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50"
                  >
                    Clear
                  </button>
                </>
              ) : (
                <span className="text-sm text-slate-500">Select pencils to create a new set size from them</span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-600">{totalPencils} pencils · Show</span>
              <select
                value={perPage}
                onChange={(e) => {
                  setPerPage(e.target.value === 'all' ? 'all' : parseInt(e.target.value, 10));
                  setPage(1);
                }}
                className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-offset-0"
              >
                <option value={15}>15</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
                <option value="all">All</option>
              </select>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="py-3 px-4 w-10">
                    <input
                      type="checkbox"
                      checked={allVisibleSelected}
                      onChange={toggleAllVisible}
                      disabled={pencils.length === 0}
                      aria-label="Select all pencils on this page"
                      className="w-4 h-4 rounded border-slate-300"
                    />
                  </th>
                  {[
                    { field: 'color_number', label: 'Color #' },
                    { field: 'color_name', label: 'Color Name' },
                    { field: 'hex', label: 'Hex' }
                  ].map(({ field, label }) => (
                    <th
                      key={field}
                      className="text-left py-3 px-4 text-sm font-semibold text-slate-700"
                      aria-sort={sortField === field ? (sortDirection === 'asc' ? 'ascending' : 'descending') : 'none'}
                    >
                      <button
                        type="button"
                        onClick={() => handleSort(field)}
                        className="inline-flex items-center gap-1 hover:text-slate-900"
                      >
                        {label}
                        <span className={sortField === field ? 'text-slate-700' : 'text-slate-300'}>
                          {sortField === field && sortDirection === 'desc' ? '▼' : '▲'}
                        </span>
                      </button>
                    </th>
                  ))}
                  <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Lightfast</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Barcode</th>
                  <th className="text-center py-3 px-4 text-sm font-semibold text-slate-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {pencils.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="py-8 text-center text-slate-500">
                      No pencils in this set size
                    </td>
                  </tr>
                ) : (
                  pencils.map((pencil) => (
                    <tr
                      key={pencil.id}
                      className={`border-b border-slate-100 hover:bg-slate-50 ${selectedPencilIds.has(pencil.id) ? 'bg-pink-50' : ''}`}
                    >
                      <td className="py-3 px-4">
                        <input
                          type="checkbox"
                          checked={selectedPencilIds.has(pencil.id)}
                          onChange={() => togglePencilSelected(pencil.id)}
                          aria-label={`Select ${pencil.color_name}`}
                          className="w-4 h-4 rounded border-slate-300"
                        />
                      </td>
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
          </>
        )}

        {/* Pagination */}
        {selectedSizeId && perPage !== 'all' && totalPages > 1 && (
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
              disabled={page >= totalPages}
              className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        )}
      </div>

      {showSizeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-lg max-w-md w-full mx-4">
            <form onSubmit={handleCreateSize} className="p-6 space-y-4">
              <h3 className="text-xl font-semibold text-slate-800 font-venti">Create Set Size</h3>
              <p className="text-sm text-slate-600">
                A new size will be added to{' '}
                <span className="font-medium">{setDetails ? `${setDetails.brand} - ${setDetails.name}` : 'this set'}</span>{' '}
                with the {selectedPencilIds.size} selected pencil{selectedPencilIds.size === 1 ? '' : 's'}.
              </p>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Size Name *</label>
                <input
                  type="text"
                  value={newSizeName}
                  onChange={(e) => setNewSizeName(e.target.value)}
                  required
                  autoFocus
                  className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-offset-0 focus:border-transparent transition-all duration-200"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Count</label>
                <input
                  type="number"
                  min="1"
                  value={newSizeCount}
                  onChange={(e) => setNewSizeCount(e.target.value)}
                  className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-offset-0 focus:border-transparent transition-all duration-200"
                />
                <p className="mt-1 text-xs text-slate-500">Defaults to the number of selected pencils.</p>
              </div>
              {sizeError && (
                <div className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">{sizeError}</div>
              )}
              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowSizeModal(false)}
                  className="px-6 py-2.5 text-slate-700 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium hover:bg-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingSize || !newSizeName.trim()}
                  className="px-6 py-2.5 text-white rounded-xl text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ backgroundColor: '#ea3663' }}
                  onMouseEnter={(e) => !creatingSize && (e.target.style.backgroundColor = '#d12a4f')}
                  onMouseLeave={(e) => !creatingSize && (e.target.style.backgroundColor = '#ea3663')}
                >
                  {creatingSize ? 'Creating...' : 'Create Size'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal for Add/Edit */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h3 className="text-xl font-semibold text-slate-800 font-venti mb-4">
                {editingPencil ? 'Edit Pencil' : 'Add New Pencil'}
              </h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                {!editingPencil && selectedSize && (
                  <p className="text-sm text-slate-600">
                    Pencil will be added to: <span className="font-medium">{selectedSize.name || `${selectedSize.count} ct`}</span>
                  </p>
                )}
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

