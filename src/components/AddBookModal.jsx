import React, { useState, useEffect } from 'react';
import { booksAPI } from '../services/api';

const AddBookModal = ({ isOpen, onClose, onSuccess }) => {
  const [activeTab, setActiveTab] = useState('existing'); // 'existing' or 'new'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isbnError, setIsbnError] = useState(null);
  const [availableBooks, setAvailableBooks] = useState([]);
  const [loadingBooks, setLoadingBooks] = useState(false);
  const [selectedBookIds, setSelectedBookIds] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const perPage = 25;
  const [bookData, setBookData] = useState({
    title: '',
    author: '',
    publisher: '',
    year_published: '',
    number_of_pages: '',
    isbn: '',
    image: null,
    preview: null
  });

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300); // 300ms delay

    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    if (isOpen && activeTab === 'existing') {
      // Reset state when opening modal or switching to existing tab
      setPage(1);
      setSearchQuery('');
      setSelectedBookIds([]);
      // debouncedSearchQuery will be reset by the debounce effect
    } else if (isOpen && activeTab === 'new') {
      setBookData({ title: '', author: '', publisher: '', year_published: '', number_of_pages: '', isbn: '', image: null, preview: null });
      setIsbnError(null);
      setError(null);
    }
  }, [isOpen, activeTab]);

  // Fetch books when page, search, or tab changes
  useEffect(() => {
    if (isOpen && activeTab === 'existing') {
      fetchAvailableBooks();
    }
  }, [isOpen, activeTab, page, debouncedSearchQuery]);

  const fetchAvailableBooks = async () => {
    try {
      setLoadingBooks(true);
      setError(null);
      // Fetch system books (is_system = true) with pagination and search
      let params = { is_system: 'true' };
      if (debouncedSearchQuery && debouncedSearchQuery.trim()) {
        params.search = debouncedSearchQuery.trim();
      }
      const response = await booksAPI.getAll(page, perPage, params);
      
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
      
      // Filter to only show system books (in case backend doesn't filter properly)
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
        author: bookData.author,
        publisher: bookData.publisher || null,
        year_published: bookData.year_published ? parseInt(bookData.year_published) : null,
        number_of_pages: bookData.number_of_pages ? parseInt(bookData.number_of_pages) : null,
        isbn: bookData.isbn || null
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
            setBookData({ title: '', author: '', publisher: '', year_published: '', number_of_pages: '', isbn: '', image: null, preview: null });
            setIsbnError(null);
            setError(null);
          } catch (err) {
            console.error('Error creating book:', err);
            const errorMessage = err.data?.message || 'Failed to create book';
            // Check if error is related to ISBN
            if (errorMessage.toLowerCase().includes('isbn')) {
              setIsbnError(errorMessage);
            } else {
              setError(errorMessage);
            }
            setLoading(false);
          }
        };
        reader.readAsDataURL(bookData.image);
      } else {
        // No image, just create the book
        await booksAPI.create(payload);
        onSuccess();
        onClose();
        setBookData({ title: '', author: '', publisher: '', year_published: '', number_of_pages: '', isbn: '', image: null, preview: null });
        setIsbnError(null);
        setError(null);
      }
    } catch (err) {
      console.error('Error processing book:', err);
      const errorMessage = err.data?.message || 'Failed to create book';
      // Check if error is related to ISBN
      if (errorMessage.toLowerCase().includes('isbn')) {
        setIsbnError(errorMessage);
      } else {
        setError(errorMessage);
      }
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
              {/* Search */}
              <div className="flex-shrink-0">
                <div className="relative">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setPage(1); // Reset to first page when search changes
                    }}
                    placeholder="Search by title or author..."
                    className="w-full px-4 py-2 pl-10 border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  />
                  <svg
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  {searchQuery && (
                    <button
                      onClick={() => {
                        setSearchQuery('');
                        setPage(1);
                      }}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>

              {loadingBooks ? (
                <div className="text-center py-8 text-slate-500">Loading available books...</div>
              ) : availableBooks.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  {searchQuery ? 'No books found matching your search' : 'No system books available'}
                </div>
              ) : (
                <>
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
                
                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between pt-4 border-t border-slate-200 flex-shrink-0">
                    <button
                      onClick={() => setPage(page - 1)}
                      disabled={page === 1 || loadingBooks}
                      className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>
                    <span className="text-sm text-slate-600">
                      Page {page} of {totalPages}
                    </span>
                    <button
                      onClick={() => setPage(page + 1)}
                      disabled={page >= totalPages || loadingBooks}
                      className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </div>
                )}
                </>
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
                  Publisher
                </label>
                <input
                  type="text"
                  value={bookData.publisher}
                  onChange={(e) => setBookData({ ...bookData, publisher: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg text-slate-800"
                  placeholder="Enter publisher name"
                />
              </div>

              <div className="grid grid-cols-2 gap-4 flex-shrink-0">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Year Published
                  </label>
                  <input
                    type="number"
                    value={bookData.year_published}
                    onChange={(e) => setBookData({ ...bookData, year_published: e.target.value })}
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
                    value={bookData.number_of_pages}
                    onChange={(e) => setBookData({ ...bookData, number_of_pages: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg text-slate-800"
                    placeholder="e.g., 96"
                    min="1"
                  />
                </div>
              </div>

              <div className="flex-shrink-0">
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  ISBN
                </label>
                <input
                  type="text"
                  value={bookData.isbn}
                  onChange={(e) => {
                    setBookData({ ...bookData, isbn: e.target.value });
                    setIsbnError(null);
                  }}
                  className={`w-full px-4 py-2 border rounded-lg text-slate-800 ${
                    isbnError ? 'border-red-300' : 'border-slate-300'
                  }`}
                  placeholder="Enter ISBN (10 or 13 digits)"
                />
                {isbnError && (
                  <p className="mt-2 text-sm text-red-600">
                    {isbnError}
                  </p>
                )}
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

              <div className="flex justify-end space-x-3 pt-4 pb-6 mt-auto flex-shrink-0">
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

