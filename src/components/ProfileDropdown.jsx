import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const ProfileDropdown = ({ sidebarCollapsed = false }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleLogout = () => {
    // Handle logout logic here
    navigate('/');
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center transition-all duration-300 rounded-lg p-2 hover:bg-slate-50 hover:bg-opacity-50 ${
          sidebarCollapsed ? 'justify-center' : 'space-x-3'
        }`}
      >
        <div 
          className="h-10 w-10 rounded-full cursor-pointer hover:opacity-80 transition-opacity flex-shrink-0"
          style={{
            background: 'linear-gradient(to bottom right, #ea3663, #ff8e7e)'
          }}
        ></div>
        <div className={`transition-all duration-300 ${
          sidebarCollapsed 
            ? 'opacity-0 w-0 overflow-hidden' 
            : 'opacity-100 w-auto flex-1 min-w-0'
        }`}>
          <p className="text-sm font-medium text-slate-800 truncate">User Name</p>
          <p className="text-xs text-slate-500 truncate">user@example.com</p>
        </div>
        <svg 
          className={`w-4 h-4 text-slate-600 transition-transform duration-200 flex-shrink-0 ${
            sidebarCollapsed ? 'hidden' : ''
          } ${isOpen ? 'rotate-180' : ''}`}
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute bottom-full left-0 mb-2 w-64 bg-slate-50 rounded-xl shadow-lg border border-slate-200 overflow-hidden z-50">
          <div className="p-4 border-b border-slate-100">
            <div className="flex items-center space-x-3">
              <div 
                className="h-12 w-12 rounded-full flex-shrink-0"
                style={{
                  background: 'linear-gradient(to bottom right, #ea3663, #ff8e7e)'
                }}
              ></div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-800 truncate">User Name</p>
                <p className="text-xs text-slate-500 truncate">user@example.com</p>
              </div>
            </div>
          </div>

          <div className="py-2">
            <button
              onClick={() => {
                navigate('/profile');
                setIsOpen(false);
              }}
              className="w-full flex items-center space-x-3 px-4 py-3 text-left hover:bg-white transition-colors group"
            >
              <svg className="w-5 h-5 text-slate-400 group-hover:text-slate-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <span className="text-sm font-medium text-slate-700 group-hover:text-slate-900">Profile</span>
            </button>

            <button
              onClick={() => {
                window.dispatchEvent(new Event('restart-tour'));
                setIsOpen(false);
              }}
              className="w-full flex items-center space-x-3 px-4 py-3 text-left hover:bg-white transition-colors group"
            >
              <svg className="w-5 h-5 text-slate-400 group-hover:text-slate-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-sm font-medium text-slate-700 group-hover:text-slate-900">Take Tour</span>
            </button>

            <button
              onClick={() => {
                navigate('/privacy-policy');
                setIsOpen(false);
              }}
              className="w-full flex items-center space-x-3 px-4 py-3 text-left hover:bg-white transition-colors group"
            >
              <svg className="w-5 h-5 text-slate-400 group-hover:text-slate-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <span className="text-sm font-medium text-slate-700 group-hover:text-slate-900">Privacy Policy</span>
            </button>
          </div>

          <div className="border-t border-slate-100 py-2">
            <button
              onClick={handleLogout}
              className="w-full flex items-center space-x-3 px-4 py-3 text-left hover:bg-red-50 transition-colors group"
            >
              <svg className="w-5 h-5 text-slate-400 group-hover:text-red-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span className="text-sm font-medium text-slate-700 group-hover:text-red-600">Logout</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfileDropdown;

