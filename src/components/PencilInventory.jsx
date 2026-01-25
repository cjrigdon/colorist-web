import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { coloredPencilSetsAPI } from '../services/api';
import { useInfiniteScroll } from '../hooks/useInfiniteScroll';
import InfiniteScrollLoader from './InfiniteScrollLoader';
import AddPencilSetModal from './AddPencilSetModal';
import LoadingState from './LoadingState';
import ErrorState from './ErrorState';

// Component for individual set size item
const SetSizeItem = ({ setSize, onSelect }) => {
  const [imageError, setImageError] = useState(false);
  
  const thumbnail = setSize.thumb || setSize.set?.thumb || null;
  const thumbnailUrl = thumbnail 
    ? (thumbnail.startsWith('http') ? thumbnail : `${process.env.REACT_APP_API_BASE_URL?.replace('/api', '') || 'http://localhost:8000'}/storage/${thumbnail}`)
    : null;

  const displayName = setSize.name || `${setSize.count}-piece set`;
  const setName = setSize.set?.name || 'Unknown';

  return (
    <button
      onClick={() => onSelect(setSize.id)}
      className="w-full text-left p-4 rounded-lg border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-colors group"
    >
      <div className="flex items-center gap-3">
        {thumbnailUrl && !imageError ? (
          <img 
            src={thumbnailUrl} 
            alt={`${setSize.set?.brand?.name || setSize.set?.brand || 'Unknown'} ${setName}`}
            className="w-12 h-12 object-cover rounded-lg flex-shrink-0"
            onError={() => setImageError(true)}
          />
        ) : (
          <div 
            className="flex items-center justify-center w-12 h-12 rounded-lg flex-shrink-0"
            style={{ backgroundColor: '#f1f5f9' }}
          >
            <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <h4 className="font-medium text-slate-800 truncate">{setName}</h4>
            <span className="text-xs text-slate-500 flex-shrink-0 ml-2 bg-slate-200 px-2 py-0.5 rounded-full font-medium">
              {setSize.count || 0} pencils
            </span>
          </div>
          <p className="text-sm text-slate-600 truncate">
            {displayName}
          </p>
        </div>
        <svg 
          className="w-5 h-5 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </button>
  );
};

const PencilInventory = () => {
  const navigate = useNavigate();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Transform function for pencil set sizes
  const transformPencilSetSizes = (data) => {
    // Handle both array and paginated response
    const items = Array.isArray(data) ? data : (data.data || []);
    return items.map(setSize => ({
      ...setSize,
      // Ensure brand name is accessible
      brandName: setSize.set?.brand?.name || setSize.set?.brand || 'Unknown',
      // Ensure set name is accessible
      setName: setSize.set?.name || 'Unknown'
    }));
  };

  // Use infinite scroll hook to get user's set sizes (without pencils for performance)
  const { items: setSizes, loading, error, loadingMore, observerTarget, refetch } = useInfiniteScroll(
    (page, perPage) => coloredPencilSetsAPI.getAll(page, perPage, true), // excludePencils = true
    transformPencilSetSizes,
    { perPage: 100 }
  );

  // Group set sizes by brand and sort
  const groupedByBrand = useMemo(() => {
    if (!setSizes || setSizes.length === 0) {
      return {};
    }

    const grouped = {};
    
    setSizes.forEach(setSize => {
      const brandName = setSize.brandName || 'Unknown';
      if (!grouped[brandName]) {
        grouped[brandName] = [];
      }
      grouped[brandName].push(setSize);
    });

    // Sort each brand's sets: first by set name, then by count
    Object.keys(grouped).forEach(brandName => {
      grouped[brandName].sort((a, b) => {
        // First sort by set name
        const nameA = a.setName || '';
        const nameB = b.setName || '';
        if (nameA !== nameB) {
          return nameA.localeCompare(nameB);
        }
        // Then sort by count
        return (a.count || 0) - (b.count || 0);
      });
    });

    return grouped;
  }, [setSizes]);

  // Get sorted brand names
  const sortedBrandNames = useMemo(() => {
    return Object.keys(groupedByBrand).sort((a, b) => a.localeCompare(b));
  }, [groupedByBrand]);

  const handleSetSizeClick = (setSizeId) => {
    navigate(`/studio/media/set-size/${setSizeId}`);
  };

  if (loading && setSizes.length === 0) {
    return <LoadingState message="Loading pencil sets..." />;
  }

  if (error) {
    return <ErrorState message={error} />;
  }

  return (
    <>
      <div className="space-y-6">
        <div className="px-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-slate-800 font-venti">Colored Pencil Sets</h2>
              <p className="text-sm text-slate-600 mt-1">Manage your colored pencil collection</p>
            </div>
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
              <span>Add Set</span>
            </button>
          </div>
        </div>

        {/* Sets grouped by brand */}
        <div className="space-y-8">
          {sortedBrandNames.length === 0 && !loading ? (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
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
            sortedBrandNames.map(brandName => {
              const brandSets = groupedByBrand[brandName];
              return (
                <div key={brandName} className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                  <h3 className="text-xl font-semibold text-slate-800 mb-4 font-venti border-b border-slate-200 pb-2">
                    {brandName}
                  </h3>
                  <div className="space-y-2">
                    {brandSets.map(setSize => (
                      <SetSizeItem
                        key={setSize.id}
                        setSize={setSize}
                        onSelect={handleSetSizeClick}
                      />
                    ))}
                  </div>
                </div>
              );
            })
          )}
          
          {/* Infinite scroll trigger */}
          {loadingMore && <InfiniteScrollLoader loadingMore={loadingMore} observerTarget={observerTarget} />}
        </div>
      </div>
      
      <AddPencilSetModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={() => {
          refetch();
          setIsAddModalOpen(false);
        }}
      />
    </>
  );
};

export default PencilInventory;
