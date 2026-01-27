import React, { useState, useRef, useEffect } from 'react';
import { booksAPI } from '../services/api';

const BookDropdown = ({ 
  value, 
  onChange, 
  placeholder = 'Select book...',
  label,
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef(null);
  const searchInputRef = useRef(null);

  // Load books when dropdown opens
  useEffect(() => {
    if (isOpen && books.length === 0 && !loading) {
      loadBooks();
    }
  }, [isOpen]);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  const loadBooks = async () => {
    try {
      setLoading(true);
      const response = await booksAPI.getAll(1, 1000);
      let booksData = [];
      if (Array.isArray(response)) {
        booksData = response;
      } else if (response.data && Array.isArray(response.data)) {
        booksData = response.data;
      }
      // Filter out archived books
      const filteredBooks = booksData.filter(book => !book.archived);
      setBooks(filteredBooks);
    } catch (error) {
      console.error('Error loading books:', error);
      setBooks([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
        setSearchQuery('');
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const selectedBook = books.find(book => book.id.toString() === value);

  const handleSelect = (book) => {
    onChange(book.id.toString());
    setIsOpen(false);
    setSearchQuery('');
  };

  // Filter books based on search query
  const filteredBooks = books.filter(book => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    const title = (book.title || '').toLowerCase();
    const author = (book.author || '').toLowerCase();
    return title.includes(query) || author.includes(query);
  });

  const getBookImage = (book) => {
    if (book.image) {
      // If it's a full URL, use it as-is
      if (book.image.startsWith('http://') || book.image.startsWith('https://')) {
        return book.image;
      }
      // If it's a local storage path, construct the full URL
      // Local paths are typically like 'app/public/books/...' or 'books/...'
      // We need to convert to '/storage/books/...' format
      if (book.image.startsWith('app/public/')) {
        const path = book.image.replace('app/public/', '');
        const apiBaseUrl = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000/api';
        const baseUrl = apiBaseUrl.replace('/api', '');
        return `${baseUrl}/storage/${path}`;
      }
      // Try using it as-is (might be a relative path that works)
      return book.image;
    }
    return 'https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=300&h=400&fit=crop';
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {label && (
        <label className="block text-sm font-medium text-slate-700 mb-2">{label}</label>
      )}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-800 text-sm font-medium cursor-pointer transition-all duration-200 hover:bg-slate-100 hover:border-slate-300 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-offset-0 focus:border-transparent flex items-center justify-between group"
        style={{ 
          focusRingColor: '#ea3663'
        }}
      >
        <span className={selectedBook ? 'text-slate-800 font-medium' : 'text-slate-500'}>
          {selectedBook ? (selectedBook.title || `Book ${selectedBook.id}`) : placeholder}
        </span>
        <svg 
          className={`w-4 h-4 text-slate-500 group-hover:text-slate-700 transition-all duration-200 ${isOpen ? 'rotate-180' : ''}`}
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute z-50 w-full mt-2 bg-slate-50 rounded-xl shadow-xl border border-slate-200 overflow-hidden">
          {/* Search Input */}
          <div className="p-3 border-b border-slate-200">
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search books..."
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-offset-0"
              style={{ focusRingColor: '#ea3663' }}
            />
          </div>

          {/* Books List */}
          <div className="max-h-80 overflow-y-auto">
            {loading ? (
              <div className="px-4 py-8 text-center">
                <p className="text-sm text-slate-500">Loading books...</p>
              </div>
            ) : filteredBooks.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <p className="text-sm text-slate-500">
                  {searchQuery ? 'No books found matching your search' : 'No books available'}
                </p>
              </div>
            ) : (
              filteredBooks.map((book) => (
                <button
                  key={book.id}
                  type="button"
                  onClick={() => handleSelect(book)}
                  className={`w-full text-left px-4 py-3 transition-colors flex items-center space-x-3 ${
                    value === book.id.toString()
                      ? 'bg-slate-100 text-slate-900 font-medium'
                      : 'text-slate-700 hover:bg-white hover:text-slate-900'
                  }`}
                >
                  {/* Cover Image */}
                  <img
                    src={getBookImage(book)}
                    alt={book.title || 'Book cover'}
                    className="w-12 h-16 object-cover rounded border border-slate-200 flex-shrink-0"
                    onError={(e) => {
                      e.target.src = 'https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=300&h=400&fit=crop';
                    }}
                  />
                  {/* Book Info */}
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate">
                      {book.title || `Book ${book.id}`}
                    </div>
                    {book.author && (
                      <div className="text-xs text-slate-500 truncate">
                        {book.author}
                      </div>
                    )}
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default BookDropdown;

