import React, { useState, useEffect } from 'react';
import { adminAPI } from '../services/api';

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [perPage] = useState(15);
  const [totalPages, setTotalPages] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    password: '',
    admin: false,
    creator: false,
    subscription_plan: 'free'
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, [page]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await adminAPI.users.getAll(page, perPage);
      // Handle Laravel pagination response structure
      if (response.data && Array.isArray(response.data)) {
        setUsers(response.data);
        // Set pagination metadata
        if (response.last_page !== undefined) {
          setTotalPages(response.last_page);
        } else if (response.meta && response.meta.last_page) {
          setTotalPages(response.meta.last_page);
        } else {
          setTotalPages(1);
        }
      } else if (Array.isArray(response)) {
        setUsers(response);
        setTotalPages(1);
      } else {
        setUsers([]);
        setTotalPages(1);
      }
    } catch (err) {
      setError(err.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (user) => {
    setEditingUser(user);
    setFormData({
      first_name: user.first_name || '',
      last_name: user.last_name || '',
      email: user.email || '',
      password: '', // Don't pre-fill password
      admin: user.admin === 1 || user.admin === true,
      creator: user.creator === 1 || user.creator === true,
      subscription_plan: user.subscription_plan || 'free'
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this user?')) {
      return;
    }

    try {
      await adminAPI.users.delete(id);
      fetchUsers();
    } catch (err) {
      setError(err.message || 'Failed to delete user');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const submitData = { ...formData };
      // Only include password if it's provided (for new users or if updating)
      if (!submitData.password || submitData.password === '') {
        delete submitData.password;
      }

      if (editingUser) {
        await adminAPI.users.update(editingUser.id, submitData);
      } else {
        // Password is required for new users
        if (!submitData.password) {
          setError('Password is required for new users');
          setSaving(false);
          return;
        }
        await adminAPI.users.create(submitData);
      }
      setShowModal(false);
      setEditingUser(null);
      setFormData({
        first_name: '',
        last_name: '',
        email: '',
        password: '',
        admin: false,
        creator: false,
        subscription_plan: 'free'
      });
      fetchUsers();
    } catch (err) {
      setError(err.message || 'Failed to save user');
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
    setEditingUser(null);
    setFormData({
      first_name: '',
      last_name: '',
      email: '',
      password: '',
      admin: false,
      creator: false,
      subscription_plan: 'free'
    });
    setShowModal(true);
  };

  if (loading && users.length === 0) {
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
              Manage Users
            </h2>
            <p className="text-sm text-slate-600">
              Add, edit, and delete users
            </p>
          </div>
          <button
            onClick={handleNew}
            className="px-4 py-2 text-white rounded-xl text-sm font-medium transition-colors"
            style={{ backgroundColor: '#ea3663' }}
            onMouseEnter={(e) => (e.target.style.backgroundColor = '#d12a4f')}
            onMouseLeave={(e) => (e.target.style.backgroundColor = '#ea3663')}
          >
            + Add New User
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
                <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Name</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Email</th>
                <th className="text-center py-3 px-4 text-sm font-semibold text-slate-700">Subscription</th>
                <th className="text-center py-3 px-4 text-sm font-semibold text-slate-700">Admin</th>
                <th className="text-center py-3 px-4 text-sm font-semibold text-slate-700">Creator</th>
                <th className="text-center py-3 px-4 text-sm font-semibold text-slate-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="py-3 px-4 text-sm text-slate-800">
                    {user.first_name} {user.last_name}
                  </td>
                  <td className="py-3 px-4 text-sm text-slate-800">{user.email}</td>
                  <td className="py-3 px-4 text-center">
                    {user.subscription_plan === 'paid' ? (
                      <span className="px-2 py-1 text-xs font-medium text-purple-700 bg-purple-50 rounded-lg capitalize">
                        {user.subscription_plan}
                      </span>
                    ) : (
                      <span className="px-2 py-1 text-xs font-medium text-slate-500 bg-slate-50 rounded-lg capitalize">
                        {user.subscription_plan || 'free'}
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-center">
                    {user.admin ? (
                      <span className="px-2 py-1 text-xs font-medium text-green-700 bg-green-50 rounded-lg">
                        Yes
                      </span>
                    ) : (
                      <span className="px-2 py-1 text-xs font-medium text-slate-500 bg-slate-50 rounded-lg">
                        No
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-center">
                    {user.creator ? (
                      <span className="px-2 py-1 text-xs font-medium text-blue-700 bg-blue-50 rounded-lg">
                        Yes
                      </span>
                    ) : (
                      <span className="px-2 py-1 text-xs font-medium text-slate-500 bg-slate-50 rounded-lg">
                        No
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center justify-center space-x-2">
                      <button
                        onClick={() => handleEdit(user)}
                        className="px-3 py-1 text-xs font-medium text-blue-700 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(user.id)}
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
                {editingUser ? 'Edit User' : 'Add New User'}
              </h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      First Name *
                    </label>
                    <input
                      type="text"
                      name="first_name"
                      value={formData.first_name}
                      onChange={handleChange}
                      className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-offset-0 focus:border-transparent transition-all duration-200"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Last Name *
                    </label>
                    <input
                      type="text"
                      name="last_name"
                      value={formData.last_name}
                      onChange={handleChange}
                      className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-offset-0 focus:border-transparent transition-all duration-200"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Email *
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-offset-0 focus:border-transparent transition-all duration-200"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Password {editingUser ? '(leave blank to keep current)' : '*'}
                  </label>
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-offset-0 focus:border-transparent transition-all duration-200"
                    required={!editingUser}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Subscription Plan
                  </label>
                  <select
                    name="subscription_plan"
                    value={formData.subscription_plan}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-offset-0 focus:border-transparent transition-all duration-200"
                  >
                    <option value="free">Free</option>
                    <option value="paid">Paid</option>
                  </select>
                </div>
                <div className="flex items-center space-x-6">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      name="admin"
                      checked={formData.admin}
                      onChange={handleChange}
                      className="w-4 h-4 text-pink-600 border-slate-300 rounded focus:ring-2 focus:ring-pink-500"
                    />
                    <span className="text-sm font-medium text-slate-700">Admin</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      name="creator"
                      checked={formData.creator}
                      onChange={handleChange}
                      className="w-4 h-4 text-pink-600 border-slate-300 rounded focus:ring-2 focus:ring-pink-500"
                    />
                    <span className="text-sm font-medium text-slate-700">Creator</span>
                  </label>
                </div>
                <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      setEditingUser(null);
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

export default AdminUsers;

