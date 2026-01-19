import React from 'react';

/**
 * Loading state component
 */
const LoadingState = ({ message = 'Loading...' }) => {
  return (
    <div className="flex items-center justify-center py-12">
      <div className="text-slate-500">{message}</div>
    </div>
  );
};

export default LoadingState;

