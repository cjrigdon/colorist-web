import React from 'react';
import PrimaryButton from './PrimaryButton';

/**
 * Empty state component for displaying when no items are found
 */
const EmptyState = ({ 
  icon, 
  title, 
  message, 
  buttonText, 
  onButtonClick 
}) => {
  return (
    <div className="bg-slate-50 rounded-xl shadow-sm border border-slate-200 p-12 text-center">
      {icon && <div className="text-6xl mb-4">{icon}</div>}
      {title && <h3 className="text-xl font-semibold text-slate-800 mb-2 font-venti">{title}</h3>}
      {message && <p className="text-slate-600 mb-4">{message}</p>}
      {buttonText && onButtonClick && (
        <PrimaryButton onClick={onButtonClick}>
          {buttonText}
        </PrimaryButton>
      )}
    </div>
  );
};

export default EmptyState;

