import React, { useState, useEffect } from 'react';
import { adminAPI } from '../services/api';

const AdminBrands = () => {
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [perPage] = useState(15);
  const [totalPages, setTotalPages] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [editingBrand, setEditingBrand] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    website: '',
    thumbnail: '',
    thumbnailFile: null
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchBrands();
  }, [page]);

  const fetchBrands = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await adminAPI.brands.getAll(page, perPage);
      // Handle Laravel pagination response structure
      if (response.data && Array.isArray(response.data)) {
        setBrands(response.data);
        if (response.meta) {
          setTotalPages(response.meta.last_page || 1);
        } else if (response.last_page) {
          setTotalPages(response.last_page);
        }
      } else if (Array.isArray(response)) {
        setBrands(response);
      } else {
        setBrands([]);
      }
    } catch (err) {
      setError(err.message || 'Failed to load brands');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (brand) => {
    setEditingBrand(brand);
    setFormData({
      name: brand.name || '',
      website: brand.website || '',
      thumbnail: brand.thumbnail || '',
      thumbnailFile: null
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this brand?')) {
      return;
    }

    try {
      await adminAPI.brands.delete(id);
      fetchBrands();
    } catch (err) {
      setError(err.message || 'Failed to delete brand');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      if (editingBrand) {
        await adminAPI.brands.update(editingBrand.id, formData);
      } else {
        // For create, we need to handle file upload differently
        if (formData.thumbnailFile) {
          const formDataToSend = new FormData();
          formDataToSend.append('name', formData.name);
          if (formData.website) {
            formDataToSend.append('website', formData.website);
          }
          formDataToSend.append('thumbnail', formData.thumbnailFile);
          
          const response = await fetch(`${process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000/api'}/admin/brands`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
              'Accept': 'application/json',
            },
            body: formDataToSend
          });
          
          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || 'Failed to create brand');
          }
        } else {
          await adminAPI.brands.create({
            name: formData.name,
            website: formData.website,
            thumbnail: formData.thumbnail
          });
        }
      }
      setShowModal(false);
      setEditingBrand(null);
      setFormData({
        name: '',
        website: '',
        thumbnail: '',
        thumbnailFile: null
      });
      fetchBrands();
    } catch (err) {
      setError(err.message || 'Failed to save brand');
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (name === 'thumbnailFile' && files && files.length > 0) {
      setFormData(prev => ({
        ...prev,
        thumbnailFile: files[0]
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleNew = () => {
    setEditingBrand(null);
    setFormData({
      name: '',
      website: '',
      thumbnail: '',
      thumbnailFile: null
    });
    setShowModal(true);
  };

  if (loading && brands.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-slate-500">Loading...</div>
      </div>
    );
  }

  return (
    <>
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-semibold text-slate-800 font-venti mb-2">
                Manage Brands
              </h2>
              <p className="text-sm text-slate-600">
                Add, edit, and delete brands with thumbnails
              </p>
            </div>
            <button
              onClick={handleNew}
              className="px-4 py-2 text-white rounded-xl text-sm font-medium transition-colors"
              style={{ backgroundColor: '#ea3663' }}
              onMouseEnter={(e) => (e.target.style.backgroundColor = '#d12a4f')}
              onMouseLeave={(e) => (e.target.style.backgroundColor = '#ea3663')}
            >
              + Add New Brand
            </button>
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
                  <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Thumbnail</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Name</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Website</th>
                  <th className="text-center py-3 px-4 text-sm font-semibold text-slate-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {brands.map((brand) => (
                  <tr key={brand.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="py-3 px-4">
                      {brand.thumbnail ? (
                        <img 
                          src={brand.thumbnail} 
                          alt={brand.name}
                          className="w-16 h-16 object-cover rounded-lg"
                        />
                      ) : (
                        <div className="w-16 h-16 bg-slate-200 rounded-lg flex items-center justify-center">
                          <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4 text-sm text-slate-800 font-medium">{brand.name}</td>
                    <td className="py-3 px-4 text-sm text-slate-600">
                      {brand.website ? (
                        <a 
                          href={brand.website} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 underline"
                        >
                          {brand.website}
                        </a>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-center space-x-2">
                        <button
                          onClick={() => handleEdit(brand)}
                          className="px-3 py-1 text-xs font-medium text-blue-700 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(brand.id)}
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
      </div>

      {/* Modal for Add/Edit */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h3 className="text-xl font-semibold text-slate-800 font-venti mb-4">
                {editingBrand ? 'Edit Brand' : 'Add New Brand'}
              </h3>
              <form onSubmit={handleSubmit} className="space-y-4">
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
                    Website
                  </label>
                  <input
                    type="url"
                    name="website"
                    value={formData.website}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-offset-0 focus:border-transparent transition-all duration-200"
                    placeholder="https://example.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Thumbnail
                  </label>
                  {formData.thumbnail && !formData.thumbnailFile && (
                    <div className="mb-2">
                      <img 
                        src={formData.thumbnail.startsWith('http') ? formData.thumbnail : `${process.env.REACT_APP_API_BASE_URL?.replace('/api', '') || 'http://localhost:8000'}/storage/${formData.thumbnail}`}
                        alt="Current thumbnail"
                        className="w-24 h-24 object-cover rounded-lg mb-2"
                      />
                    </div>
                  )}
                  <input
                    type="file"
                    name="thumbnailFile"
                    accept="image/jpeg,image/png,image/jpg"
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-offset-0 focus:border-transparent transition-all duration-200"
                  />
                  {formData.thumbnailFile && (
                    <p className="mt-1 text-xs text-green-600 font-medium">
                      ✓ File selected: {formData.thumbnailFile.name}
                    </p>
                  )}
                  <p className="mt-1 text-xs text-slate-500">Upload a thumbnail image (JPG, PNG, max 2MB)</p>
                  {!formData.thumbnailFile && (
                    <div className="mt-2">
                      <input
                        type="text"
                        name="thumbnail"
                        value={formData.thumbnail}
                        onChange={handleChange}
                        placeholder="Or enter thumbnail URL"
                        className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-offset-0 focus:border-transparent transition-all duration-200"
                      />
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      setEditingBrand(null);
                      setFormData({
                        name: '',
                        website: '',
                        thumbnail: '',
                        thumbnailFile: null
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

export default AdminBrands;

