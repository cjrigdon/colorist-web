import React from 'react';

/**
 * Reusable component for infinite scroll loading indicator
 */
const InfiniteScrollLoader = ({ loadingMore, observerTarget }) => {
  return (
    <div ref={observerTarget} className="h-10 flex items-center justify-center">
      {loadingMore && (
        <div className="text-slate-500 py-4">Loading more...</div>
      )}
    </div>
  );
};

export default InfiniteScrollLoader;

