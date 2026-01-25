import React from 'react';
import { useNavigate } from 'react-router-dom';
import PremiumFeaturesList from './PremiumFeaturesList';

const UpgradePrompt = ({ featureName = 'this feature' }) => {
  const navigate = useNavigate();

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
        <div className="mb-6">
          <div className="text-6xl mb-4">📔</div>
          <h2 className="text-3xl font-bold text-slate-800 mb-3 font-venti">Upgrade to Premium</h2>
          <p className="text-lg text-slate-600 mb-2">
            {featureName} is a premium feature available with a paid subscription.
          </p>
          <p className="text-slate-500 mb-6">
            Track your coloring journey, document your process, and reflect on your creative work with unlimited journal entries.
          </p>
        </div>

        <div className="bg-slate-50 rounded-xl border border-slate-200 p-6 mb-6">
          <h3 className="text-xl font-semibold text-slate-800 mb-4 font-venti">Premium Plan Benefits</h3>
          <div className="max-w-md mx-auto">
            <PremiumFeaturesList />
          </div>
          <div className="mt-4 pt-4 border-t border-slate-200">
            <div className="flex items-start max-w-md mx-auto">
              <svg className="w-5 h-5 text-green-600 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span className="text-sm text-slate-700">7-day free trial - cancel anytime</span>
            </div>
          </div>
        </div>

        <div className="mb-6">
          <div className="text-4xl font-bold text-slate-800 mb-1">$1.99<span className="text-lg font-normal text-slate-600">/month</span></div>
          <p className="text-sm text-slate-500">After your 7-day free trial</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => navigate('/subscription')}
            className="px-8 py-3 text-white rounded-lg font-medium transition-colors text-lg"
            style={{ backgroundColor: '#ea3663' }}
            onMouseEnter={(e) => e.target.style.backgroundColor = '#d12a4f'}
            onMouseLeave={(e) => e.target.style.backgroundColor = '#ea3663'}
          >
            Upgrade to Premium
          </button>
          <button
            onClick={() => navigate('/studio/overview')}
            className="px-8 py-3 text-slate-700 bg-slate-100 border border-slate-200 rounded-lg font-medium transition-colors hover:bg-slate-200 text-lg"
          >
            Explore Other Features
          </button>
        </div>
      </div>
    </div>
  );
};

export default UpgradePrompt;

