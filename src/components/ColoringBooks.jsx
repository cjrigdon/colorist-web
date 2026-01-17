import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { booksAPI } from '../services/api';
import { useInfiniteScroll } from '../hooks/useInfiniteScroll';
import InfiniteScrollLoader from './InfiniteScrollLoader';
import AddBookModal from './AddBookModal';

const ColoringBooks = () => {
  const navigate = useNavigate();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  
  // Transform function for books
  const transformBooks = (data) => {
    return data
      .filter(book => !book.archived)
      .map(book => ({
        id: book.id,
        title: book.title || 'Untitled',
        author: book.author || 'Unknown',
        cover: book.image || 'https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=300&h=400&fit=crop',
        progress: 0, // Not available in API
        pages: 0, // Not available in API
        completed: 0, // Not available in API
        rating: 0, // Not available in API
        tags: [], // Not available in API
      }));
  };

  // Use infinite scroll hook
  const { items: books, loading, error, loadingMore, observerTarget, refetch } = useInfiniteScroll(
    booksAPI.getAll,
    transformBooks,
    { perPage: 40 }
  );

  return (
    <div className="space-y-6">
      <div className="px-4">
        <div className="flex items-center justify-end">
          <button 
          onClick={() => setIsAddModalOpen(true)}
          className="px-4 py-2 text-white rounded-lg font-medium transition-colors flex items-center space-x-2"
          style={{
            backgroundColor: '#ea3663'
          }}
          onMouseEnter={(e) => e.target.style.backgroundColor = '#d12a4f'}
          onMouseLeave={(e) => e.target.style.backgroundColor = '#ea3663'}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          <span>Add Book</span>
        </button>
        </div>
      </div>

      {/* Books Grid Section */}
      <div className="bg-white p-6">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-slate-500">Loading books...</div>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        ) : null}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {books.map((book) => (
          <div
            key={book.id}
            className="bg-slate-50 rounded-xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-all cursor-pointer"
            onMouseEnter={(e) => e.currentTarget.style.borderColor = '#ea3663'}
            onMouseLeave={(e) => e.currentTarget.style.borderColor = '#e2e8f0'}
            onClick={() => navigate(`/edit/book/${book.id}`)}
          >
            {/* Cover Image */}
            <div className="relative aspect-[3/4] bg-slate-100 overflow-hidden">
              <img
                src={book.cover}
                alt={book.title}
                className="w-full h-full object-cover"
              />
              {book.progress === 100 && book.pages > 0 && (
                <div className="absolute top-2 right-2 bg-green-500 text-white px-2 py-1 rounded-full text-xs font-medium flex items-center space-x-1">
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span>Complete</span>
                </div>
              )}
            </div>

            {/* Content */}
            <div className="p-5">
              <h3 className="font-semibold text-slate-800 mb-1 line-clamp-2">{book.title}</h3>
              <p className="text-sm text-slate-600 mb-3">by {book.author}</p>

              {/* Progress - Only show if available */}
              {book.pages > 0 && (
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-slate-600">Progress</span>
                    <span className="text-xs font-medium text-slate-800">{book.completed}/{book.pages} pages</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2">
                    <div
                      className="h-2 rounded-full transition-all"
                      style={{
                        backgroundColor: '#ea3663',
                        width: `${book.progress}%`
                      }}
                    ></div>
                  </div>
                </div>
              )}

              {/* Rating - Only show if available */}
              {book.rating > 0 && (
                <div className="flex items-center space-x-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <svg
                      key={i}
                      className={`w-4 h-4 ${i < book.rating ? 'text-yellow-400' : 'text-slate-300'}`}
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
              )}

              {/* Tags - Only show if available */}
              {book.tags && book.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-4">
                  {book.tags.slice(0, 2).map((tag, index) => (
                    <span
                      key={index}
                      className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-xs"
                    >
                      {tag}
                    </span>
                  ))}
                  {book.tags.length > 2 && (
                    <span className="px-2 py-0.5 text-slate-500 rounded text-xs">
                      +{book.tags.length - 2}
                    </span>
                  )}
                </div>
              )}

            </div>
          </div>
        ))}
        </div>

        {/* Infinite scroll trigger */}
        {books.length > 0 && (
          <InfiniteScrollLoader loadingMore={loadingMore} observerTarget={observerTarget} />
        )}

        {books.length === 0 && !loading && (
          <div className="bg-slate-50 rounded-xl shadow-sm border border-slate-200 p-12 text-center">
          <div className="text-6xl mb-4">📖</div>
          <h3 className="text-xl font-semibold text-slate-800 mb-2 font-venti">No Coloring Books Yet</h3>
          <p className="text-slate-600 mb-4">Add your first coloring book to start tracking your progress</p>
          <button 
            className="px-6 py-3 text-white rounded-lg font-medium transition-colors"
            style={{
              backgroundColor: '#ea3663'
            }}
            onMouseEnter={(e) => e.target.style.backgroundColor = '#d12a4f'}
            onMouseLeave={(e) => e.target.style.backgroundColor = '#ea3663'}
          >
            Add Book
          </button>
          </div>
        )}
      </div>
      <AddBookModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={() => {
          refetch();
          setIsAddModalOpen(false);
        }}
      />
    </div>
  );
};

export default ColoringBooks;

