import React, { useState, useEffect } from 'react';
import { adminAPI } from '../services/api';

const AdminTags = () => {
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingTag, setEditingTag] = useState(null);
  const [formData, setFormData] = useState({ tag: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchTags();
  }, []);

  const fetchTags = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await adminAPI.tags.getAll(1, 200);
      const list = response?.data ?? (Array.isArray(response) ? response : []);
      setTags(Array.isArray(list) ? list : []);
    } catch (err) {
      setError(err.message || 'Failed to load tags');
      setTags([]);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (tag) => {
    setEditingTag(tag);
    setFormData({ tag: tag.tag || '' });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this tag? It will be removed from all inspirations.')) {
      return;
    }
    try {
      await adminAPI.tags.delete(id);
      fetchTags();
    } catch (err) {
      setError(err.message || 'Failed to delete tag');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      if (editingTag) {
        await adminAPI.tags.update(editingTag.id, formData);
      } else {
        await adminAPI.tags.create(formData);
      }
      setShowModal(false);
      setEditingTag(null);
      setFormData({ tag: '' });
      fetchTags();
    } catch (err) {
      setError(err.message || 'Failed to save tag');
    } finally {
      setSaving(false);
    }
  };

  const handleNew = () => {
    setEditingTag(null);
    setFormData({ tag: '' });
    setShowModal(true);
  };

  if (loading && tags.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-slate-500">Loading...</div>
      </div>
    );
  }

  return (
    <>
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-semibold text-slate-800 font-venti mb-2">
                Inspiration Tags
              </h2>
              <p className="text-sm text-slate-600">
                Manage known tags that users can apply to videos, images, and files in Inspiration.
              </p>
            </div>
            <button
              onClick={handleNew}
              className="px-4 py-2 text-white rounded-xl text-sm font-medium transition-colors"
              style={{ backgroundColor: '#ea3663' }}
              onMouseEnter={(e) => (e.target.style.backgroundColor = '#d12a4f')}
              onMouseLeave={(e) => (e.target.style.backgroundColor = '#ea3663')}
            >
              + Add Tag
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
                  <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Tag</th>
                  <th className="text-center py-3 px-4 text-sm font-semibold text-slate-700 w-32">Actions</th>
                </tr>
              </thead>
              <tbody>
                {tags.length === 0 ? (
                  <tr>
                    <td colSpan={2} className="py-8 text-center text-slate-500">
                      No tags yet. Add one to get started.
                    </td>
                  </tr>
                ) : (
                  tags.map((tag) => (
                    <tr key={tag.id} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="py-3 px-4 text-sm text-slate-800 font-medium">{tag.tag}</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-center space-x-2">
                          <button
                            onClick={() => handleEdit(tag)}
                            className="px-3 py-1 text-xs font-medium text-blue-700 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(tag.id)}
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
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-lg max-w-md w-full mx-4">
            <div className="p-6">
              <h3 className="text-xl font-semibold text-slate-800 font-venti mb-4">
                {editingTag ? 'Edit Tag' : 'Add New Tag'}
              </h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Tag name *</label>
                  <input
                    type="text"
                    value={formData.tag}
                    onChange={(e) => setFormData({ tag: e.target.value })}
                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-offset-0 focus:border-transparent"
                    placeholder="e.g. tutorial, nature"
                    required
                  />
                  <p className="mt-1 text-xs text-slate-500">Tags are stored in lowercase.</p>
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => { setShowModal(false); setEditingTag(null); }}
                    className="px-4 py-2 text-slate-700 bg-slate-100 rounded-xl text-sm font-medium hover:bg-slate-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-4 py-2 text-white rounded-xl text-sm font-medium disabled:opacity-50"
                    style={{ backgroundColor: '#ea3663' }}
                  >
                    {saving ? 'Saving...' : (editingTag ? 'Save' : 'Add')}
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

export default AdminTags;
