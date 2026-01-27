import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { coloredPencilSetsAPI } from '../services/api';
import { useInfiniteScroll } from '../hooks/useInfiniteScroll';
import InfiniteScrollLoader from './InfiniteScrollLoader';
import AddPencilSetModal from './AddPencilSetModal';
import ShoppingListGeneratorModal from './ShoppingListGeneratorModal';
import LoadingState from './LoadingState';
import ErrorState from './ErrorState';
import UpgradeBanner from './UpgradeBanner';

// Component for individual set size item - displayed as a box
const SetSizeItem = ({ setSize, onSelect }) => {
  const [imageError, setImageError] = useState(false);
  
  const thumbnail = setSize.thumb || setSize.set?.thumb || null;
  const thumbnailUrl = thumbnail 
    ? (thumbnail.startsWith('http') ? thumbnail : `${process.env.REACT_APP_API_BASE_URL?.replace('/api', '') || 'http://localhost:8000'}/storage/${thumbnail}`)
    : null;

  const displayName = setSize.name || `${setSize.count}-piece set`;
  const setName = setSize.set?.name || 'Unknown';
  const brandName = setSize.brandName || setSize.set?.brand?.name || setSize.set?.brand || 'Unknown';

  return (
    <button
      onClick={() => onSelect(setSize.id)}
      className="w-full text-left p-4 rounded-lg border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-all hover:shadow-md group"
    >
      <div className="flex flex-col">
        {thumbnailUrl && !imageError ? (
          <img 
            src={thumbnailUrl} 
            alt={`${brandName} ${setName}`}
            className="w-full h-32 object-cover rounded-lg mb-3"
            onError={() => setImageError(true)}
          />
        ) : (
          <div 
            className="flex items-center justify-center w-full h-32 rounded-lg mb-3"
            style={{ backgroundColor: '#f1f5f9' }}
          >
            <svg className="w-12 h-12 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
          </div>
        )}
        <div className="flex-1">
          <p className="text-xs text-slate-500 mb-1 line-clamp-1">{brandName}</p>
          <h4 className="font-medium text-slate-800 mb-1 line-clamp-2">{setName}</h4>
          <p className="text-sm text-slate-600 mb-2 line-clamp-1">
            {displayName}
          </p>
          <span className="inline-block text-xs text-slate-500 bg-slate-200 px-2 py-0.5 rounded-full font-medium">
            {setSize.count || 0} pencils
          </span>
        </div>
      </div>
    </button>
  );
};

const PencilInventory = ({ user }) => {
  const navigate = useNavigate();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isShoppingListModalOpen, setIsShoppingListModalOpen] = useState(false);

  // Check if user has free plan
  const isFreePlan = user?.subscription_plan === 'free' || !user?.subscription_plan;
  const FREE_PLAN_LIMIT = 5;

  // Transform function for pencil set sizes
  const transformPencilSetSizes = (data) => {
    // Handle both array and paginated response
    const items = Array.isArray(data) ? data : (data.data || []);
    return items.map(setSize => ({
      ...setSize,
      // Ensure brand name is accessible
      brandName: setSize.set?.brand?.name || setSize.set?.brand || 'Unknown',
      // Ensure set name is accessible
      setName: setSize.set?.name || 'Unknown',
      // Ensure media_type is accessible
      mediaType: setSize.set?.media_type || null
    }));
  };

  // Use infinite scroll hook to get user's set sizes (without pencils for performance)
  const { items: allSetSizes, loading, error, loadingMore, observerTarget, refetch } = useInfiniteScroll(
    (page, perPage) => coloredPencilSetsAPI.getAll(page, perPage, true), // excludePencils = true
    transformPencilSetSizes,
    { perPage: 100 }
  );

  // Limit items for free plan users
  const setSizes = useMemo(() => {
    if (isFreePlan) {
      return allSetSizes.slice(0, FREE_PLAN_LIMIT);
    }
    return allSetSizes;
  }, [allSetSizes, isFreePlan]);

  const hasReachedLimit = isFreePlan && allSetSizes.length >= FREE_PLAN_LIMIT;

  // Group set sizes by media_type and sort
  const groupedByMediaType = useMemo(() => {
    if (!setSizes || setSizes.length === 0) {
      return {};
    }

    const grouped = {};
    
    setSizes.forEach(setSize => {
      const mediaType = setSize.mediaType || 'Unspecified';
      if (!grouped[mediaType]) {
        grouped[mediaType] = [];
      }
      grouped[mediaType].push(setSize);
    });

    // Sort each media_type's sets: first by brand, then by set name, then by count
    Object.keys(grouped).forEach(mediaType => {
      grouped[mediaType].sort((a, b) => {
        // First sort by brand name
        const brandA = a.brandName || '';
        const brandB = b.brandName || '';
        if (brandA !== brandB) {
          return brandA.localeCompare(brandB);
        }
        // Then sort by set name
        const nameA = a.setName || '';
        const nameB = b.setName || '';
        if (nameA !== nameB) {
          return nameA.localeCompare(nameB);
        }
        // Finally sort by count (size)
        return (a.count || 0) - (b.count || 0);
      });
    });

    return grouped;
  }, [setSizes]);

  // Get sorted media_type names
  const sortedMediaTypes = useMemo(() => {
    return Object.keys(groupedByMediaType).sort((a, b) => a.localeCompare(b));
  }, [groupedByMediaType]);

  const handleSetSizeClick = (setSizeId) => {
    navigate(`/studio/media/set-size/${setSizeId}`);
  };

  if (error) {
    return <ErrorState message={error} />;
  }

  return (
    <>
      <div className="space-y-6">
        <div className="px-4">
          <div className="flex items-center justify-between">
            <div>
            <h3 className="text-xl font-semibold text-slate-800 font-venti">Media</h3>
            </div>
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setIsShoppingListModalOpen(true)}
                className="px-4 py-2 text-white rounded-lg font-medium transition-colors flex items-center space-x-2"
                style={{
                  backgroundColor: '#10b981'
                }}
                onMouseEnter={(e) => e.target.style.backgroundColor = '#059669'}
                onMouseLeave={(e) => e.target.style.backgroundColor = '#10b981'}
                title="Generate Shopping List"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
              </button>
              <button 
                onClick={() => {
                  if (hasReachedLimit) {
                    alert('You\'ve reached the limit of 5 pencil sets on the free plan. Please upgrade to Premium to add more.');
                    return;
                  }
                  setIsAddModalOpen(true);
                }}
                disabled={hasReachedLimit}
                className="px-4 py-2 text-white rounded-lg font-medium transition-colors flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  backgroundColor: hasReachedLimit ? '#cbd5e1' : '#ea3663'
                }}
                onMouseEnter={(e) => {
                  if (!hasReachedLimit) {
                    e.target.style.backgroundColor = '#d12a4f';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!hasReachedLimit) {
                    e.target.style.backgroundColor = '#ea3663';
                  }
                }}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span>Add Set</span>
              </button>
            </div>
          </div>
        </div>

        {/* Sets grouped by brand */}
        <div className="bg-white p-6">
          {loading && setSizes.length === 0 ? (
            <div className="bg-white p-12 text-center">
              <div className="modern-loader mb-4">
                <div className="loader-ring">
                  <div className="loader-ring-segment"></div>
                  <div className="loader-ring-segment"></div>
                  <div className="loader-ring-segment"></div>
                  <div className="loader-ring-segment"></div>
                </div>
              </div>
              <h3 className="text-xl font-semibold text-slate-800 mb-2 font-venti">Loading Pencil Sets...</h3>
              <p className="text-slate-600">Fetching your colored pencil sets</p>
            </div>
          ) : sortedMediaTypes.length === 0 ? (
            <div className="p-12 text-center">
              <div className="text-6xl mb-4">✏️</div>
              <h3 className="text-xl font-semibold text-slate-800 mb-2 font-venti">No Pencil Sets</h3>
              <p className="text-slate-600 mb-4">Get started by adding your first colored pencil set</p>
              <button 
                onClick={() => setIsAddModalOpen(true)}
                className="px-4 py-2 text-white rounded-lg font-medium transition-colors inline-flex items-center space-x-2"
                style={{
                  backgroundColor: '#ea3663'
                }}
                onMouseEnter={(e) => e.target.style.backgroundColor = '#d12a4f'}
                onMouseLeave={(e) => e.target.style.backgroundColor = '#ea3663'}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span>Add Set</span>
              </button>
            </div>
          ) : (
            <>
              {hasReachedLimit && (
                <UpgradeBanner itemType="pencil sets" />
              )}
              <div className="space-y-8">
                {sortedMediaTypes.map(mediaType => {
                  const mediaTypeSets = groupedByMediaType[mediaType];
                  return (
                    <div key={mediaType}>
                      <h3 className="text-xl font-semibold text-slate-800 mb-4 font-venti border-b border-slate-200 pb-2">
                        {mediaType}
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                        {mediaTypeSets.map(setSize => (
                          <SetSizeItem
                            key={setSize.id}
                            setSize={setSize}
                            onSelect={handleSetSizeClick}
                          />
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
        {/* Infinite scroll trigger */}
        {loadingMore && <InfiniteScrollLoader loadingMore={loadingMore} observerTarget={observerTarget} />}
      </div>
      
      <AddPencilSetModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={() => {
          refetch();
          setIsAddModalOpen(false);
        }}
      />
      
      <ShoppingListGeneratorModal
        isOpen={isShoppingListModalOpen}
        onClose={() => setIsShoppingListModalOpen(false)}
      />
    </>
  );
};

export default PencilInventory;
