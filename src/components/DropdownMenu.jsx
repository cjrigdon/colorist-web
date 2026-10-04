import React, { useState, useRef, useEffect } from 'react';

const DropdownMenu = ({ 
  options = [], 
  value, 
  onChange, 
  placeholder = 'Select...',
  label,
  className = '',
  searchable = false,
  searchPlaceholder = 'Search...',
  clearable = false,
  clearLabel = 'Clear selection'
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef(null);
  const searchInputRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
        setSearchQuery('');
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && searchable) {
      searchInputRef.current?.focus();
    }
  }, [isOpen, searchable]);

  const selectedOption = options.find(opt => opt.value === value);
  const showClear = clearable && Boolean(selectedOption);

  const visibleOptions = searchable && searchQuery
    ? options.filter((option) => {
        const text = typeof option.label === 'string' ? option.label : String(option.value ?? '');
        return text.toLowerCase().includes(searchQuery.toLowerCase());
      })
    : options;

  const handleSelect = (option) => {
    onChange(option.value);
    setIsOpen(false);
    setSearchQuery('');
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {label && (
        <label className="block text-sm font-medium text-slate-700 mb-2">{label}</label>
      )}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-800 text-sm font-medium cursor-pointer transition-all duration-200 hover:bg-slate-100 hover:border-slate-300 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-offset-0 focus:border-transparent flex items-center justify-between gap-2 group"
        style={{ 
          focusRingColor: '#ea3663'
        }}
      >
        <span className={`${clearable ? 'truncate' : ''} ${selectedOption ? 'text-slate-800 font-medium' : 'text-slate-500'}`}>
          {selectedOption ? (selectedOption.selectedLabel || selectedOption.label) : placeholder}
        </span>
        <svg 
          className={`w-4 h-4 flex-shrink-0 text-slate-500 group-hover:text-slate-700 transition-all duration-200 ${showClear ? 'ml-6' : ''} ${isOpen ? 'rotate-180' : ''}`}
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {showClear && (
        <button
          type="button"
          onClick={() => {
            onChange('');
            setIsOpen(false);
            setSearchQuery('');
          }}
          className={`absolute right-8 ${label ? 'bottom-3' : 'top-1/2 -translate-y-1/2'} p-1 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors`}
          title={clearLabel}
          aria-label={clearLabel}
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}

      {isOpen && (
        <div className="absolute z-50 w-full mt-2 bg-slate-50 rounded-xl shadow-xl border border-slate-200 overflow-hidden">
          {searchable && (
            <div className="p-3 border-b border-slate-200">
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  // Don't submit a surrounding form while searching
                  if (e.key === 'Enter') e.preventDefault();
                }}
                placeholder={searchPlaceholder}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-offset-0"
                style={{ focusRingColor: '#ea3663' }}
              />
            </div>
          )}
          <div className="max-h-60 overflow-y-auto">
            {visibleOptions.length === 0 ? (
              <div className="px-4 py-3 text-sm text-slate-500 text-center">
                {searchQuery ? 'No matches found' : 'No options available'}
              </div>
            ) : (
              visibleOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleSelect(option)}
                  className={`w-full text-left px-4 py-3 text-sm transition-colors ${
                    value === option.value
                      ? 'bg-slate-100 text-slate-900 font-medium'
                      : 'text-slate-700 hover:bg-white hover:text-slate-900'
                  }`}
                >
                  {option.displayLabel || option.label}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default DropdownMenu;
