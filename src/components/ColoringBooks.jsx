import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { booksAPI, userAPI } from '../services/api';
import { useInfiniteScroll } from '../hooks/useInfiniteScroll';
import InfiniteScrollLoader from './InfiniteScrollLoader';
import AddBookModal from './AddBookModal';
import PrimaryButton from './PrimaryButton';
import HoverableCard from './HoverableCard';
import LoadingState from './LoadingState';
import ErrorState from './ErrorState';
import EmptyState from './EmptyState';
import UpgradeBanner from './UpgradeBanner';
import DeleteConfirmationModal from './DeleteConfirmationModal';

const ColoringBooks = ({ user }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [bookToDelete, setBookToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [favorites, setFavorites] = useState(new Set());
  const [togglingFavorite, setTogglingFavorite] = useState(null);

  // Check if we should open the add modal from navigation state
  useEffect(() => {
    if (location.state?.openAddModal) {
      setIsAddModalOpen(true);
      // Clear the state to prevent reopening on re-render
      navigate(location.pathname, { replace: true, state: { ...location.state, openAddModal: false } });
    }
  }, [location.state, navigate, location.pathname]);
  
  // Transform function for books (no filtering/sorting needed - done by API)
  const transformBooks = (data) => {
    return data.map(book => {
      // Ensure id is a number for consistent comparison with favorites
      const id = Number(book.id);
      return {
        id: !isNaN(id) ? id : book.id,
        title: book.title || 'Untitled',
        author: book.author || 'Unknown',
        year_published: book.year_published || null,
        cover: book.image || 'https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=300&h=400&fit=crop',
        progress: 0, // Not available in API
        pages: 0, // Not available in API
        completed: 0, // Not available in API
        rating: 0, // Not available in API
        tags: [], // Not available in API
      };
    });
  };

  // Check if user has free plan
  const isFreePlan = user?.subscription_plan === 'free' || !user?.subscription_plan;
  const FREE_PLAN_LIMIT = 5;

  // Wrapper function to add sorting to API call
  const fetchBooks = useCallback((page, perPage) => {
    return booksAPI.getAll(page, perPage, {
      sort: 'title',
      sort_direction: 'asc',
      archived: false
    });
  }, []);

  // Use infinite scroll hook
  const { items: allBooks, loading, error, loadingMore, observerTarget, refetch } = useInfiniteScroll(
    fetchBooks,
    transformBooks,
    { perPage: 40 }
  );

  // Books are already sorted and limited by API
  const books = allBooks;
  const hasReachedLimit = isFreePlan && allBooks.length >= FREE_PLAN_LIMIT;

  // Fetch user favorites
  const fetchFavorites = useCallback(async () => {
    try {
      const userId = user?.id;
      if (!userId) return;
      
      const response = await userAPI.getFavorites(userId);
      
      // Handle different response structures
      let favoritesData = [];
      if (Array.isArray(response)) {
        favoritesData = response;
      } else if (response?.data && Array.isArray(response.data)) {
        favoritesData = response.data;
      }
      
      if (favoritesData.length > 0) {
        const favoriteIds = new Set();
        favoritesData.forEach(fav => {
          // Check for both possible type formats and use flexible matching
          const isBook = fav.favoritable_type === 'App\\Models\\Book' || 
                        fav.favoritable_type === 'App\Models\Book' ||
                        fav.favoritable_type?.includes('Book');
          
          if (isBook && fav.favoritable_id !== undefined && fav.favoritable_id !== null) {
            // Convert to number to ensure type consistency with book.id
            const id = Number(fav.favoritable_id);
            if (!isNaN(id)) {
              favoriteIds.add(id);
            }
          }
        });
        setFavorites(favoriteIds);
      } else {
        // If no favorites found, set empty Set
        setFavorites(new Set());
      }
    } catch (err) {
      console.error('Error fetching favorites:', err);
      setFavorites(new Set());
    }
  }, [user]);

  useEffect(() => {
    fetchFavorites();
  }, [fetchFavorites]);

  const handleToggleFavorite = async (bookId, e) => {
    e.stopPropagation();
    if (togglingFavorite === bookId) return;
    
    setTogglingFavorite(bookId);
    try {
      const result = await booksAPI.toggleFavorite(bookId);
      
      // Update favorites state
      // Convert bookId to number to ensure type consistency
      const numericId = Number(bookId);
      setFavorites(prev => {
        const newFavorites = new Set(prev);
        if (result.is_favorited) {
          newFavorites.add(numericId);
        } else {
          newFavorites.delete(numericId);
        }
        return newFavorites;
      });
    } catch (err) {
      console.error('Error toggling favorite:', err);
      alert(err.data?.message || err.message || 'Failed to update favorite');
    } finally {
      setTogglingFavorite(null);
    }
  };

  const handleDelete = async () => {
    if (!bookToDelete) return;
    
    setDeleting(true);
    
    try {
      await booksAPI.delete(bookToDelete.id);
      await refetch();
      setShowDeleteModal(false);
      setBookToDelete(null);
    } catch (err) {
      console.error('Error deleting book:', err);
      alert(err.data?.message || err.message || 'Failed to delete book');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="px-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-semibold text-slate-800 font-venti">Coloring Books</h3>
          <PrimaryButton 
            onClick={() => {
              if (hasReachedLimit) {
                alert('You\'ve reached the limit of 5 books on the free plan. Please upgrade to Premium to add more.');
                return;
              }
              setIsAddModalOpen(true);
            }}
            disabled={hasReachedLimit}
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            }
          >
            Add Book
          </PrimaryButton>
        </div>
      </div>

      {/* Books Grid Section */}
      <div className="bg-white p-6">
        {hasReachedLimit && (
          <UpgradeBanner itemType="books" />
        )}
        {loading && (
          <div className="bg-white p-12 text-center">
            <div className="modern-loader mb-4">
              <div className="loader-ring">
                <div className="loader-ring-segment"></div>
                <div className="loader-ring-segment"></div>
                <div className="loader-ring-segment"></div>
                <div className="loader-ring-segment"></div>
              </div>
            </div>
            <h3 className="text-xl font-semibold text-slate-800 mb-2 font-venti">Loading Books...</h3>
            <p className="text-slate-600">Fetching your coloring books</p>
          </div>
        )}
        {error && <ErrorState error={error} className="mb-6" />}
        {!loading && !error && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {books.map((book) => (
              <HoverableCard
                key={book.id}
                onClick={() => navigate(`/edit/book/${book.id}`)}
                className="relative"
              >
            {/* Favorite and Delete Buttons - Top Right */}
            <div className="absolute top-2 right-2 z-10 flex items-center gap-2">
              <button
                onClick={(e) => handleToggleFavorite(book.id, e)}
                className={`p-2 bg-white bg-opacity-80 hover:bg-opacity-100 rounded-full transition-all shadow-sm ${
                  favorites.has(Number(book.id)) ? 'text-red-500' : 'text-slate-600 hover:text-red-500'
                }`}
                title={favorites.has(Number(book.id)) ? 'Remove from favorites' : 'Add to favorites'}
                disabled={togglingFavorite === book.id}
              >
                <svg className="w-4 h-4" fill={favorites.has(Number(book.id)) ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setBookToDelete({ id: book.id, title: book.title });
                  setShowDeleteModal(true);
                }}
                className="p-2 bg-white bg-opacity-80 hover:bg-opacity-100 rounded-full text-slate-600 hover:text-red-600 transition-all shadow-sm"
                title="Delete book"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
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
              <div className="flex items-center justify-between text-sm text-slate-600 mb-3">
                <span>by {book.author}</span>
                {book.year_published && <span className="text-slate-500">{book.year_published}</span>}
              </div>

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
          </HoverableCard>
        ))}
          </div>
        )}

        {/* Infinite scroll trigger */}
        {books.length > 0 && (
          <InfiniteScrollLoader loadingMore={loadingMore} observerTarget={observerTarget} />
        )}

        {books.length === 0 && !loading && !error && (
          <EmptyState
            icon="📖"
            title="No Coloring Books Yet"
            message="Add your first coloring book to start tracking your progress"
            buttonText="Add Book"
            onButtonClick={() => setIsAddModalOpen(true)}
          />
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
      <DeleteConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setBookToDelete(null);
        }}
        onConfirm={handleDelete}
        itemName={bookToDelete?.title || 'Book'}
        itemType="book"
      />
    </div>
  );
};

export default ColoringBooks;

