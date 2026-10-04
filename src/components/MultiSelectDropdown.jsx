import React, { useState, useRef, useEffect } from 'react';

const MultiSelectDropdown = ({
  options = [],
  value = [],
  onChange,
  placeholder = 'Select...',
  searchPlaceholder = 'Search...',
  emptyMessage = 'No options available',
  className = '',
  clearable = false,
  clearLabel = 'Clear selection',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef(null);
  const searchInputRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return undefined;
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
        setSearchQuery('');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    searchInputRef.current?.focus();
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const selectedValues = Array.isArray(value) ? value : [];
  const selectedOptions = options.filter(option => selectedValues.includes(option.value));
  const query = searchQuery.trim().toLowerCase();
  const visibleOptions = query
    ? options.filter(option => String(option.label).toLowerCase().includes(query))
    : options;

  const toggleOption = (optionValue) => {
    onChange(
      selectedValues.includes(optionValue)
        ? selectedValues.filter(v => v !== optionValue)
        : [...selectedValues, optionValue]
    );
  };

  const summary = selectedOptions.length === 0
    ? placeholder
    : selectedOptions.length <= 2
    ? selectedOptions.map(option => option.label).join(', ')
    : `${selectedOptions.length} selected`;

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(open => !open)}
        className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-800 text-sm font-medium cursor-pointer transition-all duration-200 hover:bg-slate-100 hover:border-slate-300 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-offset-0 focus:border-transparent flex items-center justify-between gap-2 group"
      >
        <span className={`truncate ${selectedOptions.length ? 'text-slate-800' : 'text-slate-500'}`}>{summary}</span>
        <span className="flex items-center gap-2 flex-shrink-0">
          {selectedOptions.length > 0 && (
            <span
              className="inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1.5 rounded-full text-xs font-semibold text-white"
              style={{ backgroundColor: '#ea3663' }}
            >
              {selectedOptions.length}
            </span>
          )}
          {clearable && selectedOptions.length > 0 && <span className="w-6" aria-hidden="true" />}
          <svg
            className={`w-4 h-4 text-slate-500 group-hover:text-slate-700 transition-all duration-200 ${isOpen ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </span>
      </button>
      {clearable && selectedOptions.length > 0 && (
        <button
          type="button"
          onClick={() => {
            onChange([]);
            setIsOpen(false);
            setSearchQuery('');
          }}
          className="absolute right-10 top-1/2 -translate-y-1/2 p-1 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors"
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
          <div className="p-3 border-b border-slate-200">
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') e.preventDefault();
              }}
              placeholder={searchPlaceholder}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-offset-0"
            />
          </div>
          <div className="max-h-60 overflow-y-auto py-1">
            {visibleOptions.length === 0 ? (
              <div className="px-4 py-3 text-sm text-slate-500 text-center">
                {query ? 'No matches found' : emptyMessage}
              </div>
            ) : (
              visibleOptions.map(option => {
                const selected = selectedValues.includes(option.value);
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => toggleOption(option.value)}
                    className={`w-full text-left px-4 py-2.5 text-sm flex items-center gap-2 transition-colors hover:bg-white ${selected ? 'font-medium text-slate-900' : 'text-slate-700'}`}
                  >
                    <span
                      className={`flex-shrink-0 w-4 h-4 rounded border flex items-center justify-center ${selected ? '' : 'border-slate-300 bg-white'}`}
                      style={selected ? { backgroundColor: '#ea3663', borderColor: '#ea3663' } : undefined}
                    >
                      {selected && (
                        <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </span>
                    {option.icon}
                    <span className="truncate">{option.label}</span>
                  </button>
                );
              })
            )}
          </div>
          {selectedOptions.length > 0 && (
            <div className="p-2 border-t border-slate-200">
              <button
                type="button"
                onClick={() => onChange([])}
                className="w-full px-3 py-1.5 text-sm font-medium rounded-lg hover:bg-white transition-colors"
                style={{ color: '#ea3663' }}
              >
                Clear selection
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MultiSelectDropdown;
