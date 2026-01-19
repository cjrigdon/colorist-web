import React from 'react';

/**
 * Primary button component with consistent styling
 * Uses the app's primary color (#ea3663) with hover effects
 */
const PrimaryButton = ({ 
  children, 
  onClick, 
  disabled = false, 
  type = 'button',
  className = '',
  icon = null 
}) => {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`px-4 py-2 text-white rounded-lg font-medium transition-colors flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
      style={{
        backgroundColor: '#ea3663'
      }}
      onMouseEnter={(e) => !e.target.disabled && (e.target.style.backgroundColor = '#d12a4f')}
      onMouseLeave={(e) => !e.target.disabled && (e.target.style.backgroundColor = '#ea3663')}
    >
      {icon && <span className="flex items-center">{icon}</span>}
      {children}
    </button>
  );
};

export default PrimaryButton;

