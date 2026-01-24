import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminAPI } from '../services/api';

const AdminBooks = () => {
  const navigate = useNavigate();
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [perPage] = useState(15);
  const [totalPages, setTotalPages] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [editingBook, setEditingBook] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    author: '',
    publisher: '',
    year_published: '',
    number_of_pages: '',
    isbn: '',
    image: '',
    imageFile: null
  });
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState('all'); // 'all', 'pending', 'approved', 'system'
  const [hideCustom, setHideCustom] = useState(true);

  useEffect(() => {
    fetchBooks();
  }, [page, filter, hideCustom]);

  const fetchBooks = async () => {
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
      const response = await adminAPI.books.getAll(page, perPage, params);
      // Handle Laravel pagination response structure
      let booksData = [];
      if (response.data && Array.isArray(response.data)) {
        booksData = response.data;
        // Set pagination metadata
        if (response.last_page !== undefined) {
          setTotalPages(response.last_page);
        } else if (response.meta && response.meta.last_page) {
          setTotalPages(response.meta.last_page);
        } else {
          setTotalPages(1);
        }
      } else if (Array.isArray(response)) {
        booksData = response;
        setTotalPages(1);
      }
      
      // Filter out custom books if hideCustom is true
      // Note: Books don't have an is_custom field, but we can filter user-created books
      // For now, we'll just use the existing data as-is since books don't have custom sets
      // This checkbox is added for consistency with pencil sets UI
      if (hideCustom) {
        // If we want to hide user books, we could filter here
        // For now, keeping all books since there's no is_custom field
      }
      
      setBooks(booksData);
    } catch (err) {
      setError(err.message || 'Failed to load books');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = async (book) => {
    setEditingBook(book);
    setFormData({
      title: book.title || '',
      author: book.author || '',
      publisher: book.publisher || '',
      year_published: book.year_published || '',
      number_of_pages: book.number_of_pages || '',
      isbn: book.isbn || '',
      image: book.image || '',
      imageFile: null
    });
    setShowModal(true);
  };

  const handleCreate = () => {
    setEditingBook(null);
    setFormData({
      title: '',
      author: '',
      publisher: '',
      year_published: '',
      number_of_pages: '',
      isbn: '',
      image: '',
      imageFile: null
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!formData.title || !formData.author) {
      setError('Please provide a title and author');
      return;
    }

    try {
      setSaving(true);
      setError(null);
      
      const dataToSend = {
        title: formData.title,
        author: formData.author,
        publisher: formData.publisher || null,
        year_published: formData.year_published ? parseInt(formData.year_published) : null,
        number_of_pages: formData.number_of_pages ? parseInt(formData.number_of_pages) : null,
        isbn: formData.isbn || null,
        imageFile: formData.imageFile
      };

      if (editingBook) {
        await adminAPI.books.update(editingBook.id, dataToSend);
      } else {
        // Create system book (no user_id)
        await adminAPI.books.create({ ...dataToSend, user_id: null });
      }
      
      setShowModal(false);
      fetchBooks();
    } catch (err) {
      setError(err.data?.message || 'Failed to save book');
    } finally {
      setSaving(false);
    }
  };

  const handleApprove = async (book) => {
    try {
      await adminAPI.books.approve(book.id);
      fetchBooks();
    } catch (err) {
      setError(err.data?.message || 'Failed to approve book');
    }
  };

  const handleReject = async (book) => {
    try {
      await adminAPI.books.reject(book.id);
      fetchBooks();
    } catch (err) {
      setError(err.data?.message || 'Failed to reject book');
    }
  };

  const handleConvertToSystem = async (book) => {
    if (!window.confirm(`Convert "${book.title}" to a system book? This will make it available to all users.`)) {
      return;
    }
    try {
      await adminAPI.books.convertToSystem(book.id);
      fetchBooks();
    } catch (err) {
      setError(err.data?.message || 'Failed to convert book to system');
    }
  };

  const handleDelete = async (book) => {
    if (!window.confirm(`Are you sure you want to delete "${book.title}"?`)) {
      return;
    }
    try {
      await adminAPI.books.delete(book.id);
      fetchBooks();
    } catch (err) {
      setError(err.data?.message || 'Failed to delete book');
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-800">Book Management</h1>
        <button
          onClick={handleCreate}
          className="px-4 py-2 text-white rounded-lg font-medium transition-colors"
          style={{ backgroundColor: '#ea3663' }}
        >
          Add System Book
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
            System Books
          </button>
          <button
            onClick={() => { setFilter('pending'); setPage(1); }}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === 'pending' ? 'text-white' : 'text-slate-600 hover:bg-slate-100'
            }`}
            style={filter === 'pending' ? { backgroundColor: '#ea3663' } : {}}
          >
            Pending Approval
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

      {loading ? (
        <div className="text-center py-12 text-slate-500">Loading books...</div>
      ) : books.length === 0 ? (
        <div className="text-center py-12 text-slate-500">No books found</div>
      ) : (
        <>
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Cover</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Title</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Author</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {books.map((book) => (
                  <tr key={book.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <img
                        src={book.image || 'https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=300&h=400&fit=crop'}
                        alt={book.title}
                        className="w-16 h-20 object-cover rounded"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-slate-900">{book.title || 'Untitled'}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-slate-500">{book.author || 'Unknown'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-slate-100 text-slate-800">
                        {book.is_system ? 'System' : 'User'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {book.is_system ? (
                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                          System
                        </span>
                      ) : book.is_approved ? (
                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                          Approved
                        </span>
                      ) : (
                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">
                          Pending
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center justify-center space-x-2 flex-wrap">
                        <button
                          onClick={() => handleEdit(book)}
                          className="px-3 py-1 text-xs font-medium text-blue-700 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                        >
                          Edit
                        </button>
                        {!book.is_system && !book.is_approved ? (
                          <button
                            onClick={() => handleApprove(book)}
                            className="px-3 py-1 text-xs font-medium text-green-700 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
                            title="Approve Book - Make visible to all users"
                          >
                            ✓ Approve
                          </button>
                        ) : null}
                        {!book.is_system && book.is_approved ? (
                          <button
                            onClick={() => handleReject(book)}
                            className="px-3 py-1 text-xs font-medium text-white bg-orange-600 rounded-lg hover:bg-orange-700 transition-colors shadow-sm"
                            title="Reject Book - Make visible only to creator"
                          >
                            ✗ Reject
                          </button>
                        ) : null}
                        {!book.is_system ? (
                          <button
                            onClick={() => handleConvertToSystem(book)}
                            className="px-3 py-1 text-xs font-medium text-purple-700 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors"
                            title="Convert to System Book - Make available to all users"
                          >
                            Make System
                          </button>
                        ) : null}
                        <button
                          onClick={() => handleDelete(book)}
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

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-4 flex items-center justify-between">
              <button
                onClick={() => setPage(page - 1)}
                disabled={page === 1}
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-50"
              >
                Previous
              </button>
              <span className="text-sm text-slate-600">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage(page + 1)}
                disabled={page >= totalPages}
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-50"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}

      {/* Edit/Create Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999]">
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto m-4">
            <div className="p-6 border-b border-slate-200">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold text-slate-800">
                  {editingBook ? 'Edit Book' : 'Add System Book'}
                </h3>
                <button
                  onClick={() => setShowModal(false)}
                  className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Title *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg text-slate-800"
                  placeholder="Enter book title"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Author *
                </label>
                <input
                  type="text"
                  value={formData.author}
                  onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg text-slate-800"
                  placeholder="Enter author name"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Publisher
                </label>
                <input
                  type="text"
                  value={formData.publisher}
                  onChange={(e) => setFormData({ ...formData, publisher: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg text-slate-800"
                  placeholder="Enter publisher name"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Year Published
                  </label>
                  <input
                    type="number"
                    value={formData.year_published}
                    onChange={(e) => setFormData({ ...formData, year_published: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg text-slate-800"
                    placeholder="e.g., 2024"
                    min="1000"
                    max="9999"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Number of Pages
                  </label>
                  <input
                    type="number"
                    value={formData.number_of_pages}
                    onChange={(e) => setFormData({ ...formData, number_of_pages: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg text-slate-800"
                    placeholder="e.g., 96"
                    min="1"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  ISBN
                </label>
                <input
                  type="text"
                  value={formData.isbn}
                  onChange={(e) => setFormData({ ...formData, isbn: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg text-slate-800"
                  placeholder="Enter ISBN (10 or 13 digits)"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Cover Image
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files[0];
                    if (file) {
                      setFormData({ ...formData, imageFile: file });
                    }
                  }}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg text-slate-800"
                />
                {formData.image && !formData.imageFile && (
                  <img
                    src={formData.image}
                    alt="Current cover"
                    className="mt-2 max-w-xs h-auto rounded-lg"
                  />
                )}
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                  disabled={saving}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  className="px-4 py-2 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
                  style={{ backgroundColor: '#ea3663' }}
                  disabled={saving}
                >
                  {saving ? 'Saving...' : editingBook ? 'Update' : 'Create'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminBooks;

