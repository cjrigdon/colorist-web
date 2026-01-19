import React from 'react';

/**
 * Card component with hover border color effect
 * Border changes from #e2e8f0 to #ea3663 on hover
 */
const HoverableCard = ({ 
  children, 
  onClick, 
  className = '',
  cursor = 'cursor-pointer'
}) => {
  return (
    <div
      className={`bg-slate-50 rounded-xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-all ${cursor} ${className}`}
      onMouseEnter={(e) => e.currentTarget.style.borderColor = '#ea3663'}
      onMouseLeave={(e) => e.currentTarget.style.borderColor = '#e2e8f0'}
      onClick={onClick}
    >
      {children}
    </div>
  );
};

export default HoverableCard;

