import React from 'react';
import { useNavigate } from 'react-router-dom';

const Profile = () => {
  const navigate = useNavigate();
  
  return (
    <div className="space-y-6">
      <div className="bg-white p-6">
        <div className="bg-slate-50 rounded-xl shadow-sm border border-slate-200 p-8">
          <div className="flex items-center space-x-6 mb-8">
            <div 
              className="h-24 w-24 rounded-full cursor-pointer hover:opacity-80 transition-opacity flex-shrink-0"
              style={{
                background: 'linear-gradient(to bottom right, #ea3663, #ff8e7e)'
              }}
            ></div>
            <div>
              <h1 className="text-2xl font-bold text-slate-800 font-venti mb-1">User Name</h1>
              <p className="text-slate-600">user@example.com</p>
              <p className="text-sm text-slate-500 mt-1">Member since January 2024</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">First Name</label>
              <input
                type="text"
                defaultValue="User"
                className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-offset-0 focus:border-transparent transition-all duration-200"
                style={{ focusRingColor: '#ea3663' }}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Last Name</label>
              <input
                type="text"
                defaultValue="Name"
                className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-offset-0 focus:border-transparent transition-all duration-200"
                style={{ focusRingColor: '#ea3663' }}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Email</label>
              <input
                type="email"
                defaultValue="user@example.com"
                className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-offset-0 focus:border-transparent transition-all duration-200"
                style={{ focusRingColor: '#ea3663' }}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Phone</label>
              <input
                type="tel"
                placeholder="+1 (555) 000-0000"
                className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-offset-0 focus:border-transparent transition-all duration-200"
                style={{ focusRingColor: '#ea3663' }}
              />
            </div>
          </div>

          <div className="mt-6">
            <label className="block text-sm font-medium text-slate-700 mb-2">Bio</label>
            <textarea
              rows={4}
              placeholder="Tell us about yourself..."
              className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-offset-0 focus:border-transparent transition-all duration-200 resize-none"
              style={{ focusRingColor: '#ea3663' }}
            ></textarea>
          </div>

          <div className="flex items-center justify-between mt-8">
            <button
              onClick={() => navigate('/subscription')}
              className="px-6 py-2.5 text-slate-700 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium hover:bg-white transition-colors"
            >
              Manage Subscription
            </button>
            <div className="flex items-center space-x-3">
              <button className="px-6 py-2.5 text-slate-700 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium hover:bg-white transition-colors">
                Cancel
              </button>
              <button 
                className="px-6 py-2.5 text-white rounded-xl text-sm font-medium transition-colors"
                style={{ backgroundColor: '#ea3663' }}
                onMouseEnter={(e) => e.target.style.backgroundColor = '#d12a4f'}
                onMouseLeave={(e) => e.target.style.backgroundColor = '#ea3663'}
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;

