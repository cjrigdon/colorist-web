import React, { useState, useEffect } from 'react';
import { booksAPI } from '../services/api';

const AddBookModal = ({ isOpen, onClose, onSuccess }) => {
  const [activeTab, setActiveTab] = useState('existing'); // 'existing' or 'new'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [availableBooks, setAvailableBooks] = useState([]);
  const [loadingBooks, setLoadingBooks] = useState(false);
  const [selectedBookIds, setSelectedBookIds] = useState([]);
  const [bookData, setBookData] = useState({
    title: '',
    author: '',
    image: null,
    preview: null
  });

  useEffect(() => {
    if (isOpen && activeTab === 'existing') {
      fetchAvailableBooks();
      setSelectedBookIds([]);
    } else if (isOpen && activeTab === 'new') {
      setBookData({ title: '', author: '', image: null, preview: null });
    }
  }, [isOpen, activeTab]);

  const fetchAvailableBooks = async () => {
    try {
      setLoadingBooks(true);
      setError(null);
      // Fetch system books (is_system = true)
      const response = await booksAPI.getAll(1, 100, { is_system: 'true' });
      let booksData = [];
      if (Array.isArray(response)) {
        booksData = response;
      } else if (response.data && Array.isArray(response.data)) {
        booksData = response.data;
      }
      // Filter to only show system books
      const systemBooks = booksData.filter(book => book.is_system === true);
      setAvailableBooks(systemBooks);
    } catch (err) {
      console.error('Error fetching available books:', err);
      setError('Failed to load available books');
    } finally {
      setLoadingBooks(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setBookData({
        ...bookData,
        image: file,
        preview: URL.createObjectURL(file)
      });
    }
  };

  const handleAttachExistingBooks = async () => {
    if (selectedBookIds.length === 0) {
      setError('Please select at least one book');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      // Attach each selected book to user's library
      for (const bookId of selectedBookIds) {
        await booksAPI.attachToUser(parseInt(bookId));
      }
      
      onSuccess();
      onClose();
    } catch (err) {
      console.error('Error attaching books:', err);
      setError(err.data?.message || 'Failed to add books to your library');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNewBook = async (e) => {
    e.preventDefault();
    if (!bookData.title || !bookData.author) {
      setError('Please provide a title and author');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const payload = {
        title: bookData.title,
        author: bookData.author
      };

      // If image is provided, convert to base64
      if (bookData.image) {
        const reader = new FileReader();
        reader.onloadend = async () => {
          const base64Data = reader.result;
          payload.image = {
            name: bookData.image.name,
            data: base64Data
          };

          try {
            await booksAPI.create(payload);
            onSuccess();
            onClose();
            setBookData({ title: '', author: '', image: null, preview: null });
          } catch (err) {
            console.error('Error creating book:', err);
            setError(err.data?.message || 'Failed to create book');
            setLoading(false);
          }
        };
        reader.readAsDataURL(bookData.image);
      } else {
        // No image, just create the book
        await booksAPI.create(payload);
        onSuccess();
        onClose();
        setBookData({ title: '', author: '', image: null, preview: null });
      }
    } catch (err) {
      console.error('Error processing book:', err);
      setError('Failed to create book');
      setLoading(false);
    }
  };

  const toggleBookSelection = (bookId) => {
    const idStr = bookId.toString();
    if (selectedBookIds.includes(idStr)) {
      setSelectedBookIds(selectedBookIds.filter(id => id !== idStr));
    } else {
      setSelectedBookIds([...selectedBookIds, idStr]);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] m-0 p-0" style={{ top: 0, left: 0, right: 0, bottom: 0, margin: 0, padding: 0 }}>
      <div className="bg-slate-50 rounded-2xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden m-4 flex flex-col">
        <div className="p-6 border-b border-slate-200 flex-shrink-0">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold text-slate-800 font-venti">Add Book</h3>
            <button
              onClick={onClose}
              className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="p-3 border-b border-slate-200 flex-shrink-0">
          <div className="flex space-x-2">
            <button
              onClick={() => setActiveTab('existing')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === 'existing'
                  ? 'text-white'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
              style={activeTab === 'existing' ? { backgroundColor: '#ea3663' } : {}}
            >
              Add Book
            </button>
            <button
              onClick={() => setActiveTab('new')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === 'new'
                  ? 'text-white'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
              style={activeTab === 'new' ? { backgroundColor: '#ea3663' } : {}}
            >
              Add Custom Book
            </button>
          </div>
        </div>

        <div className="p-6 h-[600px] overflow-y-auto flex flex-col">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm flex-shrink-0">
              {error}
            </div>
          )}

          {/* Existing Books Tab */}
          {activeTab === 'existing' && (
            <div className="space-y-4 flex-1 flex flex-col min-h-0">
              {loadingBooks ? (
                <div className="text-center py-8 text-slate-500">Loading available books...</div>
              ) : availableBooks.length === 0 ? (
                <div className="text-center py-8 text-slate-500">No system books available</div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 flex-1 overflow-y-auto">
                  {availableBooks.map((book) => (
                    <label
                      key={book.id}
                      className={`flex flex-col p-4 rounded-lg cursor-pointer transition-colors border-2 ${
                        selectedBookIds.includes(book.id.toString())
                          ? 'bg-slate-100 border-slate-300'
                          : 'hover:bg-slate-50 border-transparent'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedBookIds.includes(book.id.toString())}
                        onChange={() => toggleBookSelection(book.id)}
                        className="hidden"
                      />
                      <div className="relative aspect-[3/4] bg-slate-100 overflow-hidden rounded-lg mb-3">
                        <img
                          src={book.image || 'https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=300&h=400&fit=crop'}
                          alt={book.title}
                          className="w-full h-full object-cover"
                        />
                        {selectedBookIds.includes(book.id.toString()) && (
                          <div className="absolute top-2 right-2 bg-green-500 text-white rounded-full p-1">
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          </div>
                        )}
                      </div>
                      <h4 className="font-semibold text-slate-800 mb-1 line-clamp-2">{book.title || 'Untitled'}</h4>
                      <p className="text-sm text-slate-600">by {book.author || 'Unknown'}</p>
                    </label>
                  ))}
                </div>
              )}
              <div className="text-sm text-slate-600 flex-shrink-0">
                Select one or more system books to add to your library.
              </div>
            </div>
          )}

          {/* New Book Tab */}
          {activeTab === 'new' && (
            <form onSubmit={handleCreateNewBook} className="space-y-4 flex-1 flex flex-col min-h-0">
              <div className="flex-shrink-0">
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Title *
                </label>
                <input
                  type="text"
                  value={bookData.title}
                  onChange={(e) => setBookData({ ...bookData, title: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg text-slate-800"
                  placeholder="Enter book title"
                  required
                />
              </div>

              <div className="flex-shrink-0">
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Author *
                </label>
                <input
                  type="text"
                  value={bookData.author}
                  onChange={(e) => setBookData({ ...bookData, author: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg text-slate-800"
                  placeholder="Enter author name"
                  required
                />
              </div>

              <div className="flex-shrink-0">
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Cover Image (optional)
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg text-slate-800"
                />
                <p className="mt-2 text-xs text-slate-500">
                  Supported formats: JPG, PNG, GIF
                </p>
                {bookData.preview && (
                  <div className="mt-4 mb-4">
                    <p className="text-sm text-slate-600 mb-2">Preview:</p>
                    <img
                      src={bookData.preview}
                      alt="Book cover preview"
                      className="max-w-full h-auto rounded-lg border border-slate-200"
                      style={{ maxHeight: '300px' }}
                    />
                  </div>
                )}
              </div>

              <div className="flex justify-end space-x-3 pt-4 mb-6 mt-auto flex-shrink-0">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
                  style={{ backgroundColor: '#ea3663' }}
                  disabled={loading}
                >
                  {loading ? 'Adding...' : 'Add Book'}
                </button>
              </div>
            </form>
          )}

          {/* Action buttons for existing tab */}
          {activeTab === 'existing' && (
            <div className="flex justify-end space-x-3 pt-4 border-t border-slate-200 mt-4 flex-shrink-0">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAttachExistingBooks}
                className="px-4 py-2 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
                style={{ backgroundColor: '#ea3663' }}
                disabled={loading || selectedBookIds.length === 0}
              >
                {loading ? 'Adding...' : `Add ${selectedBookIds.length > 0 ? `${selectedBookIds.length} ` : ''}Book${selectedBookIds.length !== 1 ? 's' : ''}`}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AddBookModal;

