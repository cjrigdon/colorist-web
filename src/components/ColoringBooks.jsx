import React, { useState } from 'react';

const ColoringBooks = () => {
  const [books] = useState([
    {
      id: 1,
      title: 'Nature Mandalas',
      author: 'Sarah Johnson',
      cover: 'https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=300&h=400&fit=crop',
      progress: 65,
      pages: 50,
      completed: 32,
      rating: 5,
      tags: ['mandala', 'nature', 'detailed'],
    },
    {
      id: 2,
      title: 'Fantasy Creatures',
      author: 'Michael Chen',
      cover: 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=300&h=400&fit=crop',
      progress: 30,
      pages: 40,
      completed: 12,
      rating: 4,
      tags: ['fantasy', 'animals', 'creative'],
    },
    {
      id: 3,
      title: 'Floral Patterns',
      author: 'Emma Williams',
      cover: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=300&h=400&fit=crop',
      progress: 100,
      pages: 30,
      completed: 30,
      rating: 5,
      tags: ['flowers', 'patterns', 'relaxing'],
    },
    {
      id: 4,
      title: 'Abstract Art',
      author: 'David Lee',
      cover: 'https://images.unsplash.com/photo-1557683316-973673baf926?w=300&h=400&fit=crop',
      progress: 15,
      pages: 60,
      completed: 9,
      rating: 4,
      tags: ['abstract', 'modern', 'challenging'],
    },
  ]);

  return (
    <div className="space-y-6">
      <div className="bg-slate-50 rounded-2xl p-6">
        <div className="flex items-center justify-end">
          <button 
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
      <div className="bg-slate-50 rounded-2xl p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {books.map((book) => (
          <div
            key={book.id}
            className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-all"
            onMouseEnter={(e) => e.currentTarget.style.borderColor = '#ea3663'}
            onMouseLeave={(e) => e.currentTarget.style.borderColor = '#e2e8f0'}
          >
            {/* Cover Image */}
            <div className="relative aspect-[3/4] bg-slate-100 overflow-hidden">
              <img
                src={book.cover}
                alt={book.title}
                className="w-full h-full object-cover"
              />
              {book.progress === 100 && (
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

              {/* Progress */}
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

              {/* Rating */}
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

              {/* Tags */}
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

              {/* Actions */}
              <div className="flex space-x-2">
                <button 
                  className="flex-1 px-3 py-2 text-white rounded-lg text-sm font-medium transition-colors"
                  style={{
                    backgroundColor: '#ea3663'
                  }}
                  onMouseEnter={(e) => e.target.style.backgroundColor = '#d12a4f'}
                  onMouseLeave={(e) => e.target.style.backgroundColor = '#ea3663'}
                >
                  Open
                </button>
                <button className="px-3 py-2 border border-slate-300 text-slate-600 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        ))}
        </div>

        {books.length === 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
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
    </div>
  );
};

export default ColoringBooks;

