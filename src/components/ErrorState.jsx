import React from 'react';

/**
 * Error state component for displaying error messages
 */
const ErrorState = ({ error, className = '' }) => {
  if (!error) return null;
  
  return (
    <div className={`bg-red-50 border border-red-200 rounded-lg p-4 ${className}`}>
      <p className="text-sm text-red-600">{error}</p>
    </div>
  );
};

export default ErrorState;

