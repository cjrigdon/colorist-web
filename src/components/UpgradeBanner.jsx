import React from 'react';
import { useNavigate } from 'react-router-dom';

const UpgradeBanner = ({ itemType = 'items' }) => {
  const navigate = useNavigate();

  return (
    <div className="bg-gradient-to-r from-pink-50 to-purple-50 border border-pink-200 rounded-lg p-4 mb-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="flex-shrink-0">
            <svg className="w-6 h-6 text-pink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-slate-800">Free Plan Limit Reached</h4>
            <p className="text-xs text-slate-600 mt-0.5">
              You've reached the limit of 5 {itemType} on the free plan. Upgrade to Premium for unlimited {itemType}.
            </p>
          </div>
        </div>
        <button
          onClick={() => navigate('/subscription')}
          className="px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors whitespace-nowrap"
          style={{ backgroundColor: '#ea3663' }}
          onMouseEnter={(e) => e.target.style.backgroundColor = '#d12a4f'}
          onMouseLeave={(e) => e.target.style.backgroundColor = '#ea3663'}
        >
          Upgrade
        </button>
      </div>
    </div>
  );
};

export default UpgradeBanner;

